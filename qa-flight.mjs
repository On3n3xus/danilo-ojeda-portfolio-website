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
  ['03-work-a1', 0.605],
  ['04-work-a2', 0.675],
  ['05-work-a3', 0.755],
  ['06-finale', 0.93],
]
for (const [name, p] of stops) {
  await page.evaluate((v) => window.__flight.setProgress(v), p)
  await page.waitForTimeout(2800)
  await page.screenshot({ path: `${OUT}/${name}.png` })
}

// mobile pass
await page.setViewportSize({ width: 390, height: 844 })
await page.evaluate(() => window.__flight.setProgress(0))
await page.waitForTimeout(2500)
await page.screenshot({ path: `${OUT}/07-mobile-hero.png` })
await page.evaluate(() => window.__flight.setProgress(0.675))
await page.waitForTimeout(2800)
await page.screenshot({ path: `${OUT}/08-mobile-a2.png` })
await page.evaluate(() => window.__flight.setProgress(0.93))
await page.waitForTimeout(2800)
await page.screenshot({ path: `${OUT}/09-mobile-finale.png` })

await browser.close()
console.log('QA done')
