// V10 Fix #2: Synced BRAND_COLORS with globals.css.
// Previously these were stale (LUT=#E62129, LA_LOUNGE=#FF1493, YOUR_BIRTHDAY=#8B5CF6)
// which didn't match the canonical brand colors in globals.css. Admin badges
// and any JS-side color usage (e.g. Three.js backgrounds) were rendering with
// the wrong colors.
//
// The values below MUST match the `--primary` values in globals.css:
//   :root[data-brand="lut"]       { --primary: #E3222B; }
//   :root[data-brand="lalounge"]  { --primary: #E6007E; }
//   :root[data-brand="birthday"]  { --primary: #F5B914; }
export const BRAND_COLORS = {
  LUT: '#E3222B',
  LA_LOUNGE: '#E6007E',
  YOUR_BIRTHDAY: '#F5B914',
  // V11 Fix #12: lighter variants for 3D gradients and glows.
  LUT_LIGHT: '#FF6B6B',
  LA_LOUNGE_LIGHT: '#FF6B9D',
  YOUR_BIRTHDAY_LIGHT: '#FFD147',
} as const

export type Brand = keyof typeof BRAND_COLORS

export function getBrandColor(brand: string): string {
  return BRAND_COLORS[brand as Brand] || BRAND_COLORS.LUT
}
