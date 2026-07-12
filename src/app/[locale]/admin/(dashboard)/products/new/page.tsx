import { getCategoriesByBrand } from '@/lib/products'
import { getAdminBrand } from '@/lib/admin-brand'
import { ProductForm } from '@/components/admin/product-form'

export default async function NewProductPage() {
  // Read the admin-selected brand from the `admin-brand` cookie so a new
  // product is filed under the tenant the admin is currently managing.
  const brand = await getAdminBrand()
  const categories = await getCategoriesByBrand(brand)
  return <ProductForm categories={categories} mode="create" brand={brand} />
}
