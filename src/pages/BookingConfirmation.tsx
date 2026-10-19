import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { propertyById } from '../data/properties'
import { Summary } from '../forms/FormFlow'
import { useForms } from '../forms/FormsContext'
import { formatUGX } from '../lib/stay'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { Icon } from '../components/Icon'
import { PropertyImg } from '../components/Img'

export default function BookingConfirmation() {
  const { reference } = useParams()
  const { completions } = useForms()
  // Confirmations live only in memory; a refresh or shared link finds nothing.
  const completion = Object.values(completions).find(item => item.reference === reference && item.propertyId)
  const property = completion?.propertyId ? propertyById(completion.propertyId) : undefined
  useDocumentTitle(completion ? 'Your demo reservation is ready' : 'Demo reservation summary')
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }) }, [])

  if (!completion || !property) {
    return (
      <section className="container not-found">
        <p className="eyebrow">Demo reservation {reference}</p>
        <h1 className="page-intro__title" ref={headingRef} tabIndex={-1}>There’s no summary to show here.</h1>
        <p className="lede">Demo reservation summaries exist only in memory while you browse, so they disappear after a refresh or when this page is opened from a link. No reservation was ever made, and nothing was sent.</p>
        <div className="button-row">
          <Link to="/apartments" className="button button--primary">Explore apartments</Link>
          <Link to="/" className="button button--outline">Go to the homepage</Link>
        </div>
      </section>
    )
  }

  const quote = completion.quote
  return (
    <section className="container confirmation" aria-labelledby="confirmation-title">
      <div className="confirmation__head">
        <p className="eyebrow">Reference {completion.reference}</p>
        <h1 className="page-intro__title" id="confirmation-title" ref={headingRef} tabIndex={-1}>Your demo reservation is ready.</h1>
        <p className="notice notice--demo"><strong>Demonstration only.</strong> No property was reserved, no payment was collected and nothing was sent to a host. This reference exists only in this browser tab.</p>
      </div>
      <div className="confirmation__layout">
        <div>
          <Summary sections={completion.sections} meta={completion.meta} />
        </div>
        <aside className="price-summary">
          <div className="price-summary__property">
            <PropertyImg image={property.gallery[0]} sizes="120px" alt="" />
            <div>
              <p className="price-summary__name">{property.name}</p>
              <p className="price-summary__place">{property.neighbourhood}</p>
            </div>
          </div>
          {quote && (
            <dl className="price-lines">
              {quote.lines.map(line => <div key={line.label}><dt>{line.label}</dt><dd>{formatUGX(line.amount)}</dd></div>)}
              <div className="price-lines__total"><dt>Illustrative total</dt><dd>{formatUGX(quote.total)}</dd></div>
            </dl>
          )}
          <p className="price-summary__fine">Nothing was charged. Rates and fees are illustrative.</p>
        </aside>
      </div>
      <div className="button-row no-print">
        <button type="button" className="button button--primary" onClick={() => window.print()}><Icon name="print" size={18} /> Print summary</button>
        <Link to="/apartments" className="button button--outline">Explore more stays</Link>
        <Link to={`/apartments/${property.slug}`} className="button button--ghost">Back to {property.name}</Link>
      </div>
      <p className="fine-print">This summary is held in memory for this visit only and disappears if you refresh.</p>
    </section>
  )
}
