import { useEffect, useState } from 'react'

// One polite live region for short confirmations ("Saved", "Comparison is full").
// Visible as a small toast so sighted users get the same feedback.
type Listener = (message: string) => void
const listeners = new Set<Listener>()

export function announce(message: string) {
  listeners.forEach(listener => listener(message))
}

export function Announcer() {
  const [message, setMessage] = useState('')
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const listener: Listener = next => { setMessage(next); setTick(value => value + 1) }
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(''), 3200)
    return () => clearTimeout(timer)
  }, [message, tick])
  return (
    <div className={`toast ${message ? 'is-visible' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  )
}
