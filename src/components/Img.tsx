import type { ImgHTMLAttributes } from 'react'
import type { GalleryImage } from '../data/properties'

export const PROPERTY_WIDTHS = [480, 800, 1280]

interface ImgProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'width' | 'height' | 'alt'> {
  image: GalleryImage
  sizes: string
  priority?: boolean
  /** Override the stored alt, e.g. "" when an adjacent caption already describes it. */
  alt?: string
}

/** Responsive property photograph; width/height reserve the 3:2 space to avoid layout shift. */
export function PropertyImg({ image, sizes, priority = false, alt, ...rest }: ImgProps) {
  return (
    <img
      src={`/images/${image.name}-800.webp`}
      srcSet={PROPERTY_WIDTHS.map(width => `/images/${image.name}-${width}.webp ${width}w`).join(', ')}
      sizes={sizes}
      width={1280}
      height={853}
      alt={alt ?? image.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      {...rest}
    />
  )
}
