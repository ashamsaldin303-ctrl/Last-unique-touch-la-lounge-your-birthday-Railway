import { describe, it, expect } from 'vitest'
import { rateLimit } from '@/lib/rate-limiter'

// The rate limiter stores state in a module-level Map. To avoid cross-test
// interference we generate a unique key per test case.
function uniqueKey(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

describe('rateLimit', () => {
  it('allows the first N requests within the window', () => {
    const key = uniqueKey('allow')
    const max = 5

    for (let i = 0; i < max; i++) {
      const r = rateLimit(key, max, 60_000)
      expect(r.allowed).toBe(true)
    }
  })

  it('reports decreasing remaining count as requests are consumed', () => {
    const key = uniqueKey('remaining')
    const max = 3

    expect(rateLimit(key, max, 60_000).remaining).toBe(2)
    expect(rateLimit(key, max, 60_000).remaining).toBe(1)
    expect(rateLimit(key, max, 60_000).remaining).toBe(0)
  })

  it('blocks the (N+1)th request', () => {
    const key = uniqueKey('block')
    const max = 3

    for (let i = 0; i < max; i++) rateLimit(key, max, 60_000)
    const over = rateLimit(key, max, 60_000)

    expect(over.allowed).toBe(false)
    expect(over.remaining).toBe(0)
  })

  it('allows requests again after the window expires', async () => {
    const key = uniqueKey('expire')
    const windowMs = 50 // very short

    rateLimit(key, 1, windowMs)
    expect(rateLimit(key, 1, windowMs).allowed).toBe(false)

    // Wait for the window to lapse.
    await new Promise((r) => setTimeout(r, windowMs + 30))

    expect(rateLimit(key, 1, windowMs).allowed).toBe(true)
  })

  it('treats different keys independently', () => {
    const k1 = uniqueKey('k1')
    const k2 = uniqueKey('k2')

    rateLimit(k1, 1, 60_000) // exhaust k1
    expect(rateLimit(k1, 1, 60_000).allowed).toBe(false)

    // k2 has its own bucket — should still be allowed.
    expect(rateLimit(k2, 1, 60_000).allowed).toBe(true)
  })

  it('the `allowed` boolean reflects the rate-limited state', () => {
    const key = uniqueKey('bool')
    // First call: not yet limited.
    expect(rateLimit(key, 1, 60_000).allowed).toBe(true)
    // Second call within window: now limited.
    expect(rateLimit(key, 1, 60_000).allowed).toBe(false)
  })
})
