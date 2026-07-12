import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { CartView } from '@/components/cart/cart-view'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as 'ar' | 'en' })
  return buildMetadata({
    locale: locale as 'ar' | 'en',
    path: '/cart',
    title: t('cart.title'),
    noIndex: true,
  })
}

export default function CartPage() {
  return (
    // FIX-1A: <Navbar /> and <Footer /> are now rendered by the layout.
    // `pt-24` clears the fixed navbar (h-16 + a bit of breathing room).
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <CartView />
      </div>
    </div>
  )
}
