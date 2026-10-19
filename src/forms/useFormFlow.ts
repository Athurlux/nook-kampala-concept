import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  createReference, firstIncompleteIndex, pruneHidden, reviewSections, validateStage, type Draft, type Errors, type FlowSpec,
} from './engine'
import { useForms, type Completion } from './FormsContext'
import { kampalaToday } from '../lib/validation'

export const REVIEW = 'review'
export const DONE = 'done'

/** Resolves which step a visitor may see; a direct link cannot skip validation. */
export function resolveStep<T extends Draft>(flow: FlowSpec<T>, draft: T, requested: string | null, now = new Date()) {
  const ids = [...flow.stages.map(stage => stage.id), REVIEW]
  if (requested === DONE) return DONE
  const allowed = firstIncompleteIndex(flow, draft, now)
  const index = Math.max(0, ids.indexOf(requested ?? ids[0]))
  return ids[Math.min(index, allowed)]
}

export interface FlowOptions<T extends Draft> {
  instanceKey?: string
  referencePrefix: string
  meta?: Completion['meta']
  /** Extra completion data derived from the final draft, e.g. a price quote. */
  extra?: (draft: T) => Partial<Completion>
  /** When set, completion navigates to this route instead of the in-page done step. */
  doneRoute?: (reference: string) => string
}

export function useFormFlow<T extends Draft>(flow: FlowSpec<T>, options: FlowOptions<T>) {
  const key = options.instanceKey ?? flow.key
  const { drafts, completions, setDraft, setCompletion } = useForms()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const draft = (drafts[key] as T | undefined) ?? flow.empty()
  const completion = completions[key] ?? null
  const requested = params.get('step')
  const step = resolveStep(flow, draft, requested)
  const stageIndex = flow.stages.findIndex(stage => stage.id === step)
  const [errors, setErrors] = useState<Errors>({})
  const [attempted, setAttempted] = useState<Record<string, boolean>>({})
  const completing = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Keep the URL honest when a later step was requested before earlier ones are valid.
  useEffect(() => {
    if (step === DONE) completing.current = false
    if (completing.current) return // the draft was just cleared; the navigation to DONE is pending
    if (requested && requested !== step) setParams(current => { const next = new URLSearchParams(current); next.set('step', step); return next }, { replace: true })
  }, [requested, step, setParams])

  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    setErrors({})
    // Scroll to the step heading rather than the page top: some flows sit part-way down a page.
    headingRef.current?.focus({ preventScroll: true })
    headingRef.current?.scrollIntoView({ block: 'start' })
  }, [step])

  const goTo = useCallback((id: string, replace = false) => {
    setParams(current => { const next = new URLSearchParams(current); next.set('step', id); return next }, { replace })
  }, [setParams])

  const update = (patch: Partial<T>) => {
    const next = { ...draft, ...patch } as T
    setDraft(key, next)
    const stage = flow.stages[stageIndex]
    if (stage && attempted[stage.id]) setErrors(validateStage(stage, next))
  }

  const focusFirstError = (found: Errors) => {
    const first = Object.keys(found)[0]
    requestAnimationFrame(() => {
      const target = document.getElementById(first)
      const focusable = target?.matches('fieldset') ? target.querySelector<HTMLElement>('input, select, textarea, button') : target
      focusable?.focus()
      target?.scrollIntoView({ block: 'center' })
    })
  }

  const next = () => {
    const stage = flow.stages[stageIndex]
    if (!stage) return
    const found = validateStage(stage, draft)
    setAttempted(value => ({ ...value, [stage.id]: true }))
    setErrors(found)
    if (Object.keys(found).length) return focusFirstError(found)
    goTo(flow.stages[stageIndex + 1]?.id ?? REVIEW)
  }

  const back = () => {
    if (step === REVIEW) return goTo(flow.stages[flow.stages.length - 1].id)
    if (stageIndex > 0) goTo(flow.stages[stageIndex - 1].id)
  }

  const useSample = () => {
    setDraft(key, { ...draft, ...flow.sample(kampalaToday()) } as T)
    setErrors({})
  }

  const complete = () => {
    if (completing.current) return
    if (firstIncompleteIndex(flow, draft) < flow.stages.length) return goTo(flow.stages[firstIncompleteIndex(flow, draft)].id)
    completing.current = true
    const reference = createReference(options.referencePrefix)
    setCompletion(key, {
      reference,
      createdAt: new Date().toISOString(),
      sections: reviewSections(flow, pruneHidden(flow, draft)),
      meta: options.meta ?? [],
      ...options.extra?.(draft),
    })
    // The draft is cleared once its summary exists, so personal details are not
    // kept in two places and Back cannot resubmit the same answers.
    setDraft(key, null)
    // Replace the review entry, so Back from the confirmation cannot resubmit.
    if (options.doneRoute) navigate(options.doneRoute(reference), { replace: true })
    else goTo(DONE, true)
  }

  const reset = () => {
    setDraft(key, null)
    setCompletion(key, null)
    setErrors({})
    setAttempted({})
    goTo(flow.stages[0].id, true)
  }

  return { key, draft, step, stageIndex, errors, completion, headingRef, update, next, back, goTo, useSample, complete, reset }
}
