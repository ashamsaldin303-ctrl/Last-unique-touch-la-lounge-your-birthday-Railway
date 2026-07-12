import { timingSafeEqual } from 'crypto'

/**
 * Constant-time string comparison to prevent timing attacks on secrets
 * (passwords, HMAC signatures, bearer tokens, etc.).
 *
 * Returns true iff the two UTF-8 byte strings are equal. The comparison
 * runs in time independent of where the first mismatch occurs, and
 * (importantly) the length-mismatch branch also performs a comparison so
 * timing doesn't leak the expected length.
 *
 * Node.js runtime only — uses `Buffer` and `crypto.timingSafeEqual`. The
 * Edge-runtime variant (used by `src/proxy.ts`) reimplements this with
 * a manual XOR loop because `Buffer` is not available on Edge.
 */
export function safeEqualStrings(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  if (aBuf.length !== bBuf.length) {
    // Still perform a comparison to keep timing roughly constant.
    timingSafeEqual(aBuf, aBuf)
    return false
  }
  return timingSafeEqual(aBuf, bBuf)
}
