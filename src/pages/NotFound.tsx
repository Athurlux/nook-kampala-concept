import { Link } from 'react-router'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { NookSymbol } from '../components/Logo'

export default function NotFound() {
  useDocumentTitle('Page not found')
  return (
    <section className="container not-found">
      <NookSymbol size={72} className="not-found__mark" />
      <h1 className="page-intro__title">This page isn’t here.</h1>
      <p className="lede">The link may be mistyped, or the page may have moved. Here are good places to continue.</p>
      <div className="button-row">
        <Link to="/apartments" className="button button--primary">Explore apartments</Link>
        <Link to="/" className="button button--outline">Go to the homepage</Link>
      </div>
      <ul className="link-list">
        <li><Link to="/neighbourhoods">Neighbourhoods</Link></li>
        <li><Link to="/extended-stays">Extended stays</Link></li>
        <li><Link to="/saved">Saved stays</Link></li>
        <li><Link to="/contact">Contact</Link></li>
      </ul>
    </section>
  )
}
