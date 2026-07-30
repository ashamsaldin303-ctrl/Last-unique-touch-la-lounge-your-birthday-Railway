import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

/**
 * Your Birthday product-specific not-found page.
 *
 * Rendered when `notFound()` is called from
 * `your-birthday/products/[slug]/page.tsx` (i.e. the slug doesn't exist or
 * belongs to a non-YOUR_BIRTHDAY brand).
 *
 * Next.js sets the HTTP status to 404 automatically when this component
 * renders via `notFound()`. The segment-level not-found takes precedence
 * over the parent `[locale]/not-found.tsx` so the message can be tailored
 * to "product not found" rather than the generic "page not found".
 */
export default function YourBirthdayProductNotFound() {
  const t = useTranslations()

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
      <h2
        className="text-5xl font-bold mb-4"
        style={{ color: 'var(--primary)' }}
      >
        404
      </h2>
      <p className="text-muted-foreground mb-4">{t('common.notFound')}</p>
      <Link
        href="/your-birthday/products"
        className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {t('yourBirthdayProducts.title')}
      </Link>
    </div>
  )
}
