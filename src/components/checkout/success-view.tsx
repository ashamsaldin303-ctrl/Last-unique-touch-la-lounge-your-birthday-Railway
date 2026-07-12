import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowLeft, ArrowRight, Phone, Package, Truck, CheckCheck, Mail, CalendarPlus } from 'lucide-react'

interface SuccessViewProps {
  orderId?: string
}

export function SuccessView({ orderId }: SuccessViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight

  const steps = [
    { icon: Package, key: 'step1' as const },
    { icon: Phone, key: 'step2' as const },
    { icon: Truck, key: 'step3' as const },
    { icon: Mail, key: 'step4' as const },
    { icon: CalendarPlus, key: 'step5' as const },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
      {/* Success icon */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground mb-3">
        {t('checkout.success.title')}
      </h1>

      {/* Order ID */}
      {orderId && (
        <p className="text-sm font-medium text-muted-foreground mb-2">
          {t('checkout.success.orderId', { id: orderId })}
        </p>
      )}

      {/* Subtitle */}
      <p className="text-muted-foreground mb-10 max-w-md mx-auto">
        {t('checkout.success.subtitle')}
      </p>

      {/* Next steps card */}
      <div className="p-6 rounded-md bg-stone-50 border border-border text-start mb-8">
        <h2 className="text-lg font-bold text-foreground mb-4 text-center">
          {t('checkout.success.nextSteps.title')}
        </h2>

        <div className="space-y-4">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-lut/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-lut" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t(`checkout.success.nextSteps.${step.key}`)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild className="bg-lut hover:bg-lut/90 text-white">
          <Link href="/">
            <ArrowIcon className="w-4 h-4 me-2" />
            {t('checkout.success.goHome')}
          </Link>
        </Button>
        <Button asChild variant="outline" className="border-border">
          <Link href="/products">
            <CheckCheck className="w-4 h-4 me-2" />
            {t('checkout.success.browseMore')}
          </Link>
        </Button>
      </div>
    </div>
  )
}
