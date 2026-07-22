import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export const revalidate = 3600

// R2E-4 + R2E-6 + R2E-9: Sitemap now (1) includes the 4 brand storefront
// pages, (2) emits ONE entry per route with `alternates.languages` for en/ar
// hreflang instead of two duplicate <url> rows, and (3) no longer stamps
// static pages with a synthetic `lastModified: new Date()` on every fetch
// (search engines deprioritize sitemaps where lastmod == fetch time).
// Product entries keep their real `updatedAt` from the DB.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const staticPages: Array<{
    path: string
    priority: number
    changeFrequency: 'weekly' | 'monthly'
  }> = [
    { path: '', priority: 1, changeFrequency: 'weekly' },
    { path: '/products', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/la-lounge', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/your-birthday', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/your-birthday/features', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/last-unique-touch', priority: 0.8, changeFrequency: 'monthly' },
    // v41-g2-F2 Fix #1: add the 3 brand-scoped contact routes so they get
    // hreflang alternates + crawl coverage. Priority 0.6 matches the main
    // `/contact` route (these are the same kind of page, just brand-scoped).
    { path: '/last-unique-touch/contact', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/la-lounge/contact', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/your-birthday/contact', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/privacy', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/refund', priority: 0.5, changeFrequency: 'monthly' },
  ]

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${baseUrl}/en${page.path}`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
    alternates: {
      languages: {
        en: `${baseUrl}/en${page.path}`,
        ar: `${baseUrl}/ar${page.path}`,
      },
    },
  }))

  // Fetch all active LUT products for dynamic product URLs.
  // product pages. La Lounge / Your Birthday products are not reachable
  // from the LUT storefront (getProductBySlug now 404s cross-tenant
  // slugs), so listing them here would create broken / leaking URLs.
  let products: Array<{ slug: string; updatedAt: Date }> = []
  try {
    products = await db.product.findMany({
      where: { brand: 'LUT', isActive: true },
      select: { slug: true, updatedAt: true },
    })
  } catch (error) {
    console.error('[sitemap] DB query failed, serving static-only sitemap:', error)
  }

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/en/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
    alternates: {
      languages: {
        en: `${baseUrl}/en/products/${product.slug}`,
        ar: `${baseUrl}/ar/products/${product.slug}`,
      },
    },
  }))

  return [...staticEntries, ...productEntries]
}
