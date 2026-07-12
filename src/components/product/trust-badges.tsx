import { useTranslations } from 'next-intl'
import { Truck, ShieldCheck, RefreshCw, Star } from 'lucide-react'

export function TrustBadges() {
  const t = useTranslations()

  const badges = [
    { icon: Truck, label: t('product.trustBadges.delivery') },
    { icon: ShieldCheck, label: t('product.trustBadges.insurance') },
    { icon: RefreshCw, label: t('product.trustBadges.refund') },
    { icon: Star, label: t('product.trustBadges.quality') },
  ]

  return (
    <section className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
      {badges.map((badge, idx) => {
        const Icon = badge.icon
        return (
          <div
            key={idx}
            className="flex items-center gap-3 p-4 rounded-md bg-stone-50 border border-border"
          >
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-gold" />
            </div>
            <span className="text-xs font-medium text-foreground leading-tight">
              {badge.label}
            </span>
          </div>
        )
      })}
    </section>
  )
}
