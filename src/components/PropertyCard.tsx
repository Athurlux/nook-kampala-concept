import { Link } from 'react-router'
import { AMENITY_FILTERS, amenityFor, amenityShortLabel, type Property } from '../data/properties'
import type { Quote } from '../lib/stay'
import { formatUGX } from '../lib/stay'
import { CompareButton, SaveButton } from './CollectionButtons'
import { PropertyImg } from './Img'
import { Specs } from './Specs'

interface CardProps {
  property: Property
  rate: { amount: number; unit: 'night' | 'month' }
  quote?: Quote | null
  /** Query string carried into the detail link, e.g. selected dates. */
  search?: string
  headingLevel?: 'h2' | 'h3'
  priority?: boolean
}

export function PropertyCard({ property, rate, quote, search = '', headingLevel: Heading = 'h3', priority }: CardProps) {
  const href = `/apartments/${property.slug}${search}`
  const highlights = AMENITY_FILTERS.map(filter => amenityFor(property, filter.key)).filter(amenity => amenity && amenity.key !== 'kitchen').slice(0, 3)
  return (
    <article className="card" data-anim="card">
      <div className="card__media">
        <Link to={href} tabIndex={-1} aria-hidden="true" className="card__image-link">
          <PropertyImg image={property.gallery[0]} sizes="(min-width: 1100px) 30vw, (min-width: 700px) 46vw, 92vw" priority={priority} alt="" />
        </Link>
        <SaveButton property={property} />
      </div>
      <div className="card__body">
        <p className="card__place">{property.neighbourhood}</p>
        <Heading className="card__title"><Link to={href}>{property.name}</Link></Heading>
        <p className="card__positioning">{property.positioning}</p>
        <Specs property={property} compact />
        {highlights.length > 0 && (
          <ul className="card__amenities" aria-label="Highlights">
            {highlights.map(amenity => <li key={amenity!.label}>{amenityShortLabel(amenity!)}</li>)}
          </ul>
        )}
        <div className="card__foot">
          <p className="price">
            {quote ? (
              <><span className="price__amount">{formatUGX(quote.total)}</span> <span className="price__unit">for {quote.nights} night{quote.nights === 1 ? '' : 's'}, incl. cleaning</span></>
            ) : (
              <><span className="price__amount">{formatUGX(rate.amount)}</span> <span className="price__unit">/ {rate.unit}{rate.unit === 'month' ? ' guide' : ''}</span></>
            )}
            <span className="price__note">Illustrative</span>
          </p>
          <CompareButton property={property} />
        </div>
      </div>
    </article>
  )
}
