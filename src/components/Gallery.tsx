import { useCallback, useEffect, useRef, useState } from 'react'
import type { GalleryImage, Property } from '../data/properties'
import { useFocusTrap, useScrollLock } from '../lib/useFocusTrap'
import { Icon } from './Icon'
import { PropertyImg } from './Img'

/**
 * Property image grid plus a lightbox dialog. The lightbox opens from any image,
 * pages with buttons, arrow keys or a horizontal swipe, traps focus, closes on
 * Escape and returns focus to the image that opened it.
 */
export function Gallery({ property }: { property: Property }) {
  const [open, setOpen] = useState<number | null>(null)
  const images = property.gallery
  const [lead, ...rest] = images

  return (
    <section className="gallery" aria-label={`${property.name} photographs`}>
      <div className={`gallery__grid gallery__grid--${Math.min(images.length, 7)}`}>
        <GalleryTile image={lead} index={0} total={images.length} onOpen={setOpen} lead />
        {rest.slice(0, 4).map((image, index) => (
          <GalleryTile key={image.name} image={image} index={index + 1} total={images.length} onOpen={setOpen} />
        ))}
      </div>
      <button type="button" className="button button--outline button--small gallery__all" onClick={() => setOpen(0)}>
        <Icon name="grid" size={16} /> View all {images.length} photos
      </button>
      {open !== null && <Lightbox property={property} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </section>
  )
}

function GalleryTile({ image, index, total, onOpen, lead = false }: { image: GalleryImage; index: number; total: number; onOpen: (index: number) => void; lead?: boolean }) {
  return (
    <button type="button" className={`gallery__tile ${lead ? 'gallery__tile--lead' : ''}`} onClick={() => onOpen(index)}>
      <PropertyImg image={image} sizes={lead ? '(min-width: 900px) 55vw, 100vw' : '(min-width: 900px) 22vw, 50vw'} priority={lead} alt="" />
      <span className="gallery__label">{image.caption}</span>
      <span className="visually-hidden">Open photo {index + 1} of {total}: {image.alt}</span>
    </button>
  )
}

function Lightbox({ property, index, onIndex, onClose }: { property: Property; index: number; onIndex: (index: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const images = property.gallery
  const image = images[index]
  const [loaded, setLoaded] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useFocusTrap(ref, true, onClose)
  useScrollLock(true)

  const go = useCallback((delta: number) => {
    setLoaded(false)
    onIndex((index + delta + images.length) % images.length)
  }, [index, images.length, onIndex])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); go(1) }
      if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [go])

  // Warm the neighbours so paging feels immediate.
  useEffect(() => {
    for (const offset of [1, -1]) {
      const neighbour = images[(index + offset + images.length) % images.length]
      const preload = new Image()
      preload.src = `/images/${neighbour.name}-1280.webp`
    }
  }, [index, images])

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${property.name} gallery`} ref={ref}>
      <div className="lightbox__bar">
        <p className="lightbox__count" aria-live="polite">{index + 1} / {images.length}</p>
        <button type="button" className="lightbox__close" onClick={onClose} aria-label="Close gallery" data-autofocus>
          <Icon name="close" size={22} />
        </button>
      </div>
      <figure
        className="lightbox__figure"
        onTouchStart={event => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY } }}
        onTouchEnd={event => {
          const start = touchStart.current
          touchStart.current = null
          if (!start) return
          const dx = event.changedTouches[0].clientX - start.x
          const dy = event.changedTouches[0].clientY - start.y
          // Horizontal, deliberate swipes only, so vertical scrolls and taps are ignored.
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
        }}
      >
        <div className={`lightbox__frame ${loaded ? 'is-loaded' : ''}`}>
          <img
            key={image.name}
            src={`/images/${image.name}-1280.webp`}
            srcSet={`/images/${image.name}-800.webp 800w, /images/${image.name}-1280.webp 1280w`}
            sizes="(min-width: 1000px) 80vw, 100vw"
            width={1280}
            height={853}
            alt={image.alt}
            onLoad={() => setLoaded(true)}
          />
          {!loaded && <span className="lightbox__loading">Loading photo…</span>}
        </div>
        <figcaption className="lightbox__caption">
          <strong>{image.caption}</strong> — {property.name}. <span>AI-generated concept image; not a measured plan or a real view.</span>
        </figcaption>
      </figure>
      <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={() => go(-1)} aria-label="Previous photo"><Icon name="left" size={26} /></button>
      <button type="button" className="lightbox__nav lightbox__nav--next" onClick={() => go(1)} aria-label="Next photo"><Icon name="right" size={26} /></button>
    </div>
  )
}
