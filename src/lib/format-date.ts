/**
 * v29-fix-F7 Fix #7: shared locale-aware date formatter.
 *
 * Previously the admin booking-detail, cart-view, and checkout-view
 * components all rendered dates as `isoString.split('T')[0]` — a
 * YYYY-MM-DD string that is locale-neutral but visually wrong in Arabic
 * (no localized month names, no RTL digit rendering). This helper wraps
 * `Intl.DateTimeFormat` so consumers get proper Arabic-Western (`ar-KW`)
 * or US-English formatting with a 3-letter month abbreviation.
 *
 * Behavior:
 *   - `locale === 'ar'` → `ar-KW` (Arabic month names, Western digits).
 *   - anything else    → `en-US`.
 *   - On any parse/format throw (invalid ISO string, unsupported runtime),
 *     falls back to the legacy `split('T')[0]` rendering so the UI never
 *     crashes on a bad date string.
 *
 * Server-safe: `Intl.DateTimeFormat` is available in Node 18+ and in all
 * modern browsers; the helper can be called from both server components
 * and client components.
 *
 * @param isoDate ISO 8601 date string (e.g. `2025-03-15T00:00:00.000Z`).
 * @param locale  The next-intl locale code (`'ar'` or `'en'`).
 */
export function formatDate(isoDate: string, locale: string): string {
  try {
    const date = new Date(isoDate)
    if (isNaN(date.getTime())) {
      // Don't surface "Invalid Date" to the user — fall back to the raw
      // ISO string's date portion.
      return isoDate.split('T')[0]
    }
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-KW' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch {
    return isoDate.split('T')[0]
  }
}
