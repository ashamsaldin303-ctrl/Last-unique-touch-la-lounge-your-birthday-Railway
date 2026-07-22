'use client'

import { useTranslations } from 'next-intl'

export function StaticHeroFallback() {
  const t = useTranslations('hero3d')

  return (
    <div
      className="absolute inset-0 -z-10 opacity-30 pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 30% 20%, rgba(230, 33, 41, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(230, 33, 41, 0.06) 0%, transparent 50%)',
        }}
      />
      <p className="sr-only">{t('reducedMotion')}</p>
    </div>
  )
}
