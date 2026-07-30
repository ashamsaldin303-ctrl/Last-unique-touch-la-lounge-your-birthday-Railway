import { Loader2 } from 'lucide-react'

/**
 * Loading fallback for the Ready-Made Plans feature page.
 *
 * Server Component / Suspense fallback — CSS + lucide spinner only.
 */
export default function Loading() {
  return (
    <div
      className="min-h-[60dvh] flex items-center justify-center bg-background text-primary"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading…</span>
      <Loader2 className="size-8 animate-spin" aria-hidden="true" />
    </div>
  )
}
