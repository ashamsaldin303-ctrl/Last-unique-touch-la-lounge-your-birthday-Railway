import type { Metadata } from 'next'
import { SuccessView } from '@/components/checkout/success-view'

interface PageProps {
  searchParams: Promise<{ order?: string }>
}

// R2E-3: Success page must not be indexed — `?order=ID` query strings
// would otherwise leak customer order IDs into the search index.
export const metadata: Metadata = {
  title: 'Order Confirmed',
  robots: { index: false, follow: false },
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const { order } = await searchParams
  return (
    // FIX-1A: <Navbar /> and <Footer /> are now rendered by the layout.
    <div className="min-h-[100dvh] bg-background">
      <SuccessView orderId={order} />
    </div>
  )
}
