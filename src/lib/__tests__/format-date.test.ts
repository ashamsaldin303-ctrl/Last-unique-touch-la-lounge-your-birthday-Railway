import { describe, it, expect } from 'vitest'
import { formatDate } from '@/lib/format-date'

describe('formatDate', () => {
  it("formats an English date with the year and an abbreviated month", () => {
    const result = formatDate('2026-01-15T10:00:00Z', 'en')
    expect(result).toContain('2026')
    expect(result).toContain('Jan')
  })

  it("formats an Arabic date using ar-KW (Arabic month name or digits)", () => {
    const result = formatDate('2026-01-15T10:00:00Z', 'ar')
    // ar-KW renders Arabic month names (e.g. "يناير") with Latin digits.
    // Either an Arabic character or the year should be present.
    expect(result).toMatch(/[\u0600-\u06FF]|2026/)
    // Should not equal the raw ISO string's date portion.
    expect(result).not.toBe('2026-01-15')
  })

  it("falls back to the date portion of the input for an invalid date string", () => {
    // 'invalid' has no 'T' — split('T')[0] returns the whole string.
    const result = formatDate('invalid', 'en')
    expect(result).toBe('invalid')
  })

  it("returns empty string for empty input", () => {
    const result = formatDate('', 'en')
    expect(result).toBe('')
  })

  it("falls back to date portion for a malformed ISO string with a T", () => {
    // new Date('garbage-T-garbage') is Invalid Date → falls back to
    // input.split('T')[0] === 'garbage-' (everything before the 'T').
    const result = formatDate('garbage-T-garbage', 'en')
    expect(result).toBe('garbage-')
  })

  it("treats any non-'ar' locale as English (en-US)", () => {
    const result = formatDate('2026-01-15T10:00:00Z', 'fr')
    // Non-'ar' locales route to en-US, so we expect an English month.
    expect(result).toContain('Jan')
    expect(result).toContain('2026')
  })
})
