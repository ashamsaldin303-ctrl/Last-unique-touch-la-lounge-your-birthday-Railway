import { AdminShell } from '@/components/admin/admin-shell'
import { requireAuth } from '@/lib/auth'

/**
 * Admin dashboard layout.
 *
 * Auth is enforced in `src/proxy.ts`  — every `/admin/*`
 * request (except `/admin/login`) is redirected to the login page if the
 * session cookie is missing or invalid. The middleware runs BEFORE any SSR
 * rendering, which closes the SSR auth bypass that existed when auth was
 * only checked via `requireAuth()` here (in Next 16 the page can render in
 * parallel with the layout, leaking HTML before the redirect fires).
 *
 * Defense-in-depth: `requireAuth()` is also called here in the layout
 * so that even if the proxy is bypassed (misconfiguration, direct port
 * access), the admin UI still cannot render without a valid session.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()
  return <AdminShell>{children}</AdminShell>
}
