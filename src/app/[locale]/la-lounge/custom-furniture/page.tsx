import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { buildMetadata } from '@/lib/seo'
import {
  Armchair,
  PencilRuler,
  Layers,
  Hammer,
  ShieldCheck,
  Truck,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'

/**
 * La Lounge — Custom Furniture Manufacturing feature page.
 *
 * Server Component. Inherits the `data-brand="lalounge"` styling cascade set
 * by `BrandThemeSetter` (client) so the dark charcoal `#150912` background,
 * warm-paper foreground `#faf6ef`, magenta `#E6007E` primary, and gold
 * `#C9A24B` accent are all in effect. All text is light-on-dark for
 * WCAG-AA readability.
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
    path: '/la-lounge/custom-furniture',
    title: t('laLoungeCustomFurniture.title'),
    description: t('laLoungeCustomFurniture.subtitle'),
  })
}

export default async function CustomFurniturePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations()
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight

  const steps = [
    {
      icon: PencilRuler,
      title: t('laLoungeCustomFurniture.steps.s1.title'),
      desc: t('laLoungeCustomFurniture.steps.s1.desc'),
    },
    {
      icon: Layers,
      title: t('laLoungeCustomFurniture.steps.s2.title'),
      desc: t('laLoungeCustomFurniture.steps.s2.desc'),
    },
    {
      icon: Hammer,
      title: t('laLoungeCustomFurniture.steps.s3.title'),
      desc: t('laLoungeCustomFurniture.steps.s3.desc'),
    },
    {
      icon: ShieldCheck,
      title: t('laLoungeCustomFurniture.steps.s4.title'),
      desc: t('laLoungeCustomFurniture.steps.s4.desc'),
    },
    {
      icon: Truck,
      title: t('laLoungeCustomFurniture.steps.s5.title'),
      desc: t('laLoungeCustomFurniture.steps.s5.desc'),
    },
  ]

  const examples = [
    {
      src: '/products/bombon-chair-velvet.png',
      name: t('laLoungeCustomFurniture.examples.items.i1.name'),
      desc: t('laLoungeCustomFurniture.examples.items.i1.desc'),
    },
    {
      src: '/products/marble-coffee-table.png',
      name: t('laLoungeCustomFurniture.examples.items.i2.name'),
      desc: t('laLoungeCustomFurniture.examples.items.i2.desc'),
    },
    {
      src: '/products/louis-ghost-chair.png',
      name: t('laLoungeCustomFurniture.examples.items.i3.name'),
      desc: t('laLoungeCustomFurniture.examples.items.i3.desc'),
    },
    {
      src: '/products/gold-side-table.png',
      name: t('laLoungeCustomFurniture.examples.items.i4.name'),
      desc: t('laLoungeCustomFurniture.examples.items.i4.desc'),
    },
    {
      src: '/products/dining-table-12-seater.png',
      name: t('laLoungeCustomFurniture.examples.items.i5.name'),
      desc: t('laLoungeCustomFurniture.examples.items.i5.desc'),
    },
    {
      src: '/products/crystal-chandelier.png',
      name: t('laLoungeCustomFurniture.examples.items.i6.name'),
      desc: t('laLoungeCustomFurniture.examples.items.i6.desc'),
    },
  ]

  return (
    <div className="bg-background text-foreground">
      {/* === Hero header === */}
      <section className="relative overflow-hidden pt-32 pb-16 px-4">
        {/* Decorative magenta radial glow behind the title */}
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
            <Armchair className="size-4 text-primary" aria-hidden="true" />
            <span className="text-primary text-xs tracking-[0.3em] uppercase">
              {t('laLoungeCustomFurniture.eyebrow')}
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-light text-foreground tracking-wide mb-5">
            {t('laLoungeCustomFurniture.title')}
          </h1>
          <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            {t('laLoungeCustomFurniture.subtitle')}
          </p>
          {/* Gold hairline divider */}
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
              {t('laLoungeCustomFurniture.process.title')}
            </h2>
            <p className="text-foreground/60 max-w-xl mx-auto text-sm">
              {t('laLoungeCustomFurniture.process.subtitle')}
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
                  {/* Step number — magenta circle, top-start */}
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

      {/* === Examples gallery === */}
      <section className="py-20 px-4 border-t border-primary/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-3">
              {t('laLoungeCustomFurniture.examples.title')}
            </h2>
            <p className="text-foreground/60 max-w-xl mx-auto text-sm">
              {t('laLoungeCustomFurniture.examples.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {examples.map((item, i) => (
              <article
                key={i}
                className="group bg-card/70 backdrop-blur-sm border border-primary/15 rounded-lg overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-black/30">
                  <Image
                    src={item.src}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Magenta hairline along the top of the image */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(230,0,126,0.6), transparent)' }}
                  />
                </div>
                <div className="p-5 flex flex-col gap-2">
                  <h3 className="font-display text-lg text-primary">
                    {item.name}
                  </h3>
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </article>
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
            {t('laLoungeCustomFurniture.ctaButton')}
            <ArrowIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
