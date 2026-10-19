import { Link, useParams } from 'react-router'
import { neighbourhoodBySlug, neighbourhoods } from '../data/neighbourhoods'
import { offersNightly, properties, STAY_TYPES } from '../data/properties'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { PropertyCard } from '../components/PropertyCard'
import { PropertyImg } from '../components/Img'

export default function NeighbourhoodDetail() {
  const { slug } = useParams()
  const hood = neighbourhoodBySlug(slug)
  useDocumentTitle(hood ? `${hood.name} neighbourhood` : 'Neighbourhood not found')

  if (!hood) {
    return (
      <section className="container not-found">
        <p className="eyebrow">Neighbourhood not found</p>
        <h1 className="page-intro__title">That neighbourhood isn’t in the collection.</h1>
        <p className="lede">The concept covers six areas of Kampala:</p>
        <ul className="link-list">{neighbourhoods.map(item => <li key={item.slug}><Link to={`/neighbourhoods/${item.slug}`}>{item.name}</Link></li>)}</ul>
      </section>
    )
  }

  const matches = properties.filter(property => property.neighbourhoodSlug === hood.slug)
  const lead = matches[0]
  return (
    <>
      <header className="hood-hero container">
        <div className="hood-hero__text">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <ol><li><Link to="/neighbourhoods">Neighbourhoods</Link></li><li aria-current="page">{hood.name}</li></ol>
          </nav>
          <h1 className="detail__title">{hood.name}</h1>
          <p className="detail__intro">{hood.summary}</p>
        </div>
        {lead && (
          <figure className="hood-hero__media">
            <PropertyImg image={lead.gallery[0]} sizes="(min-width: 900px) 55vw, 100vw" priority alt={lead.gallery[0].alt} />
            <figcaption>{lead.name}, AI-generated concept image. It does not depict a real building or view in {hood.name}.</figcaption>
          </figure>
        )}
      </header>

      <section className="container hood-body">
        <div className="hood-body__text">
          {hood.intro.map(paragraph => <p key={paragraph.slice(0, 24)}>{paragraph}</p>)}
        </div>
        <aside className="hood-body__styles" aria-labelledby="styles-title">
          <h2 id="styles-title" className="amenity-group__title">Stay styles here</h2>
          <ul className="stay-styles">
            {hood.stayStyles.map(style => (
              <li key={style.type}>
                <Link to={`/apartments?area=${hood.slug}&stay=${style.type}`}>
                  <strong>{STAY_TYPES.find(type => type.value === style.type)!.label}</strong>
                  <span>{style.note}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="container related" aria-labelledby="hood-stays">
        <h2 id="hood-stays" className="section-title">Stays in {hood.name}</h2>
        <div className="card-grid card-grid--three">
          {matches.map(property => <PropertyCard key={property.id} property={property} rate={offersNightly(property) ? { amount: property.nightlyRate!, unit: 'night' } : { amount: property.monthlyGuide, unit: 'month' }} />)}
        </div>
        <p className="fine-print">Looking more widely? <Link to="/apartments">See all six homes</Link> or <Link to="/neighbourhoods">browse every neighbourhood</Link>.</p>
      </section>
    </>
  )
}
