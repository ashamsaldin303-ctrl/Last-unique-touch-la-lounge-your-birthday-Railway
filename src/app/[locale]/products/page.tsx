import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ProductsFilters } from '@/components/products/products-filters'
import { ProductsPageContent } from '@/components/products/products-page-content'
import { ProductsGridSkeleton } from '@/components/products/products-grid-skeleton'
import { getCategoriesByBrand, getProducts } from '@/lib/products'
import type { ProductSort } from '@/lib/products'
import { buildMetadata } from '@/lib/seo'

interface PageProps {
  searchParams: Promise<{
    category?: string
    q?: string
    sort?: string
    page?: string
  }>
  params: Promise<{ locale: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations()
  return buildMetadata({
    locale: locale as 'ar' | 'en',
    path: '/products',
    title: t('products.title'),
    description: t('products.subtitle'),
  })
}

export default async function ProductsPage({ searchParams, params }: PageProps) {
  const t = await getTranslations()
  await params // consume the promise

  const search = await searchParams

  const categorySlug = search.category || undefined
  const searchQuery = search.q || undefined
  const sort: ProductSort =
    search.sort === 'price-asc' || search.sort === 'price-desc'
      ? search.sort
      : 'newest'
  const page = search.page ? Math.max(1, parseInt(search.page, 10) || 1) : 1

  // Storefront always shows LUT products — explicit brand keeps the multi-tenant
  // `getProducts()` (which no longer defaults to LUT) scoped correctly.
  const [categories, result] = await Promise.all([
    getCategoriesByBrand('LUT'),
    getProducts({ brand: 'LUT', categorySlug, search: searchQuery, sort, page }),
  ])

  return (
    // FIX-1A: <Navbar /> and <Footer /> are now rendered by the layout.
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            {t('products.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('products.subtitle')}
          </p>
        </div>

        {/* Filters */}
        <ProductsFilters
          categories={categories}
          activeCategory={categorySlug}
          search={searchQuery}
          sort={sort}
        />

        {/* Content with suspense */}
        <Suspense fallback={<ProductsGridSkeleton />}>
          <ProductsPageContent
            products={result.products}
            total={result.total}
            page={result.page}
            totalPages={result.totalPages}
            categorySlug={categorySlug}
            search={searchQuery}
            sort={sort}
          />
        </Suspense>
      </div>
    </div>
  )
}
