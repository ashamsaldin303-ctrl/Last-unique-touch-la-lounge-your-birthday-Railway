import { redirect } from '@/i18n/routing'
import { getLocale } from 'next-intl/server'

export default async function ContactRedirect() {
  const locale = await getLocale()
  redirect({ href: '/last-unique-touch/contact', locale })
}
