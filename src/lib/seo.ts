import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const SITE_NAME = 'Last Unique Touch'

const DEFAULT_DESCRIPTION = {
  ar: 'منصة فاخرة لتأجير الأثاث ومعدات الأيفنتات في الكويت',
  en: 'Luxury platform for furniture and event equipment rental in Kuwait',
}

interface BuildMetadataParams {
  title?: string
  description?: string
  path?: string
  image?: string
  locale?: 'ar' | 'en'
  noIndex?: boolean
}

export function buildMetadata({
  title,
  description,
  path = '',
  image,
  locale = 'ar',
  noIndex = false,
}: BuildMetadataParams): Metadata {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — ${DEFAULT_DESCRIPTION[locale]}`
  const desc = description || DEFAULT_DESCRIPTION[locale]
  const url = `${BASE_URL}/${locale}${path}`
  const ogImage = image || `${BASE_URL}/og-default.png`

  return {
    title: fullTitle,
    description: desc,
    alternates: {
      canonical: url,
      languages: {
        ar: `${BASE_URL}/ar${path}`,
        en: `${BASE_URL}/en${path}`,
      },
    },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      locale: locale === 'ar' ? 'ar_KW' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: desc,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}
