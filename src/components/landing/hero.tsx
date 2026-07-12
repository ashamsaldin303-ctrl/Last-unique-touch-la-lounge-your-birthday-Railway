'use client'

import { useRef } from 'react'
import { useScroll, useTransform, motion } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { ExperienceCard } from './experience-card'
import { Hero3DBackground } from './hero-3d-background'

export function Hero() {
  const t = useTranslations()
  const locale = useLocale() as 'ar' | 'en'
  const ref = useRef<HTMLElement>(null)
  const router = useRouter()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section
      ref={ref}
      className="relative min-h-[100dvh] w-full overflow-hidden bg-ink flex flex-col"
    >
      {/* CSS fallback background (always rendered — visible when 3D is disabled
          or before WebGL initializes). Kept behind the 3D canvas. */}
      <div className="absolute inset-0 z-0 pointer-events-none hero-bg-gradient" />
      <div className="absolute inset-0 z-0 pointer-events-none hero-bg-grid" />
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
      </div>

      {/* 3D tri-section background — renders null when WebGL is unavailable,
          in which case the CSS fallback above remains visible. */}
      <Hero3DBackground />

      {/* Top: Brand logo + tagline */}
      <motion.div
        style={{ opacity }}
        className="relative z-40 pt-16 sm:pt-20 pb-2 sm:pb-4 text-center px-4 shrink-0"
      >
        <div
          className="animate-hero-down flex items-center justify-center gap-2 sm:gap-3 mb-2"
          style={{ animationDelay: '0.2s' }}
        >
          <span className="w-6 sm:w-8 h-px bg-gold/50" />
          <span className="eyebrow text-gold/80 text-[10px] sm:text-xs">
            {t('hero.eyebrow')}
          </span>
          <span className="w-6 sm:w-8 h-px bg-gold/50" />
        </div>

        <h1
          className="animate-hero-down font-display text-xl sm:text-3xl md:text-4xl text-paper"
          style={{ animationDelay: '0.3s' }}
        >
          {t('hero.chooseExperience')}
        </h1>

        <p
          className="animate-hero-in text-xs sm:text-sm text-paper/60 mt-1"
          style={{ animationDelay: '0.5s' }}
        >
          {t('hero.subtitle')}
        </p>
      </motion.div>

      {/* === Holo-Chamber Cards (3 brand entries — not branded as any single brand) === */}
      <div className="relative z-20 flex-1 flex items-center px-3 sm:px-6 lg:px-8 py-2">
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-3 md:gap-6 lg:gap-8">
          <ExperienceCard
            category={t('hero.categories.heritage')}
            title={t('brandSelector.lut.name')}
            actionText={t('hero.explore')}
            productImageUrl="/products/lalounge_modern.webp"
            logoUrl="/logo-lut.jpg"
            isComingSoon={false}
            delay={0.01}
            index="01"
            accentColor="heritage"
            locale={locale}
            onClick={() => router.push('/last-unique-touch')}
          />
          <ExperienceCard
            category={t('hero.categories.modern')}
            title={t('brandSelector.lalounge.name')}
            actionText={t('hero.explore')}
            productImageUrl="/products/lut_heritage.webp"
            logoUrl="/logo-lalounge.jpg"
            isComingSoon={false}
            delay={0.02}
            index="02"
            accentColor="modern"
            locale={locale}
            onClick={() => router.push('/la-lounge')}
          />
          <ExperienceCard
            category={t('hero.categories.atelier')}
            title={t('brandSelector.birthday.name')}
            actionText={t('hero.explore')}
            productImageUrl="/products/birthday_atelier.webp"
            logoUrl="/logo-birthday.jpg"
            isComingSoon={false}
            delay={0.03}
            index="03"
            accentColor="atelier"
            locale={locale}
            onClick={() => router.push('/your-birthday')}
          />
        </div>
      </div>

      {/* Bottom: Stats bar */}
      <motion.div
        style={{ opacity }}
        className="relative z-40 pb-4 sm:pb-6 px-4 shrink-0"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-4 sm:gap-12">
            {[
              { value: '500+', label: t('hero.statLabels.luxuryItems') },
              { value: '2000+', label: t('hero.statLabels.events') },
              { value: '5', label: t('hero.statLabels.years') },
            ].map((stat, i) => (
              <div
                key={i}
                className="animate-hero-up text-center"
                style={{ animationDelay: `${1.0 + i * 0.1}s` }}
              >
                <div className="font-display text-base sm:text-2xl text-gold tabular-nums">{stat.value}</div>
                <div className="eyebrow text-paper/60 mt-0.5 text-[8px] sm:text-[10px]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
