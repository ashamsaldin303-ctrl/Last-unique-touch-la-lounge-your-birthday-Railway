'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  categorySlug?: string
  search?: string
  sort: string
}

export function Pagination({
  currentPage,
  totalPages,
  categorySlug,
  search,
  sort,
}: PaginationProps) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  if (totalPages <= 1) return null

  const buildUrl = (page: number) => {
    const params = new URLSearchParams()
    if (categorySlug) params.set('category', categorySlug)
    if (search) params.set('q', search)
    if (sort && sort !== 'newest') params.set('sort', sort)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    return `${pathname}${qs ? `?${qs}` : ''}`
  }

  const goTo = (page: number) => {
    if (page < 1 || page > totalPages) return
    router.replace(buildUrl(page))
  }

  // Generate page numbers with ellipsis logic
  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible + 2) {
      // Show all pages if not too many
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) pages.push(i)

      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()
  const isRtl = locale === 'ar'
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft
  const NextIcon = isRtl ? ChevronLeft : ChevronRight

  return (
    <nav
      className="flex items-center justify-center gap-2 mt-12"
      aria-label={t('products.page')}
    >
      {/* Previous button */}
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label={t('products.previous')}
      >
        <PrevIcon className="w-4 h-4" />
      </button>

      {/* Page numbers */}
      {pageNumbers.map((pageNum, idx) => {
        if (pageNum === '...') {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground"
            >
              ...
            </span>
          )
        }
        const isActive = pageNum === currentPage
        return (
          <button
            key={pageNum}
            onClick={() => goTo(pageNum)}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md border text-sm font-medium transition-colors ${
              isActive
                ? 'bg-lut text-primary-foreground border-lut'
                : 'bg-card text-foreground border-border hover:bg-secondary'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {pageNum}
          </button>
        )
      })}

      {/* Next button */}
      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label={t('products.next')}
      >
        <NextIcon className="w-4 h-4" />
      </button>
    </nav>
  )
}
