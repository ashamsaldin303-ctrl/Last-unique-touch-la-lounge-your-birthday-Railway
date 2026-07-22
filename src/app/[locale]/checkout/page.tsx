import type { Metadata } from 'next'
import { CheckoutView } from '@/components/checkout/checkout-view'

// R2E-3: Checkout flow must not be indexed. The success page also leaks
// `?order=ID` query strings — keeping all three checkout routes noindex
// prevents customer order IDs from appearing in search results.
export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
}

export default function CheckoutPage() {
  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <CheckoutView />
      </div>
    </div>
  )
}
