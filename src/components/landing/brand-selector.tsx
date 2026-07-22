'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/routing'
import { ArrowRight, ArrowLeft, Plus } from 'lucide-react'
import { TiltCard } from '@/components/ui-premium/tilt-card'

const brands = [
  {
    key: 'lut' as const,
    href: '/products',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80',
    accent: 'var(--c-lut)',
    active: true,
    tag: 'HERITAGE',
  },
  {
    key: 'lalounge' as const,
    href: '/la-lounge',
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1200&q=80',
    accent: 'var(--c-lalounge)',
    active: true,
    tag: 'MODERN',
  },
  {
    key: 'birthday' as const,
    href: '/your-birthday',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&q=80',
    accent: 'var(--c-birthday)',
    active: true,
    tag: 'ATELIER',
  },
]

export function BrandSelector() {
  const t = useTranslations()
  const locale = useLocale()
  const ref = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const headerY = useTransform(scrollYProgress, [0, 0.3], [40, 0])
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1])

  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight

  return (
    <section ref={ref} className="relative py-32 bg-paper overflow-hidden">
      {/* Section header */}
      <motion.div
        style={{ y: headerY, opacity: headerOpacity }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="w-8 h-px bg-gold" />
          <span className="eyebrow text-gold">
            {t('brandSelector.subtitle')}
          </span>
          <span className="w-8 h-px bg-gold" />
        </div>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-ink leading-tight max-w-3xl mx-auto">
          {t('brandSelector.title')}
        </h2>
        <p className="text-stone text-lg mt-4 max-w-xl mx-auto">
          {t('brandSelector.subtitle')}
        </p>
      </motion.div>

      {/* Brand cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {brands.map((brand, idx) => {
            const card = (
              <motion.div
                key={brand.key}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: 0.9,
                  ease: [0.16, 1, 0.3, 1],
                  delay: idx * 0.12,
                }}
              >
                <TiltCard
                  maxTilt={brand.active ? 6 : 4}
                  glare={brand.active}
                  className="h-[70vh] min-h-[500px] cursor-pointer group"
                >
                  <div
                    className="relative h-full w-full overflow-hidden"
                    style={{
                      borderRadius: '2px',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Background image */}
                    <div className="absolute inset-0 overflow-hidden">
                      <Image
                        src={brand.image}
                        alt={t(`brandSelector.${brand.key}.name`)}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className={`w-full h-full object-cover transition-opacity duration-700 ${
                          brand.active ? 'group-hover:opacity-90' : ''
                        }`}
                      />
                      {/* Dark overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-ink/20" />
                      {/* Inactive overlay */}
                      {!brand.active && (
                        <div className="absolute inset-0 bg-ink/50" />
                      )}
                    </div>

                    {/* Accent line at top */}
                    <div
                      className="absolute top-0 inset-x-0 h-1"
                      style={{ backgroundColor: brand.accent }}
                    />

                    {/* Tag */}
                    <div className="absolute top-6 start-6 z-10">
                      <span
                        className="eyebrow text-paper px-3 py-1.5"
                        style={{
                          backgroundColor: 'rgba(14, 13, 11, 0.6)',
                          backdropFilter: 'blur(10px)',
                          color: brand.accent,
                        }}
                      >
                        {brand.tag}
                      </span>
                    </div>

                    {/* Coming soon badge */}
                    {!brand.active && (
                      <div className="absolute top-6 end-6 z-10">
                        <span className="eyebrow text-paper/60 px-3 py-1.5 border border-paper/20 bg-ink/40 backdrop-blur-sm">
                          {t(`brandSelector.${brand.key}.comingSoon`)}
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div
                      className="absolute bottom-0 inset-x-0 p-8 z-10"
                      style={{ transform: 'translateZ(40px)' }}
                    >
                      {/* Accent dot */}
                      <div
                        className="w-3 h-3 rounded-full mb-4"
                        style={{ backgroundColor: brand.accent }}
                      />

                      <h3 className="font-display text-3xl sm:text-4xl text-paper mb-3">
                        {t(`brandSelector.${brand.key}.name`)}
                      </h3>

                      <p className="text-paper/60 text-sm leading-relaxed mb-6 max-w-xs">
                        {t(`brandSelector.${brand.key}.desc`)}
                      </p>

                      {brand.active ? (
                        <div className="flex items-center gap-2 text-paper group-hover:gap-4 transition-[gap] duration-300">
                          <span className="eyebrow" style={{ color: brand.accent }}>
                            {t('hero.explore')}
                          </span>
                          <ArrowIcon className="w-4 h-4" style={{ color: brand.accent }} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-paper/40">
                          <Plus className="w-4 h-4" />
                          <span className="eyebrow">
                            {t('brandSelector.comingSoon')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            )

            if (brand.active && brand.href) {
              return (
                <Link key={brand.key} href={brand.href} className="block">
                  {card}
                </Link>
              )
            }
            return <div key={brand.key}>{card}</div>
          })}
        </div>
      </div>
    </section>
  )
}
