import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { db } from '@/lib/db'
import { getAdminBrand } from '@/lib/admin-brand'
import { BookingDetail } from '@/components/admin/booking-detail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminBookingDetailPage({ params }: PageProps) {
  const locale = await getLocale()
  const { id } = await params
  const brand = await getAdminBrand()

  // Scope by brand to prevent cross-tenant access
  const booking = await db.booking.findFirst({
    where: { id, brand },
    include: {
      product: {
        include: {
          category: { select: { nameAr: true, nameEn: true } },
        },
      },
    },
  })

  if (!booking) notFound()

  // Handle null product (birthday bookings) — don't 404
  const formatted = {
    id: booking.id,
    status: booking.status,
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    totalAmount: booking.totalAmount,
    currency: booking.currency,
    quantity: booking.quantity,
    createdAt: booking.createdAt.toISOString(),
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    customerEmail: booking.customerEmail,
    product: booking.product ? {
      nameAr: booking.product.nameAr,
      nameEn: booking.product.nameEn,
      slug: booking.product.slug,
      rentalPricePerDay: booking.product.rentalPricePerDay,
      securityDeposit: booking.product.securityDeposit,
      categoryNameAr: booking.product.category.nameAr,
      categoryNameEn: booking.product.category.nameEn,
    } : null,
  }

  return <BookingDetail booking={formatted} locale={locale} />
}
