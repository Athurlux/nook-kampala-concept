// Six fictional demonstration listings. Names, galleries and amenity allocations come
// from assets-src/original/property-guide.json; room counts, capacities, rates, rules
// and availability are concept data written for this demo — the photographs do not
// establish them, and nothing here describes a real building.

export type StayType = 'short' | 'extended' | 'long'

export const STAY_TYPES: { value: StayType; label: string; detail: string }[] = [
  { value: 'short', label: 'Short stay', detail: '1 to 28 nights' },
  { value: 'extended', label: 'Extended stay', detail: '1 to 6 months' },
  { value: 'long', label: 'Long-term', detail: '6 months or more' },
]

/** Keys the search filters understand. Other amenities are descriptive only. */
export type AmenityKey = 'pool' | 'gym' | 'kitchen' | 'workspace' | 'parking'

/**
 * `unit` — inside the apartment; `shared` — a resident facility shared with other
 * residents (pools and gyms are always shared); `service` — building or service.
 */
export type AmenityScope = 'unit' | 'shared' | 'service'

export interface Amenity {
  label: string
  scope: AmenityScope
  /** True only when this property's own gallery contains a photograph of it. */
  pictured: boolean
  key?: AmenityKey
  /** Gallery room that pictures it, for "See photo" links. */
  photo?: Room
}

export type Room = 'exterior' | 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'pool' | 'gym'

export interface GalleryImage {
  room: Room
  /** Base name in /images, e.g. "kasiri-living" → /images/kasiri-living-<w>.webp */
  name: string
  caption: string
  alt: string
}

export interface Property {
  id: string
  slug: string
  name: string
  neighbourhood: string
  neighbourhoodSlug: string
  positioning: string
  intro: string
  description: string[]
  bedrooms: number
  bathrooms: number
  maxGuests: number
  stayTypes: StayType[]
  /** Illustrative nightly rate in whole UGX; absent when nightly stays are not offered. */
  nightlyRate?: number
  /** Illustrative one-off cleaning fee per short stay, whole UGX. */
  cleaningFee?: number
  minNights?: number
  /** Illustrative monthly guide rate for extended and long-term stays, whole UGX. */
  monthlyGuide: number
  amenities: Amenity[]
  gallery: GalleryImage[]
  houseRules: string[]
  checkIn: string
  checkOut: string
  /** Seeds the deterministic demo blackout calendar; not live inventory. */
  availabilitySeed: number
}

const g = (id: string, room: Room, caption: string, alt: string): GalleryImage => ({ room, name: `${id}-${room}`, caption, alt })

const WIFI: Amenity = { label: 'Wi-Fi', scope: 'unit', pictured: false }
const KITCHEN: Amenity = { label: 'Equipped kitchen', scope: 'unit', pictured: true, key: 'kitchen', photo: 'kitchen' }

export const properties: Property[] = [
  {
    id: 'kasiri',
    slug: 'kasiri-residences',
    name: 'Kasiri Residences',
    neighbourhood: 'Kisaasi',
    neighbourhoodSlug: 'kisaasi',
    positioning: 'Comfortable compact stays',
    intro: 'A bright one-bedroom in a three-storey cream building, set up for practical stays of a few nights or a few months.',
    description: [
      'Kasiri is the most compact home in the collection: warm oak, sage-green upholstery and a balcony off the living room. It suits one or two people who want a calm base rather than a showpiece.',
      'A small desk in the living area makes it the collection’s simplest work-friendly option. There are no shared pool or gym facilities here.',
    ],
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    stayTypes: ['short', 'extended'],
    nightlyRate: 165_000,
    cleaningFee: 40_000,
    minNights: 1,
    monthlyGuide: 2_900_000,
    amenities: [
      WIFI,
      KITCHEN,
      { label: 'Workspace', scope: 'unit', pictured: false, key: 'workspace' },
      { label: 'Balcony', scope: 'unit', pictured: true, photo: 'living' },
      { label: 'Parking', scope: 'service', pictured: true, key: 'parking', photo: 'exterior' },
    ],
    gallery: [
      g('kasiri', 'exterior', 'Exterior', 'A three-storey cream apartment building with charcoal balcony rails and a planted forecourt with parked cars, at sunset'),
      g('kasiri', 'living', 'Living room', 'A compact living room with a sage-green sofa, round oak coffee table and glass doors open to a balcony'),
      g('kasiri', 'bedroom', 'Bedroom', 'A bedroom with a made double bed, olive throw, botanical prints and a window onto greenery'),
      g('kasiri', 'kitchen', 'Kitchen', 'An L-shaped oak kitchen with a breakfast counter and stools, oven and tall fridge'),
      g('kasiri', 'bathroom', 'Bathroom', 'A bathroom with a glass shower, oak vanity and a small window'),
    ],
    houseRules: ['No smoking indoors', 'No parties or events', 'Quiet hours from 10pm to 7am', 'Pets by prior arrangement only'],
    checkIn: 'From 2pm',
    checkOut: 'By 11am',
    availabilitySeed: 3,
  },
  {
    id: 'bukoto',
    slug: 'bukoto-grove-apartments',
    name: 'Bukoto Grove Apartments',
    neighbourhood: 'Bukoto',
    neighbourhoodSlug: 'bukoto',
    positioning: 'Stylish extended stays',
    intro: 'A two-bedroom apartment in a pale-brick building with timber fins and broad balconies, designed around longer, settled stays.',
    description: [
      'Light oak floors, olive bouclé and warm ivory walls give Bukoto Grove a calm, contemporary feel. The open living and dining room leads to a balcony.',
      'Residents share a small gym in the building, and there is a lift and laundry facilities — useful when a stay runs to weeks or months.',
    ],
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    stayTypes: ['short', 'extended', 'long'],
    nightlyRate: 260_000,
    cleaningFee: 60_000,
    minNights: 2,
    monthlyGuide: 4_800_000,
    amenities: [
      WIFI,
      KITCHEN,
      { label: 'Balcony', scope: 'unit', pictured: true, photo: 'living' },
      { label: 'Gym', scope: 'shared', pictured: true, key: 'gym', photo: 'gym' },
      { label: 'Laundry facilities', scope: 'shared', pictured: false },
      { label: 'Lift', scope: 'service', pictured: false },
      { label: 'Parking', scope: 'service', pictured: true, key: 'parking', photo: 'exterior' },
    ],
    gallery: [
      g('bukoto', 'exterior', 'Exterior', 'A four-storey pale-brick apartment building with vertical timber-look fins and generous balconies among trees'),
      g('bukoto', 'living', 'Living room', 'An open living and dining room with an olive sofa, round stone coffee table and sliding doors to a balcony'),
      g('bukoto', 'bedroom', 'Bedroom', 'A bedroom with a large bed, olive throw, abstract artwork and doors onto a balcony'),
      g('bukoto', 'kitchen', 'Kitchen', 'A light oak kitchen with a stone island, four stools and pendant lights'),
      g('bukoto', 'bathroom', 'Bathroom', 'A bathroom with a stone vanity, round mirror and a walk-in glass shower'),
      g('bukoto', 'gym', 'Shared resident gym', 'A small residents’ gym with a treadmill, exercise bike, bench and dumbbells beside tall windows'),
    ],
    houseRules: ['No smoking indoors', 'No parties or events', 'Quiet hours from 10pm to 7am', 'Gym use follows building hours'],
    checkIn: 'From 2pm',
    checkOut: 'By 11am',
    availabilitySeed: 7,
  },
  {
    id: 'kyanja',
    slug: 'kyanja-heights',
    name: 'Kyanja Heights',
    neighbourhood: 'Kyanja',
    neighbourhoodSlug: 'kyanja',
    positioning: 'Premium contemporary apartments',
    intro: 'A two-bedroom apartment in a six-storey building of white render and charcoal stone, with a shared courtyard pool.',
    description: [
      'Ivory travertine, walnut cabinetry and muted teal velvet set a refined tone. Glass balconies and a lush courtyard frame the building.',
      'Residents share a courtyard pool, a gym and a rooftop lounge. The pool is pictured; the gym and rooftop lounge are part of the concept but not photographed.',
    ],
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    stayTypes: ['short', 'extended', 'long'],
    nightlyRate: 340_000,
    cleaningFee: 70_000,
    minNights: 2,
    monthlyGuide: 6_500_000,
    amenities: [
      WIFI,
      KITCHEN,
      { label: 'Air conditioning', scope: 'unit', pictured: false },
      { label: 'Pool', scope: 'shared', pictured: true, key: 'pool', photo: 'pool' },
      { label: 'Gym', scope: 'shared', pictured: false, key: 'gym' },
      { label: 'Rooftop lounge', scope: 'shared', pictured: false },
      { label: 'Backup power', scope: 'service', pictured: false },
    ],
    gallery: [
      g('kyanja', 'exterior', 'Exterior', 'A six-storey building of white render and charcoal stone with glass balconies above a planted entrance'),
      g('kyanja', 'living', 'Living room', 'A living room with a cream sofa, teal velvet armchair and floor-to-ceiling glass onto a balcony'),
      g('kyanja', 'bedroom', 'Bedroom', 'A bedroom with a large bed, teal cushions and throw, walnut panelling and balcony doors'),
      g('kyanja', 'kitchen', 'Kitchen', 'A walnut and travertine kitchen with an island, three stools and lit shelves'),
      g('kyanja', 'bathroom', 'Bathroom', 'A travertine bathroom with a walnut vanity, wide mirror and walk-in shower'),
      g('kyanja', 'pool', 'Shared resident pool', 'A courtyard pool with loungers and umbrellas, surrounded by the apartment building and planting'),
    ],
    houseRules: ['No smoking indoors', 'No parties or events', 'Quiet hours from 10pm to 7am', 'Pool use follows building hours; children supervised'],
    checkIn: 'From 3pm',
    checkOut: 'By 11am',
    availabilitySeed: 11,
  },
  {
    id: 'kololo',
    slug: 'kololo-crest-suites',
    name: 'Kololo Crest Suites',
    neighbourhood: 'Kololo',
    neighbourhoodSlug: 'kololo',
    positioning: 'High-end serviced stays',
    intro: 'A three-bedroom serviced suite in a low-rise limestone residence with bronze frames, a private terrace and shared pool and gym.',
    description: [
      'Warm limestone, smoked oak and rust velvet make Kololo Crest the most formal home in the collection. Broad glass opens the living room to a private terrace.',
      'Housekeeping and a concierge desk are part of the concept. Residents share a pool and a gym, both pictured in the gallery.',
    ],
    bedrooms: 3,
    bathrooms: 3,
    maxGuests: 6,
    stayTypes: ['short', 'extended'],
    nightlyRate: 520_000,
    cleaningFee: 90_000,
    minNights: 2,
    monthlyGuide: 9_800_000,
    amenities: [
      WIFI,
      KITCHEN,
      { label: 'Private terrace', scope: 'unit', pictured: true, photo: 'living' },
      { label: 'Air conditioning', scope: 'unit', pictured: false },
      { label: 'Pool', scope: 'shared', pictured: true, key: 'pool', photo: 'pool' },
      { label: 'Gym', scope: 'shared', pictured: true, key: 'gym', photo: 'gym' },
      { label: 'Housekeeping', scope: 'service', pictured: false },
      { label: 'Concierge', scope: 'service', pictured: false },
    ],
    gallery: [
      g('kololo', 'exterior', 'Exterior', 'A low-rise limestone residence with bronze window frames and planted terraces above a driveway'),
      g('kololo', 'living', 'Living room', 'A large living room with a cream sectional, rust armchair, stone coffee table and glass opening to a terrace'),
      g('kololo', 'bedroom', 'Bedroom', 'A bedroom with a wide bed, rust throw, terracotta artwork and doors onto a terrace'),
      g('kololo', 'kitchen', 'Kitchen', 'A smoked oak and limestone kitchen with an island, rust leather stools and pendant lights'),
      g('kololo', 'bathroom', 'Bathroom', 'A limestone bathroom with a floating vanity, folded towels and a walk-in shower'),
      g('kololo', 'pool', 'Shared resident pool', 'A pool terrace with cushioned loungers below the limestone residence at sunset'),
      g('kololo', 'gym', 'Shared resident gym', 'A residents’ gym with treadmills, a cable machine and free weights facing a garden'),
    ],
    houseRules: ['No smoking indoors', 'No parties or events', 'Quiet hours from 10pm to 7am', 'Pool and gym use follows building hours'],
    checkIn: 'From 3pm',
    checkOut: 'By 12 noon',
    availabilitySeed: 5,
  },
  {
    id: 'muyenga',
    slug: 'muyenga-vista-residences',
    name: 'Muyenga Vista Residences',
    neighbourhood: 'Muyenga',
    neighbourhoodSlug: 'muyenga',
    positioning: 'Spacious family-oriented stays',
    intro: 'A three-bedroom garden residence for families settling in for months, with a shared garden pool. Offered for extended and long-term stays only.',
    description: [
      'Pale sand plaster, timber balcony screens and terracotta planters give Muyenga Vista a relaxed, garden-first character. Inside, honey oak and cream linen keep it light and practical.',
      'Residents share a garden pool and gardens, and the concept includes a children’s play area that is not photographed. Because it is set up for families relocating, nightly stays are not offered.',
    ],
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    stayTypes: ['extended', 'long'],
    monthlyGuide: 7_200_000,
    amenities: [
      WIFI,
      KITCHEN,
      { label: 'Family living space', scope: 'unit', pictured: true, photo: 'living' },
      { label: 'Pool', scope: 'shared', pictured: true, key: 'pool', photo: 'pool' },
      { label: 'Gardens', scope: 'shared', pictured: true, photo: 'pool' },
      { label: 'Children’s play area', scope: 'shared', pictured: false },
      { label: 'Parking', scope: 'service', pictured: true, key: 'parking', photo: 'exterior' },
    ],
    gallery: [
      g('muyenga', 'exterior', 'Exterior', 'A three-storey sand-coloured residence with timber balcony screens, planters and a gated entrance'),
      g('muyenga', 'living', 'Living room', 'A spacious family living room with a cream linen sectional, terracotta throws and doors to the garden'),
      g('muyenga', 'bedroom', 'Bedroom', 'A bedroom with a large bed, terracotta throw, arched artwork and timber screens'),
      g('muyenga', 'kitchen', 'Kitchen', 'A honey oak kitchen with an island, four stools, rattan pendants and a tall fridge'),
      g('muyenga', 'bathroom', 'Bathroom', 'A bathroom with an oak vanity, framed mirror and a walk-in shower beside a window'),
      g('muyenga', 'pool', 'Shared garden pool', 'A garden pool with a lawn, loungers and tropical planting in front of the residence'),
    ],
    houseRules: ['No smoking indoors', 'No parties or events', 'Quiet hours from 9pm to 7am', 'Children supervised at the pool at all times'],
    checkIn: 'Agreed with each household',
    checkOut: 'Agreed with each household',
    availabilitySeed: 9,
  },
  {
    id: 'naguru',
    slug: 'naguru-terrace-apartments',
    name: 'Naguru Terrace Apartments',
    neighbourhood: 'Naguru',
    neighbourhoodSlug: 'naguru',
    positioning: 'Executive accommodation',
    intro: 'A two-bedroom executive apartment in a five-storey residence with graphite fins, deep terraces and a shared gym.',
    description: [
      'Ash wood, slate-blue upholstery and charcoal fixtures give Naguru Terrace an orderly, practical elegance. The living room opens to a deep terrace.',
      'Residents share a gym (pictured), plus a pool and a coworking lounge that are part of the concept but not photographed.',
    ],
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    stayTypes: ['short', 'extended', 'long'],
    nightlyRate: 390_000,
    cleaningFee: 70_000,
    minNights: 1,
    monthlyGuide: 7_400_000,
    amenities: [
      WIFI,
      KITCHEN,
      { label: 'Terrace', scope: 'unit', pictured: true, photo: 'living' },
      { label: 'Gym', scope: 'shared', pictured: true, key: 'gym', photo: 'gym' },
      { label: 'Pool', scope: 'shared', pictured: false, key: 'pool' },
      { label: 'Coworking lounge', scope: 'shared', pictured: false, key: 'workspace' },
      { label: 'Lift', scope: 'service', pictured: false },
      { label: 'Backup power', scope: 'service', pictured: false },
    ],
    gallery: [
      g('naguru', 'exterior', 'Exterior', 'A five-storey off-white residence with graphite vertical fins and deep terraces above a gated entrance'),
      g('naguru', 'living', 'Living room', 'A living room with a cream sofa, slate-blue armchairs and cushions, and glass doors onto a terrace'),
      g('naguru', 'bedroom', 'Bedroom', 'A bedroom with a large bed, slate-blue throw, framed abstract prints and terrace doors'),
      g('naguru', 'kitchen', 'Kitchen', 'An ash wood kitchen with a grey stone island, slate-blue stools and glass pendants'),
      g('naguru', 'bathroom', 'Bathroom', 'A bathroom with a stone vanity, black fixtures and a walk-in shower'),
      g('naguru', 'gym', 'Shared resident gym', 'A residents’ gym with dumbbell racks, benches, a treadmill and bike in front of tall windows'),
    ],
    houseRules: ['No smoking indoors', 'No parties or events', 'Quiet hours from 10pm to 7am', 'Coworking lounge for residents only'],
    checkIn: 'From 2pm',
    checkOut: 'By 11am',
    availabilitySeed: 2,
  },
]

export const propertyById = (id: string) => properties.find(property => property.id === id)
export const propertyBySlug = (slug: string | undefined) => properties.find(property => property.slug === slug)

export const hasAmenity = (property: Property, key: AmenityKey) => property.amenities.some(amenity => amenity.key === key)
export const amenityFor = (property: Property, key: AmenityKey) => property.amenities.find(amenity => amenity.key === key)
export const offersNightly = (property: Property) => property.stayTypes.includes('short') && property.nightlyRate !== undefined

export const SCOPE_LABEL: Record<AmenityScope, string> = {
  unit: 'In the apartment',
  shared: 'Shared resident facilities',
  service: 'Building and services',
}

export const AMENITY_FILTERS: { key: AmenityKey; label: string; hint?: string }[] = [
  { key: 'pool', label: 'Pool', hint: 'shared' },
  { key: 'gym', label: 'Gym', hint: 'shared' },
  { key: 'kitchen', label: 'Equipped kitchen' },
  { key: 'workspace', label: 'Workspace', hint: 'desk or coworking lounge' },
  { key: 'parking', label: 'Parking' },
]

/** Short label used on cards and comparison, making the shared nature explicit. */
export function amenityShortLabel(amenity: Amenity) {
  return amenity.scope === 'shared' ? `${amenity.label} (shared)` : amenity.label
}
