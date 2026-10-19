// A small declarative form engine shared by every enquiry journey. Field specs
// drive rendering, validation and the review screen, so a form's rules live in
// one place and a backend can later receive the same typed draft.
import { emailError, formatDisplayDate, normalizePhone, phoneError, wholeNumberError } from '../lib/validation'

export type FieldValue = string | null
export type Draft = Record<string, FieldValue>
export type Errors = Record<string, string>

export interface Option {
  value: string
  label: string
  description?: string
}

export interface FieldSpec<T extends Draft> {
  name: keyof T & string
  label: string
  kind: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'radio' | 'date' | 'time'
  optional?: boolean
  hint?: string
  placeholder?: string
  autoComplete?: string
  options?: Option[]
  rows?: number
  maxLength?: number
  minLength?: number
  /** Only shown, validated and reviewed when this returns true. */
  when?: (draft: T) => boolean
  /** Full-width in the two-column grid. */
  wide?: boolean
  /** Extra rules beyond required/type checks; return a message or null. */
  validate?: (value: FieldValue, draft: T, now: Date) => string | null
  /** Bounds for date inputs, given "today" in Kampala. */
  dateBounds?: (today: string) => { min?: string; max?: string }
  /** Wording for the required-field error. */
  requiredMessage?: string
  /** Bounds for number inputs. */
  numberRange?: { min: number; max: number }
}

export interface StageSpec<T extends Draft> {
  id: string
  title: string
  intro?: string
  fields: FieldSpec<T>[]
  /** Cross-field rules, e.g. "email or phone". Keys may name a field or a group id. */
  validate?: (draft: T, now: Date) => Errors
}

export interface FlowSpec<T extends Draft> {
  key: string
  stages: StageSpec<T>[]
  empty: () => T
  sample: (today: string) => Partial<T>
  /** Field groups rendered as one fieldset, e.g. contact = email + phone. */
  groups?: { id: string; legend: string; hint: string; fields: (keyof T & string)[] }[]
  review: { title: string; intro: string }
  final: { label: string; note: string }
  done: { title: string; body: string }
}

export const isVisible = <T extends Draft>(field: FieldSpec<T>, draft: T) => !field.when || field.when(draft)

const isEmpty = (value: FieldValue) => value === null || (typeof value === 'string' && !value.trim())

function requiredMessage<T extends Draft>(field: FieldSpec<T>) {
  if (field.requiredMessage) return field.requiredMessage
  const label = field.label.toLowerCase()
  return ['select', 'radio', 'date', 'time'].includes(field.kind) ? `Choose ${label}.` : `Enter ${label}.`
}

export function validateField<T extends Draft>(field: FieldSpec<T>, draft: T, now: Date): string | null {
  const value = draft[field.name]
  if (isEmpty(value)) return field.optional ? null : requiredMessage(field)
  const text = value ?? ''
  let message: string | null = null
  if (field.kind === 'email') message = emailError(text, false)
  else if (field.kind === 'tel') message = phoneError(text, false)
  else if (field.kind === 'number') message = wholeNumberError(text, { ...field.numberRange, label: field.label.toLowerCase() })
  else if (field.kind === 'select' || field.kind === 'radio' || field.kind === 'time') {
    message = field.options?.some(option => option.value === text) ? null : requiredMessage(field)
  }
  if (!message && field.minLength && text.trim().length < field.minLength) message = `Write at least ${field.minLength} characters.`
  if (!message && field.maxLength && text.length > field.maxLength) message = `Keep this under ${field.maxLength} characters.`
  return message ?? field.validate?.(value, draft, now) ?? null
}

export function validateStage<T extends Draft>(stage: StageSpec<T>, draft: T, now = new Date()): Errors {
  const errors: Errors = {}
  for (const field of stage.fields) {
    if (!isVisible(field, draft)) continue
    const message = validateField(field, draft, now)
    if (message) errors[field.name] = message
  }
  return { ...errors, ...stage.validate?.(draft, now) }
}

/** Index of the first input stage with errors, or the review index when all pass. */
export function firstIncompleteIndex<T extends Draft>(flow: FlowSpec<T>, draft: T, now = new Date()) {
  const index = flow.stages.findIndex(stage => Object.keys(validateStage(stage, draft, now)).length > 0)
  return index === -1 ? flow.stages.length : index
}

/** Values of hidden conditional fields are dropped so a review never shows stale answers. */
export function pruneHidden<T extends Draft>(flow: FlowSpec<T>, draft: T): T {
  const pruned = { ...draft }
  const empty = flow.empty()
  for (const stage of flow.stages) {
    for (const field of stage.fields) if (!isVisible(field, draft)) pruned[field.name] = empty[field.name]
  }
  return pruned
}

export function displayValue<T extends Draft>(field: FieldSpec<T>, value: FieldValue): string {
  if (isEmpty(value)) return 'Not provided'
  const text = (value ?? '').trim()
  // Time is checked before options: the time select's labels are bare HH:MM and need the zone.
  if (field.kind === 'time') return `${text} (Kampala time)`
  if (field.options) return field.options.find(option => option.value === text)?.label ?? text
  if (field.kind === 'tel') return normalizePhone(text) ?? text
  if (field.kind === 'date') return formatDisplayDate(text)
  return text
}

export interface ReviewSection {
  stageId: string
  title: string
  entries: { name: string; label: string; value: string }[]
}

export function reviewSections<T extends Draft>(flow: FlowSpec<T>, draft: T): ReviewSection[] {
  return flow.stages.map(stage => ({
    stageId: stage.id,
    title: stage.title,
    entries: stage.fields
      .filter(field => isVisible(field, draft))
      .map(field => ({ name: field.name, label: field.label, value: displayValue(field, draft[field.name]) })),
  }))
}

/** "Email or phone" helper used by several flows. */
export function eitherContact(groupId: string, emailField: string, phoneField: string) {
  return (draft: Draft): Errors => {
    const email = draft[emailField]
    const phone = draft[phoneField]
    if (isEmpty(email) && isEmpty(phone)) return { [groupId]: 'Give an email address or a phone number so a reply would be possible.' }
    return {}
  }
}

export function createReference(prefix: string, random: (bytes: Uint8Array) => Uint8Array = bytes => crypto.getRandomValues(bytes)) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O or 1/I
  return `${prefix}-${Array.from(random(new Uint8Array(6)), byte => alphabet[byte % alphabet.length]).join('')}`
}
