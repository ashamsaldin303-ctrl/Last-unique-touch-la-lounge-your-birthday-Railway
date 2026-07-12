export interface CartItem {
  productId: string
  slug: string
  nameAr: string
  nameEn: string
  image: string
  rentalPricePerDay: number
  securityDeposit: number
  startDate: string
  endDate: string
  quantity: number
  days: number
  total: number
}

export const CART_KEY = 'lut_cart'

/**
 * R2-B-4: hard upper bounds on cart size.
 *
 * The server already caps each item's quantity at 100 (api/orders/route.ts
 * itemSchema), but the localStorage cart is client-controlled and was
 * previously unbounded. A tampered cart could carry thousands of items /
 * megabytes of JSON, and the cart UI would then render thousands of DOM
 * nodes → browser freeze. These constants cap both the per-line quantity
 * and the total number of distinct line items in the cart.
 */
export const MAX_CART_ITEMS = 50
export const MAX_QUANTITY_PER_ITEM = 100

/**
 * R2-B-6: validate a single parsed cart entry.
 *
 * localStorage is client-controlled — `JSON.parse(raw) as CartItem[]` was an
 * unsafe cast. Downstream code accesses `item.rentalPricePerDay.toFixed(3)`
 * and similar; if a tampered payload had the wrong shape (e.g. string
 * numbers, missing fields, prototype-pollution attempts), the cart UI would
 * crash. We accept only objects with the required primitive fields and
 * coerce nothing — anything else is dropped.
 *
 * Returns the validated CartItem, or `null` if the entry is malformed.
 */
function validateCartItem(item: unknown): CartItem | null {
  if (!item || typeof item !== 'object') return null
  const it = item as Record<string, unknown>
  if (typeof it.productId !== 'string') return null
  if (typeof it.slug !== 'string') return null
  if (typeof it.nameAr !== 'string') return null
  if (typeof it.nameEn !== 'string') return null
  if (typeof it.image !== 'string') return null
  if (typeof it.rentalPricePerDay !== 'number') return null
  if (typeof it.securityDeposit !== 'number') return null
  if (typeof it.startDate !== 'string') return null
  if (typeof it.endDate !== 'string') return null
  if (typeof it.quantity !== 'number' || !Number.isFinite(it.quantity)) return null
  if (typeof it.days !== 'number' || !Number.isFinite(it.days)) return null
  if (typeof it.total !== 'number' || !Number.isFinite(it.total)) return null
  return it as unknown as CartItem
}

/**
 * Read & validate the cart from localStorage.
 *
 * R2-B-6: parses defensively — a tampered / corrupted JSON entry is silently
 * dropped rather than crashing the UI. Returns `[]` if storage is empty, the
 * JSON is unparseable, or the parsed value isn't an array.
 */
export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Validate every entry; drop malformed ones. Also cap the total length
    // defensively (the upper bound is enforced on add/update, but a
    // pre-existing tampered cart could exceed it).
    const validated = parsed
      .map(validateCartItem)
      .filter((item): item is CartItem => item !== null)
    if (validated.length > MAX_CART_ITEMS) {
      return validated.slice(0, MAX_CART_ITEMS)
    }
    return validated
  } catch {
    return []
  }
}

/**
 * Persist the cart to localStorage + notify subscribers.
 *
 * Internal helper — callers must have already validated the array contents.
 */
function persistCart(cart: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  window.dispatchEvent(new Event('cart-updated'))
}

export function addToCart(item: CartItem): void {
  if (typeof window === 'undefined') return
  const cart = getCart()

  // R2-B-4: clamp the incoming quantity to the per-line cap so a buggy UI
  // or a malicious client can't bloat the cart past the same ceiling the
  // server enforces on submit.
  const clampedItem: CartItem = {
    ...item,
    quantity: Math.min(MAX_QUANTITY_PER_ITEM, Math.max(1, item.quantity)),
  }

  const existing = cart.findIndex(
    (c) =>
      c.productId === clampedItem.productId &&
      c.startDate === clampedItem.startDate &&
      c.endDate === clampedItem.endDate
  )
  if (existing >= 0) {
    // R2-B-4: clamp the merged quantity to the per-line cap.
    const mergedQty = Math.min(
      MAX_QUANTITY_PER_ITEM,
      cart[existing].quantity + clampedItem.quantity
    )
    cart[existing] = {
      ...cart[existing],
      quantity: mergedQty,
      total:
        cart[existing].rentalPricePerDay *
        cart[existing].days *
        mergedQty +
        cart[existing].securityDeposit * mergedQty,
    }
  } else {
    // R2-B-4: refuse to grow the cart beyond the distinct-item cap. If the
    // cart is already full, we silently drop the new item (the storefront
    // checkout realistically has at most a handful of distinct products).
    if (cart.length >= MAX_CART_ITEMS) return
    cart.push(clampedItem)
  }
  persistCart(cart)
}

export function removeFromCart(index: number): void {
  if (typeof window === 'undefined') return
  const cart = getCart()
  if (index < 0 || index >= cart.length) return
  cart.splice(index, 1)
  persistCart(cart)
}

export function updateQuantity(index: number, quantity: number): void {
  if (typeof window === 'undefined') return
  const cart = getCart()
  if (index < 0 || index >= cart.length) return
  const item = cart[index]
  if (!item) return
  // R2-B-4: clamp the requested quantity to [1, MAX_QUANTITY_PER_ITEM].
  const newQty = Math.min(MAX_QUANTITY_PER_ITEM, Math.max(1, quantity))
  cart[index] = {
    ...item,
    quantity: newQty,
    total: item.rentalPricePerDay * item.days * newQty + item.securityDeposit * newQty,
  }
  persistCart(cart)
}

export function clearCart(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_KEY)
  window.dispatchEvent(new Event('cart-updated'))
}

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0)
}

export function getCartTotal(): number {
  return getCart().reduce((sum, item) => sum + item.total, 0)
}
