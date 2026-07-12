'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname, Link } from '@/i18n/routing'
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface AdminBooking {
  id: string
  customerName: string
  customerPhone: string
  startDate: string
  endDate: string
  status: string
  totalAmount: number
  productName: string
  productSlug: string
}

interface BookingsTableProps {
  bookings: AdminBooking[]
  currentStatus: string
  currentSearch: string
  locale: string
  // V29 / F8 #12: pagination props. Both default to safe values so any
  // existing callers that don't pass them keep working (no pagination
  // control rendered when totalPages <= 1).
  currentPage?: number
  totalPages?: number
}

// Semantic status colors — no indigo/blue (per project policy).
// Emerald = success/info (confirmed, completed), amber = pending,
// rose = cancelled/failed. Matches the dashboard badges and the
// R1-D C5 fix recommendation.
const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  PAYMENT_FAILED: 'bg-rose-100 text-rose-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
}

export function BookingsTable({
  bookings,
  currentStatus,
  currentSearch: _currentSearch,
  locale: _locale,
  currentPage = 1,
  totalPages = 1,
}: BookingsTableProps) {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('q') ?? '')
  const isFirstRender = useRef(true)

  // V9 Fix #6: include PAYMENT_FAILED in the filter chips so admins can
  // find and retry/cancel bookings whose payment failed.
  const statusFilters = ['all', 'PENDING', 'CONFIRMED', 'PAYMENT_FAILED', 'CANCELLED', 'COMPLETED']

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      if (searchValue) {
        params.set('q', searchValue)
      } else {
        params.delete('q')
      }
      params.delete('page')
      router.replace(`${pathname}?${params.toString()}`)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchValue, searchParams, router, pathname])

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams)
    if (status !== 'all') {
      params.set('status', status)
    } else {
      params.delete('status')
    }
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`)
  }

  // V29 / F8 #12: build a paginated href that preserves the current status +
  // q filters (and any other params) while swapping in the new `page` value.
  // Uses `Link` from the i18n router so the href is locale-prefixed correctly.
  const buildPageHref = (page: number) => {
    const params = new URLSearchParams(searchParams)
    if (page > 1) {
      params.set('page', String(page))
    } else {
      params.delete('page')
    }
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  const showPagination = totalPages > 1
  const canPrev = currentPage > 1
  const canNext = currentPage < totalPages

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('admin.bookings.table.customer') + ' / ' + t('admin.bookings.detail.phone') + ' / ' + t('admin.bookings.detail.email')}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="ps-10 bg-card"
          />
        </div>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((status) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            aria-pressed={currentStatus === status}
            className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              currentStatus === status
                ? 'bg-lut text-white'
                : 'bg-card border border-border text-foreground hover:bg-muted'
            }`}
>
            {status === 'all' ? t('admin.bookings.filterStatus.all') : t(`admin.bookings.filterStatus.${status}` as const)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-start py-3 px-4 font-medium text-muted-foreground">{t('admin.bookings.table.id')}</th>
                <th className="text-start py-3 px-4 font-medium text-muted-foreground">{t('admin.bookings.table.customer')}</th>
                <th className="text-start py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">{t('admin.bookings.table.product')}</th>
                <th className="text-start py-3 px-4 font-medium text-muted-foreground">{t('admin.bookings.table.status')}</th>
                <th className="text-start py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">{t('admin.bookings.table.total')}</th>
                <th className="text-start py-3 px-4 font-medium text-muted-foreground">{t('admin.bookings.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    {t('admin.common.noData')}
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-border">
                    <td className="py-3 px-4 text-muted-foreground font-mono text-xs" dir="ltr">
                      {booking.id.slice(-8)}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">{booking.customerName}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{booking.productName}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[booking.status] ?? 'bg-muted text-muted-foreground'}`}>
                        {t(`admin.bookings.filterStatus.${booking.status}` as const)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium hidden sm:table-cell">
                      {booking.totalAmount.toFixed(3)} {t('common.currency')}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        aria-label={t('admin.bookings.view')}
                        className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* V29 / F8 #12: basic Prev/Next pagination. Only rendered when there
          is more than one page. Uses locale-aware `Link` so the URLs are
          prefixed correctly and prefetchable; preserves existing status / q
          filters via `buildPageHref`. */}
      {showPagination && (
        <nav
          className="flex items-center justify-between gap-4 pt-2"
          aria-label={t('admin.bookings.title')}
        >
          <Link
            href={buildPageHref(currentPage - 1)}
            aria-label={t('admin.bookings.pagination.previous')}
            aria-disabled={!canPrev}
            className={`inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
              canPrev
                ? 'border-border bg-card text-foreground hover:bg-muted'
                : 'border-border bg-card text-muted-foreground pointer-events-none opacity-50'
            }`}
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            {t('admin.bookings.pagination.previous')}
          </Link>

          <span className="text-sm text-muted-foreground" aria-live="polite">
            {t('admin.bookings.pagination.pageOf', { current: currentPage, total: totalPages })}
          </span>

          <Link
            href={buildPageHref(currentPage + 1)}
            aria-label={t('admin.bookings.pagination.next')}
            aria-disabled={!canNext}
            className={`inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
              canNext
                ? 'border-border bg-card text-foreground hover:bg-muted'
                : 'border-border bg-card text-muted-foreground pointer-events-none opacity-50'
            }`}
          >
            {t('admin.bookings.pagination.next')}
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </nav>
      )}
    </div>
  )
}
