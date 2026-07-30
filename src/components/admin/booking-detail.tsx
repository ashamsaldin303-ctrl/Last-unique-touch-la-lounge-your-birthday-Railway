'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowLeft, Check, X, CheckCheck, Loader2 } from 'lucide-react'
import { useToast } from '@/components/providers/toast-provider'
import { updateBookingStatusAction } from '@/app/[locale]/admin/(dashboard)/bookings/actions'
import { localizedName } from '@/lib/products'
import { formatDate } from '@/lib/format-date'

interface BookingDetailData {
  id: string
  status: string
  startDate: string
  endDate: string
  totalAmount: number
  currency: string
  createdAt: string
  customerName: string
  customerPhone: string
  customerEmail: string
  // in this date range (V9 Fix #4). The page query in
  // src/app/[locale]/admin/(dashboard)/bookings/[id]/page.tsx should pass
  // this through from `booking.quantity`. It's optional here so the
  // component degrades gracefully if a caller forgets to forward it
  // (defaults to 1). The financial breakdown below multiplies rental &
  // deposit by quantity — without this the displayed breakdown is wrong
  // for any multi-unit booking (e.g. 5 chairs × 3 days).
  quantity?: number
  product: {
    nameAr: string
    nameEn: string
    slug: string
    rentalPricePerDay: number
    securityDeposit: number
    categoryNameAr: string
    categoryNameEn: string
  } | null
}

interface BookingDetailProps {
  booking: BookingDetailData
  locale: string
}

// semantic palette (amber=pending, emerald=confirmed/completed,
// rose=failed, muted=cancelled). Includes PAYMENT_FAILED so the detail
// page renders a distinct rose badge instead of falling through to the
// default. Previously COMPLETED used forbidden `bg-blue-100 text-blue-700`
// (R2-D S-C5) — switched to emerald to match the rest of the palette.
const statusBadgeColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  PAYMENT_FAILED: 'bg-rose-100 text-rose-700',
  CANCELLED: 'bg-muted text-muted-foreground',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
}

export function BookingDetail({ booking, locale }: BookingDetailProps) {
  const t = useTranslations()
  const { showToast } = useToast()
  const router = useRouter()
  const [updating, setUpdating] = useState(false)
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight

  const days = Math.max(
    1,
    Math.ceil(
      (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (24 * 60 * 60 * 1000)
    )
  )

  // chairs × 3 days) show the correct breakdown. Defaults to 1 for
  // backward compatibility with callers that don't forward `quantity`.
  const quantity = booking.quantity && booking.quantity > 0 ? booking.quantity : 1

  const rentalAmount = booking.product
    ? booking.product.rentalPricePerDay * days * quantity
    : booking.totalAmount
  const depositAmount = booking.product
    ? booking.product.securityDeposit * quantity
    : 0

  const handleStatusChange = async (
    newStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  ) => {
    setUpdating(true)
    const result = await updateBookingStatusAction(booking.id, newStatus)
    setUpdating(false)

    if (result.success) {
      showToast('success', t('admin.bookings.statusChanged'))
      router.refresh()
    } else {
      const errorKey = result.error === 'invalid_transition'
        ? 'admin.bookings.invalidTransition'
        : 'admin.errors.internal_error'
      showToast('error', t(errorKey))
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back link */}
      <Link
        href="/admin/bookings"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-lut transition-colors"
      >
        <ArrowIcon className="w-4 h-4 rotate-180" />
        {t('admin.bookings.title')}
      </Link>

      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('admin.bookings.detail.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono" dir="ltr"><bdi>#{booking.id}</bdi></p>
        </div>
        <span className={`px-3 py-1.5 rounded-md text-sm font-medium ${
          statusBadgeColors[booking.status] ?? 'bg-muted text-muted-foreground'
        }`}>
          {t(`admin.bookings.filterStatus.${booking.status}` as const)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer info */}
        <div className="p-6 rounded-md bg-card border border-border">
          <h2 className="text-lg font-bold text-foreground mb-4">{t('admin.bookings.detail.customerInfo')}</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-muted-foreground">{t('admin.bookings.detail.name')}</dt>
              <dd className="text-sm font-medium text-foreground">{booking.customerName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('admin.bookings.detail.phone')}</dt>
              <dd className="text-sm font-medium text-foreground" dir="ltr"><bdi>{booking.customerPhone}</bdi></dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('admin.bookings.detail.email')}</dt>
              <dd className="text-sm font-medium text-foreground" dir="ltr"><bdi>{booking.customerEmail}</bdi></dd>
            </div>
          </dl>
        </div>

        {/* Rental info */}
        <div className="p-6 rounded-md bg-card border border-border">
          <h2 className="text-lg font-bold text-foreground mb-4">{t('admin.bookings.detail.rentalInfo')}</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-muted-foreground">{t('admin.bookings.detail.product')}</dt>
              <dd className="text-sm font-medium text-foreground">
                {booking.product
                  ? localizedName(booking.product.nameAr, booking.product.nameEn, locale)
                  : t('admin.birthdayPackage')}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('admin.bookings.detail.startDate')}</dt>
              {/* v29-fix-F7 Fix #7: locale-aware date formatting
                  (was `booking.startDate.split('T')[0]` — locale-neutral ISO). */}
              <dd className="text-sm font-medium text-foreground">{formatDate(booking.startDate, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('admin.bookings.detail.endDate')}</dt>
              <dd className="text-sm font-medium text-foreground">{formatDate(booking.endDate, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('admin.bookings.detail.days')}</dt>
              <dd className="text-sm font-medium text-foreground">{days}</dd>
            </div>
            {/* FIX-1C Fix 2: show the booked quantity so multi-unit bookings
                (e.g. 5 chairs) are visually distinct from single-unit ones.
                Reuses the existing cart.item.quantity label so no new i18n
                key is needed. */}
            <div>
              <dt className="text-xs text-muted-foreground">{t('cart.item.quantity')}</dt>
              <dd className="text-sm font-medium text-foreground">{quantity}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Financial summary */}
      <div className="p-6 rounded-md bg-stone-50 border border-border">
        <h2 className="text-lg font-bold text-foreground mb-4">{t('admin.bookings.detail.financialSummary')}</h2>
        <div className="space-y-2 max-w-md">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('admin.bookings.detail.rental')}</span>
            {/* FIX-4A (R3-C-1): use the locale-aware currency label
                (t('common.currency') → "KWD" / "د.ك") instead of the raw
                DB string `booking.currency` which always prints "KWD", even
                in Arabic admin. */}
            <span className="font-medium text-foreground">{rentalAmount.toFixed(3)} {t('common.currency')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('admin.bookings.detail.deposit')}</span>
            <span className="font-medium text-foreground">{depositAmount.toFixed(3)} {t('common.currency')}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="font-bold text-foreground">{t('admin.bookings.detail.total')}</span>
            <span className="text-lg font-bold text-lut">{booking.totalAmount.toFixed(3)} {t('common.currency')}</span>
          </div>
        </div>
      </div>

      {/* Status change buttons */}
      <div className="p-6 rounded-md bg-card border border-border">
        <h2 className="text-lg font-bold text-foreground mb-4">{t('admin.bookings.detail.changeStatus')}</h2>
        <div className="flex flex-wrap gap-3">
          {booking.status === 'PENDING' && (
            <>
              <Button
                onClick={() => handleStatusChange('CONFIRMED')}
                disabled={updating}
                className="bg-emerald-600 hover:bg-emerald-700 text-primary-foreground"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 me-2" />}
                {t('admin.bookings.detail.confirm')}
              </Button>
              <Button
                onClick={() => handleStatusChange('CANCELLED')}
                disabled={updating}
                variant="outline"
                className="border-rose-300 text-rose-600 hover:bg-rose-50"
              >
                <X className="w-4 h-4 me-2" />
                {t('admin.bookings.detail.cancel')}
              </Button>
            </>
          )}
          {booking.status === 'CONFIRMED' && (
            <>
              <Button
                onClick={() => handleStatusChange('COMPLETED')}
                disabled={updating}
                className="bg-emerald-600 hover:bg-emerald-700 text-primary-foreground"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4 me-2" />}
                {t('admin.bookings.detail.complete')}
              </Button>
              <Button
                onClick={() => handleStatusChange('CANCELLED')}
                disabled={updating}
                variant="outline"
                className="border-rose-300 text-rose-600 hover:bg-rose-50"
              >
                <X className="w-4 h-4 me-2" />
                {t('admin.bookings.detail.cancel')}
              </Button>
            </>
          )}
          {/* V9 Fix #6: PAYMENT_FAILED bookings can be retried (back to PENDING,
              so the customer can attempt payment again) or cancelled. */}
          {booking.status === 'PAYMENT_FAILED' && (
            <>
              <Button
                onClick={() => handleStatusChange('PENDING')}
                disabled={updating}
                className="bg-amber-600 hover:bg-amber-700 text-primary-foreground"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 me-2" />}
                {t('admin.bookings.detail.retryPayment')}
              </Button>
              <Button
                onClick={() => handleStatusChange('CANCELLED')}
                disabled={updating}
                variant="outline"
                className="border-rose-300 text-rose-600 hover:bg-rose-50"
              >
                <X className="w-4 h-4 me-2" />
                {t('admin.bookings.detail.cancel')}
              </Button>
            </>
          )}
          {(booking.status === 'CANCELLED' || booking.status === 'COMPLETED') && (
            <p className="text-sm text-muted-foreground">
              {t('admin.bookings.terminalState')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
