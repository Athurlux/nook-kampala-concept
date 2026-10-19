import { properties } from '../data/properties'
import { useCollectionStore } from './collection'

const KNOWN_IDS: ReadonlySet<string> = new Set(properties.map(property => property.id))

export const useCollection = () => useCollectionStore(KNOWN_IDS)
