import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { amenityFor, offersNightly, properties, propertyById, STAY_TYPES, type AmenityKey, type Property } from '../data/properties'
import { MAX_COMPARE } from '../lib/collection'
import { useCollection } from '../lib/useCollection'
import { formatUGX } from '../lib/stay'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { announce } from '../components/Announcer'
import { Icon } from '../components/Icon'
import { PropertyImg } from '../components/Img'
import { PageIntro } from '../components/PageIntro'

type RateMode = 'night' | 'month'

function amenityCell(property: Property, key: AmenityKey): ReactNode {
  const amenity = amenityFor(property, key)
  if (!amenity) return <span className="compare__no">No</span>
  const scope = amenity.scope === 'shared' ? 'Shared' : amenity.scope === 'unit' ? 'In apartment' : 'On site'
  return <span className="compare__yes"><Icon name="check" size={16} /> {amenity.label !== labelFor(key) ? `${amenity.label}, ` : ''}{scope.toLowerCase()}{amenity.pictured ? '' : ' (not pictured)'}</span>
}

const labelFor = (key: AmenityKey) => ({ pool: 'Pool', gym: 'Gym', kitchen: 'Equipped kitchen', workspace: 'Workspace', parking: 'Parking' })[key]

export default function Compare() {
  useDocumentTitle('Compare stays')
  const { compare, store } = useCollection()
  const [mode, setMode] = useState<RateMode>('night')
  const items = compare.map(propertyById).filter((property): property is Property => Boolean(property))
  const addable = properties.filter(property => !compare.includes(property.id))

  const rows: { label: string; cell: (property: Property) => ReactNode }[] = [
    { label: 'Neighbourhood', cell: p => p.neighbourhood },
    { label: 'Bedrooms', cell: p => p.bedrooms },
    { label: 'Bathrooms', cell: p => p.bathrooms },
    { label: 'Maximum guests', cell: p => p.maxGuests },
    { label: 'Stay types', cell: p => STAY_TYPES.filter(type => p.stayTypes.includes(type.value)).map(type => type.label).join(', ') },
    {
      label: mode === 'night' ? 'Nightly rate' : 'Monthly guide',
      cell: p => mode === 'night'
        ? (offersNightly(p) ? <><strong>{formatUGX(p.nightlyRate!)}</strong> / night</> : <span className="compare__no">Nightly stays not offered</span>)
        : <><strong>{formatUGX(p.monthlyGuide)}</strong> / month</>,
    },
    ...(mode === 'night' ? [{ label: 'Cleaning fee', cell: (p: Property) => (offersNightly(p) ? formatUGX(p.cleaningFee ?? 0) : '—') }, { label: 'Minimum stay', cell: (p: Property) => (offersNightly(p) ? `${p.minNights} night${p.minNights === 1 ? '' : 's'}` : '—') }] : []),
    { label: 'Pool', cell: p => amenityCell(p, 'pool') },
    { label: 'Gym', cell: p => amenityCell(p, 'gym') },
    { label: 'Workspace', cell: p => amenityCell(p, 'workspace') },
    { label: 'Kitchen', cell: p => amenityCell(p, 'kitchen') },
    { label: 'Parking', cell: p => amenityCell(p, 'parking') },
    { label: 'Other features', cell: p => p.amenities.filter(a => !a.key && a.label !== 'Wi-Fi').map(a => a.label + (a.pictured ? '' : ' (not pictured)')).join(', ') || '—' },
    { label: 'Check-in / out', cell: p => `${p.checkIn} / ${p.checkOut.toLowerCase()}` },
  ]

  return (
    <>
      <PageIntro eyebrow="Compare" title={items.length ? 'Side by side.' : 'Nothing to compare yet.'}>
        <p>{items.length ? `Comparing ${items.length} of up to ${MAX_COMPARE} homes. Rates are illustrative and always shown in the same unit.` : `Choose “Compare” on up to ${MAX_COMPARE} apartments to see them side by side.`}</p>
      </PageIntro>

      <section className="container compare" aria-label="Comparison">
        {items.length ? (
          <>
            <div className="compare__controls">
              <fieldset className="segmented segmented--inline">
                <legend className="visually-hidden">Rate unit</legend>
                {(['night', 'month'] as RateMode[]).map(value => (
                  <label key={value} className={`segmented__option ${mode === value ? 'is-selected' : ''}`}>
                    <input type="radio" name="rate-mode" checked={mode === value} onChange={() => setMode(value)} />
                    <span>{value === 'night' ? 'Nightly rates' : 'Monthly guide rates'}</span>
                  </label>
                ))}
              </fieldset>
              <button type="button" className="text-button" onClick={() => { store.clearCompare(); announce('Comparison cleared') }}>Clear comparison</button>
            </div>

            <div className="compare__scroll" tabIndex={0} role="region" aria-label="Comparison table, scrolls sideways on small screens">
              <table className={`compare__table compare__table--${items.length}`}>
                <caption className="visually-hidden">Comparison of {items.map(item => item.name).join(', ')}</caption>
                <thead>
                  <tr>
                    <td />
                    {items.map(property => (
                      <th key={property.id} scope="col">
                        <div className="compare__head">
                          <PropertyImg image={property.gallery[0]} sizes="(min-width: 900px) 260px, 45vw" alt="" />
                          <Link to={`/apartments/${property.slug}`} className="compare__name">{property.name}</Link>
                          <button type="button" className="text-button" onClick={() => { store.toggleCompare(property.id); announce(`Removed ${property.name} from compare`) }}>
                            Remove<span className="visually-hidden"> {property.name}</span>
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      {items.map(property => <td key={property.id}>{row.cell(property)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {items.length < MAX_COMPARE && <AddMore addable={addable} onAdd={id => { store.toggleCompare(id); announce(`Added ${propertyById(id)!.name} to compare`) }} />}
            <p className="fine-print">Pools and gyms are shared resident facilities. “Not pictured” means the amenity is part of the concept but has no photograph.</p>
          </>
        ) : (
          <div className="empty-state">
            <h2 className="empty-state__title">Pick two or three homes</h2>
            <p>Add any of these to start, or browse the full collection.</p>
            <AddMore addable={addable} onAdd={id => store.toggleCompare(id)} />
            <div className="button-row"><Link to="/apartments" className="button button--primary">Explore apartments</Link></div>
          </div>
        )}
      </section>
    </>
  )
}

function AddMore({ addable, onAdd }: { addable: Property[]; onAdd: (id: string) => void }) {
  return (
    <div className="compare__add">
      <p className="compare__add-title">Add a home</p>
      <ul>
        {addable.map(property => (
          <li key={property.id}>
            <button type="button" className="chip chip--add" onClick={() => onAdd(property.id)}>
              <Icon name="plus" size={14} /> {property.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
