import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mocks
//
// The contact route collaborates with:
//   1. `@/lib/db`              — `contactMessage.create` + `securityLog.create`
//   2. `@/lib/rate-limiter`    — `rateLimit(key, 3, 60_000)` per IP
//   3. `@/lib/get-client-ip`   — extracts the caller's IP for the rate key
//   4. `@/lib/n8n`             — `validateWebhookUrl` for the fire-and-forget
//                               n8n fan-out (we DON'T mock this — the route
//                               never awaits the fetch and N8N_WEBHOOK_URL is
//                               unset in tests, so the helper returns early).
//
// `vi.hoisted` is used so the mock functions exist by the time the (hoisted)
// `vi.mock` factories run.
// ---------------------------------------------------------------------------

const {
  contactMessageCreateMock,
  securityLogCreateMock,
  rateLimitMock,
  getClientIpMock,
} = vi.hoisted(() => ({
  contactMessageCreateMock: vi.fn(),
  securityLogCreateMock: vi.fn(),
  rateLimitMock: vi.fn(),
  getClientIpMock: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    contactMessage: { create: contactMessageCreateMock },
    securityLog: { create: securityLogCreateMock },
  },
}))

vi.mock('@/lib/rate-limiter', () => ({
  rateLimit: rateLimitMock,
}))

vi.mock('@/lib/get-client-ip', () => ({
  getClientIp: getClientIpMock,
}))

import { POST } from '@/app/api/contact/route'

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validPayload = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '+96512345678',
  subject: 'Inquiry about product rental',
  message: 'I would like to inquire about renting a chair for an event next month.',
}

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // By default: not rate limited, IP is a stable test value, DB writes succeed.
    rateLimitMock.mockReturnValue({ allowed: true, remaining: 3 })
    getClientIpMock.mockReturnValue('127.0.0.1')
    contactMessageCreateMock.mockResolvedValue({ id: 'cm-test-1' })
    securityLogCreateMock.mockResolvedValue(undefined)
    // N8N_WEBHOOK_URL unset → fire-and-forget fan-out is a no-op.
    delete process.env.N8N_WEBHOOK_URL
    delete process.env.N8N_WEBHOOK_SECRET
  })

  it('returns 201 on valid input', async () => {
    const res = await POST(makeRequest(validPayload))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.id).toBe('cm-test-1')
    expect(contactMessageCreateMock).toHaveBeenCalledTimes(1)
    expect(securityLogCreateMock).toHaveBeenCalledTimes(1)
  })

  it('returns 400 on missing required fields', async () => {
    const res = await POST(makeRequest({ name: 'x' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('invalid_input')
    expect(contactMessageCreateMock).not.toHaveBeenCalled()
  })

  it('returns 400 on an invalid email', async () => {
    const res = await POST(
      makeRequest({ ...validPayload, email: 'not-an-email' })
    )
    expect(res.status).toBe(400)
    expect(contactMessageCreateMock).not.toHaveBeenCalled()
  })

  it('returns 400 when the message is too short (<20 chars)', async () => {
    const res = await POST(
      makeRequest({ ...validPayload, message: 'short message' })
    )
    expect(res.status).toBe(400)
    expect(contactMessageCreateMock).not.toHaveBeenCalled()
  })

  it('returns 400 when the subject is too short (<5 chars)', async () => {
    const res = await POST(
      makeRequest({ ...validPayload, subject: 'hi' })
    )
    expect(res.status).toBe(400)
    expect(contactMessageCreateMock).not.toHaveBeenCalled()
  })

  it('returns 400 on malformed JSON body', async () => {
    const req = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ this is not valid json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('invalid_json')
  })

  it('returns 429 when the rate limit is exceeded', async () => {
    // Simulate the 4th request in a minute: rateLimiter returns blocked.
    rateLimitMock.mockReturnValue({ allowed: false, remaining: 0 })

    const res = await POST(makeRequest(validPayload))
    expect(res.status).toBe(429)
    const data = await res.json()
    expect(data.error).toBe('rate_limited')
    expect(res.headers.get('Retry-After')).toBe('60')
    // The route must short-circuit BEFORE touching the DB.
    expect(contactMessageCreateMock).not.toHaveBeenCalled()
    expect(securityLogCreateMock).not.toHaveBeenCalled()
  })

  it('passes the IP-derived key to rateLimit', async () => {
    getClientIpMock.mockReturnValue('1.2.3.4')
    await POST(makeRequest(validPayload))
    expect(rateLimitMock).toHaveBeenCalledWith('contact:1.2.3.4', 3, 60_000)
  })

  it('returns 500 if the DB write throws', async () => {
    contactMessageCreateMock.mockRejectedValue(new Error('DB down'))
    const res = await POST(makeRequest(validPayload))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('internal_error')
  })

  it('accepts a valid payload without an optional phone field', async () => {
    const { phone: _phone, ...withoutPhone } = validPayload
    void _phone
    const res = await POST(makeRequest(withoutPhone))
    expect(res.status).toBe(201)
  })
})
