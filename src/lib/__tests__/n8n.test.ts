import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// --- Mocks ----------------------------------------------------------------
//
// We mock only the collaborators that `triggerOrderConfirmedWebhook` touches:
//   1. `@/lib/db` — Prisma client (`booking.findUnique` + `securityLog.create`)
//   2. `globalThis.fetch` — the outbound HTTP call to n8n
//
// The function under test itself is imported for real, so we exercise its
// actual payload-construction + HMAC + fetch wiring.
//
// `vi.hoisted` ensures the mock functions exist by the time the (hoisted)
// `vi.mock` factory is invoked.

const mockBooking = {
  id: 'b1',
  status: 'CONFIRMED',
  startDate: new Date('2026-07-01T00:00:00.000Z'),
  endDate: new Date('2026-07-03T00:00:00.000Z'),
  totalAmount: 100,
  currency: 'KWD',
  createdAt: new Date('2026-06-01T00:00:00.000Z'),
  customerName: 'Test Customer',
  customerPhone: '+96512345678',
  customerEmail: 'test@test.com',
  product: {
    id: 'p1',
    slug: 'test-product',
    nameAr: 'منتج اختبار',
    nameEn: 'Test Product',
    rentalPricePerDay: 10,
    securityDeposit: 50,
    category: { nameAr: 'كراسي', nameEn: 'Chairs' },
  },
}

const { findUniqueMock, securityLogCreateMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  securityLogCreateMock: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    booking: {
      findUnique: findUniqueMock,
    },
    securityLog: {
      create: securityLogCreateMock,
    },
  },
}))

const fetchMock = vi.fn()

import { triggerOrderConfirmedWebhook } from '@/lib/n8n'

describe('triggerOrderConfirmedWebhook', () => {
  const originalFetch = globalThis.fetch
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    findUniqueMock.mockResolvedValue(mockBooking)
    securityLogCreateMock.mockResolvedValue(undefined)
    fetchMock.mockResolvedValue(
      new Response('ok', { status: 200, statusText: 'OK' })
    )
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example.com/webhook/order'
    process.env.N8N_WEBHOOK_SECRET = 'test-secret'
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    process.env = originalEnv
  })

  it('calls fetch with the correct payload, headers and URL', async () => {
    await triggerOrderConfirmedWebhook('b1')

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: 'b1' },
      include: { product: { include: { category: true } } },
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> }
    ]

    expect(url).toBe('https://n8n.example.com/webhook/order')
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.headers['X-Order-Id']).toBe('b1')
    expect(init.headers['X-Event']).toBe('order.confirmed')
    // HMAC signature header is present because N8N_WEBHOOK_SECRET is set
    expect(init.headers['X-Signature-256']).toMatch(/^sha256=[0-9a-f]{64}$/)

    const body = JSON.parse(init.body as string)
    expect(body.event).toBe('order.confirmed')
    expect(body.booking.id).toBe('b1')
    expect(body.booking.status).toBe('CONFIRMED')
    expect(body.booking.totalAmount).toBe(100)
    expect(body.booking.currency).toBe('KWD')
    expect(body.booking.startDate).toBe('2026-07-01T00:00:00.000Z')
    expect(body.booking.endDate).toBe('2026-07-03T00:00:00.000Z')
    expect(body.customer.name).toBe('Test Customer')
    expect(body.customer.phone).toBe('+96512345678')
    expect(body.customer.email).toBe('test@test.com')
    expect(body.product.slug).toBe('test-product')
    expect(body.product.nameAr).toBe('منتج اختبار')
    expect(body.product.nameEn).toBe('Test Product')
    expect(body.product.rentalPricePerDay).toBe(10)
    expect(body.product.securityDeposit).toBe(50)
    expect(body.product.categoryAr).toBe('كراسي')
    expect(body.product.categoryEn).toBe('Chairs')
  })

  it('omits the signature header when N8N_WEBHOOK_SECRET is not set', async () => {
    delete process.env.N8N_WEBHOOK_SECRET
    await triggerOrderConfirmedWebhook('b1')

    const init = fetchMock.mock.calls[0][1] as RequestInit & {
      headers: Record<string, string>
    }
    expect(init.headers['X-Signature-256']).toBeUndefined()
  })

  it('logs a security event after a successful webhook send', async () => {
    await triggerOrderConfirmedWebhook('b1')

    expect(securityLogCreateMock).toHaveBeenCalledTimes(1)
    const createArgs = securityLogCreateMock.mock.calls[0][0] as {
      data: { event: string; details: string }
    }
    expect(createArgs.data.event).toBe('n8n_webhook_sent')
    const details = JSON.parse(createArgs.data.details)
    expect(details.bookingId).toBe('b1')
    expect(details.responseStatus).toBe(200)
  })

  it('throws when the webhook responds with a non-OK status', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('error', { status: 500, statusText: 'Internal Server Error' })
    )

    await expect(triggerOrderConfirmedWebhook('b1')).rejects.toThrow(
      /n8n webhook failed: 500/
    )
    // Security log should NOT be written when the request failed
    expect(securityLogCreateMock).not.toHaveBeenCalled()
  })

  it('throws when the booking does not exist', async () => {
    findUniqueMock.mockResolvedValueOnce(null)

    await expect(triggerOrderConfirmedWebhook('missing-id')).rejects.toThrow(
      'Booking not found: missing-id'
    )
    expect(fetchMock).not.toHaveBeenCalled()
    expect(securityLogCreateMock).not.toHaveBeenCalled()
  })

  it('skips the webhook entirely when N8N_WEBHOOK_URL is not configured', async () => {
    delete process.env.N8N_WEBHOOK_URL
    await triggerOrderConfirmedWebhook('b1')

    expect(findUniqueMock).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(securityLogCreateMock).not.toHaveBeenCalled()
  })
})
