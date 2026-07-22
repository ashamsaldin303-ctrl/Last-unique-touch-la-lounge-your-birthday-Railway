'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'
import { Instagram, Phone } from 'lucide-react'
import { buildWhatsappUrl, getPhoneNumber, isRealNumber } from '@/lib/contact-info'
import { resolveBrandFromPath, isHomePage } from '@/lib/brand'

export function Footer() {
  const t = useTranslations()
  const pathname = usePathname()
  const brand = resolveBrandFromPath(pathname)
  // SSR hydration flash.
  const homePage = isHomePage(pathname)

  // area renders its own AdminShell chrome and doesn't need the storefront
  // footer (legal links, social, etc.). next-intl strips the locale prefix
  // from usePathname() so /en/admin/* and /ar/admin/* both match.
  const isAdmin = pathname?.startsWith('/admin') ?? false

  // On the home page, don't show any single brand's name — the home page
  // is the umbrella landing for all 3 brands.
  const brandName =
    homePage
      ? null
      : brand === 'lalounge'
        ? t('brand.lalounge')
        : brand === 'birthday'
          ? t('brand.birthday')
          : t('brand.lut')

  const whatsappUrl = buildWhatsappUrl()
  const phoneNumber = getPhoneNumber()
  const showPhoneLine = isRealNumber(phoneNumber)

  if (isAdmin) return null

  return (
    <footer className="bg-ink/90 backdrop-blur-sm text-paper/60 relative overflow-hidden">
      {/* Gold hairline at top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2 mb-6">
              {/* Brand name hidden on home page (umbrella landing — no single brand) */}
              {brandName && (
                <span className="font-display text-3xl text-paper">
                  {brandName}
                </span>
              )}
              <span className="w-2 h-2 rounded-full bg-gold" />
            </div>
            <p className="text-sm leading-relaxed mb-8 max-w-sm">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com/last.unique.touch"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 flex items-center justify-center border border-paper/20 hover:border-gold hover:text-gold transition-[border-color,color] duration-300"
                aria-label={t('contact.info.instagram')}
              >
                <Instagram className="w-4 h-4" strokeWidth={1.3} />
              </a>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 flex items-center justify-center border border-paper/20 hover:border-gold hover:text-gold transition-[border-color,color] duration-300"
                  aria-label={t('contact.info.whatsapp')}
                >
                  <Phone className="w-4 h-4" strokeWidth={1.3} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="eyebrow text-gold mb-6">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/' as const, label: t('nav.home') },
                { href: '/products' as const, label: t('nav.products') },
                { href: '/about' as const, label: t('nav.about') },
                { href: '/contact' as const, label: t('nav.contact') },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={pathname === link.href ? 'page' : undefined}
                    className="text-sm hover:text-gold transition-colors duration-300 inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 h-px bg-gold group-hover:w-3 transition-[width] duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <h4 className="eyebrow text-gold mb-6">
              {t('footer.legal')}
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/terms' as const, label: t('footer.terms') },
                { href: '/privacy' as const, label: t('footer.privacy') },
                { href: '/refund' as const, label: t('footer.refund') },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={pathname === link.href ? 'page' : undefined}
                    className="text-sm hover:text-gold transition-colors duration-300 inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 h-px bg-gold group-hover:w-3 transition-[width] duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-2">
            <h4 className="eyebrow text-gold mb-6">
              {t('footer.contact')}
            </h4>
            <ul className="space-y-3 text-sm">
              {showPhoneLine && (
                <li dir="ltr" className="text-start">{phoneNumber}</li>
              )}
              <li>{t('footer.email')}</li>
              <li>{t('footer.address')}</li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-paper/10 mb-8" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Phase 5 contrast: bumped from text-paper/40 → text-paper/60 for
              WCAG AA (4.5:1) on the bg-ink/90 backdrop-blur-sm charcoal footer. The eyebrow
              line below stays decorative (text-paper/30, "Crafted in Kuwait"). */}
          <p className="text-xs text-paper/60">
            {homePage
              ? t('footer.rightsNeutral', { year: new Date().getFullYear() })
              : t('footer.rights', { year: new Date().getFullYear() })}
          </p>
          <p className="eyebrow text-paper/30">
            {t('footer.craftedIn')}
          </p>
        </div>
      </div>
    </footer>
  )
}
