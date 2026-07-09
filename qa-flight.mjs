import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const BASE = process.env.QA_URL || 'http://127.0.0.1:5173'
const OUT = '.firecrawl/qa-atlas'
await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const browserErrors = []

page.on('console', (message) => {
  if (message.type() === 'error') browserErrors.push(`console: ${message.text()}`)
})
page.on('pageerror', (error) => browserErrors.push(`page: ${error.message}`))

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.locator('.hero').waitFor({ state: 'visible' })
await page.screenshot({ path: `${OUT}/01-hero-desktop.png` })

await page.locator('#atlas').scrollIntoViewIfNeeded()
await page.locator('[data-stage="3"]').click()
await page.getByText('The CRM becomes the source of truth.').waitFor({ state: 'visible' })
await page.screenshot({ path: `${OUT}/02-atlas-desktop.png` })

await page.locator('#wyn').scrollIntoViewIfNeeded()
await page.screenshot({ path: `${OUT}/03-wyn-desktop.png` })

await page.locator('#record').scrollIntoViewIfNeeded()
await page.screenshot({ path: `${OUT}/04-record-desktop.png` })

await page.locator('#diagnostic').scrollIntoViewIfNeeded()
await page.getByLabel('Several disconnected places').check()
await page.getByLabel('It depends or is unknown').check()
await page.getByLabel('Across several systems').check()
await page.getByRole('button', { name: 'Build my starting map' }).click()
await page.getByText('Start with one operational record.').waitFor({ state: 'visible' })
await page.screenshot({ path: `${OUT}/05-diagnostic-desktop.png` })

await page.getByRole('button', { name: 'Book a system review' }).click()
await page.locator('#contact-dialog').waitFor({ state: 'visible' })
await page.screenshot({ path: `${OUT}/06-contact-desktop.png` })
await page.getByRole('button', { name: 'Close contact form' }).click()

await page.setViewportSize({ width: 390, height: 844 })
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.screenshot({ path: `${OUT}/07-hero-mobile.png` })

await page.getByRole('button', { name: 'Menu' }).click()
await page.getByRole('navigation', { name: 'Primary navigation' }).waitFor({ state: 'visible' })
await page.screenshot({ path: `${OUT}/08-menu-mobile.png` })
for (let index = 0; index < 5; index += 1) await page.keyboard.press('Tab')
const focusAfterMenuLoop = await page.evaluate(() => document.activeElement?.className)
if (focusAfterMenuLoop !== 'brand') throw new Error(`Mobile menu focus escaped to ${focusAfterMenuLoop}`)
await page.getByRole('link', { name: 'The system' }).click()
await page.waitForTimeout(100)
const focusAfterMenuNavigation = await page.evaluate(() => document.activeElement?.id)
if (focusAfterMenuNavigation !== 'atlas') throw new Error(`Navigation focus did not move to #atlas: ${focusAfterMenuNavigation}`)

await page.locator('[data-stage="5"]').click()
await page.getByText('A conversation reaches the calendar.').waitFor({ state: 'visible' })
await page.screenshot({ path: `${OUT}/09-atlas-mobile.png` })

await page.locator('#wyn').scrollIntoViewIfNeeded()
await page.screenshot({ path: `${OUT}/10-wyn-mobile.png` })

await page.locator('#record').scrollIntoViewIfNeeded()
await page.screenshot({ path: `${OUT}/11-record-mobile.png` })

await page.locator('#diagnostic').scrollIntoViewIfNeeded()
await page.screenshot({ path: `${OUT}/12-diagnostic-mobile.png` })

await browser.close()

if (browserErrors.length) {
  throw new Error(`Browser errors:\n${browserErrors.join('\n')}`)
}

console.log(`QA complete. Screenshots saved in ${OUT}`)
