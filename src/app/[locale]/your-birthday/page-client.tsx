'use client'

import { useRouter } from '@/i18n/routing'
import YourBirthdayView from '@/components/your-birthday/your-birthday-view'

export default function YourBirthdayPageClient() {
  const router = useRouter()
  return <YourBirthdayView onBack={() => router.push('/')} />
}
