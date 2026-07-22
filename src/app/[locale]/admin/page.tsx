import { useTranslations } from 'next-intl'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export default function AdminPage() {
  const t = useTranslations()

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold mb-4">{t('admin.title')}</h1>
        <p className="text-muted-foreground">{t('admin.comingPhase')}</p>
      </main>
      <Footer />
    </>
  )
}
