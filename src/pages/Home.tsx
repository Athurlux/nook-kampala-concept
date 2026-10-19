import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { neighbourhoods } from '../data/neighbourhoods'
import { amenityFor, offersNightly, properties, propertyById, type AmenityKey, type Property } from '../data/properties'
import { formatUGX } from '../lib/stay'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { Faq } from '../components/Faq'
import { Icon } from '../components/Icon'
import { PropertyImg } from '../components/Img'
import { PropertyCard } from '../components/PropertyCard'
import { HeroSearch } from '../home/HeroSearch'
import { useHomeMotion } from '../home/useHomeMotion'

const FEATURED = ['kyanja', 'kasiri', 'kololo'].map(id => propertyById(id)!)
const rateFor = (property: Property) => (offersNightly(property) ? { amount: property.nightlyRate!, unit: 'night' as const } : { amount: property.monthlyGuide, unit: 'month' as const })

interface Scene {
  key: AmenityKey
  title: string
  body: string
  /** The photograph shown, always from the home it belongs to. */
  property: Property
  room: 'pool' | 'gym' | 'living'
  caption: string
}

const SCENES: Scene[] = [
  {
    key: 'pool', title: 'Pools, shared and unhurried',
    body: 'Three homes share a pool with other residents. None is private to one apartment.',
    property: propertyById('kyanja')!, room: 'pool', caption: 'Kyanja Heights, shared courtyard pool',
  },
  {
    key: 'gym', title: 'A gym downstairs',
    body: 'Residents’ gyms keep a routine going on longer stays — shared, and labelled that way.',
    property: propertyById('bukoto')!, room: 'gym', caption: 'Bukoto Grove Apartments, shared residents’ gym',
  },
  {
    key: 'workspace', title: 'Room to work',
    body: 'A desk in the apartment or a coworking lounge in the building, for stays that are partly work.',
    property: propertyById('kasiri')!, room: 'living', caption: 'Kasiri Residences, living room. Its workspace is part of the concept but not separately pictured',
  },
]

const FAQ = [
  { question: 'Can I really book these apartments?', answer: <p>No. Nook Kampala is an independent concept and all six homes are fictional. The booking journey is complete, but it ends with a local demo confirmation: nothing is reserved, charged or sent.</p> },
  { question: 'How are prices worked out?', answer: <p>A short stay is the illustrative nightly rate × the number of nights, plus a one-off cleaning fee. Both appear from the first step. Longer stays show an illustrative monthly guide rate. No taxes, deposits or discounts are modelled.</p> },
  { question: 'Why are some dates unavailable?', answer: <p>Each home uses a fixed demo calendar where two nights in every thirteen are shown as taken. It lets the journey show what happens with unavailable dates; it isn’t live inventory.</p> },
  { question: 'Are the pools and gyms private?', answer: <p>No — every pool and gym in the collection is a shared resident facility. Where an amenity is part of the concept but not photographed, the property page says “not pictured”.</p> },
  { question: 'What happens to the details I enter?', answer: <p>They stay in this browser tab’s memory and disappear when you refresh. Only the IDs of homes you save or compare are kept on your device. <Link to="/privacy">Read the demo notice</Link>.</p> },
]

export default function Home() {
  useDocumentTitle(null)
  const root = useRef<HTMLDivElement>(null)
  useHomeMotion(root)
  const [activeHood, setActiveHood] = useState(neighbourhoods[3].slug)
  const hood = neighbourhoods.find(item => item.slug === activeHood)!
  const hoodImage = propertyById(hood.coverPropertyId)!.gallery[0]

  return (
    <div ref={root} className="home">
      {/* ---- Hero ------------------------------------------------------------ */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero__grid">
          <div className="hero__text">
            <p className="eyebrow" data-hero="eyebrow">Apartments &amp; stays across Kampala</p>
            <h1 className="hero__title" id="hero-title">
              <span className="hero__line"><span data-hero="line">Find your place</span></span>
              <span className="hero__line"><span data-hero="line">in <em>Kampala.</em></span></span>
            </h1>
            <p className="hero__lede" data-hero="lede">From a few nights to a longer chapter, discover spaces that feel right.</p>
          </div>

          <div className="hero__media">
            <div className="hero__frame">
              <picture>
                <source media="(min-width: 900px)" srcSet="/images/hero-desktop-960.webp 960w, /images/hero-desktop-1356.webp 1356w" sizes="56vw" />
                <img
                  src="/images/hero-mobile-480.webp"
                  srcSet="/images/hero-mobile-480.webp 480w, /images/hero-mobile-820.webp 820w"
                  sizes="100vw"
                  width={820}
                  height={1030}
                  alt="A sunlit limestone living room with cream sofas, a rust armchair and glass doors open to a terrace and tropical greenery"
                  fetchPriority="high"
                  data-hero="photo"
                />
              </picture>
              <span className="hero__mask" data-hero="mask" aria-hidden="true" />
            </div>
            <p className="hero__caption">Concept interior · AI-generated</p>
          </div>

          <div className="hero__search" id="find" tabIndex={-1} data-hero="search">
            <HeroSearch />
          </div>
          <a href="#collection" className="hero__explore" data-hero="explore">
            <span>Explore the collection</span> <Icon name="chevron" size={16} />
          </a>
        </div>
      </section>

      {/* ---- Featured -------------------------------------------------------- */}
      <section className="featured" id="collection" aria-labelledby="featured-title" tabIndex={-1}>
        <div className="container">
          <div className="section-head" data-anim="reveal">
            <p className="eyebrow">The collection</p>
            <h2 className="display" id="featured-title">Six homes, each with its own character.</h2>
            <p className="section-head__lede">From a compact one-bedroom in Kisaasi to a serviced suite in Kololo. A few to begin with:</p>
          </div>
          <div className="featured__grid">
            {FEATURED.map(property => <PropertyCard key={property.id} property={property} rate={rateFor(property)} />)}
          </div>
          <div className="featured__more" data-anim="reveal">
            <Link to="/apartments" className="button button--outline">See all six apartments <Icon name="arrow" size={18} /></Link>
          </div>
        </div>
      </section>

      {/* ---- Interiors → amenities (desktop: one short pinned moment) ---------- */}
      <section className="scenes" aria-labelledby="scenes-title" data-anim="scenes">
        <div className="container scenes__intro" data-anim="reveal">
          <p className="eyebrow">Beyond the four walls</p>
          <h2 className="display" id="scenes-title">Pools, gyms and places to work.</h2>
        </div>
        <div className="scenes__stage">
          {SCENES.map((scene, index) => {
            const homes = properties.filter(property => amenityFor(property, scene.key))
            const image = scene.property.gallery.find(item => item.room === scene.room)!
            return (
              <article key={scene.key} className="scene" data-scene={index}>
                <figure className="scene__media">
                  <div className="scene__curtain" data-scene-curtain>
                    <PropertyImg image={image} sizes="(min-width: 1024px) 58vw, 100vw" alt={image.alt} data-scene-image />
                  </div>
                  <figcaption>{scene.caption}. AI-generated concept image.</figcaption>
                </figure>
                <div className="scene__text" data-scene-text>
                  <p className="scene__count">0{index + 1} / 0{SCENES.length}</p>
                  <h3 className="scene__title">{scene.title}</h3>
                  <p>{scene.body}</p>
                  <ul className="scene__homes">
                    {homes.map(property => {
                      const amenity = amenityFor(property, scene.key)!
                      const kind = amenity.label !== 'Workspace' && scene.key === 'workspace' ? amenity.label.toLowerCase() : amenity.scope === 'shared' ? 'shared' : 'in the apartment'
                      return <li key={property.id}><Link to={`/apartments/${property.slug}`}>{property.name}</Link> <span>{kind}{amenity.pictured ? '' : ', not pictured'}</span></li>
                    })}
                  </ul>
                  <p className="scene__caption">Photo: {scene.caption}. AI-generated concept image.</p>
                  <Link to={`/apartments?amenities=${scene.key}`} className="text-link">Stays with {scene.key === 'workspace' ? 'a workspace' : `a ${scene.key}`} <Icon name="arrow" size={16} /></Link>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* ---- Neighbourhoods -------------------------------------------------- */}
      <section className="hoods" aria-labelledby="hoods-title">
        <div className="container hoods__grid">
          <div className="hoods__list" data-anim="reveal">
            <p className="eyebrow">Neighbourhoods</p>
            <h2 className="display" id="hoods-title">Six corners of the city.</h2>
            <ul>
              {neighbourhoods.map(item => (
                <li key={item.slug}>
                  <Link
                    to={`/neighbourhoods/${item.slug}`}
                    className={`hoods__link ${item.slug === activeHood ? 'is-active' : ''}`}
                    onMouseEnter={() => setActiveHood(item.slug)}
                    onFocus={() => setActiveHood(item.slug)}
                  >
                    <span className="hoods__name">{item.name}</span>
                    <span className="hoods__summary">{item.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <figure className="hoods__media" aria-hidden="true">
            <PropertyImg key={hoodImage.name} image={hoodImage} sizes="(min-width: 900px) 42vw, 0px" alt="" className="hoods__image" />
            <figcaption>{propertyById(hood.coverPropertyId)!.name} · concept image</figcaption>
          </figure>
        </div>
      </section>

      {/* ---- Extended stays -------------------------------------------------- */}
      <section className="extended-band" aria-labelledby="extended-title">
        <div className="container extended-band__grid">
          <div className="extended-band__media" data-anim="reveal">
            <PropertyImg image={propertyById('bukoto')!.gallery[1]} sizes="(min-width: 900px) 45vw, 100vw" alt={propertyById('bukoto')!.gallery[1].alt} />
          </div>
          <div className="extended-band__text" data-anim="reveal">
            <p className="eyebrow">Extended stays</p>
            <h2 className="display" id="extended-title">Staying for a season, or longer?</h2>
            <p>Every home offers stays of a month or more at an illustrative monthly guide rate. Skip the nightly calendar: send an enquiry or ask to view.</p>
            <ul className="extended-band__rates">
              {['bukoto', 'naguru', 'muyenga'].map(id => {
                const property = propertyById(id)!
                return <li key={id}><span>{property.name}</span><span>{formatUGX(property.monthlyGuide)} / month guide</span></li>
              })}
            </ul>
            <div className="button-row">
              <Link to="/extended-stays" className="button button--light">Plan an extended stay</Link>
              <Link to="/apartments?stay=long" className="button button--ghost-light">Long-term homes</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---- How the demo works -------------------------------------------- */}
      <section className="journey container" aria-labelledby="journey-title">
        <div className="section-head" data-anim="reveal">
          <p className="eyebrow">How the demo booking works</p>
          <h2 className="display" id="journey-title">Four honest steps.</h2>
        </div>
        <ol className="journey__steps">
          {[
            { title: 'Stay details', body: 'Dates on a fixed demo calendar, guests within each home’s capacity, and a running total from the start.' },
            { title: 'Guest details', body: 'Name and contact — or one tap on “Use sample details”. No ID documents or card numbers, ever.' },
            { title: 'Review', body: 'Every answer and every fee on one screen, each section with its own edit link.' },
            { title: 'Demo confirmation', body: 'A local reference and printable summary. Nothing is reserved, charged or sent.' },
          ].map((step, index) => (
            <li key={step.title} className="journey__step" data-anim="reveal">
              <span className="journey__num">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- FAQ ------------------------------------------------------------ */}
      <section className="container faq-section" aria-labelledby="faq-title">
        <div className="section-head" data-anim="reveal">
          <p className="eyebrow">Questions</p>
          <h2 className="display" id="faq-title">Good to know.</h2>
        </div>
        <Faq items={FAQ} />
      </section>

      {/* ---- Closing CTA --------------------------------------------------- */}
      <section className="closing" aria-labelledby="closing-title">
        <div className="container closing__inner" data-anim="reveal">
          <h2 className="closing__title" id="closing-title">A few nights or a longer chapter — start with a shortlist.</h2>
          <div className="button-row">
            <Link to="/apartments" className="button button--primary button--large">Explore apartments</Link>
            <Link to="/neighbourhoods" className="button button--outline button--large">Browse neighbourhoods</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
