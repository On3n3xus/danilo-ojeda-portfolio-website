import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const BASE = process.env.QA_URL || 'http://127.0.0.1:5173'
const OUT = '.firecrawl/qa-atlas'
await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const browserErrors = []
let expectedResourceFailure = false

const captureErrors = (page, label) => {
  page.on('console', (message) => {
    const expectedFailure = expectedResourceFailure && message.text().includes('Failed to load resource')
    if (message.type() === 'error' && !expectedFailure) browserErrors.push(`${label} console: ${message.text()}`)
  })
  page.on('pageerror', (error) => browserErrors.push(`${label} page: ${error.message}`))
}

const waitForReveal = async (page, selector) => {
  const target = page.locator(selector).first()
  await target.scrollIntoViewIfNeeded()
  await target.waitFor({ state: 'visible' })
  await page.waitForFunction((targetSelector) => {
    const element = document.querySelector(targetSelector)
    if (!element) return false
    const style = getComputedStyle(element)
    return (!element.classList.contains('reveal') || element.classList.contains('is-visible'))
      && Number(style.opacity) >= 0.99
  }, selector)
  return target
}

const assertHealthyPage = async (page) => {
  const health = await page.evaluate(() => ({
    hasContent: document.body.innerText.trim().length > 0,
    hasOverlay: Boolean(document.querySelector('.vite-error-overlay, #webpack-dev-server-client-overlay')),
    overflows: document.documentElement.scrollWidth > window.innerWidth + 1,
  }))
  assert.equal(health.hasContent, true, 'Page body is blank')
  assert.equal(health.hasOverlay, false, 'A framework error overlay is visible')
  assert.equal(health.overflows, false, 'Page has horizontal overflow')
}

const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
captureErrors(page, 'primary')

let contactMode = 'success'
await page.route('**/api/contact', async (route) => {
  if (contactMode === 'success') {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
  } else {
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Contact email is temporarily unavailable.' }) })
  }
})

await page.goto(BASE, { waitUntil: 'networkidle' })
await waitForReveal(page, '.hero-copy')
await waitForReveal(page, '.signal-card')
await assertHealthyPage(page)
await page.screenshot({ path: `${OUT}/01-hero-desktop.png` })

await waitForReveal(page, '#atlas-console')
await page.locator('[data-stage="3"]').click()
await page.getByText('The CRM becomes the source of truth.').waitFor({ state: 'visible' })
await page.screenshot({ path: `${OUT}/02-atlas-desktop.png` })

await page.locator('[data-stage="3"]').press('ArrowRight')
await page.getByText('Follow-up starts while intent is fresh.').waitFor({ state: 'visible' })
assert.equal(await page.locator('[data-stage="4"]').getAttribute('aria-selected'), 'true')

await waitForReveal(page, '#wyn')
await page.screenshot({ path: `${OUT}/03-wyn-desktop.png` })
await waitForReveal(page, '.adjacent-builds')

await waitForReveal(page, '.record-intro')
await waitForReveal(page, '.operator-card')
await page.screenshot({ path: `${OUT}/04-record-desktop.png` })

await waitForReveal(page, '.diagnostic-form')
await page.getByLabel('Several disconnected places').check()
await page.getByLabel('It depends or is unknown').check()
await page.getByLabel('Across several systems').check()
await page.getByRole('button', { name: 'Build my starting map' }).click()
await page.getByText('Start with one operational record.').waitFor({ state: 'visible' })
await page.locator('#diagnostic-result').scrollIntoViewIfNeeded()
await page.screenshot({ path: `${OUT}/05-diagnostic-desktop.png` })

await page.getByRole('button', { name: 'Request a system review' }).click()
await page.locator('#contact-dialog').waitFor({ state: 'visible' })
await page.screenshot({ path: `${OUT}/06-contact-desktop.png` })
await page.getByLabel('Name').fill('QA Reviewer')
await page.getByRole('textbox', { name: 'Email', exact: true }).fill('qa@example.com')
await page.getByLabel('Company').fill('QA Company')
await page.getByLabel('What should the system fix first?').fill('Make every inquiry owner and response deadline visible.')
await page.getByRole('button', { name: 'Send the system brief' }).click()
await page.getByText('System brief received. Danilo will reply within one business day.').waitFor({ state: 'visible' })

contactMode = 'failure'
expectedResourceFailure = true
await page.getByLabel('Name').fill('QA Reviewer')
await page.getByRole('textbox', { name: 'Email', exact: true }).fill('qa@example.com')
await page.getByLabel('What should the system fix first?').fill('Verify the visible fallback when delivery is unavailable.')
await page.getByRole('button', { name: 'Send the system brief' }).click()
await page.getByText(/Contact email is temporarily unavailable.*Email danilo@/).waitFor({ state: 'visible' })
expectedResourceFailure = false
await page.getByRole('button', { name: 'Close contact form' }).click()

await page.setViewportSize({ width: 390, height: 844 })
await page.goto(BASE, { waitUntil: 'networkidle' })
await waitForReveal(page, '.hero-copy')
await assertHealthyPage(page)
await page.screenshot({ path: `${OUT}/07-hero-mobile.png` })

await page.getByRole('button', { name: 'Menu' }).click()
await page.waitForFunction(() => {
  const nav = document.querySelector('#primary-nav')
  if (!nav) return false
  const style = getComputedStyle(nav)
  return style.visibility === 'visible' && Number(style.opacity) >= 0.99
})
await page.screenshot({ path: `${OUT}/08-menu-mobile.png` })
for (let index = 0; index < 5; index += 1) await page.keyboard.press('Tab')
const focusAfterMenuLoop = await page.evaluate(() => document.activeElement?.className)
assert.equal(focusAfterMenuLoop, 'brand', `Mobile menu focus escaped to ${focusAfterMenuLoop}`)
await page.getByRole('link', { name: 'The system' }).click()
await page.waitForFunction(() => document.activeElement?.id === 'atlas')

await waitForReveal(page, '#atlas-console')
await page.locator('[data-stage="5"]').click()
await page.getByText('A conversation reaches the calendar.').waitFor({ state: 'visible' })
await page.screenshot({ path: `${OUT}/09-atlas-mobile.png` })

await waitForReveal(page, '#wyn')
await page.screenshot({ path: `${OUT}/10-wyn-mobile.png` })

await waitForReveal(page, '.operator-card')
await page.screenshot({ path: `${OUT}/11-record-mobile.png` })

await waitForReveal(page, '.diagnostic-form')
await page.screenshot({ path: `${OUT}/12-diagnostic-mobile.png` })
await assertHealthyPage(page)

const tabletPage = await browser.newPage({ viewport: { width: 820, height: 1000 } })
captureErrors(tabletPage, 'tablet')
await tabletPage.goto(BASE, { waitUntil: 'networkidle' })
await waitForReveal(tabletPage, '.hero-copy')
await assertHealthyPage(tabletPage)
await tabletPage.getByRole('button', { name: 'Menu' }).click()
await tabletPage.waitForFunction(() => Number(getComputedStyle(document.querySelector('#primary-nav')).opacity) >= 0.99)
await tabletPage.screenshot({ path: `${OUT}/13-menu-tablet.png` })
await tabletPage.close()

const reducedPage = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
captureErrors(reducedPage, 'reduced-motion')
await reducedPage.goto(BASE, { waitUntil: 'networkidle' })
await reducedPage.waitForFunction(() => document.body.dataset.atlasMode === 'static')
const reducedState = await reducedPage.evaluate(() => ({
  sceneHidden: document.querySelector('#atlas-scene')?.hasAttribute('hidden'),
  hiddenReveals: [...document.querySelectorAll('.reveal')].filter((element) => Number(getComputedStyle(element).opacity) < 0.99).length,
}))
assert.equal(reducedState.sceneHidden, true, 'Reduced-motion mode loaded the WebGL scene')
assert.equal(reducedState.hiddenReveals, 0, 'Reduced-motion mode left reveal content hidden')
await assertHealthyPage(reducedPage)
await reducedPage.screenshot({ path: `${OUT}/14-reduced-motion.png` })
await reducedPage.close()

await browser.close()

if (browserErrors.length) {
  throw new Error(`Browser errors:\n${browserErrors.join('\n')}`)
}

console.log(`QA complete. Screenshots saved in ${OUT}`)
