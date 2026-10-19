import type { ReactNode } from 'react'

export function PageIntro({ eyebrow, title, children, id = 'page-title' }: { eyebrow?: string; title: ReactNode; children?: ReactNode; id?: string }) {
  return (
    <header className="page-intro container">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="page-intro__title" id={id}>{title}</h1>
      {children && <div className="page-intro__lede">{children}</div>}
    </header>
  )
}
