import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { properties, propertyById } from '../data/properties'
import { FormFlow } from '../forms/FormFlow'
import { extendedFlow } from '../forms/flows'
import { useForms } from '../forms/FormsContext'
import { formatUGX } from '../lib/stay'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { PropertyImg } from '../components/Img'

const OPTIONS = [
  { title: 'A few months', body: 'One to six months, for project work, study or a first season in the city. Every home offers it, at an illustrative monthly guide rate.' },
  { title: 'Relocating', body: 'Six months or more. Start with a viewing request for homes offered long-term, and plan the move from there.' },
  { title: 'Working stays', body: 'A desk at Kasiri, a shared coworking lounge at Naguru (not pictured) — say what you need and the enquiry carries it.' },
]

export default function ExtendedStays() {
  useDocumentTitle('Extended stays')
  const [params] = useSearchParams()
  const { drafts, setDraft } = useForms()
  const longer = properties.filter(property => property.stayTypes.includes('extended'))

  // ?property= from a detail page pre-selects the home once.
  useEffect(() => {
    const preferred = propertyById(params.get('property') ?? '')
    if (!drafts[extendedFlow.key] && preferred) {
      setDraft(extendedFlow.key, { ...extendedFlow.empty(), property: preferred.id, area: preferred.neighbourhoodSlug })
    }
    // Mount only: later URL changes must not overwrite typed answers.
  }, [])

  return (
    <>
      <header className="page-intro container">
        <p className="eyebrow">Extended stays</p>
        <h1 className="page-intro__title">For a longer chapter.</h1>
        <div className="page-intro__lede"><p>Not every stay is counted in nights. Tell us how long, where and what matters, and the enquiry is ready in two steps.</p></div>
      </header>

      <section className="container options-band" aria-label="Ways to stay longer">
        {OPTIONS.map((option, index) => (
          <div key={option.title} className="option">
            <span className="option__num" aria-hidden="true">0{index + 1}</span>
            <h2 className="option__title">{option.title}</h2>
            <p>{option.body}</p>
          </div>
        ))}
      </section>

      <section className="container guide-rates" aria-labelledby="guide-title">
        <h2 id="guide-title" className="section-title">Monthly guide rates</h2>
        <ul className="guide-list">
          {longer.map(property => (
            <li key={property.id}>
              <Link to={`/apartments/${property.slug}`} className="guide-list__link">
                <PropertyImg image={property.gallery[1]} sizes="96px" alt="" />
                <span className="guide-list__name">{property.name}<span>{property.neighbourhood} · {property.bedrooms} bed · {property.stayTypes.includes('long') ? 'extended or long-term' : 'up to 6 months'}</span></span>
                <span className="guide-list__rate">{formatUGX(property.monthlyGuide)}<span>/ month guide</span></span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="fine-print">Illustrative guide rates for planning only. Utilities, deposits and terms are not modelled.</p>
      </section>

      <section className="container form-section" aria-labelledby="enquiry-title">
        <h2 id="enquiry-title" className="section-title">Extended-stay enquiry</h2>
        <FormFlow
          flow={extendedFlow}
          referencePrefix="NE"
          restartLabel="Start a new enquiry"
          doneLinks={[{ label: 'Explore apartments', to: '/apartments?stay=extended' }]}
        />
      </section>
    </>
  )
}
