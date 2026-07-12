import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { checkProductAvailability } from '@/lib/products'
import { rateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/get-client-ip'

const schema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // --- Rate limit (30/min/IP) — R1-A M5 ---
  // Without a limit this endpoint can be hammered to DoS the DB (each call
  // runs `db.booking.findMany` over a date range). 30/min matches the
  // check-slug limit and is generous for legitimate PDP availability
  // checks (one call per date-range selection).
  const ip = getClientIp(req)
  const rl = rateLimit(`availability:${ip}`, 30, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfter: 60 },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    const { id } = await params
    const url = new URL(req.url)
    const startDateStr = url.searchParams.get('startDate')
    const endDateStr = url.searchParams.get('endDate')

    const parsed = schema.safeParse({
      startDate: startDateStr,
      endDate: endDateStr,
    })

    if (!parsed.success) {
      // R1-A M9: do NOT disclose Zod issue details to the client (schema
      // disclosure). Log them server-side for debugging instead.
      console.warn('[api/availability] Validation failed:', parsed.error.issues)
      return NextResponse.json(
        { error: 'invalid_dates' },
        { status: 400 }
      )
    }

    // V9 Fix #2: scope by brand='LUT' so a client cannot probe availability
    // for a La Lounge / Your Birthday product through the LUT storefront API.
    //
    // PERF (V14): collapsed the previous 2 product queries (findFirst for
    // brand verification + findUnique for stock) into a single findFirst
    // that selects both `id` AND `stock`. The stock value is passed through
    // to `checkProductAvailability` via the new `productStock` param so the
    // availability check only issues ONE more query (the booking sum).
    const product = await db.product.findFirst({
      where: { id, brand: 'LUT', isActive: true },
      select: { id: true, stock: true },
    })
    if (!product) {
      return NextResponse.json({ error: 'product_not_found' }, { status: 404 })
    }

    const startDate = new Date(parsed.data.startDate)
    const endDate = new Date(parsed.data.endDate)

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'invalid_range', message: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // V9 Fix #4: stock-aware availability. The result now includes
    // `availableStock` so the PDP can show "5 of 10 available" instead
    // of a binary available/unavailable.
    //
    // PERF (V14): pass `product.stock` so the helper skips its internal
    // `db.product.findUnique` — saving one round-trip per request.
    const result = await checkProductAvailability(
      id,
      startDate,
      endDate,
      1,
      product.stock
    )

    return NextResponse.json({
      available: result.available,
      conflictingBookings: result.conflictingBookings,
      availableStock: result.availableStock,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error'
    console.error('Availability check error:', message)
    return NextResponse.json(
      { error: 'internal_error' },
      { status: 500 }
    )
  }
}
