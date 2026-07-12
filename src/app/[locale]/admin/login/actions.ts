'use server'

import { login, logout } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { rateLimit } from '@/lib/rate-limiter'

/** 5 login attempts per minute per IP — brute-force protection. */
const LOGIN_MAX = 5
const LOGIN_WINDOW_MS = 60 * 1000

async function getClientIp(): Promise<string> {
  const h = await headers()
  // Take the LAST entry of x-forwarded-for — that is the IP set by the
  // trusted reverse proxy. Earlier entries are client-controllable and
  // must not be used for rate-limit keying (XFF spoofing fix).
  const xff = h.get('x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map((p) => p.trim()).filter(Boolean)
    if (parts.length > 0) {
      return parts[parts.length - 1] || 'unknown'
    }
  }
  return h.get('x-real-ip') || 'unknown'
}

// V13 Group B: Wrap the entire loginAction in try/catch so any unexpected
// error (headers() in preview, rate limiter, login()) returns a structured
// error instead of crashing the form action.
export async function loginAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const ip = await getClientIp()
    const { allowed } = rateLimit(`login:${ip}`, LOGIN_MAX, LOGIN_WINDOW_MS)
    if (!allowed) {
      return { success: false, error: 'rate_limited' }
    }

    const password = formData.get('password') as string
    if (!password) return { success: false, error: 'missing_password' }

    const success = await login(password)
    if (!success) return { success: false, error: 'invalid_password' }

    revalidatePath('/admin')
    return { success: true }
  } catch {
    console.error('[auth] loginAction error:')
    return { success: false, error: 'server_error' }
  }
}

export async function logoutAction(): Promise<void> {
  await logout()
  revalidatePath('/admin')
}
