# daniloojeda.com

Danilo Ojeda's interactive portfolio for AI systems in commercial real estate.

The experience follows one property inquiry through a six-stage pipeline:

1. Inquiry capture
2. Voice conversation
3. Intent structuring
4. CRM handoff
5. Automated follow-up
6. Booked meeting

The fixed Three.js layer is decorative. Native document scrolling, project evidence, keyboard navigation, reduced-motion support, and the full content experience remain available without it.

## Stack

- Vite
- TypeScript
- Three.js
- Vercel Function for contact delivery
- Resend email API
- Vercel Web Analytics
- Native HTML forms and dialog
- No UI or animation framework

## Commands

```bash
npm run dev
npm run dev:vite
npm run build
npm run lint
npm run test:contact
npm run qa
npm run check:links
```

`npm run dev` launches the full Vercel development runtime, including `/api/contact`, through the pinned Vercel CLI version. `npm run dev:vite` is frontend-only and does not serve the contact API.

The QA script captures desktop, tablet, mobile, and reduced-motion checkpoints. It verifies the interactive pipeline, diagnostic, navigation, contact success and failure states, and layout overflow without sending a live email.

## Contact delivery

The browser posts contact requests to `/api/contact`. The Vercel Function validates every field, rejects cross-origin requests, uses a honeypot, applies a best-effort instance rate limit, and sends the accepted request through Resend. It logs status and duration without logging form contents.

Copy `.env.example` to `.env.local` for local Vercel development, or configure these values in Vercel project settings:

```bash
RESEND_API_KEY=
CONTACT_FROM_EMAIL="Danilo Ojeda <website@daniloojeda.com>"
CONTACT_TO_EMAIL=danilo@neurosparkmarketing.com
```

`CONTACT_FROM_EMAIL` must use a domain verified in Resend. Production requires the active Vercel Firewall rule `Rate limit portfolio contact form`: exact path `/api/contact`, method `POST`, five requests per 600-second fixed window, keyed by IP, with HTTP 429 on excess traffic. The in-function limiter is intentionally only a secondary guard because serverless instances do not share memory.

## Analytics and search

Vercel Web Analytics loads only on non-local production hosts. Events cover major CTA clicks, pipeline stage selection, diagnostic completion, contact opens, successful contact requests, and outbound links. No form contents or diagnostic answers are attached to analytics events. Enable Web Analytics in the Vercel project dashboard to receive data.

`robots.txt` and `sitemap.xml` ship from `public/`. A scheduled GitHub Actions workflow checks the two public project links every Monday.
