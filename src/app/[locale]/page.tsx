import type { Metadata } from 'next'
import { Hero } from '@/components/landing/hero'
import { JsonLd } from '@/components/seo/json-ld'
import { buildMetadata } from '@/lib/seo'
import { getPhoneNumber, isRealNumber } from '@/lib/contact-info'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildMetadata({
    locale: locale as 'ar' | 'en',
    path: '',
  })
}

/**
 * Organization JSON-LD for SEO. The `telephone` field is included ONLY when a
 * real phone number is configured via `NEXT_PUBLIC_PHONE_NUMBER` — otherwise
 * omitted entirely so we never publish the `965XXXXXXXX` placeholder to
 * search engines.
 *
 * FIX-4B / R3-E #7: use `NEXT_PUBLIC_SITE_URL` so preview / staging
 * deployments don't publish lastuniquetouch.com canonical URLs in their
 * JSON-LD. v29-fix-F8 #10: the fallback now matches `src/lib/seo.ts:3`
 * (`http://localhost:3000`) so all canonical-URL emitters agree on a single
 * default — previously this file emitted `https://lastuniquetouch.com` while
 * `seo.ts` emitted `http://localhost:3000`, leaking inconsistent hosts into
 * metadata + JSON-LD on unconfigured deployments.
 */
function buildOrganizationLd(): Record<string, unknown> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Last Unique Touch',
    description: 'Luxury furniture and event equipment rental in Kuwait',
    url: siteUrl,
    logo: `${siteUrl}/icon-192.png`,
    sameAs: ['https://instagram.com/last.unique.touch'],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@lastuniquetouch.com',
      contactType: 'customer service',
    },
  }

  const phone = getPhoneNumber()
  if (isRealNumber(phone)) {
    const contactPoint = base.contactPoint as { '@type': string; email: string; contactType: string }
    base.contactPoint = {
      ...contactPoint,
      telephone: phone,
    }
  }

  return base
}

const organizationLd = buildOrganizationLd()

// R2E-10: WebSite schema helps Google render a sitelinks search box and
// explicitly declares the site's canonical homepage URL + search action.
// leak lastuniquetouch.com URLs into their JSON-LD.
// v29-fix-F8 #10: fallback aligned with `src/lib/seo.ts:3`.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const websiteLd: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Last Unique Touch',
  url: siteUrl,
  inLanguage: ['ar', 'en'],
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/en/products?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function HomePage() {
  return (
    <div className="grain-overlay">
      <JsonLd data={organizationLd} />
      <JsonLd data={websiteLd} />
      {/* Phase 5 motion cleanup: <CustomCursor /> removed from home — it was
          visually competing with the holo-chamber card entrance animation.
          The component file is kept for future use on non-home routes. */}
      {/* FIX-1A: <Navbar /> and <Footer /> are now rendered by the
          [locale]/layout.tsx so they appear on every storefront route as
          flex siblings of <main> (sticky footer). */}
      <div>
        {/* Landing page — 3 brand selector cards over the 3D furniture tunnel.
            Each card navigates to its own dedicated page. */}
        <Hero />
      </div>
    </div>
  )
}
