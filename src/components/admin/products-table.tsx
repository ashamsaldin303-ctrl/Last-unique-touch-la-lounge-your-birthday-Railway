'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { Search, Pencil, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { useToast } from '@/components/providers/toast-provider'
import { deleteProductAction } from '@/app/[locale]/admin/(dashboard)/products/actions'
import { localizedName } from '@/lib/products'
import { useRouter } from '@/i18n/routing'
import type { Category } from '@prisma/client'

interface AdminProduct {
  id: string
  nameAr: string
  nameEn: string
  slug: string
  rentalPricePerDay: number
  stock: number
  isActive: boolean
  categoryId: string
  category: { nameAr: string; nameEn: string }
  firstImage: string | null
}

interface ProductsTableProps {
  products: AdminProduct[]
  categories: Category[]
  locale: string
}

export function ProductsTable({ products, categories, locale }: ProductsTableProps) {
  const t = useTranslations()
  const { showToast } = useToast()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const name = localizedName(p.nameAr, p.nameEn, locale).toLowerCase()
      if (search && !name.includes(search.toLowerCase())) return false
      if (categoryFilter !== 'all' && p.categoryId !== categoryFilter) return false
      if (statusFilter === 'active' && !p.isActive) return false
      if (statusFilter === 'inactive' && p.isActive) return false
      return true
    })
  }, [products, search, categoryFilter, statusFilter, locale])

  const handleDelete = async (id: string, _name: string) => {
    const result = await deleteProductAction(id)
    if (result.success) {
      showToast('success', t('admin.products.deleted'))
      router.refresh()
    } else {
      showToast('error', t('admin.errors.internal_error'))
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('admin.products.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10 bg-card"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-card">
            <SelectValue placeholder={t('admin.products.filterCategory')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.products.filterCategory')}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {locale === 'ar' ? c.nameAr : c.nameEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-card">
            <SelectValue placeholder={t('admin.products.filterStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.products.filterStatus')}</SelectItem>
            <SelectItem value="active">{t('admin.products.active')}</SelectItem>
            <SelectItem value="inactive">{t('admin.products.inactive')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-start py-3 px-4 font-medium text-muted-foreground">{t('admin.products.title')}</th>
                <th className="text-start py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">{t('admin.products.filterCategory')}</th>
                <th className="text-start py-3 px-4 font-medium text-muted-foreground">{t('admin.products.price')}</th>
                <th className="text-start py-3 px-4 font-medium text-muted-foreground">{t('admin.products.stock')}</th>
                <th className="text-start py-3 px-4 font-medium text-muted-foreground">{t('admin.products.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    {t('admin.common.noData')}
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr key={product.id} className="border-t border-border">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                          {product.firstImage ? (
                            <Image
                              src={product.firstImage}
                              alt={localizedName(product.nameAr, product.nameEn, locale)}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {localizedName(product.nameAr, product.nameEn, locale)}
                          </p>
                          <p className="text-xs text-muted-foreground">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">
                      {localizedName(product.category.nameAr, product.category.nameEn, locale)}
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">
                      {/* FIX-1C Fix 4: KWD uses 3 decimal places (1 fil = 0.001).
                          Previously rendered `{product.rentalPricePerDay}`
                          raw, which prints `5` for 5 KWD instead of `5.000`.
                          This made the admin product list inconsistent with
                          the cart / checkout / booking detail, all of which
                          use `.toFixed(3)`. */}
                      {product.rentalPricePerDay.toFixed(3)} {t('common.currency')}
                    </td>
                    <td className="py-3 px-4">
                      {/* FIX-4A: palette sweep — red/yellow → rose/amber */}
                      <span className={product.stock === 0 ? 'text-rose-600 font-bold' : product.stock <= 2 ? 'text-amber-600 font-bold' : 'text-foreground'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          aria-label={t('admin.products.edit')}
                          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <ConfirmDelete
                          trigger={
                            <span
                              aria-label={t('admin.products.delete')}
                              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-rose-50 text-muted-foreground hover:text-rose-600 transition-colors block"
                            >
                              <Trash2 className="w-4 h-4" />
                            </span>
                          }
                          itemName={localizedName(product.nameAr, product.nameEn, locale)}
                          onConfirm={() => handleDelete(product.id, localizedName(product.nameAr, product.nameEn, locale))}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
