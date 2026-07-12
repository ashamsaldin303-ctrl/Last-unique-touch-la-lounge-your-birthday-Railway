'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTranslations()
  const [toasts, setToasts] = useState<Toast[]>([])
  // Track all pending setTimeout IDs so they can be cleared on unmount.
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2, 11)
    setToasts((prev) => [...prev, { id, type, message }])
    const timeout = setTimeout(() => {
      timeoutsRef.current.delete(timeout)
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
    timeoutsRef.current.add(timeout)
  }, [])

  // Clear any pending timeouts on unmount to prevent state updates after teardown.
  useEffect(() => {
    const timeouts = timeoutsRef.current
    return () => {
      timeouts.forEach((t) => clearTimeout(t))
      timeouts.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-4 end-4 z-[100] space-y-2"
        role="region"
        aria-label={t('a11y.notifications')}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
            className={`flex items-center gap-3 px-4 py-3 rounded-md shadow-lg text-white max-w-sm ${
              // FIX-4A: palette sweep — green/red/yellow → emerald/rose/amber
              // for consistency with the rest of the admin dashboard.
              toast.type === 'success'
                ? 'bg-emerald-600'
                : toast.type === 'error'
                ? 'bg-rose-600'
                : 'bg-amber-600'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5 shrink-0" />}
            {toast.type === 'warning' && <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="text-sm">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
