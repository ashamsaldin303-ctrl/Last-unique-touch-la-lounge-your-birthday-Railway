import { describe, it, expect } from 'vitest'
import { safeEqualStrings } from '@/lib/crypto-utils'

describe('safeEqualStrings', () => {
  it('returns true for equal strings', () => {
    expect(safeEqualStrings('abc', 'abc')).toBe(true)
  })

  it('returns false for strings differing only at the last char', () => {
    expect(safeEqualStrings('abc', 'abd')).toBe(false)
  })

  it('returns false for strings of different length', () => {
    expect(safeEqualStrings('abc', 'abcd')).toBe(false)
  })

  it('returns true for two empty strings', () => {
    expect(safeEqualStrings('', '')).toBe(true)
  })

  it('returns false when only one side is empty', () => {
    expect(safeEqualStrings('', 'a')).toBe(false)
    expect(safeEqualStrings('a', '')).toBe(false)
  })

  it('handles unicode / multi-byte UTF-8 correctly', () => {
    expect(safeEqualStrings('كلمة', 'كلمة')).toBe(true)
    expect(safeEqualStrings('كلمة', 'كلمه')).toBe(false)
  })

  // -------------------------------------------------------------------------
  // Timing sanity (NOT a strict constant-time proof — that requires
  // nanosecond instrumentation and many runs under a controlled harness.
  // Vitest in a CI sandbox has far too much GC/scheduler jitter to assert
  // timing ratios reliably). What we CAN deterministically assert is the
  // functional property that underpins constant-time equality: the result
  // must be correct regardless of WHERE the first mismatch occurs. If the
  // implementation ever short-circuited, we'd still get the right boolean
  // (false), but the timing leak would be invisible to the test — so we
  // instead verify correctness across every mismatch position to ensure
  // the function fully traverses the buffers and doesn't crash on any
  // partial-match pattern.
  // -------------------------------------------------------------------------
  it('returns the correct result for mismatches at every position', () => {
    const base = 'abcdefghijklmnopqrstuvwxyz0123456789' // 36 chars
    // Same-length mismatches: change exactly one char at each position.
    for (let i = 0; i < base.length; i++) {
      const other = base.slice(0, i) + 'X' + base.slice(i + 1)
      // Sanity: the strings must actually differ at position i.
      expect(other).not.toBe(base)
      expect(safeEqualStrings(base, other)).toBe(false)
      // And the full match must still return true.
      expect(safeEqualStrings(base, base)).toBe(true)
    }
  })

  it('does not throw and returns consistent results across many iterations', () => {
    const a = 'secret-token-value-1234567890'
    // Run a large batch covering all three branches (equal, last-char
    // mismatch, first-char mismatch, length mismatch) to flush out any
    // edge-case crash. We don't assert timing — only correctness.
    for (let i = 0; i < 1000; i++) {
      expect(safeEqualStrings(a, a)).toBe(true)
      expect(safeEqualStrings(a, a.slice(0, -1) + 'X')).toBe(false)
      expect(safeEqualStrings(a, 'X' + a.slice(1))).toBe(false)
      expect(safeEqualStrings(a, a + '!')).toBe(false)
    }
  })
})
