import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { STAY_TYPES, type StayType } from '../data/properties'
import { neighbourhoods } from '../data/neighbourhoods'
import { EMPTY_FILTERS, serializeFilters } from '../lib/filters'
import { genericStayErrors } from '../lib/stay'
import { addDays, futureDateError, kampalaToday } from '../lib/validation'
import { Icon } from '../components/Icon'

/**
 * The hero search. Short stays ask for dates; extended and long-term stays ask
 * for an approximate move-in instead of forcing nightly inputs. Submitting moves
 * the choices into the results page URL.
 */
export function HeroSearch() {
  const navigate = useNavigate()
  const today = kampalaToday()
  const [area, setArea] = useState('')
  const [stay, setStay] = useState<StayType>('short')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [moveIn, setMoveIn] = useState('')
  const [guests, setGuests] = useState('2')
  const [error, setError] = useState<{ field: string; message: string } | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    let problem: { field: string; message: string } | null = null
    if (stay === 'short' && (checkIn || checkOut)) {
      const errors = genericStayErrors(checkIn, checkOut)
      if (errors.checkIn) problem = { field: 'hero-in', message: errors.checkIn }
      else if (errors.checkOut) problem = { field: 'hero-out', message: errors.checkOut }
    }
    if (stay !== 'short' && moveIn) {
      const message = futureDateError(moveIn, new Date(), { label: 'a move-in date' })
      if (message) problem = { field: 'hero-move', message }
    }
    setError(problem)
    if (problem) { document.getElementById(problem.field)?.focus(); return }
    const params = serializeFilters({
      ...EMPTY_FILTERS,
      area: area || null,
      stay,
      checkIn: stay === 'short' ? checkIn || null : null,
      checkOut: stay === 'short' ? checkOut || null : null,
      moveIn: stay !== 'short' ? moveIn || null : null,
      guests: Number(guests) || null,
    })
    navigate(`/apartments?${params}`)
  }

  const errorFor = (field: string) => (error?.field === field ? error.message : null)
  const describedBy = (field: string) => (errorFor(field) ? 'hero-search-error' : undefined)

  return (
    <form className="hero-search" onSubmit={submit} noValidate aria-label="Find a stay">
      <fieldset className="hero-search__stay">
        <legend className="visually-hidden">Stay type</legend>
        {STAY_TYPES.map(type => (
          <label key={type.value} className={`hero-search__tab ${stay === type.value ? 'is-selected' : ''}`}>
            <input type="radio" name="hero-stay" value={type.value} checked={stay === type.value} onChange={() => { setStay(type.value); setError(null) }} />
            <span>{type.label}</span>
          </label>
        ))}
      </fieldset>
      <div className={`hero-search__fields hero-search__fields--${stay === 'short' ? 'short' : 'long'}`}>
        <div className="hero-field">
          <label htmlFor="hero-area">Where</label>
          <select id="hero-area" value={area} onChange={event => setArea(event.target.value)}>
            <option value="">All of Kampala</option>
            {neighbourhoods.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
        </div>
        {stay === 'short' ? (
          <>
            <div className="hero-field">
              <label htmlFor="hero-in">Check-in</label>
              <input id="hero-in" type="date" min={today} max={addDays(today, 365)} value={checkIn} aria-invalid={errorFor('hero-in') ? true : undefined} aria-describedby={describedBy('hero-in')} onChange={event => setCheckIn(event.target.value)} />
            </div>
            <div className="hero-field">
              <label htmlFor="hero-out">Check-out</label>
              <input id="hero-out" type="date" min={checkIn ? addDays(checkIn, 1) : addDays(today, 1)} value={checkOut} aria-invalid={errorFor('hero-out') ? true : undefined} aria-describedby={describedBy('hero-out')} onChange={event => setCheckOut(event.target.value)} />
            </div>
          </>
        ) : (
          <div className="hero-field hero-field--wide">
            <label htmlFor="hero-move">Approximate move-in</label>
            <input id="hero-move" type="date" min={today} max={addDays(today, 365)} value={moveIn} aria-invalid={errorFor('hero-move') ? true : undefined} aria-describedby={describedBy('hero-move')} onChange={event => setMoveIn(event.target.value)} />
          </div>
        )}
        <div className="hero-field hero-field--small">
          <label htmlFor="hero-guests">Guests</label>
          <select id="hero-guests" value={guests} onChange={event => setGuests(event.target.value)}>
            {[1, 2, 3, 4, 5, 6].map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <button type="submit" className="button button--primary hero-search__submit">
          <Icon name="search" size={18} /> Search stays
        </button>
      </div>
      {error ? (
        <p className="hero-search__error" id="hero-search-error" role="alert">{error.message}</p>
      ) : (
        <p className="hero-search__note">{stay === 'short' ? 'Dates are optional · Kampala calendar' : 'Dates are optional · for stays of a month or more'}</p>
      )}
    </form>
  )
}
