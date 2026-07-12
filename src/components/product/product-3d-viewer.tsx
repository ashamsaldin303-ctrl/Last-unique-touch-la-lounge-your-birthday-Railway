'use client'

import { Suspense, useState } from 'react'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import dynamic from 'next/dynamic'
import { Loader2, Box, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

// Dynamically import the actual 3D canvas (heavy) — client only
const ModelCanvas = dynamic(
  () => import('./model-canvas').then((m) => m.ModelCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px] bg-muted rounded-md">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

interface Product3DViewerProps {
  productSlug: string
  model3dUrl: string | null | undefined
}

export function Product3DViewer({ productSlug, model3dUrl }: Product3DViewerProps) {
  const t = useTranslations()
  const [enabled, setEnabled] = useState(false)

  if (!enabled) {
    return (
      <button
        onClick={() => setEnabled(true)}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 border border-gold/50 rounded-md text-gold hover:bg-gold/10 transition-colors"
      >
        <Box className="w-5 h-5" />
        {t('product.3d.enable')}
      </button>
    )
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Box className="w-4 h-4 text-gold" />
          {t('product.3d.title')}
        </h3>
        <button
          onClick={() => setEnabled(false)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3 h-3" />
          {t('product.3d.disable')}
        </button>
      </div>
      <div className="h-[400px] bg-gradient-to-br from-muted to-muted/50 rounded-md overflow-hidden border border-border relative">
        {/* Ambient glow background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(201, 162, 39, 0.08) 0%, transparent 70%)',
          }}
        />
        <ErrorBoundary fallback={null}>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <ModelCanvas modelUrl={model3dUrl ?? ''} productSlug={productSlug} />
          </Suspense>
        </ErrorBoundary>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        {t('product.3d.hint')}
      </p>
    </div>
  )
}
