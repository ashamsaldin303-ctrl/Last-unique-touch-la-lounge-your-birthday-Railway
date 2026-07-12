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
  // FIX-4B / R3-E #4: use buildMetadata so the contact page gets canonical,
  // alternates (hreflang), OG (with image dimensions), Twitter card, and
  // robots — matching the pattern used by every other storefront route.
  return buildMetadata({
    locale: locale as 'ar' | 'en',
    path: '/contact',
    title: t('nav.contact'),
    description: t('contact.subtitle'),
  })
}

export default function ContactPage() {
  return (
    // FIX-1A: <Navbar /> and <Footer /> are now rendered by the layout.
    <div className="bg-background">
      <ContactView />
    </div>
  )
}
