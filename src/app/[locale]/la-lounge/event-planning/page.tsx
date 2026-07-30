import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { buildMetadata } from '@/lib/seo'
import {
  ClipboardList,
  MessageSquare,
  Lightbulb,
  ListChecks,
  PlayCircle,
  ClipboardCheck,
  ArrowRight,
  ArrowLeft,
  Building2,
  Heart,
  Sparkles,
} from 'lucide-react'

/**
 * La Lounge — Complete Event Planning & Execution feature page.
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
    path: '/la-lounge/event-planning',
    title: t('laLoungeEventPlanning.title'),
    description: t('laLoungeEventPlanning.subtitle'),
  })
}

export default async function EventPlanningPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations()
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight

  const steps = [
    {
      icon: MessageSquare,
      title: t('laLoungeEventPlanning.steps.s1.title'),
      desc: t('laLoungeEventPlanning.steps.s1.desc'),
    },
    {
      icon: Lightbulb,
      title: t('laLoungeEventPlanning.steps.s2.title'),
      desc: t('laLoungeEventPlanning.steps.s2.desc'),
    },
    {
      icon: ListChecks,
      title: t('laLoungeEventPlanning.steps.s3.title'),
      desc: t('laLoungeEventPlanning.steps.s3.desc'),
    },
    {
      icon: PlayCircle,
      title: t('laLoungeEventPlanning.steps.s4.title'),
      desc: t('laLoungeEventPlanning.steps.s4.desc'),
    },
    {
      icon: ClipboardCheck,
      title: t('laLoungeEventPlanning.steps.s5.title'),
      desc: t('laLoungeEventPlanning.steps.s5.desc'),
    },
  ]

  const scenarios = [
    {
      icon: Building2,
      name: t('laLoungeEventPlanning.scenarios.items.i1.name'),
      desc: t('laLoungeEventPlanning.scenarios.items.i1.desc'),
    },
    {
      icon: Heart,
      name: t('laLoungeEventPlanning.scenarios.items.i2.name'),
      desc: t('laLoungeEventPlanning.scenarios.items.i2.desc'),
    },
    {
      icon: Sparkles,
      name: t('laLoungeEventPlanning.scenarios.items.i3.name'),
      desc: t('laLoungeEventPlanning.scenarios.items.i3.desc'),
    },
  ]

  // Before/After gradient placeholders (no real photos available).
  // Each pair uses a desaturated "before" gradient vs. a vivid magenta-tinted
  // "after" gradient to convey the transformation visually.
  const beforeAfter = [
    {
      beforeName: t('laLoungeEventPlanning.beforeAfter.items.i1.name'),
      beforeDesc: t('laLoungeEventPlanning.beforeAfter.items.i1.desc'),
      afterName: t('laLoungeEventPlanning.beforeAfter.items.i2.name'),
      afterDesc: t('laLoungeEventPlanning.beforeAfter.items.i2.desc'),
    },
    {
      beforeName: t('laLoungeEventPlanning.beforeAfter.items.i3.name'),
      beforeDesc: t('laLoungeEventPlanning.beforeAfter.items.i3.desc'),
      afterName: t('laLoungeEventPlanning.beforeAfter.items.i4.name'),
      afterDesc: t('laLoungeEventPlanning.beforeAfter.items.i4.desc'),
    },
  ]

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
            <ClipboardList className="size-4 text-primary" aria-hidden="true" />
            <span className="text-primary text-xs tracking-[0.3em] uppercase">
              {t('laLoungeEventPlanning.eyebrow')}
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-light text-foreground tracking-wide mb-5">
            {t('laLoungeEventPlanning.title')}
          </h1>
          <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            {t('laLoungeEventPlanning.subtitle')}
          </p>
          <div
            aria-hidden="true"
            className="mx-auto mt-8 h-px w-20"
            style={{ background: 'linear-gradient(90deg, transparent, #C9A24B, transparent)' }}
          />
        </div>
      </section>

      {/* === Process section — 5 numbered steps === */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-3">
              {t('laLoungeEventPlanning.process.title')}
            </h2>
            <p className="text-foreground/60 max-w-xl mx-auto text-sm">
              {t('laLoungeEventPlanning.process.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <div
                  key={i}
                  className="relative bg-card/70 backdrop-blur-sm border border-primary/15 rounded-lg p-6 flex flex-col items-center text-center h-full"
                >
                  <span
                    aria-hidden="true"
                    className="absolute top-3 end-3 inline-flex items-center justify-center size-7 rounded-full bg-primary text-primary-foreground text-xs font-bold"
                  >
                    {i + 1}
                  </span>
                  <div className="flex items-center justify-center mb-4 size-12 rounded-full bg-primary/10 border border-primary/30">
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-base text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-foreground/65 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* === Example scenarios === */}
      <section className="py-20 px-4 border-t border-primary/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-3">
              {t('laLoungeEventPlanning.scenarios.title')}
            </h2>
            <p className="text-foreground/60 max-w-xl mx-auto text-sm">
              {t('laLoungeEventPlanning.scenarios.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {scenarios.map((scenario, i) => {
              const Icon = scenario.icon
              return (
                <article
                  key={i}
                  className="bg-card/70 backdrop-blur-sm border border-primary/15 rounded-lg p-7 flex flex-col h-full"
                >
                  <div className="flex items-center justify-center mb-5 size-14 rounded-full bg-primary/10 border border-primary/30">
                    <Icon className="size-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-xl text-primary mb-3">
                    {scenario.name}
                  </h3>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    {scenario.desc}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* === Before & After === */}
      <section className="py-20 px-4 border-t border-primary/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-3">
              {t('laLoungeEventPlanning.beforeAfter.title')}
            </h2>
            <p className="text-foreground/60 max-w-xl mx-auto text-sm">
              {t('laLoungeEventPlanning.beforeAfter.subtitle')}
            </p>
          </div>

          <div className="space-y-8">
            {beforeAfter.map((pair, i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch"
              >
                {/* BEFORE — desaturated concrete-grey gradient */}
                <article className="relative overflow-hidden rounded-lg border border-primary/15">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(135deg, #2a2622 0%, #3a3631 45%, #1c1a18 100%)',
                    }}
                  />
                  {/* Faint concrete texture lines */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 22px)',
                    }}
                  />
                  <div className="relative p-7 min-h-[220px] flex flex-col">
                    <span className="inline-flex w-fit items-center rounded-full border border-foreground/20 bg-foreground/5 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-foreground/60 mb-4">
                      {t('laLoungeEventPlanning.beforeAfter.before')}
                    </span>
                    <h3 className="font-display text-xl text-foreground mb-2">
                      {pair.beforeName}
                    </h3>
                    <p className="text-sm text-foreground/65 leading-relaxed">
                      {pair.beforeDesc}
                    </p>
                  </div>
                </article>

                {/* AFTER — vivid magenta-tinted gradient */}
                <article className="relative overflow-hidden rounded-lg border border-primary/30">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(135deg, #2a0a1d 0%, #5a0e3a 45%, #1c0410 100%)',
                    }}
                  />
                  {/* Magenta spotlight beam */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(circle at 70% 30%, rgba(230,0,126,0.35) 0%, transparent 55%)',
                    }}
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(-25deg, rgba(230,0,126,0.5) 0, rgba(230,0,126,0.5) 1px, transparent 1px, transparent 26px)',
                    }}
                  />
                  <div className="relative p-7 min-h-[220px] flex flex-col">
                    <span className="inline-flex w-fit items-center rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-primary mb-4">
                      {t('laLoungeEventPlanning.beforeAfter.after')}
                    </span>
                    <h3 className="font-display text-xl text-primary mb-2">
                      {pair.afterName}
                    </h3>
                    <p className="text-sm text-foreground/85 leading-relaxed">
                      {pair.afterDesc}
                    </p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA === */}
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
            {t('laLoungeEventPlanning.ctaButton')}
            <ArrowIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
