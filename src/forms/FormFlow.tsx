import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { isVisible, reviewSections, type Draft, type Errors, type FieldSpec, type FlowSpec } from './engine'
import { DONE, REVIEW, useFormFlow, type FlowOptions } from './useFormFlow'
import type { Completion } from './FormsContext'
import { kampalaToday } from '../lib/validation'
import { Icon } from '../components/Icon'

interface FormFlowProps<T extends Draft> extends FlowOptions<T> {
  flow: FlowSpec<T>
  /** Rendered beside every input stage and the review, e.g. a live price summary. */
  aside?: (draft: T, step: string) => ReactNode
  /** Rendered under a stage's fields, e.g. the demo availability calendar. */
  stageExtra?: (draft: T, stageId: string, update: (patch: Partial<T>) => void) => ReactNode
  /** Shown above the review sections, e.g. the selected role. */
  reviewLead?: ReactNode
  /** Links offered after completion besides "Start again". */
  doneLinks?: { label: string; to: string }[]
  /** Label for "Start again" after completion. */
  restartLabel?: string
}

export function FormFlow<T extends Draft>({ flow, aside, stageExtra, reviewLead, doneLinks = [], restartLabel = 'Start a new request', ...options }: FormFlowProps<T>) {
  const form = useFormFlow(flow, options)
  const { draft, step, stageIndex, errors, completion, headingRef } = form
  const labels = Object.fromEntries(flow.stages.flatMap(stage => stage.fields.map(field => [field.name, field.label])).concat((flow.groups ?? []).map(group => [group.id, 'Contact'])))

  if (step === DONE) {
    return completion ? (
      <section className="flow flow--done" aria-labelledby="flow-done-title">
        <p className="eyebrow">Reference {completion.reference}</p>
        <h2 className="flow__title" id="flow-done-title" ref={headingRef} tabIndex={-1}>{flow.done.title}</h2>
        <p className="notice notice--demo"><strong>Demonstration only.</strong> {flow.done.body}</p>
        <Summary sections={completion.sections} meta={completion.meta} />
        <div className="button-row">
          <button type="button" className="button button--primary" onClick={form.reset}>{restartLabel}</button>
          {doneLinks.map(link => <Link key={link.to} to={link.to} className="button button--outline">{link.label}</Link>)}
        </div>
        <p className="fine-print">This preview is held in memory for this visit only and disappears if you refresh.</p>
      </section>
    ) : (
      <section className="flow flow--done" aria-labelledby="flow-done-title">
        <h2 className="flow__title" id="flow-done-title" ref={headingRef} tabIndex={-1}>There’s no preview to show.</h2>
        <p>Previews exist only in memory during a visit, so they disappear after a refresh or when this page is opened from a link. Nothing was sent anywhere.</p>
        <div className="button-row">
          <button type="button" className="button button--primary" onClick={form.reset}>Start the form</button>
          <Link to="/" className="button button--outline">Go to the homepage</Link>
        </div>
      </section>
    )
  }

  const stepIds = [...flow.stages.map(stage => stage.id), REVIEW]
  const currentIndex = stepIds.indexOf(step)

  const side = aside?.(draft, step)
  return (
    <div className={`flow ${side ? 'flow--with-aside' : ''}`}>
      <ol className="steps" aria-label="Progress">
        {stepIds.map((id, index) => {
          const title = id === REVIEW ? 'Review' : flow.stages[index].title
          const state = index === currentIndex ? 'current' : index < currentIndex ? 'done' : 'todo'
          return (
            <li key={id} className={`steps__item is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
              {state === 'done' ? (
                <button type="button" onClick={() => form.goTo(id)}><span className="steps__num"><Icon name="check" size={13} /></span><span className="steps__label">{title}</span><span className="visually-hidden"> (completed — edit)</span></button>
              ) : (
                <span><span className="steps__num">{index + 1}</span><span className="steps__label">{title}</span></span>
              )}
            </li>
          )
        })}
      </ol>

      <div className="flow__body">
      <div className="flow__main">
      {step === REVIEW ? (
        <section aria-labelledby="flow-review-title">
          <h2 className="flow__title" id="flow-review-title" ref={headingRef} tabIndex={-1}>{flow.review.title}</h2>
          <p className="flow__intro">{flow.review.intro}</p>
          {reviewLead}
          <Summary sections={reviewSections(flow, draft)} onEdit={id => form.goTo(id)} />
          <FinalAction label={flow.final.label} note={flow.final.note} onComplete={form.complete} />
          <div className="flow__actions flow__actions--review">
            <button type="button" className="button button--ghost" onClick={form.back}><Icon name="back" size={18} /> Back</button>
            <ClearForm onClear={form.reset} />
          </div>
        </section>
      ) : (
        <form noValidate onSubmit={event => { event.preventDefault(); form.next() }} aria-labelledby="flow-stage-title">
          <div className="flow__head">
            <h2 className="flow__title" id="flow-stage-title" ref={headingRef} tabIndex={-1}>{flow.stages[stageIndex].title}</h2>
            <button type="button" className="button button--small button--outline" onClick={form.useSample}>Use sample details</button>
          </div>
          {flow.stages[stageIndex].intro && <p className="flow__intro">{flow.stages[stageIndex].intro}</p>}
          <ErrorSummary errors={errors} labels={labels} />
          <StageFields flow={flow} stageIndex={stageIndex} draft={draft} errors={errors} update={form.update} />
          {stageExtra?.(draft, flow.stages[stageIndex].id, form.update)}
          <div className="flow__actions">
            {stageIndex > 0
              ? <button type="button" className="button button--ghost" onClick={form.back}><Icon name="back" size={18} /> Back</button>
              : <ClearForm onClear={form.reset} />}
            <button type="submit" className="button button--primary">
              {stageIndex === flow.stages.length - 1 ? 'Review' : 'Continue'} <Icon name="arrow" size={18} />
            </button>
          </div>
          <p className="fine-print">Your answers stay in this browser tab only. They are not saved or sent, and refreshing the page clears them.</p>
        </form>
      )}
      </div>
      {side && <aside className="flow__aside" aria-label="Summary">{side}</aside>}
      </div>
    </div>
  )
}

function StageFields<T extends Draft>({ flow, stageIndex, draft, errors, update }: { flow: FlowSpec<T>; stageIndex: number; draft: T; errors: Errors; update: (patch: Partial<T>) => void }) {
  const stage = flow.stages[stageIndex]
  const visible = stage.fields.filter(field => isVisible(field, draft))
  const groups = (flow.groups ?? []).filter(group => group.fields.some(name => visible.some(field => field.name === name)))
  const grouped = new Set(groups.flatMap(group => group.fields))
  const rendered = new Set<string>()
  const items: ReactNode[] = []

  for (const field of visible) {
    if (grouped.has(field.name)) {
      const group = groups.find(item => item.fields.includes(field.name))!
      if (rendered.has(group.id)) continue
      rendered.add(group.id)
      items.push(
        <fieldset key={group.id} id={group.id} tabIndex={-1} className={`field-group field--wide ${errors[group.id] ? 'is-invalid' : ''}`} aria-describedby={errors[group.id] ? `${group.id}-error` : `${group.id}-hint`}>
          <legend className="field__label">{group.legend}</legend>
          <p className="field__hint" id={`${group.id}-hint`}>{group.hint}</p>
          <div className="form-grid form-grid--nested">
            {group.fields.map(name => {
              const member = visible.find(item => item.name === name)
              return member ? <FieldControl key={name} field={member} draft={draft} error={errors[name]} update={update} /> : null
            })}
          </div>
          {errors[group.id] && <p className="field__error" id={`${group.id}-error`}>{errors[group.id]}</p>}
        </fieldset>,
      )
    } else {
      items.push(<FieldControl key={field.name} field={field} draft={draft} error={errors[field.name]} update={update} />)
    }
  }
  return <div className="form-grid">{items}</div>
}

function FieldControl<T extends Draft>({ field, draft, error, update }: { field: FieldSpec<T>; draft: T; error?: string; update: (patch: Partial<T>) => void }) {
  const id = field.name
  const value = draft[field.name]
  const text = value ?? ''
  const describedBy = [field.hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
  const set = (next: T[keyof T]) => update({ [field.name]: next } as Partial<T>)
  const wide = field.wide || field.kind === 'textarea' || field.kind === 'radio'
  const common = { id, name: id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy }
  const today = kampalaToday()

  if (field.kind === 'radio') {
    return (
      <fieldset id={id} tabIndex={-1} className={`field choice-group field--wide ${error ? 'is-invalid' : ''}`} aria-describedby={describedBy}>
        <legend className="field__label">{field.label}{field.optional && <span className="field__optional"> (optional)</span>}</legend>
        {field.hint && <p className="field__hint" id={`${id}-hint`}>{field.hint}</p>}
        <div className="choice-group__options">
          {field.options!.map(option => (
            <label key={option.value} className={`choice ${text === option.value ? 'is-selected' : ''}`}>
              <input type="radio" name={id} value={option.value} checked={text === option.value} onChange={() => set(option.value as T[keyof T])} />
              <span className="choice__text">
                <span className="choice__label">{option.label}</span>
                {option.description && <span className="choice__description">{option.description}</span>}
              </span>
            </label>
          ))}
        </div>
        {error && <p className="field__error" id={`${id}-error`}>{error}</p>}
      </fieldset>
    )
  }

  let control: ReactNode
  if (field.kind === 'textarea') {
    control = <textarea {...common} className="input input--textarea" rows={field.rows ?? 4} maxLength={field.maxLength} value={text} onChange={event => set(event.target.value as T[keyof T])} />
  } else if (field.kind === 'select' || field.kind === 'time') {
    control = (
      <select {...common} className="input input--select" value={text} onChange={event => set(event.target.value as T[keyof T])}>
        <option value="">Choose…</option>
        {field.options!.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    )
  } else {
    const bounds = field.kind === 'date' ? field.dateBounds?.(today) : undefined
    control = (
      <input
        {...common}
        className="input"
        type={field.kind === 'number' ? 'text' : field.kind}
        inputMode={field.kind === 'number' ? 'numeric' : field.kind === 'tel' ? 'tel' : undefined}
        pattern={field.kind === 'number' ? '[0-9]*' : undefined}
        autoComplete={field.autoComplete ?? 'off'}
        placeholder={field.placeholder}
        min={bounds?.min}
        max={bounds?.max}
        maxLength={field.maxLength}
        value={text}
        onChange={event => set(event.target.value as T[keyof T])}
      />
    )
  }

  return (
    <div className={`field ${wide ? 'field--wide' : ''} ${error ? 'is-invalid' : ''}`}>
      <label className="field__label" htmlFor={id}>{field.label}{field.optional && <span className="field__optional"> (optional)</span>}</label>
      {field.hint && <p className="field__hint" id={`${id}-hint`}>{field.hint}</p>}
      {control}
      {field.maxLength && field.kind === 'textarea' && <p className="field__count" aria-hidden="true">{text.length} / {field.maxLength}</p>}
      {error && <p className="field__error" id={`${id}-error`}>{error}</p>}
    </div>
  )
}

export function Summary({ sections, meta = [], onEdit }: { sections: Completion['sections']; meta?: Completion['meta']; onEdit?: (stageId: string) => void }) {
  return (
    <div className="summary">
      {meta.length > 0 && (
        <dl className="summary__meta">
          {meta.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
        </dl>
      )}
      {sections.map(section => (
        <section key={section.stageId} className="summary__section" aria-labelledby={`summary-${section.stageId}`}>
          <div className="summary__head">
            <h3 id={`summary-${section.stageId}`}>{section.title}</h3>
            {onEdit && (
              <button type="button" className="text-button" onClick={() => onEdit(section.stageId)}>
                <Icon name="edit" size={15} /> Edit<span className="visually-hidden"> {section.title}</span>
              </button>
            )}
          </div>
          <dl className="summary__list">
            {section.entries.map(entry => (
              <div key={entry.name}>
                <dt>{entry.label}</dt>
                <dd className={entry.value === 'Not provided' ? 'is-empty' : undefined}>{entry.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}

function FinalAction({ label, note, onComplete }: { label: string; note: string; onComplete: () => void }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="final-action">
      <button type="button" className="button button--primary button--large" disabled={busy} aria-describedby="final-note" onClick={() => { setBusy(true); onComplete() }}>
        {label}
      </button>
      <p className="final-action__note" id="final-note">{note}</p>
    </div>
  )
}

function ClearForm({ onClear }: { onClear: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (confirming) confirmRef.current?.focus() }, [confirming])
  if (!confirming) return <button type="button" className="text-button" onClick={() => setConfirming(true)}>Clear form</button>
  return (
    <div className="confirm-inline" role="group" aria-label="Confirm clearing the form">
      <span>Clear every answer?</span>
      <button ref={confirmRef} type="button" className="button button--small button--danger" onClick={() => { setConfirming(false); onClear() }}>Yes, clear</button>
      <button type="button" className="button button--small button--ghost" onClick={() => setConfirming(false)}>Keep</button>
    </div>
  )
}

export function ErrorSummary({ errors, labels }: { errors: Errors; labels: Record<string, string> }) {
  const entries = Object.entries(errors)
  if (!entries.length) return null
  return (
    <div className="error-summary" role="alert" aria-labelledby="error-summary-title">
      <h3 className="error-summary__title" id="error-summary-title">Please check {entries.length === 1 ? 'one detail' : `${entries.length} details`}</h3>
      <ul>
        {entries.map(([field, message]) => (
          <li key={field}>
            <a href={`#${field}`} onClick={event => {
              event.preventDefault()
              const target = document.getElementById(field)
              const focusable = target?.matches('fieldset') ? target.querySelector<HTMLElement>('input, select, textarea, button') : target
              focusable?.focus()
              target?.scrollIntoView({ block: 'center' })
            }}>{labels[field] ? `${labels[field]}: ` : ''}{message}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
