import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { buildMetadata } from '@/lib/seo'
import {
  LayoutTemplate,
  Gem,
  Sparkles,
  Landmark,
  Minimize2,
  Check,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'

/**
 * La Lounge — Ready-Made Plans Execution feature page.
 *
 * Server Component. Inherits the `data-brand="lalounge"` styling cascade so
 * the dark charcoal `#150912` background, warm-paper foreground `#faf6ef`,
 * magenta `#E6007E` primary, and gold `#C9A24B` accent are in effect. All
 * text is light-on-dark for WCAG-AA readability.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations()
  return buildMetadata({
    locale: locale as 'ar' | 'en',
    path: '/la-lounge/ready-plans',
    title: t('laLoungeReadyPlans.title'),
    description: t('laLoungeReadyPlans.subtitle'),
  })
}

// Visual gradient + icon per plan — purely decorative, no real images.
type PlanKey = 'classic' | 'modern' | 'cultural' | 'minimalist'

const PLAN_VISUALS: Record<
  PlanKey,
  { icon: typeof Gem; gradient: string; accent: string }
> = {
  classic: {
    icon: Gem,
    gradient:
      'linear-gradient(135deg, #2a2418 0%, #4a3a1d 45%, #1a1610 100%)',
    accent: '#C9A24B',
  },
  modern: {
    icon: Sparkles,
    gradient:
      'linear-gradient(135deg, #2a0a1d 0%, #5a0e3a 45%, #1c0410 100%)',
    accent: '#E6007E',
  },
  cultural: {
    icon: Landmark,
    gradient:
      'linear-gradient(135deg, #2a1810 0%, #4a2a14 45%, #1c1008 100%)',
    accent: '#D49A4A',
  },
  minimalist: {
    icon: Minimize2,
    gradient:
      'linear-gradient(135deg, #1f1f1f 0%, #2e2e2e 45%, #141414 100%)',
    accent: '#E8E8E8',
  },
}

export default async function ReadyPlansPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations()
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight

  const planKeys: PlanKey[] = ['classic', 'modern', 'cultural', 'minimalist']

  return (
    <div className="bg-background text-foreground">
      {/* === Hero header === */}
      <section className="relative overflow-hidden pt-32 pb-16 px-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 0%, rgba(230,0,126,0.18) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <LayoutTemplate className="size-4 text-primary" aria-hidden="true" />
            <span className="text-primary text-xs tracking-[0.3em] uppercase">
              {t('laLoungeReadyPlans.eyebrow')}
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-light text-foreground tracking-wide mb-5">
            {t('laLoungeReadyPlans.title')}
          </h1>
          <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            {t('laLoungeReadyPlans.subtitle')}
          </p>
          <div
            aria-hidden="true"
            className="mx-auto mt-8 h-px w-20"
            style={{ background: 'linear-gradient(90deg, transparent, #C9A24B, transparent)' }}
          />
        </div>
      </section>

      {/* === Pre-made plan cards === */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-3">
              {t('laLoungeReadyPlans.plansTitle')}
            </h2>
            <p className="text-foreground/60 max-w-xl mx-auto text-sm">
              {t('laLoungeReadyPlans.plansSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {planKeys.map((key) => {
              const visual = PLAN_VISUALS[key]
              const Icon = visual.icon
              // The `includes` array is a JSON-array translation; next-intl
              // exposes it as a string[] when the key path resolves to an
              // array. We use `t.raw` to fetch it untyped so we can iterate.
              const includes = t.raw(`laLoungeReadyPlans.plans.${key}.includes`) as string[]
              const name = t(`laLoungeReadyPlans.plans.${key}.name`)
              const desc = t(`laLoungeReadyPlans.plans.${key}.desc`)
              const price = t(`laLoungeReadyPlans.plans.${key}.price`)

              return (
                <article
                  key={key}
                  className="bg-card/70 backdrop-blur-sm border border-primary/15 rounded-lg overflow-hidden flex flex-col"
                >
                  {/* Visual header — gradient + icon */}
                  <div
                    className="relative h-40 flex items-center justify-center"
                    style={{ background: visual.gradient }}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 opacity-25"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(-25deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 26px)',
                      }}
                    />
                    <div
                      className="relative flex items-center justify-center size-16 rounded-full border-2"
                      style={{
                        borderColor: visual.accent,
                        background: 'rgba(0,0,0,0.25)',
                      }}
                    >
                      <Icon
                        className="size-7"
                        style={{ color: visual.accent }}
                        aria-hidden="true"
                      />
                    </div>
                    {/* Price badge — top-end */}
                    <span
                      className="absolute top-3 end-3 inline-flex items-center rounded-full border px-3 py-1 text-[0.65rem] font-semibold backdrop-blur-sm"
                      style={{
                        borderColor: `${visual.accent}66`,
                        background: `${visual.accent}1a`,
                        color: visual.accent,
                      }}
                    >
                      {price}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-6 flex flex-col gap-4 flex-1">
                    <div>
                      <h3 className="font-display text-2xl text-primary mb-2">
                        {name}
                      </h3>
                      <p className="text-sm text-foreground/70 leading-relaxed">
                        {desc}
                      </p>
                    </div>

                    {/* Includes list */}
                    <div className="flex-1">
                      <p className="text-[0.7rem] uppercase tracking-wider text-foreground/50 mb-2.5">
                        {t('laLoungeReadyPlans.includedLabel')}
                      </p>
                      <ul className="space-y-2">
                        {includes.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-foreground/80"
                          >
                            <Check
                              className="size-4 mt-0.5 shrink-0"
                              style={{ color: visual.accent }}
                              aria-hidden="true"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Price label + CTA */}
                    <div className="pt-4 mt-2 border-t border-primary/10">
                      <div className="flex items-end justify-between mb-3">
                        <span className="text-[0.7rem] uppercase tracking-wider text-foreground/50">
                          {t('laLoungeReadyPlans.priceLabel')}
                        </span>
                        <span
                          className="font-display text-base font-semibold"
                          style={{ color: visual.accent }}
                        >
                          {price}
                        </span>
                      </div>
                      <Link
                        href="/la-lounge/contact"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        {t('laLoungeReadyPlans.requestButton')}
                        <ArrowIcon className="size-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* === CTA — bring your own plan === */}
      <section className="py-20 px-4 border-t border-primary/10">
        <div className="max-w-3xl mx-auto text-center">
          <div
            aria-hidden="true"
            className="mx-auto mb-6 h-px w-20"
            style={{ background: 'linear-gradient(90deg, transparent, #C9A24B, transparent)' }}
          />
          <Link
            href="/la-lounge/contact"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground shadow-[0_4px_20px_rgba(230,0,126,0.35)] transition-colors hover:bg-primary/90"
          >
            {t('laLoungeReadyPlans.ctaButton')}
            <ArrowIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
