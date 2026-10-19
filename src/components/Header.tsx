import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { useFocusTrap, useScrollLock } from '../lib/useFocusTrap'
import { useCollection } from '../lib/useCollection'
import { Icon } from './Icon'
import { Logo } from './Logo'

const NAV = [
  { to: '/apartments', label: 'Explore apartments' },
  { to: '/neighbourhoods', label: 'Neighbourhoods' },
  { to: '/extended-stays', label: 'Extended stays' },
  { to: '/about', label: 'About' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const { saved } = useCollection()
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  // The whole header is the trap so the close button stays reachable.
  useFocusTrap(headerRef, menuOpen, closeMenu)
  useScrollLock(menuOpen)
  useEffect(() => { setMenuOpen(false) }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const savedLabel = `Saved${saved.length ? ` (${saved.length})` : ''}`

  return (
    <header ref={headerRef} className={`site-header ${scrolled ? 'is-scrolled' : ''} ${menuOpen ? 'is-menu' : ''}`}>
      <div className="container site-header__inner">
        <Link to="/" className="site-header__logo" aria-label="Nook Kampala, home"><Logo /></Link>

        <nav className="site-nav" aria-label="Main">
          <ul>
            {NAV.map(link => <li key={link.to}><NavLink to={link.to}>{link.label}</NavLink></li>)}
          </ul>
        </nav>

        <div className="site-header__actions">
          <NavLink to="/saved" className="saved-link" aria-label={`Saved stays, ${saved.length} saved`}>
            <Icon name="heart" size={19} />
            <span className="saved-link__label">Saved</span>
            {saved.length > 0 && <span className="count" aria-hidden="true">{saved.length}</span>}
          </NavLink>
          <Link to="/#find" className="button button--primary button--small site-header__cta">Find a stay</Link>
          <button
            type="button"
            className="menu-button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(open => !open)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!menuOpen}>
        <nav aria-label="Mobile">
          <ul className="mobile-menu__primary">
            <li><NavLink to="/" end data-autofocus>Home</NavLink></li>
            {NAV.map(link => <li key={link.to}><NavLink to={link.to}>{link.label}</NavLink></li>)}
            <li><NavLink to="/saved">{savedLabel}</NavLink></li>
          </ul>
          <ul className="mobile-menu__secondary">
            <li><Link to="/compare">Compare stays</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/privacy">Privacy &amp; demo notice</Link></li>
          </ul>
        </nav>
        <Link to="/#find" className="button button--primary button--block">Find a stay</Link>
      </div>
    </header>
  )
}
