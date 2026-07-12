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

// V10 Fix #1: `dynamicParams = false` makes Next.js return a real HTTP 404
// at the routing level for any slug NOT in `generateStaticParams`. This is
// the most reliable way to get a 404 status code in the standalone build —
// `notFound()` inside the page component was rendering the 404 body but
// the standalone server was sending a 200 status (soft-404).
//
// Trade-off: products added after build won't be reachable until the next
// build. This is acceptable for this project — products are managed by
// admin and the build can be triggered via `.zscripts/build.sh`. The
// benefit (correct 404 status for SEO) outweighs the cost.
//
// `notFound()` is kept as a defense-in-depth fallback for the rare case
// where a product exists in `generateStaticParams` but becomes inactive
// between build and request.
export const dynamicParams = false

export async function generateStaticParams() {
  // V9 Fix #2: only LUT products are reachable from the LUT storefront.
  // Pre-rendering La Lounge / Your Birthday slugs here would let search
  // engines index cross-tenant URLs and leak brand data.
  //
  // Perf fix: wrap in try/catch so an empty / unavailable DB at build time
  // returns [] (mirrors `src/app/sitemap.ts:28-35`) instead of failing the
  // entire Next.js build.
  try {
    const products = await db.product.findMany({
      where: { brand: 'LUT', isActive: true },
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
  // V9 Fix #2: scope by brand='LUT' so a La Lounge slug returns 404
  // (no metadata) instead of leaking the La Lounge product's name/description.
  const product = await getProductBySlug(slug, 'LUT')
  if (!product) return buildMetadata({ locale: locale as 'ar' | 'en', path: '/products' })

  return buildMetadata({
    locale: locale as 'ar' | 'en',
    path: `/products/${slug}`,
    title: locale === 'ar' ? product.nameAr : product.nameEn,
    description: locale === 'ar' ? product.descriptionAr : product.descriptionEn,
    image: product.images[0],
  })
}

export default async function ProductPage({ params }: PageProps) {
  const { slug, locale } = await params

  // V9 Fix #2: scope by brand='LUT' so cross-tenant slugs 404 instead of
  // rendering La Lounge / Your Birthday products on the LUT storefront.
  const product = await getProductBySlug(slug, 'LUT')

  if (!product) {
    notFound()
  }

  // V9 Fix #2: pass the product's own brand to getRelatedProducts so we
  // never surface related items from another tenant (defense-in-depth —
  // since getProductBySlug already scoped to LUT, product.brand is LUT,
  // but this keeps the function correct if it's ever called from a
  // multi-brand admin view).
  const related = await getRelatedProducts(product.id, product.categoryId, product.brand as Brand)

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nameEn,
    description: product.descriptionEn,
    image: product.images,
    sku: product.id,
    brand: { '@type': 'Brand', name: 'Last Unique Touch' },
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

  // R2E-10: BreadcrumbList JSON-LD mirroring the visible Breadcrumbs
  // component so search engines can render breadcrumb rich results.
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
        name: 'Products',
        item: `${baseUrl}/${locale}/products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.category.nameEn,
        item: `${baseUrl}/${locale}/products?category=${product.category.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: product.nameEn,
        item: `${baseUrl}/${locale}/products/${slug}`,
      },
    ],
  }

  return (
    // FIX-1A: <Navbar /> and <Footer /> are now rendered by the layout.
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
                <Product3DViewer productSlug={product.slug} model3dUrl={product.model3dUrl} />
              )}
            </div>

            {/* Right: Product Info */}
            <div>
              <ProductInfo product={product} />
            </div>
          </div>

          <TrustBadges />

          {related.length > 0 && (
            <RelatedProducts products={related} />
          )}
        </div>
      </div>
    </>
  )
}
