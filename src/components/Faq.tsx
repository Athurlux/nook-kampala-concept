import type { ReactNode } from 'react'

export interface FaqItem {
  question: string
  answer: ReactNode
}

/** Native details/summary: keyboard support and expanded state come from the browser. */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="faq">
      {items.map(item => (
        <details key={item.question} className="faq__item">
          <summary className="faq__question">
            <span>{item.question}</span>
            <span className="faq__icon" aria-hidden="true" />
          </summary>
          <div className="faq__answer">{item.answer}</div>
        </details>
      ))}
    </div>
  )
}
