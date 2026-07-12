'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, useRouter } from '@/i18n/routing'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { AlertCircle, ShieldCheck, CreditCard, ArrowLeft, ArrowRight, Phone, Clock } from 'lucide-react'
import { useCart } from '@/components/providers/cart-provider'
import { localizedName } from '@/lib/products'

interface PaymentViewProps {
  orderId?: string
}

/**
 * "Pay on Confirmation" payment view.
 *
 * The previous implementation collected card number, CVV, and expiry
 * directly — a serious PCI risk. Per the fix-v2-group-cd task we now:
 *
 *   • Capture NO card data on the client.
 *   • Show an informational "we'll call you to collect payment" banner.
 *   • Keep the order summary + a single "Confirm Order" button that, on
 *     click, clears the cart and routes the customer to the success page.
 *
 * The actual Booking row is already created by the previous step
 * (`/checkout` → `POST /api/orders`) and arrives here as `orderId`.
 * The order is stored in `PENDING` status — our team will call the
 * customer to collect payment and then flip it to `CONFIRMED`.
 */
export function PaymentView({ orderId }: PaymentViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const { items, hydrated, total, clear } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight

  // No order ID — can't proceed
  if (!orderId) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          {t('payment.errors.order_not_found')}
        </h1>
        <Button asChild className="bg-lut hover:bg-lut/90 text-white">
          <Link href="/products">
            {t('cart.empty.cta')}
            <ArrowIcon className="w-4 h-4 ms-2" />
          </Link>
        </Button>
      </div>
    )
  }

  const onConfirmOrder = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      // The Booking was already created at the /checkout step via
      // POST /api/orders. Per the "Pay on Confirmation" flow we simply
      // clear the cart and route to the success page — no payment
      // webhook is invoked. Our team will reach out to collect payment
      // and flip the booking status to CONFIRMED.
      clear()
      router.push(`/checkout/success?order=${orderId}`)
    } catch {
      setErrorMessage(t('payment.errors.paymentFailed'))
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pt-24">
      <h1 className="text-3xl font-bold text-foreground mb-8">
        {t('payment.title')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pay-on-confirmation panel */}
        <div className="lg:col-span-2">
          {/* Order info card */}
          <div className="p-4 rounded-md bg-stone-50 border border-border mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('payment.orderId', { id: orderId.slice(-8) })}
                </p>
                <p className="text-xl font-bold text-lut mt-1">
                  {t('payment.total', { amount: total.toFixed(3) })}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-gold" />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {t('payment.displayNote')}
            </p>
          </div>

          {/* Pay on confirmation message + confirm button */}
          <div className="space-y-5 p-6 rounded-md bg-card border border-border">
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2 p-3 rounded-md bg-lut/10 border border-lut/30 text-lut text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 rounded-md bg-gold/5 border border-gold/20">
              <Phone className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">
                  {t('payment.payOnConfirmation.title')}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('payment.payOnConfirmation.body')}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                  <Clock className="w-3.5 h-3.5" />
                  {t('payment.payOnConfirmation.note')}
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={onConfirmOrder}
              disabled={submitting}
              className="w-full bg-lut hover:bg-lut/90 text-white py-3 text-base font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? t('payment.form.processing')
                : t('payment.confirmOrder')}
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="flex items-center gap-2 p-3 rounded-md bg-card border border-border">
              <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
              <span className="text-xs text-foreground">
                {t('payment.trust.fraud')}
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-md bg-card border border-border">
              <Phone className="w-4 h-4 text-gold shrink-0" />
              <span className="text-xs text-foreground">
                {t('payment.trust.ssl')}
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-md bg-card border border-border">
              <CreditCard className="w-4 h-4 text-gold shrink-0" />
              <span className="text-xs text-foreground">
                {t('payment.trust.cards')}
              </span>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-md bg-stone-50 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4">
              {t('payment.orderSummary')}
            </h2>

            {/* Items */}
            {hydrated && items.length > 0 ? (
              <div className="space-y-3 mb-4 pb-4 border-b border-border max-h-64 overflow-y-auto">
                {items.map((item, index) => {
                  const productName = localizedName(item.nameAr, item.nameEn, locale)
                  return (
                    <div key={index} className="flex gap-3">
                      <div className="relative w-14 h-14 shrink-0 rounded-md overflow-hidden bg-muted">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={productName}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="w-full h-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-foreground shrink-0">
                        {item.total.toFixed(3)}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mb-4">
                {t('payment.emptyCart')}
              </p>
            )}

            {/* Total */}
            <div className="flex justify-between items-center py-3 border-t border-border">
              <span className="font-bold text-foreground">
                {t('checkout.summary.total')}
              </span>
              <span className="text-xl font-bold text-lut">
                {t('payment.total', { amount: total.toFixed(3) })}
              </span>
            </div>

            <Button asChild variant="outline" className="w-full mt-4 border-border">
              <Link href="/cart">
                <ArrowIcon className="w-4 h-4 me-2" />
                {t('payment.backToCart')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
