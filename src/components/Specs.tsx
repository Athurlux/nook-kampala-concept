import type { Property } from '../data/properties'
import { Icon } from './Icon'

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

export function Specs({ property, compact = false }: { property: Property; compact?: boolean }) {
  return (
    <ul className={`specs ${compact ? 'specs--compact' : ''}`} aria-label="Specifications">
      <li><Icon name="bed" size={compact ? 16 : 20} />{plural(property.bedrooms, 'bedroom')}</li>
      <li><Icon name="bath" size={compact ? 16 : 20} />{plural(property.bathrooms, 'bathroom')}</li>
      <li><Icon name="guests" size={compact ? 16 : 20} />Up to {plural(property.maxGuests, 'guest')}</li>
    </ul>
  )
}
