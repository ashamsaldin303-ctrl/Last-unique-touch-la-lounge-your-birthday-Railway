import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-[60dvh] flex items-center justify-center" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
    </div>
  )
}
