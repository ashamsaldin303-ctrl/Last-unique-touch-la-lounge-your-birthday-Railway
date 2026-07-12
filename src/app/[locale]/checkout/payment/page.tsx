import type { Metadata } from 'next'
import { PaymentView } from '@/components/checkout/payment-view'

interface PageProps {
  searchParams: Promise<{ order?: string }>
}

// R2E-3: Payment page must not be indexed. Contains order IDs in `?order=`.
export const metadata: Metadata = {
  title: 'Payment',
  robots: { index: false, follow: false },
}

export default async function PaymentPage({ searchParams }: PageProps) {
  const { order } = await searchParams
  return (
    // FIX-1A: <Navbar /> and <Footer /> are now rendered by the layout.
    <div className="min-h-[100dvh] bg-background">
      <PaymentView orderId={order} />
    </div>
  )
}
