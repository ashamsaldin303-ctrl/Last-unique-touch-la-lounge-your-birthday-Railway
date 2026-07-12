import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { createHmac } from 'crypto'
import { db } from '@/lib/db'
import { triggerOrderConfirmedWebhook } from '@/lib/n8n'
import { safeEqualStrings } from '@/lib/crypto-utils'

// ===== v28-g2-F1 Fix #2: Replay protection parity with payment-callback =====
//
// Previously this route authenticated ONLY via the `x-internal-secret` header
// — no timestamp, no nonce, no body signature. If `INTERNAL_API_SECRET` ever
// leaked (via a misconfigured log, env dump, SSRF, or git push), an attacker
// could replay captured requests indefinitely. The IdempotencyKey table
// prevented double-processing of the SAME orderId, but the attacker could
// submit DIFFERENT orderIds to confirm ALL pending orders (skipping payment).
//
// The fix mirrors /api/webhooks/payment-callback exactly:
//   - Signature = HMAC-SHA256(PAYMENT_WEBHOOK_SECRET, rawBody + timestamp + nonce)
//   - Timestamp must be within MAX_TIMESTAMP_SKEW of server time.
//   - Each (orderId, nonce) pair is logged via IdempotencyKey (already in place)
//     so a replay with the same nonce fails signature, and a replay with a
//     fresh nonce but stale timestamp fails the skew check.
//
// Required headers (V9 Fix #3 pattern):
//   - X-Webhook-Timestamp: ms since epoch (must be within 5 min of server time)
//   - X-Webhook-Nonce:     unique per webhook (UUID recommended)
//   - X-Webhook-Signature: hex HMAC-SHA256(secret, rawBody + timestamp + nonce)
//
// The previous `x-internal-secret` shared-secret scheme is REMOVED. Any caller
// still using it must be migrated to the HMAC scheme. There are no in-tree
// callers (the route is invoked by an external mock payment-gateway simulator
// and by dev scripts).

const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000 // 5 minutes

const schema = z.object({
  // v29-fix-F7 Fix #2: bound orderId length. Booking.id is a cuid (24 chars);
  // 100 is a safe upper bound. Without this, a malicious caller (or buggy
  // payment gateway) could POST an arbitrarily-large orderId that gets
  // loaded into memory before the HMAC signature check rejects it.
  orderId: z.string().min(1).max(100),
})

/**
 * Resolve the payment webhook signing secret. Fail-closed in production.
 * Uses the same PAYMENT_WEBHOOK_SECRET as /api/webhooks/payment-callback so
 * the operator only has to configure one signing secret for both routes.
 */
function getWebhookSecret(): string {
  const isProduction = process.env.NODE_ENV === 'production'
  const secret = process.env.PAYMENT_WEBHOOK_SECRET

  if (secret && secret.length >= 16) {
    return secret
  }

  if (isProduction) {
    throw new Error('PAYMENT_WEBHOOK_SECRET must be set in production.')
  }

  console.warn(
    '[payment-success] WARNING: PAYMENT_WEBHOOK_SECRET is not set. ' +
      'Using dev-only insecure secret. Do NOT use in production.'
  )
  return 'dev-insecure-payment-webhook-secret'
}

/**
 * Verify the webhook signature.
 *
 * Signature = HMAC-SHA256(secret, rawBody + timestamp + nonce)
 *
 * The raw body, timestamp, and nonce are all part of the signed payload so
 * that:
 *   - Replaying the same body with a different nonce fails signature check.
 *   - Replaying the same (body, nonce) with an old timestamp fails the
 *     skew check (even if the signature were somehow valid).
 *
 * Mirrors the verifier in /api/webhooks/payment-callback/route.ts.
 */
function verifyWebhookSignature(
  rawBody: string,
  timestamp: string,
  nonce: string,
  signature: string,
  secret: string
): boolean {
  // 1. Timestamp skew check — reject webhooks older than MAX_TIMESTAMP_SKEW.
  //    This bounds the replay window to 5 minutes.
  const ts = parseInt(timestamp, 10)
  if (isNaN(ts) || Math.abs(Date.now() - ts) > MAX_TIMESTAMP_SKEW_MS) {
    return false
  }

  // 2. Required header presence.
  if (!nonce || !signature) return false

  // 3. Signature = HMAC(secret, rawBody + timestamp + nonce)
  const payload = `${rawBody}${timestamp}${nonce}`
  const expectedSig = createHmac('sha256', secret).update(payload).digest('hex')

  try {
    return safeEqualStrings(signature, expectedSig)
  } catch {
    return false
  }
}

/**
 * POST /api/webhooks/payment-success
 *
 * Internal mock endpoint to simulate payment confirmation.
 * In production, this will be replaced by /api/webhooks/payment-callback
 * which receives real confirmations from the external payment gateway company.
 *
 * Authenticated by HMAC-SHA256 signature + timestamp + nonce (v28-g2-F1 Fix #2)
 * — the same scheme as /api/webhooks/payment-callback. Required headers:
 *   - X-Webhook-Timestamp: ms since epoch (must be within 5 min of server time)
 *   - X-Webhook-Nonce:     unique per webhook (UUID recommended)
 *   - X-Webhook-Signature: hex HMAC-SHA256(PAYMENT_WEBHOOK_SECRET, rawBody + timestamp + nonce)
 *
 * Responses:
 *   200 { success: true, ... }                       — booking updated or already confirmed
 *   400 { error: "invalid_json" | "invalid_input" }
 *   401 { error: "invalid_signature" }
 *   404 { error: "order_not_found" }
 *   503 { error: "server_misconfigured" }
 */
export async function POST(req: NextRequest) {
  try {
    // --- Read the raw body FIRST (V9 Fix #3 pattern) ---
    // We need the raw bytes for signature verification — `req.json()` would
    // re-serialize and break the signature. Use `req.text()` then parse.
    let rawBody: string
    try {
      rawBody = await req.text()
    } catch {
      return NextResponse.json(
        { error: 'invalid_json' },
        { status: 400 }
      )
    }

    // --- Parse body defensively (D2): invalid JSON -> 400, not 500 ---
    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { error: 'invalid_json' },
        { status: 400 }
      )
    }

    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      // R1-A M9: do NOT disclose Zod issue details to the client (schema
      // disclosure). Log them server-side for debugging instead.
      console.warn('[api/payment-success] Validation failed:', parsed.error.issues)
      return NextResponse.json(
        { error: 'invalid_input' },
        { status: 400 }
      )
    }

    const { orderId } = parsed.data

    // --- Resolve the signing secret (fail-closed in production) ---
    let secret: string
    try {
      secret = getWebhookSecret()
    } catch {
      // 503 (not 500) so monitoring can distinguish a misconfiguration
      // from a real server error — D3.
      return NextResponse.json(
        { error: 'server_misconfigured' },
        { status: 503 }
      )
    }

    // --- Signature + timestamp + nonce verification (v28-g2-F1 Fix #2) ---
    const timestamp = req.headers.get('x-webhook-timestamp') ?? ''
    const nonce = req.headers.get('x-webhook-nonce') ?? ''
    const signature = req.headers.get('x-webhook-signature') ?? ''

    const signatureValid = verifyWebhookSignature(
      rawBody,
      timestamp,
      nonce,
      signature,
      secret
    )

    if (!signatureValid) {
      return NextResponse.json(
        { error: 'invalid_signature' },
        { status: 401 }
      )
    }

    // R2-A-4: namespace the idempotency key with a route prefix so a
    // payment-success key (raw orderId) can never collide with keys from
    // /api/orders or /api/bookings/birthday (which share the same UNIQUE
    // IdempotencyKey.key column). Without this prefix, an attacker who
    // submits /api/orders with `idempotencyKey = <booking cuid>` would
    // pre-seed the key — when payment-success later tries to create
    // `key: orderId` for that same booking, the create throws P2002 and
    // we silently swallow the legitimate payment confirmation.
    //
    // v28-g2-F1 Fix #2: now that the route requires a per-webhook nonce,
    // we include the nonce in the key so two legitimate retries of the
    // same orderId with DIFFERENT nonces don't collide on the idempotency
    // table (a replay with the SAME nonce fails signature verification
    // above and never reaches here).
    const namespacedKey = `payment-success:${orderId}:${nonce}`

    // Fix #2: race-condition hardening. Previously the flow was
    //   findUnique → status check → update → triggerOrderConfirmedWebhook
    // with each step on a separate connection. Two concurrent
    // payment-success webhooks for the same orderId could both observe
    // PENDING, both pass the guard, and both update + fire n8n.
    //
    // Now the findUnique → status guard → update → idempotency-log run
    // inside a single Serializable transaction (mirroring the pattern in
    // /api/webhooks/payment-callback/route.ts). The n8n webhook trigger
    // is moved OUTSIDE the transaction so a slow n8n doesn't hold locks.
    //
    // --- Idempotency refactor (security/data-fix #1): the previous
    //     implementation used `SecurityLog.details { contains: orderId }`
    //     which is a substring match on a free-form JSON text column.
    //     This is incorrect for two reasons: (1) an orderId of "abc1"
    //     would match the log entry for "abc12" (false positive →
    //     silently dropping a legitimate payment confirmation); (2) any
    //     unrelated SecurityLog row whose details string happened to
    //     contain the orderId substring would short-circuit the webhook.
    //     Now we use the dedicated `IdempotencyKey` table (which has a
    //     real UNIQUE constraint on `key`) and mirror the exact pattern
    //     from /api/orders/route.ts: `tx.idempotencyKey.create()` inside
    //     the transaction, and on P2002 treat the webhook as already
    //     processed.
    let txResult:
      | { type: 'already_confirmed' }
      | { type: 'not_found' }
      | { type: 'invalid_status'; current: string }
      | { type: 'updated'; orderId: string }
    try {
      txResult = await db.$transaction(
        async (tx) => {
          // 1. Idempotency: create the key FIRST inside the Serializable
          //    transaction. If two concurrent payment-success webhooks
          //    for the same (orderId, nonce) arrive, the second create
          //    throws P2002 — caught below — which we map to
          //    `already_confirmed`.
          const idempotencyRecord = await tx.idempotencyKey.create({
            data: {
              key: namespacedKey,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
            },
          })

          // 2. Find the booking inside the transaction.
          const booking = await tx.booking.findUnique({
            where: { id: orderId },
            include: { product: true },
          })

          if (!booking) {
            return { type: 'not_found' as const }
          }

          // Idempotency: already confirmed — no-op. Still link the
          // idempotency key to the order so future replays can be traced.
          if (booking.status === 'CONFIRMED') {
            await tx.idempotencyKey.update({
              where: { id: idempotencyRecord.id },
              data: { orderId },
            })
            return { type: 'already_confirmed' as const }
          }

          if (booking.status !== 'PENDING') {
            return { type: 'invalid_status' as const, current: booking.status }
          }

          // 3. Update booking to CONFIRMED inside the same tx.
          await tx.booking.update({
            where: { id: orderId },
            data: { status: 'CONFIRMED' },
          })

          // 4. Link the idempotency key to the resulting order so a
          //    future replay can be traced back to this order.
          await tx.idempotencyKey.update({
            where: { id: idempotencyRecord.id },
            data: { orderId },
          })

          // 5. Audit log (kept for backwards compat with tooling that
          //    reads the old SecurityLog format).
          await tx.securityLog.create({
            data: {
              event: 'payment_success_processed',
              details: JSON.stringify({
                orderId,
                nonce,
                fromStatus: booking.status,
                toStatus: 'CONFIRMED',
              }),
            },
          })

          return { type: 'updated' as const, orderId }
        },
        { isolationLevel: 'Serializable' }
      )
    } catch (error: unknown) {
      // P2002 on IdempotencyKey.key = the same (orderId, nonce) has already
      // been processed by a prior payment-success webhook. Return success so
      // the (internal) caller treats it as idempotent.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = (error.meta?.target as string[] | undefined)?.join(',') ?? ''
        if (target.includes('key')) {
          return NextResponse.json({
            success: true,
            alreadyConfirmed: true,
            orderId,
          })
        }
      }
      throw error
    }

    if (txResult.type === 'already_confirmed') {
      return NextResponse.json({
        success: true,
        alreadyConfirmed: true,
        orderId,
      })
    }
    if (txResult.type === 'not_found') {
      return NextResponse.json(
        { error: 'order_not_found' },
        { status: 404 }
      )
    }
    if (txResult.type === 'invalid_status') {
      return NextResponse.json(
        { error: 'invalid_status', current: txResult.current },
        { status: 400 }
      )
    }

    // txResult.type === 'updated' — fire n8n webhook OUTSIDE the
    // transaction so a slow n8n doesn't hold the Serializable lock.
    try {
      await triggerOrderConfirmedWebhook(txResult.orderId)
    } catch (webhookError) {
      // Log failure but don't fail the request — the booking is already
      // confirmed; n8n failure is a separate concern.
      console.error('n8n webhook failed:', webhookError)
      await db.securityLog.create({
        data: {
          event: 'n8n_webhook_failed',
          details: JSON.stringify({
            orderId: txResult.orderId,
            error: webhookError instanceof Error ? webhookError.message : 'unknown',
          }),
        },
      })
    }

    return NextResponse.json({
      success: true,
      orderId,
      status: 'CONFIRMED',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error'
    console.error('Payment success error:', message)
    return NextResponse.json(
      { error: 'internal_error' },
      { status: 500 }
    )
  }
}
