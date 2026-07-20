import assert from 'node:assert/strict'
import test from 'node:test'
import contact, { validateContactPayload } from '../api/contact.ts'

const validPayload = (overrides = {}) => ({
  name: 'Taylor Broker',
  email: 'taylor@example.com',
  company: 'Northstar CRE',
  message: 'We need inquiry ownership and follow-up to land in one visible record.',
  _honey: '',
  submissionId: crypto.randomUUID(),
  ...overrides,
})

const contactRequest = (body, headers = {}) => new Request('https://daniloojeda.com/api/contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Origin: 'https://daniloojeda.com',
    'X-Forwarded-For': `192.0.2.${Math.floor(Math.random() * 200) + 1}`,
    ...headers,
  },
  body: JSON.stringify(body),
})

test('validates and normalizes a complete contact request', () => {
  const result = validateContactPayload(validPayload({ email: ' Taylor@Example.com ' }))
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.value.email, 'taylor@example.com')
})

test('rejects short messages and malformed submission identifiers', () => {
  assert.equal(validateContactPayload(validPayload({ message: 'Too short' })).ok, false)
  assert.equal(validateContactPayload(validPayload({ submissionId: 'not-a-uuid' })).ok, false)
})

test('silently accepts honeypot submissions without sending email', async () => {
  const response = await contact.fetch(contactRequest(validPayload({ _honey: 'spam' })))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })
})

test('rejects cross-origin requests', async () => {
  const request = contactRequest(validPayload(), { Origin: 'https://example.com' })
  const response = await contact.fetch(request)
  assert.equal(response.status, 403)
})

test('reports missing delivery configuration without exposing details', async (context) => {
  const originalKey = process.env.RESEND_API_KEY
  const originalFrom = process.env.CONTACT_FROM_EMAIL
  delete process.env.RESEND_API_KEY
  delete process.env.CONTACT_FROM_EMAIL
  context.after(() => {
    if (originalKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = originalKey
    if (originalFrom === undefined) delete process.env.CONTACT_FROM_EMAIL
    else process.env.CONTACT_FROM_EMAIL = originalFrom
  })

  const response = await contact.fetch(contactRequest(validPayload()))
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: 'Contact email is temporarily unavailable.' })
})

test('sends validated requests to Resend with an idempotency key and bounded timeout', async (context) => {
  const originalFetch = globalThis.fetch
  const originalTimeout = AbortSignal.timeout
  const originalKey = process.env.RESEND_API_KEY
  const originalFrom = process.env.CONTACT_FROM_EMAIL
  const originalTo = process.env.CONTACT_TO_EMAIL
  let providerRequest
  let providerTimeoutMs
  const providerSignal = new AbortController().signal

  AbortSignal.timeout = (milliseconds) => {
    providerTimeoutMs = milliseconds
    return providerSignal
  }
  process.env.RESEND_API_KEY = 're_test_key'
  process.env.CONTACT_FROM_EMAIL = 'Danilo Ojeda <website@daniloojeda.com>'
  process.env.CONTACT_TO_EMAIL = 'danilo@example.com'
  globalThis.fetch = async (input, init) => {
    providerRequest = { input, init }
    return new Response(JSON.stringify({ id: 'email_123' }), { status: 200 })
  }

  context.after(() => {
    globalThis.fetch = originalFetch
    AbortSignal.timeout = originalTimeout
    if (originalKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = originalKey
    if (originalFrom === undefined) delete process.env.CONTACT_FROM_EMAIL
    else process.env.CONTACT_FROM_EMAIL = originalFrom
    if (originalTo === undefined) delete process.env.CONTACT_TO_EMAIL
    else process.env.CONTACT_TO_EMAIL = originalTo
  })

  const payload = validPayload()
  const response = await contact.fetch(contactRequest(payload))
  assert.equal(response.status, 200)
  assert.equal(providerRequest.input, 'https://api.resend.com/emails')
  assert.equal(providerRequest.init.headers['Idempotency-Key'], `portfolio-contact-${payload.submissionId}`)
  assert.equal(providerTimeoutMs, 8_000)
  assert.equal(providerRequest.init.signal, providerSignal)
  const providerBody = JSON.parse(providerRequest.init.body)
  assert.equal(providerBody.reply_to, payload.email)
  assert.deepEqual(providerBody.to, ['danilo@example.com'])
})
