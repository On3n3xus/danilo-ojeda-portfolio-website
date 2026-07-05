import { chromium } from 'playwright'

const BASE = process.env.QA_URL || 'http://localhost:5173'
const OUT = '.firecrawl/qa'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text()) })
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message))

await page.goto(BASE)
await page.waitForSelector('#loader.ready', { timeout: 20000 })
await page.screenshot({ path: `${OUT}/00-loader-ready.png` })

await page.click('#loader-enter')
await page.waitForTimeout(2600)
await page.screenshot({ path: `${OUT}/01-hero.png` })

const stops = [
  ['02-street-within', 0.38],
  ['03-work-a1', 0.56],
  ['04-work-a2', 0.625],
  ['05-work-a3', 0.685],
  ['05b-record', 0.795],
  ['06-finale', 0.95],
]
for (const [name, p] of stops) {
  await page.evaluate((v) => window.__flight.setProgress(v), p)
  await page.waitForTimeout(2800)
  await page.screenshot({ path: `${OUT}/${name}.png` })
}

// case file modal
await page.evaluate(() => window.__flight.setProgress(0.56))
await page.waitForTimeout(2800)
await page.evaluate(() => document.querySelector('[data-case="wyn"]').click())
await page.waitForTimeout(900)
await page.screenshot({ path: `${OUT}/05c-case-wyn.png` })
await page.keyboard.press('Escape')
await page.evaluate(() => window.__flight.setProgress(0.95))
await page.waitForTimeout(2800)

// book-a-call modal (no real submit — that would email Danilo)
await page.evaluate(() => document.getElementById('book-call').click())
await page.waitForTimeout(900)
await page.fill('#call-form input[name="name"]', 'Jane Broker')
await page.fill('#call-form input[name="email"]', 'jane@example.com')
await page.fill('#call-form input[name="company"]', 'Acme CRE')
await page.fill('#call-form textarea[name="message"]', 'Voice agent for our leasing line.')
await page.screenshot({ path: `${OUT}/06b-call-modal.png` })
await page.keyboard.press('Escape')
await page.waitForTimeout(400)

// mobile pass
await page.setViewportSize({ width: 390, height: 844 })
await page.evaluate(() => window.__flight.setProgress(0))
await page.waitForTimeout(2500)
await page.screenshot({ path: `${OUT}/07-mobile-hero.png` })
await page.evaluate(() => window.__flight.setProgress(0.625))
await page.waitForTimeout(2800)
await page.screenshot({ path: `${OUT}/08-mobile-a2.png` })
await page.evaluate(() => window.__flight.setProgress(0.795))
await page.waitForTimeout(2800)
await page.screenshot({ path: `${OUT}/08b-mobile-record.png` })
await page.evaluate(() => window.__flight.setProgress(0.95))
await page.waitForTimeout(2800)
await page.screenshot({ path: `${OUT}/09-mobile-finale.png` })

await browser.close()
console.log('QA done')
