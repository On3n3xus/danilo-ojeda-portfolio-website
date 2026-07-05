# daniloojeda.com — Danilo Ojeda, AI Builder

A cinematic, virtual-scroll portfolio. There is no scrollbar — wheel / touch / keys
scrub a 0→1 progress value that flies a Three.js camera through a night city in
four acts:

1. **Skyline** — hero: "Proof of Work." + live telemetry callouts
2. **Street** — what I do: voice agents, lead engines, CRM automation
3. **The Work** — Wyn Intelligence · Miguel Closes · MicroCommit
4. **Signal** — contact: LinkedIn / Instagram / book a call, with a particle
   swarm that morphs on link hover

Extras: preloader gate ("CLICK TO ENTER"), scramble/glitch text, chromatic-aberration
act transitions, generated ambient audio (wind + drone, no audio files), film grain,
ember particles, custom cursor. Honors `prefers-reduced-motion`.

## Stack

Vite + TypeScript + Three.js. No framework, no animation libraries — the whole
engine lives in [src/main.ts](src/main.ts), styles in [src/style.css](src/style.css),
markup in [index.html](index.html).

## Commands

```bash
npm run dev       # dev server
npm run build     # type-check + production build → dist/
npm run lint      # oxlint
node qa-flight.mjs  # headless Playwright QA: screenshots every act (desktop + mobile)
```

`window.__flight.setProgress(p)` scrubs the flight from the console / tests.
