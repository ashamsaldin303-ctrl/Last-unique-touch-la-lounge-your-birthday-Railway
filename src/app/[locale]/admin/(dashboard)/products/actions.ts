'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { stringifyImages } from '@/lib/products'
import { getAdminBrand } from '@/lib/admin-brand'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getLocale } from 'next-intl/server'
import { redirect } from '@/i18n/routing'

const productSchema = z.object({
  nameAr: z.string().min(1).max(200),
  nameEn: z.string().min(1).max(200),
  descriptionAr: z.string().min(1).max(5000),
  descriptionEn: z.string().min(1).max(5000),
  categoryId: z.string().min(1),
  rentalPricePerDay: z.number().min(0).max(100000),
  securityDeposit: z.number().min(0).max(100000),
  stock: z.number().int().min(0).max(10000),
  images: z.array(z.string().url()).min(1).max(10),
  model3dUrl: z.string().url().max(500).optional().or(z.literal('')),
  isActive: z.boolean(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
})

export async function createProductAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  await requireAuth()

  const imagesRaw = formData.get('images') as string
  let images: string[] = []
  try {
    images = JSON.parse(imagesRaw)
  } catch {
    return { success: false, error: 'invalid_input' }
  }

  const parsed = productSchema.safeParse({
    nameAr: formData.get('nameAr'),
    nameEn: formData.get('nameEn'),
    descriptionAr: formData.get('descriptionAr'),
    descriptionEn: formData.get('descriptionEn'),
    categoryId: formData.get('categoryId'),
    rentalPricePerDay: parseFloat(formData.get('rentalPricePerDay') as string),
    securityDeposit: parseFloat(formData.get('securityDeposit') as string),
    stock: parseInt(formData.get('stock') as string, 10),
    images,
    model3dUrl: (formData.get('model3dUrl') as string) || '',
    isActive: formData.get('isActive') === 'true',
    slug: formData.get('slug'),
  })

  if (!parsed.success) {
    return { success: false, error: 'invalid_input' }
  }

  let shouldRedirect = false
  try {
    // Read brand from cookie so admin can create products for the currently
    // selected tenant. Falls back to 'LUT' for backwards compatibility.
    const brand = await getAdminBrand()

    // Use findFirst because `slug` is no longer globally unique — it's only
    // unique within a brand (`@@unique([brand, slug])`). The duplicate-slug
    // check must therefore be scoped to the same brand the new product will
    // belong to, otherwise we'd block creating the same slug in a different
    // tenant.
    const existing = await db.product.findFirst({
      where: { slug: parsed.data.slug, brand },
    })
    if (existing) {
      return { success: false, error: 'slug_exists' }
    }

    // Ensure the selected category belongs to the same brand as the new
    // product. Without this check an admin could attach a product to another
    // tenant's category by submitting a foreign categoryId.
    const category = await db.category.findFirst({ where: { id: parsed.data.categoryId, brand } })
    if (!category) {
      return { success: false, error: 'invalid_category' }
    }

    await db.product.create({
      data: {
        ...parsed.data,
        brand,
        model3dUrl: parsed.data.model3dUrl || null,
        images: stringifyImages(parsed.data.images),
      },
    })

    // R2-B-2: bust the storefront cache after every admin mutation so the
    // product list, PDP, and home-page featured grid never serve stale data.
    // - revalidateTag('products') invalidates the `unstable_cache` entries in
    //   src/lib/products.ts (getProductBySlug + featured-products cache).
    // - revalidatePath('/admin/products') invalidates the admin product list.
    // - revalidatePath for the storefront routes invalidates the Next.js route
    //   cache for the products list, PDPs (any slug), and the brand landing
    //   pages that render featured products.
    revalidateTag('products', 'default')
    revalidatePath('/admin/products')
    revalidatePath('/[locale]/products', 'page')
    revalidatePath('/[locale]/products/[slug]', 'page')
    revalidatePath('/[locale]', 'page')
    revalidatePath('/[locale]/last-unique-touch', 'page')
    revalidatePath('/[locale]/la-lounge', 'page')
    revalidatePath('/[locale]/your-birthday', 'page')
    shouldRedirect = true
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error'
    console.error('Create product error:', message)
    return { success: false, error: 'internal_error' }
  }

  if (shouldRedirect) {
    const locale = await getLocale()
    redirect({ href: '/admin/products', locale })
  }
  return { success: false, error: 'internal_error' }
}

export async function updateProductAction(id: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  await requireAuth()

  const imagesRaw = formData.get('images') as string
  let images: string[] = []
  try {
    images = JSON.parse(imagesRaw)
  } catch {
    return { success: false, error: 'invalid_input' }
  }

  const parsed = productSchema.safeParse({
    nameAr: formData.get('nameAr'),
    nameEn: formData.get('nameEn'),
    descriptionAr: formData.get('descriptionAr'),
    descriptionEn: formData.get('descriptionEn'),
    categoryId: formData.get('categoryId'),
    rentalPricePerDay: parseFloat(formData.get('rentalPricePerDay') as string),
    securityDeposit: parseFloat(formData.get('securityDeposit') as string),
    stock: parseInt(formData.get('stock') as string, 10),
    images,
    model3dUrl: (formData.get('model3dUrl') as string) || '',
    isActive: formData.get('isActive') === 'true',
    slug: formData.get('slug'),
  })

  if (!parsed.success) {
    return { success: false, error: 'invalid_input' }
  }

  let shouldRedirect = false
  try {
    const brand = await getAdminBrand()

    // Ensure the product belongs to the current admin brand before editing.
    // Without this check an admin could update another tenant's product by id.
    const owned = await db.product.findFirst({ where: { id, brand } })
    if (!owned) {
      return { success: false, error: 'not_found' }
    }

    // Duplicate-slug check is scoped to the same brand because
    // `@@unique([brand, slug])` only enforces uniqueness within a tenant.
    const existing = await db.product.findFirst({
      where: { slug: parsed.data.slug, brand, NOT: { id } },
    })
    if (existing) {
      return { success: false, error: 'slug_exists' }
    }

    // Ensure the selected category (if provided) belongs to the same brand as
    // the product being edited. Without this check an admin could re-assign a
    // product to another tenant's category by submitting a foreign categoryId.
    if (parsed.data.categoryId) {
      const category = await db.category.findFirst({ where: { id: parsed.data.categoryId, brand } })
      if (!category) {
        return { success: false, error: 'invalid_category' }
      }
    }

    await db.product.update({
      where: { id },
      data: {
        ...parsed.data,
        model3dUrl: parsed.data.model3dUrl || null,
        images: stringifyImages(parsed.data.images),
      },
    })

    // R2-B-2: bust storefront caches after product update (same set as create).
    revalidateTag('products', 'default')
    revalidatePath('/admin/products')
    revalidatePath('/[locale]/products', 'page')
    revalidatePath('/[locale]/products/[slug]', 'page')
    revalidatePath('/[locale]', 'page')
    revalidatePath('/[locale]/last-unique-touch', 'page')
    revalidatePath('/[locale]/la-lounge', 'page')
    revalidatePath('/[locale]/your-birthday', 'page')
    shouldRedirect = true
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error'
    console.error('Update product error:', message)
    return { success: false, error: 'internal_error' }
  }

  if (shouldRedirect) {
    const locale = await getLocale()
    redirect({ href: '/admin/products', locale })
  }
  return { success: false, error: 'internal_error' }
}

export async function deleteProductAction(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth()
  const brand = await getAdminBrand()

  try {
    // Verify ownership before deleting (cross-tenant protection)
    const owned = await db.product.findFirst({ where: { id, brand } })
    if (!owned) return { success: false, error: 'not_found' }

    // Soft delete — set isActive to false
    await db.product.update({
      where: { id },
      data: { isActive: false },
    })

    // R2-B-2: bust storefront caches after product delete (soft-delete here,
    // but the storefront `where: { isActive: true }` filter sees the change).
    revalidateTag('products', 'default')
    revalidatePath('/admin/products')
    revalidatePath('/[locale]/products', 'page')
    revalidatePath('/[locale]/products/[slug]', 'page')
    revalidatePath('/[locale]', 'page')
    revalidatePath('/[locale]/last-unique-touch', 'page')
    revalidatePath('/[locale]/la-lounge', 'page')
    revalidatePath('/[locale]/your-birthday', 'page')
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error'
    console.error('Delete product error:', message)
    return { success: false, error: 'internal_error' }
  }
}
