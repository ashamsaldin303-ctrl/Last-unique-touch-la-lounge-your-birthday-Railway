import { useTranslations } from 'next-intl'
import type { ProductWithImages } from '@/lib/products'
import { ProductCard } from '@/components/landing/product-card'

interface RelatedProductsProps {
  products: ProductWithImages[]
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  const t = useTranslations()

  if (products.length === 0) return null

  return (
    <section className="mt-16 pt-12 border-t border-border">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        {t('product.related')}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
