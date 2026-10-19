// Compact browser journey check. Run against a preview build:
//   npm run build && npm run preview -- --port 4175   (another terminal)
//   npm run verify          or   VERIFY_URL=https://nook-kampala-concept.pages.dev npm run verify
import { chromium } from 'playwright'

const BASE = (process.env.VERIFY_URL ?? 'http://127.0.0.1:4175').replace(/\/$/, '')
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`) }

const browser = await chromium.launch({ executablePath: CHROME })
const context = await browser.newContext({ viewport: { width: 1280, height: 860 } })
const page = await context.newPage()
const requests = []
const errors = []
page.on('request', request => requests.push({ method: request.method(), url: request.url() }))
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
const go = async path => { await page.goto(BASE + path, { waitUntil: 'networkidle' }) }
const heading = () => page.locator('h1').first().innerText()
// Filters are URL-driven, so a toggle settles once the address changes.
const toggle = async label => { const before = page.url(); await page.locator('.results-filters .check').filter({ hasText: label }).click(); await page.waitForURL(url => url.toString() !== before) }
const resultCount = async expected => page.locator('#results-count strong', { hasText: new RegExp(`^${expected}$`) }).waitFor({ timeout: 5000 }).then(() => true, () => false)
const seesText = async (text, scope = page) => scope.getByText(text).first().waitFor({ timeout: 8000 }).then(() => true, () => false)
const cards = async () => { await page.locator('.card-grid .card, .empty-state').first().waitFor(); return page.locator('.card-grid .card').count() }

try {
  // 1. Hero search → filtered results
  await go('/')
  await page.selectOption('#hero-area', 'kololo')
  await page.selectOption('#hero-guests', '4')
  await page.getByRole('button', { name: 'Search stays' }).click()
  await page.waitForURL(/\/apartments\?/)
  const url = new URL(page.url())
  check('hero search carries area, stay and guests', url.searchParams.get('area') === 'kololo' && url.searchParams.get('stay') === 'short' && url.searchParams.get('guests') === '4')
  check('hero search results', (await cards()) === 1 && (await page.locator('.card-grid .card__title').first().innerText()) === 'Kololo Crest Suites')

  // 2. Amenity filter → correct properties; chip removal and reset
  await go('/apartments')
  await toggle('Pool')
  const poolNames = await page.locator('.card-grid .card__title').allInnerTexts()
  check('pool filter matches guide', poolNames.join('|') === 'Kyanja Heights|Kololo Crest Suites|Muyenga Vista Residences|Naguru Terrace Apartments', poolNames.join(', '))
  await toggle('Parking')
  check('combined filters narrow results', await resultCount(1))
  { const before = page.url(); await page.getByRole('button', { name: /^Pool — remove filter/ }).click(); await page.waitForURL(u => u.toString() !== before) }
  check('removing a chip widens results', await resultCount(3))
  await page.locator('.results-filters').getByLabel('Bedrooms').selectOption('3')
  await toggle('Gym')
  await page.locator('.results-filters').getByLabel('Neighbourhood').selectOption('kisaasi')
  check('empty state offers recovery', await seesText('No stays match all of these filters.'))
  await page.getByRole('button', { name: 'Reset filters' }).click()
  check('reset restores all six', await resultCount(6))

  // 3. Listing → detail → gallery
  await page.getByRole('link', { name: 'Kyanja Heights' }).click()
  await page.waitForURL(/kyanja-heights/)
  await page.locator('h1', { hasText: 'Kyanja Heights' }).waitFor()
  await page.waitForFunction(() => document.title.includes('Kyanja Heights'))
  check('detail page title', (await heading()) === 'Kyanja Heights' && (await page.title()).includes('Kyanja Heights'))
  const opener = page.getByRole('button', { name: /Open photo 3 of 6/ })
  await opener.click()
  const dialog = page.getByRole('dialog', { name: /gallery/ })
  check('lightbox opens at chosen photo', (await dialog.locator('.lightbox__count').innerText()) === '3 / 6')
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight')
  check('arrow keys page and wrap', (await dialog.locator('.lightbox__count').innerText()) === '6 / 6' && (await dialog.locator('figcaption').innerText()).includes('Shared resident pool'))
  await page.keyboard.press('Escape')
  check('escape closes and restores focus', (await dialog.count()) === 0 && await opener.evaluate(el => el === document.activeElement))

  // 4. Save → saved page → refresh
  await page.locator('.detail__head-actions').getByRole('button', { name: 'Save' }).click()
  await go('/apartments')
  await page.getByRole('button', { name: 'Save Naguru Terrace Apartments' }).click()
  await page.getByRole('link', { name: /Saved stays, 2 saved/ }).click()
  await page.locator('h1', { hasText: '2 saved stays' }).waitFor()
  check('saved page lists both', (await page.locator('.saved-item').count()) === 2)
  await page.reload({ waitUntil: 'networkidle' })
  check('saved survives refresh', (await page.locator('.saved-item').count()) === 2)
  await page.getByRole('button', { name: 'Remove Kyanja Heights' }).click()
  check('remove a saved stay', (await page.locator('.saved-item').count()) === 1)
  const stored = await page.evaluate(() => Object.entries(localStorage))
  check('storage holds only versioned IDs', stored.length === 1 && /^\{"version":1,"saved":\["naguru"\],"compare":\[\]\}$/.test(stored[0][1]), JSON.stringify(stored))

  // 5. Compare three, a fourth is refused, remove one
  await go('/apartments')
  for (const name of ['Kasiri Residences', 'Kololo Crest Suites', 'Muyenga Vista Residences']) await page.getByRole('button', { name: new RegExp(`^Compare ${name}`) }).click()
  await page.getByRole('button', { name: /^Compare Naguru Terrace/ }).click()
  check('fourth comparison refused with feedback', (await page.locator('.toast').innerText()).includes('up to 3'))
  await page.getByRole('link', { name: 'View comparison' }).click()
  await page.locator('.compare__table').waitFor()
  check('compare shows three', (await page.locator('.compare__table thead th').count()) === 3)
  check('nightly mode labels monthly-only home', await page.getByText('Nightly stays not offered').isVisible())
  await page.getByRole('button', { name: 'Remove Kololo Crest Suites' }).click()
  check('remove from comparison', (await page.locator('.compare__table thead th').count()) === 2)

  // 6–8. Booking: invalid → corrected → sample → review → edit dates → confirmation
  await go('/book/kasiri-residences')
  await page.getByRole('button', { name: 'Continue' }).click()
  check('empty stay step shows error summary', await page.locator('.error-summary').isVisible())
  await page.getByRole('button', { name: 'Use sample details' }).click()
  await page.locator('#children').selectOption('1')
  await page.getByRole('button', { name: 'Continue' }).click()
  check('capacity error shown', (await page.locator('#children-error').innerText()).includes('up to 2 guests'))
  await page.locator('#children').selectOption('0')
  const totalBefore = await page.locator('.price-lines__total dd').innerText()
  check('running total visible on stay step', totalBefore === 'UGX 535,000', totalBefore)
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Review' }).click()
  check('review step reached', (await page.locator('#flow-review-title').innerText()).includes('Review'))
  await page.getByRole('button', { name: /Edit Stay details/ }).click()
  const checkIn = await page.locator('#checkIn').inputValue()
  const later = new Date(`${checkIn}T00:00:00Z`); later.setUTCDate(later.getUTCDate() + 4)
  let out = later.toISOString().slice(0, 10)
  await page.locator('#checkOut').fill(out)
  await page.getByRole('button', { name: 'Continue' }).click()
  if (await page.locator('.error-summary').count()) {
    // The 4th night hit a demo blackout: fall back to a 1-night stay, still a change.
    later.setUTCDate(later.getUTCDate() - 3); out = later.toISOString().slice(0, 10)
    await page.locator('#checkOut').fill(out)
    await page.getByRole('button', { name: 'Continue' }).click()
  }
  const totalAfter = await page.locator('.price-lines__total dd').innerText()
  check('editing dates updates the total', totalAfter !== totalBefore, `${totalBefore} → ${totalAfter}`)
  await page.getByRole('button', { name: 'Review' }).click()
  const final = page.getByRole('button', { name: 'Complete demo reservation' })
  check('final note beside action', (await page.locator('#final-note').innerText()) === 'Demonstration only. No payment is collected and no reservation is sent.')
  await final.dblclick()
  await page.waitForURL(/\/booking-demo\/NK-/)
  check('demo confirmation', (await seesText('Your demo reservation is ready.')) && (await page.locator('.price-lines__total dd').innerText()) === totalAfter)
  await page.goBack({ waitUntil: 'networkidle' })
  check('back from confirmation does not show a filled review', !(await page.getByRole('button', { name: 'Complete demo reservation' }).isVisible().catch(() => false)))
  await page.goForward({ waitUntil: 'networkidle' })
  await page.reload({ waitUntil: 'networkidle' })
  check('refreshed confirmation falls back', await seesText('There’s no summary to show here.'))

  // 9–11. Extended stay, viewing, contact
  for (const [path, button, title] of [
    ['/extended-stays', 'Complete demo enquiry', 'Your demo enquiry is ready.'],
    ['/viewing/muyenga-vista-residences', 'Complete demo viewing request', 'Your demo viewing request is ready.'],
    ['/contact', 'Complete demo message', 'Your demo message is ready.'],
  ]) {
    await go(path)
    await page.getByRole('button', { name: 'Use sample details' }).first().click()
    for (let step = 0; step < 4 && !(await page.getByRole('button', { name: button }).count()); step++) {
      const next = page.locator('.flow__actions button[type="submit"]')
      if (await page.locator('.flow__head button').count()) await page.locator('.flow__head button').click()
      await next.click()
      await page.waitForTimeout(150)
    }
    await page.getByRole('button', { name: button }).click()
    check(`${path} completes`, await seesText(title))
  }

  // 12. Direct links, unknown property, not found
  await go('/apartments/not-a-home')
  check('unknown property', await seesText('We couldn’t find that apartment.'))
  await go('/book/muyenga-vista-residences')
  check('monthly-only home explains no nightly booking', await seesText('Nightly stays aren’t offered here.'))
  await go('/no-such-page')
  check('not found', await seesText('This page isn’t here.'))
  await go('/neighbourhoods/kololo')
  check('neighbourhood direct load', await page.locator('h1', { hasText: /^Kololo$/ }).waitFor({ timeout: 8000 }).then(() => true, () => false))

  // 13. Keyboard menu at phone width; reduced motion
  await page.setViewportSize({ width: 390, height: 800 })
  await go('/about')
  await page.getByRole('button', { name: 'Open menu' }).click()
  check('mobile menu focuses first link', await page.evaluate(() => document.activeElement?.textContent === 'Home'))
  await page.keyboard.press('Escape')
  check('escape closes menu and restores focus', await page.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Open menu'))
  const reduced = await browser.newPage({ reducedMotion: 'reduce' })
  await reduced.goto(BASE + '/', { waitUntil: 'networkidle' })
  check('reduced motion: hero visible at once', await reduced.evaluate(() => !document.documentElement.classList.contains('hero-pending') && !document.querySelector('.scenes--pinned') && getComputedStyle(document.querySelector('[data-hero="line"]')).transform === 'none'))
  await reduced.close()

  // 14. No trigger accumulation after navigation and resizing
  await page.setViewportSize({ width: 1280, height: 860 })
  for (let i = 0; i < 3; i++) {
    await go('/')
    await page.getByRole('link', { name: 'Explore apartments' }).first().click()
    await page.waitForURL(/apartments/)
    await page.goBack({ waitUntil: 'networkidle' })
  }
  for (const width of [800, 1280, 900, 1300]) { await page.setViewportSize({ width, height: 860 }); await page.waitForTimeout(250) }
  await page.waitForTimeout(400)
  check('one pin spacer after repeated navigation and resizing', (await page.locator('.pin-spacer').count()) === 1)

  // Overflow across widths
  const overflow = []
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 860 })
    for (const path of ['/', '/apartments', '/apartments/naguru-terrace-apartments', '/book/naguru-terrace-apartments', '/compare']) {
      await go(path)
      const extra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      if (extra > 0) overflow.push(`${path}@${width}:${extra}`)
    }
  }
  check('no horizontal overflow at 360–1440', overflow.length === 0, overflow.join(', '))

  // 15. Nothing submitted anywhere
  const origin = new URL(BASE).origin
  const nonGet = requests.filter(request => request.method !== 'GET')
  const thirdParty = requests.filter(request => !request.url.startsWith(origin) && !/fonts\.(googleapis|gstatic)\.com/.test(request.url) && !request.url.startsWith('data:'))
  const personal = requests.filter(request => /amani|example\.com|0772/i.test(decodeURIComponent(request.url)))
  check('no non-GET requests', nonGet.length === 0, nonGet.map(request => request.url).join(', '))
  check('no third-party requests beyond fonts', thirdParty.length === 0, [...new Set(thirdParty.map(request => new URL(request.url).host))].join(', '))
  check('no personal data in any URL', personal.length === 0)
  check('no console or page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
} catch (error) {
  check('journey ran to completion', false, error.message.split('\n')[0])
} finally {
  await browser.close()
}

const failed = results.filter(result => !result.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
