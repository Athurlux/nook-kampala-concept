// Search state lives in the URL so results can be shared, refreshed and navigated
// with Back/Forward. Parsing is defensive: unknown or malformed values are dropped
// rather than trusted, so a hand-edited link can never produce a misleading result.
import { AMENITY_FILTERS, hasAmenity, offersNightly, STAY_TYPES, type AmenityKey, type Property, type StayType } from '../data/properties'
import { neighbourhoods } from '../data/neighbourhoods'
import { genericStayErrors, nightsBetween, stayDateErrors, quoteStay } from './stay'
import { isIsoDate } from './validation'

export type SortKey = 'recommended' | 'price-asc' | 'price-desc' | 'bedrooms' | 'name'

export const SORTS: { value: SortKey; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'bedrooms', label: 'Most bedrooms' },
  { value: 'name', label: 'Name (A–Z)' },
]

export interface Filters {
  area: string | null
  stay: StayType | null
  checkIn: string | null
  checkOut: string | null
  /** Approximate move-in for extended and long-term searches. */
  moveIn: string | null
  guests: number | null
  bedrooms: number | null
  /** Upper price bound in whole UGX; nightly for short stays, monthly otherwise. */
  maxPrice: number | null
  amenities: AmenityKey[]
  sort: SortKey
}

export const EMPTY_FILTERS: Filters = {
  area: null, stay: null, checkIn: null, checkOut: null, moveIn: null, guests: null, bedrooms: null, maxPrice: null, amenities: [], sort: 'recommended',
}

export const NIGHTLY_PRICE_STEPS = [200_000, 300_000, 400_000, 550_000]
export const MONTHLY_PRICE_STEPS = [3_000_000, 5_000_000, 7_000_000, 10_000_000]

const intIn = (value: string | null, min: number, max: number) => {
  if (!value || !/^\d+$/.test(value)) return null
  const number = Number(value)
  return number >= min && number <= max ? number : null
}

export function parseFilters(params: URLSearchParams): Filters {
  const stay = STAY_TYPES.find(type => type.value === params.get('stay'))?.value ?? null
  const area = neighbourhoods.find(item => item.slug === params.get('area'))?.slug ?? null
  const date = (key: string) => { const value = params.get(key); return value && isIsoDate(value) ? value : null }
  const amenityKeys = new Set(AMENITY_FILTERS.map(item => item.key))
  const amenities = [...new Set((params.get('amenities') ?? '').split(',').filter((key): key is AmenityKey => amenityKeys.has(key as AmenityKey)))]
  const sort = SORTS.find(item => item.value === params.get('sort'))?.value ?? 'recommended'
  const isMonthly = stay === 'extended' || stay === 'long'
  const steps = isMonthly ? MONTHLY_PRICE_STEPS : NIGHTLY_PRICE_STEPS
  const maxPrice = intIn(params.get('max'), 0, Number.MAX_SAFE_INTEGER)
  return {
    area,
    stay,
    // Dates only mean something for nightly stays; move-in only for longer ones.
    checkIn: stay === 'short' ? date('in') : null,
    checkOut: stay === 'short' ? date('out') : null,
    moveIn: isMonthly ? date('move') : null,
    guests: intIn(params.get('guests'), 1, 12),
    bedrooms: intIn(params.get('beds'), 1, 5),
    maxPrice: maxPrice !== null && steps.includes(maxPrice) ? maxPrice : null,
    amenities: AMENITY_FILTERS.map(item => item.key).filter(key => amenities.includes(key)),
    sort,
  }
}

export function serializeFilters(filters: Filters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.area) params.set('area', filters.area)
  if (filters.stay) params.set('stay', filters.stay)
  if (filters.stay === 'short' && filters.checkIn) params.set('in', filters.checkIn)
  if (filters.stay === 'short' && filters.checkOut) params.set('out', filters.checkOut)
  if ((filters.stay === 'extended' || filters.stay === 'long') && filters.moveIn) params.set('move', filters.moveIn)
  if (filters.guests) params.set('guests', String(filters.guests))
  if (filters.bedrooms) params.set('beds', String(filters.bedrooms))
  if (filters.maxPrice) params.set('max', String(filters.maxPrice))
  if (filters.amenities.length) params.set('amenities', filters.amenities.join(','))
  if (filters.sort !== 'recommended') params.set('sort', filters.sort)
  return params
}

export const priceUnit = (filters: Pick<Filters, 'stay'>): 'night' | 'month' => (filters.stay === 'extended' || filters.stay === 'long' ? 'month' : 'night')

/** The rate a card shows and sorting uses, in the unit implied by the stay type. */
export function displayRate(property: Property, filters: Pick<Filters, 'stay'>): { amount: number; unit: 'night' | 'month' } {
  if (priceUnit(filters) === 'night' && offersNightly(property)) return { amount: property.nightlyRate!, unit: 'night' }
  return { amount: property.monthlyGuide, unit: 'month' }
}

/** Usable short-stay dates for this search, or null when absent or invalid. */
export function searchDates(filters: Filters, now = new Date()): { checkIn: string; checkOut: string; nights: number } | null {
  if (filters.stay !== 'short' || !filters.checkIn || !filters.checkOut) return null
  const errors = genericStayErrors(filters.checkIn, filters.checkOut, now)
  if (errors.checkIn || errors.checkOut) return null
  return { checkIn: filters.checkIn, checkOut: filters.checkOut, nights: nightsBetween(filters.checkIn, filters.checkOut) }
}

export function dateProblem(filters: Filters, now = new Date()): string | null {
  if (filters.stay !== 'short' || (!filters.checkIn && !filters.checkOut)) return null
  if (!filters.checkIn || !filters.checkOut) return 'Choose both check-in and check-out to check the demo calendar.'
  const errors = genericStayErrors(filters.checkIn, filters.checkOut, now)
  const message = errors.checkIn ?? errors.checkOut
  return message ? `Those dates can’t be used yet: ${message}` : null
}

export interface Match {
  property: Property
  /** Present when the search has usable short-stay dates. */
  quote: ReturnType<typeof quoteStay>
}

export function applyFilters(all: Property[], filters: Filters, now = new Date()): Match[] {
  const dates = searchDates(filters, now)
  const matches = all.filter(property => {
    if (filters.area && property.neighbourhoodSlug !== filters.area) return false
    if (filters.stay && !property.stayTypes.includes(filters.stay)) return false
    if (filters.guests && property.maxGuests < filters.guests) return false
    if (filters.bedrooms && property.bedrooms < filters.bedrooms) return false
    if (filters.amenities.some(key => !hasAmenity(property, key))) return false
    if (filters.maxPrice) {
      // A nightly price cap only makes sense for homes with a nightly rate.
      if (priceUnit(filters) === 'night' && !offersNightly(property)) return false
      if (displayRate(property, filters).amount > filters.maxPrice) return false
    }
    if (dates && stayDateErrors(property, dates.checkIn, dates.checkOut, now).checkOut) return false
    return true
  })

  const rate = (property: Property) => displayRate(property, filters)
  const byPrice = (a: Property, b: Property) => {
    // Never order a nightly rate against a monthly one: unlike units sort after like ones.
    const ra = rate(a), rb = rate(b)
    if (ra.unit !== rb.unit) return ra.unit === priceUnit(filters) ? -1 : 1
    return ra.amount - rb.amount
  }
  const sorted = [...matches]
  if (filters.sort === 'price-asc') sorted.sort(byPrice)
  else if (filters.sort === 'price-desc') sorted.sort((a, b) => { const ra = rate(a), rb = rate(b); return ra.unit !== rb.unit ? byPrice(a, b) : rb.amount - ra.amount })
  else if (filters.sort === 'bedrooms') sorted.sort((a, b) => b.bedrooms - a.bedrooms || a.name.localeCompare(b.name))
  else if (filters.sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))

  return sorted.map(property => ({ property, quote: dates ? quoteStay(property, dates.nights) : null }))
}

export interface Chip {
  key: string
  label: string
  remove: (filters: Filters) => Filters
}

export function activeChips(filters: Filters, format: (amount: number) => string, dateLabel: (iso: string) => string): Chip[] {
  const chips: Chip[] = []
  if (filters.area) chips.push({ key: 'area', label: neighbourhoods.find(item => item.slug === filters.area)!.name, remove: f => ({ ...f, area: null }) })
  if (filters.stay) {
    chips.push({ key: 'stay', label: STAY_TYPES.find(type => type.value === filters.stay)!.label, remove: f => ({ ...f, stay: null, checkIn: null, checkOut: null, moveIn: null, maxPrice: null }) })
  }
  if (filters.checkIn && filters.checkOut) chips.push({ key: 'dates', label: `${dateLabel(filters.checkIn)} – ${dateLabel(filters.checkOut)}`, remove: f => ({ ...f, checkIn: null, checkOut: null }) })
  if (filters.moveIn) chips.push({ key: 'move', label: `Move-in around ${dateLabel(filters.moveIn)}`, remove: f => ({ ...f, moveIn: null }) })
  if (filters.guests) chips.push({ key: 'guests', label: `${filters.guests}+ guest${filters.guests === 1 ? '' : 's'}`, remove: f => ({ ...f, guests: null }) })
  if (filters.bedrooms) chips.push({ key: 'beds', label: `${filters.bedrooms}+ bedroom${filters.bedrooms === 1 ? '' : 's'}`, remove: f => ({ ...f, bedrooms: null }) })
  if (filters.maxPrice) chips.push({ key: 'max', label: `Up to ${format(filters.maxPrice)} / ${priceUnit(filters)}`, remove: f => ({ ...f, maxPrice: null }) })
  for (const key of filters.amenities) {
    chips.push({ key: `amenity-${key}`, label: AMENITY_FILTERS.find(item => item.key === key)!.label, remove: f => ({ ...f, amenities: f.amenities.filter(item => item !== key) }) })
  }
  return chips
}
