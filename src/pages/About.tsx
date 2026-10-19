import { Link } from 'react-router'
import { propertyById } from '../data/properties'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { PropertyImg } from '../components/Img'
import { PageIntro } from '../components/PageIntro'

const PRINCIPLES = [
  { title: 'Thoughtful discovery', body: 'A small, considered collection rather than an endless feed. Every home has its own photographs, its own amenities and a plain description of what it is for.' },
  { title: 'Short and longer stays', body: 'Nightly booking where it suits, and enquiries and viewing requests where it doesn’t. A family relocating shouldn’t have to pretend to book a weekend.' },
  { title: 'Clear comparison', body: 'Rates are shown in one unit at a time, fees appear from the first screen, and shared facilities are labelled as shared.' },
  { title: 'Spaces for different needs', body: 'A compact base, a place to work, room for a family, a serviced suite — the collection is arranged around how people actually stay.' },
]

export default function About() {
  useDocumentTitle('About')
  const kololo = propertyById('kololo')!
  return (
    <>
      <PageIntro eyebrow="About Nook" title="A calmer way to find a place to stay.">
        <p>Nook Kampala is an independent portfolio concept for an apartment platform. It shows how discovery, comparison, booking and enquiries could feel when they are honest and unhurried.</p>
      </PageIntro>
      <section className="container about-feature">
        <figure>
          <PropertyImg image={kololo.gallery[1]} sizes="(min-width: 900px) 60vw, 100vw" alt={kololo.gallery[1].alt} />
          <figcaption>Kololo Crest Suites, living room. AI-generated concept image.</figcaption>
        </figure>
      </section>
      <section className="container principles" aria-label="What Nook stands for">
        {PRINCIPLES.map(principle => (
          <div key={principle.title} className="principle">
            <h2 className="principle__title">{principle.title}</h2>
            <p>{principle.body}</p>
          </div>
        ))}
      </section>
      <section className="container about-boundary" aria-labelledby="boundary-title">
        <h2 id="boundary-title" className="section-title">What this concept is not</h2>
        <p>Nook has no company history, staff, awards, partners or guest numbers to report, and this site invents none. The six homes are fictional, their photographs are AI-generated, and every rate, fee and availability date is illustrative. No booking, payment, message or viewing request leaves your browser.</p>
        <div className="button-row">
          <Link to="/apartments" className="button button--primary">Explore the collection</Link>
          <Link to="/privacy" className="button button--outline">Privacy &amp; demo notice</Link>
        </div>
      </section>
    </>
  )
}
