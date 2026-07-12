import { cookies } from 'next/headers'
import type { Brand } from '@prisma/client'
import { ADMIN_BRAND_COOKIE } from './products'

const VALID_BRANDS: readonly Brand[] = ['LUT', 'LA_LOUNGE', 'YOUR_BIRTHDAY'] as const

/**
 * Read the admin-selected brand from the `admin-brand` cookie. Returns 'LUT'
 * if the cookie is missing or holds an unknown value. Server-only.
 */
export async function getAdminBrand(): Promise<Brand> {
  const store = await cookies()
  const raw = store.get(ADMIN_BRAND_COOKIE)?.value
  if (raw && VALID_BRANDS.includes(raw as Brand)) {
    return raw as Brand
  }
  return 'LUT'
}
