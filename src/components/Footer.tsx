import { Link } from 'react-router'
import { neighbourhoods } from '../data/neighbourhoods'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <Logo tone="cream" />
          <p>Apartments &amp; stays across Kampala — from a few nights to a longer chapter.</p>
        </div>
        <nav aria-label="Explore">
          <h2 className="site-footer__title">Explore</h2>
          <ul>
            <li><Link to="/apartments">All apartments</Link></li>
            <li><Link to="/extended-stays">Extended stays</Link></li>
            <li><Link to="/saved">Saved stays</Link></li>
            <li><Link to="/compare">Compare</Link></li>
          </ul>
        </nav>
        <nav aria-label="Neighbourhoods">
          <h2 className="site-footer__title">Neighbourhoods</h2>
          <ul>
            {neighbourhoods.map(item => <li key={item.slug}><Link to={`/neighbourhoods/${item.slug}`}>{item.name}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Nook Kampala">
          <h2 className="site-footer__title">Nook</h2>
          <ul>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/privacy">Privacy &amp; demo notice</Link></li>
          </ul>
        </nav>
      </div>
      <div className="container site-footer__base">
        <p>Independent apartment-platform concept. All properties and availability shown are illustrative.</p>
        <p>Photography is AI-generated concept imagery.</p>
      </div>
    </footer>
  )
}
