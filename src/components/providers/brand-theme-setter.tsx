'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { resolveBrandFromPath } from '@/lib/brand'

/**
 * BrandThemeSetter (client side)
 *
 * Sets `data-brand` on <html> based on the current pathname so per-brand CSS
 * variables (defined in globals.css) take effect during SPA navigations:
 *   - `/la-lounge/*`    → data-brand="lalounge"
 *   - `/your-birthday/*` → data-brand="birthday"
 *   - everything else    → data-brand="lut"
 *
 * FIX-4B / R3-B-3: the previous comment claimed the SSR'd <html> set
 * `data-brand` from a `x-pathname` middleware header — that header was dead
 * code (no component ever read it) and has been removed from `src/proxy.ts`.
 * The root layout now hard-codes `data-brand="lut"` for SSR / no-JS;
 * `BrandThemeSetter` is responsible for correcting it on hydration AND on
 * every client-side navigation. `suppressHydrationWarning` is set on <html>
 * so the post-hydration update does not warn.
 *
 * FIX-1A / C6: also updates `<meta name="theme-color">` per-brand so the
 * mobile browser chrome (address bar tint on Android Chrome, status bar on
 * iOS Safari) matches the active brand. The layout's static `viewport`
 * export seeds the default LUT red for SSR / no-JS; this effect rewrites it
 * on every navigation.
 */
const BRAND_THEME_COLORS: Record<'lut' | 'lalounge' | 'birthday', string> = {
  lut: '#8B6B3D',
  lalounge: '#E6007E',
  birthday: '#F5B914',
}

export function BrandThemeSetter() {
  const pathname = usePathname()

  useEffect(() => {
    const brand = resolveBrandFromPath(pathname)
    document.documentElement.setAttribute('data-brand', brand)

    // the active brand. The `<meta name="theme-color">` element is emitted
    // by Next.js from the static `viewport` export in layout.tsx (default
    // LUT red). We rewrite its `content` here on every navigation so the
    // browser chrome reflects the current brand — La Lounge gets magenta,
    // Your Birthday gets gold, everything else stays LUT red.
    const themeColor = BRAND_THEME_COLORS[brand]
    if (themeColor) {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      if (!meta) {
        // Defensive: if the static meta was somehow removed, create one.
        meta = document.createElement('meta')
        meta.name = 'theme-color'
        document.head.appendChild(meta)
      }
      meta.content = themeColor
    }
  }, [pathname])

  return null
}
