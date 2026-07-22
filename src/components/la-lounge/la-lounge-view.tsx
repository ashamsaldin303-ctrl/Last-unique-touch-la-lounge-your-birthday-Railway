'use client'

import dynamic from 'next/dynamic'
import { ArrowDown, ClipboardList, Armchair, Sparkles, type LucideIcon } from 'lucide-react'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { ErrorBoundary } from '@/components/ui/error-boundary'

// v31-build-B6: lazy-load the new vanilla-Three.js event-blueprint scene.
// Replaces the previous R3F `PurpleWaves3D` (deleted — no longer on disk).
// ssr:false because WebGL only exists in the browser; the component itself
// also gates on `shouldEnable3D()` and returns null on incapable devices.
const LaLounge3DBackground = dynamic(() => import('./la-lounge-3d-background'), {
  ssr: false,
  loading: () => null,
})

export default function LaLoungeView() {
  const router = useRouter()
  const t = useTranslations()

  // V10 user request: added examples for each service to show concrete
  // items/events the customer can expect.
  const services: Array<{ title: string; desc: string; icon: LucideIcon; examples: string[] }> = [
    {
      title: t('laLounge.services.planning.title'),
      desc: t('laLounge.services.planning.desc'),
      icon: ClipboardList,
      examples: [
        t('laLounge.services.planning.ex1'),
        t('laLounge.services.planning.ex2'),
        t('laLounge.services.planning.ex3'),
        t('laLounge.services.planning.ex4'),
      ],
    },
    {
      title: t('laLounge.services.furniture.title'),
      desc: t('laLounge.services.furniture.desc'),
      icon: Armchair,
      examples: [
        t('laLounge.services.furniture.ex1'),
        t('laLounge.services.furniture.ex2'),
        t('laLounge.services.furniture.ex3'),
        t('laLounge.services.furniture.ex4'),
      ],
    },
    {
      title: t('laLounge.services.custom.title'),
      desc: t('laLounge.services.custom.desc'),
      icon: Sparkles,
      examples: [
        t('laLounge.services.custom.ex1'),
        t('laLounge.services.custom.ex2'),
        t('laLounge.services.custom.ex3'),
        t('laLounge.services.custom.ex4'),
      ],
    },
  ]

  const scrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="relative w-full bg-transparent">
      {/* === v31-build-B6: Fixed full-screen 3D blueprint background ===
          Sits behind all page content (z-0). Hero + services use z-10 so
          they stack above it. Renders null on incapable devices. */}
      <ErrorBoundary>
        <LaLounge3DBackground />
      </ErrorBoundary>

      {/* === Hero section — title centered, 3D blueprint background === */}
      <div className="relative z-10 min-h-[100dvh] w-full overflow-hidden flex flex-col items-center justify-center">
        {/* v33: Removed LaLoungeSunburst (circular grid that blurred the 3D
            blueprint background) and LaLoungeLightSweep (yellow beam that
            moved from left to center). Both were overlay decorations that
            conflicted with the new R3F event-blueprint background. */}

        {/* FIX-1A / C2: the per-brand "Back" button was removed because the
            shared <Navbar /> rendered by the [locale]/layout.tsx now appears
            on this page too — its wordmark links home and its nav row
            exposes Home / Products / About / Contact, so the user is no
            longer trapped on the brand landing page. */}

        {/* Centered title */}
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <div
            className="flex items-center gap-2 mb-4"
          >
            <span className="text-primary text-xs tracking-[0.3em] uppercase">
              {t('laLounge.eyebrow')}
            </span>
          </div>

          <h1
            className="text-5xl sm:text-7xl md:text-8xl font-display font-light text-primary tracking-widest drop-shadow-sm mb-4"
          >
            {t('brandSelector.lalounge.name')}
          </h1>

          <p
            className="text-sm sm:text-base text-foreground/70 tracking-wide max-w-lg mb-8"
          >
            {t('laLounge.subtitle')}
          </p>

          {/* Services button — scrolls to services section */}
          <button
            onClick={scrollToServices}
            className="px-10 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full tracking-wide text-sm font-medium shadow-[0_4px_20px_rgba(230, 0, 126,0.3)] hover:shadow-[0_6px_25px_rgba(230, 0, 126,0.4)] transition-[background-color,box-shadow] cursor-pointer border border-primary/30"
          >
            {t('laLounge.featuresButton')}
          </button>
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-foreground/60"
        >
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </div>
      </div>

      {/* === Services section — revealed on scroll === */}
      <div id="services" className="relative z-10 py-20 px-4 bg-transparent">
        <div className="max-w-5xl mx-auto">
          <h2
            className="font-display text-3xl sm:text-5xl text-primary text-center mb-4"
          >
            {t('laLounge.servicesTitle')}
          </h2>
          <p className="text-center text-foreground/60 mb-12 max-w-xl mx-auto text-sm">
            {t('laLounge.servicesSubtitle')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service, i) => {
              const Icon = service.icon
              return (
                <div
                  key={i}
                  className="bg-card/80 backdrop-blur-md border border-primary/10 rounded-lg p-8 text-center hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-center mb-5 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="font-display text-xl text-primary mb-3">{service.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed mb-4">{service.desc}</p>
                  {/* V10 user request: examples list inside each service card */}
                  <ul className="text-start space-y-1.5 mt-4 pt-4 border-t border-primary/10">
                    {service.examples.map((example, j) => (
                      <li key={j} className="text-xs text-foreground/70 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary/50 shrink-0" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <button
              onClick={() => router.push('/contact')}
              className="px-10 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full tracking-wide text-sm font-medium shadow-[0_4px_20px_rgba(230, 0, 126,0.3)] transition-colors cursor-pointer"
            >
              {t('laLounge.contactButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
