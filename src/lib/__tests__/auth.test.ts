import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createHmac } from 'crypto'

// ---------------------------------------------------------------------------
// Mocks
//
// `auth.ts` reads/writes the session cookie via `next/headers`'s async
// `cookies()` and resolves the secret/password from `process.env`. We provide
// an in-memory cookie jar and pin the env vars so the tests are deterministic.
//
// `verifySessionToken` and `createSessionToken` are NOT exported — we exercise
// them through `login()` (which mints a token and writes it to the cookie)
// and `isAuthenticated()` (which reads the cookie and verifies the token).
// ---------------------------------------------------------------------------

const cookieStore: { [name: string]: string } = {}

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    set: (name: string, value: string) => {
      cookieStore[name] = value
    },
    get: (name: string) =>
      name in cookieStore ? { name, value: cookieStore[name] } : undefined,
    delete: (name: string) => {
      delete cookieStore[name]
    },
  })),
}))

import { login, logout, isAuthenticated } from '@/lib/auth'

const TEST_PASSWORD = 'correct-horse-battery-staple'
const TEST_SECRET = 'test-session-secret-with-at-least-32-chars!!'

describe('auth module', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Wipe the cookie jar between tests.
    for (const k of Object.keys(cookieStore)) delete cookieStore[k]
    vi.clearAllMocks()

    vi.stubEnv('NODE_ENV', 'development')
    process.env.ADMIN_PASSWORD = TEST_PASSWORD
    process.env.SESSION_SECRET = TEST_SECRET
    delete process.env.SESSION_EPOCH
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  // -------------------------------------------------------------------------
  // login()
  // -------------------------------------------------------------------------
  describe('login()', () => {
    it('returns true with the correct password', async () => {
      expect(await login(TEST_PASSWORD)).toBe(true)
    })

    it('returns false with a wrong password', async () => {
      expect(await login('nope')).toBe(false)
    })

    it('returns false with an empty password', async () => {
      expect(await login('')).toBe(false)
    })

    it('writes a session cookie on successful login', async () => {
      expect(await login(TEST_PASSWORD)).toBe(true)
      const token = cookieStore['lut_admin_session']
      expect(typeof token).toBe('string')
      expect(token).toContain('.')
    })
  })

  // -------------------------------------------------------------------------
  // verifySessionToken() — exercised through isAuthenticated()
  // -------------------------------------------------------------------------
  describe('verifySessionToken (via isAuthenticated)', () => {
    it('returns true for a freshly-minted valid token', async () => {
      await login(TEST_PASSWORD)
      expect(await isAuthenticated()).toBe(true)
    })

    it('returns false for an expired token (>7d old)', async () => {
      const expiredTs = Date.now() - (7 * 24 * 60 * 60 * 1000 + 60_000)
      const sig = createHmac('sha256', TEST_SECRET)
        .update(String(expiredTs))
        .digest('hex')
      cookieStore['lut_admin_session'] = `${expiredTs}.${sig}`
      expect(await isAuthenticated()).toBe(false)
    })

    it('returns false for a tampered signature', async () => {
      const ts = Date.now()
      cookieStore['lut_admin_session'] = `${ts}.deadbeefdeadbeefdeadbeef`
      expect(await isAuthenticated()).toBe(false)
    })

    it('returns false for a future-dated timestamp (>60s in the future)', async () => {
      const futureTs = Date.now() + 120_000
      const sig = createHmac('sha256', TEST_SECRET)
        .update(String(futureTs))
        .digest('hex')
      cookieStore['lut_admin_session'] = `${futureTs}.${sig}`
      expect(await isAuthenticated()).toBe(false)
    })

    it('returns false for a token issued before SESSION_EPOCH', async () => {
      // Set the epoch 1 minute in the future. A token minted now has
      // timestamp < epoch, so verifySessionToken must reject it.
      process.env.SESSION_EPOCH = String(Date.now() + 60_000)
      await login(TEST_PASSWORD) // mints a token with timestamp == now
      expect(await isAuthenticated()).toBe(false)
    })

    it('accepts a token issued after SESSION_EPOCH', async () => {
      // Epoch in the past — current tokens are still valid.
      process.env.SESSION_EPOCH = String(Date.now() - 60_000)
      await login(TEST_PASSWORD)
      expect(await isAuthenticated()).toBe(true)
    })

    it('returns false when no cookie is present', async () => {
      expect(await isAuthenticated()).toBe(false)
    })

    it('returns false for a malformed token (no dot)', async () => {
      cookieStore['lut_admin_session'] = 'not-a-token'
      expect(await isAuthenticated()).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // logout()
  // -------------------------------------------------------------------------
  describe('logout()', () => {
    it('is callable and clears the session cookie', async () => {
      await login(TEST_PASSWORD)
      expect(cookieStore['lut_admin_session']).toBeTruthy()

      await logout()
      expect(cookieStore['lut_admin_session']).toBe('')
    })
  })
})
