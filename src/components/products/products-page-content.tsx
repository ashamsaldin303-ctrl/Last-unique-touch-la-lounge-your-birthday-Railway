import { useTranslations } from 'next-intl'
import { ProductCard } from '@/components/landing/product-card'
import { Pagination } from '@/components/products/pagination'
import { EmptyState } from '@/components/products/empty-state'
import type { ProductWithImages, ProductSort } from '@/lib/products'

interface ProductsPageContentProps {
  products: ProductWithImages[]
  total: number
  page: number
  totalPages: number
  categorySlug?: string
  search?: string
  sort: ProductSort
}

export function ProductsPageContent({
  products,
  total,
  page,
  totalPages,
  categorySlug,
  search,
  sort,
}: ProductsPageContentProps) {
  const t = useTranslations()

  return (
    <div>
      {/* Result count */}
      <div className="mb-6 text-sm text-muted-foreground">
        {t('products.resultCount', { count: total })}
      </div>

      {/* Grid or Empty state */}
      {products.length === 0 ? (
        <EmptyState search={search} categorySlug={categorySlug} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            categorySlug={categorySlug}
            search={search}
            sort={sort}
          />
        </>
      )}
    </div>
  )
}
