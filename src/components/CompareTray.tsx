import { Link, useLocation } from 'react-router'
import { useCollection } from '../lib/useCollection'
import { MAX_COMPARE } from '../lib/collection'
import { propertyById } from '../data/properties'
import { Icon } from './Icon'

/** A slim bar while stays are selected for comparison; pages reserve space for it. */
export function CompareTray() {
  const { compare, store } = useCollection()
  const { pathname } = useLocation()
  if (!compare.length || pathname === '/compare') return null
  const names = compare.map(id => propertyById(id)?.name).filter(Boolean)
  return (
    <div className={`compare-tray ${pathname.startsWith('/apartments/') ? 'compare-tray--detail' : ''}`} role="region" aria-label="Comparison">
      <div className="container compare-tray__inner">
        <p className="compare-tray__text">
          <Icon name="compare" size={18} />
          <span><strong>{compare.length} of {MAX_COMPARE}</strong> <span className="compare-tray__names">· {names.join(', ')}</span></span>
        </p>
        <div className="compare-tray__actions">
          <button type="button" className="text-button" onClick={store.clearCompare}>Clear</button>
          <Link to="/compare" className="button button--small button--primary">View comparison</Link>
        </div>
      </div>
    </div>
  )
}
