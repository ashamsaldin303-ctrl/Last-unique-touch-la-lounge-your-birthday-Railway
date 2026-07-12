'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDeleteProps {
  trigger: ReactNode
  itemName: string
  onConfirm: () => Promise<void> | void
}

export function ConfirmDelete({ trigger, itemName, onConfirm }: ConfirmDeleteProps) {
  const t = useTranslations('admin.confirmDelete')
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  // F7: Save the element that had focus before the dialog opened (typically
  // the row's delete button) so we can restore focus on close — otherwise
  // keyboard users get dropped at the top of the page.
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) setOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, deleting])

  // Focus trap: focus first element on open, cycle Tab within modal, and
  // restore focus to the trigger element when the dialog closes (F7).
  useEffect(() => {
    if (!open) {
      // Dialog just closed (or never opened) — restore focus to the element
      // that opened it. The rAF delay lets the dialog finish unmounting.
      if (previousFocusRef.current) {
        const prev = previousFocusRef.current
        const raf = requestAnimationFrame(() => prev.focus?.())
        return () => cancelAnimationFrame(raf)
      }
      return
    }

    // Dialog just opened — capture the currently focused element (the trigger
    // button) so we can restore focus later.
    previousFocusRef.current = document.activeElement as HTMLElement | null

    const node = dialogRef.current
    if (!node) return

    const getFocusable = (): HTMLElement[] => {
      const selector =
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      return Array.from(node.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      )
    }

    // Focus the first focusable element when opening
    const focusables = getFocusable()
    focusables[0]?.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = getFocusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (e.shiftKey) {
        if (active === first || !node.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || !node.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => {
      document.removeEventListener('keydown', handleTab)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer bg-transparent border-0 p-0"
        aria-label={t('title')}
      >
        {trigger}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deleting && setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('title')}
        >
          <div
            ref={dialogRef}
            className="bg-card rounded-md shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <button
                type="button"
                onClick={() => !deleting && setOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={t('cancel')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-foreground mb-2">{t('title')}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('message', { name: itemName })}
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-border"
                onClick={() => setOpen(false)}
                disabled={deleting}
              >
                {t('cancel')}
              </Button>
              <Button
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleConfirm}
                disabled={deleting}
              >
                {deleting ? t('processing') : t('confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
