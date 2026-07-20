import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('announces dynamic pipeline stage changes to assistive technology', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  const stageReadout = html.match(/<aside\s+class="stage-readout"[^>]*>/)?.[0]

  assert.ok(stageReadout, 'stage readout markup should exist')
  assert.match(stageReadout, /aria-live="polite"/)
  assert.match(stageReadout, /aria-atomic="true"/)
})
