import Image from 'next/image'
import { cn } from '@/lib/utils'

interface CircularFrameProps {
  src: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'size-32',
  md: 'size-48',
  lg: 'size-64',
} as const

/**
 * Your Birthday signature — circular framed image with a deep-purple ring and
 * a gold inner accent. Used to give photography (gallery, packages, etc.) the
 * party-balloon "frame within a frame" aesthetic.
 *
 * - Outer ring: 4px deep-purple border.
 * - Inner ring: thin gold accent at 40% opacity.
 * - Surface tint: light pink at 30% (placeholder until image loads).
 * - Shadow: `.shadow-luxury` (default) → `.shadow-luxury-lg` on hover.
 * - Image: object-cover, scales 1.1x on group-hover.
 */
export function BirthdayCircularFrame({ src, alt, size = 'md', className }: CircularFrameProps) {
  return (
    <div
      className={cn(
        'relative rounded-full border-4 border-deep-purple overflow-hidden bg-pink-light/30',
        'shadow-luxury hover:shadow-luxury-lg transition-shadow duration-500',
        'group',
        sizeMap[size],
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-110"
        sizes="(max-width: 768px) 50vw, 25vw"
      />
      {/* Decorative inner ring */}
      <div className="absolute inset-2 rounded-full border border-gold/40 pointer-events-none" />
    </div>
  )
}
