import type { StayType } from './properties'

// Intros stay deliberately broad: they describe how the concept positions each
// neighbourhood's fictional home, not travel times, distances, safety or nearby
// places — none of which this demo has verified.
export interface Neighbourhood {
  slug: string
  name: string
  /** The listing whose exterior represents the area on index cards. */
  coverPropertyId: string
  summary: string
  intro: string[]
  stayStyles: { type: StayType; note: string }[]
}

export const neighbourhoods: Neighbourhood[] = [
  {
    slug: 'kisaasi',
    name: 'Kisaasi',
    coverPropertyId: 'kasiri',
    summary: 'Practical, compact homes for short trips and first months in the city.',
    intro: [
      'Kisaasi is a residential area in the north of Kampala. In this concept it is represented by Kasiri Residences, the collection’s most compact and practical home.',
      'Think of it as the straightforward choice: a one-bedroom base for a few nights or a first couple of months, without shared leisure facilities.',
    ],
    stayStyles: [
      { type: 'short', note: 'Solo and couple visits' },
      { type: 'extended', note: 'A first month or two in Kampala' },
    ],
  },
  {
    slug: 'bukoto',
    name: 'Bukoto',
    coverPropertyId: 'bukoto',
    summary: 'Settled, design-led apartments for stays measured in weeks and months.',
    intro: [
      'Bukoto is a residential neighbourhood in central-northern Kampala. Here it is represented by Bukoto Grove Apartments, styled for people staying long enough to unpack properly.',
      'The concept pairs it with a shared residents’ gym, laundry facilities and a lift — the practical details that matter on longer stays.',
    ],
    stayStyles: [
      { type: 'short', note: 'Minimum two nights' },
      { type: 'extended', note: 'Project work and relocation' },
      { type: 'long', note: 'Year-round living' },
    ],
  },
  {
    slug: 'kyanja',
    name: 'Kyanja',
    coverPropertyId: 'kyanja',
    summary: 'Premium contemporary living around a shared courtyard pool.',
    intro: [
      'Kyanja lies in the northern part of greater Kampala. Kyanja Heights brings the concept’s most contemporary building: travertine interiors, glass balconies and a courtyard.',
      'Residents share a pool, with a gym and rooftop lounge described in the concept but not photographed.',
    ],
    stayStyles: [
      { type: 'short', note: 'Minimum two nights' },
      { type: 'extended', note: 'Comfortable longer visits' },
      { type: 'long', note: 'Premium long-term living' },
    ],
  },
  {
    slug: 'kololo',
    name: 'Kololo',
    coverPropertyId: 'kololo',
    summary: 'Serviced, high-end suites with terraces, a shared pool and gym.',
    intro: [
      'Kololo is one of Kampala’s established hillside neighbourhoods. Kololo Crest Suites is the collection’s high-end serviced option, with housekeeping and concierge in the concept.',
      'Its three bedrooms and shared pool and gym suit small groups and families who want a hotel-like level of service in an apartment.',
    ],
    stayStyles: [
      { type: 'short', note: 'Serviced short stays' },
      { type: 'extended', note: 'Serviced months' },
    ],
  },
  {
    slug: 'muyenga',
    name: 'Muyenga',
    coverPropertyId: 'muyenga',
    summary: 'Garden residences for families settling in for months or longer.',
    intro: [
      'Muyenga is a hillside residential area in the south-east of Kampala. Muyenga Vista Residences is the concept’s family home: three bedrooms, gardens and a shared garden pool.',
      'It is offered for extended and long-term stays only, and the easiest next step is a viewing request.',
    ],
    stayStyles: [
      { type: 'extended', note: 'Family relocation' },
      { type: 'long', note: 'Family living, six months or more' },
    ],
  },
  {
    slug: 'naguru',
    name: 'Naguru',
    coverPropertyId: 'naguru',
    summary: 'Executive apartments for working stays, with a shared gym and coworking lounge.',
    intro: [
      'Naguru is a residential area in the east of central Kampala. Naguru Terrace Apartments is the collection’s executive option, with deep terraces and a calm, ordered interior.',
      'Residents share a gym (pictured) plus a pool and coworking lounge described in the concept but not photographed.',
    ],
    stayStyles: [
      { type: 'short', note: 'Business trips' },
      { type: 'extended', note: 'Project assignments' },
      { type: 'long', note: 'Executive living' },
    ],
  },
]

export const neighbourhoodBySlug = (slug: string | undefined) => neighbourhoods.find(item => item.slug === slug)
