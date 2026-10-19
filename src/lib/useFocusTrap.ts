import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * While active: keeps Tab inside the container, closes on Escape, and on
 * deactivation returns focus to whatever opened it.
 */
export function useFocusTrap(container: RefObject<HTMLElement | null>, active: boolean, onClose: () => void) {
  // A ref, so a parent re-render with a new callback does not re-run the trap and steal focus.
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!active || !container.current) return
    const root = container.current
    const opener = document.activeElement as HTMLElement | null
    const focusables = () => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null || el === document.activeElement)
    const initial = root.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0] ?? root
    initial.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      if (!items.length) return event.preventDefault()
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      // Restore only if focus is still inside the closed layer (a link may have navigated elsewhere).
      if (opener && document.contains(opener) && (root.contains(document.activeElement) || document.activeElement === document.body)) opener.focus()
    }
  }, [active, container])
}

/** Stops the page behind an open layer from scrolling. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const { overflow, paddingRight } = document.body.style
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`
    return () => { document.body.style.overflow = overflow; document.body.style.paddingRight = paddingRight }
  }, [active])
}
