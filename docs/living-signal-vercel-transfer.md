# Living Signal Vercel Transfer

## Scope

Move the approved Living Signal portfolio experience from the Higgsfield-hosted build into the existing `danilo-ojeda-portfolio-website` Vercel project and publish it on `daniloojeda.com`.

## Architecture

- Deploy a static Vite and React application through Vercel's managed build and CDN.
- Keep the site public and read-only. It has no authentication, database, server endpoints, user uploads, or stored visitor data.
- Keep the contact action as a direct `mailto:` link.
- Preserve the current production site and its latest local refinements in Git history so it can be restored with a normal revert or Vercel rollback.

## Network and data flow

- Browsers request HTML, JavaScript, CSS, images, and video from the Vercel deployment.
- Browsers load the Outfit and IBM Plex Mono font files from Google Fonts. No personal data or credentials are sent by the application.
- Portfolio links may navigate to the named external project sites, LinkedIn, Instagram, or the visitor's email client.
- The app needs no third-party API credentials.
- Generated visual assets are copied into `public/assets` and served from the same Vercel origin. This removes the Higgsfield runtime and media CDN from the production dependency path.

## Deployment and secrets

- Vercel terminates TLS and serves the static site through its managed edge network.
- The build requires no environment variables or long-lived cloud credentials.
- Production changes are traceable to committed source and a committed npm lockfile.
- Install and build use the locked dependency graph with `npm ci --ignore-scripts` and `npm run build`.
- A failed Vercel build does not replace the last successful production deployment.

## Dependencies

- React and React DOM provide the component runtime used by the approved Higgsfield implementation.
- Vite and its official React plugin provide the static build.
- TypeScript provides compile-time checks.
- A small Vercel configuration file sets the build output and baseline response headers without adding a vulnerable configuration dependency to the build.
- The transfer intentionally excludes TanStack Start, Cloudflare Workers, Tailwind, Higgsfield workspace packages, and the unused template component library because this single-page portfolio does not need a server framework.

## Verification and rollback

- Run type checking, linting, and a production build locally.
- Check desktop and mobile layouts, scroll-controlled video behavior, reduced-motion behavior, navigation, external links, and the contact action in a real browser.
- Verify the Vercel deployment before confirming the production domain.
- Roll back by promoting the previous Vercel deployment or reverting the transfer commit.
