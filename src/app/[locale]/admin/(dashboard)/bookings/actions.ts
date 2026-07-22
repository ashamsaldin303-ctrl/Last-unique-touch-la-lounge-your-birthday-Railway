'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getAdminBrand } from '@/lib/admin-brand'
import { revalidatePath } from 'next/cache'
import { triggerOrderConfirmedWebhook } from '@/lib/n8n'

//   - PENDING → CONFIRMED | PAYMENT_FAILED | CANCELLED
//   - PAYMENT_FAILED → PENDING (retry) | CANCELLED
//   - CONFIRMED → COMPLETED | CANCELLED
//   - CANCELLED / COMPLETED → (terminal, no transitions)
// A CONFIRMED booking CANNOT be downgraded to PAYMENT_FAILED by admin
// (the payment already succeeded) — only the payment webhook can set
// PAYMENT_FAILED, and only from PENDING.
const validTransitions: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  CANCELLED: [],
  COMPLETED: [],
}

// v29-fix-F7 Fix #1: validate inputs with Zod. Booking.id is a cuid (24
// chars); 100 is a safe upper bound that rejects any obviously-malformed
// payload while still allowing future ID format changes. The status enum
// mirrors the union type above so a stray string can never reach the
// state-machine lookup (which would otherwise silently return
// `invalid_transition` for unknown statuses — a confusing error for
// admin UI callers, and a defense-in-depth guard against a malformed
// client payload).
const updateBookingStatusSchema = z.object({
  bookingId: z.string().min(1).max(100),
  newStatus: z.enum(['PENDING', 'CONFIRMED', 'PAYMENT_FAILED', 'CANCELLED', 'COMPLETED']),
})

export async function updateBookingStatusAction(
  bookingId: string,
  newStatus: 'PENDING' | 'CONFIRMED' | 'PAYMENT_FAILED' | 'CANCELLED' | 'COMPLETED'
): Promise<{ success: boolean; error?: string }> {
  await requireAuth()

  // Validate inputs defensively. Server actions are publicly-invokable
  // RPC endpoints — never trust the client to send well-formed values
  // even though the admin UI constrains the dropdown.
  const parsed = updateBookingStatusSchema.safeParse({ bookingId, newStatus })
  if (!parsed.success) {
    return { success: false, error: 'invalid_input' }
  }

  const brand = await getAdminBrand()

  try {
    // Scope by brand to prevent cross-tenant mutation
    const booking = await db.booking.findFirst({ where: { id: parsed.data.bookingId, brand } })
    if (!booking) return { success: false, error: 'not_found' }

    if (!validTransitions[booking.status]?.includes(parsed.data.newStatus)) {
      return { success: false, error: 'invalid_transition' }
    }

    await db.booking.update({
      where: { id: parsed.data.bookingId },
      data: { status: parsed.data.newStatus },
    })

    await db.securityLog.create({
      data: {
        event: 'booking_status_changed',
        details: JSON.stringify({
          bookingId: parsed.data.bookingId,
          from: booking.status,
          to: parsed.data.newStatus,
        }),
      },
    })

    // Trigger n8n webhook when booking is confirmed (Telegram + Google Calendar + invoice email).
    // Wrapped in try/catch so a webhook failure never breaks the booking flow.
    // previously PAYMENT_FAILED → PENDING → CONFIRMED (the retry path).
    if (parsed.data.newStatus === 'CONFIRMED') {
      try {
        await triggerOrderConfirmedWebhook(parsed.data.bookingId)
      } catch {
        console.error('[n8n] Failed to trigger order-confirmed webhook:')
      }
    }

    revalidatePath('/admin/bookings')
    revalidatePath(`/admin/bookings/${parsed.data.bookingId}`)
    return { success: true }
  } catch {
    console.error('Update booking status error:')
    return { success: false, error: 'internal_error' }
  }
}
