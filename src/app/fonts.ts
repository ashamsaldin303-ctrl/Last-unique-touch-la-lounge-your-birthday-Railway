import {
  Inter,
  Cairo,
  Montserrat,
  Poiret_One,
  Questrial,
  IBM_Plex_Sans_Arabic,
  Luckiest_Guy,
  Baloo_2,
  Lalezar,
} from 'next/font/google'

/* ============================================================
   BRAND-SPECIFIC FONTS (Phase 2.2)
   - Each brand exposes 3 fonts: display / body / arabic.
   - Variables are brand-prefixed (--font-lut-*, --font-lalounge-*,
     --font-birthday-*) so all 9 can coexist on <html>.
   - globals.css maps --font-display / --font-body / --font-arabic
     to the active brand's set via `:root[data-brand="X"]`.
   - next/font requires each font loader to be assigned to a `const`
     at module scope, so each font is declared individually below and
     then grouped into the exported `lutFonts` / `laLoungeFonts` /
     `birthdayFonts` objects.

   PERF (V14): the 4 legacy loaders (Inter→--font-inter, Tajawal→
   --font-tajawal, Cormorant→--font-display, DM Mono→--font-mono)
   were removed. next/font preloads every woff2 for every loader
   whose `.variable` class is attached to the DOM, so the 4 legacy
   loaders forced 4 extra woff2 preloads on every route — even
   though globals.css now resolves --font-display / --font-body /
   --font-arabic via the brand cascade. References to --font-mono
   in `.eyebrow` now fall back to Tailwind v4's default monospace
   stack (ui-monospace, SFMono-Regular, …).
   ============================================================ */

// --- LUT: Montserrat (display) + Inter (body) + Cairo (Arabic) ---
const lutDisplay = Montserrat({
  subsets: ['latin'],
  weight: ['800', '900'],
  display: 'swap',
  variable: '--font-lut-display',
})
const lutBody = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lut-body',
})
const lutArabic = Cairo({
  subsets: ['arabic'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-lut-arabic',
})

// --- La Lounge: Poiret One (display) + Questrial (body) + IBM Plex Sans Arabic ---
// FIX-1A / H1: `preload: false` on La Lounge + Your Birthday fonts so
// next/font does NOT emit `<link rel="preload">` for these woff2 files on
// every route. Only the LUT fonts preload (LUT is the default brand and the
// most-visited storefront). La Lounge / Birthday fonts are fetched on
// demand when the user navigates to those brand pages — a small FOUT flash
// is acceptable since BrandThemeSetter switches the brand instantly and the
// font swap happens within ~100ms of the route change. This cuts ~6 woff2
// preloads (~150-300KB) from every page on the LUT storefront.
const laLoungeDisplay = Poiret_One({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-lalounge-display',
  preload: false,
})
const laLoungeBody = Questrial({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-lalounge-body',
  preload: false,
})
const laLoungeArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-lalounge-arabic',
  preload: false,
})

// --- Your Birthday: Luckiest Guy (display) + Baloo 2 (body) + Lalezar (Arabic) ---
// `--font-birthday-arabic` is intentionally the same variable name that
// legacy code referenced, so existing `var(--font-birthday-arabic)`
// references in your-birthday-view.tsx now resolve to Lalezar.
// FIX-1A / H1: `preload: false` (see note above La Lounge block).
const birthdayDisplay = Luckiest_Guy({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-birthday-display',
  preload: false,
})
const birthdayBody = Baloo_2({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-birthday-body',
  preload: false,
})
const birthdayArabic = Lalezar({
  subsets: ['arabic'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-birthday-arabic',
  preload: false,
})

export const lutFonts = {
  display: lutDisplay,
  body: lutBody,
  arabic: lutArabic,
}

export const laLoungeFonts = {
  display: laLoungeDisplay,
  body: laLoungeBody,
  arabic: laLoungeArabic,
}

export const birthdayFonts = {
  display: birthdayDisplay,
  body: birthdayBody,
  arabic: birthdayArabic,
}
