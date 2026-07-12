import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import YourBirthdayPageClient from './page-client'
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
    path: '/your-birthday',
    title: t('brandSelector.birthday.name'),
    description: t('brandSelector.birthday.desc'),
  })
}

export default function Page() {
  return <YourBirthdayPageClient />
}
