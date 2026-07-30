'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Box } from 'lucide-react'

interface ProductGalleryProps {
  images: string[]
  model3dUrl: string | null
  productName: string
  onEnable3D?: () => void
}

export function ProductGallery({
  images,
  model3dUrl,
  productName,
  onEnable3D,
}: ProductGalleryProps) {
  const t = useTranslations()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const hasImages = images.length > 0
  const currentImage = hasImages ? images[selectedImageIndex] : null

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-square rounded-md overflow-hidden border border-border bg-card">
        {currentImage ? (
          <Image
            src={currentImage}
            alt={productName}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            {t('common.noImage')}
          </div>
        )}

        {/* 3D button overlay */}
        {model3dUrl && onEnable3D && (
          <button
            onClick={onEnable3D}
            className="absolute bottom-3 end-3 min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-md bg-gold/90 hover:bg-gold text-primary-foreground text-xs font-medium transition-colors"
          >
            <Box className="w-4 h-4" />
            {t('product.3d.enable')}
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {hasImages && (
        <div className="grid grid-cols-5 gap-2 mt-3">
          {images.slice(0, 5).map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImageIndex(idx)}
              aria-current={selectedImageIndex === idx ? 'true' : undefined}
              className={`relative aspect-square rounded-md overflow-hidden border-2 transition-[border-color,opacity] ${
                selectedImageIndex === idx
                  ? 'border-lut'
                  : 'border-border hover:opacity-80'
              }`}
>
              <Image
                src={img}
                alt={`${productName} ${idx + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
