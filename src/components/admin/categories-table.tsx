'use client'

import { useState, Fragment } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { useToast } from '@/components/providers/toast-provider'
import { useRouter } from '@/i18n/routing'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from '@/app/[locale]/admin/(dashboard)/categories/actions'
import { localizedName } from '@/lib/products'

interface AdminCategory {
  id: string
  nameAr: string
  nameEn: string
  slug: string
  productCount: number
}

interface CategoriesTableProps {
  categories: AdminCategory[]
  locale: string
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function CategoriesTable({ categories, locale }: CategoriesTableProps) {
  const t = useTranslations()
  const { showToast } = useToast()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async (formData: FormData) => {
    setSubmitting(true)
    const result = await createCategoryAction(formData)
    setSubmitting(false)
    if (result.success) {
      showToast('success', t('admin.categories.saved'))
      setShowForm(false)
      router.refresh()
    } else {
      showToast('error', t(`admin.errors.${result.error ?? 'internal_error'}`))
    }
  }

  const handleUpdate = async (id: string, formData: FormData) => {
    setSubmitting(true)
    const result = await updateCategoryAction(id, formData)
    setSubmitting(false)
    if (result.success) {
      showToast('success', t('admin.categories.saved'))
      setEditingCategory(null)
      router.refresh()
    } else {
      showToast('error', t(`admin.errors.${result.error ?? 'internal_error'}`))
    }
  }

  const handleDelete = async (id: string) => {
    const result = await deleteCategoryAction(id)
    if (result.success) {
      showToast('success', t('admin.categories.deleted'))
      router.refresh()
    } else if (result.error === 'has_products') {
      showToast('error', t('admin.categories.cannotDelete'))
    } else {
      showToast('error', t('admin.errors.internal_error'))
    }
  }

  return (
    <div className="space-y-4">
      {/* Add button */}
      {!showForm && !editingCategory && (
        <Button
          onClick={() => setShowForm(true)}
          className="bg-lut hover:bg-lut/90 text-primary-foreground"
        >
          <Plus className="w-4 h-4 me-2" />
          {t('admin.categories.add')}
        </Button>
      )}

      {/* Create form */}
      {showForm && (
        <CategoryForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          submitting={submitting}
        />
      )}

      {/* Table */}
      <div className="rounded-md bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-start py-3 px-4 font-medium text-muted-foreground">{t('admin.categories.title')}</th>
                <th className="text-start py-3 px-4 font-medium text-muted-foreground">{t('admin.categories.slug')}</th>
                <th className="text-start py-3 px-4 font-medium text-muted-foreground">{t('admin.categories.productCount')}</th>
                <th className="text-start py-3 px-4 font-medium text-muted-foreground">{t('admin.products.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">
                    {t('admin.common.noData')}
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <Fragment key={cat.id}>
                    {editingCategory?.id === cat.id ? (
                      <tr key={cat.id}>
                        <td colSpan={4} className="p-4">
                          <CategoryForm
                            category={editingCategory}
                            onSubmit={(fd) => handleUpdate(cat.id, fd)}
                            onCancel={() => setEditingCategory(null)}
                            submitting={submitting}
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr key={cat.id} className="border-t border-border">
                        <td className="py-3 px-4 font-medium text-foreground">
                          {localizedName(cat.nameAr, cat.nameEn, locale)}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground" dir="ltr">{cat.slug}</td>
                        <td className="py-3 px-4 text-foreground">{cat.productCount}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingCategory(cat)}
                              aria-label={t('admin.categories.edit')}
                              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <ConfirmDelete
                              trigger={
                                <span aria-label={t('admin.products.delete')} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-rose-50 text-muted-foreground hover:text-rose-600 transition-colors block">
                                  <Trash2 className="w-4 h-4" />
                                </span>
                              }
                              itemName={localizedName(cat.nameAr, cat.nameEn, locale)}
                              onConfirm={() => handleDelete(cat.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

interface CategoryFormProps {
  category?: AdminCategory
  onSubmit: (formData: FormData) => Promise<void>
  onCancel: () => void
  submitting: boolean
}

function CategoryForm({ category, onSubmit, onCancel, submitting }: CategoryFormProps) {
  const t = useTranslations()
  const [nameEn, setNameEn] = useState(category?.nameEn ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')

  const handleNameEnChange = (value: string) => {
    setNameEn(value)
    if (!category) {
      setSlug(slugify(value))
    }
  }

  return (
    <form
      action={onSubmit}
      className="p-4 rounded-md bg-muted/30 border border-border space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">
          {category ? t('admin.products.edit') : t('admin.categories.add')}
        </h3>
        <button type="button" onClick={onCancel} aria-label={t('common.close')} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="cat-nameAr">{t('admin.categories.nameAr')}</Label>
          <Input id="cat-nameAr" name="nameAr" defaultValue={category?.nameAr ?? ''} required className="bg-card" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cat-nameEn">{t('admin.categories.nameEn')}</Label>
          <Input
            id="cat-nameEn"
            name="nameEn"
            value={nameEn}
            onChange={(e) => handleNameEnChange(e.target.value)}
            required
            className="bg-card"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cat-slug">{t('admin.categories.slug')}</Label>
          <Input
            id="cat-slug"
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            dir="ltr"
            className="bg-card"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting} className="bg-lut hover:bg-lut/90 text-primary-foreground">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('admin.common.save')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="border-border">
          {t('admin.common.cancel')}
        </Button>
      </div>
    </form>
  )
}
