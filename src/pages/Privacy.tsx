import { Link } from 'react-router'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { PageIntro } from '../components/PageIntro'

export default function Privacy() {
  useDocumentTitle('Privacy & demo notice')
  return (
    <>
      <PageIntro eyebrow="Privacy & demo notice" title="What this site actually does.">
        <p>A plain description of the demonstration’s behaviour. It is not a legal privacy policy, and no organisation stands behind it.</p>
      </PageIntro>
      <section className="container prose">
        <h2>Everything is illustrative</h2>
        <p>Nook Kampala is an independent apartment-platform concept. The six properties are fictional, their photographs are AI-generated, and all rates, fees, amenities and availability are illustrative. No real home can be booked or viewed through this site.</p>

        <h2>Forms never leave your browser</h2>
        <p>The booking, extended-stay, viewing and contact forms check what you type and show a summary, but nothing is sent to a server, host, email address or messaging service. No payment details are requested and no payment is taken. References such as “NK-7Q2M4X” are generated in your browser and mean nothing outside it.</p>
        <p>Your answers are held in this tab’s memory while you move between pages. Refreshing or closing the tab clears them. They are never written to cookies, localStorage, sessionStorage or the address bar, and never printed to the browser console.</p>

        <h2>What is stored on your device</h2>
        <p>Only the IDs of homes you save or add to the comparison (for example <code>kasiri</code>), under one versioned key in localStorage, so your shortlist survives a refresh. No names, dates, contact details or search history are stored. If stored data can’t be read it is discarded and replaced with an empty list. You can remove items on the <Link to="/saved">Saved</Link> and <Link to="/compare">Compare</Link> pages, or clear this site’s data in your browser settings.</p>

        <h2>What the address bar can contain</h2>
        <p>Search filters (neighbourhood, stay type, dates, guests, bedrooms, price and amenities), the current form step and demo reservation references. These describe a search, not a person, and are never combined with what you type into forms.</p>

        <h2>Third parties</h2>
        <p>Web fonts are loaded from Google Fonts. There is no analytics, advertising, tracking, maps, chat widget or form service. The site is hosted on Cloudflare Pages, which, like any host, processes standard request data to serve pages.</p>
      </section>
    </>
  )
}
