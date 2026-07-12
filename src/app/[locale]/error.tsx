'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations()

  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-100 mb-6">
          <AlertTriangle className="w-10 h-10 text-rose-600" />
        </div>
        <h1 className="text-2xl font-bold mb-3 text-foreground">
          {t('error.title')}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t('error.subtitle')}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-6 font-mono">
            {t('error.errorId')}: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-lut text-white rounded-md hover:opacity-90 transition"
        >
          <RotateCcw className="w-4 h-4" />
          {t('error.retry')}
        </button>
      </div>
    </div>
  )
}
