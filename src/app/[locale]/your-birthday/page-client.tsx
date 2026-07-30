'use client'

import { useRouter } from '@/i18n/routing'
import YourBirthdayView, {
  type FeaturedProduct,
} from '@/components/your-birthday/your-birthday-view'

export type { FeaturedProduct }

export default function YourBirthdayPageClient({
  products,
}: {
  products: FeaturedProduct[]
}) {
  const router = useRouter()
  return (
    <YourBirthdayView onBack={() => router.push('/')} products={products} />
  )
}
