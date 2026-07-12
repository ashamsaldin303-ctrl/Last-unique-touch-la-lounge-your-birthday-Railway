import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/get-client-ip'

/**
 * Birthday booking request schema.
 *
 * `eventDate` is the date the customer wants the party; we store it as
 * both `startDate` and `endDate` (single-day event) since the Booking
 * model requires a range. `notes` lets the customer add free-text context
 * (location, package, head count, etc.).
 */
const birthdaySchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[0-9\s-]{8,20}$/),
  // v28-g2-F2 Fix 3: cap email length (.max(200)) — defense-in-depth so a
  // megabyte-long local-part cannot pass validation. SQLite doesn't enforce
  // VARCHAR length, so without this the only cap is the .email() regex.
  email: z.string().email().max(200).optional().or(z.literal('')),
  // Fix #7: strict YYYY-MM-DD format to prevent Date parsing ambiguity.
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  notes: z.string().max(2000).optional().or(z.literal('')),
  // Fix #3: idempotency key so a retried POST doesn't double-book the
  // same birthday slot.
  idempotencyKey: z.string().min(10).max(255),
})

/**
 * POST /api/bookings/birthday
 *
 * Creates a Booking row with `brand: 'YOUR_BIRTHDAY'` and no productId
 * (birthday packages are not catalogue Products). Rate limited to 5
 * requests per minute per IP.
 */
export async function POST(req: NextRequest) {
  // --- Rate limit (5/min/IP) ---
  const ip = getClientIp(req)
  const rl = rateLimit(`birthday:${ip}`, 5, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfter: 60 },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  // --- Parse body defensively (D2) ---
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_json' },
      { status: 400 }
    )
  }

  const parsed = birthdaySchema.safeParse(body)
  if (!parsed.success) {
    // R2-A-2: do NOT disclose Zod issue details to the client (schema
    // disclosure — leaks field names, regex patterns, min/max lengths).
    // Log them server-side for debugging instead.
    console.warn('[api/bookings/birthday] Validation failed:', parsed.error.issues)
    return NextResponse.json(
      { error: 'invalid_input' },
      { status: 400 }
    )
  }

  const { name, phone, email, eventDate, notes, idempotencyKey } = parsed.data

  // R2-A-4: namespace the idempotency key with a route prefix so a
  // birthday booking key can never collide with keys from /api/orders
  // or the payment webhooks (which share the same UNIQUE IdempotencyKey.key
  // column). Without this prefix, an attacker could pre-seed a key that
  // later suppresses a legitimate payment-success webhook.
  const namespacedKey = `birthday:${idempotencyKey}`

  // Normalise the event date: the user supplies a calendar date (e.g.
  // "2026-08-14"); we store it as a Date, using the start of that day
  // for both startDate and endDate (single-day booking).
  const start = new Date(`${eventDate}T00:00:00.000Z`)
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json(
      { error: 'invalid_event_date' },
      { status: 400 }
    )
  }

  // Fix #7: roundtrip check — the parsed Date's UTC date components must
  // match the input string. This rejects values like "2026-13-40" which
  // `new Date(...)` would happily roll over into the next valid month.
  const [yStr, mStr, dStr] = eventDate.split('-')
  if (
    start.getUTCFullYear() !== Number(yStr) ||
    start.getUTCMonth() + 1 !== Number(mStr) ||
    start.getUTCDate() !== Number(dStr)
  ) {
    return NextResponse.json(
      { error: 'invalid_event_date' },
      { status: 400 }
    )
  }

  // Fix #7: range check — the event must be today or later, and no more
  // than 18 months in the future (prevents absurd dates / date-flood DoS).
  const todayUtcMidnight = new Date()
  todayUtcMidnight.setUTCHours(0, 0, 0, 0)
  const maxFuture = new Date(todayUtcMidnight.getTime() + 18 * 30 * 24 * 60 * 60 * 1000)
  if (start < todayUtcMidnight || start > maxFuture) {
    return NextResponse.json(
      { error: 'event_date_out_of_range' },
      { status: 400 }
    )
  }

  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)

  try {
    // Fix #3: idempotency — create the IdempotencyKey row INSIDE a
    // Serializable transaction before creating the Booking. On P2002
    // (duplicate key) we return the original booking id (idempotent
    // success) or 409. Mirrors /api/orders/route.ts.
    try {
      const booking = await db.$transaction(
        async (tx) => {
          // --- Idempotency: create the key FIRST (Fix #3) ---
          const idempotencyRecord = await tx.idempotencyKey.create({
            data: {
              key: namespacedKey,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
            },
          })

          const created = await tx.booking.create({
            data: {
              brand: 'YOUR_BIRTHDAY',
              productId: null,
              startDate: start,
              endDate: end,
              status: 'PENDING',
              customerName: name,
              customerPhone: phone,
              customerEmail: email || '',
              totalAmount: 0,
              currency: 'KWD',
              notes: notes
                ? `Date: ${eventDate} | Notes: ${notes}`
                : `Date: ${eventDate}`,
            },
          })

          // Link the idempotency key to the resulting booking so a replay
          // can return the original booking id.
          await tx.idempotencyKey.update({
            where: { id: idempotencyRecord.id },
            data: { orderId: created.id },
          })

          return created
        },
        { isolationLevel: 'Serializable' }
      )

      return NextResponse.json(
        { success: true, bookingId: booking.id },
        { status: 201 }
      )
    } catch (error: unknown) {
      // P2002 on IdempotencyKey.key = concurrent duplicate request.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = (error.meta?.target as string[] | undefined)?.join(',') ?? ''
        if (target.includes('key')) {
          const existing = await db.idempotencyKey.findUnique({
            where: { key: namespacedKey },
            select: { orderId: true, expiresAt: true },
          })
          if (existing) {
            if (existing.expiresAt < new Date()) {
              // Expired key — delete so the client can retry.
              //
              // R2-B-3: use `deleteMany` (not `delete`) so a concurrent
              // request that already deleted the key between our
              // `findUnique` above and this call does NOT throw P2025
              // (record not found). `deleteMany` is idempotent.
              await db.idempotencyKey.deleteMany({ where: { key: namespacedKey } })
              return NextResponse.json(
                { error: 'duplicate_request' },
                { status: 409 }
              )
            }
            if (existing.orderId) {
              // Idempotent success — return the original booking id.
              return NextResponse.json(
                {
                  success: true,
                  bookingId: existing.orderId,
                  message: 'duplicate_request',
                },
                { status: 200 }
              )
            }
          }
          return NextResponse.json(
            { error: 'duplicate_request' },
            { status: 409 }
          )
        }
      }
      throw error
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error'
    console.error('Birthday booking creation error:', message)
    return NextResponse.json(
      { error: 'internal_error' },
      { status: 500 }
    )
  }
}
