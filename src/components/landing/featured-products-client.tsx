'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/routing'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { TiltCard } from '@/components/ui-premium/tilt-card'
import { localizedName } from '@/lib/products'
import type { ProductWithImages } from '@/lib/products'

export function FeaturedProductsClient({ products }: { products: ProductWithImages[] }) {
  const t = useTranslations()
  const locale = useLocale()
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight

  return (
    <section className="relative py-32 bg-paper overflow-hidden">
      {/* Subtle dark texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'url(/section-bg-light.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Red accent glow */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(135deg, #E62129 0%, transparent 50%, #0A0A0A 100%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-16"
        >
          <div className="md:col-span-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-gold" />
              <span className="eyebrow text-gold">
                {t('featuredProducts.eyebrow')}
              </span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-ink leading-tight">
              {t('featured.title')}
            </h2>
            <p className="text-stone text-base mt-4 max-w-lg">
              {t('featuredProducts.subtitle')}
            </p>
          </div>
          <div className="md:col-span-4 text-start md:text-end">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-ink hover:text-gold transition-colors duration-300 group"
            >
              <span className="eyebrow">{t('featured.viewAll')}</span>
              <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, idx) => {
            const firstImage = product.images[0]
            const secondImage = product.images[1] ?? product.images[0]
            const productName = localizedName(product.nameAr, product.nameEn, locale)
            const categoryName = localizedName(
              product.category.nameAr,
              product.category.nameEn,
              locale
            )

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                  delay: idx * 0.1,
                }}
              >
                <Link href={`/products/${product.slug}`} className="group block">
                  <TiltCard maxTilt={5} className="cursor-pointer">
                    <div
                      className="relative overflow-hidden bg-paper-deep"
                      style={{ borderRadius: '2px', transformStyle: 'preserve-3d' }}
                    >
                      {/* Image container — portrait aspect for furniture */}
                      <div className="relative aspect-[4/5] overflow-hidden">
                        {firstImage ? (
                          <>
                            <Image
                              src={firstImage}
                              alt={productName}
                              fill
                              className="object-cover transition-opacity duration-700 group-hover:opacity-0"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                            {secondImage !== firstImage && (
                              <Image
                                src={secondImage}
                                alt={productName}
                                fill
                                className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100 scale-105"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              />
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}

                        {/* Gradient at bottom for text legibility */}
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/40 to-transparent pointer-events-none" />

                        {/* 3D badge */}
                        {product.model3dUrl && (
                          <div
                            className="absolute top-3 end-3 px-2 py-1 bg-gold text-ink eyebrow z-10"
                            style={{ transform: 'translateZ(30px)' }}
                          >
                            3D
                          </div>
                        )}

                        {/* Out of stock */}
                        {product.stock === 0 && (
                          <div className="absolute inset-0 bg-ink/60 flex items-center justify-center z-10">
                            <span className="eyebrow text-paper border border-paper/30 px-4 py-2">
                              {t('products.outOfStock')}
                            </span>
                          </div>
                        )}

                        {/* Price chip — furniture style with /day */}
                        <div
                          className="absolute bottom-3 end-3 glass px-3 py-2 z-10"
                          style={{ transform: 'translateZ(30px)' }}
                        >
                          <div className="flex items-baseline gap-1">
                            <span className="font-display text-lg text-ink tabular-nums">
                              {product.rentalPricePerDay.toFixed(3)}
                            </span>
                            <span className="font-mono text-[10px] text-stone">{t('featured.perDay')}</span>
                          </div>
                        </div>

                        {/* Category label top-start */}
                        <div
                          className="absolute top-3 start-3 z-10"
                          style={{ transform: 'translateZ(20px)' }}
                        >
                          <span className="eyebrow text-paper/80 bg-ink/40 backdrop-blur-sm px-2 py-1">
                            {categoryName}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div
                        className="p-5 bg-paper group-hover:bg-paper-warm transition-colors duration-500"
                        style={{ transform: 'translateZ(20px)' }}
                      >
                        <h3 className="font-display text-xl text-ink mb-1 line-clamp-1">
                          {productName}
                        </h3>
                        <div className="flex items-center justify-between mt-3">
                          <div className="w-8 h-px bg-gold group-hover:w-16 transition-[width] duration-500" />
                          <span className="eyebrow text-taupe opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            {t('featuredProducts.viewDetails')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Mobile view all */}
        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-ink"
          >
            <span className="eyebrow">{t('featured.viewAll')}</span>
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
