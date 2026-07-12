'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/routing'
import { LayoutDashboard, Package, FolderTree, CalendarDays, LogOut, Menu, X, ExternalLink } from 'lucide-react'
import { logoutAction } from '@/app/[locale]/admin/login/actions'
import { getBrandColor } from '@/lib/brand-colors'

/**
 * Multi-tenant brands the admin can switch between. Keys match the Prisma
 * `Brand` enum; `label` is shown in the switcher UI.
 *
 * FIX-1A / R1-D: the La Lounge label was previously "LA Lounge" (all-caps
 * "LA"), which didn't match the brand name in messages.json (`brand.lalounge`
 * = "La Lounge"). Aligned here so the admin UI is consistent with the
 * storefront and messages.
 */
const ADMIN_BRANDS = [
  { key: 'LUT', label: 'LUT' },
  { key: 'LA_LOUNGE', label: 'La Lounge' },
  { key: 'YOUR_BIRTHDAY', label: 'Your Birthday' },
] as const

const ADMIN_BRAND_COOKIE = 'admin-brand'
const ADMIN_BRAND_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

type AdminBrandKey = (typeof ADMIN_BRANDS)[number]['key']

/** Hex color used to paint the active brand pill in the switcher. */
function brandColor(brand: AdminBrandKey): string {
  return getBrandColor(brand)
}

/** Human-readable label for the active brand shown in the sidebar header. */
function brandLabel(brand: AdminBrandKey): string {
  return ADMIN_BRANDS.find((b) => b.key === brand)?.label ?? 'LUT'
}

function isValidBrand(value: string | null | undefined): value is AdminBrandKey {
  return !!value && (ADMIN_BRANDS.some((b) => b.key === value))
}

/**
 * Read the admin-brand cookie on the client. Returns 'LUT' if missing/invalid.
 * Used to highlight the currently active brand in the switcher.
 */
function readBrandCookie(): AdminBrandKey {
  if (typeof document === 'undefined') return 'LUT'
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${ADMIN_BRAND_COOKIE}=`))
  const value = match?.split('=')[1]
  return isValidBrand(value) ? value : 'LUT'
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations()
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Tracks the currently selected brand so the switcher shows the active one.
  // Initialised lazily from the cookie on first client render.
  const [activeBrand, setActiveBrand] = useState<AdminBrandKey>('LUT')
  // Refs for the mobile drawer focus trap (F5).
  const drawerRef = useRef<HTMLElement>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  // Hydrate the active brand from the cookie after mount to avoid SSR mismatch.
  useEffect(() => {
    setActiveBrand(readBrandCookie())
  }, [])

  const navLinks = [
    { href: '/admin' as const, label: t('admin.nav.dashboard'), icon: LayoutDashboard },
    { href: '/admin/products' as const, label: t('admin.nav.products'), icon: Package },
    { href: '/admin/categories' as const, label: t('admin.nav.categories'), icon: FolderTree },
    { href: '/admin/bookings' as const, label: t('admin.nav.bookings'), icon: CalendarDays },
  ]

  const handleLogout = async () => {
    await logoutAction()
    router.push('/admin/login')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  /**
   * Persist the selected brand to the `admin-brand` cookie and trigger a
   * server re-render so every admin page picks up the new tenant scope.
   *
   * security/data-fix #4: the `secure` flag is added in production so the
   * cookie is only transmitted over HTTPS (defense-in-depth against MITM
   * cookie theft on public Wi-Fi). Dev/local runs over plain http so the
   * flag is omitted there.
   */
  const handleBrandChange = (brand: AdminBrandKey) => {
    if (brand === activeBrand) return
    // R2-B-10: persist the selected admin brand via `document.cookie`.
    //
    // We deliberately do NOT scope this cookie to `path=/admin` because the
    // admin routes live under locale-prefixed URLs (`/ar/admin/...`,
    // `/en/admin/...`) and the browser only matches `path=/admin` against
    // literal `/admin/*` requests. A `path=/admin` cookie would never be
    // sent on `/ar/admin/products`, breaking the brand switcher. `path=/`
    // is therefore required for the cookie to be visible to all admin
    // routes across both locales. The server-side reader (admin-brand.ts →
    // `cookies().get(...)`) is only invoked inside admin server actions,
    // so the broader path scope does not leak the brand to storefront code.
    //
    // `httpOnly` is intentionally omitted — admin-shell.tsx reads the
    // cookie client-side via `readBrandCookie()` to highlight the active
    // pill on mount. `samesite=lax` + `secure` (prod) provide transport
    // and CSRF defense-in-depth. Not `__Host-` prefixed because that
    // prefix requires `path=/` AND a single origin, but also forces the
    // cookie to be re-issued on every attribute change — admin brand
    // switching is a low-sensitivity, high-frequency action that does
    // not warrant the strictness.
    //
    // `document.cookie = ...` is the canonical client-side cookie setter
    // (it merges into the cookie jar rather than clobbering it). The
    // react-hooks/immutability rule misflags it as a foreign mutation, so
    // disable the rule for this single statement.
    const secure = process.env.NODE_ENV === 'production' ? '; secure' : ''
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `${ADMIN_BRAND_COOKIE}=${brand}; path=/; max-age=${ADMIN_BRAND_COOKIE_MAX_AGE}; samesite=lax${secure}`
    setActiveBrand(brand)
    router.refresh()
  }

  // ===== F5: Mobile drawer focus trap =====
  const getFocusable = useCallback((): HTMLElement[] => {
    const node = drawerRef.current
    if (!node) return []
    const selector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    return Array.from(node.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    )
  }, [])

  // When the drawer opens: save the currently focused element (to restore on
  // close) and move focus into the drawer. When it closes: restore focus.
  useEffect(() => {
    if (!sidebarOpen) return

    lastFocusedRef.current = document.activeElement as HTMLElement | null

    // Defer focus until the drawer is in the DOM.
    const raf = requestAnimationFrame(() => {
      const focusables = getFocusable()
      focusables[0]?.focus()
    })

    const handleKeydown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        e.preventDefault()
        setSidebarOpen(false)
        return
      }
      // Trap Tab within the drawer
      if (e.key !== 'Tab') return
      const items = getFocusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement as HTMLElement | null
      const inside = drawerRef.current?.contains(active)

      if (e.shiftKey) {
        if (active === first || !inside) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || !inside) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKeydown)
      // Restore focus to the element that opened the drawer (e.g. hamburger button).
      lastFocusedRef.current?.focus?.()
    }
  }, [sidebarOpen, getFocusable])

  const brandSwitcher = () => (
    <div
      // R2-B-13: was a dead ternary on a `variant` arg — both branches
      // returned the same `px-4 py-3 border-t border-white/10` className.
      // The function is rendered in two places (desktop sidebar bottom +
      // mobile drawer bottom), but the markup is identical, so the variant
      // arg was unused. Simplified to no-arg; the parent call sites updated.
      className="px-4 py-3 border-t border-white/10"
      role="group"
      aria-label={t('a11y.brandSwitcher')}
    >
      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 px-1">
        {t('a11y.brandSwitcher')}
      </p>
      <div className="grid grid-cols-3 gap-1">
        {ADMIN_BRANDS.map((b) => {
          const selected = b.key === activeBrand
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => handleBrandChange(b.key)}
              aria-pressed={selected}
              className={`min-h-[44px] px-2 py-2 rounded-md text-xs font-semibold transition-colors ${
                selected
                  ? 'text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              style={
                selected
                  ? { backgroundColor: brandColor(b.key) }
                  : undefined
              }
            >
              {b.label}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="min-h-[100dvh] bg-background flex" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-stone-950 text-white shrink-0">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            {/* R3-D #7 / R2-B-6: was `text-lut` which always resolves to LUT
                red via the --lut CSS variable — wrong when the admin switches
                to LA_LOUNGE (magenta) or YOUR_BIRTHDAY (gold). The active
                nav link already uses `brandColor(activeBrand)` via inline
                style; the sidebar header label now follows the same pattern. */}
            <span
              className="text-lg font-bold"
              style={{ color: brandColor(activeBrand) }}
            >
              {brandLabel(activeBrand)}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
          </div>
          <p className="text-xs text-white/50 mt-1">{t('admin.title')}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href)
            // R2-B-14: active nav link was hardcoded `bg-lut text-white`
            // regardless of the active admin brand — so when admin
            // switched to LA_LOUNGE or YOUR_BIRTHDAY the sidebar highlight
            // stayed LUT red while the brand-switcher pill changed color.
            // Now uses the active brand's hex via `brandColor(activeBrand)`
            // so the highlight matches the selected tenant.
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                style={active ? { backgroundColor: brandColor(activeBrand) } : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {brandSwitcher()}

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {t('admin.nav.logout')}
          </button>
        </div>
      </aside>

      {/* Sidebar — mobile drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            id="admin-mobile-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('admin.title')}
            className="absolute top-0 start-0 w-64 h-full bg-stone-950 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* R3-D #7 / R2-B-6: same brand-color fix as the desktop
                    sidebar — was `text-lut` (always LUT red). */}
                <span
                  className="text-lg font-bold"
                  style={{ color: brandColor(activeBrand) }}
                >
                  {brandLabel(activeBrand)}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label={t('common.close')}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                const active = isActive(link.href)
                // R2-B-14: same active-brand-color fix as the desktop nav.
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                    style={active ? { backgroundColor: brandColor(activeBrand) } : undefined}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {link.label}
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors w-full"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                {t('admin.nav.logout')}
              </button>
            </nav>
            {brandSwitcher()}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 shrink-0">
          <button
            className="md:hidden p-2 text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setSidebarOpen(true)}
            aria-label={t('nav.menu')}
            aria-expanded={sidebarOpen}
            aria-controls="admin-mobile-drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:block" />
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-lut transition-colors"
          >
            {t('admin.nav.viewSite')}
            <ExternalLink className="w-4 h-4" />
          </Link>
        </header>

        {/* Page content — plain <div> (not <main>) because the [locale]
            layout already provides the centralised <main id="main-content">
            landmark (F6). Using a <main> here would create a nested landmark
            with a duplicate id. */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
