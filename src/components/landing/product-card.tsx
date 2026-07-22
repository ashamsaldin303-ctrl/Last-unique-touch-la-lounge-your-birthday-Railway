import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { localizedName } from '@/lib/products'
import type { ProductWithImages } from '@/lib/products'

export function ProductCard({ product }: { product: ProductWithImages }) {
  const t = useTranslations()
  const locale = useLocale()

  const firstImage = product.images[0]
  const productName = localizedName(product.nameAr, product.nameEn, locale)
  const categoryName = localizedName(
    product.category.nameAr,
    product.category.nameEn,
    locale
  )
  const isOutOfStock = product.stock === 0

  // Arrow direction follows the locale's reading direction: AR → ArrowLeft,
  // EN → ArrowRight. Renders on the CTA's trailing edge.
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block"
    >
      <div className="rounded-md overflow-hidden bg-card border border-border transition-shadow duration-300 hover:shadow-luxury-lg">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          {firstImage ? (
            <Image
              src={firstImage}
              alt={productName}
              fill
              className="object-cover transition-opacity duration-500 group-hover:opacity-95"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
              {t('common.noImage')}
            </div>
          )}

          {/* 3D badge (top-end) */}
          {product.model3dUrl && (
            <Badge className="absolute top-2 end-2 bg-primary text-primary-foreground text-xs border-0">
              3D
            </Badge>
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="px-3 py-1.5 rounded-full bg-white/95 text-foreground text-xs font-semibold">
                {t('products.outOfStock')}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-3">
          {/* Eyebrow — hairline + uppercase tracked category label */}
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-accent/50" aria-hidden="true" />
            <span className="eyebrow text-accent text-[0.625rem]">
              {categoryName}
            </span>
          </div>

          {/* Product name (display font) */}
          <h3 className="font-display text-xl font-bold text-foreground line-clamp-1">
            {productName}
          </h3>

          {/* Description (clamped to 2 lines) */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {localizedName(product.descriptionAr, product.descriptionEn, locale)}
          </p>

          {/* Bottom row — price on start, CTA on end */}
          <div className="flex items-end justify-between pt-2">
            <div className="space-y-0.5">
              <p className="text-[0.625rem] uppercase tracking-wider text-muted-foreground">
                {t('products.perDay')}
              </p>
              <p className={`font-display text-xl font-bold ${isOutOfStock ? 'text-muted-foreground' : 'text-primary'}`}>
                {product.rentalPricePerDay.toFixed(3)} {t('common.currency')}
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity group-hover:opacity-90">
              {t('products.rentNow')}
              <ArrowIcon className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
