/**
 * Locale-aware number formatting utilities.
 *
 * Uses Intl.NumberFormat with Latin numbering system for Arabic (so digits
 * stay 0-9 even in RTL context — this is the Kuwait/Arabic convention for
 * prices and quantities). For English, uses the default.
 */

/**
 * Format a number for display in the given locale.
 * Uses Latin (0-9) digits even for Arabic, per Kuwait convention.
 *
 * @example formatNumber(1234.5, 'ar')  // "1,234.5"
 * @example formatNumber(1234.5, 'en')  // "1,234.5"
 */
export function formatNumber(
  value: number,
  locale: 'ar' | 'en' = 'en',
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-Latn' : 'en', {
    numberingSystem: 'latn',
    ...options,
  }).format(value)
}

/**
 * Format a price with currency.
 * KWD uses 3 decimal places (Kuwaiti dinar fils).
 *
 * @example formatPrice(12.5, 'ar')  // "12.500 د.ك"
 * @example formatPrice(12.5, 'en')  // "KWD 12.500"
 */
export function formatPrice(value: number, locale: 'ar' | 'en' = 'en', currency = 'KWD'): string {
  const symbol = locale === 'ar' ? 'د.ك' : currency
  const formatted = formatNumber(value, locale, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
  return locale === 'ar' ? `${formatted} ${symbol}` : `${currency} ${formatted}`
}

/**
 * Format a quantity (no decimals, with thousands separator).
 *
 * @example formatQuantity(1234, 'ar')  // "1,234"
 */
export function formatQuantity(value: number, locale: 'ar' | 'en' = 'en'): string {
  return formatNumber(value, locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}
