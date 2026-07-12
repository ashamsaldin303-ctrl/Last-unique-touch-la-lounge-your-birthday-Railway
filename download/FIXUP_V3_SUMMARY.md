# Fixup v3 Summary — 8 P0 Fixes

## Fixes Applied

### #1: LUT page crash (drei Environment CSP block)
- **File:** `src/components/hero-3d/background-3d.tsx`
- **Fix:** Removed `<Environment preset="studio" />` — was fetching HDR from external URL blocked by CSP `connect-src 'self'`
- **Result:** LUT page loads without error

### #2: Admin categories scoped by brand
- **Files:** `categories/page.tsx`, `categories/actions.ts`
- **Fix:** Replaced hardcoded `brand: 'LUT'` with `getAdminBrand()` from cookie

### #3: Admin bookings scoped by brand + birthday bookings visible
- **File:** `bookings/page.tsx`
- **Fix:** Added `where: { brand }`, removed `.filter(b => b.product !== null)`, added fallback name for birthday bookings

### #4: Admin stats scoped by brand
- **Files:** `lib/admin-stats.ts`, `admin/(dashboard)/page.tsx`
- **Fix:** `getAdminStats(brand?)` parameter + dashboard passes brand

### #5: n8n webhook on booking confirmation
- **File:** `bookings/actions.ts`
- **Fix:** Calls `triggerOrderConfirmedWebhook()` when status → CONFIRMED (try/catch, non-blocking)

### #6: Placeholder contact info
- **Files:** `messages/{ar,en}.json`, `content/{ar,en}/*.md`, `page.tsx`, `contact-view.tsx`
- **Fix:** `+965 1234 5678` → `+965 9XXX XXXX`, Instagram → `@last.unique.touch`

### #7: La Lounge color (purple → hot pink)
- **Files:** `la-lounge-view.tsx`, `loading-screen.tsx`, `purple-waves-3d.tsx`
- **Fix:** All `purple-*` Tailwind classes → `primary-*`, hex `#A855F7` → `var(--primary)`

### #8: Dynamic copyright year
- **Files:** `footer.tsx`, `messages/{ar,en}.json`
- **Fix:** Hardcoded `2026` → `{year}` parameter with `new Date().getFullYear()`

## Verification
- typecheck: 0 errors ✅
- build: success ✅
- test: 35/35 pass ✅
- LUT page: no error ✅
- All pages: HTTP 200 ✅

## New env vars
- `N8N_WEBHOOK_URL` — n8n automation endpoint
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — WhatsApp floating button
