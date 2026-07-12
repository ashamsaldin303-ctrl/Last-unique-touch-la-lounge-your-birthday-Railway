'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Loader2, AlertCircle } from 'lucide-react'
import { loginAction } from '@/app/[locale]/admin/login/actions'

export function LoginPageView() {
  const t = useTranslations()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // V13 Group B: wrap onSubmit in try/catch + handle server_error
  const onSubmit = async (formData: FormData) => {
    setSubmitting(true)
    setError(null)

    try {
      const result = await loginAction(formData)

      if (result.success) {
        router.push('/admin')
        router.refresh()
      } else {
        setError(
          result.error === 'rate_limited'
            ? t('admin.login.rateLimited')
            : result.error === 'server_error'
              ? t('admin.login.serverError')
              : t('admin.login.invalid')
        )
        setSubmitting(false)
      }
    } catch (error) {
      console.error('[auth] onSubmit error:', error)
      setError(t('admin.login.serverError'))
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-stone-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl font-bold text-lut">
              {t('brand.lut')}
            </span>
            <span className="w-2 h-2 rounded-full bg-brand" />
          </div>
          <p className="text-sm text-white/60">{t('admin.title')}</p>
        </div>

        {/* Login card */}
        <form
          action={onSubmit}
          className="bg-card rounded-md shadow-xl p-8 space-y-5"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-lut/10 mx-auto mb-2">
            <Lock className="w-7 h-7 text-lut" />
          </div>

          <h1 className="text-xl font-bold text-center text-foreground">
            {t('admin.login.title')}
          </h1>

          {error && (
            <div
              id="login-error"
              role="alert"
              className="flex items-center gap-2 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password">{t('admin.login.password')}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              aria-invalid={!!error}
              aria-describedby={error ? 'login-error' : undefined}
              className="bg-background"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-lut hover:bg-lut/90 text-white py-3 font-semibold rounded-md"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                {t('admin.login.submitting')}
              </>
            ) : (
              t('admin.login.submit')
            )}
          </Button>

          {/* V13 Group B: hide devHint in production */}
          {process.env.NODE_ENV !== 'production' && (
            <p className="text-xs text-muted-foreground text-center">
              {t('admin.login.devHint')}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
