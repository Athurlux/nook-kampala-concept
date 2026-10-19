import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { properties } from '../data/properties'
import { activeChips, applyFilters, dateProblem, displayRate, EMPTY_FILTERS, parseFilters, serializeFilters, SORTS, type Filters, type SortKey } from '../lib/filters'
import { formatUGX, shortDate } from '../lib/stay'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { useFocusTrap, useScrollLock } from '../lib/useFocusTrap'
import { FilterPanel } from '../components/FilterPanel'
import { PropertyCard } from '../components/PropertyCard'
import { Icon } from '../components/Icon'

export default function Apartments() {
  useDocumentTitle('Explore apartments')
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params), [params])
  const results = useMemo(() => applyFilters(properties, filters), [filters])
  const problem = dateProblem(filters)
  const [sheetOpen, setSheetOpen] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const closeSheet = useCallback(() => setSheetOpen(false), [])
  useFocusTrap(sheetRef, sheetOpen, closeSheet)
  useScrollLock(sheetOpen)

  // Filter edits replace the history entry, so Back leaves the results page instead
  // of stepping through every checkbox.
  const update = (next: Filters) => setParams(serializeFilters(next), { replace: true, preventScrollReset: true })
  const reset = () => setParams(serializeFilters({ ...EMPTY_FILTERS, sort: filters.sort }), { replace: true, preventScrollReset: true })
  const chips = activeChips(filters, formatUGX, shortDate)
  // Dates and guests travel into the detail page so the booking form can start with them.
  const carry = new URLSearchParams()
  if (filters.checkIn && filters.checkOut && !problem) { carry.set('in', filters.checkIn); carry.set('out', filters.checkOut) }
  if (filters.guests) carry.set('guests', String(filters.guests))
  if (filters.moveIn) carry.set('move', filters.moveIn)
  const carryString = carry.toString() ? `?${carry}` : ''

  return (
    <div className="results-page">
      <header className="results-head container">
        <p className="eyebrow">The collection</p>
        <h1 className="page-intro__title">Apartments across Kampala</h1>
        <p className="page-intro__lede">Six fictional homes, from a compact one-bedroom to a serviced three-bedroom suite. Every rate shown is illustrative.</p>
      </header>

      <div className="container results-layout">
        <aside className="results-filters" aria-labelledby="filters-title">
          <div className="results-filters__head">
            <h2 id="filters-title" className="results-filters__title">Filters</h2>
            {chips.length > 0 && <button type="button" className="text-button" onClick={reset}>Reset</button>}
          </div>
          <FilterPanel filters={filters} onChange={update} idPrefix="side" dateProblem={problem} />
        </aside>

        <section className="results-main" aria-labelledby="results-count">
          <div className="results-toolbar">
            <p className="results-count" id="results-count" aria-live="polite">
              <strong>{results.length}</strong> {results.length === 1 ? 'stay' : 'stays'}{chips.length ? ' match' : ''}
            </p>
            <div className="results-toolbar__controls">
              <button type="button" className="button button--outline button--small results-filter-button" onClick={() => setSheetOpen(true)} aria-haspopup="dialog">
                <Icon name="filter" size={16} /> Filters{chips.length ? ` (${chips.length})` : ''}
              </button>
              <label className="sort">
                <span className="sort__label">Sort</span>
                <select className="input input--select input--compact" value={filters.sort} onChange={event => update({ ...filters, sort: event.target.value as SortKey })}>
                  {SORTS.map(sort => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
                </select>
              </label>
            </div>
          </div>

          {chips.length > 0 && (
            <ul className="chips" aria-label="Active filters">
              {chips.map(chip => (
                <li key={chip.key}>
                  <button type="button" className="chip" onClick={() => update(chip.remove(filters))}>
                    {chip.label} <Icon name="close" size={14} /><span className="visually-hidden"> — remove filter</span>
                  </button>
                </li>
              ))}
              <li><button type="button" className="text-button" onClick={reset}>Clear all</button></li>
            </ul>
          )}

          {problem && <p className="notice notice--warn results-notice">{problem}</p>}
          {filters.stay === 'short' && filters.checkIn && filters.checkOut && !problem && (
            <p className="notice results-notice">Showing homes free on the demo calendar for {shortDate(filters.checkIn)} – {shortDate(filters.checkOut)}. Totals include the cleaning fee and are illustrative.</p>
          )}

          {results.length ? (
            <div className="card-grid">
              {results.map(({ property, quote }, index) => (
                <PropertyCard key={property.id} property={property} rate={displayRate(property, filters)} quote={quote} search={carryString} headingLevel="h2" priority={index < 2} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2 className="empty-state__title">No stays match all of these filters.</h2>
              <p>Try removing a filter{filters.checkIn ? ', choosing other dates' : ''} or widening the price range.</p>
              <div className="button-row">
                <button type="button" className="button button--primary" onClick={reset}>Reset filters</button>
                {chips.length > 1 && <button type="button" className="button button--outline" onClick={() => update(chips[chips.length - 1].remove(filters))}>Remove “{chips[chips.length - 1].label}”</button>}
              </div>
            </div>
          )}

          <p className="fine-print results-foot">Looking for months rather than nights? <Link to="/extended-stays">Send an extended-stay enquiry</Link>.</p>
        </section>
      </div>

      {sheetOpen && (
        <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" ref={sheetRef}>
          <div className="sheet__backdrop" onClick={closeSheet} />
          <div className="sheet__panel">
            <div className="sheet__head">
              <h2 id="sheet-title" className="results-filters__title">Filters</h2>
              <button type="button" className="icon-button" onClick={closeSheet} aria-label="Close filters" data-autofocus><Icon name="close" size={22} /></button>
            </div>
            <div className="sheet__body">
              <FilterPanel filters={filters} onChange={update} idPrefix="sheet" dateProblem={problem} />
            </div>
            <div className="sheet__foot">
              <button type="button" className="text-button" onClick={reset}>Reset</button>
              <button type="button" className="button button--primary" onClick={closeSheet}>Show {results.length} {results.length === 1 ? 'stay' : 'stays'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
