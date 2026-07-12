import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })
Object.defineProperty(globalThis, 'window', {
  value: {
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  writable: true,
})

import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  getCartCount,
  getCartTotal,
  type CartItem,
} from '@/lib/cart'

const testItem: CartItem = {
  productId: 'p1',
  slug: 'test-product',
  nameAr: 'منتج اختبار',
  nameEn: 'Test Product',
  image: 'img.jpg',
  rentalPricePerDay: 10,
  securityDeposit: 50,
  startDate: '2026-07-01',
  endDate: '2026-07-02',
  quantity: 1,
  days: 1,
  total: 60,
}

describe('Cart', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('returns empty cart initially', () => {
    expect(getCart()).toEqual([])
    expect(getCartCount()).toBe(0)
    expect(getCartTotal()).toBe(0)
  })

  it('adds item to cart', () => {
    addToCart(testItem)
    expect(getCart()).toHaveLength(1)
    expect(getCartCount()).toBe(1)
    expect(getCartTotal()).toBe(60)
  })

  it('merges duplicate items (same product + dates)', () => {
    addToCart(testItem)
    addToCart(testItem) // Same product + dates → merge
    expect(getCart()).toHaveLength(1)
    expect(getCartCount()).toBe(2)
    expect(getCart()[0].quantity).toBe(2)
  })

  it('keeps separate items with different dates', () => {
    addToCart(testItem)
    addToCart({ ...testItem, startDate: '2026-08-01', endDate: '2026-08-02' })
    expect(getCart()).toHaveLength(2)
    expect(getCartCount()).toBe(2)
  })

  it('removes item from cart', () => {
    addToCart(testItem)
    removeFromCart(0)
    expect(getCart()).toEqual([])
    expect(getCartCount()).toBe(0)
  })

  it('clears cart', () => {
    addToCart(testItem)
    clearCart()
    expect(getCart()).toEqual([])
    expect(getCartCount()).toBe(0)
  })

  it('dispatches cart-updated event on add', () => {
    addToCart(testItem)
    expect(window.dispatchEvent).toHaveBeenCalledWith(expect.any(Event))
  })

  it('dispatches cart-updated event on remove', () => {
    addToCart(testItem)
    vi.clearAllMocks()
    removeFromCart(0)
    expect(window.dispatchEvent).toHaveBeenCalledWith(expect.any(Event))
  })
})
