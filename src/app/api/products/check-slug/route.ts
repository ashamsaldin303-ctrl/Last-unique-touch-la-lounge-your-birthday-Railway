import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/get-client-ip'

const schema = z.object({
  slug: z.string().min(1).max(200),
  brand: z.enum(['LUT', 'LA_LOUNGE', 'YOUR_BIRTHDAY']).default('LUT'),
})

/**
 * GET /api/products/check-slug?slug=xxx&brand=LUT
 *
 * Lightweight existence check used by the middleware  to
 * determine whether a product slug exists before the request reaches the
 * page component. The middleware calls this endpoint via `fetch` and
 * returns a 404 response directly if the product doesn't exist — this
 * closes the soft-404 gap where `notFound()` inside the page rendered
 * the 404 body but the standalone server sent a 200 status.
 *
 * Rate limited to 30 requests per minute per IP (R1-A M4) — without a
 * limit this endpoint is an enumeration oracle (attackers can brute-
 * force slugs to map the catalogue). 30/min is generous enough for the
 * middleware's own usage (one call per PDP navigation) while blocking
 * scripted enumeration.
 *
 * Returns:
 *   200 { exists: true }  — product exists and is active
 *   200 { exists: false } — product does not exist (or is inactive)
 *   400 { error: 'invalid_input' }  (Zod issues logged server-side, NOT disclosed)
 *   429 { error: 'rate_limited' }
 */
export async function GET(req: NextRequest) {
  // --- Rate limit (30/min/IP) — R1-A M4 ---
  const ip = getClientIp(req)
  const rl = rateLimit(`check-slug:${ip}`, 30, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfter: 60 },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  const url = new URL(req.url)
  const parsed = schema.safeParse({
    slug: url.searchParams.get('slug'),
    brand: url.searchParams.get('brand') ?? 'LUT',
  })

  if (!parsed.success) {
    // R1-A M9: do NOT disclose Zod issue details to the client (schema
    // disclosure). Log them server-side for debugging instead.
    console.warn('[api/check-slug] Validation failed:', parsed.error.issues)
    return NextResponse.json(
      { error: 'invalid_input' },
      { status: 400 }
    )
  }

  const { slug, brand } = parsed.data

  try {
    const product = await db.product.findFirst({
      where: { slug, brand, isActive: true },
      select: { id: true },
    })

    return NextResponse.json({ exists: !!product })
  } catch {
    // If the DB is unavailable, fail open (let the page handle it).
    // Returning `exists: true` means the middleware won't 404 the request,
    // and the page's own `getProductBySlug` + `notFound()` will handle it.
    console.error('[check-slug] DB query failed:')
    return NextResponse.json({ exists: true, error: 'db_unavailable' })
  }
}
