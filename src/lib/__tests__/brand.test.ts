import { describe, it, expect } from 'vitest'
import { resolveBrandFromPath, isHomePage } from '@/lib/brand'

describe('resolveBrandFromPath', () => {
  it("returns 'lalounge' for /la-lounge", () => {
    expect(resolveBrandFromPath('/la-lounge')).toBe('lalounge')
  })

  it("returns 'birthday' for /your-birthday", () => {
    expect(resolveBrandFromPath('/your-birthday')).toBe('birthday')
  })

  it("returns 'lut' for /products", () => {
    expect(resolveBrandFromPath('/products')).toBe('lut')
  })

  it("returns 'lut' for null", () => {
    expect(resolveBrandFromPath(null)).toBe('lut')
  })

  it("returns 'lut' for '/'", () => {
    expect(resolveBrandFromPath('/')).toBe('lut')
  })

  it("returns 'lalounge' for nested /la-lounge paths", () => {
    expect(resolveBrandFromPath('/la-lounge/some/nested/route')).toBe('lalounge')
  })

  it("returns 'birthday' for nested /your-birthday paths", () => {
    expect(resolveBrandFromPath('/your-birthday/features')).toBe('birthday')
  })
})

describe('isHomePage', () => {
  it('returns true for /', () => {
    expect(isHomePage('/')).toBe(true)
  })

  it('returns true for /ar', () => {
    expect(isHomePage('/ar')).toBe(true)
  })

  it('returns true for /en', () => {
    expect(isHomePage('/en')).toBe(true)
  })

  it('returns false for /products', () => {
    expect(isHomePage('/products')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isHomePage(null)).toBe(false)
  })
})
