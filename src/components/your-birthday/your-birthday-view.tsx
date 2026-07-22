'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone,
  User,
  MapPin,
  Mail,
  CheckCircle2,
  X,
  CalendarDays,
  PartyPopper,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { TextScramble } from './text-scramble'
import { ErrorBoundary } from '@/components/ui/error-boundary'

// v30-build-B5: Lazy-load Birthday3DBackground so Three.js (~150KB) stays out
// of the initial JS bundle. ssr:false because WebGL only exists in browsers.
// The background is `fixed inset-0 z-0` so it sits behind all content; the
// page's sections use `relative z-10` to render above it.
const Birthday3DBackground = dynamic(() => import('./birthday-3d-background'), {
  ssr: false,
  loading: () => null,
})

interface YourBirthdayViewProps {
  // by the [locale]/layout.tsx) provides Home / Products / About / Contact
  // links and the wordmark links home. Kept in the interface (optional) so
  // existing callers (`page-client.tsx`) don't break — passing it is a no-op.
  onBack?: () => void
}

export default function YourBirthdayView(_props: YourBirthdayViewProps) {
  const locale = useLocale() as 'ar' | 'en'
  const isRTL = locale === 'ar'
  const t = useTranslations('yourBirthday')
  const router = useRouter()

  // Custom booking modal state
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedPkgName, setSelectedPkgName] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    location: '',
    notes: '',
  })
  const [formSuccess, setFormSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const titleRef = useRef<HTMLSpanElement>(null)
  // Holds the booking success→close timer so it can be cleared on unmount
  // (F3) — prevents setState-after-unmount if the user leaves mid-success.
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Saves the element that had focus before the booking modal opened so we
  // can restore it on close (F7).
  const bookingTriggerRef = useRef<HTMLElement | null>(null)
  // Ref to the modal container so we can focus its first element on open.
  const bookingModalRef = useRef<HTMLDivElement>(null)

  // custom <nav>'s glass effect — the shared <Navbar /> (rendered by the
  // [locale]/layout.tsx) has its own scroll handler.

  // TextScramble for Title (Arabic & English)
  useEffect(() => {
    if (!titleRef.current) return

    // Pre-initialize title elements with the target language to avoid mixed-language scramble transition
    titleRef.current.innerText = t('hero.title1')

    const fx = new TextScramble(titleRef.current)
    const words = (t.raw('hero.scrambleWords') as string[]) ?? []

    let counter = 0
    let timeoutId: ReturnType<typeof setTimeout>

    const next = () => {
      if (!titleRef.current) return
      if (words.length === 0) return
      fx.setText(words[counter]).then(() => {
        timeoutId = setTimeout(next, 3000)
      })
      counter = (counter + 1) % words.length
    }

    timeoutId = setTimeout(next, 500)
    return () => {
      clearTimeout(timeoutId)
      fx.cancel()
    }
  }, [isRTL, t])

  // (now-removed) custom <nav>'s brand-title click + scroll-to-top button.
  // The shared <Navbar /> doesn't need it.

  // F3: Clear any pending success timer if the component unmounts mid-success.
  // Also F7: save the trigger element when the booking modal opens so focus
  // can be restored to it when the modal closes (accessibility — keyboard
  // users shouldn't be dropped back at the top of the page).
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!bookingOpen) {
      // Modal just closed (or never opened) — restore focus to the trigger.
      // The small rAF delay lets the modal finish unmounting first.
      if (bookingTriggerRef.current) {
        const trigger = bookingTriggerRef.current
        const raf = requestAnimationFrame(() => trigger.focus?.())
        return () => cancelAnimationFrame(raf)
      }
      return
    }
    // Modal just opened — capture the trigger and focus the first field.
    bookingTriggerRef.current = document.activeElement as HTMLElement | null
    const raf = requestAnimationFrame(() => {
      const node = bookingModalRef.current
      if (!node) return
      const selector =
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      const first = node.querySelector<HTMLElement>(selector)
      first?.focus()
    })
    return () => cancelAnimationFrame(raf)
  }, [bookingOpen])

  // per-brand back button that used it — the shared <Navbar /> now renders
  // on this page and its wordmark links home.

  const handleBookingClick = (pkgName: string) => {
    setSelectedPkgName(pkgName)
    setBookingOpen(true)
    setFormSuccess(false)
    setFormError(null)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSubmitting(true)

    try {
      const response = await fetch('/api/bookings/birthday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          eventDate: formData.date,
          notes:
            formData.location || formData.notes
              ? `Location: ${formData.location}${formData.notes ? ` | Notes: ${formData.notes}` : ''}`
              : '',
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (response.status !== 201 || !result?.success) {
        const code = (result?.error as string | undefined) ?? 'internal_error'
        // All error strings now live in messages/{ar,en}.json under
        // yourBirthday.booking.errors.* — parity enforced by i18n check.
        const knownCodes = [
          'invalid_input',
          'invalid_json',
          'invalid_event_date',
          'rate_limited',
          'internal_error',
        ]
        const key = knownCodes.includes(code) ? code : 'internal_error'
        setFormError(t(`booking.errors.${key}`))
        setFormSubmitting(false)
        return
      }

      // Only show success on a real 201 from the server.
      setFormSuccess(true)
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
      successTimeoutRef.current = setTimeout(() => {
        setBookingOpen(false)
        setFormSuccess(false)
        setFormError(null)
        setFormData({ name: '', phone: '', email: '', date: '', location: '', notes: '' })
      }, 2500)
    } catch {
      setFormError(t('booking.errors.network'))
    } finally {
      setFormSubmitting(false)
    }
  }

  // Pre-fetch gallery items array (raw JSON, not formatted by next-intl).
  const galleryItems = (t.raw('gallery.items') as string[]) ?? []
  // copyright line; the shared <Footer /> (rendered by the layout) handles
  // the copyright year itself.

  return (
    <>
      <div
        className="min-h-[100dvh] bg-transparent text-primary-foreground overflow-x-hidden"
        style={{
          fontFamily: isRTL
            ? 'var(--font-birthday-arabic), Cairo, sans-serif'
            : 'var(--font-birthday-sub), Inter, sans-serif',
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        {/* FIX-1A / C2: the per-brand custom <nav> was removed because the
            shared <Navbar /> rendered by the [locale]/layout.tsx now appears
            on this page too — its wordmark links home, its nav row exposes
            Home / Products / About / Contact, and it has its own language
            switcher + theme toggle. The custom back button, language toggle,
            and scroll-to-top button are no longer needed. */}

        {/* v30-build-B5: Full-screen fixed 3D background (club-style scene:
            reflective floor, LED screen, DJ booth, fog, lamps, speakers,
            gift boxes, equalizer bars, vinyls, lasers, balloon arch,
            particles + Bloom/FXAA post-processing). Rendered as a fixed
            layer behind all content — sections below use `relative z-10`. */}
        <ErrorBoundary>
          <Birthday3DBackground />
        </ErrorBoundary>

        {/* === HERO SECTION === */}
        <section className="relative z-10 min-h-[100dvh] flex items-center justify-center overflow-hidden">
          {/* Gradient overlay */}
          <div className="absolute inset-0 z-1 bg-gradient-to-t from-transparent via-transparent to-transparent pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center pointer-events-none">
            <div className="pointer-events-auto mt-16 md:mt-0">
              {/* Tagline Badge */}
              <div className="mb-8 inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-[var(--c-birthday-gold-dark)]/30 backdrop-blur-md shadow-[0_0_15px_rgba(201,149,14,0.15)]">
                <span className="w-2.5 h-2.5 bg-[var(--c-birthday-gold-dark)] rounded-full animate-ping" />
                <span
                  className="text-xs font-bold tracking-[0.25em] text-[var(--c-birthday-gold-dark)] uppercase font-mono"
                  style={{ fontFamily: 'var(--font-birthday-sub), Rajdhani, sans-serif' }}
                >
                  {t('hero.tagline')}
                </span>
              </div>

              {/* Title with TextScramble (Arabic & English) */}
              <div className="mb-6">
                <h1
                  className={`text-5xl sm:text-7xl lg:text-8xl font-black leading-none py-2 ${
                    isRTL ? 'tracking-tight' : 'tracking-tighter'
                  }`}
                  style={{
                    fontFamily: isRTL
                      ? 'var(--font-birthday-arabic), Cairo, sans-serif'
                      : 'var(--font-birthday-headline), Orbitron, sans-serif',
                  }}
                >
                  <span
                    ref={titleRef}
                    className="text-primary-foreground"
                  >
                    {t('hero.title1')}
                  </span>
                </h1>
              </div>

              {/* Subtitle */}
              <p
                className="text-base sm:text-lg md:text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto leading-relaxed"
                style={{
                  fontFamily: isRTL ? 'var(--font-birthday-arabic)' : 'var(--font-birthday-sub)',
                }}
              >
                {t('hero.subtitle')}
              </p>

              {/* CTA — single Discover button */}
              <div className="flex flex-col gap-4 justify-center items-center">
                <button
                  onClick={() => router.push('/your-birthday/features')}
                  className="w-full sm:w-auto px-10 py-4 rounded-full font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-[0_0_25px_rgba(245,185,20,0.4)]"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--c-birthday-gold), var(--c-birthday-gold-light))',
                    fontFamily: isRTL ? 'var(--font-birthday-arabic)' : 'var(--font-birthday-sub)',
                  }}
                >
                  {t('hero.discover')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* === SERVICES SECTION === */}
        <section className="relative z-10 py-24 bg-transparent">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16 space-y-4">
              <h2
                className="text-3xl md:text-5xl font-black uppercase tracking-wider"
                style={{
                  fontFamily: isRTL
                    ? 'var(--font-birthday-arabic)'
                    : 'var(--font-birthday-headline)',
                  background:
                    'linear-gradient(135deg, var(--c-birthday-gold), var(--c-birthday-gold-light), var(--c-birthday-gold-dark))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {t('services.title')}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-[var(--c-birthday-gold)] via-[var(--c-birthday-gold-light)] to-[var(--c-birthday-gold-dark)] mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🎈',
                  title: t('services.item2.title'),
                  desc: t('services.item2.desc'),
                  color: 'var(--c-birthday-gold-light)',
                  glow: 'rgba(255, 209, 71, 0.15)',
                  examples: [
                    t('services.item2.ex1'),
                    t('services.item2.ex2'),
                    t('services.item2.ex3'),
                    t('services.item2.ex4'),
                  ],
                },
                {
                  icon: '🎵',
                  title: t('services.item3.title'),
                  desc: t('services.item3.desc'),
                  color: 'var(--c-birthday-gold-dark)',
                  glow: 'rgba(201, 149, 14, 0.15)',
                  examples: [
                    t('services.item3.ex1'),
                    t('services.item3.ex2'),
                    t('services.item3.ex3'),
                    t('services.item3.ex4'),
                  ],
                },
              ].map((service, i) => (
                <div
                  key={i}
                  className="group relative p-8 rounded-lg bg-[var(--c-birthday-card)]/80 border border-white/5 hover:border-white/15 transition-colors duration-500 backdrop-blur-md overflow-hidden"
                  style={{
                    boxShadow: `0 10px 30px -10px rgba(0, 0, 0, 0.7)`,
                  }}
                >
                  {/* Hover ambient spotlight glow */}
                  <div
                    className="absolute -end-20 -top-20 w-40 h-40 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: service.color }}
                  />

                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl mb-6 transform group-hover:rotate-6 transition-transform duration-300"
                    style={{
                      background: `color-mix(in srgb, ${service.color} 15%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${service.color} 40%, transparent)`,
                      boxShadow: `0 0 15px color-mix(in srgb, ${service.color} 20%, transparent)`,
                    }}
                  >
                    {service.icon}
                  </div>
                  <h3
                    className="text-xl font-bold mb-3 tracking-wide"
                    style={{
                      fontFamily: isRTL
                        ? 'var(--font-birthday-arabic)'
                        : 'var(--font-birthday-sub)',
                    }}
                  >
                    {service.title}
                  </h3>
                  <p className="text-primary-foreground/60 text-sm leading-relaxed mb-4">{service.desc}</p>
                  {/* V10 user request: examples list inside each service card */}
                  <ul className="space-y-2 mt-4 pt-4 border-t border-white/10">
                    {service.examples.map((example, j) => (
                      <li key={j} className="text-xs text-primary-foreground/70 flex items-center gap-2">
                        <span
                          className="w-1 h-1 rounded-full shrink-0"
                          style={{ background: service.color }}
                        />
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === GALLERY SECTION === */}
        <section className="relative z-10 py-24 bg-transparent">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16 space-y-4">
              <h2
                className="text-3xl md:text-5xl font-black uppercase tracking-wider"
                style={{
                  fontFamily: isRTL
                    ? 'var(--font-birthday-arabic)'
                    : 'var(--font-birthday-headline)',
                  background:
                    'linear-gradient(135deg, var(--c-birthday-gold-dark), var(--c-birthday-gold))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {t('gallery.title')}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-[var(--c-birthday-gold-dark)] to-[var(--c-birthday-gold)] mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                {
                  n: 1,
                  label: galleryItems[0] ?? '',
                  grad: 'from-[var(--c-birthday-gold)] to-[var(--c-birthday-gold-light)]',
                },
                {
                  n: 2,
                  label: galleryItems[1] ?? '',
                  grad: 'from-[var(--c-birthday-gold-light)] to-[var(--c-birthday-orange)]',
                },
                {
                  n: 3,
                  label: galleryItems[2] ?? '',
                  grad: 'from-[var(--c-birthday-orange)] to-[var(--c-birthday-gold-dark)]',
                },
                {
                  n: 4,
                  label: galleryItems[3] ?? '',
                  grad: 'from-[var(--c-birthday-gold-dark)] to-[var(--c-birthday-gold)]',
                },
                {
                  n: 5,
                  label: galleryItems[4] ?? '',
                  grad: 'from-[var(--c-birthday-gold)] to-[var(--c-birthday-gold-dark)]',
                },
                {
                  n: 6,
                  label: galleryItems[5] ?? '',
                  grad: 'from-[var(--c-birthday-gold-dark)] to-[var(--c-birthday-gold-light)]',
                },
              ].map((item) => (
                <div
                  key={item.n}
                  className="aspect-square rounded-lg overflow-hidden group relative border border-white/5 cursor-pointer shadow-lg"
                >
                  {/* Decorative gradient overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.grad} opacity-30 group-hover:opacity-60 transition-opacity duration-500`}
                  />

                  {/* Geometric outline decoration */}
                  <div className="absolute inset-4 border border-white/10 group-hover:border-white/30 rounded-md transition-colors duration-500 flex flex-col justify-end p-4">
                    <span className="text-xs font-mono text-primary-foreground/40 tracking-widest uppercase">
                      {t('gallery.expPrefix')}
                      {item.n}
                    </span>
                    <h4 className="text-base font-bold text-primary-foreground tracking-wide mt-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      {item.label}
                    </h4>
                  </div>

                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === CTA SECTION === */}
        <section className="relative z-10 py-24 bg-gradient-to-b from-transparent to-transparent">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div
              className="p-8 sm:p-14 rounded-lg border border-white/10 backdrop-blur-md relative overflow-hidden shadow-2xl"
              style={{
                background:
                  'linear-gradient(135deg, rgba(245, 185, 20, 0.08), rgba(255, 209, 71, 0.08), rgba(201, 149, 14, 0.08))',
              }}
            >
              {/* Pulsing neon circles in background */}
              <div className="absolute -start-20 -bottom-20 w-60 h-60 rounded-full bg-[var(--c-birthday-gold)] opacity-10 blur-[80px]" />
              <div className="absolute -end-20 -top-20 w-60 h-60 rounded-full bg-[var(--c-birthday-gold-light)] opacity-10 blur-[80px]" />

              <h2
                className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-wider"
                style={{
                  fontFamily: isRTL
                    ? 'var(--font-birthday-arabic)'
                    : 'var(--font-birthday-headline)',
                  background:
                    'linear-gradient(135deg, var(--c-birthday-gold), var(--c-birthday-gold-light), var(--c-birthday-gold-dark))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {t('cta.title')}
              </h2>
              <p className="text-primary-foreground/60 mb-8 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                {t('cta.subtitle')}
              </p>
              <button
                onClick={() => handleBookingClick(t('booking.bookEvent'))}
                className="px-10 py-4.5 rounded-full font-bold text-primary-foreground text-lg transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-[0_0_30px_rgba(255,209,71,0.3)]"
                style={{
                  background:
                    'linear-gradient(135deg, var(--c-birthday-gold), var(--c-birthday-gold-light))',
                  fontFamily: isRTL ? 'var(--font-birthday-arabic)' : 'var(--font-birthday-sub)',
                }}
              >
                {t('cta.button')}
              </button>
            </div>
          </div>
        </section>

        {/* === FOOTER === */}
        {/* FIX-1A / C2: the per-brand custom <footer> was removed because
            the shared <Footer /> rendered by the [locale]/layout.tsx now
            appears on this page too — it provides quick links, legal links,
            contact info, and the brand wordmark. The custom footer's
            "Crafted in Kuwait" + copyright line is duplicated by the shared
            footer's bottom bar. */}
      </div>

      {/* === BOOKING DIALOG === */}
      <AnimatePresence>
        {bookingOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setBookingOpen(false)
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBookingOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              ref={bookingModalRef}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg bg-[var(--c-birthday-card)] border border-white/10 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-x-hidden text-primary-foreground z-10"
              style={{ direction: isRTL ? 'rtl' : 'ltr' }}
            >
              {/* Decorative glows */}
              <div className="absolute -start-16 -top-16 w-36 h-36 rounded-full bg-[var(--c-birthday-gold)] opacity-10 blur-3xl pointer-events-none" />
              <div className="absolute -end-16 -bottom-16 w-36 h-36 rounded-full bg-[var(--c-birthday-gold-light)] opacity-10 blur-3xl pointer-events-none" />

              <button
                onClick={() => setBookingOpen(false)}
                aria-label={t('booking.close')}
                className="absolute top-4 end-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-primary-foreground/50 hover:text-primary-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {formSuccess ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-10 h-10 animate-pulse" />
                  </div>
                  <h3 id="booking-modal-title" className="text-2xl font-bold tracking-wide">
                    {t('booking.success.title')}
                  </h3>
                  <p className="text-primary-foreground/60 text-sm">{t('booking.success.body')}</p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <PartyPopper className="w-6 h-6 text-[var(--c-birthday-gold-light)]" />
                    <div>
                      <h3 id="booking-modal-title" className="text-xl font-bold">
                        {t('booking.modalTitle')}
                      </h3>
                      {/* V11 Fix #3: removed selectedPackageLabel — packages section
                          was deleted, so showing "Selected Package: ..." was misleading. */}
                      {selectedPkgName && (
                        <p className="text-xs text-primary-foreground/60 font-medium tracking-wide mt-0.5">
                          {selectedPkgName}
                        </p>
                      )}
                    </div>
                  </div>

                  {formError && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Input Fields */}
                  <div className="space-y-3.5 text-black">
                    <div className="relative">
                      <label htmlFor="booking-name" className="sr-only">
                        {t('booking.form.name')}
                      </label>
                      <User className="absolute top-3 w-4 h-4 text-primary-foreground/40 start-3" />
                      <input
                        id="booking-name"
                        type="text"
                        required
                        aria-required="true"
                        placeholder={t('booking.form.name')}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full py-2.5 rounded-md border border-white/10 bg-white/5 text-primary-foreground placeholder-white/40 focus:outline-none focus:border-[var(--c-birthday-gold-light)] focus:ring-2 focus:ring-[var(--c-birthday-gold-light)]/50 text-sm ps-10 pe-4"
                      />
                    </div>

                    <div className="relative">
                      <label htmlFor="booking-phone" className="sr-only">
                        {t('booking.form.phone')}
                      </label>
                      <Phone className="absolute top-3 w-4 h-4 text-primary-foreground/40 start-3" />
                      <input
                        id="booking-phone"
                        type="tel"
                        required
                        aria-required="true"
                        placeholder={t('booking.form.phone')}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full py-2.5 rounded-md border border-white/10 bg-white/5 text-primary-foreground placeholder-white/40 focus:outline-none focus:border-[var(--c-birthday-gold-light)] focus:ring-2 focus:ring-[var(--c-birthday-gold-light)]/50 text-sm ps-10 pe-4"
                      />
                    </div>

                    <div className="relative">
                      <label htmlFor="booking-email" className="sr-only">
                        {t('booking.form.email')}
                      </label>
                      <Mail className="absolute top-3 w-4 h-4 text-primary-foreground/40 start-3" />
                      <input
                        id="booking-email"
                        type="email"
                        placeholder={t('booking.form.email')}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full py-2.5 rounded-md border border-white/10 bg-white/5 text-primary-foreground placeholder-white/40 focus:outline-none focus:border-[var(--c-birthday-gold-light)] focus:ring-2 focus:ring-[var(--c-birthday-gold-light)]/50 text-sm ps-10 pe-4"
                      />
                    </div>

                    <div className="relative">
                      <label htmlFor="booking-date" className="sr-only">
                        {t('booking.form.eventDate')}
                      </label>
                      <CalendarDays className="absolute top-3 w-4 h-4 text-primary-foreground/40 start-3" />
                      <input
                        id="booking-date"
                        type="date"
                        required
                        aria-required="true"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full py-2.5 rounded-md border border-white/10 bg-white/5 text-primary-foreground placeholder-white/40 focus:outline-none focus:border-[var(--c-birthday-gold-light)] focus:ring-2 focus:ring-[var(--c-birthday-gold-light)]/50 text-sm ps-10 pe-4"
                      />
                    </div>

                    <div className="relative">
                      <label htmlFor="booking-location" className="sr-only">
                        {t('booking.form.location')}
                      </label>
                      <MapPin className="absolute top-3 w-4 h-4 text-primary-foreground/40 start-3" />
                      <input
                        id="booking-location"
                        type="text"
                        required
                        aria-required="true"
                        placeholder={t('booking.form.location')}
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full py-2.5 rounded-md border border-white/10 bg-white/5 text-primary-foreground placeholder-white/40 focus:outline-none focus:border-[var(--c-birthday-gold-light)] focus:ring-2 focus:ring-[var(--c-birthday-gold-light)]/50 text-sm ps-10 pe-4"
                      />
                    </div>

                    <div className="relative">
                      <label htmlFor="booking-notes" className="sr-only">
                        {t('booking.form.notes')}
                      </label>
                      <textarea
                        id="booking-notes"
                        rows={2}
                        placeholder={t('booking.form.notes')}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full p-3.5 rounded-md border border-white/10 bg-white/5 text-primary-foreground placeholder-white/40 focus:outline-none focus:border-[var(--c-birthday-gold-light)] focus:ring-2 focus:ring-[var(--c-birthday-gold-light)]/50 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full py-3 rounded-md font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                    style={{
                      background:
                        'linear-gradient(135deg, var(--c-birthday-gold-light), var(--c-birthday-gold))',
                    }}
                  >
                    {formSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t('booking.submitting')}</span>
                      </>
                    ) : (
                      t('booking.submit')
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
