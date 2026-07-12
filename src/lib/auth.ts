import { cookies } from 'next/headers'
import { createHmac } from 'crypto'
import { safeEqualStrings } from '@/lib/crypto-utils'

// R1-A M1: use the `__Host-` cookie prefix in production for additional
// security. `__Host-` cookies MUST be:
//   - Secure (only sent over HTTPS)
//   - Path=/
//   - No Domain attribute
//   - SameSite (we use 'lax')
// Browsers reject any `__Host-` cookie that doesn't meet these requirements,
// so an XSS that tries to set a session cookie via document.cookie with a
// different path/domain cannot impersonate the admin session.
//
// In development (HTTP localhost), browsers will NOT set `__Host-` cookies
// (they require Secure, which requires HTTPS). So we only use the prefix in
// production and fall back to the plain name in dev.
const SESSION_COOKIE =
  process.env.NODE_ENV === 'production'
    ? '__Host-lut_admin_session'
    : 'lut_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// v28-g2-F1 Fix #1: Session revocation via SESSION_EPOCH.
//
// `verifySessionToken` issues tokens of the form `timestamp.HMAC(SECRET, timestamp)`.
// Previously a token remained valid for the full 7-day SESSION_MAX_AGE window
// regardless of any operator action — so a stolen cookie survived admin
// password rotation (changing ADMIN_PASSWORD does NOT invalidate the token,
// because the signature only depends on SESSION_SECRET). The only escape was
// rotating SESSION_SECRET, which kills every admin session at once.
//
// SESSION_EPOCH lets the operator invalidate all previously-issued tokens
// without rotating SESSION_SECRET. The verifier rejects any token whose
// embedded timestamp is older than SESSION_EPOCH (ms since epoch). Bumping
// SESSION_EPOCH (e.g. after a password change, suspected cookie theft, or
// routine hygiene) instantly revokes all outstanding sessions while leaving
// the SECRET untouched. Tokens minted after the bump carry a fresh timestamp
// and remain valid.
//
// The value is read on EVERY verification (not cached at module load) so a
// runtime env update takes effect on the next request without a restart.
// Default of 0 means "no epoch enforced" (preserves existing behavior for
// deployments that haven't configured it).
function getSessionEpoch(): number {
  const raw = process.env.SESSION_EPOCH
  if (!raw) return 0
  const parsed = parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

// Dev-only secret. Used ONLY when SESSION_SECRET is not set and NODE_ENV !== 'production'.
// In production, a missing SESSION_SECRET causes the module to throw at load time.
const DEV_ONLY_SESSION_SECRET = 'dev-insecure-session-secret-do-not-use-in-prod'

/**
 * Resolve the session secret used to sign/verify admin session tokens.
 *
 * - Production: SESSION_SECRET MUST be set, otherwise we throw (fail-closed).
 * - Development: SESSION_SECRET is preferred; if absent, fall back to a
 *   dev-only secret and emit a loud warning.
 */
function getSessionSecret(): string {
  const isProduction = process.env.NODE_ENV === 'production'
  const envSecret = process.env.SESSION_SECRET

  if (envSecret && envSecret.length >= 32) {
    return envSecret
  }

  if (isProduction) {
    throw new Error(
      'SESSION_SECRET must be set to a string of at least 32 characters in production.'
    )
  }

  // Development fallback
  if (!envSecret) {
    console.warn(
      '[auth] WARNING: SESSION_SECRET is not set. Using dev-only insecure secret. ' +
        'Do NOT use in production. Set SESSION_SECRET in your environment.'
    )
    return DEV_ONLY_SESSION_SECRET
  }

  // envSecret provided but too short in dev — warn but allow.
  console.warn(
    `[auth] WARNING: SESSION_SECRET is shorter than 32 chars (got ${envSecret.length}). ` +
      'This is acceptable in development only.'
  )
  return envSecret
}

/**
 * Resolve the configured admin password.
 *
 * - Production: ADMIN_PASSWORD MUST be set, otherwise we throw (fail-closed).
 * - Development: ADMIN_PASSWORD is preferred; if absent, fall back to a
 *   dev-only password ("dev") and emit a loud warning.
 */
function getAdminPassword(): string {
  const isProduction = process.env.NODE_ENV === 'production'
  const envPassword = process.env.ADMIN_PASSWORD

  if (envPassword) {
    return envPassword
  }

  if (isProduction) {
    throw new Error('ADMIN_PASSWORD must be set in production.')
  }

  console.warn(
    '[auth] WARNING: ADMIN_PASSWORD is not set. Using dev-only password "dev". ' +
      'Do NOT use in production. Set ADMIN_PASSWORD in your environment.'
  )
  return 'dev'
}

function createSessionToken(): string {
  const secret = getSessionSecret()
  const timestamp = Date.now().toString()
  const signature = createHmac('sha256', secret).update(timestamp).digest('hex')
  return `${timestamp}.${signature}`
}

function verifySessionToken(token: string): boolean {
  if (!token || !token.includes('.')) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [timestamp, signature] = parts

  let secret: string
  try {
    secret = getSessionSecret()
  } catch {
    // If the secret cannot be resolved (e.g. misconfigured production env),
    // fail closed — no token is considered valid.
    return false
  }

  const expectedSignature = createHmac('sha256', secret).update(timestamp).digest('hex')

  // Constant-time comparison of the signature.
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
  if (age > SESSION_MAX_AGE * 1000) return false
  // V14: reject future timestamps (mirror proxy.ts guard)
  if (age < -60_000) return false

  // v28-g2-F1 Fix #1: SESSION_EPOCH revocation. Reject any token issued
  // before the configured epoch. This lets the operator invalidate ALL
  // outstanding sessions (e.g. after a password rotation) by bumping the
  // env var — without rotating SESSION_SECRET and without waiting for the
  // 7-day TTL to expire.
  const sessionEpoch = getSessionEpoch()
  if (sessionEpoch > 0 && timestampNum < sessionEpoch) return false

  return true
}

export async function login(password: string): Promise<boolean> {
  const isProduction = process.env.NODE_ENV === 'production'

  let adminPassword: string
  try {
    adminPassword = getAdminPassword()
  } catch {
    // Fail closed in production if ADMIN_PASSWORD is not set.
    return false
  }

  // Constant-time password comparison.
  if (!safeEqualStrings(password, adminPassword)) return false

  // V13 Group B: Wrap cookie creation in try/catch so a cookie-setting
  // failure (e.g. in edge/preview environments where cookies() may throw)
  // returns false instead of crashing the server action.
  try {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, createSessionToken(), {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })
    return true
  } catch (error) {
    console.error('[auth] Failed to create session:', error)
    return false
  }
}

export async function logout(): Promise<void> {
  try {
    const cookieStore = await cookies()
    // R2-A-1: cookieStore.delete() with a plain name omits the Secure flag
    // on the resulting Set-Cookie header. For `__Host-` prefixed cookies
    // (production), browsers REJECT any Set-Cookie without Secure — including
    // deletions — so the cookie would never be cleared. Use an explicit
    // set() with maxAge: 0 and the full attribute set so the deletion
    // satisfies the __Host- requirements.
    const isProduction = process.env.NODE_ENV === 'production'
    cookieStore.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
  } catch (error) {
    console.error('[auth] Failed to delete session cookie:', error)
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return false
  return verifySessionToken(token)
}

/**
 * Redirects to login if not authenticated.
 * Use in Server Components.
 *
 * R2-B-1: uses `@/i18n/routing`'s `redirect` (not `next/navigation`) so the
 * locale prefix is preserved. With `routing.localeDetection: false`, a bare
 * `/admin/login` may 404 or trigger a proxy re-resolve. next-intl v4's
 * redirect requires the `{ href, locale }` object format.
 */
export async function requireAuth(): Promise<void> {
  const authed = await isAuthenticated()
  if (!authed) {
    const { redirect } = await import('@/i18n/routing')
    const { getLocale } = await import('next-intl/server')
    const locale = await getLocale()
    redirect({ href: '/admin/login', locale })
  }
}
