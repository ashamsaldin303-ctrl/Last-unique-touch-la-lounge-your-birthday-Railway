import { getTranslations, getLocale } from 'next-intl/server'
import { db } from '@/lib/db'
import { parseImages } from '@/lib/products'
import { getAdminBrand } from '@/lib/admin-brand'
import { Link } from '@/i18n/routing'
import { Plus } from 'lucide-react'
import { ProductsTable } from '@/components/admin/products-table'

export default async function AdminProductsPage() {
  const t = await getTranslations()
  const locale = await getLocale()
  // Filter the admin product list by the brand selected in the sidebar switcher.
  const brand = await getAdminBrand()

  const products = await db.product.findMany({
    where: { brand },
    include: {
      category: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const categories = await db.category.findMany({
    where: { brand },
    orderBy: { nameEn: 'asc' },
  })

  const formattedProducts = products.map((p) => ({
    id: p.id,
    nameAr: p.nameAr,
    nameEn: p.nameEn,
    slug: p.slug,
    rentalPricePerDay: p.rentalPricePerDay,
    stock: p.stock,
    isActive: p.isActive,
    categoryId: p.categoryId,
    category: p.category,
    firstImage: parseImages(p.images)[0] || null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('admin.products.title')}</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-lut text-white hover:bg-lut/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('admin.products.add')}
        </Link>
      </div>

      <ProductsTable products={formattedProducts} categories={categories} locale={locale} />
    </div>
  )
}
