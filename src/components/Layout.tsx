import { Outlet, ScrollRestoration } from 'react-router'
import { Header } from './Header'
import { Footer } from './Footer'
import { Announcer } from './Announcer'
import { CompareTray } from './CompareTray'
import { useRouteFocus } from '../lib/useRouteFocus'

export function Layout() {
  useRouteFocus()
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <CompareTray />
      <Footer />
      <Announcer />
      {/* Form steps and filter changes alter only the search string, so they keep the
          page's scroll entry. First-loaded pages all carry the key "default", so they
          are keyed by path. */}
      <ScrollRestoration getKey={loc => (loc.key === 'default' || loc.pathname === '/apartments' || loc.search.includes('step=') ? loc.pathname : loc.key)} />
    </>
  )
}
