import { describe, it, expect } from 'vitest'
import { parseImages, stringifyImages, calculateRentalTotal } from '@/lib/products'

describe('parseImages', () => {
  it('parses valid JSON array', () => {
    expect(parseImages('["url1", "url2"]')).toEqual(['url1', 'url2'])
  })

  it('returns empty array for null', () => {
    expect(parseImages(null)).toEqual([])
  })

  it('returns empty array for undefined', () => {
    expect(parseImages(undefined)).toEqual([])
  })

  it('returns empty array for invalid JSON', () => {
    expect(parseImages('not json')).toEqual([])
  })

  it('returns empty array for non-array JSON', () => {
    expect(parseImages('"string"')).toEqual([])
    expect(parseImages('{}')).toEqual([])
  })

  it('parses array with multiple URLs', () => {
    const result = parseImages('["a.jpg", "b.jpg", "c.jpg"]')
    expect(result).toHaveLength(3)
    expect(result[0]).toBe('a.jpg')
  })
})

describe('stringifyImages', () => {
  it('converts array to JSON string', () => {
    expect(stringifyImages(['url1', 'url2'])).toBe('["url1","url2"]')
  })

  it('handles empty array', () => {
    expect(stringifyImages([])).toBe('[]')
  })

  it('round-trips with parseImages', () => {
    const original = ['https://example.com/img1.jpg', 'https://example.com/img2.jpg']
    const stringified = stringifyImages(original)
    const parsed = parseImages(stringified)
    expect(parsed).toEqual(original)
  })
})

describe('calculateRentalTotal', () => {
  it('calculates total for 1 day, 1 quantity', () => {
    const start = new Date('2026-07-01')
    const end = new Date('2026-07-02')
    const result = calculateRentalTotal(10, 50, start, end, 1)
    expect(result.days).toBe(1)
    expect(result.subtotal).toBe(10)
    expect(result.deposit).toBe(50)
    expect(result.total).toBe(60)
  })

  it('calculates total for 3 days, 2 quantity', () => {
    const start = new Date('2026-07-01')
    const end = new Date('2026-07-04')
    const result = calculateRentalTotal(10, 50, start, end, 2)
    expect(result.days).toBe(3)
    expect(result.subtotal).toBe(60) // 10 * 3 * 2
    expect(result.deposit).toBe(100) // 50 * 2
    expect(result.total).toBe(160)
  })

  it('handles same-day rental (1 day minimum)', () => {
    const start = new Date('2026-07-01')
    const end = new Date('2026-07-01')
    const result = calculateRentalTotal(10, 50, start, end, 1)
    expect(result.days).toBe(1)
    expect(result.total).toBe(60)
  })

  it('defaults quantity to 1 when not specified', () => {
    const start = new Date('2026-07-01')
    const end = new Date('2026-07-03')
    const result = calculateRentalTotal(15, 30, start, end)
    expect(result.days).toBe(2)
    expect(result.subtotal).toBe(30) // 15 * 2 * 1
    expect(result.deposit).toBe(30)
    expect(result.total).toBe(60)
  })

  it('handles decimal prices', () => {
    const start = new Date('2026-07-01')
    const end = new Date('2026-07-03')
    const result = calculateRentalTotal(5.5, 12.5, start, end, 2)
    expect(result.subtotal).toBe(22) // 5.5 * 2 * 2
    expect(result.deposit).toBe(25) // 12.5 * 2
    expect(result.total).toBe(47)
  })
})
