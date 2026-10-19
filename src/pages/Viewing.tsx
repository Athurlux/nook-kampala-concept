import { useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { propertyBySlug, type Property } from '../data/properties'
import { FormFlow } from '../forms/FormFlow'
import { viewingFlow } from '../forms/flows'
import { useForms } from '../forms/FormsContext'
import { formatUGX } from '../lib/stay'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { isIsoDate } from '../lib/validation'
import { PropertyImg } from '../components/Img'
import { PropertyMissing } from '../components/PropertyMissing'

export default function Viewing() {
  const { slug } = useParams()
  const property = propertyBySlug(slug)
  useDocumentTitle(property ? `Request a viewing · ${property.name}` : 'Property not found')
  if (!property) return <PropertyMissing />
  return <ViewingForm key={property.id} property={property} />
}

function ViewingForm({ property }: { property: Property }) {
  const flow = useMemo(() => viewingFlow(property), [property])
  const [params] = useSearchParams()
  const { drafts, setDraft } = useForms()

  // A move-in date chosen in search starts the form once, if nothing is entered yet.
  useEffect(() => {
    const moveIn = params.get('move')
    if (!drafts[flow.key] && moveIn && isIsoDate(moveIn)) setDraft(flow.key, { ...flow.empty(), moveIn })
    // Keyed on the flow only: later URL changes must not overwrite typed answers.
  }, [flow])

  return (
    <div className="container form-page">
      <header className="form-page__head">
        <p className="eyebrow">Long-term viewing request</p>
        <h1 className="page-intro__title">View {property.name}</h1>
        <p className="page-intro__lede">Share a preferred viewing time in Kampala time (EAT, UTC+3). It is a request, not a booked appointment — no host calendar is connected.</p>
      </header>
      <FormFlow
        flow={flow}
        referencePrefix="NV"
        meta={[{ label: 'Property', value: `${property.name}, ${property.neighbourhood}` }, { label: 'Monthly guide rate', value: `${formatUGX(property.monthlyGuide)} (illustrative)` }]}
        restartLabel="Start a new request"
        doneLinks={[{ label: 'Back to the property', to: `/apartments/${property.slug}` }, { label: 'Explore apartments', to: '/apartments' }]}
        aside={() => (
          <div className="price-summary">
            <div className="price-summary__property">
              <PropertyImg image={property.gallery[0]} sizes="120px" alt="" />
              <div>
                <p className="price-summary__name">{property.name}</p>
                <p className="price-summary__place">{property.neighbourhood} · {property.bedrooms} bedroom{property.bedrooms === 1 ? '' : 's'}</p>
              </div>
            </div>
            <dl className="price-lines">
              <div><dt>Monthly guide</dt><dd>{formatUGX(property.monthlyGuide)}</dd></div>
            </dl>
            <p className="price-summary__fine">Illustrative guide rate. No lease, deposit or landlord contact is involved in this demo.</p>
          </div>
        )}
      />
    </div>
  )
}
