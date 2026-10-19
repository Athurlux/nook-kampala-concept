// Date-only stay arithmetic, the deterministic demo availability calendar and the
// single pricing rule. Dates are ISO "YYYY-MM-DD" strings in the Kampala calendar;
// nights are counted from calendar days, never by subtracting timestamps.
import { offersNightly, type Property } from '../data/properties'
import { addDays, formatDisplayDate, isIsoDate, kampalaToday } from './validation'

export const MAX_NIGHTS = 28
/** How far ahead the demo calendar accepts check-in dates. */
export const BOOKING_WINDOW_DAYS = 365

/** Whole days since 1970-01-01 for an ISO date, using UTC so DST can never shift it. */
export const dayNumber = (iso: string) => Math.round(Date.parse(`${iso}T00:00:00Z`) / 86_400_000)

export function nightsBetween(checkIn: string, checkOut: string) {
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut)) return 0
  return Math.max(0, dayNumber(checkOut) - dayNumber(checkIn))
}

/** Each night of a stay: check-in through the day before check-out. */
export function stayNights(checkIn: string, checkOut: string) {
  return Array.from({ length: nightsBetween(checkIn, checkOut) }, (_, index) => addDays(checkIn, index))
}

/**
 * Demo availability: two consecutive nights in every thirteen are unavailable,
 * offset per property. It is a fixed illustration so journeys can show the
 * "unavailable dates" path — it is not inventory and never changes with bookings.
 */
export function isBlackedOut(property: Property, iso: string) {
  return (dayNumber(iso) + property.availabilitySeed) % 13 < 2
}

export const unavailableNights = (property: Property, checkIn: string, checkOut: string) =>
  stayNights(checkIn, checkOut).filter(night => isBlackedOut(property, night))

export const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`))

type DateErrors = { checkIn?: string; checkOut?: string }

/** Rules that apply to every short stay: real dates, not in the past, in order, within limits. */
export function genericStayErrors(checkIn: string, checkOut: string, now = new Date()): DateErrors {
  const today = kampalaToday(now)
  const errors: DateErrors = {}
  if (!checkIn) errors.checkIn = 'Choose a check-in date.'
  else if (!isIsoDate(checkIn)) errors.checkIn = 'Enter a valid check-in date.'
  else if (checkIn < today) errors.checkIn = 'Check-in can’t be in the past (Kampala time).'
  else if (checkIn > addDays(today, BOOKING_WINDOW_DAYS)) errors.checkIn = `Choose a check-in date within the next ${BOOKING_WINDOW_DAYS} days.`

  if (!checkOut) errors.checkOut = 'Choose a check-out date.'
  else if (!isIsoDate(checkOut)) errors.checkOut = 'Enter a valid check-out date.'
  if (errors.checkIn || errors.checkOut) return errors

  const nights = nightsBetween(checkIn, checkOut)
  if (nights < 1) errors.checkOut = 'Check-out must be after check-in.'
  else if (nights > MAX_NIGHTS) errors.checkOut = `Short stays are up to ${MAX_NIGHTS} nights. For longer, send an extended-stay enquiry.`
  return errors
}

/** Generic rules plus this property's minimum stay and demo calendar. Empty when valid. */
export function stayDateErrors(property: Property, checkIn: string, checkOut: string, now = new Date()): DateErrors {
  const errors = genericStayErrors(checkIn, checkOut, now)
  if (errors.checkIn || errors.checkOut) return errors
  const minNights = property.minNights ?? 1
  if (nightsBetween(checkIn, checkOut) < minNights) return { checkOut: `${property.name} has a ${minNights}-night minimum stay.` }
  const blocked = unavailableNights(property, checkIn, checkOut)
  if (blocked.length) {
    return { checkOut: `Not available on the demo calendar for the night${blocked.length > 1 ? 's' : ''} of ${blocked.map(shortDate).join(', ')}. Try other dates.` }
  }
  return {}
}

export function guestErrors(property: Property, adults: number, children: number): string | null {
  if (!Number.isInteger(adults) || adults < 1) return 'At least one adult is needed.'
  if (!Number.isInteger(children) || children < 0) return 'Enter a valid number of children.'
  const total = adults + children
  if (total > property.maxGuests) return `${property.name} sleeps up to ${property.maxGuests} guests; you’ve chosen ${total}.`
  return null
}

/** First check-in on or after `from` with `nights` consecutive available nights. */
export function firstAvailableStart(property: Property, from: string, nights: number) {
  for (let offset = 0; offset < 60; offset++) {
    const start = addDays(from, offset)
    if (!unavailableNights(property, start, addDays(start, nights)).length) return start
  }
  return from
}

// ---- Pricing -----------------------------------------------------------------

export interface QuoteLine {
  label: string
  amount: number
}

export interface Quote {
  nightlyRate: number
  nights: number
  lines: QuoteLine[]
  total: number
}

/**
 * The only pricing rule in the demo: nightly rate × nights, plus the property's
 * one-off cleaning fee. Whole UGX throughout, so there is no rounding. No taxes,
 * deposits or discounts are modelled. Returns null when nightly stays aren't offered.
 */
export function quoteStay(property: Property, nights: number): Quote | null {
  if (!offersNightly(property) || !Number.isInteger(nights) || nights < 1) return null
  const nightlyRate = property.nightlyRate!
  const lines: QuoteLine[] = [{ label: `${formatUGX(nightlyRate)} × ${nights} night${nights === 1 ? '' : 's'}`, amount: nightlyRate * nights }]
  if (property.cleaningFee) lines.push({ label: 'Cleaning fee (one-off)', amount: property.cleaningFee })
  return { nightlyRate, nights, lines, total: lines.reduce((sum, line) => sum + line.amount, 0) }
}

export const formatUGX = (amount: number) => `UGX ${Math.round(amount).toLocaleString('en-GB')}`

export const stayRange = (checkIn: string, checkOut: string) => `${formatDisplayDate(checkIn)} to ${formatDisplayDate(checkOut)}`
