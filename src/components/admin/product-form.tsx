'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import type { Category } from '@prisma/client'
import type { ProductWithImages } from '@/lib/products'
import { createProductAction, updateProductAction } from '@/app/[locale]/admin/(dashboard)/products/actions'
import { useToast } from '@/components/providers/toast-provider'

interface ProductFormProps {
  categories: Category[]
  product?: ProductWithImages
  mode: 'create' | 'edit'
  /**
   * Brand (tenant) this product belongs to. In create mode, comes from the
   * `admin-brand` cookie (set by the AdminShell brand switcher). In edit mode,
   * preserved from the existing product's brand.
   */
  brand?: 'LUT' | 'LA_LOUNGE' | 'YOUR_BIRTHDAY'
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function ProductForm({ categories, product, mode, brand }: ProductFormProps) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [images, setImages] = useState<string[]>(
    product?.images ?? ['']
  )
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [nameEn, setNameEn] = useState(product?.nameEn ?? '')
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? '')
  const [isActive, setIsActive] = useState(product?.isActive ?? true)
  const [model3dUrl, setModel3dUrl] = useState(product?.model3dUrl ?? '')

  // Resolve the brand: explicit prop > existing product brand > LUT default.
  // Server components read the `admin-brand` cookie and pass it in, so a newly
  // created product is filed under the brand the admin is currently viewing.
  const effectiveBrand = brand ?? product?.brand ?? 'LUT'

  const handleNameEnChange = (value: string) => {
    setNameEn(value)
    if (mode === 'create') {
      setSlug(slugify(value))
    }
  }

  const addImage = () => {
    setImages([...images, ''])
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const updateImage = (index: number, value: string) => {
    setImages(images.map((img, i) => (i === index ? value : img)))
  }

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true)

    // Add dynamic fields to formData
    const validImages = images.filter((img) => img.trim())
    formData.set('images', JSON.stringify(validImages))
    formData.set('slug', slug)
    formData.set('categoryId', categoryId)
    formData.set('isActive', String(isActive))
    formData.set('model3dUrl', model3dUrl)

    const result = mode === 'create'
      ? await createProductAction(formData)
      : await updateProductAction(product?.id ?? '', formData)

    if (result.success) {
      router.push('/admin/products')
      router.refresh()
    } else {
      setSubmitting(false)
      const errorCode = result.error ?? 'internal_error'
      const errorKey = `admin.errors.${errorCode}`
      try {
        showToast('error', t(errorKey))
      } catch {
        showToast('error', t('admin.errors.internal_error'))
      }
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Brand (tenant) — hidden field submitted with the form so the server
          action files the product under the correct brand. */}
      <input type="hidden" name="brand" value={effectiveBrand} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {mode === 'create' ? t('admin.products.form.titleNew') : t('admin.products.form.titleEdit')}
        </h1>
      </div>

      {/* Names */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="nameAr">{t('admin.products.form.nameAr')}</Label>
          <Input
            id="nameAr"
            name="nameAr"
            defaultValue={product?.nameAr ?? ''}
            required
            className="bg-card"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nameEn">{t('admin.products.form.nameEn')}</Label>
          <Input
            id="nameEn"
            name="nameEn"
            value={nameEn}
            onChange={(e) => handleNameEnChange(e.target.value)}
            required
            className="bg-card"
          />
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="descriptionAr">{t('admin.products.form.descriptionAr')}</Label>
          <Textarea
            id="descriptionAr"
            name="descriptionAr"
            defaultValue={product?.descriptionAr ?? ''}
            rows={4}
            required
            className="bg-card"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="descriptionEn">{t('admin.products.form.descriptionEn')}</Label>
          <Textarea
            id="descriptionEn"
            name="descriptionEn"
            defaultValue={product?.descriptionEn ?? ''}
            rows={4}
            required
            className="bg-card"
          />
        </div>
      </div>

      {/* Category + Slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="categoryId">{t('admin.products.form.category')}</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder={t('admin.products.form.category')} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {locale === 'ar' ? c.nameAr : c.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="categoryId" value={categoryId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">{t('admin.products.form.slug')}</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            dir="ltr"
            className="bg-card"
          />
        </div>
      </div>

      {/* Pricing + Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="rentalPricePerDay">{t('admin.products.form.rentalPrice')}</Label>
          <Input
            id="rentalPricePerDay"
            name="rentalPricePerDay"
            type="number"
            step="0.001"
            min="0"
            defaultValue={product?.rentalPricePerDay ?? ''}
            required
            dir="ltr"
            className="bg-card"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="securityDeposit">{t('admin.products.form.securityDeposit')}</Label>
          <Input
            id="securityDeposit"
            name="securityDeposit"
            type="number"
            step="0.001"
            min="0"
            defaultValue={product?.securityDeposit ?? ''}
            required
            dir="ltr"
            className="bg-card"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stock">{t('admin.products.form.stock')}</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            defaultValue={product?.stock ?? ''}
            required
            dir="ltr"
            className="bg-card"
          />
        </div>
      </div>

      {/* Images */}
      <div className="space-y-2">
        <Label>{t('admin.products.form.images')}</Label>
        <div className="space-y-2">
          {images.map((img, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={img}
                onChange={(e) => updateImage(index, e.target.value)}
                placeholder={t('admin.products.form.imageUrlPlaceholder')}
                dir="ltr"
                className="bg-card"
              />
              {images.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeImage(index)}
                  className="shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addImage}
          className="mt-2"
        >
          <Plus className="w-4 h-4 me-2" />
          {t('admin.products.form.addImage')}
        </Button>
      </div>

      {/* 3D Model URL */}
      <div className="space-y-1.5">
        <Label htmlFor="model3dUrl">{t('admin.products.form.model3dUrl')}</Label>
        <Input
          id="model3dUrl"
          value={model3dUrl}
          onChange={(e) => setModel3dUrl(e.target.value)}
          placeholder="https://..."
          dir="ltr"
          className="bg-card"
        />
      </div>

      {/* Active checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="isActive"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(checked === true)}
        />
        <Label htmlFor="isActive" className="text-sm cursor-pointer">
          {t('admin.products.form.isActive')}
        </Label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-lut hover:bg-lut/90 text-white"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 me-2 animate-spin" />
              {t('common.saving')}
            </>
          ) : (
            t('admin.products.form.submit')
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/products')}
          className="border-border"
        >
          {t('admin.products.form.cancel')}
        </Button>
      </div>
    </form>
  )
}
