import { isAuthenticated } from '@/lib/auth'
import { getLocale } from 'next-intl/server'
import { redirect } from '@/i18n/routing'
import { LoginPageView } from '@/components/admin/login-page-view'

export default async function LoginAdminPage() {
  const authed = await isAuthenticated()
  if (authed) {
    const locale = await getLocale()
    redirect({ href: '/admin', locale })
  }

  return <LoginPageView />
}
