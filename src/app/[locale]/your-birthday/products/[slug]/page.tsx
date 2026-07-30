import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Brand } from '@prisma/client'
import { db } from '@/lib/db'
import { getProductBySlug, getRelatedProducts } from '@/lib/products'
import { Breadcrumbs } from '@/components/product/breadcrumbs'
import { ProductGallery } from '@/components/product/product-gallery'
import { Product3DViewer } from '@/components/product/product-3d-viewer'
import { ProductInfo } from '@/components/product/product-info'
import { RelatedProducts } from '@/components/product/related-products'
import { TrustBadges } from '@/components/product/trust-badges'
import { JsonLd } from '@/components/seo/json-ld'
import { buildMetadata } from '@/lib/seo'

interface PageProps {
  params: Promise<{ slug: string; locale: string }>
}

// Same defensive-routing strategy as the LUT product page — only slugs
// returned by `generateStaticParams` (active YOUR_BIRTHDAY products) reach
// the page; everything else 404s with a correct HTTP status. This prevents
// soft-404s in the standalone build and keeps cross-tenant URLs (LUT /
// LA_LOUNGE) from leaking through the YOUR_BIRTHDAY storefront.
export const dynamicParams = false

export async function generateStaticParams() {
  try {
    const products = await db.product.findMany({
      where: { brand: 'YOUR_BIRTHDAY', isActive: true },
      select: { slug: true },
    })
    return products.map((p) => ({ slug: p.slug }))
  } catch (error) {
    console.warn('[generateStaticParams] DB query failed, returning []:', error)
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug, locale } = await params
  const product = await getProductBySlug(slug, 'YOUR_BIRTHDAY')
  if (!product) {
    return buildMetadata({
      locale: locale as 'ar' | 'en',
      path: '/your-birthday/products',
    })
  }

  return buildMetadata({
    locale: locale as 'ar' | 'en',
    path: `/your-birthday/products/${slug}`,
    title: locale === 'ar' ? product.nameAr : product.nameEn,
    description: locale === 'ar' ? product.descriptionAr : product.descriptionEn,
    image: product.images[0],
  })
}

export default async function YourBirthdayProductPage({ params }: PageProps) {
  const { slug, locale } = await params

  const product = await getProductBySlug(slug, 'YOUR_BIRTHDAY')

  if (!product) {
    notFound()
  }

  const related = await getRelatedProducts(
    product.id,
    product.categoryId,
    product.brand as Brand
  )

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nameEn,
    description: product.descriptionEn,
    image: product.images,
    sku: product.id,
    brand: { '@type': 'Brand', name: 'Your Birthday' },
    category: product.category.nameEn,
    offers: {
      '@type': 'Offer',
      price: product.rentalPricePerDay,
      priceCurrency: 'KWD',
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: product.rentalPricePerDay,
        priceCurrency: 'KWD',
        unitText: 'per day',
      },
    },
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${baseUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Birthday Products',
        item: `${baseUrl}/${locale}/your-birthday/products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.category.nameEn,
        item: `${baseUrl}/${locale}/your-birthday/products?category=${product.category.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: product.nameEn,
        item: `${baseUrl}/${locale}/your-birthday/products/${slug}`,
      },
    ],
  }

  return (
    <>
      <JsonLd data={productLd} />
      <JsonLd data={breadcrumbLd} />
      <div className="min-h-[100dvh] bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <Breadcrumbs
            categorySlug={product.category.slug}
            categoryNameAr={product.category.nameAr}
            categoryNameEn={product.category.nameEn}
            productName={locale === 'ar' ? product.nameAr : product.nameEn}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Gallery + 3D */}
            <div>
              <ProductGallery
                images={product.images}
                model3dUrl={product.model3dUrl}
                productName={product.nameAr}
              />
              {product.model3dUrl && (
                <Product3DViewer
                  productSlug={product.slug}
                  model3dUrl={product.model3dUrl}
                />
              )}
            </div>

            {/* Right: Product Info */}
            <div>
              <ProductInfo product={product} />
            </div>
          </div>

          <TrustBadges />

          {related.length > 0 && <RelatedProducts products={related} />}
        </div>
      </div>
    </>
  )
}
