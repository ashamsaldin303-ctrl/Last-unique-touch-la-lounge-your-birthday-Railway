import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/get-client-ip'

// security/data-fix #5: KWD (Kuwaiti Dinar) uses 3 decimal places, so the
// smallest unit is 1 fil = 0.001 KWD. Server-side price/deposit/total
// re-computation can legitimately differ from the client-supplied value by
// floating-point rounding noise below 1 fil; comparisons must allow that
// tolerance rather than doing exact `===` checks (which would reject
// otherwise-valid orders due to JS float arithmetic).
const KWD_TOLERANCE = 0.001 // 1 fil precision for KWD (3 decimal places)

const itemSchema = z.object({
  // R3-C-2: defense-in-depth upper bounds on every string/number field.
  // The server re-validates prices/days/total inside the Serializable tx
  // (KWD_TOLERANCE check below), but bounding the schema rejects absurd
  // payloads early and prevents DoS amplification from megabyte-long
  // strings (admin schemas cap the same fields at the same values).
  productId: z.string().min(1).max(100),
  slug: z.string().min(1).max(200),
  nameAr: z.string().max(200),
  nameEn: z.string().max(200),
  image: z.string().max(500),
  rentalPricePerDay: z.number().positive().max(100000),
  securityDeposit: z.number().nonnegative().max(100000),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  // R2-A-14: cap quantity at 100 (was 10000 — absurdly permissive). A
  // single rental order with >100 units of one product is unreasonable,
  // and the higher the cap, the larger the DoS amplifier: each request
  // loops through stock checks inside a Serializable transaction, and
  // 10000-item requests would sum every overlapping booking 10000 times.
  quantity: z.number().int().positive().max(100),
  // R3-C-2: max 1-year rental (365 days) — defense-in-depth; the server
  // recomputes `days` from startDate/endDate and rejects mismatches, but
  // bounding the client-supplied value rejects absurd payloads early.
  days: z.number().int().positive().max(365),
  // R3-C-2: max 10M KWD total — well above any realistic rental order
  // (50 items × 100 qty × 100000/day × 365 days ≈ 183M, but the server
  // recompute enforces the real ceiling). Bounds the client payload only.
  total: z.number().positive().max(10000000),
})

const customerSchema = z.object({
  customerName: z.string().min(3).max(100),
  customerPhone: z.string().regex(/^\+?[0-9\s-]{8,20}$/),
  // v28-g2-F2 Fix 3: cap email length (.max(200)) — defense-in-depth so a
  // megabyte-long local-part cannot pass validation. SQLite doesn't enforce
  // VARCHAR length, so without this the only cap is the .email() regex.
  customerEmail: z.string().email().max(200),
  address: z.string().min(10).max(500),
  city: z.string().min(2).max(50),
  notes: z.string().max(1000).optional(),
})

const orderSchema = z.object({
  // FIX-1C Fix 6: cap the items array at 50 to prevent DoS via huge
  // payloads (R1-A M3). Inside the Serializable transaction the route
  // issues ~4 queries per item (findMany + findFirst + stock check +
  // booking.create), so 10k items = ~40k queries inside one tx,
  // blocking SQLite writes globally. 50 is well above any realistic
  // rental cart (cart UI shows a single checkout with maybe 5-10
  // distinct products) while keeping a sane upper bound.
  items: z.array(itemSchema).min(1).max(50),
  customer: customerSchema,
  idempotencyKey: z.string().min(10).max(255),
})

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0]

/**
 * Stock-aware availability check (V9 Fix #4).
 *
 * Previously this function returned `true` only when ZERO overlapping
 * CONFIRMED/PENDING bookings existed — which made products with stock>1
 * effectively unusable (the @@unique constraint also blocked this at the
 * DB level, but that constraint has been removed in the V9 migration).
 *
 * Now we sum the `quantity` of all overlapping active bookings and
 * compare against `product.stock`. The check runs inside the Serializable
 * transaction so concurrent orders cannot both pass the check.
 *
 * Returns `{ available, availableStock }` so the caller can include the
 * remaining stock in the error response for better UX.
 */
async function checkStockAvailabilityInTx(
  tx: TxClient,
  productId: string,
  startDate: Date,
  endDate: Date,
  requestedQuantity: number,
  productStock: number
): Promise<{ available: boolean; availableStock: number }> {
  // Fetch all overlapping CONFIRMED/PENDING bookings and sum their quantities.
  // We use findMany (not aggregate) because Prisma's SQLite aggregate sum
  // returns null on an empty set, which is awkward to handle.
  const overlappingBookings = await tx.booking.findMany({
    where: {
      productId,
      status: { in: ['CONFIRMED', 'PENDING'] },
      // Overlap condition: existing booking (s, e) overlaps with (startDate, endDate)
      // if startDate < e AND endDate > s
      AND: [
        { startDate: { lt: endDate } },
        { endDate: { gt: startDate } },
      ],
    },
    select: { quantity: true },
  })

  const totalBookedQuantity = overlappingBookings.reduce(
    (sum, b) => sum + (b.quantity ?? 1),
    0
  )
  const availableStock = Math.max(0, productStock - totalBookedQuantity)

  return {
    available: availableStock >= requestedQuantity,
    availableStock,
  }
}

export async function POST(req: NextRequest) {
  // --- Rate limit (10/min/IP) — D5 ---
  // security/data-fix #8: IP resolution now uses the shared `getClientIp`
  // helper (`@/lib/get-client-ip`). Same logic — take the LAST entry of
  // x-forwarded-for (the IP set by the trusted reverse proxy) and fall back
  // to x-real-ip / 'unknown' — but extracted to one place so all rate-
  // limited routes agree on what "the caller's IP" means.
  const ip = getClientIp(req)
  const rl = rateLimit(`orders:${ip}`, 10, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfter: 60 },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    // --- Parse body defensively (D2): invalid JSON -> 400, not 500 ---
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'invalid_json' },
        { status: 400 }
      )
    }

    const parsed = orderSchema.safeParse(body)

    if (!parsed.success) {
      // R1-A M9: do NOT disclose Zod issue details to the client (schema
      // disclosure). Log them server-side for debugging instead.
      console.warn('[api/orders] Validation failed:', parsed.error.issues)
      return NextResponse.json(
        { error: 'invalid_input' },
        { status: 400 }
      )
    }

    const { items, customer, idempotencyKey } = parsed.data

    // R2-A-4: namespace the idempotency key with a route prefix so an
    // /api/orders key can never collide with keys from /api/bookings/birthday
    // or the payment webhooks (which share the same UNIQUE IdempotencyKey.key
    // column). Without this prefix, an attacker could submit /api/orders
    // with a chosen idempotencyKey that later collides with a booking cuid
    // used by payment-success, silently suppressing the payment confirmation.
    const namespacedKey = `orders:${idempotencyKey}`

    // 1. Cheap pre-check: do all products exist + belong to LUT?
    //    (V9 Fix #2: brand='LUT' filter). The authoritative idempotency +
    //    stock checks happen INSIDE the transaction below (V9 Fix #5).
    const productIds = items.map((i) => i.productId)
    const dbProducts = await db.product.findMany({
      where: { id: { in: productIds }, brand: 'LUT', isActive: true },
    })

    if (dbProducts.length !== items.length) {
      return NextResponse.json(
        { error: 'invalid_products' },
        { status: 400 }
      )
    }

    // 2. Re-check idempotency + stock + price INSIDE a Serializable
    //    transaction (V9 Fix #4 + #5).
    //
    //    V9 Fix #5: the idempotency check is now a `create` on the
    //    IdempotencyKey table with a UNIQUE constraint on `key`. If two
    //    concurrent requests send the same key, the second one's create
    //    throws P2002 — which we catch and return 409 duplicate_request.
    //    This closes the TOCTOU race that existed when the check was a
    //    `findFirst` outside the transaction.
    //
    //    V9 Fix #4: the availability check is now stock-aware — it sums
    //    the `quantity` of overlapping bookings and compares against
    //    `product.stock`, so products with stock>1 can be booked multiple
    //    times for overlapping dates.
    let result: Array<{ id: string }>
    try {
      result = await db.$transaction(
        async (tx) => {
          // --- Idempotency: create the key FIRST (V9 Fix #5) ---
          // If this throws P2002, the key already exists — a concurrent
          // duplicate request won the race. We catch that outside the tx.
          const idempotencyRecord = await tx.idempotencyKey.create({
            data: {
              key: namespacedKey,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
            },
          })

          // Re-fetch products inside the tx for an authoritative stock check.
          // V9 Fix #2: brand='LUT' filter prevents cross-tenant booking.
          const txProducts = await tx.product.findMany({
            where: { id: { in: productIds }, brand: 'LUT', isActive: true },
          })

          if (txProducts.length !== items.length) {
            throw new OrderError('invalid_products', 400)
          }

          // Verify price, stock, and availability for each item inside the tx.
          for (const item of items) {
            const product = txProducts.find((p) => p.id === item.productId)
            if (!product) {
              throw new OrderError('invalid_products', 400)
            }

            // Verify price matches DB
            if (Math.abs(product.rentalPricePerDay - item.rentalPricePerDay) > KWD_TOLERANCE) {
              throw new OrderError('price_mismatch', 400)
            }

            // Verify securityDeposit matches DB (P0.2 — pricing integrity)
            if (Math.abs(product.securityDeposit - item.securityDeposit) > KWD_TOLERANCE) {
              throw new OrderError('price_mismatch', 400)
            }

            // Compute days server-side from startDate + endDate (P0.2).
            const startDate = new Date(item.startDate)
            const endDate = new Date(item.endDate)
            if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
              throw new OrderError('invalid_dates', 400)
            }
            const msPerDay = 1000 * 60 * 60 * 24
            const calculatedDays = Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay)
            if (calculatedDays <= 0) {
              throw new OrderError('invalid_dates', 400)
            }
            if (item.days !== calculatedDays) {
              throw new OrderError('days_mismatch', 400)
            }

            // Recompute total server-side (P0.2): rental × days × qty + deposit × qty.
            const expectedTotal =
              product.rentalPricePerDay * calculatedDays * item.quantity +
              product.securityDeposit * item.quantity
            if (Math.abs(expectedTotal - item.total) > KWD_TOLERANCE) {
              throw new OrderError('total_mismatch', 400)
            }

            // --- Stock-aware availability check (V9 Fix #4) ---
            // Sum the quantity of all overlapping CONFIRMED/PENDING bookings
            // and compare against product.stock. This replaces the old
            // "any overlap = unavailable" check that blocked stock>1 rentals.
            const { available, availableStock } = await checkStockAvailabilityInTx(
              tx,
              item.productId,
              startDate,
              endDate,
              item.quantity,
              product.stock
            )

            if (!available) {
              throw new OrderError(
                'out_of_stock',
                409,
                `Requested ${item.quantity} but only ${availableStock} available`
              )
            }
          }

          // Create bookings inside the same tx (C5).
          const bookings = []
          for (const item of items) {
            const startDate = new Date(item.startDate)
            const endDate = new Date(item.endDate)
            const msPerDay = 1000 * 60 * 60 * 24
            const calculatedDays = Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay)
            // Use the server-recomputed total (P0.2) — never trust client-supplied item.total.
            // V13 Group D2: replace non-null assertions with a guarded local variable.
            const p = txProducts.find((pr) => pr.id === item.productId)
            if (!p) throw new OrderError('invalid_products', 400)
            const expectedTotal =
              p.rentalPricePerDay * calculatedDays * item.quantity +
              p.securityDeposit * item.quantity

            const booking = await tx.booking.create({
              data: {
                productId: item.productId,
                brand: p.brand,
                startDate,
                endDate,
                status: 'PENDING',
                customerName: customer.customerName,
                customerPhone: customer.customerPhone,
                customerEmail: customer.customerEmail,
                // V9 Fix #4: store the requested quantity on the booking so
                // the stock-aware availability check above can sum it for
                // future overlapping bookings.
                quantity: item.quantity,
                totalAmount: expectedTotal,
                currency: 'KWD',
                address: customer.address,
                city: customer.city,
                notes: customer.notes ?? null,
              },
            })

            bookings.push(booking)
          }

          // --- Link the idempotency key to the resulting bookings (V9 Fix #5) ---
          // So a replay of the same key can return the original booking IDs
          // instead of a bare 409 (better UX for the client).
          await tx.idempotencyKey.update({
            where: { id: idempotencyRecord.id },
            data: { orderId: bookings[0]?.id ?? null },
          })

          // Also log to SecurityLog for audit (kept for backwards compat
          // with any tooling that reads the old log format).
          await tx.securityLog.create({
            data: {
              event: 'order_idempotency',
              details: JSON.stringify({
                idempotencyKey,
                bookingIds: bookings.map((b) => b.id),
              }),
            },
          })

          return bookings
        },
        { isolationLevel: 'Serializable' }
      )
    } catch (error: unknown) {
      // V9 Fix #5: P2002 on IdempotencyKey.key = concurrent duplicate.
      // Return 409 with the original booking IDs if we can recover them.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // The target of the unique violation. Prisma includes it in
        // `meta.target` for known errors.
        const target = (error.meta?.target as string[] | undefined)?.join(',') ?? ''
        if (target.includes('key')) {
          // IdempotencyKey.key collision — this is a duplicate request.
          // V10 Fix #11: enforce expiresAt — if the key has expired, allow
          // re-use by deleting the old key and retrying the transaction.
          const existing = await db.idempotencyKey.findUnique({
            where: { key: namespacedKey },
            select: { orderId: true, expiresAt: true },
          })
          if (existing) {
            // Check if the key has expired.
            if (existing.expiresAt < new Date()) {
              // Key expired — delete it so the client can retry with the
              // same key. This is an unusual path (24h retention) but we
              // handle it correctly rather than returning a stale 409.
              //
              // R2-B-3: use `deleteMany` (not `delete`) so a concurrent
              // request that already deleted the key between our
              // `findUnique` above and this call does NOT throw P2025
              // (record not found). `deleteMany` is idempotent — it
              // returns { count: 0|1 } instead of throwing on miss.
              await db.idempotencyKey.deleteMany({ where: { key: namespacedKey } })
              // Fall through to the generic P2002 handler — the client
              // should retry the request.
            } else if (existing.orderId) {
              // Key is still valid and has an orderId — return the
              // original booking(s) (idempotent success).
              //
              // v28-g2-F2 Fix 1: the IdempotencyKey.orderId column is
              // FK-constrained to Booking.id (migration
              // 20260708154153_add_idempotency_fk_and_indexes.sql:10),
              // so it can only hold ONE booking id. For a multi-item
              // order the original tx created N bookings (up to 50 per
              // the items schema) but only `bookings[0]?.id` was linked
              // here (line 333). The full list is recoverable from the
              // SecurityLog entry written in the same tx (lines 338-346),
              // which records `bookingIds: bookings.map(b => b.id)` in its
              // details JSON. We query that to reconstruct the array; if
              // the log is missing or unparseable we degrade gracefully
              // to the pre-fix single-booking response.
              let allBookingIds: string[] = [existing.orderId]
              try {
                const log = await db.securityLog.findFirst({
                  where: {
                    event: 'order_idempotency',
                    // Match the exact JSON substring produced by
                    // JSON.stringify({ idempotencyKey, ... }). Using
                    // JSON.stringify(idempotencyKey) on the search value
                    // ensures quotes/backslashes in the user-supplied key
                    // are escaped identically to how they appear in the
                    // stored details string.
                    details: {
                      contains: `"idempotencyKey":${JSON.stringify(idempotencyKey)}`,
                    },
                  },
                  orderBy: { createdAt: 'desc' },
                  select: { details: true },
                })
                if (log?.details) {
                  const parsed = JSON.parse(log.details) as {
                    bookingIds?: unknown
                  }
                  if (
                    Array.isArray(parsed?.bookingIds) &&
                    parsed.bookingIds.length > 0 &&
                    parsed.bookingIds.every(
                      (id) => typeof id === 'string'
                    )
                  ) {
                    allBookingIds = parsed.bookingIds as string[]
                  }
                }
              } catch {
                // SecurityLog missing or details unparseable — fall back
                // to the single orderId (no regression vs pre-fix).
              }
              return NextResponse.json(
                {
                  success: true,
                  orderId: allBookingIds[0],
                  bookingIds: allBookingIds,
                  totalBookings: allBookingIds.length,
                  message: 'duplicate_request',
                },
                { status: 200 }
              )
            }
          }
          // Key exists but has no orderId (or expired and was deleted) —
          // the original request may have failed mid-transaction. Tell the
          // client to retry with a new key.
          return NextResponse.json(
            { error: 'duplicate_request' },
            { status: 409 }
          )
        }
        // Any other P2002 (e.g. on Booking) — surface as a generic conflict.
        return NextResponse.json(
          { error: 'not_available' },
          { status: 409 }
        )
      }
      throw error
    }

    // 3. Return success with first booking ID as order reference
    const orderId = result[0]?.id

    return NextResponse.json(
      {
        success: true,
        orderId,
        bookingIds: result.map((b) => b.id),
        totalBookings: result.length,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    // Surface our typed OrderErrors with the appropriate HTTP status.
    if (error instanceof OrderError) {
      return NextResponse.json(
        { error: error.code, message: error.detail },
        { status: error.status }
      )
    }

    const message = error instanceof Error ? error.message : 'Internal error'
    // G1-A2 #6: log only the message, not the full Prisma error object (may contain PII)
    console.error('Order creation error:', message)
    return NextResponse.json(
      { error: 'internal_error' },
      { status: 500 }
    )
  }
}

/**
 * Internal error type used to bail out of the transaction with a
 * specific HTTP status code and error code.
 */
class OrderError extends Error {
  code: string
  status: number
  detail?: string
  constructor(code: string, status: number, detail?: string) {
    super(code)
    this.name = 'OrderError'
    this.code = code
    this.status = status
    this.detail = detail
  }
}
