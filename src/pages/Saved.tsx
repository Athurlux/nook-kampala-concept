import { Link } from 'react-router'
import { offersNightly, propertyById, type Property } from '../data/properties'
import { useCollection } from '../lib/useCollection'
import { formatUGX } from '../lib/stay'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { announce } from '../components/Announcer'
import { CompareButton } from '../components/CollectionButtons'
import { PropertyImg } from '../components/Img'
import { PageIntro } from '../components/PageIntro'
import { Specs } from '../components/Specs'

export default function Saved() {
  useDocumentTitle('Saved stays')
  const { saved, store, status } = useCollection()
  const items = saved.map(propertyById).filter((property): property is Property => Boolean(property))

  return (
    <>
      <PageIntro eyebrow="Saved stays" title={items.length ? `${items.length} saved ${items.length === 1 ? 'stay' : 'stays'}` : 'Nothing saved yet.'}>
        <p>{items.length ? 'Your shortlist, kept on this device. Remove a home, compare up to three, or go straight to booking.' : 'Tap the heart on any apartment to keep it here. Saved stays stay on this device; no account is needed.'}</p>
      </PageIntro>

      {status === 'unavailable' && (
        <p className="container"><span className="notice notice--warn">This browser isn’t allowing storage, so saved stays will last for this visit only.</span></p>
      )}
      {status === 'recovered' && (
        <p className="container"><span className="notice">Your saved list couldn’t be read, so it was reset. Nothing else was affected.</span></p>
      )}

      <section className="container saved" aria-label="Saved stays">
        {items.length ? (
          <ul className="saved-list">
            {items.map(property => (
              <li key={property.id} className="saved-item">
                <Link to={`/apartments/${property.slug}`} className="saved-item__media" tabIndex={-1} aria-hidden="true">
                  <PropertyImg image={property.gallery[0]} sizes="(min-width: 700px) 280px, 100vw" alt="" />
                </Link>
                <div className="saved-item__body">
                  <p className="card__place">{property.neighbourhood}</p>
                  <h2 className="saved-item__title"><Link to={`/apartments/${property.slug}`}>{property.name}</Link></h2>
                  <Specs property={property} compact />
                  <p className="price">
                    <span className="price__amount">{formatUGX(offersNightly(property) ? property.nightlyRate! : property.monthlyGuide)}</span>{' '}
                    <span className="price__unit">/ {offersNightly(property) ? 'night' : 'month guide'}</span>
                    <span className="price__note">Illustrative</span>
                  </p>
                </div>
                <div className="saved-item__actions">
                  <Link to={offersNightly(property) ? `/book/${property.slug}` : `/viewing/${property.slug}`} className="button button--primary button--small">
                    {offersNightly(property) ? 'Book demo stay' : 'Request viewing'}
                  </Link>
                  <CompareButton property={property} />
                  <button type="button" className="text-button" onClick={() => { store.removeSaved(property.id); announce(`Removed ${property.name} from saved stays`) }}>
                    Remove<span className="visually-hidden"> {property.name}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <h2 className="empty-state__title">Start a shortlist</h2>
            <p>Browse the six homes and save the ones that feel right.</p>
            <div className="button-row">
              <Link to="/apartments" className="button button--primary">Explore apartments</Link>
              <Link to="/neighbourhoods" className="button button--outline">Browse by neighbourhood</Link>
            </div>
          </div>
        )}
        <p className="fine-print">Only the IDs of saved homes are stored in this browser — no names, dates or contact details.</p>
      </section>
    </>
  )
}
