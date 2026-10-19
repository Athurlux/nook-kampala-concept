import { createBrowserRouter } from 'react-router'
import { Layout } from './components/Layout'
import { RouteError } from './pages/RouteError'

// Each page is its own chunk; GSAP is pulled in only by the homepage.
const page = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({ Component: (await load()).default })

export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <div className="route-loading" aria-busy="true" />,
    children: [
      { index: true, lazy: page(() => import('./pages/Home')) },
      { path: 'apartments', lazy: page(() => import('./pages/Apartments')) },
      { path: 'apartments/:slug', lazy: page(() => import('./pages/PropertyDetail')) },
      { path: 'saved', lazy: page(() => import('./pages/Saved')) },
      { path: 'compare', lazy: page(() => import('./pages/Compare')) },
      { path: 'book/:slug', lazy: page(() => import('./pages/Book')) },
      { path: 'booking-demo/:reference', lazy: page(() => import('./pages/BookingConfirmation')) },
      { path: 'extended-stays', lazy: page(() => import('./pages/ExtendedStays')) },
      { path: 'viewing/:slug', lazy: page(() => import('./pages/Viewing')) },
      { path: 'neighbourhoods', lazy: page(() => import('./pages/Neighbourhoods')) },
      { path: 'neighbourhoods/:slug', lazy: page(() => import('./pages/NeighbourhoodDetail')) },
      { path: 'about', lazy: page(() => import('./pages/About')) },
      { path: 'contact', lazy: page(() => import('./pages/Contact')) },
      { path: 'privacy', lazy: page(() => import('./pages/Privacy')) },
      { path: '*', lazy: page(() => import('./pages/NotFound')) },
    ],
  },
])
