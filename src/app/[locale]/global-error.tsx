'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  // Detect locale from URL
  const isArabic = typeof window !== 'undefined' && window.location.pathname.includes('/ar')

  return (
    <html lang={isArabic ? 'ar' : 'en'} dir={isArabic ? 'rtl' : 'ltr'}>
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: '20px' }}>
        <div style={{ maxWidth: '500px', margin: '50px auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
            {isArabic ? 'حدث خطأ حرج' : 'Critical Error'}
          </h1>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            {isArabic
              ? 'نعتذر — حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
              : 'We apologize — an unexpected error occurred. Please try again.'}
          </p>
          {error.digest && (
            <p style={{ fontSize: '12px', color: '#999', marginBottom: '16px', fontFamily: 'monospace' }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: '12px 24px',
              backgroundColor: '#E3222B',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {isArabic ? 'إعادة المحاولة' : 'Try again'}
          </button>
        </div>
      </body>
    </html>
  )
}
