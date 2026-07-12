import { AdminShell } from '@/components/admin/admin-shell'

/**
 * Admin dashboard layout.
 *
 * Auth is enforced in `src/proxy.ts` (V9 Fix #1) — every `/admin/*`
 * request (except `/admin/login`) is redirected to the login page if the
 * session cookie is missing or invalid. The middleware runs BEFORE any SSR
 * rendering, which closes the SSR auth bypass that existed when auth was
 * only checked via `requireAuth()` here (in Next 16 the page can render in
 * parallel with the layout, leaking HTML before the redirect fires).
 *
 * `requireAuth()` is still called inside server actions (e.g. booking
 * status updates) as defense-in-depth — but it is no longer the primary
 * auth gate for the dashboard UI itself.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminShell>{children}</AdminShell>
}
