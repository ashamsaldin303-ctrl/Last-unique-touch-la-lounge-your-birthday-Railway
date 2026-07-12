import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import LaLoungeView from '@/components/la-lounge/la-lounge-view'
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
    path: '/la-lounge',
    title: t('brandSelector.lalounge.name'),
    description: t('brandSelector.lalounge.desc'),
  })
}

export default function LaLoungePage() {
  return <LaLoungeView />
}
