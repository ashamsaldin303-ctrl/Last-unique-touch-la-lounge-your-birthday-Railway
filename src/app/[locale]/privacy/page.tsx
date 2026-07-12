import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'
import { LegalPageWrapper } from '@/components/legal/page-header'
import { LegalContent } from '@/components/legal/legal-content'
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
    path: '/privacy',
    title: t('privacy.title'),
    description: t('privacy.subtitle'),
  })
}

export default async function PrivacyPage() {
  const t = await getTranslations()
  const locale = await getLocale()
  const content = await getContent(locale, 'privacy')

  return (
    <LegalPageWrapper
      title={t('privacy.title')}
      subtitle={t('privacy.subtitle')}
      lastUpdated={t('privacy.lastUpdated')}
    >
      <LegalContent content={content} />
    </LegalPageWrapper>
  )
}
