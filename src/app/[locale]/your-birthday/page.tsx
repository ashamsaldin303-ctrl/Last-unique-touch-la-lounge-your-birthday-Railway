import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import YourBirthdayPageClient from './page-client'
import { buildMetadata } from '@/lib/seo'
import { getProducts } from '@/lib/products'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations()
  return buildMetadata({
    locale: locale as 'ar' | 'en',
    path: '/your-birthday',
    title: t('brandSelector.birthday.name'),
    description: t('brandSelector.birthday.desc'),
  })
}

export default async function Page() {
  // Fetch the first 4 YOUR_BIRTHDAY products server-side and pass them as a
  // plain serializable payload to the client view. This avoids shipping the
  // Prisma client / DB driver to the browser and keeps the heavy 3D + scramble
  // view client-only while still letting it render real product data.
  const result = await getProducts({
    brand: 'YOUR_BIRTHDAY',
    page: 1,
    pageSize: 4,
    sort: 'newest',
  })

  // Strip Date fields (createdAt/updatedAt) so the payload is JSON-safe when
  // crossing the server→client boundary. Only the fields the card needs are
  // forwarded.
  const featuredProducts = result.products.map((p) => ({
    id: p.id,
    slug: p.slug,
    nameAr: p.nameAr,
    nameEn: p.nameEn,
    descriptionAr: p.descriptionAr,
    descriptionEn: p.descriptionEn,
    rentalPricePerDay: p.rentalPricePerDay,
    securityDeposit: p.securityDeposit,
    images: p.images,
    model3dUrl: p.model3dUrl,
    stock: p.stock,
    category: {
      nameAr: p.category.nameAr,
      nameEn: p.category.nameEn,
      slug: p.category.slug,
    },
  }))

  return <YourBirthdayPageClient products={featuredProducts} />
}
