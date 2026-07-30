'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getAdminBrand } from '@/lib/admin-brand'
import { revalidatePath, revalidateTag } from 'next/cache'

const categorySchema = z.object({
  nameAr: z.string().min(1).max(200),
  nameEn: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
})

export async function createCategoryAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  await requireAuth()

  const parsed = categorySchema.safeParse({
    nameAr: formData.get('nameAr'),
    nameEn: formData.get('nameEn'),
    slug: formData.get('slug'),
  })

  if (!parsed.success) {
    return { success: false, error: 'invalid_input' }
  }

  try {
    const brand = await getAdminBrand()

    // `slug` is only unique within a brand (`@@unique([brand, slug])`), so
    // the duplicate-slug check must be scoped to the same brand the new
    // category will belong to. Otherwise we'd block creating the same slug
    // in a different tenant.
    const existing = await db.category.findFirst({
      where: { slug: parsed.data.slug, brand },
    })
    if (existing) {
      return { success: false, error: 'slug_exists' }
    }

    await db.category.create({
      data: {
        ...parsed.data,
        brand,
      },
    })

    // R2-B-2: bust storefront caches after category create. Categories drive
    // the filter sidebar on the products list page and the category filters in
    // unstable_cache (getCategoriesByBrand, tagged 'categories').
    revalidateTag('categories', 'default')
    revalidatePath('/admin/categories')
    revalidatePath('/[locale]/products', 'page')
    revalidatePath('/[locale]', 'page')
    revalidatePath('/[locale]/last-unique-touch', 'page')
    revalidatePath('/[locale]/la-lounge', 'page')
    revalidatePath('/[locale]/your-birthday', 'page')
    return { success: true }
  } catch (error: unknown) {
    console.error('Create category error:', error)
    return { success: false, error: 'internal_error' }
  }
}

export async function updateCategoryAction(id: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  await requireAuth()

  const parsed = categorySchema.safeParse({
    nameAr: formData.get('nameAr'),
    nameEn: formData.get('nameEn'),
    slug: formData.get('slug'),
  })

  if (!parsed.success) {
    return { success: false, error: 'invalid_input' }
  }

  try {
    const brand = await getAdminBrand()

    // Ensure the category belongs to the current admin brand before editing.
    // Without this check an admin could update another tenant's category by id.
    const owned = await db.category.findFirst({ where: { id, brand } })
    if (!owned) {
      return { success: false, error: 'not_found' }
    }

    // Duplicate-slug check is scoped to the same brand because
    // `@@unique([brand, slug])` only enforces uniqueness within a tenant.
    const existing = await db.category.findFirst({
      where: { slug: parsed.data.slug, brand, NOT: { id } },
    })
    if (existing) {
      return { success: false, error: 'slug_exists' }
    }

    await db.category.update({
      where: { id },
      data: parsed.data,
    })

    // R2-B-2: bust storefront caches after category update (same set as create).
    revalidateTag('categories', 'default')
    revalidatePath('/admin/categories')
    revalidatePath('/[locale]/products', 'page')
    revalidatePath('/[locale]', 'page')
    revalidatePath('/[locale]/last-unique-touch', 'page')
    revalidatePath('/[locale]/la-lounge', 'page')
    revalidatePath('/[locale]/your-birthday', 'page')
    return { success: true }
  } catch (error: unknown) {
    console.error('Update category error:', error)
    return { success: false, error: 'internal_error' }
  }
}

export async function deleteCategoryAction(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth()

  try {
    const brand = await getAdminBrand()

    // Ensure the category belongs to the current admin brand before deleting.
    const owned = await db.category.findFirst({ where: { id, brand } })
    if (!owned) {
      return { success: false, error: 'not_found' }
    }

    // Check if category has products (scoped to the same brand — another
    // tenant's products in a category with the same id is impossible since
    // id is globally unique, but scoping by brand is defensive and correct
    // because `owned` already proved this category belongs to this brand).
    const productCount = await db.product.count({ where: { categoryId: id, brand } })
    if (productCount > 0) {
      return { success: false, error: 'has_products' }
    }

    await db.category.delete({ where: { id } })

    // R2-B-2: bust storefront caches after category delete (same set as create).
    revalidateTag('categories', 'default')
    revalidatePath('/admin/categories')
    revalidatePath('/[locale]/products', 'page')
    revalidatePath('/[locale]', 'page')
    revalidatePath('/[locale]/last-unique-touch', 'page')
    revalidatePath('/[locale]/la-lounge', 'page')
    revalidatePath('/[locale]/your-birthday', 'page')
    return { success: true }
  } catch (error: unknown) {
    console.error('Delete category error:', error)
    return { success: false, error: 'internal_error' }
  }
}
