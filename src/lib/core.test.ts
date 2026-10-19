import { describe, expect, it } from 'vitest'
import { properties, propertyById } from '../data/properties'
import { applyFilters, parseFilters, serializeFilters, EMPTY_FILTERS } from './filters'
import { createCollectionStore, readCollection, STORAGE_KEY, MAX_COMPARE } from './collection'
import { guestErrors, isBlackedOut, nightsBetween, quoteStay, stayDateErrors, firstAvailableStart } from './stay'
import { addDays } from './validation'
import { bookingFlow, type BookingDraft } from '../forms/flows'
import { firstIncompleteIndex, reviewSections, validateStage } from '../forms/engine'
import { resolveStep, DONE, REVIEW } from '../forms/useFormFlow'

// Noon in Kampala (UTC+3) on 19 October 2026.
const NOW = new Date('2026-10-19T09:00:00Z')
const TODAY = '2026-10-19'
const ids = (list: { property: { id: string } }[]) => list.map(item => item.property.id)
const kololo = propertyById('kololo')!
const kasiri = propertyById('kasiri')!

describe('filters and sorting', () => {
  it('matches amenities against the guide, including unpictured shared facilities', () => {
    expect(ids(applyFilters(properties, { ...EMPTY_FILTERS, amenities: ['pool'] }, NOW))).toEqual(['kyanja', 'kololo', 'muyenga', 'naguru'])
    expect(ids(applyFilters(properties, { ...EMPTY_FILTERS, amenities: ['gym'] }, NOW))).toEqual(['bukoto', 'kyanja', 'kololo', 'naguru'])
    expect(ids(applyFilters(properties, { ...EMPTY_FILTERS, amenities: ['pool', 'parking'] }, NOW))).toEqual(['muyenga'])
    expect(ids(applyFilters(properties, { ...EMPTY_FILTERS, amenities: ['workspace'] }, NOW))).toEqual(['kasiri', 'naguru'])
  })

  it('filters by stay type, guests, bedrooms and area', () => {
    expect(ids(applyFilters(properties, { ...EMPTY_FILTERS, stay: 'short' }, NOW))).not.toContain('muyenga')
    expect(ids(applyFilters(properties, { ...EMPTY_FILTERS, guests: 5 }, NOW))).toEqual(['kololo', 'muyenga'])
    expect(ids(applyFilters(properties, { ...EMPTY_FILTERS, bedrooms: 3, stay: 'long' }, NOW))).toEqual(['muyenga'])
    expect(ids(applyFilters(properties, { ...EMPTY_FILTERS, area: 'naguru' }, NOW))).toEqual(['naguru'])
  })

  it('sorts by price in one unit and never mixes nightly with monthly', () => {
    const asc = applyFilters(properties, { ...EMPTY_FILTERS, sort: 'price-asc' }, NOW)
    // Nightly homes first, cheapest to dearest; Muyenga (monthly only) after them.
    expect(ids(asc)).toEqual(['kasiri', 'bukoto', 'kyanja', 'naguru', 'kololo', 'muyenga'])
    const monthly = applyFilters(properties, { ...EMPTY_FILTERS, stay: 'extended', sort: 'price-desc' }, NOW)
    expect(ids(monthly)[0]).toBe('kololo')
    expect(ids(applyFilters(properties, { ...EMPTY_FILTERS, sort: 'name' }, NOW))[0]).toBe('bukoto')
  })

  it('leaves out homes without nightly rates when a nightly price cap is set', () => {
    expect(ids(applyFilters(properties, { ...EMPTY_FILTERS, maxPrice: 300_000 }, NOW))).toEqual(['kasiri', 'bukoto'])
  })

  it('drops malformed URL values and round-trips valid ones', () => {
    const parsed = parseFilters(new URLSearchParams('area=nowhere&stay=weekly&guests=99&beds=2&amenities=pool,spa,gym&max=123&sort=bogus'))
    expect(parsed).toMatchObject({ area: null, stay: null, guests: null, bedrooms: 2, amenities: ['pool', 'gym'], maxPrice: null, sort: 'recommended' })
    const filters = { ...EMPTY_FILTERS, stay: 'short' as const, checkIn: '2026-11-02', checkOut: '2026-11-05', guests: 2 }
    expect(parseFilters(serializeFilters(filters))).toEqual(filters)
  })

  it('uses dates to exclude homes blacked out on the demo calendar and to quote totals', () => {
    const checkIn = firstAvailableStart(kololo, addDays(TODAY, 10), 3)
    const results = applyFilters(properties, { ...EMPTY_FILTERS, stay: 'short', checkIn, checkOut: addDays(checkIn, 3) }, NOW)
    const match = results.find(item => item.property.id === 'kololo')!
    expect(match.quote?.total).toBe(520_000 * 3 + 90_000)
    for (const item of results) expect(stayDateErrors(item.property, checkIn, addDays(checkIn, 3), NOW)).toEqual({})
  })
})

describe('saved and compare storage', () => {
  const known = new Set(properties.map(property => property.id))
  const memory = (initial: Record<string, string> = {}) => {
    const data = { ...initial }
    return { data, getItem: (key: string) => data[key] ?? null, setItem: (key: string, value: string) => { data[key] = value }, removeItem: (key: string) => { delete data[key] } }
  }

  it('persists only IDs, caps comparison at three and reports a full comparison', () => {
    const storage = memory()
    const store = createCollectionStore(storage, known)
    store.toggleSaved('kasiri')
    for (const id of ['kasiri', 'bukoto', 'kyanja']) expect(store.toggleCompare(id)).toBe('added')
    expect(store.toggleCompare('naguru')).toBe('full')
    expect(store.getState().compare).toHaveLength(MAX_COMPARE)
    expect(JSON.parse(storage.data[STORAGE_KEY])).toEqual({ version: 1, saved: ['kasiri'], compare: ['kasiri', 'bukoto', 'kyanja'] })
    expect(store.toggleCompare('bukoto')).toBe('removed')
    // A second store reading the same storage sees the same state, as after a refresh.
    expect(createCollectionStore(storage, known).getState()).toEqual({ saved: ['kasiri'], compare: ['kasiri', 'kyanja'] })
  })

  it('recovers from corrupt, unknown-version and tampered data', () => {
    expect(readCollection(memory({ [STORAGE_KEY]: '{not json' }), known)).toEqual({ collection: { saved: [], compare: [] }, status: 'recovered' })
    expect(readCollection(memory({ [STORAGE_KEY]: JSON.stringify({ version: 9, saved: ['kasiri'], compare: [] }) }), known).status).toBe('recovered')
    const tampered = JSON.stringify({ version: 1, saved: ['kasiri', 'kasiri', 'ghost', 42], compare: ['a', 'kasiri', 'bukoto', 'kyanja', 'naguru'] })
    expect(readCollection(memory({ [STORAGE_KEY]: tampered }), known).collection).toEqual({ saved: ['kasiri'], compare: ['kasiri', 'bukoto', 'kyanja'] })
  })

  it('keeps working in memory when storage throws', () => {
    const broken = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') }, removeItem: () => {} }
    const store = createCollectionStore(broken, known)
    expect(store.getStatus()).toBe('unavailable')
    store.toggleSaved('naguru')
    expect(store.getState().saved).toEqual(['naguru'])
  })
})

describe('dates, capacity and pricing', () => {
  it('counts nights from calendar dates, across months and leap days', () => {
    expect(nightsBetween('2026-10-30', '2026-11-02')).toBe(3)
    expect(nightsBetween('2028-02-28', '2028-03-01')).toBe(2)
    expect(nightsBetween('2026-11-02', '2026-11-02')).toBe(0)
  })

  it('rejects past check-in in Kampala time even when UTC is still the previous day', () => {
    // 23:30 UTC on the 18th is already 02:30 on the 19th in Kampala.
    const lateUtc = new Date('2026-10-18T23:30:00Z')
    expect(stayDateErrors(kasiri, '2026-10-18', '2026-10-20', lateUtc).checkIn).toMatch(/past/)
  })

  it('enforces order, minimum nights, maximum nights and the demo calendar', () => {
    const start = firstAvailableStart(kololo, addDays(TODAY, 5), 3)
    expect(stayDateErrors(kololo, start, start, NOW).checkOut).toMatch(/after check-in/)
    expect(stayDateErrors(kololo, start, addDays(start, 1), NOW).checkOut).toMatch(/2-night minimum/)
    expect(stayDateErrors(kololo, start, addDays(start, 29), NOW).checkOut).toMatch(/up to 28 nights/)
    const blocked = Array.from({ length: 20 }, (_, index) => addDays(TODAY, index + 3)).find(day => isBlackedOut(kololo, day))!
    expect(stayDateErrors(kololo, addDays(blocked, -1), addDays(blocked, 2), NOW).checkOut).toMatch(/Not available/)
    // Checking out on a blacked-out day is fine: that night isn't stayed.
    expect(stayDateErrors(kololo, addDays(blocked, -2), blocked, NOW)).toEqual({})
  })

  it('validates guest capacity per property', () => {
    expect(guestErrors(kasiri, 2, 0)).toBeNull()
    expect(guestErrors(kasiri, 2, 1)).toMatch(/up to 2 guests/)
    expect(guestErrors(kololo, 0, 2)).toMatch(/At least one adult/)
  })

  it('totals nightly rate × nights plus the cleaning fee in whole UGX', () => {
    expect(quoteStay(kasiri, 1)).toEqual({ nightlyRate: 165_000, nights: 1, lines: [{ label: 'UGX 165,000 × 1 night', amount: 165_000 }, { label: 'Cleaning fee (one-off)', amount: 40_000 }], total: 205_000 })
    expect(quoteStay(kololo, 4)!.total).toBe(2_170_000)
    expect(quoteStay(propertyById('muyenga')!, 3)).toBeNull()
    expect(quoteStay(kasiri, 0)).toBeNull()
  })
})

describe('booking flow', () => {
  const flow = bookingFlow(kasiri)
  const checkIn = firstAvailableStart(kasiri, addDays(TODAY, 7), 2)
  const stay = { ...flow.empty(), checkIn, checkOut: addDays(checkIn, 2), adults: '2', children: '0' }
  const complete = { ...stay, name: 'Amani Demo', email: 'amani.demo@example.com', phone: '0772 000 111' }

  it('blocks progress until dates and capacity are valid', () => {
    expect(Object.keys(validateStage(flow.stages[0], flow.empty(), NOW))).toEqual(expect.arrayContaining(['checkIn', 'checkOut', 'adults']))
    expect(validateStage(flow.stages[0], { ...stay, children: '1' }, NOW).children).toMatch(/up to 2 guests/)
    expect(validateStage(flow.stages[0], stay, NOW)).toEqual({})
  })

  it('cannot skip to review or confirmation-ready steps via the URL', () => {
    expect(resolveStep(flow, flow.empty(), REVIEW, NOW)).toBe('stay')
    expect(resolveStep(flow, stay, REVIEW, NOW)).toBe('guest')
    expect(resolveStep(flow, complete, REVIEW, NOW)).toBe(REVIEW)
    expect(resolveStep(flow, flow.empty(), DONE, NOW)).toBe(DONE) // the page shows its fallback without a completion
  })

  it('reflects edited dates in the review', () => {
    expect(firstIncompleteIndex(flow, complete, NOW)).toBe(flow.stages.length)
    const later = firstAvailableStart(kasiri, addDays(checkIn, 20), 3)
    const edited = { ...complete, checkIn: later, checkOut: addDays(later, 3) }
    const staySection = reviewSections(flow, edited).find(section => section.stageId === 'stay')!
    expect(staySection.entries.find(entry => entry.name === 'checkOut')!.value).toContain(new Date(`${addDays(later, 3)}T12:00:00Z`).getUTCFullYear().toString())
    expect(quoteStay(kasiri, nightsBetween(edited.checkIn, edited.checkOut))!.total).toBe(165_000 * 3 + 40_000)
  })

  it('offers sample data that is itself valid', () => {
    const sampled = { ...flow.empty(), ...flow.sample(TODAY) } as BookingDraft
    expect(firstIncompleteIndex(flow, sampled, NOW)).toBe(flow.stages.length)
  })
})
