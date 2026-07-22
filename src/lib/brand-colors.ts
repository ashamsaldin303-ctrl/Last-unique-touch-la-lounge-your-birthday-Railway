// Brand colors derived from the actual logos (analyzed via VLM).
// LUT gold darkened from #D4A574 to #8B6B3D for WCAG AA (4.92:1 on white).

export const BRAND_COLORS = {
  // LUT — copper gold (WCAG AA compliant, approved — do not change)
  LUT: '#8B6B3D',
  LUT_LIGHT: '#B8915A',

  // LA Lounge — magenta from logo + light gray accent
  LA_LOUNGE: '#E6007E',
  LA_LOUNGE_LIGHT: '#FF6B9D',
  LA_LOUNGE_GRAY: '#C0C0C0',

  // Your Birthday — 5 colors from the actual logo
  YOUR_BIRTHDAY: '#FFCC00',        // golden yellow (top bg of logo)
  YOUR_BIRTHDAY_DEEP: '#4A235A',   // deep purple (bottom bg of logo)
  YOUR_BIRTHDAY_RED: '#E32636',    // red (balloon + text stroke)
  YOUR_BIRTHDAY_PINK: '#FFB6C1',   // light pink (balloon)
  YOUR_BIRTHDAY_LIGHT: '#FFD700',  // bright yellow (balloon highlight)

  // Legacy alias (keep for any old references)
  YOUR_BIRTHDAY_OLD: '#F5B914',
} as const

export type Brand = keyof typeof BRAND_COLORS

export function getBrandColor(brand: string): string {
  return BRAND_COLORS[brand as Brand] || BRAND_COLORS.LUT
}
