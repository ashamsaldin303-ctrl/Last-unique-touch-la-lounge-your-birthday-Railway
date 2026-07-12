import { db } from './db'
import { createHmac } from 'crypto'

/**
 * Validate an outbound webhook URL to prevent SSRF (R1-A M11).
 *
 * Rejects URLs that target private/internal IP ranges or non-https
 * schemes (in production). In dev we allow localhost / private IPs /
 * http so a developer can point `N8N_WEBHOOK_URL` at a local n8n
 * instance — but in production we strictly require https + a public
 * hostname.
 *
 * Covered private ranges (RFC 1918 + link-local + loopback + unique local
 * IPv6):
 *   - 10.0.0.0/8
 *   - 172.16.0.0/12  (172.16.x – 172.31.x)
 *   - 192.168.0.0/16
 *   - 169.254.0.0/16 (link-local — includes AWS metadata 169.254.169.254)
 *   - 127.0.0.0/8    (loopback)
 *   - ::1, fc00::/7  (IPv6 loopback + unique local)
 *   - "localhost" hostname
 *
 * NOTE: this is a best-effort string/hostname check. It does NOT resolve
 * the hostname via DNS (so an attacker could in theory register a public
 * DNS name that resolves to a private IP — a DNS-rebinding attack).
 * A full defence would resolve the hostname and verify the resolved IP
 * is public BEFORE connecting, and pin the connection to that IP. That
 * is out of scope for this fix; the current check closes the most common
 * SSRF vectors (literal private IPs + non-https).
 */
export function validateWebhookUrl(url: string): boolean {
  const isProduction = process.env.NODE_ENV === 'production'
  try {
    const parsed = new URL(url)
    // In production, require https. In dev, allow http for local n8n.
    if (isProduction && parsed.protocol !== 'https:') return false
    // Disallow non-http(s) protocols (file:, ftp:, data:, etc.) in all envs.
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false

    const host = parsed.hostname.toLowerCase()

    // IPv6 loopback + unique local.
    if (host === '::1' || host.startsWith('fc') || host.startsWith('fd')) {
      return !isProduction
    }
    // Bracketed IPv6 form `[::1]`.
    const bareHost = host.startsWith('[') && host.endsWith(']')
      ? host.slice(1, -1)
      : host

    if (bareHost === '::1' || bareHost.startsWith('fc') || bareHost.startsWith('fd')) {
      return !isProduction
    }

    // Loopback / localhost.
    if (bareHost === 'localhost' || bareHost === '127.0.0.1' || /^127\./.test(bareHost)) {
      return !isProduction
    }

    // Private IPv4 ranges.
    if (/^10\./.test(bareHost)) return !isProduction
    if (/^192\.168\./.test(bareHost)) return !isProduction
    if (/^169\.254\./.test(bareHost)) return !isProduction // link-local (AWS metadata)
    if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(bareHost)) return !isProduction

    return true
  } catch {
    return false
  }
}

/**
 * Resolve the n8n webhook signing secret.
 *
 * Fix #4: fail-closed in production — if N8N_WEBHOOK_SECRET is unset or
 * shorter than 16 chars in production, throw so the caller (which already
 * wraps the call in try/catch) refuses to send the webhook. In dev we
 * keep the original fallback: use whatever secret is provided (any length),
 * or return null if unset (in which case the X-Signature-256 header is
 * skipped).
 */
function getWebhookSecret(): string | null {
  const isProduction = process.env.NODE_ENV === 'production'
  const secret = process.env.N8N_WEBHOOK_SECRET

  if (isProduction) {
    if (!secret || secret.length < 16) {
      throw new Error(
        'N8N_WEBHOOK_SECRET must be set and at least 16 chars in production.'
      )
    }
    return secret
  }

  // Dev fallback — caller skips the X-Signature-256 header if null.
  return secret ?? null
}

/**
 * Trigger the n8n webhook for a confirmed order.
 * Sends order details to n8n, which then:
 * 1. Sends Telegram message to business owner
 * 2. Creates Google Calendar event
 * 3. Sends HTML invoice email to customer
 *
 * Uses HMAC signature for security (prevents forged requests).
 * If N8N_WEBHOOK_URL is not set, logs and skips (useful in development).
 *
 * Fix #4: throws in production when N8N_WEBHOOK_SECRET is unset/short
 * (fail-closed). Throws when the webhook URL fails the SSRF allowlist
 * (R1-A M11 — non-https in production, or any private/internal IP range
 * in production). In dev, the SSRF check is permissive (localhost /
 * private IPs / http are allowed for local n8n instances).
 */
export async function triggerOrderConfirmedWebhook(bookingId: string): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL

  // If n8n is not configured, log and skip (useful in development)
  if (!webhookUrl) {
    console.warn('[n8n] Webhook URL not configured, skipping for booking:', bookingId)
    return
  }

  // SSRF / transport security (R1-A M11): validate the webhook URL BEFORE
  // fetching. The previous check only enforced the https scheme — a
  // misconfigured `N8N_WEBHOOK_URL=https://169.254.169.254/...` would
  // still let the server fetch internal-only HTTPS endpoints and leak
  // the signed payload. The shared `validateWebhookUrl` helper covers
  // scheme + private IP ranges (10.x, 172.16-31.x, 192.168.x, 169.254.x,
  // 127.x, ::1, fc00::/7). In production we reject; in dev we allow
  // localhost / private IPs so a local n8n instance can be used.
  if (!validateWebhookUrl(webhookUrl)) {
    throw new Error(
      '[n8n] refusing to send webhook to disallowed URL (non-https in ' +
        'production or private/internal IP range): ' +
        webhookUrl.replace(/\/\/[^@]+@/, '//***@')
    )
  }

  // Fix #4: resolve the signing secret. In production getWebhookSecret
  // throws if the secret is unset/short (fail-closed) — we let the error
  // propagate so the caller refuses to send the webhook. In dev it returns
  // null when unset, in which case we skip the X-Signature-256 header.
  const webhookSecret = getWebhookSecret()

  // 1. Fetch full booking details
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      product: {
        include: { category: true },
      },
    },
  })

  if (!booking) {
    throw new Error(`Booking not found: ${bookingId}`)
  }

  // Birthday / non-product bookings legitimately have `product: null`.
  // Do NOT throw — build a payload with fallback values so n8n can route
  // the event based on `bookingType` (#4).

  // 2. Build payload
  const payload = {
    event: 'order.confirmed',
    timestamp: new Date().toISOString(),
    bookingType: booking.product ? 'product_rental' : 'birthday_event',
    booking: {
      id: booking.id,
      status: booking.status,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      totalAmount: booking.totalAmount,
      currency: booking.currency,
      createdAt: booking.createdAt.toISOString(),
    },
    customer: {
      name: booking.customerName,
      phone: booking.customerPhone,
      email: booking.customerEmail,
    },
    product: {
      id: booking.product?.id ?? null,
      slug: booking.product?.slug ?? null,
      nameAr: booking.product?.nameAr ?? 'باقة عيد الميلاد',
      nameEn: booking.product?.nameEn ?? 'Birthday Package',
      rentalPricePerDay: booking.product?.rentalPricePerDay ?? null,
      securityDeposit: booking.product?.securityDeposit ?? null,
      categoryAr: booking.product?.category?.nameAr ?? null,
      categoryEn: booking.product?.category?.nameEn ?? null,
    },
  }

  // 3. Compute HMAC signature (security rule #3 — sign the body before sending)
  // n8n will verify this signature on its end.
  const body = JSON.stringify(payload)
  const signature = webhookSecret
    ? createHmac('sha256', webhookSecret).update(body).digest('hex')
    : null

  // 4. Send webhook with timeout (security rule #21 — timeout for external requests)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Order-Id': bookingId,
      'X-Event': 'order.confirmed',
    }

    if (signature) {
      headers['X-Signature-256'] = `sha256=${signature}`
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`)
    }

    console.warn('[n8n] Webhook sent successfully for booking:', bookingId)

    // Log success (do NOT log the webhook URL — it's a secret)
    await db.securityLog.create({
      data: {
        event: 'n8n_webhook_sent',
        details: JSON.stringify({
          bookingId,
          responseStatus: response.status,
        }),
      },
    })
  } finally {
    clearTimeout(timeout)
  }
}
