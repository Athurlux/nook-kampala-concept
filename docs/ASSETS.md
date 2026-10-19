# Assets and amenity notes

All imagery comes from the Nook Kampala asset collection (`assets-src/original`, with its `README.md`,
`asset-manifest.json` and `property-guide.json`). It is **AI-generated concept art**: the buildings,
rooms and views are fictional, not measured plans, and not evidence of any real place or outlook.

## Originals and derivatives

`assets-src/original/` keeps all 42 supplied images unmodified. `npm run images`
(`scripts/optimize-images.py`, Python 3 + Pillow) writes the derivatives committed to `public/`.

| Use | Source | Output | Treatment |
| --- | --- | --- | --- |
| Desktop hero | `heroes/nook-desktop-hero.webp` | `hero-desktop-960/1356.webp` | Cropped from x = 180 to drop the plant edge; served in an arched frame beside live HTML type |
| Mobile hero | `heroes/nook-mobile-hero.webp` | `hero-mobile-480/820.webp` | Cropped from y = 250 to drop empty wall; `<picture>` means a device loads one hero only |
| Property galleries | `properties/<id>/<room>.webp` (36 files) | `<id>-<room>-480/800/1280.webp` | Resized; cards use 480/800, the lightbox 1280. Lazy-loaded except the first visible images |
| Social preview | desktop hero + drawn type | `public/og-image.jpg` (1200×630) | Labelled “Independent concept · all properties and prices are illustrative” |
| App icon | symbol geometry | `public/apple-touch-icon.png` | Drawn from the same path as the SVG |

Not used on the site: the flattened `social/nook-campaign-cover.webp` (a poster, not a hero) and the
three branding PNGs (rebuilt as vector, below).

## Logo and favicon

The symbol — a slab whose roof rises to the right and rounds into the shoulder of a lowercase “n”,
opened by an arch — is redrawn as a single SVG path in `src/components/Logo.tsx` and
`public/favicon.svg`. No raster is embedded. The “nook / KAMPALA” wordmark is live text in Instrument
Serif and Manrope. Name, domain and trademark availability have not been checked.

## Amenity allocation

`property-guide.json` is the source of truth. Each gallery stays with its own property; no pool or gym
photo is ever shown for a home it does not belong to. Pools and gyms are always labelled **shared**
resident facilities.

| Property | Pictured extra amenity | In the guide but not pictured |
| --- | --- | --- |
| Kasiri Residences, Kisaasi | — | Workspace (desk), Wi-Fi |
| Bukoto Grove Apartments, Bukoto | Shared gym | Laundry facilities, lift, Wi-Fi |
| Kyanja Heights, Kyanja | Shared pool | Shared gym, rooftop lounge, air conditioning, backup power |
| Kololo Crest Suites, Kololo | Shared pool and gym | Housekeeping, concierge, air conditioning |
| Muyenga Vista Residences, Muyenga | Shared garden pool, gardens | Children’s play area |
| Naguru Terrace Apartments, Naguru | Shared gym | Shared pool, coworking lounge, lift, backup power |

Property pages mark every amenity as “Pictured” or “Not pictured”. The homepage workspace scene uses
Kasiri’s living-room photo and its caption says the workspace itself isn’t separately pictured. The
“Workspace” filter matches an in-apartment desk (Kasiri) or a shared coworking lounge (Naguru), and says so.
Nothing implies accessibility, safety certification, Wi-Fi speed or service standards.

## Concept data added for the demo

Bedroom and bathroom counts, capacities, stay types, nightly and monthly guide rates, cleaning fees,
minimum stays, house rules, check-in times and the demo blackout pattern are all invented for the
demonstration and labelled illustrative. The photographs do not establish them.

## Licence

The artwork and identity are **not** covered by any open-source licence and may not be reused outside
this portfolio concept.
