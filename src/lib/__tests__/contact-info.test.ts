import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  getPhoneNumber,
  isRealNumber,
  buildWhatsappUrl,
} from '@/lib/contact-info'

describe('getPhoneNumber', () => {
  const original = process.env.NEXT_PUBLIC_PHONE_NUMBER

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_PHONE_NUMBER
    else process.env.NEXT_PUBLIC_PHONE_NUMBER = original
  })

  it('returns the env value when set', () => {
    process.env.NEXT_PUBLIC_PHONE_NUMBER = '+965 12345678'
    expect(getPhoneNumber()).toBe('+965 12345678')
  })

  it('returns undefined when not set', () => {
    delete process.env.NEXT_PUBLIC_PHONE_NUMBER
    expect(getPhoneNumber()).toBeUndefined()
  })
})

describe('isRealNumber', () => {
  it('returns true for a real phone number', () => {
    expect(isRealNumber('+965 12345678')).toBe(true)
  })

  it('returns false for an XXX placeholder', () => {
    expect(isRealNumber('965XXXXXXXX')).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isRealNumber(undefined)).toBe(false)
  })

  it('returns false for null', () => {
    expect(isRealNumber(null)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isRealNumber('')).toBe(false)
  })

  it('returns false for a whitespace-only string', () => {
    expect(isRealNumber('   ')).toBe(false)
  })

  it('narrows the type to string when truthy', () => {
    const value: string | undefined = '+96512345678'
    if (isRealNumber(value)) {
      // TypeScript: value is `string` here.
      expect(value.length).toBeGreaterThan(0)
    }
  })
})

describe('buildWhatsappUrl', () => {
  const originalNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  })

  afterEach(() => {
    if (originalNumber === undefined) delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
    else process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = originalNumber
  })

  it('builds a wa.me URL containing the number and message', () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '96512345678'
    const url = buildWhatsappUrl('hello')
    expect(url).not.toBeNull()
    expect(url).toContain('wa.me')
    expect(url).toContain('96512345678')
    expect(url).toContain('hello')
  })

  it('omits the ?text= query when no message is supplied', () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '96512345678'
    const url = buildWhatsappUrl()
    expect(url).not.toBeNull()
    expect(url).toContain('wa.me')
    expect(url).not.toContain('?text=')
  })

  it('returns null when no number is configured', () => {
    expect(buildWhatsappUrl('hello')).toBeNull()
  })

  it('returns null when the configured number is an XXX placeholder', () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '965XXXXXXXXX'
    expect(buildWhatsappUrl('hello')).toBeNull()
  })

  it('URL-encodes the message', () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '96512345678'
    const url = buildWhatsappUrl('hello world & friends')
    expect(url).not.toBeNull()
    // Spaces and & must be percent-encoded.
    expect(url).toContain('hello%20world')
    expect(url).toContain('%26')
  })
})
