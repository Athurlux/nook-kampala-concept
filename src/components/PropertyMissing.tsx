import { Link } from 'react-router'
import { properties } from '../data/properties'
import { useDocumentTitle } from '../lib/useDocumentTitle'

/** Shown for an unknown property slug on detail, booking and viewing routes. */
export function PropertyMissing() {
  useDocumentTitle('Property not found')
  return (
    <section className="container not-found">
      <p className="eyebrow">Property not found</p>
      <h1 className="page-intro__title">We couldn’t find that apartment.</h1>
      <p className="lede">The link may be mistyped. The collection has six homes — choose one below or browse them all.</p>
      <ul className="link-list">
        {properties.map(property => <li key={property.id}><Link to={`/apartments/${property.slug}`}>{property.name} · {property.neighbourhood}</Link></li>)}
      </ul>
      <div className="button-row">
        <Link to="/apartments" className="button button--primary">Explore all apartments</Link>
      </div>
    </section>
  )
}
