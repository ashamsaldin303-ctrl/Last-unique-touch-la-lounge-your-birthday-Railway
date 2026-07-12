/**
 * Brand-agnostic loading screen.
 *
 * Next.js renders this Suspense fallback while route segments are loading.
 * It deliberately avoids any hard-coded brand name / colour so the same
 * spinner works for LUT, LA Lounge and Your Birthday. Using `border-primary`
 * keeps the spinner tinted by whatever `data-brand` is currently set on
 * <html> (see src/components/providers/brand-theme-setter.tsx).
 *
 * Keeping this minimal also avoids the previous "double loading" effect
 * where the per-brand client loading screens stacked on top of this one.
 */
export default function Loading() {
  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center bg-background"
      role="status"
      aria-live="polite"
    >
      <div
        className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin"
        aria-hidden="true"
      />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
