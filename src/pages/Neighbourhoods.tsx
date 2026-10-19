import { Link } from 'react-router'
import { neighbourhoods } from '../data/neighbourhoods'
import { propertyById } from '../data/properties'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { PropertyImg } from '../components/Img'
import { PageIntro } from '../components/PageIntro'

export default function Neighbourhoods() {
  useDocumentTitle('Neighbourhoods')
  return (
    <>
      <PageIntro eyebrow="Neighbourhoods" title="Six corners of Kampala.">
        <p>Each neighbourhood in the collection is represented by one fictional home. These pages describe how the concept positions each area — not travel times, distances or local guarantees.</p>
      </PageIntro>
      <section className="container hood-index" aria-label="Neighbourhoods">
        {neighbourhoods.map((hood, index) => {
          const property = propertyById(hood.coverPropertyId)!
          return (
            <article key={hood.slug} className={`hood-row ${index % 2 ? 'hood-row--flip' : ''}`}>
              <figure className="hood-row__media">
                <PropertyImg image={property.gallery[0]} sizes="(min-width: 900px) 50vw, 100vw" alt={property.gallery[0].alt} />
                <figcaption>{property.name}, concept image — not documentary photography of {hood.name}.</figcaption>
              </figure>
              <div className="hood-row__text">
                <p className="hood-row__num" aria-hidden="true">0{index + 1}</p>
                <h2 className="hood-row__title"><Link to={`/neighbourhoods/${hood.slug}`}>{hood.name}</Link></h2>
                <p>{hood.summary}</p>
                <div className="button-row">
                  <Link to={`/neighbourhoods/${hood.slug}`} className="button button--outline button--small">About {hood.name}</Link>
                  <Link to={`/apartments?area=${hood.slug}`} className="text-link">Stays in {hood.name}</Link>
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </>
  )
}
