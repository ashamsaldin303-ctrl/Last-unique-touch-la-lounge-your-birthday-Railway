import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import bundleAnalyzer from '@next/bundle-analyzer'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  output: 'standalone',
  // Prisma Client must remain external to the Next.js bundle so that the
  // standalone server output can resolve it (and its generated `.prisma/client`
  // sibling) from node_modules at runtime. Without this, the standalone build
  // tries to bundle Prisma and fails with `Cannot find module '@prisma/client'`
  // or `PrismaClient is not a constructor` errors.
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // Don't expose Next.js in the X-Powered-By response header (D4).
  poweredByHeader: false,
  images: {
    // G3-2: removed dead `images.unsplash.com` remotePattern (0 matches in src/)
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  async headers() {
    // --- Content Security Policy (D4) ---
    // Strict-by-default policy. 'unsafe-inline' is required for scripts
    // and styles because Next.js injects inline <script> hydration data
    // and inline <style> tags at runtime. 'unsafe-eval' is deliberately
    // NOT included in production — that would defeat the CSP.
    //
    // In dev mode, React Refresh (HMR) needs `unsafe-eval` to transform
    // JSX on the fly. Without it, hydration silently fails and the page
    // is server-rendered-only (no interactivity, no useState updates).
    // We add `'unsafe-eval'` to script-src only when NODE_ENV !== 'production'.
    //
    // R1-A M2 / FIX-1D TODO: switch to nonce-based CSP in production so
    // `'unsafe-inline'` can be removed from script-src. Next.js 16
    // supports this via the `x-nonce` request header (set in
    // `src/proxy.ts` middleware) — Next.js auto-applies the nonce to
    // all inline scripts it generates (hydration data, etc.). The
    // remaining work to enable this is:
    //   (1) Generate `const nonce = crypto.randomUUID()` per request in
    //       `src/proxy.ts`.
    //   (2) Forward it via `x-nonce` request header so Next.js picks
    //       it up. This requires wrapping `intlMiddleware(request)`
    //       with a modified-request `NextResponse.next({ request: {
    //       headers } })` — non-trivial because next-intl's middleware
    //       returns its own NextResponse.
    //   (3) Build the CSP dynamically in `src/proxy.ts` with
    //       `script-src 'self' 'nonce-${nonce}'` and set it on the
    //       response, replacing this static CSP.
    //   (4) Remove the static CSP from this file (production only) so
    //       the proxy-set CSP isn't merged/duplicated.
    // Until that work lands, `'unsafe-inline'` is retained for
    // script-src in production — removing it WITHOUT the nonce setup
    // breaks Next.js hydration (inline scripts blocked → no state,
    // no event handlers). The current state is documented as a known
    // CSP weakness; the audit (R1-A M2) flagged it as MEDIUM.
    const isDev = process.env.NODE_ENV !== 'production'
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'"
    // v28-g2-F1 Fix #4: tighten img-src — drop the catch-all `https:`. The
    // previous `"img-src 'self' data: blob: https:"` allowed ANY HTTPS image
    // origin, but the codebase only uses self-hosted images (verified via
    // Grep for `images.unsplash.com` in `src/` → 0 matches; the
    // `images.remotePatterns` entry for unsplash in next.config is a leftover
    // that no component actually references). The catch-all `https:` would let
    // a future XSS load attacker-controlled tracking pixels or exfiltrate
    // data via image URLs. Now restricted to `'self' data: blob:` matching
    // actual usage.
    // v41-g2-F2 Fix #2: drop dead `https://fonts.googleapis.com` from
    // style-src and `https://fonts.gstatic.com` from font-src. All fonts
    // are self-hosted via next/font (verified: 0 references to either
    // host in `src/` — see Grep for `fonts.googleapis.com` /
    // `fonts.gstatic.com`). Keeping them in the CSP granted a network
    // allowance that nothing in the app actually uses, which is exactly
    // the kind of stale entry CSP audits flag.
    const csp = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      // In dev, allow HMR websocket + eval-based source maps.
      isDev ? "connect-src 'self' ws: w:" : "connect-src 'self'",
      "frame-ancestors https://*.space-z.ai https://space-z.ai",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; ')

    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        { key: 'Content-Security-Policy', value: csp },
      ],
    }]
  },
}

export default withBundleAnalyzer(withNextIntl(nextConfig))
