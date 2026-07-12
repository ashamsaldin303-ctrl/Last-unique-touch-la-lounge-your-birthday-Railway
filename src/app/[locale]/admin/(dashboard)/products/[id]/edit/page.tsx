import { notFound } from 'next/navigation'
import { getCategoriesByBrand, parseImages, type ProductWithImages } from '@/lib/products'
import { getAdminBrand } from '@/lib/admin-brand'
import { db } from '@/lib/db'
import { ProductForm } from '@/components/admin/product-form'
import type { Brand } from '@prisma/client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  const brand = await getAdminBrand()

  // Scope by brand to prevent cross-tenant read
  const product = await db.product.findFirst({
    where: { id, brand },
    include: { category: { select: { id: true, nameAr: true, nameEn: true, slug: true } } },
  })
  if (!product) notFound()

  const categories = await getCategoriesByBrand(brand as Brand)
  const productWithImages: ProductWithImages = { ...product, images: parseImages(product.images) }

  return <ProductForm categories={categories} product={productWithImages} mode="edit" brand={brand as 'LUT' | 'LA_LOUNGE' | 'YOUR_BIRTHDAY'} />
}
