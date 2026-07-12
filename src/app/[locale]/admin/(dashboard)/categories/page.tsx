import { getTranslations, getLocale } from 'next-intl/server'
import { db } from '@/lib/db'
import { getAdminBrand } from '@/lib/admin-brand'
import { CategoriesTable } from '@/components/admin/categories-table'

export default async function AdminCategoriesPage() {
  const t = await getTranslations()
  const locale = await getLocale()
  const brand = await getAdminBrand()

  const categories = await db.category.findMany({
    where: { brand },
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { nameEn: 'asc' },
  })

  const formatted = categories.map((c) => ({
    id: c.id,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
    slug: c.slug,
    productCount: c._count.products,
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t('admin.categories.title')}</h1>
      <CategoriesTable categories={formatted} locale={locale} />
    </div>
  )
}
