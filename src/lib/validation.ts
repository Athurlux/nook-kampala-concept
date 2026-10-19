export const TIME_ZONE = 'Africa/Kampala'

const SEPARATORS = /[\s\-().]/g

/**
 * Ugandan numbers in local (0772 123456) or international (+256 772 123456) form,
 * plus other international numbers written with a leading + (E.164, 8–15 digits).
 * Returns a normalised +… string, or null when the input is not a phone number.
 */
export function normalizePhone(input: string): string | null {
  const compact = input.trim().replace(SEPARATORS, '')
  const uganda = /^(?:\+256|256|0)([2347]\d{8})$/.exec(compact)
  if (uganda) return `+256${uganda[1]}`
  if (/^\+256/.test(compact)) return null // a malformed Ugandan number should not pass as "international"
  return /^\+[1-9]\d{7,14}$/.test(compact) ? compact : null
}

export function phoneError(input: string, required: boolean): string | null {
  if (!input.trim()) return required ? 'Enter a phone number.' : null
  return normalizePhone(input) ? null : 'Enter a Ugandan number such as 0772 123 456, or an international number starting with +.'
}

export function emailError(input: string, required: boolean): string | null {
  const value = input.trim()
  if (!value) return required ? 'Enter an email address.' : null
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? null : 'Enter an email address in the format name@example.com.'
}

export function wholeNumberError(input: string, { min = 1, max = 10000, label = 'a number' } = {}): string | null {
  const value = input.trim()
  if (!value) return `Enter ${label}.`
  if (!/^\d+$/.test(value)) return 'Use a whole number, such as 3.'
  const number = Number(value)
  if (number < min) return `Enter at least ${min}.`
  if (number > max) return `Enter ${max.toLocaleString('en-GB')} or fewer.`
  return null
}

// ---- Kampala dates -----------------------------------------------------------
// Dates and times are compared in the Kampala calendar, so a visitor browsing from
// another time zone cannot choose a day or time that has already passed there.

export function kampalaParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now)
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? ''
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) }
}

export const kampalaToday = (now = new Date()) => kampalaParts(now).date

export function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))

export function futureDateError(input: string, now = new Date(), { required = true, maxDays = 365, label = 'a date' } = {}): string | null {
  if (!input) return required ? `Choose ${label}.` : null
  if (!isIsoDate(input)) return 'Enter a valid date.'
  const today = kampalaToday(now)
  if (input < today) return 'Choose today or a later date (Kampala time).'
  if (input > addDays(today, maxDays)) return `Choose a date within the next ${maxDays} days.`
  return null
}

/** "HH:MM" slot on a given date must still be ahead of the current Kampala time. */
export function timePreferenceError(date: string, time: string, now = new Date()): string | null {
  if (!time) return 'Choose a preferred time.'
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) return 'Choose a preferred time.'
  const { date: today, minutes } = kampalaParts(now)
  if (date === today && Number(match[1]) * 60 + Number(match[2]) <= minutes) {
    return 'That time has already passed today in Kampala. Choose a later time or another day.'
  }
  return null
}

export function formatDisplayDate(isoDate: string) {
  if (!isIsoDate(isoDate)) return isoDate
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${isoDate}T12:00:00Z`))
}
