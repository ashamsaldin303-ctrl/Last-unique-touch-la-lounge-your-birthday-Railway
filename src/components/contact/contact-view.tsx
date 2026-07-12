'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { usePathname } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, CheckCircle2, MapPin, Phone, Mail, Clock, MessageCircle, Instagram, AlertCircle } from 'lucide-react'
import { buildWhatsappUrl, getPhoneNumber, isRealNumber } from '@/lib/contact-info'
import { resolveBrandFromPath, type BrandKey } from '@/lib/brand'

/**
 * R2-B-8: derive the tenant brand from the current pathname so contact
 * submissions are routed to the correct tenant's admin inbox.
 *
 * The storefront exposes 3 brand landing pages — `/last-unique-touch` (LUT,
 * the SSR default), `/la-lounge` (LA_LOUNGE), and `/your-birthday`
 * (YOUR_BIRTHDAY). The home page (`/`) and all other routes resolve to LUT.
 * Path → BrandKey resolution lives in `src/lib/brand.ts` (shared with the
 * navbar / footer / brand-theme-setter); we only need to map the lowercase
 * BrandKey to the uppercase API-facing literal set here.
 */
type ContactBrand = 'LUT' | 'LA_LOUNGE' | 'YOUR_BIRTHDAY'

const BRAND_TO_CONTACT_BRAND: Record<BrandKey, ContactBrand> = {
  lut: 'LUT',
  lalounge: 'LA_LOUNGE',
  birthday: 'YOUR_BIRTHDAY',
}

const contactSchema = z.object({
  name: z.string().min(3).max(100),
  // v29-fix-F7 Fix #8: bound email length (parity with the server-side
  // schema in /api/contact — a >200-char email is rejected by the server
  // anyway; capping it here avoids a confusing "form valid → server 400"
  // round-trip).
  email: z.string().email().max(200),
  phone: z.string().regex(/^\+?[0-9\s-]{8,20}$/).optional().or(z.literal('')),
  subject: z.string().min(5).max(200),
  message: z.string().min(20).max(2000),
  // R2-B-8: include `brand` so the server (/api/contact) can persist the
  // tenant the message was submitted from. The server schema defaults to
  // 'LUT' if absent, but sending it explicitly closes the multi-tenant
  // routing gap (La Lounge / Your Birthday messages were filed under LUT).
  brand: z.enum(['LUT', 'LA_LOUNGE', 'YOUR_BIRTHDAY']),
})

type ContactFormData = z.infer<typeof contactSchema>

export function ContactView() {
  const t = useTranslations()
  const pathname = usePathname()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // R2-B-8: resolve the brand from the current pathname so the contact form
  // can route the submission to the correct tenant. Memoised via useState so
  // it stays stable across re-renders but updates on navigation.
  const brand = BRAND_TO_CONTACT_BRAND[resolveBrandFromPath(pathname)]

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { brand },
  })

  const onSubmit = async (data: ContactFormData) => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      // R2-B-8: send the resolved brand along with the form payload so the
      // server persists the message against the correct tenant.
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, brand }),
      })

      const result = (await response.json().catch(() => ({}))) as {
        error?: string
      }

      if (!response.ok || !result) {
        const code = result?.error ?? 'internal_error'
        const messageMap: Record<string, string> = {
          invalid_input: t('contact.form.errors.invalidInput'),
          invalid_json: t('contact.form.errors.invalidInput'),
          rate_limited: t('contact.form.errors.rateLimited'),
          internal_error: t('contact.form.errors.internalError'),
        }
        setSubmitError(messageMap[code] ?? messageMap.internal_error)
        setSubmitting(false)
        return
      }

      // Only show success on a real 200 from the server.
      setSubmitting(false)
      setSubmitted(true)
      reset()
    } catch {
      setSubmitError(t('contact.form.errors.networkError'))
      setSubmitting(false)
    }
  }

  const contactInfo: Array<{
    icon: typeof MapPin
    label: string
    value: string
    dir?: 'ltr' | 'rtl'
  }> = [
    { icon: MapPin, label: t('contact.info.address'), value: t('contact.info.addressValue') },
    ...(isRealNumber(getPhoneNumber())
      ? [{ icon: Phone as typeof MapPin, label: t('contact.info.phone'), value: getPhoneNumber() as string, dir: 'ltr' as const }]
      : []),
    { icon: Mail, label: t('contact.info.email'), value: t('contact.info.emailValue'), dir: 'ltr' as const },
    { icon: Clock, label: t('contact.info.hours'), value: t('contact.info.hoursValue') },
  ]

  const whatsappUrl = buildWhatsappUrl()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-px w-6 bg-accent/50" aria-hidden="true" />
          <span className="eyebrow text-accent text-[0.625rem]">
            {t('contact.title')}
          </span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-3">
          {t('contact.title')}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {t('contact.subtitle')}
        </p>
        <div className="h-1 bg-gold mt-6" style={{ width: '60px' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          {submitted ? (
            <div className="p-8 rounded-md bg-card border border-border shadow-luxury text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                {t('contact.form.success')}
              </h2>
              <Button
                onClick={() => setSubmitted(false)}
                variant="outline"
                className="mt-4 border-border"
              >
                {t('contact.form.sendAnother')}
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5 p-6 rounded-md glass-card shadow-luxury"
            >
              {submitError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 p-3 rounded-md bg-primary/10 border border-primary/30 text-primary text-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">
                    {t('contact.form.name')}
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className="bg-background luxury-input"
                  />
                  {errors.name && (
                    <p id="name-error" className="flex items-center gap-1.5 text-xs text-primary mt-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {errors.name?.type === 'required'
                          ? t('contact.form.errors.nameRequired')
                          : t('contact.form.errors.nameMinLength')}
                      </span>
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">
                    {t('contact.form.email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    dir="ltr"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className="bg-background luxury-input"
                  />
                  {errors.email && (
                    <p id="email-error" className="flex items-center gap-1.5 text-xs text-primary mt-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {errors.email?.type === 'required'
                          ? t('contact.form.errors.emailRequired')
                          : t('contact.form.errors.emailInvalid')}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Phone + Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    {t('contact.form.phone')}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    dir="ltr"
                    {...register('phone')}
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    className="bg-background luxury-input"
                  />
                  {errors.phone && (
                    <p id="phone-error" className="flex items-center gap-1.5 text-xs text-primary mt-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{t('contact.form.errors.phoneInvalid')}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">
                    {t('contact.form.subject')}
                  </Label>
                  <Input
                    id="subject"
                    {...register('subject')}
                    aria-invalid={!!errors.subject}
                    aria-describedby={errors.subject ? 'subject-error' : undefined}
                    className="bg-background luxury-input"
                  />
                  {errors.subject && (
                    <p id="subject-error" className="flex items-center gap-1.5 text-xs text-primary mt-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {errors.subject?.type === 'required'
                          ? t('contact.form.errors.subjectRequired')
                          : t('contact.form.errors.subjectMinLength')}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label htmlFor="message">
                  {t('contact.form.message')}
                </Label>
                <Textarea
                  id="message"
                  rows={6}
                  {...register('message')}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'message-error' : undefined}
                  className="bg-background luxury-input"
                />
                {errors.message && (
                  <p id="message-error" className="flex items-center gap-1.5 text-xs text-primary mt-1" role="alert">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {errors.message?.type === 'required'
                        ? t('contact.form.errors.messageRequired')
                        : t('contact.form.errors.messageMinLength')}
                    </span>
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    {t('contact.form.submitting')}
                  </>
                ) : (
                  t('contact.form.submit')
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Contact info */}
        <div className="lg:col-span-1">
          <div className="p-6 rounded-md bg-card border border-border shadow-luxury space-y-6">
            {contactInfo.map((info, idx) => {
              const Icon = info.icon
              return (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">
                      {info.label}
                    </p>
                    <p
                      className="text-sm font-medium text-foreground break-words"
                      dir={info.dir}
                    >
                      {info.value}
                    </p>
                  </div>
                </div>
              )
            })}

            {/* Social */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">
                {whatsappUrl
                  ? `${t('contact.info.whatsapp')} / ${t('contact.info.instagram')}`
                  : t('contact.info.instagram')}
              </p>
              <div className="flex items-center gap-3">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                )}
                <a
                  href="https://instagram.com/last.unique.touch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
