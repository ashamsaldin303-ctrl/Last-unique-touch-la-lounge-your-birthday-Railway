import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import LastUniqueTouchView from '@/components/last-unique-touch/last-unique-touch-view'
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
    path: '/last-unique-touch',
    title: t('brandSelector.lut.name'),
    description: t('brandSelector.lut.desc'),
  })
}

export default function LastUniqueTouchPage() {
  return <LastUniqueTouchView />
}
