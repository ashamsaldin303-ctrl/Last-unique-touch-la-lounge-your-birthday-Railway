import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the db module
vi.mock('@/lib/db', () => ({
  db: {
    securityLog: {
      findFirst: vi.fn().mockResolvedValue(null), // No duplicate
    },
    product: {
      findMany: vi.fn().mockResolvedValue([]), // No products found
    },
    booking: {
      count: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// Mock checkProductAvailability
vi.mock('@/lib/products', () => ({
  checkProductAvailability: vi.fn().mockResolvedValue({ available: true, conflictingBookings: 0 }),
}))

import { POST } from '@/app/api/orders/route'

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// A valid item that satisfies the `itemSchema` so that validation can reach
// the targeted customer / idempotency checks instead of failing on missing items.
const validItem = {
  productId: 'p1',
  slug: 'test-product',
  nameAr: 'منتج اختبار',
  nameEn: 'Test Product',
  image: 'https://example.com/image.jpg',
  rentalPricePerDay: 10,
  securityDeposit: 50,
  startDate: '2026-07-01T00:00:00.000Z',
  endDate: '2026-07-03T00:00:00.000Z',
  quantity: 1,
  days: 2,
  total: 20,
}

describe('POST /api/orders security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects invalid input (missing fields)', async () => {
    const req = makeRequest({ invalid: 'data' })
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('invalid_input')
  })

  it('rejects empty items array', async () => {
    const req = makeRequest({
      items: [],
      customer: {
        customerName: 'Test User',
        customerPhone: '+96512345678',
        customerEmail: 'test@test.com',
        address: 'Test address long enough',
        city: 'Kuwait',
      },
      idempotencyKey: 'test-key-1234567890',
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('rejects invalid email', async () => {
    const req = makeRequest({
      items: [validItem],
      customer: {
        customerName: 'Test User',
        customerPhone: '+96512345678',
        customerEmail: 'not-an-email',
        address: 'Test address long enough',
        city: 'Kuwait',
      },
      idempotencyKey: 'test-key-1234567890',
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('rejects invalid phone format', async () => {
    const req = makeRequest({
      items: [validItem],
      customer: {
        customerName: 'Test User',
        customerPhone: '123', // Too short
        customerEmail: 'test@test.com',
        address: 'Test address long enough',
        city: 'Kuwait',
      },
      idempotencyKey: 'test-key-1234567890',
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('rejects short idempotency key', async () => {
    const req = makeRequest({
      items: [validItem],
      customer: {
        customerName: 'Test',
        customerPhone: '+96512345678',
        customerEmail: 'test@test.com',
        address: 'Test address long enough',
        city: 'Kuwait',
      },
      idempotencyKey: 'short',
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})
