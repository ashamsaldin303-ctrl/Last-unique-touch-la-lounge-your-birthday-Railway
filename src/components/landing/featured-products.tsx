import { getFeaturedProducts } from '@/lib/products'
import { FeaturedProductsClient } from './featured-products-client'

export async function FeaturedProducts() {
  const products = await getFeaturedProducts(4)
  return <FeaturedProductsClient products={products} />
}
