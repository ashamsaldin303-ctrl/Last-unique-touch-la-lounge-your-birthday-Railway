import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getLocale } from 'next-intl/server'
import { LegalPageWrapper } from '@/components/legal/page-header'
import { LegalContent } from '@/components/legal/legal-content'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Target, Handshake, Zap, Gem } from 'lucide-react'
import { getContent } from '@/lib/content'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations()
  return buildMetadata({
    locale: locale as 'ar' | 'en',
    path: '/about',
    title: t('about.title'),
    description: t('about.subtitle'),
  })
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  await params // consume the promise
  const t = await getTranslations()
  const locale = await getLocale()
  const content = await getContent(locale, 'about')

  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight

  const values = [
    { icon: Target, title: t('about.values.quality.title'), desc: t('about.values.quality.desc') },
    { icon: Handshake, title: t('about.values.transparency.title'), desc: t('about.values.transparency.desc') },
    { icon: Zap, title: t('about.values.speed.title'), desc: t('about.values.speed.desc') },
    { icon: Gem, title: t('about.values.luxury.title'), desc: t('about.values.luxury.desc') },
  ]

  const stats = [
    { value: '+500', label: t('about.stats.products') },
    { value: '+1000', label: t('about.stats.clients') },
    { value: '+2000', label: t('about.stats.events') },
    { value: '5', label: t('about.stats.years') },
  ]

  return (
    <LegalPageWrapper title={t('about.title')} subtitle={t('about.subtitle')}>
      {/* Story (from markdown) */}
      <LegalContent content={content} />

      {/* Values section */}
      <section className="mt-16 pt-12 border-t border-border">
        <h2 className="text-2xl font-bold text-foreground mb-8">
          {t('about.values.title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, idx) => {
            const Icon = value.icon
            return (
              <div
                key={idx}
                className="p-6 rounded-md bg-stone-50 border border-border"
              >
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Stats section */}
      <section className="mt-16 pt-12 border-t border-border">
        <h2 className="text-2xl font-bold text-foreground mb-8">
          {t('about.stats.title')}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-md bg-card border border-border text-center"
            >
              <p className="text-3xl font-bold text-lut mb-2">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 pt-12 border-t border-border text-center">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          {t('about.cta.title')}
        </h2>
        <Button asChild className="bg-lut hover:bg-lut/90 text-white">
          <Link href="/products">
            {t('about.cta.button')}
            <ArrowIcon className="w-4 h-4 ms-2" />
          </Link>
        </Button>
      </section>
    </LegalPageWrapper>
  )
}
