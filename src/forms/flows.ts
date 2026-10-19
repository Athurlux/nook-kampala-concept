// Every enquiry journey as a declarative spec for the shared form engine.
import { properties, offersNightly, type Property } from '../data/properties'
import { neighbourhoods } from '../data/neighbourhoods'
import { firstAvailableStart, guestErrors, stayDateErrors } from '../lib/stay'
import { addDays, futureDateError, timePreferenceError } from '../lib/validation'
import { eitherContact, type Errors, type FieldSpec, type FlowSpec, type Option } from './engine'

const count = (from: number, to: number, unit?: [string, string]): Option[] =>
  Array.from({ length: to - from + 1 }, (_, index) => {
    const value = from + index
    return { value: String(value), label: unit ? `${value} ${value === 1 ? unit[0] : unit[1]}` : String(value) }
  })

const name: FieldSpec<{ name: string }> = { name: 'name', label: 'Full name', kind: 'text', autoComplete: 'name', maxLength: 80, minLength: 2 }
const email = { name: 'email', label: 'Email', kind: 'email', autoComplete: 'email', maxLength: 120 } as const
const phone = { name: 'phone', label: 'Phone', kind: 'tel', autoComplete: 'tel', hint: 'Ugandan or international, e.g. 0772 123 456.' } as const

const propertyOptions = (list: Property[] = properties): Option[] => list.map(property => ({ value: property.id, label: `${property.name}, ${property.neighbourhood}` }))

// ---- Short-stay booking --------------------------------------------------------

export interface BookingDraft extends Record<string, string> {
  checkIn: string
  checkOut: string
  adults: string
  children: string
  requests: string
  name: string
  email: string
  phone: string
  arrival: string
  special: string
}

const ARRIVAL_OPTIONS: Option[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'late', label: 'Late evening (after 9pm)' },
]

export function bookingFlow(property: Property): FlowSpec<BookingDraft> {
  const guestCount = (draft: BookingDraft) => ({ adults: Number(draft.adults || 0), children: Number(draft.children || 0) })
  return {
    key: `book:${property.id}`,
    stages: [
      {
        id: 'stay',
        title: 'Stay details',
        intro: `Choose dates and guests for ${property.name}. Availability is a fixed demo calendar, not live inventory.`,
        fields: [
          { name: 'checkIn', label: 'Check-in', kind: 'date', hint: 'Kampala date', dateBounds: today => ({ min: today, max: addDays(today, 365) }), validate: (_v, d, now) => stayDateErrors(property, d.checkIn, d.checkOut, now).checkIn ?? null },
          { name: 'checkOut', label: 'Check-out', kind: 'date', hint: `Minimum ${property.minNights ?? 1} night${(property.minNights ?? 1) > 1 ? 's' : ''}`, dateBounds: today => ({ min: addDays(today, 1), max: addDays(today, 365 + 28) }), validate: (_v, d, now) => stayDateErrors(property, d.checkIn, d.checkOut, now).checkOut ?? null },
          { name: 'adults', label: 'Adults', kind: 'select', options: count(1, property.maxGuests) },
          { name: 'children', label: 'Children', kind: 'select', options: count(0, property.maxGuests - 1), hint: 'Under 12' },
          { name: 'requests', label: 'Requests for the stay', kind: 'textarea', optional: true, rows: 3, maxLength: 400, hint: 'For example, an early arrival or a travel cot.' },
        ],
        validate: (draft): Errors => {
          if (!draft.adults || draft.children === '') return {}
          const { adults, children } = guestCount(draft)
          const message = guestErrors(property, adults, children)
          return message ? { children: message } : {}
        },
      },
      {
        id: 'guest',
        title: 'Guest details',
        intro: 'Who the demo reservation would be for. Nothing is stored or sent.',
        fields: [
          { ...name, wide: true } as FieldSpec<BookingDraft>,
          email as FieldSpec<BookingDraft>,
          phone as FieldSpec<BookingDraft>,
          { name: 'arrival', label: 'Arrival time preference', kind: 'select', optional: true, options: ARRIVAL_OPTIONS, hint: `Check-in ${property.checkIn.toLowerCase()}.` },
          { name: 'special', label: 'Anything else the host should know', kind: 'textarea', optional: true, rows: 3, maxLength: 400 },
        ],
      },
    ],
    empty: () => ({ checkIn: '', checkOut: '', adults: '', children: '0', requests: '', name: '', email: '', phone: '', arrival: '', special: '' }),
    sample: today => {
      const nights = Math.max(3, property.minNights ?? 1)
      const checkIn = firstAvailableStart(property, addDays(today, 14), nights)
      return {
        checkIn, checkOut: addDays(checkIn, nights), adults: '2', children: '0',
        name: 'Amani Demo', email: 'amani.demo@example.com', phone: '0772 000 111', arrival: 'afternoon',
      }
    },
    review: { title: 'Review your demo reservation', intro: 'Check the stay, guests and price. Edit any section before completing.' },
    final: { label: 'Complete demo reservation', note: 'Demonstration only. No payment is collected and no reservation is sent.' },
    done: { title: 'Your demo reservation is ready.', body: 'No property was reserved and no payment was taken.' },
  }
}

export const bookable = (property: Property) => offersNightly(property)

// ---- Extended-stay enquiry -------------------------------------------------------

export interface ExtendedDraft extends Record<string, string> {
  property: string
  area: string
  duration: string
  moveIn: string
  guests: string
  needs: string
  name: string
  email: string
  phone: string
  details: string
}

export const DURATION_OPTIONS: Option[] = [
  { value: '1-2', label: '1 to 2 months' },
  { value: '3-6', label: '3 to 6 months' },
  { value: '6-12', label: '6 to 12 months' },
  { value: '12+', label: 'More than a year' },
]

export const extendedFlow: FlowSpec<ExtendedDraft> = {
  key: 'extended',
  stages: [
    {
      id: 'details',
      title: 'Your extended stay',
      intro: 'Tell us roughly what you need. Every field can be changed on the review screen.',
      fields: [
        { name: 'property', label: 'Property preference', kind: 'select', optional: true, options: [{ value: 'any', label: 'No preference yet' }, ...propertyOptions()] },
        { name: 'area', label: 'Neighbourhood', kind: 'select', optional: true, options: [{ value: 'any', label: 'Anywhere in Kampala' }, ...neighbourhoods.map(item => ({ value: item.slug, label: item.name }))] },
        { name: 'duration', label: 'Intended duration', kind: 'select', options: DURATION_OPTIONS },
        { name: 'moveIn', label: 'Approximate move-in', kind: 'date', hint: 'Kampala date; an estimate is fine', dateBounds: today => ({ min: today, max: addDays(today, 365) }), validate: (value, _d, now) => futureDateError(value ?? '', now, { label: 'a move-in date' }) },
        { name: 'guests', label: 'People staying', kind: 'select', options: count(1, 6, ['person', 'people']) },
        {
          name: 'needs', label: 'Most important to you', kind: 'select', optional: true,
          options: [
            { value: 'workspace', label: 'A workspace or coworking lounge' },
            { value: 'pool', label: 'A shared pool' },
            { value: 'gym', label: 'A shared gym' },
            { value: 'family', label: 'Family space and gardens' },
            { value: 'service', label: 'Housekeeping and concierge' },
          ],
        },
        { ...name, wide: true } as FieldSpec<ExtendedDraft>,
        { ...email, optional: true } as FieldSpec<ExtendedDraft>,
        { ...phone, optional: true } as FieldSpec<ExtendedDraft>,
        { name: 'details', label: 'Additional requirements', kind: 'textarea', optional: true, rows: 4, maxLength: 600 },
      ],
      validate: eitherContact('contact', 'email', 'phone'),
    },
  ],
  groups: [{ id: 'contact', legend: 'How to reply', hint: 'An email address or a phone number — one is enough.', fields: ['email', 'phone'] }],
  empty: () => ({ property: '', area: '', duration: '', moveIn: '', guests: '', needs: '', name: '', email: '', phone: '', details: '' }),
  sample: today => ({ property: 'bukoto', area: 'bukoto', duration: '3-6', moveIn: addDays(today, 30), guests: '2', needs: 'workspace', name: 'Amani Demo', email: 'amani.demo@example.com' }),
  review: { title: 'Review your enquiry', intro: 'Check the details, then complete the demonstration.' },
  final: { label: 'Complete demo enquiry', note: 'Demonstration only. Nothing is sent and no home is held for you.' },
  done: { title: 'Your demo enquiry is ready.', body: 'Nothing was sent to anyone and no home is being held. In a live service, this is where a reply would be arranged.' },
}

// ---- Long-term viewing request ---------------------------------------------------

export interface ViewingDraft extends Record<string, string> {
  moveIn: string
  viewingDate: string
  viewingTime: string
  household: string
  duration: string
  name: string
  email: string
  phone: string
  message: string
}

const VIEWING_TIMES: Option[] = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'].map(time => ({ value: time, label: time }))

export function viewingFlow(property: Property): FlowSpec<ViewingDraft> {
  return {
    key: `viewing:${property.id}`,
    stages: [
      {
        id: 'viewing',
        title: 'Viewing preferences',
        intro: `A preferred time to view ${property.name}. No host calendar is connected, so this is a preference, not an appointment.`,
        fields: [
          { name: 'moveIn', label: 'Preferred move-in date', kind: 'date', hint: 'Kampala date', dateBounds: today => ({ min: today, max: addDays(today, 365) }), validate: (value, _d, now) => futureDateError(value ?? '', now, { label: 'a move-in date' }) },
          { name: 'viewingDate', label: 'Preferred viewing date', kind: 'date', hint: 'Within the next 60 days', dateBounds: today => ({ min: today, max: addDays(today, 60) }), validate: (value, draft, now) => futureDateError(value ?? '', now, { maxDays: 60, label: 'a viewing date' }) ?? (draft.moveIn && value! > draft.moveIn ? 'Choose a viewing date on or before your move-in date.' : null) },
          { name: 'viewingTime', label: 'Preferred time (Kampala time, EAT)', kind: 'time', options: VIEWING_TIMES, validate: (value, draft, now) => (draft.viewingDate ? timePreferenceError(draft.viewingDate, value ?? '', now) : null) },
          { name: 'household', label: 'Household size', kind: 'select', options: count(1, property.maxGuests, ['person', 'people']), hint: `${property.name} sleeps up to ${property.maxGuests}.` },
          { name: 'duration', label: 'Desired duration', kind: 'select', options: DURATION_OPTIONS },
        ],
      },
      {
        id: 'contact',
        title: 'Contact details',
        fields: [
          { ...name, wide: true } as FieldSpec<ViewingDraft>,
          email as FieldSpec<ViewingDraft>,
          phone as FieldSpec<ViewingDraft>,
          { name: 'message', label: 'Message', kind: 'textarea', optional: true, rows: 4, maxLength: 600 },
        ],
      },
    ],
    empty: () => ({ moveIn: '', viewingDate: '', viewingTime: '', household: '', duration: '', name: '', email: '', phone: '', message: '' }),
    sample: today => ({ moveIn: addDays(today, 45), viewingDate: addDays(today, 7), viewingTime: '10:00', household: '2', duration: '6-12', name: 'Amani Demo', email: 'amani.demo@example.com', phone: '0772 000 111' }),
    review: { title: 'Review your viewing request', intro: 'Your preferred date and time are a request, not a booked appointment.' },
    final: { label: 'Complete demo viewing request', note: 'Demonstration only. No host is notified and no appointment is made.' },
    done: { title: 'Your demo viewing request is ready.', body: 'This records a preference only. No host was contacted, no appointment exists and no lease or deposit is involved.' },
  }
}

// ---- Contact ----------------------------------------------------------------------

export interface ContactDraft extends Record<string, string> {
  name: string
  email: string
  phone: string
  topic: string
  property: string
  message: string
}

export const contactFlow: FlowSpec<ContactDraft> = {
  key: 'contact',
  stages: [
    {
      id: 'message',
      title: 'Your message',
      fields: [
        { ...name, wide: true } as FieldSpec<ContactDraft>,
        { ...email, optional: true } as FieldSpec<ContactDraft>,
        { ...phone, optional: true } as FieldSpec<ContactDraft>,
        {
          name: 'topic', label: 'Topic', kind: 'select',
          options: [
            { value: 'stay', label: 'A short stay' },
            { value: 'longer', label: 'An extended or long-term stay' },
            { value: 'property', label: 'A specific property' },
            { value: 'listing', label: 'Listing a property' },
            { value: 'other', label: 'Something else' },
          ],
        },
        { name: 'property', label: 'Property', kind: 'select', optional: true, options: propertyOptions() },
        { name: 'message', label: 'Message', kind: 'textarea', rows: 5, maxLength: 1000, minLength: 10 },
      ],
      validate: eitherContact('contact', 'email', 'phone'),
    },
  ],
  groups: [{ id: 'contact', legend: 'How to reply', hint: 'An email address or a phone number — one is enough.', fields: ['email', 'phone'] }],
  empty: () => ({ name: '', email: '', phone: '', topic: '', property: '', message: '' }),
  sample: () => ({ name: 'Amani Demo', email: 'amani.demo@example.com', topic: 'longer', property: 'naguru', message: 'I’m moving to Kampala for a six-month project and would like to know more about Naguru Terrace.' }),
  review: { title: 'Review your message', intro: 'Check it reads the way you want.' },
  final: { label: 'Complete demo message', note: 'Demonstration only. Nothing is sent.' },
  done: { title: 'Your demo message is ready.', body: 'Nothing was sent. In a live service, this is where a reply would be arranged.' },
}
