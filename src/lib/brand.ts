/**
 * Shared brand-resolution helpers (FIX-4B / R3-B-1).
 *
 * Previously `resolveBrandFromPath` was duplicated verbatim in 4 files
 * (layout.tsx, navbar.tsx, footer.tsx, brand-theme-setter.tsx) and a sibling
 * variant returning the API-facing 'LUT' | 'LA_LOUNGE' | 'YOUR_BIRTHDAY'
 * literal set lived in contact-view.tsx. This module is the single source of
 * truth for path → brand-key mapping.
 *
 * The lowercase `BrandKey` ('lut' | 'lalounge' | 'birthday') matches the
 * `data-brand` attribute on <html> and the keys of `BRAND_THEME_COLORS`
 * in brand-theme-setter.tsx. The uppercase `ContactBrand` set is what the
 * `/api/contact` route persists; use `BRAND_TO_CONTACT_BRAND` to map.
 */

export type BrandKey = 'lut' | 'lalounge' | 'birthday'

/**
 * Resolve the storefront brand from a (locale-stripped) pathname.
 *
 * - `/la-lounge/*`    → 'lalounge'
 * - `/your-birthday/*` → 'birthday'
 * - everything else (incl. `null`) → 'lut' (the SSR default)
 *
 * `null` returns 'lut' so the root layout (which has no access to the
 * pathname without `headers()` — removed in V13 C9 for static prerendering)
 * can default to the most-common brand on SSR; `BrandThemeSetter` corrects
 * the `data-brand` attribute on hydration and every navigation.
 */
export function resolveBrandFromPath(pathname: string | null): BrandKey {
  if (!pathname) return 'lut'
  if (pathname.includes('/la-lounge')) return 'lalounge'
  if (pathname.includes('/your-birthday')) return 'birthday'
  return 'lut'
}

/**
 * Detect if the current route is the home page (`/` or `/ar` or `/en`).
 *
 * On the home page the navbar wordmark and footer brand name are hidden —
 * the home page is the umbrella landing for all 3 brands and should not
 * show any single brand's name (V10 user request). Extracted here so
 * navbar.tsx and footer.tsx share the same definition.
 */
export function isHomePage(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === '/' || pathname === '/ar' || pathname === '/en'
}
