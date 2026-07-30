'use client'

import { ShoppingCart } from 'lucide-react'
import { useRouter } from '@/i18n/routing'
import { useCart } from '@/components/providers/cart-provider'
import { useTranslations } from 'next-intl'

export function CartButton() {
  const t = useTranslations()
  const router = useRouter()
  const { count } = useCart()

  return (
    <button
      onClick={() => router.push('/cart')}
      className="relative flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shrink-0 min-w-[44px] min-h-[44px]"
      aria-label={t('cart.title')}
    >
      <ShoppingCart className="w-5 h-5" />
      <span className="hidden sm:inline text-sm font-medium">
        {t('cart.title')}
      </span>
      {count > 0 && (
        <span className="absolute -top-2 -end-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  )
}
