import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  search?: string
  categorySlug?: string
}

export function EmptyState({ search: _search, categorySlug: _categorySlug }: EmptyStateProps) {
  const t = useTranslations()

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
        <SearchX className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {t('products.empty.title')}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {t('products.empty.subtitle')}
      </p>
      <Button
        asChild
        variant="outline"
        className="border-lut text-lut hover:bg-lut/10"
      >
        <Link href="/products">
          {t('products.empty.clearFilters')}
        </Link>
      </Button>
    </div>
  )
}
