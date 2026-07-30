import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ContactView } from '@/components/contact/contact-view'
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
    path: '/your-birthday/contact',
    title: t('nav.contact'),
    description: t('contact.subtitle'),
  })
}

export default function YourBirthdayContactPage() {
  return (
    <div className="bg-background">
      <ContactView brand="birthday" />
    </div>
  )
}
