'use client'

import { motion } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { MagneticButton } from '@/components/ui-premium/magnetic-button'

export function CTASection() {
  const t = useTranslations()
  const locale = useLocale()
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight

  return (
    <section className="relative py-40 bg-ink overflow-hidden">
      {/* Dark texture background */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: 'url(/section-bg-dark.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Radial red glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(230, 33, 41, 0.12) 0%, transparent 70%)',
        }}
      />

      {/* Top hairline */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="w-8 h-px bg-gold" />
            <span className="eyebrow text-gold">
              {t('cta.eyebrow')}
            </span>
            <span className="w-8 h-px bg-gold" />
          </div>

          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-paper leading-tight mb-8">
            {t('cta.title')}
          </h2>

          <p className="text-lg text-paper/50 max-w-xl mx-auto mb-12">
            {t('cta.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <MagneticButton href="/products">
              <span className="group inline-flex items-center gap-3 px-10 py-4 bg-lut text-paper rounded-none hover:bg-lut/90 transition-colors duration-300">
                <span className="text-sm font-medium tracking-wide">
                  {t('cta.primary')}
                </span>
                <ArrowIcon className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </span>
            </MagneticButton>

            <MagneticButton href="/contact">
              <span className="group inline-flex items-center gap-3 px-10 py-4 border border-gold/40 text-gold hover:bg-gold/10 transition-colors duration-300">
                <span className="text-sm font-medium tracking-wide">
                  {t('cta.secondary')}
                </span>
              </span>
            </MagneticButton>
          </div>
        </motion.div>
      </div>

      {/* Bottom hairline */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </section>
  )
}
