import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

/**
 * After client-side navigation, move focus to the main region so keyboard and
 * screen-reader users start at the new page instead of the old link. Search and
 * filter changes (same path) and the first load are left alone.
 *
 * Hash targets are scrolled to on every load, retrying briefly because route
 * content is lazy-loaded and may not exist on the first frame.
 */
export function useRouteFocus() {
  const { pathname, hash } = useLocation()
  const first = useRef(true)
  useEffect(() => {
    const isFirst = first.current
    first.current = false
    if (hash) {
      let frames = 0
      let raf = 0
      const tryScroll = () => {
        const target = document.getElementById(decodeURIComponent(hash.slice(1)))
        if (target) {
          target.scrollIntoView()
          if (!isFirst) target.focus({ preventScroll: true })
        } else if (frames++ < 60) raf = requestAnimationFrame(tryScroll)
      }
      tryScroll()
      return () => cancelAnimationFrame(raf)
    }
    if (!isFirst) document.getElementById('main')?.focus({ preventScroll: true })
  }, [pathname, hash])
}
