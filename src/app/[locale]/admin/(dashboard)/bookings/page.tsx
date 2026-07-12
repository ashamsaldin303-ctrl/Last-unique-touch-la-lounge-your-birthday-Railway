import { getTranslations, getLocale } from 'next-intl/server'
import { db } from '@/lib/db'
import { localizedName } from '@/lib/products'
import { getAdminBrand } from '@/lib/admin-brand'
import { BookingsTable } from '@/components/admin/bookings-table'

interface PageProps {
  searchParams: Promise<{
    status?: string
    q?: string
    page?: string
  }>
}

// V29 / F8 #12: paginate the admin bookings list. Previously the page fetched
// up to 50 bookings in one shot and silently dropped anything beyond that —
// meaning an admin with 200+ bookings could never see or act on the older
// ones. We now fetch 20 per page and expose a Prev/Next control in the
// BookingsTable. The `page` param is parsed defensively (NaN / out-of-range
// values fall back to 1).
const BOOKINGS_PAGE_SIZE = 20

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  const t = await getTranslations()
  const locale = await getLocale()
  const { status, q, page: pageParam } = await searchParams
  const brand = await getAdminBrand()

  const where: Record<string, unknown> = { brand }
  if (status && status !== 'all') {
    where.status = status
  }
  if (q && q.trim()) {
    where.OR = [
      { customerName: { contains: q.trim() } },
      { customerPhone: { contains: q.trim() } },
      { customerEmail: { contains: q.trim() } },
    ]
  }

  // Parse + clamp the page number. Anything non-numeric or < 1 falls back to
  // 1 (we don't know the last page until after the count, so the table hides
  // the "Next" button on the last page instead of clamping here).
  const requestedPage = Number.parseInt(pageParam ?? '1', 10)
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1

  const [bookings, total] = await Promise.all([
    db.booking.findMany({
      where,
      include: {
        product: {
          select: { id: true, nameAr: true, nameEn: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * BOOKINGS_PAGE_SIZE,
      take: BOOKINGS_PAGE_SIZE,
    }),
    db.booking.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / BOOKINGS_PAGE_SIZE))

  // Fallback label for non-product bookings (e.g. "Your Birthday" party
  // packages) which have `productId: null` and therefore no related Product.
  const birthdayPackageName = t('admin.birthdayPackage')

  const formatted = bookings.map((b) => ({
    id: b.id,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    status: b.status,
    totalAmount: b.totalAmount,
    productName: b.product
      ? localizedName(b.product.nameAr, b.product.nameEn, locale)
      : birthdayPackageName,
    productSlug: b.product?.slug ?? '',
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t('admin.bookings.title')}</h1>
      <BookingsTable
        bookings={formatted}
        currentStatus={status ?? 'all'}
        currentSearch={q ?? ''}
        locale={locale}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  )
}
