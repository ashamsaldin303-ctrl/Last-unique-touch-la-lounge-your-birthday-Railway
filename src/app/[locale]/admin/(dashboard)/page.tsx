import { getTranslations, getLocale } from 'next-intl/server'
import { getAdminStats } from '@/lib/admin-stats'
import { getAdminBrand } from '@/lib/admin-brand'
import { localizedName } from '@/lib/products'
import { Link } from '@/i18n/routing'
import { Package, Clock, CheckCircle, DollarSign, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react'

export default async function AdminDashboardPage() {
  const t = await getTranslations()
  const locale = await getLocale()
  const brand = await getAdminBrand()
  const stats = await getAdminStats(brand)

  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight

  const statCards = [
    {
      label: t('admin.dashboard.stats.totalProducts'),
      value: stats.totalProducts,
      icon: Package,
      color: 'text-gold',
      bg: 'bg-gold/10',
    },
    {
      label: t('admin.dashboard.stats.pendingBookings'),
      value: stats.pendingBookings,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      label: t('admin.dashboard.stats.confirmedBookings'),
      value: stats.confirmedBookings,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: t('admin.dashboard.stats.monthlyRevenue'),
      value: `${stats.monthlyRevenue.toFixed(3)} ${t('common.currency')}`,
      icon: DollarSign,
      color: 'text-lut',
      bg: 'bg-lut/10',
    },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">{t('admin.dashboard.title')}</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div key={idx} className="p-5 rounded-md bg-card border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-full ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* Recent bookings */}
      <div className="p-6 rounded-md bg-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">
            {t('admin.dashboard.recentBookings')}
          </h2>
          <Link href="/admin/bookings" className="text-sm text-lut hover:underline flex items-center gap-1">
            {t('admin.dashboard.viewAll')}
            <ArrowIcon className="w-3 h-3" />
          </Link>
        </div>

        {stats.recentBookings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t('admin.common.noData')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-start py-2 font-medium text-muted-foreground">{t('admin.bookings.table.customer')}</th>
                  <th className="text-start py-2 font-medium text-muted-foreground">{t('admin.bookings.table.product')}</th>
                  <th className="text-start py-2 font-medium text-muted-foreground">{t('admin.bookings.table.status')}</th>
                  <th className="text-start py-2 font-medium text-muted-foreground">{t('admin.bookings.table.total')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-border/50">
                    <td className="py-3 text-foreground">{booking.customerName}</td>
                    <td className="py-3 text-foreground">
                      {localizedName(booking.product.nameAr, booking.product.nameEn, locale)}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                        booking.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        booking.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                        booking.status === 'PAYMENT_FAILED' ? 'bg-rose-100 text-rose-700' :
                        booking.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {t(`admin.bookings.filterStatus.${booking.status}` as const)}
                      </span>
                    </td>
                    <td className="py-3 text-foreground font-medium">
                      {booking.totalAmount.toFixed(3)} {t('common.currency')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Low stock products */}
      {stats.lowStockProducts.length > 0 && (
        <div className="p-6 rounded-md bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-foreground">
              {t('admin.dashboard.lowStock')}
            </h2>
          </div>
          <div className="space-y-2">
            {stats.lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">
                  {localizedName(product.nameAr, product.nameEn, locale)}
                </span>
                <span className="text-sm font-bold text-amber-700">
                  {product.stock} {t('admin.products.stock')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
