import { Link, useParams, useSearchParams } from 'react-router'
import { offersNightly, properties, propertyBySlug, SCOPE_LABEL, STAY_TYPES, type AmenityScope, type Property } from '../data/properties'
import { formatUGX, nightsBetween, quoteStay } from '../lib/stay'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { isIsoDate } from '../lib/validation'
import { CompareButton, SaveButton } from '../components/CollectionButtons'
import { Gallery } from '../components/Gallery'
import { Icon, type IconName } from '../components/Icon'
import { PropertyCard } from '../components/PropertyCard'
import { PropertyMissing } from '../components/PropertyMissing'
import { Specs } from '../components/Specs'

const AMENITY_ICON: Record<string, IconName> = { pool: 'pool', gym: 'gym', kitchen: 'kitchen', workspace: 'workspace', parking: 'parking' }

export default function PropertyDetail() {
  const { slug } = useParams()
  const property = propertyBySlug(slug)
  useDocumentTitle(property ? `${property.name}, ${property.neighbourhood}` : 'Property not found')
  const [params] = useSearchParams()
  if (!property) return <PropertyMissing />

  // Carry valid search context (dates, guests, move-in) into booking and viewing links.
  const carry = new URLSearchParams()
  for (const key of ['in', 'out', 'move']) { const value = params.get(key); if (value && isIsoDate(value)) carry.set(key, value) }
  const guests = params.get('guests')
  if (guests && /^\d$/.test(guests)) carry.set('guests', guests)
  const carryString = carry.toString() ? `?${carry}` : ''

  const nightly = offersNightly(property)
  const searchNights = carry.get('in') && carry.get('out') ? nightsBetween(carry.get('in')!, carry.get('out')!) : 0
  const quote = searchNights ? quoteStay(property, searchNights) : null
  const related = relatedTo(property)
  const scopes: AmenityScope[] = ['unit', 'shared', 'service']

  return (
    <article className="detail">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link to="/apartments">Apartments</Link></li>
            <li><Link to={`/neighbourhoods/${property.neighbourhoodSlug}`}>{property.neighbourhood}</Link></li>
            <li aria-current="page">{property.name}</li>
          </ol>
        </nav>
        <header className="detail__head">
          <div>
            <p className="eyebrow">{property.neighbourhood} · {property.positioning}</p>
            <h1 className="detail__title">{property.name}</h1>
            <p className="detail__intro">{property.intro}</p>
          </div>
          <div className="detail__head-actions">
            <SaveButton property={property} variant="full" />
            <CompareButton property={property} className="compare-toggle--large" />
          </div>
        </header>
        <Gallery property={property} />
      </div>

      <div className="container detail__layout">
        <div className="detail__main">
          <section className="detail__section" aria-labelledby="overview">
            <h2 id="overview" className="section-title">Overview</h2>
            <Specs property={property} />
            {property.description.map(paragraph => <p key={paragraph.slice(0, 24)}>{paragraph}</p>)}
            <p className="fine-print">Room counts, capacity and rates are concept data for this demonstration. The photographs are AI-generated and are not measured plans or proof of a view.</p>
          </section>

          <section className="detail__section" aria-labelledby="amenities">
            <h2 id="amenities" className="section-title">Amenities</h2>
            <div className="amenity-groups">
              {scopes.map(scope => {
                const list = property.amenities.filter(amenity => amenity.scope === scope)
                if (!list.length) return null
                return (
                  <div key={scope} className="amenity-group">
                    <h3 className="amenity-group__title">{SCOPE_LABEL[scope]}</h3>
                    <ul className="amenity-list">
                      {list.map(amenity => (
                        <li key={amenity.label}>
                          <Icon name={amenity.key ? AMENITY_ICON[amenity.key] : 'check'} size={18} />
                          <span>{amenity.label}{amenity.scope === 'shared' && <span className="tag">Shared</span>}{amenity.scope === 'unit' && amenity.key !== 'kitchen' && amenity.label !== 'Wi-Fi' && <span className="tag tag--quiet">Private</span>}</span>
                          <span className="amenity-list__pictured">{amenity.pictured ? 'Pictured' : 'Not pictured'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
            <p className="fine-print">Pools and gyms are shared with other residents, never private to one apartment. Amenities are illustrative; nothing here implies accessibility, safety certification, Wi-Fi speed or service standards.</p>
          </section>

          <section className="detail__section" aria-labelledby="stays">
            <h2 id="stays" className="section-title">Ways to stay</h2>
            <ul className="stay-options">
              {STAY_TYPES.map(type => {
                const offered = property.stayTypes.includes(type.value)
                return (
                  <li key={type.value} className={offered ? '' : 'is-off'}>
                    <strong>{type.label}</strong>
                    <span>{type.detail}</span>
                    <span className="stay-options__state">
                      {!offered ? 'Not offered' : type.value === 'short' ? `${formatUGX(property.nightlyRate!)} / night` : `${formatUGX(property.monthlyGuide)} / month guide`}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="detail__section" aria-labelledby="rules">
            <h2 id="rules" className="section-title">House rules</h2>
            <dl className="facts">
              <div><dt><Icon name="key" size={18} /> Check-in</dt><dd>{property.checkIn}</dd></div>
              <div><dt><Icon name="clock" size={18} /> Check-out</dt><dd>{property.checkOut}</dd></div>
              {nightly && <div><dt><Icon name="calendar" size={18} /> Minimum stay</dt><dd>{property.minNights} night{property.minNights === 1 ? '' : 's'}</dd></div>}
            </dl>
            <ul className="rules">{property.houseRules.map(rule => <li key={rule}>{rule}</li>)}</ul>
          </section>
        </div>

        <aside className="booking-panel" aria-labelledby="booking-panel-title">
          <h2 id="booking-panel-title" className="visually-hidden">Stay with {property.name}</h2>
          {nightly ? (
            <>
              <p className="booking-panel__rate"><span className="price__amount">{formatUGX(property.nightlyRate!)}</span> <span className="price__unit">/ night</span></p>
              <dl className="booking-panel__lines">
                <div><dt>Cleaning fee (one-off)</dt><dd>{formatUGX(property.cleaningFee ?? 0)}</dd></div>
                <div><dt>Monthly guide</dt><dd>{formatUGX(property.monthlyGuide)}</dd></div>
                {quote && <div className="is-total"><dt>{quote.nights} night{quote.nights === 1 ? '' : 's'}, selected dates</dt><dd>{formatUGX(quote.total)}</dd></div>}
              </dl>
              <Link to={`/book/${property.slug}${carryString}`} className="button button--primary button--block">Book a demo stay</Link>
              <Link to={`/viewing/${property.slug}${carryString}`} className="button button--outline button--block">Request a viewing</Link>
            </>
          ) : (
            <>
              <p className="booking-panel__rate"><span className="price__amount">{formatUGX(property.monthlyGuide)}</span> <span className="price__unit">/ month guide</span></p>
              <p className="booking-panel__note">Offered for extended and long-term stays only, so there is no nightly booking.</p>
              <Link to={`/viewing/${property.slug}${carryString}`} className="button button--primary button--block">Request a viewing</Link>
              <Link to={`/extended-stays?property=${property.id}`} className="button button--outline button--block">Extended-stay enquiry</Link>
            </>
          )}
          <p className="booking-panel__fine">All rates are illustrative. No taxes or deposits are modelled; nothing is charged.</p>
        </aside>
      </div>

      <div className="mobile-cta">
        <p className="mobile-cta__rate">
          <span className="price__amount">{formatUGX(nightly ? property.nightlyRate! : property.monthlyGuide)}</span>
          <span className="price__unit"> / {nightly ? 'night' : 'month guide'} · illustrative</span>
        </p>
        <Link to={nightly ? `/book/${property.slug}${carryString}` : `/viewing/${property.slug}${carryString}`} className="button button--primary button--small">
          {nightly ? 'Book demo stay' : 'Request viewing'}
        </Link>
      </div>

      <section className="container related" aria-labelledby="related-title">
        <h2 id="related-title" className="section-title">You might also consider</h2>
        <div className="card-grid card-grid--three">
          {related.map(item => <PropertyCard key={item.id} property={item} rate={offersNightly(item) ? { amount: item.nightlyRate!, unit: 'night' } : { amount: item.monthlyGuide, unit: 'month' }} />)}
        </div>
      </section>
    </article>
  )
}

/** Nearest in size, then in rate — three homes that are genuinely comparable. */
function relatedTo(property: Property) {
  return properties
    .filter(item => item.id !== property.id)
    .sort((a, b) => Math.abs(a.bedrooms - property.bedrooms) - Math.abs(b.bedrooms - property.bedrooms) || Math.abs(a.monthlyGuide - property.monthlyGuide) - Math.abs(b.monthlyGuide - property.monthlyGuide))
    .slice(0, 3)
}
