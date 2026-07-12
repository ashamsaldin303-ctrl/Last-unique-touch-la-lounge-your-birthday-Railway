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
    path: '/terms',
    title: t('terms.title'),
    description: t('terms.subtitle'),
  })
}

export default async function TermsPage() {
  const t = await getTranslations()
  const locale = await getLocale()
  const content = await getContent(locale, 'terms')

  return (
    <LegalPageWrapper
      title={t('terms.title')}
      subtitle={t('terms.subtitle')}
      lastUpdated={t('terms.lastUpdated')}
    >
      <LegalContent content={content} />
    </LegalPageWrapper>
  )
}
