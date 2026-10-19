// Saved stays and the comparison list: the only state this demo persists. Only
// property IDs are stored — never names typed by a visitor, dates or contact
// details. Stored data is versioned and validated on every read, and the store
// keeps working in memory when browser storage is blocked, full or corrupt.
import { useSyncExternalStore } from 'react'

export const STORAGE_KEY = 'nook-kampala:collection'
export const STORAGE_VERSION = 1
export const MAX_COMPARE = 3

export interface Collection {
  saved: string[]
  compare: string[]
}

export type StorageStatus = 'ok' | 'recovered' | 'unavailable'

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const EMPTY: Collection = { saved: [], compare: [] }

/** Keeps known, unique IDs only; the comparison is capped. Anything else is discarded. */
export function sanitize(value: unknown, knownIds: ReadonlySet<string>): Collection | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (record.version !== STORAGE_VERSION || !Array.isArray(record.saved) || !Array.isArray(record.compare)) return null
  const clean = (list: unknown[]) => [...new Set(list.filter((id): id is string => typeof id === 'string' && knownIds.has(id)))]
  return { saved: clean(record.saved), compare: clean(record.compare).slice(0, MAX_COMPARE) }
}

export function readCollection(storage: StorageLike | null, knownIds: ReadonlySet<string>): { collection: Collection; status: StorageStatus } {
  if (!storage) return { collection: EMPTY, status: 'unavailable' }
  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return { collection: EMPTY, status: 'unavailable' }
  }
  if (raw === null) return { collection: EMPTY, status: 'ok' }
  try {
    const collection = sanitize(JSON.parse(raw), knownIds)
    if (collection) return { collection, status: 'ok' }
  } catch {
    // fall through: unreadable JSON is treated like an unknown shape
  }
  // Corrupt or from an unknown version: start clean rather than guess at its meaning.
  try { storage.removeItem(STORAGE_KEY) } catch { /* storage may have become unavailable */ }
  return { collection: EMPTY, status: 'recovered' }
}

export function writeCollection(storage: StorageLike | null, collection: Collection): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, ...collection }))
    return true
  } catch {
    return false
  }
}

export type CompareResult = 'added' | 'removed' | 'full'

/** Pure state transitions, shared by the store and the tests. */
export const transitions = {
  toggleSaved(state: Collection, id: string): Collection {
    return { ...state, saved: state.saved.includes(id) ? state.saved.filter(item => item !== id) : [...state.saved, id] }
  },
  toggleCompare(state: Collection, id: string): { state: Collection; result: CompareResult } {
    if (state.compare.includes(id)) return { state: { ...state, compare: state.compare.filter(item => item !== id) }, result: 'removed' }
    if (state.compare.length >= MAX_COMPARE) return { state, result: 'full' }
    return { state: { ...state, compare: [...state.compare, id] }, result: 'added' }
  },
}

export function createCollectionStore(storage: StorageLike | null, knownIds: ReadonlySet<string>) {
  let { collection: state, status } = readCollection(storage, knownIds)
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach(listener => listener())
  const set = (next: Collection) => {
    state = next
    if (!writeCollection(storage, next) && status === 'ok') status = 'unavailable'
    emit()
  }

  return {
    getState: () => state,
    getStatus: () => status,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    toggleSaved: (id: string) => set(transitions.toggleSaved(state, id)),
    removeSaved: (id: string) => set({ ...state, saved: state.saved.filter(item => item !== id) }),
    toggleCompare(id: string): CompareResult {
      const { state: next, result } = transitions.toggleCompare(state, id)
      if (result !== 'full') set(next)
      return result
    },
    clearCompare: () => set({ ...state, compare: [] }),
    /** Re-read after another tab changed the same key. */
    sync() {
      const read = readCollection(storage, knownIds)
      state = read.collection
      emit()
    },
  }
}

export type CollectionStore = ReturnType<typeof createCollectionStore>

let store: CollectionStore | null = null

function safeLocalStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/** The app-wide store, created on first use with the IDs of the local catalogue. */
export function getCollectionStore(knownIds: ReadonlySet<string>) {
  if (!store) {
    store = createCollectionStore(safeLocalStorage(), knownIds)
    window.addEventListener('storage', event => { if (event.key === STORAGE_KEY || event.key === null) store?.sync() })
  }
  return store
}

export function useCollectionStore(knownIds: ReadonlySet<string>) {
  const instance = getCollectionStore(knownIds)
  const state = useSyncExternalStore(instance.subscribe, instance.getState)
  return { ...state, store: instance, status: instance.getStatus() }
}
