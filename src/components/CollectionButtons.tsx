import { useCollection } from '../lib/useCollection'
import { MAX_COMPARE } from '../lib/collection'
import type { Property } from '../data/properties'
import { announce } from './Announcer'
import { Icon } from './Icon'

export function SaveButton({ property, variant = 'icon' }: { property: Property; variant?: 'icon' | 'full' }) {
  const { saved, store } = useCollection()
  const isSaved = saved.includes(property.id)
  const toggle = () => {
    store.toggleSaved(property.id)
    announce(isSaved ? `Removed ${property.name} from saved stays` : `Saved ${property.name}`)
  }
  return (
    <button
      type="button"
      className={`save-button save-button--${variant} ${isSaved ? 'is-saved' : ''}`}
      aria-pressed={isSaved}
      aria-label={variant === 'icon' ? `Save ${property.name}` : undefined}
      onClick={toggle}
    >
      <Icon name="heart" size={variant === 'icon' ? 20 : 18} />
      {variant === 'full' && <span>{isSaved ? 'Saved' : 'Save'}</span>}
    </button>
  )
}

export function CompareButton({ property, className = '' }: { property: Property; className?: string }) {
  const { compare, store } = useCollection()
  const selected = compare.includes(property.id)
  const full = !selected && compare.length >= MAX_COMPARE
  const toggle = () => {
    const result = store.toggleCompare(property.id)
    if (result === 'full') announce(`You can compare up to ${MAX_COMPARE} stays. Remove one to add ${property.name}.`)
    else announce(result === 'added' ? `Added ${property.name} to compare (${compare.length + 1} of ${MAX_COMPARE})` : `Removed ${property.name} from compare`)
  }
  return (
    <button
      type="button"
      className={`compare-toggle ${selected ? 'is-selected' : ''} ${full ? 'is-full' : ''} ${className}`}
      aria-pressed={selected}
      onClick={toggle}
    >
      <Icon name={selected ? 'check' : 'plus'} size={16} />
      <span>{selected ? 'Comparing' : 'Compare'}</span>
      <span className="visually-hidden"> {property.name}{full ? ` (comparison full, ${MAX_COMPARE} of ${MAX_COMPARE})` : ''}</span>
    </button>
  )
}
