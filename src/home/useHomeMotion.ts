import type { RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../animation/gsap'

const EASE = { out: 'power3.out', expo: 'expo.out', mask: 'power4.inOut', scrub: 'none' }
const revealPending = () => document.documentElement.classList.remove('hero-pending')

/**
 * Homepage choreography in one scoped context. useGSAP reverts every tween and
 * ScrollTrigger on unmount, and matchMedia reverts per-breakpoint work on resize,
 * so navigation and resizing cannot accumulate triggers. Navigation and search
 * are never hidden; photographs are only masked, scaled slightly or drifted —
 * never warped.
 */
export function useHomeMotion(root: RefObject<HTMLElement | null>) {
  useGSAP(() => {
    const mm = gsap.matchMedia()

    mm.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 1024px)' }, context => {
      const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean }
      if (!motion) { revealPending(); return }

      // ---- Entrance (about 1.3s) ------------------------------------------------
      const tl = gsap.timeline({ defaults: { ease: EASE.out } })
      tl.from('[data-hero="eyebrow"]', { y: 12, opacity: 0, duration: 0.45 })
        .from('[data-hero="line"]', { yPercent: 108, duration: 0.9, stagger: 0.1, ease: EASE.expo }, '-=0.25')
        .fromTo('[data-hero="mask"]', { scaleY: 1 }, { scaleY: 0, duration: 1.1, ease: EASE.mask }, 0.1)
        .from('[data-hero="photo"]', { scale: 1.12, duration: 1.5, ease: EASE.out }, 0.1)
        .from('[data-hero="lede"]', { y: 14, opacity: 0, duration: 0.5 }, '-=1.0')
        // The search only settles into place — it is visible and usable throughout.
        .from('[data-hero="search"]', { y: 18, duration: 0.6 }, 0.35)
        .from('[data-hero="explore"]', { opacity: 0, duration: 0.4 }, '-=0.2')
      revealPending()

      // If someone reaches for the search mid-entrance, finish at once so nothing moves under them.
      const search = root.current?.querySelector('[data-hero="search"]')
      const settle = () => tl.progress(1)
      search?.addEventListener('pointerdown', settle)
      search?.addEventListener('focusin', settle)
      const cleanups = [() => { search?.removeEventListener('pointerdown', settle); search?.removeEventListener('focusin', settle) }]

      // ---- Section reveals (batched, once) ---------------------------------------
      const reveals = gsap.utils.toArray<HTMLElement>('[data-anim="reveal"]')
      gsap.set(reveals, { y: desktop ? 32 : 18, opacity: 0 })
      ScrollTrigger.batch(reveals, {
        start: 'top 88%',
        once: true,
        onEnter: batch => gsap.to(batch, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: EASE.out, clearProps: 'transform' }),
      })

      // Featured photographs open with a staggered rise; cards stay clickable.
      const cards = gsap.utils.toArray<HTMLElement>('.featured [data-anim="card"]')
      gsap.set(cards, { y: desktop ? 60 : 24, opacity: 0 })
      ScrollTrigger.batch(cards, {
        start: 'top 90%',
        once: true,
        onEnter: batch => gsap.to(batch, { y: 0, opacity: 1, duration: 0.9, stagger: 0.14, ease: EASE.out, clearProps: 'transform' }),
      })

      if (desktop) {
        // A controlled drift of the hero photograph inside its frame.
        gsap.to('[data-hero="photo"]', {
          yPercent: 6, ease: EASE.scrub,
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 },
        })

        // The one pinned moment: interiors give way to shared facilities. Scenes 2 and 3
        // rise through a curtain while their text crossfades. Short (about 1.6 screens).
        const stage = root.current?.querySelector<HTMLElement>('[data-anim="scenes"]')
        if (stage) {
          stage.classList.add('scenes--pinned')
          const scenes = gsap.utils.toArray<HTMLElement>('.scene', stage)
          const pin = gsap.timeline({
            defaults: { ease: EASE.scrub },
            scrollTrigger: { trigger: stage.querySelector('.scenes__stage'), start: 'top 12%', end: '+=160%', pin: true, scrub: 0.6, anticipatePin: 1 },
          })
          scenes.slice(1).forEach((scene, index) => {
            const previous = scenes[index]
            const at = index
            pin.fromTo(scene.querySelector('[data-scene-curtain]'), { yPercent: 100 }, { yPercent: 0, duration: 1 }, at)
              .fromTo(scene.querySelector('[data-scene-image]'), { yPercent: -60, scale: 1.08 }, { yPercent: 0, scale: 1, duration: 1 }, at)
              .to(previous.querySelector('[data-scene-text]'), { opacity: 0, y: -24, duration: 0.4 }, at)
              .fromTo(scene.querySelector('[data-scene-text]'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4 }, at + 0.5)
          })
          // Hidden scene text must not be reachable by keyboard while invisible.
          const updateInert = () => {
            const active = Math.min(scenes.length - 1, Math.round(pin.progress() * (scenes.length - 1)))
            scenes.forEach((scene, index) => scene.querySelector('[data-scene-text]')?.toggleAttribute('inert', index !== active))
          }
          pin.eventCallback('onUpdate', updateInert)
          updateInert()
          cleanups.push(() => {
            stage.classList.remove('scenes--pinned')
            scenes.forEach(scene => scene.querySelector('[data-scene-text]')?.removeAttribute('inert'))
          })
        }
      } else {
        gsap.utils.toArray<HTMLElement>('[data-scene-curtain]').forEach(curtain => {
          gsap.from(curtain, { yPercent: 12, opacity: 0, duration: 0.8, ease: EASE.out, scrollTrigger: { trigger: curtain, start: 'top 85%', once: true } })
        })
      }

      // Webfonts change line heights; re-measure once they settle.
      let alive = true
      document.fonts.ready.then(() => { if (alive) ScrollTrigger.refresh() })
      return () => {
        alive = false
        cleanups.forEach(cleanup => cleanup())
      }
    })

    return () => revealPending()
  }, { scope: root, dependencies: [] })
}
