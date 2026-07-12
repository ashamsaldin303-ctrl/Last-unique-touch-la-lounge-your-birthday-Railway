/**
 * Contact info helpers — centralize "is this a real phone number?" logic so
 * every UI surface (footer, contact-view, floating-whatsapp, JSON-LD) makes
 * the same decision.
 *
 * The rule (per Phase 1 brief): if `NEXT_PUBLIC_WHATSAPP_NUMBER` /
 * `NEXT_PUBLIC_PHONE_NUMBER` is missing OR contains the literal `XXX`
 * placeholder substring, treat it as "no real number" and DO NOT render the
 * WhatsApp/phone element. The Instagram link is always kept (real handle).
 */

/** Return the raw phone env var (may be undefined). */
export function getPhoneNumber(): string | undefined {
  return process.env.NEXT_PUBLIC_PHONE_NUMBER
}

/** True if the given value is a real, renderable number (not undefined, not an `XXX` placeholder). */
export function isRealNumber(value: string | undefined | null): value is string {
  if (!value) return false
  if (value.includes('XXX')) return false
  return value.trim().length > 0
}

/**
 * Build a `https://wa.me/<number>` URL for the given message.
 * Returns `null` if no real WhatsApp number is configured so callers can
 * branch on "should I render this link at all?".
 */
export function buildWhatsappUrl(message?: string): string | null {
  const num = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  if (!isRealNumber(num)) return null
  const base = `https://wa.me/${num}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

