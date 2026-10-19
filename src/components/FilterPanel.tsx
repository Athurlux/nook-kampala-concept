import { AMENITY_FILTERS, STAY_TYPES, type StayType } from '../data/properties'
import { neighbourhoods } from '../data/neighbourhoods'
import { MONTHLY_PRICE_STEPS, NIGHTLY_PRICE_STEPS, priceUnit, type Filters } from '../lib/filters'
import { formatUGX } from '../lib/stay'
import { addDays, kampalaToday } from '../lib/validation'

interface FilterPanelProps {
  filters: Filters
  onChange: (next: Filters) => void
  /** Distinguishes ids when the panel is rendered twice (sidebar and sheet). */
  idPrefix: string
  dateProblem: string | null
}

export function FilterPanel({ filters, onChange, idPrefix, dateProblem }: FilterPanelProps) {
  const id = (name: string) => `${idPrefix}-${name}`
  const today = kampalaToday()
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const unit = priceUnit(filters)
  const steps = unit === 'month' ? MONTHLY_PRICE_STEPS : NIGHTLY_PRICE_STEPS

  const setStay = (stay: StayType | null) => {
    // Switching between nightly and monthly changes the meaning of dates and price caps.
    const sameUnit = priceUnit({ stay }) === unit
    onChange({ ...filters, stay, checkIn: stay === 'short' ? filters.checkIn : null, checkOut: stay === 'short' ? filters.checkOut : null, moveIn: stay && stay !== 'short' ? filters.moveIn : null, maxPrice: sameUnit ? filters.maxPrice : null })
  }

  return (
    <div className="filters">
      <div className="field">
        <label className="field__label" htmlFor={id('area')}>Neighbourhood</label>
        <select id={id('area')} className="input input--select" value={filters.area ?? ''} onChange={event => set({ area: event.target.value || null })}>
          <option value="">All of Kampala</option>
          {neighbourhoods.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
      </div>

      <fieldset className="field filters__group">
        <legend className="field__label">Stay type</legend>
        <div className="segmented">
          {[{ value: null, label: 'Any' }, ...STAY_TYPES].map(option => (
            <label key={option.label} className={`segmented__option ${filters.stay === option.value ? 'is-selected' : ''}`}>
              <input type="radio" name={id('stay')} checked={filters.stay === option.value} onChange={() => setStay(option.value as StayType | null)} />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {filters.stay === 'short' && (
        <fieldset className="field filters__group">
          <legend className="field__label">Dates <span className="field__optional">(Kampala)</span></legend>
          <div className="filters__dates">
            <div>
              <label className="field__sublabel" htmlFor={id('in')}>Check-in</label>
              <input id={id('in')} type="date" className="input" min={today} max={addDays(today, 365)} value={filters.checkIn ?? ''} onChange={event => set({ checkIn: event.target.value || null })} />
            </div>
            <div>
              <label className="field__sublabel" htmlFor={id('out')}>Check-out</label>
              <input id={id('out')} type="date" className="input" min={filters.checkIn ? addDays(filters.checkIn, 1) : addDays(today, 1)} value={filters.checkOut ?? ''} onChange={event => set({ checkOut: event.target.value || null })} />
            </div>
          </div>
          {dateProblem ? <p className="field__error">{dateProblem}</p> : <p className="field__hint">With dates, results show homes free on the demo calendar and a total for the stay.</p>}
        </fieldset>
      )}

      {(filters.stay === 'extended' || filters.stay === 'long') && (
        <div className="field">
          <label className="field__label" htmlFor={id('move')}>Approximate move-in</label>
          <input id={id('move')} type="date" className="input" min={today} max={addDays(today, 365)} value={filters.moveIn ?? ''} onChange={event => set({ moveIn: event.target.value || null })} />
          <p className="field__hint">Carried into viewing and enquiry forms. It doesn’t narrow results.</p>
        </div>
      )}

      <div className="filters__pair">
        <div className="field">
          <label className="field__label" htmlFor={id('guests')}>Guests</label>
          <select id={id('guests')} className="input input--select" value={filters.guests ?? ''} onChange={event => set({ guests: event.target.value ? Number(event.target.value) : null })}>
            <option value="">Any</option>
            {[1, 2, 3, 4, 5, 6].map(value => <option key={value} value={value}>{value}{value === 6 ? '+' : ''}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor={id('beds')}>Bedrooms</label>
          <select id={id('beds')} className="input input--select" value={filters.bedrooms ?? ''} onChange={event => set({ bedrooms: event.target.value ? Number(event.target.value) : null })}>
            <option value="">Any</option>
            {[1, 2, 3].map(value => <option key={value} value={value}>{value}+</option>)}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor={id('max')}>{unit === 'month' ? 'Monthly guide up to' : 'Nightly rate up to'}</label>
        <select id={id('max')} className="input input--select" value={filters.maxPrice ?? ''} onChange={event => set({ maxPrice: event.target.value ? Number(event.target.value) : null })} aria-describedby={id('max-hint')}>
          <option value="">Any price</option>
          {steps.map(value => <option key={value} value={value}>{formatUGX(value)}</option>)}
        </select>
        <p className="field__hint" id={id('max-hint')}>
          {unit === 'month' ? 'Illustrative monthly guide rates.' : 'Illustrative nightly rates; homes without nightly stays are left out when set.'}
        </p>
      </div>

      <fieldset className="field filters__group">
        <legend className="field__label">Amenities</legend>
        <div className="checks">
          {AMENITY_FILTERS.map(option => {
            const checked = filters.amenities.includes(option.key)
            return (
              <label key={option.key} className={`check ${checked ? 'is-checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => set({ amenities: checked ? filters.amenities.filter(key => key !== option.key) : [...filters.amenities, option.key] })}
                />
                <span>{option.label}{option.hint && <span className="check__hint"> · {option.hint}</span>}</span>
              </label>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
