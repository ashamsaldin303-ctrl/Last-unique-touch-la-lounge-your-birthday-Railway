import { Loader2 } from 'lucide-react'

export default function YourBirthdayProductsLoading() {
  return (
    <div
      className="min-h-[60dvh] flex flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading…</span>
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
    </div>
  )
}
