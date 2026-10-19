import { useEffect, useState } from 'react'
import type { Property } from '../data/properties'
import { isBlackedOut } from '../lib/stay'
import { addDays, formatDisplayDate, kampalaToday } from '../lib/validation'
import { Icon } from './Icon'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`
const shiftMonth = (first: string, delta: number) => {
  const date = new Date(`${first}T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + delta)
  return date.toISOString().slice(0, 10)
}

/**
 * The demo availability calendar. Choosing a day sets check-in, then check-out;
 * the date inputs above remain the primary, fully keyboard-friendly controls.
 * Unavailable nights come from the fixed demo pattern, not live inventory.
 */
export function StayCalendar({ property, checkIn, checkOut, onChange }: { property: Property; checkIn: string; checkOut: string; onChange: (patch: { checkIn: string; checkOut: string }) => void }) {
  const today = kampalaToday()
  const [month, setMonth] = useState(() => monthStart(checkIn || today))
  // Follow check-in when it is set elsewhere (date input, sample details) to another month.
  useEffect(() => { if (checkIn && /^\d{4}-\d{2}-\d{2}$/.test(checkIn)) setMonth(monthStart(checkIn)) }, [checkIn])
  const first = new Date(`${month}T00:00:00Z`)
  const lead = (first.getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
  const title = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(first)
  const canGoBack = month > monthStart(today)
  const canGoForward = month < monthStart(addDays(today, 365))

  const choose = (iso: string) => {
    if (!checkIn || checkOut || iso <= checkIn) onChange({ checkIn: iso, checkOut: '' })
    else onChange({ checkIn, checkOut: iso })
  }

  return (
    <div className="calendar" aria-label="Demo availability calendar" role="group">
      <div className="calendar__head">
        <button type="button" className="icon-button" onClick={() => setMonth(shiftMonth(month, -1))} disabled={!canGoBack} aria-label="Previous month"><Icon name="left" size={18} /></button>
        <p className="calendar__title" aria-live="polite">{title}</p>
        <button type="button" className="icon-button" onClick={() => setMonth(shiftMonth(month, 1))} disabled={!canGoForward} aria-label="Next month"><Icon name="right" size={18} /></button>
      </div>
      <div className="calendar__grid">
        {WEEKDAYS.map(day => <span key={day} className="calendar__weekday" aria-hidden="true">{day}</span>)}
        {Array.from({ length: lead }, (_, index) => <span key={`pad-${index}`} />)}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const iso = `${month.slice(0, 8)}${String(index + 1).padStart(2, '0')}`
          const past = iso < today
          const blocked = isBlackedOut(property, iso)
          const inRange = checkIn && checkOut && iso > checkIn && iso < checkOut
          const edge = iso === checkIn || iso === checkOut
          const state = past ? 'past' : blocked ? 'unavailable night' : 'available'
          return (
            <button
              key={iso}
              type="button"
              className={`calendar__day ${past ? 'is-past' : ''} ${blocked ? 'is-blocked' : ''} ${inRange ? 'is-range' : ''} ${edge ? 'is-edge' : ''}`}
              disabled={past}
              aria-pressed={edge || Boolean(inRange)}
              aria-label={`${formatDisplayDate(iso)}, ${state}${iso === checkIn ? ', check-in' : iso === checkOut ? ', check-out' : ''}`}
              onClick={() => choose(iso)}
            >
              {index + 1}
            </button>
          )
        })}
      </div>
      <p className="calendar__legend">
        <span><i className="swatch swatch--blocked" /> Unavailable night (demo)</span>
        <span><i className="swatch swatch--range" /> Your stay</span>
      </p>
      <p className="field__hint">A fixed illustrative calendar: two nights in every thirteen are shown as taken. It is not connected to any real availability. Check-out can fall on an unavailable day.</p>
    </div>
  )
}
