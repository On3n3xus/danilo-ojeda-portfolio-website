const links = [
  'https://miguelcloses.com',
  'https://neurosparkmarketing.com',
]

const failures = []

for (const url of links) {
  let lastError = 'Unknown error'
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
        headers: { 'User-Agent': 'Danilo-Ojeda-Portfolio-Link-Check/1.0' },
      })
      if (response.ok) {
        console.log(`OK ${url} -> ${response.url} (${response.status})`)
        lastError = ''
        break
      }
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
  }
  if (lastError) failures.push(`${url}: ${lastError}`)
}

if (failures.length) {
  throw new Error(`External link check failed:\n${failures.join('\n')}`)
}
