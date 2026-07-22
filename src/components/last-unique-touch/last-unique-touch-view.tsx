'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { Check, ArrowDown } from 'lucide-react'
import { LutArabesque } from '@/components/brand/lut-arabesque'
import { ErrorBoundary } from '@/components/ui/error-boundary'
// Lazy-load the 3D background so the page's initial JS bundle stays small.
const Lut3DBackground = dynamic(() => import('./lut-3d-background'), {
  ssr: false,
  loading: () => null,
})

export default function LastUniqueTouchView() {
  const t = useTranslations()
  const router = useRouter()

  const services = [
    { title: t('lut.services.rental.title'), desc: t('lut.services.rental.desc') },
    { title: t('lut.services.delivery.title'), desc: t('lut.services.delivery.desc') },
    { title: t('lut.services.flexible.title'), desc: t('lut.services.flexible.desc') },
  ]

  return (
    <section className="relative w-full bg-transparent">
      {/* C4: Full-screen fixed cinematic 3D background — golden helix tunnel
          + procedural luxury furniture, ACES tone mapping, UnrealBloom, and a
          two-phase camera (hyperspace dive → drone sway). Wrapped in
          ErrorBoundary so a WebGL failure degrades gracefully to nothing
          instead of unmounting the page. */}
      <ErrorBoundary>
        <Lut3DBackground />
      </ErrorBoundary>

      {/* === Hero section — title centered, 3D furniture background === */}
      <div className="relative min-h-[100dvh] w-full overflow-hidden flex flex-col items-center justify-center">

        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 30% 20%, rgba(230, 33, 41, 0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 70% 80%, rgba(230, 33, 41, 0.08) 0%, transparent 50%)',
          }}
        />

        {/* LUT arabesque — faint background pattern (signature ornament) */}
        <LutArabesque
          variant="bg"
          className="pointer-events-none absolute inset-0 z-[2] h-full w-full opacity-60"
        />

        {/* FIX-1A / C2: the per-brand "Back" button was removed because the
            shared <Navbar /> rendered by the [locale]/layout.tsx now appears
            on this page too — its wordmark links home and its nav row
            exposes Home / Products / About / Contact, so the user is no
            longer trapped on the brand landing page. */}

        {/* Centered title */}
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <div
            className="animate-hero-down flex items-center justify-center gap-2 sm:gap-3 mb-3"
            style={{ animationDelay: '0.2s' }}
          >
            <span className="w-6 sm:w-8 h-px bg-gold/50" />
            <span className="eyebrow text-gold/80 text-[10px] sm:text-xs">
              {t('lut.eyebrow')}
            </span>
            <span className="w-6 sm:w-8 h-px bg-gold/50" />
          </div>

          <h1
            className="animate-hero-down font-display text-4xl sm:text-6xl md:text-7xl text-paper mb-4 relative z-30"
            style={{ animationDelay: '0.3s', textShadow: '0 2px 30px rgba(0,0,0,0.8)' }}
          >
            {t('brandSelector.lut.name')}
          </h1>

          <p
            className="animate-hero-in text-sm sm:text-base text-paper/60 max-w-md mb-8"
            style={{ animationDelay: '0.5s' }}
          >
            {t('lut.subtitle')}
          </p>

          {/* Products button */}
          <button
            onClick={() => router.push('/products')}
            className="animate-hero-up px-10 py-3.5 bg-lut hover:bg-lut/90 text-primary-foreground rounded-full tracking-wide text-sm font-medium shadow-[0_4px_20px_rgba(230,33,41,0.3)] transition-colors cursor-pointer"
            style={{ animationDelay: '0.7s' }}
          >
            {t('lut.productsButton')}
          </button>
        </div>

        {/* Scroll hint */}
        <div
          className="animate-hero-in absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-paper/40"
          style={{ animationDelay: '1.5s' }}
        >
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </div>
      </div>

      {/* === Services section — revealed on scroll === */}
      <div className="relative z-10 py-20 px-4 bg-transparent">
        <div className="max-w-5xl mx-auto">
          {/* LUT arabesque divider — signature ornament between sections */}
          <LutArabesque variant="divider" className="w-full max-w-md mx-auto mb-12" />

          <h2 className="font-display text-2xl sm:text-4xl text-paper text-center mb-12">
            {t('lut.servicesTitle')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-8 text-center hover:border-gold/30 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-5">
                  <Check className="w-7 h-7 text-gold" />
                </div>
                <h3 className="font-display text-xl text-paper mb-3">{service.title}</h3>
                {/* Phase 5 contrast: bumped from text-paper/50 → text-paper/70 for WCAG AA on bg-transparent charcoal. */}
                <p className="text-sm text-paper/70 leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-16 mt-16">
            {[
              { value: '500+', label: t('lut.stats.items') },
              { value: '2000+', label: t('lut.stats.events') },
              { value: '5', label: t('lut.stats.years') },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-2xl sm:text-4xl text-gold tabular-nums">{stat.value}</div>
                <div className="eyebrow text-paper/50 mt-1 text-[9px] sm:text-[11px]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
