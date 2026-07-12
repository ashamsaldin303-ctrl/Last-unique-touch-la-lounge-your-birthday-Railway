import { type Prisma, type Brand, type Category } from '@prisma/client'
import { unstable_cache } from 'next/cache'
import { db } from './db'

/**
 * Cookie name used by the admin brand switcher (AdminShell). Server components
 * read it to scope product lists & categories to the currently selected tenant.
 */
export const ADMIN_BRAND_COOKIE = 'admin-brand'

/**
 * Parse images field to array of URLs.
 *
 * On PostgreSQL the `images` column is native `Json`, so Prisma returns a
 * `JsonValue` (number | string | boolean | null | JsonObject | JsonArray).
 * We accept any of these and narrow to `string[]`. A JSON-string input is
 * still accepted for backward compatibility with any code path that might
 * receive one (e.g. legacy caches).
 */
export function parseImages(imagesField: unknown): string[] {
  if (imagesField == null) return []
  if (Array.isArray(imagesField)) {
    return imagesField.filter((v): v is string => typeof v === 'string')
  }
  if (typeof imagesField === 'string') {
    try {
      const parsed = JSON.parse(imagesField)
      return Array.isArray(parsed)
        ? parsed.filter((v): v is string => typeof v === 'string')
        : []
    } catch {
      return []
    }
  }
  return []
}

/**
 * Normalize image URLs for storage.
 *
 * PostgreSQL `Json` columns accept a JS array directly, so this is now a
 * pass-through (kept for call-site compatibility). Previously it produced a
 * JSON string for SQLite's TEXT column.
 */
export function stringifyImages(images: string[]): string[] {
  return images
}

/**
 * Get localized product name based on locale.
 */
export function localizedName(
  nameAr: string,
  nameEn: string,
  locale: string
): string {
  return locale === 'ar' ? nameAr : nameEn
}

/**
 * Product type with parsed images array.
 */
export interface ProductWithImages {
  id: string
  brand: string
  slug: string
  nameAr: string
  nameEn: string
  descriptionAr: string
  descriptionEn: string
  rentalPricePerDay: number
  securityDeposit: number
  images: string[]
  model3dUrl: string | null
  stock: number
  isActive: boolean
  categoryId: string
  category: {
    id: string
    nameAr: string
    nameEn: string
    slug: string
  }
  createdAt: Date
  updatedAt: Date
}

/**
 * Get featured products for landing page.
 *
 * NOTE: `brand` is optional. When omitted, the query is no longer scoped by
 * brand — callers (e.g. the landing page) explicitly pass the brand they want
 * to feature. This fixes the multi-tenant bug where `LUT` was hard-coded and
 * LA_LOUNGE / YOUR_BIRTHDAY products could never be featured.
 */
export async function getFeaturedProducts(
  limit = 4,
  brand?: Brand
): Promise<ProductWithImages[]> {
  const products = await db.product.findMany({
    where: {
      ...(brand ? { brand } : {}),
      isActive: true,
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      category: {
        select: { id: true, nameAr: true, nameEn: true, slug: true },
      },
    },
  })

  return products.map((p) => ({
    ...p,
    images: parseImages(p.images),
  }))
}

/**
 * Get all categories for a brand (for filter sidebar).
 *
 * Perf fix: wrapped in `unstable_cache` so the storefront reads hit the
 * cached value (TTL 1h) instead of hitting SQLite on every navigation.
 * The cache is keyed on `brand` (the callback arg) + the static `categories`
 * key part, and is tagged `categories` so admin mutations can call
 * `revalidateTag('categories')` to bust it immediately.
 */
export const getCategoriesByBrand = unstable_cache(
  async (brand: Brand = 'LUT'): Promise<Category[]> => {
    return db.category.findMany({
      where: { brand },
      orderBy: { nameEn: 'asc' },
    })
  },
  ['categories'],
  { revalidate: 3600, tags: ['categories'] }
)

/**
 * Product list query parameters.
 */
export interface ProductListParams {
  brand?: Brand
  categorySlug?: string
  search?: string
  sort?: 'newest' | 'price-asc' | 'price-desc'
  page?: number
  pageSize?: number
}

/**
 * Sort options type.
 */
export type ProductSort = 'newest' | 'price-asc' | 'price-desc'

/**
 * Result of getProducts query.
 */
export interface ProductListResult {
  products: ProductWithImages[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Get paginated, filtered, sorted product list.
 *
 * `brand` is optional. When omitted, the query is NOT scoped by brand (matches
 * products across all tenants). This fixes the multi-tenant bug where `LUT`
 * was hard-coded as the default. Admin callers pass an explicit brand read
 * from the `admin-brand` cookie via `getAdminBrand()`.
 *
 * PERF (V29 / F8 #11): wrapped in `unstable_cache` (5-min TTL, tagged
 * `products`) — matches the pattern already used by `getProductBySlug` and
 * `getCategoriesByBrand`. The cache key is derived from the full
 * `ProductListParams` argument, so different brand/category/search/sort/page
 * combos get distinct cache entries. Admin product mutations call
 * `revalidateTag('products')` (already wired up wherever products are written)
 * to bust the entire product cache immediately.
 */
export const getProducts = unstable_cache(
  async (params: ProductListParams = {}): Promise<ProductListResult> => {
    const {
      brand,
      categorySlug,
      search,
      sort = 'newest',
      page = 1,
      pageSize = 12,
    } = params

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    }

    // Brand filter (only applied when an explicit brand is provided)
    if (brand) {
      where.brand = brand
    }

    // Category filter
    if (categorySlug) {
      where.category = { slug: categorySlug }
    }

    // Text search (SQLite-friendly: case-insensitive contains)
    if (search && search.trim()) {
      const q = search.trim()
      where.OR = [
        { nameAr: { contains: q } },
        { nameEn: { contains: q } },
        { descriptionAr: { contains: q } },
        { descriptionEn: { contains: q } },
      ]
    }

    // Sort
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === 'price-asc' ? { rentalPricePerDay: 'asc' } :
      sort === 'price-desc' ? { rentalPricePerDay: 'desc' } :
      { createdAt: 'desc' }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: {
            select: { id: true, nameAr: true, nameEn: true, slug: true },
          },
        },
      }),
      db.product.count({ where }),
    ])

    return {
      products: products.map((p) => ({
        ...p,
        images: parseImages(p.images),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  },
  ['products-list'],
  { revalidate: 300, tags: ['products'] }
)

/**
 * Get a single product by slug (for product detail page — Phase 4).
 *
 * `brand` is REQUIRED for the storefront (V9 Fix #2): without it,
 * `getProductBySlug('gold-luxury-sofa')` would return a La Lounge
 * product even on the LUT storefront, leaking cross-tenant data.
 * Admin callers may omit `brand` to look up by slug across tenants.
 *
 * The lookup still accepts either a slug OR an id (the `OR` clause) so
 * the booking detail page can resolve a stored `productId` even if the
 * admin later changes the slug — but ONLY within the requested brand.
 *
 * PERF (V14): wrapped in `unstable_cache` (5-min TTL, tagged `products`)
 * so repeated PDP hits (e.g. a user navigating back to the product) skip
 * the SQLite round-trip. Admin mutations call `revalidateTag('products')`
 * to bust the cache immediately after a product is updated/deleted.
 */
export const getProductBySlug = unstable_cache(
  async (slug: string, brand?: Brand): Promise<ProductWithImages | null> => {
    const product = await db.product.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        isActive: true,
        // Brand filter — only applied when an explicit brand is provided.
        // Storefront callers MUST pass brand='LUT' (or their tenant) to
        // prevent cross-tenant access (V9 Fix #2). Admin callers can omit
        // it to look up across tenants.
        ...(brand ? { brand } : {}),
      },
      include: {
        category: {
          select: { id: true, nameAr: true, nameEn: true, slug: true },
        },
      },
    })

    if (!product) return null

    return {
      ...product,
      images: parseImages(product.images),
    }
  },
  ['product-by-slug'],
  { revalidate: 300, tags: ['products'] }
)

/**
 * Check if a product is available for booking in a given date range.
 *
 * V9 Fix #4: stock-aware. Previously this returned `available: false` if
 * ANY overlapping CONFIRMED/PENDING booking existed — which made products
 * with stock>1 effectively unusable (only one booking per date range was
 * ever allowed, even when the product had 10 in stock). Now we sum the
 * `quantity` of overlapping bookings and compare against `product.stock`.
 *
 * `requestedQuantity` defaults to 1 for backward compatibility with
 * callers that don't pass it (e.g. the PDP availability check).
 *
 * PERF (V14): the function used to do its own `db.product.findUnique` to
 * read `stock`, which meant the availability endpoint issued TWO product
 * queries (one to verify brand + one to read stock). Callers that have
 * already fetched stock (e.g. the availability route does it inside the
 * brand-scoped findFirst) can now pass `productStock` to skip the second
 * query.
 */
export async function checkProductAvailability(
  productId: string,
  startDate: Date,
  endDate: Date,
  requestedQuantity: number = 1,
  productStock?: number
): Promise<{ available: boolean; conflictingBookings: number; availableStock: number }> {
  // Load the product's stock (needed to compute available stock). Callers
  // that already have it can pass it via `productStock` to skip this query.
  const stock = productStock ?? (await db.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  }))?.stock ?? 0

  // Fetch all overlapping CONFIRMED/PENDING bookings and sum their quantities.
  const overlappingBookings = await db.booking.findMany({
    where: {
      productId,
      status: { in: ['CONFIRMED', 'PENDING'] },
      // Overlap condition: existing booking (s, e) overlaps with (startDate, endDate)
      // if startDate < e AND endDate > s
      AND: [
        { startDate: { lt: endDate } },
        { endDate: { gt: startDate } },
      ],
    },
    select: { quantity: true },
  })

  const conflictingBookings = overlappingBookings.length
  const totalBookedQuantity = overlappingBookings.reduce(
    (sum, b) => sum + (b.quantity ?? 1),
    0
  )
  const availableStock = Math.max(0, stock - totalBookedQuantity)

  return {
    available: availableStock >= requestedQuantity,
    conflictingBookings,
    availableStock,
  }
}

/**
 * Get related products (same category, different slug, with stock).
 */
export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  brand: Brand = 'LUT',
  limit = 4
): Promise<ProductWithImages[]> {
  const products = await db.product.findMany({
    where: {
      brand,
      isActive: true,
      categoryId,
      id: { not: productId },
      stock: { gt: 0 },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      category: {
        select: { id: true, nameAr: true, nameEn: true, slug: true },
      },
    },
  })

  return products.map((p) => ({
    ...p,
    images: parseImages(p.images),
  }))
}

/**
 * Calculate total rental price for a booking.
 */
export function calculateRentalTotal(
  rentalPricePerDay: number,
  securityDeposit: number,
  startDate: Date,
  endDate: Date,
  quantity: number = 1
): { days: number; subtotal: number; deposit: number; total: number } {
  // Perf / safety fix: if either date is Invalid Date, `endDate.getTime() -
  // startDate.getTime()` would yield NaN, which propagates through `Math.max`
  // and `Math.ceil` into a NaN total that breaks the cart summary UI. Bail
  // out with zeros instead.
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { days: 0, subtotal: 0, deposit: 0, total: 0 }
  }

  const msPerDay = 24 * 60 * 60 * 1000
  const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay))
  const subtotal = rentalPricePerDay * days * quantity
  const deposit = securityDeposit * quantity
  return {
    days,
    subtotal,
    deposit,
    total: subtotal + deposit,
  }
}
