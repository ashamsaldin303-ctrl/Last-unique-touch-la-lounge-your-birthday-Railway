import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/routing'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface BreadcrumbsProps {
  categorySlug: string
  categoryNameAr: string
  categoryNameEn: string
  productName: string
}

export function Breadcrumbs({
  categorySlug,
  categoryNameAr,
  categoryNameEn,
  productName,
}: BreadcrumbsProps) {
  const t = useTranslations()
  const locale = useLocale()
  const Separator = locale === 'ar' ? ChevronLeft : ChevronRight
  const categoryName = locale === 'ar' ? categoryNameAr : categoryNameEn

  const items = [
    { label: t('product.breadcrumbs.home'), href: '/' as const },
    { label: t('product.breadcrumbs.products'), href: '/products' as const },
    {
      label: categoryName,
      href: `/products?category=${categorySlug}` as const,
    },
  ]

  return (
    <nav
      className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap"
      aria-label={t('a11y.breadcrumb')}
    >
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1.5">
          <Link
            href={item.href}
            className="hover:text-lut transition-colors"
          >
            {item.label}
          </Link>
          <Separator className="w-3 h-3 text-muted-foreground/60" />
        </span>
      ))}
      <span
        className="text-foreground font-medium truncate max-w-[200px]"
        aria-current="page"
      >
        {productName}
      </span>
    </nav>
  )
}
