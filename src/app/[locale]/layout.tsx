import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { MotionConfig } from 'framer-motion'
import { routing } from '@/i18n/routing'
import { CartProvider } from '@/components/providers/cart-provider'
import { ToastProvider } from '@/components/providers/toast-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { BrandThemeSetter } from '@/components/providers/brand-theme-setter'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { FloatingWhatsApp } from '@/components/floating-whatsapp'
import { lutFonts, laLoungeFonts, birthdayFonts } from '@/app/fonts'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: 'Last Unique Touch',
      template: `%s | Last Unique Touch`,
    },
    description: t('brand.lut'),
    manifest: '/manifest.json',
    icons: {
      icon: '/icon-192.png',
      apple: '/icon-192.png',
    },
    alternates: {
      canonical: '/',
      languages: {
        en: '/en',
        ar: '/ar',
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'Last Unique Touch',
      images: [{ url: '/og-default.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [{ url: '/og-default.png', width: 1200, height: 630 }],
    },
  }
}

export const viewport: Viewport = {
  // `BrandThemeSetter` (it updates <meta name="theme-color"> on every
  // route change). The default declared here is LUT red so SSR / no-JS
  // falls back to the most common brand.
  themeColor: '#8B6B3D',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const t = await getTranslations()

  // (dead code — always returned 'lut'). The shared `resolveBrandFromPath`
  // lives in `src/lib/brand.ts` and is used by the client components
  // (navbar / footer / brand-theme-setter) that can actually read
  // `usePathname()`. SSR HTML defaults to 'lut'; `BrandThemeSetter`
  // corrects `data-brand` on hydration and every navigation.
  const brand = 'lut' as const

  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      data-brand={brand}
      className={[
        // Per-brand font sets — all 9 variables exposed on <html>.
        // globals.css `:root[data-brand="X"]` blocks map --font-display /
        // --font-body / --font-arabic to the active brand's set.
        //
        // PERF (V14): the 4 legacy loaders (Inter→--font-inter, Tajawal→
        // --font-tajawal, Cormorant→--font-display, DM Mono→--font-mono)
        // were removed. next/font preloads every woff2 for every loader
        // whose `.variable` class is attached to the DOM, so applying
        // 13 .variable classes on <html> forced 4 extra woff2 preloads
        // per page. We now apply only the 9 brand-scoped variables.
        lutFonts.display.variable,
        lutFonts.body.variable,
        lutFonts.arabic.variable,
        laLoungeFonts.display.variable,
        laLoungeFonts.body.variable,
        laLoungeFonts.arabic.variable,
        birthdayFonts.display.variable,
        birthdayFonts.body.variable,
        birthdayFonts.arabic.variable,
      ].join(' ')}
      suppressHydrationWarning
    >
      <head>
        {/* `theme-color` is exported via the `viewport` export below —
            declaring it again here would duplicate the meta tag and pin it
            to the LUT brand red regardless of which brand is active. */}
      </head>
      <body className="min-h-[100dvh] flex flex-col antialiased">
        {/* JSON-LD structured data (v49 Phase 2) — Organization + WebSite.
            Helps search engines understand the site. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  name: 'Last Unique Touch & La Lounge',
                  url: 'https://lastuniquetouch.com',
                  logo: 'https://lastuniquetouch.com/logo-lut.jpg',
                  description:
                    'Luxury furniture rental, event planning, and party celebration platform in Kuwait',
                  address: { '@type': 'PostalAddress', addressCountry: 'KW' },
                },
                {
                  '@type': 'WebSite',
                  name: 'Last Unique Touch & La Lounge',
                  url: 'https://lastuniquetouch.com',
                  potentialAction: {
                    '@type': 'SearchAction',
                    target:
                      'https://lastuniquetouch.com/products?q={search_term_string}',
                    'query-input': 'required name=search_term_string',
                  },
                },
              ],
            }),
          }}
        />
        {/* Skip-to-content link (WCAG 2.4.1 / C14) — first focusable element.
            v28-g2-F2 Fix 5: use logical `focus:start-4` (not physical
            `focus:left-4`) so the link appears on the START side in both LTR
            (left) and RTL (right) when focused. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:shadow-lg"
        >
          {t('a11y.skipToContent')}
        </a>

        <MotionConfig reducedMotion="user">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <NextIntlClientProvider>
              <CartProvider>
                <ToastProvider>
                  <BrandThemeSetter />
                  {/*
                    FIX-1A / C1: Navbar + Footer are now rendered as siblings
                    of <main> at the layout level (not inside individual page
                    components). This makes the sticky-footer pattern work
                    correctly: body is `min-h-[100dvh] flex flex-col`, main
                    has `flex-1`, so on short pages the footer is pushed to
                    the bottom of the viewport instead of sitting right under
                    the content. It also guarantees every route (including
                    the 3 brand landing pages) has the shared navbar/footer
                    (C2) so users can never get trapped on a brand page.

                    Navbar and Footer are client components that internally
                    return `null` on `/admin/*` routes so the admin shell
                    keeps its own chrome (admin-shell.tsx).
                  */}
                  <Navbar />
                  {/*
                    Centralized <main id="main-content"> so the skip-to-content
                    link works on every route (storefront, admin, etc.) without
                    each page having to remember to render one. Individual pages
                    and AdminShell use plain <div> wrappers for their styling so
                    we don't end up with nested <main> elements (F6).
                  */}
                  <main id="main-content" className="flex-1">
                    {children}
                  </main>
                  <Footer />
                  <FloatingWhatsApp />
                </ToastProvider>
              </CartProvider>
            </NextIntlClientProvider>
          </ThemeProvider>
        </MotionConfig>
      </body>
    </html>
  )
}
