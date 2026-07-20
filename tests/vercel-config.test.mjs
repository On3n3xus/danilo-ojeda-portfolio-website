import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))
const packageConfig = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const globalHeaders = config.headers.find((entry) => entry.source === '/(.*)')?.headers || []
const headerValue = (key) => globalHeaders.find((header) => header.key.toLowerCase() === key.toLowerCase())?.value || ''

test('ships strict transport and content security headers', () => {
  assert.equal(headerValue('Strict-Transport-Security'), 'max-age=31536000')
  const policy = headerValue('Content-Security-Policy')
  for (const directive of [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://vitals.vercel-insights.com",
    'upgrade-insecure-requests',
  ]) assert.ok(policy.includes(directive), `missing CSP directive: ${directive}`)
})


test('runs the complete Vercel application in the default development workflow', () => {
  assert.equal(packageConfig.scripts.dev, 'npx --yes vercel@54.20.0 dev')
  assert.equal(packageConfig.scripts['dev:vite'], 'vite')
  assert.equal(packageConfig.devDependencies.vercel, undefined)
})
