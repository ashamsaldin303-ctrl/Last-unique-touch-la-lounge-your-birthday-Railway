import { useTranslations } from 'next-intl'

export default function NotFound() {
  const t = useTranslations()

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--primary)' }}>404</h1>
      <p className="text-muted-foreground">{t('common.notFound')}</p>
    </div>
  )
}
