import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

//
// Moving admin auth into the proxy (formerly middleware) closes the SSR auth
// bypass: in Next.js 16 the page component can begin rendering in parallel
// with the layout, so a redirect issued from `requireAuth()` in the layout
// becomes an RSC instruction that may still leak HTML. The proxy runs BEFORE
// any rendering, so an unauthenticated request never reaches the React tree.
//
// `crypto` module so the proxy is Edge Runtime compatible. The cookie format
// is `timestamp.signature` where signature = HMAC-SHA256(SESSION_SECRET,
// timestamp).

// R1-A M1: use the `__Host-` cookie prefix in production. Must match
// `SESSION_COOKIE` in src/lib/auth.ts exactly. In dev we use the plain
// name because `__Host-` cookies require Secure, which requires HTTPS
// (browsers will not set them on http://localhost).
const SESSION_COOKIE =
  process.env.NODE_ENV === 'production'
    ? '__Host-lut_admin_session'
    : 'lut_admin_session'
const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 7 * 1000 // 7 days (matches auth.ts)
const DEV_ONLY_SESSION_SECRET = 'dev-insecure-session-secret-do-not-use-in-prod'

function getSessionSecret(): string | null {
  const isProduction = process.env.NODE_ENV === 'production'
  const envSecret = process.env.SESSION_SECRET

  if (envSecret && envSecret.length >= 32) {
    return envSecret
  }

  if (isProduction) {
    // Fail closed — no secret means no token is valid.
    console.error('[proxy] FATAL: SESSION_SECRET not set in production')
    return null
  }

  // Dev fallback (with warning)
  if (!envSecret) {
    console.warn(
      '[proxy] WARNING: SESSION_SECRET not set. Using dev-only secret.'
    )
    return DEV_ONLY_SESSION_SECRET
  }

  // envSecret provided but too short in dev — warn but allow.
  console.warn(
    `[proxy] WARNING: SESSION_SECRET shorter than 32 chars (got ${envSecret.length}).`
  )
  return envSecret
}

/**
 * Constant-time string comparison (V11 Fix #9 — Edge Runtime compatible).
 * Does NOT use Node.js `crypto.timingSafeEqual` (not available on Edge).
 * Instead, manually XORs each char code — the result is 0 iff all bytes
 * match, and the loop always iterates over the longer string so timing
 * doesn't leak the length.
 */
function safeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still iterate to keep timing roughly constant. Accumulate into a
    // variable (not `void`) so the JIT can't elide the XOR as dead code.
    const maxLen = Math.max(a.length, b.length)
    let dummy = 0
    for (let i = 0; i < maxLen; i++) {
      dummy |= a.charCodeAt(i % a.length) ^ b.charCodeAt(i % b.length)
    }
    // Use the dummy so it's not optimized away
    if (dummy === -1) return true // never true — just prevents elision
    return false
  }
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Compute HMAC-SHA256(secret, data) as a hex string using the Web Crypto
 * API (V11 Fix #9 — Edge Runtime compatible). Does NOT use Node.js
 * `crypto.createHmac`.
 */
async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  // Convert ArrayBuffer to hex string.
  const bytes = new Uint8Array(signature)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

/**
 * Verify the admin session cookie value (`timestamp.signature`).
 * Returns true iff the signature is valid AND the token has not expired.
 *
 * async because Web Crypto API is async (returns Promises).
 */
async function verifySessionCookie(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue || !cookieValue.includes('.')) return false
  const parts = cookieValue.split('.')
  if (parts.length !== 2) return false
  const [timestamp, signature] = parts

  const secret = getSessionSecret()
  if (!secret) return false

  const expectedSignature = await hmacSha256Hex(secret, timestamp)

  let sigMatch = false
  try {
    sigMatch = safeEqualStrings(signature, expectedSignature)
  } catch {
    return false
  }
  if (!sigMatch) return false

  const timestampNum = parseInt(timestamp, 10)
  if (isNaN(timestampNum)) return false

  const age = Date.now() - timestampNum
  if (age > SESSION_MAX_AGE_MS) return false
  // Tokens from the future are also invalid (clock skew / tampering).
  if (age < -60_000) return false

  // G3-1: SESSION_EPOCH revocation — reject tokens issued before the epoch.
  // Mirrors the check in auth.ts:verifySessionToken(). Without this, a stolen
  // pre-epoch cookie passes the proxy gate → attacker can READ admin dashboard
  // data (customer PII) even after the admin bumps SESSION_EPOCH.
  const sessionEpoch = parseInt(process.env.SESSION_EPOCH || '0', 10)
  if (sessionEpoch > 0 && timestampNum < sessionEpoch) return false

  return true
}

/**
 * Wraps next-intl's middleware so we can additionally enforce admin auth
 *  — redirect unauthenticated /admin/* requests to /admin/login
 * BEFORE any SSR rendering.
 *
 * FIX-4B / R3-B-2 / R3-B-3: Removed `checkProductExists()` self-fetch (50-200ms
 * TTFB per product page), `slugCache` Map, `buildNotFoundResponse()`, and the
 * `x-pathname` response header (dead code — no component reads it). The
 * product page's `dynamicParams = false` (products/[slug]/page.tsx:33) already
 * returns a real HTTP 404 at the routing level for unknown slugs, making the
 * middleware check redundant. The client-side `BrandThemeSetter` sets
 * `data-brand` on <html> on hydration and every navigation — no SSR header
 * needed.
 */
export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Protect every /admin/* route EXCEPT the login page itself. Both
  // `/(dashboard)/...` and `/login` live under `/[locale]/admin/`, so we
  // match on the `/admin/` segment regardless of locale prefix.
  // V13 Group D11: use precise path-segment matching instead of loose includes.
  // `includes('/admin')` matched false positives like `/blog/admin-tips`.
  const isAdminPath = /^\/(ar|en)\/admin(\/|$)/.test(pathname)
  const isAdminLogin = /^\/(ar|en)\/admin\/login(\/|$)/.test(pathname)
  if (isAdminPath && !isAdminLogin) {
    const session = request.cookies.get(SESSION_COOKIE)?.value
    if (!await verifySessionCookie(session)) {
      // Build the localized login URL preserving the current locale.
      const localeMatch = pathname.match(/^\/(ar|en)\//)
      const locale = localeMatch ? localeMatch[1] : 'ar'
      const loginUrl = new URL(`/${locale}/admin/login`, request.url)
      // 307 preserves the method (GET) — important if the user later
      // POSTs a form after re-authenticating.
      return NextResponse.redirect(loginUrl, 307)
    }
  }

  return intlMiddleware(request)
}

export const config = {
  // Match everything except:
  // - API routes (`/api/...`)
  // - Next.js internals (`/_next/...`, `/_vercel/...`)
  // - Files with extensions (static assets, favicons, etc.)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
