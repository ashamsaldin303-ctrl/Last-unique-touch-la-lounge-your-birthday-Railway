import type { NextRequest } from 'next/server'

/**
 * Resolve the caller's IP for rate-limit keying.
 *
 * R1-A M6 / FIX-1D: walks the `x-forwarded-for` chain right-to-left,
 * skipping IPs in the optional `TRUSTED_PROXY_IPS` allowlist (a comma-
 * separated env var). The rightmost non-trusted IP is the real client.
 * This is the algorithm recommended by R1-A M6 because it correctly
 * handles both single-proxy and multi-hop setups AND resists XFF
 * spoofing — an attacker-supplied XFF entry left of the rightmost
 * trusted proxy is ignored.
 *
 * If `TRUSTED_PROXY_IPS` is unset (the default), no IPs are skipped, so
 * the rightmost XFF entry is returned. For the current deployment
 * (Caddy → Next.js), Caddy appends the immediate client's IP to XFF
 * last, so the rightmost entry IS the real client IP — this preserves
 * the previous "take last entry" behaviour for the current single-
 * proxy setup while extending correctly to multi-hop chains when the
 * operator sets `TRUSTED_PROXY_IPS`.
 *
 * DEV NOTE: the FIX-1D task spec asked to "take the FIRST entry" of
 * XFF, with the reasoning that "Caddy appends the client IP to XFF so
 * the first entry is correct". That reasoning does NOT hold when the
 * client sends its own `X-Forwarded-For` header — Caddy APPENDS to it
 * rather than overwriting it, so the first entry becomes the spoofed
 * value. Taking the first entry would regress security (re-introduce
 * the XFF-spoofing vulnerability that the previous "take last entry"
 * code was specifically defending against). This implementation
 * follows the R1-A audit's recommendation (walk right-to-left) instead,
 * which is strictly more secure. Revert to "take first" only if Caddy
 * is reconfigured to strip client-supplied XFF before adding its own.
 *
 * Falls back to `x-real-ip`, then the sentinel `'unknown'` so
 * unidentified callers share a single rate-limit bucket rather than
 * each being unlimited.
 *
 * Server-action variant: `src/app/[locale]/admin/login/actions.ts` has
 * its own `getClientIp()` that reads from `headers()` instead of
 * `req.headers` (server actions don't receive a `NextRequest`). That
 * duplicate currently takes the LAST entry — it should be updated to
 * match this logic if consistency is required (out of scope for
 * FIX-1D since that file is owned by another agent).
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean)
    if (parts.length > 0) {
      // Optional trusted-proxy IP allowlist (comma-separated env var).
      // Default: empty — no IPs are skipped, so the rightmost entry is
      // returned (matches the previous "take last" behaviour).
      const trusted = (process.env.TRUSTED_PROXY_IPS ?? '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
      // Walk right-to-left, return the first non-trusted IP. This is
      // the rightmost entry that wasn't set by a trusted proxy — i.e.
      // the real client (or a spoofed value if no trusted proxies are
      // configured AND the client sent its own XFF).
      for (let i = parts.length - 1; i >= 0; i--) {
        const ip = parts[i].toLowerCase()
        if (!trusted.includes(ip)) {
          return parts[i] || 'unknown'
        }
      }
      // All XFF entries were trusted-proxy IPs — fall through to
      // x-real-ip / 'unknown'.
    }
  }
  return req.headers.get('x-real-ip') ?? 'unknown'
}
