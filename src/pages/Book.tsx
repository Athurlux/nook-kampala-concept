import { useEffect, useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { offersNightly, propertyBySlug, type Property } from '../data/properties'
import { FormFlow } from '../forms/FormFlow'
import { bookingFlow, type BookingDraft } from '../forms/flows'
import { useForms } from '../forms/FormsContext'
import { formatUGX, nightsBetween, quoteStay, stayDateErrors, stayRange } from '../lib/stay'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { isIsoDate } from '../lib/validation'
import { PropertyImg } from '../components/Img'
import { PropertyMissing } from '../components/PropertyMissing'
import { StayCalendar } from '../components/StayCalendar'

export default function Book() {
  const { slug } = useParams()
  const property = propertyBySlug(slug)
  useDocumentTitle(property ? `Book a demo stay · ${property.name}` : 'Property not found')
  if (!property) return <PropertyMissing />
  if (!offersNightly(property)) return <NotBookable property={property} />
  return <BookingForm key={property.id} property={property} />
}

function BookingForm({ property }: { property: Property }) {
  const flow = useMemo(() => bookingFlow(property), [property])
  const [params] = useSearchParams()
  const { drafts, setDraft } = useForms()

  // Dates and guests chosen in search start the form, once, if nothing is entered yet.
  useEffect(() => {
    if (drafts[flow.key]) return
    const checkIn = params.get('in'), checkOut = params.get('out'), guests = Number(params.get('guests'))
    const next: BookingDraft = flow.empty()
    let changed = false
    if (checkIn && checkOut && isIsoDate(checkIn) && isIsoDate(checkOut)) { next.checkIn = checkIn; next.checkOut = checkOut; changed = true }
    if (Number.isInteger(guests) && guests >= 1) { next.adults = String(Math.min(guests, property.maxGuests)); changed = true }
    if (changed) setDraft(flow.key, next)
    // Deliberately keyed on the flow only: later URL changes must not overwrite typed answers.
  }, [flow])

  return (
    <div className="container form-page">
      <header className="form-page__head">
        <p className="eyebrow">Demo short-stay booking</p>
        <h1 className="page-intro__title">Stay at {property.name}</h1>
        <p className="page-intro__lede">{property.neighbourhood} · up to {property.maxGuests} guests · {formatUGX(property.nightlyRate!)} per night, illustrative.</p>
      </header>
      <FormFlow
        flow={flow}
        referencePrefix="NK"
        meta={[{ label: 'Property', value: `${property.name}, ${property.neighbourhood}` }]}
        extra={draft => ({ propertyId: property.id, quote: quoteStay(property, nightsBetween(draft.checkIn, draft.checkOut)) ?? undefined })}
        doneRoute={reference => `/booking-demo/${reference}`}
        aside={draft => <PriceSummary property={property} draft={draft} />}
        stageExtra={(draft, stageId, update) => stageId === 'stay' && (
          <StayCalendar property={property} checkIn={draft.checkIn} checkOut={draft.checkOut} onChange={patch => update(patch)} />
        )}
      />
    </div>
  )
}

/** Always-visible running total, so no fee appears for the first time on the last screen. */
function PriceSummary({ property, draft }: { property: Property; draft: BookingDraft }) {
  const datesValid = draft.checkIn && draft.checkOut && !Object.keys(stayDateErrors(property, draft.checkIn, draft.checkOut)).length
  const quote = datesValid ? quoteStay(property, nightsBetween(draft.checkIn, draft.checkOut)) : null
  const guests = Number(draft.adults || 0) + Number(draft.children || 0)
  return (
    <div className="price-summary">
      <div className="price-summary__property">
        <PropertyImg image={property.gallery[1]} sizes="120px" alt="" />
        <div>
          <p className="price-summary__name">{property.name}</p>
          <p className="price-summary__place">{property.neighbourhood}</p>
        </div>
      </div>
      {quote ? (
        <>
          <p className="price-summary__dates">{stayRange(draft.checkIn, draft.checkOut)}</p>
          {guests > 0 && <p className="price-summary__guests">{guests} guest{guests === 1 ? '' : 's'}</p>}
          <dl className="price-lines">
            {quote.lines.map(line => <div key={line.label}><dt>{line.label}</dt><dd>{formatUGX(line.amount)}</dd></div>)}
            <div className="price-lines__total"><dt>Total</dt><dd>{formatUGX(quote.total)}</dd></div>
          </dl>
        </>
      ) : (
        <dl className="price-lines">
          <div><dt>Nightly rate</dt><dd>{formatUGX(property.nightlyRate!)}</dd></div>
          {property.cleaningFee ? <div><dt>Cleaning fee (one-off)</dt><dd>{formatUGX(property.cleaningFee)}</dd></div> : null}
          <div className="price-lines__hint"><dt>Choose available dates to see the total.</dt><dd /></div>
        </dl>
      )}
      <p className="price-summary__fine">Illustrative UGX rates. The total is nightly rate × nights plus the one-off cleaning fee; no taxes, deposits or other charges are modelled. Nothing is charged.</p>
    </div>
  )
}

function NotBookable({ property }: { property: Property }) {
  return (
    <section className="container not-found">
      <p className="eyebrow">{property.name}</p>
      <h1 className="page-intro__title">Nightly stays aren’t offered here.</h1>
      <p className="lede">{property.name} is set up for extended and long-term stays. Request a viewing or send an enquiry instead.</p>
      <div className="button-row">
        <Link to={`/viewing/${property.slug}`} className="button button--primary">Request a viewing</Link>
        <Link to={`/extended-stays?property=${property.id}`} className="button button--outline">Extended-stay enquiry</Link>
        <Link to={`/apartments/${property.slug}`} className="button button--ghost">Back to the property</Link>
      </div>
    </section>
  )
}
