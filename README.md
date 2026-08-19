# MindStack

Marketing site for MindStack — a team that builds websites and applications and runs the cloud infrastructure underneath them.

The site has exactly one conversion action: **Talk to sales**. Its own speed, accessibility and motion are the primary evidence that the craft is real, so build quality is a commercial requirement here rather than a nicety.

**Status:** pre-launch. The site builds and deploys, but some copy is still placeholder — see [Before launch](#before-launch).

---

## Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Astro 7.2 + TypeScript | Zero JS on every page except `/contact` |
| Interactivity | React 19 island | Exactly one, site-wide: the contact form |
| Styling | CSS custom properties + Astro scoped styles | Runtime-swappable theme tokens |
| Motion | CSS keyframes + `IntersectionObserver` | No animation library |
| Email | Resend | Via an Astro server endpoint |
| Hosting | Vercel | `@astrojs/vercel` adapter |
| Fonts | Space Grotesk, IBM Plex Sans, JetBrains Mono | Self-hosted, latin subset |

Requires **Node >= 22.12** and **npm >= 9.6.5** (developed on Node 24.11).

---

## Quick start

```bash
git clone <repo> && cd MindStack
npm install
cp .env.example .env          # then fill it in — see Environment
npm run dev                   # http://localhost:4321
```

---

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server on `:4321` |
| `npx astro dev stop` | **Stop the dev server** |
| `npx astro dev status` | Is it running, and on what PID |
| `npx astro dev logs` | Server output |
| `npm run build` | Production build to `.vercel/output/` |
| `npm run check` | `astro check` — type and template diagnostics |
| `npm run capture` | Re-screenshot the project cards via Playwright |

### The dev server is a daemon

Astro 7 detaches the dev server. `npm run dev` prints a URL and **returns to your prompt** — the server keeps running in the background.

- **Ctrl+C does nothing.** Closing the terminal does not stop it.
- Stop it with `npx astro dev stop`.
- A second `npm run dev` may look like a no-op because port 4321 is already held. Check with `npx astro dev status`.

If it is wedged and `stop` will not take:

```powershell
Get-NetTCPConnection -LocalPort 4321 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### Stop the dev server before `build` or `check`

Running either against a live dev server re-optimizes Vite's dependency cache and **silently breaks React hydration** — see [Troubleshooting](#troubleshooting).

```bash
npx astro dev stop && npm run check && npm run build
```

### `npm run preview` does not work

The Vercel adapter does not implement it; it fails with *"Preview server process exited before becoming ready."* Use `npm run dev`, or `npx vercel dev` if you specifically need to exercise a production bundle locally.

---

## Environment

The contact form is the only thing that needs configuration. Copy `.env.example` to `.env`:

| Variable | Required | Purpose |
|---|---|---|
| `RESEND_API_KEY` | yes | Resend API key. A **send-only** key is sufficient and preferred. |
| `CONTACT_TO_EMAIL` | yes | Where enquiries are delivered. |
| `CONTACT_FROM_EMAIL` | no | Defaults to `MindStack <onboarding@resend.dev>`. |

Without `RESEND_API_KEY` and `CONTACT_TO_EMAIL` the endpoint returns **503** with *"The contact form is not configured yet."* — by design, so a missing key fails loudly rather than dropping enquiries.

**Astro reads `.env` only at startup.** Creating or editing it while the server runs changes nothing — restart.

Two constraints worth knowing before launch:

- **`onboarding@resend.dev` only delivers to the Resend account owner's own address.** Sending anywhere else returns 403. A verified custom domain is required before the form can email a shared alias.
- On Vercel, set these in **Project Settings → Environment Variables**, not in the repo. `.env` is gitignored.

---

## Project structure

```
src/
  assets/          team portraits, project screenshots (optimized by astro:assets)
  components/
    islands/       ContactForm.tsx — the only React island on the site
    layout/        Header, Footer, PageHeader, Atmosphere
    sections/      Hero, Work, Services, Pipeline, Engagement, Answers, Team, CtaBand, …
    ui/            Button, Card, Chip, Field, Logo, ThemeToggle
  layouts/
    Base.astro     head, fonts, no-flash theme script, skip link
  lib/
    nav.ts         single source of truth for header, footer and CTA links
    services-detail.ts
  pages/           file-based routes (below)
  scripts/
    reveal.ts      IntersectionObserver reveal + animation gating
  styles/
    tokens.css     design tokens, both themes, base rules
    motion.css     keyframes and motion utilities
```

### Routes

`/` · `/work` · `/what-we-do` · `/what-we-do/[slug]` · `/how-we-build` · `/engagement` · `/team` · `/contact` · `/privacy` · `/terms` · `/security` · `/404`

`POST /api/contact` is the only server route (`prerender = false`); everything else is static.

Files prefixed with `_` are excluded from routing. `_careers.astro` and `_insights.astro` are written but deliberately hidden — rename to publish, and restore their links in `src/lib/nav.ts`.

---

## Theming

Light and dark are both first-class, not an afterthought bolted onto one.

- `src/styles/tokens.css` holds two blocks: `:root, [data-theme='light']` and `[data-theme='dark']`.
- A blocking inline script in `Base.astro` reads `localStorage` (`ms-theme`), falls back to `prefers-color-scheme`, and sets `data-theme` **before first paint** — no flash.
- With no stored preference the site follows the OS live.
- Components never hardcode colour. They reference tokens, so adding a theme means adding a token block, not touching components.

**One accent.** The accent colour is reserved for the conversion action. Green, amber and red are signal colours only — never decoration. If everything is accented, "Talk to sales" stops being the loudest thing on the page.

Two tokens exist specifically to fix rendering bugs, so do not "simplify" them away:

- `--surface-solid` — native `<select>` popups composite onto white in the OS layer, so translucent surfaces made the dark dropdown unreadable. Options need an opaque background.
- `Logo.astro` uses `color: inherit` — Astro's scoped styles do not cross component boundaries, so the footer could not recolour the wordmark and it rendered invisible against the dark footer.

---

## Motion

Keyframes live in `motion.css`; `src/scripts/reveal.ts` drives reveal-on-scroll.

- Offscreen animations are paused via `data-anim-scope` gating rather than left running.
- `prefers-reduced-motion: reduce` collapses durations to 1ms globally.
- Pages using the `quiet` layout flag (`/contact`) disable animation entirely — nothing should move while someone is filling in a form.
- **The hidden state is set from JavaScript, never in CSS.** If JS fails or a crawler visits, all content stays visible.

---

## Contact form

`src/components/islands/ContactForm.tsx` → `POST /api/contact` → Resend.

Five fields: name, work email, need (Web / App / Infra chips), optional budget, context. Behaviour:

- Validation is **server-side**, returning `422` with per-field messages. The client renders them; it does not duplicate the rules.
- A honeypot field (`company`) returns `200` and sends nothing, so bots get no signal.
- Failures degrade to an explicit error with a direct mailto, never a silent drop.

Verified end to end: bad email `422` · short context `422` · honeypot `200` no-send · valid `200` success panel.

---

## Deployment

Vercel, via `@astrojs/vercel`. **The deployable output is `.vercel/output/`, not `dist/`.**

`dist/client/` is still written on every build as an intermediate — the adapter builds there, then copies into `.vercel/output/static/`. Both are regenerated each time and both are gitignored. If you are inspecting build output or scripting a check against it, read `.vercel/output/static/`; reading `dist/` will appear to work and can quietly report on the wrong artifact.

Set `RESEND_API_KEY` and `CONTACT_TO_EMAIL` in the Vercel dashboard.

Environment variables are read as `process.env.X || import.meta.env.X`. The `process.env` half matters: `import.meta.env` is **inlined at build time**, so a key added to the dashboard after a build would otherwise never take effect.

`astro.config.mjs` still has `site: 'https://mindstack.example'`. This feeds canonical URLs and `sitemap-index.xml` — **change it to the real domain before launch.**

---

## Troubleshooting

**The contact form vanishes from the page.** The page returns 200, the HTML is correct, but no form renders and the console reads `_jsxDEV is not a function`. React 19 empties the island container when hydration throws, so the markup disappears rather than erroring visibly.

Cause: a stale Vite dependency cache, almost always from running `astro check` or `astro build` against a live dev server. Fix:

```bash
npx astro dev stop
rm -rf node_modules/.vite     # PowerShell: Remove-Item node_modules\.vite -Recurse -Force
npm run dev
```

Do **not** try to fix this with a `resolve.alias` onto React's jsx runtime files — those are CommonJS, and aliasing them to an absolute path makes Vite treat them as source, killing SSR with `module is not defined`.

**Form returns 503.** `.env` is missing, or the server was not restarted after it was created.

**Form returns 502.** Resend rejected the send — usually sending from `onboarding@resend.dev` to an address that is not the account owner's.

**Port 4321 in use.** A detached dev server is already running: `npx astro dev status`.

---

## Verifying changes

Type and template diagnostics:

```bash
npx astro dev stop && npm run check
```

`check` and HTTP status codes are not sufficient on their own. Three real bugs here — the invisible footer wordmark, the white-on-white dark dropdown, and the vanishing contact form — all passed grep and returned 200. Each was only caught by inspecting the **rendered** page. Playwright is available as a dev dependency for this; `scripts/shot-page.mjs` screenshots a route.

Before shipping a visual change, check it in **both themes**.

---

## Before launch

Content still marked `TBC` in the source:

- `src/components/sections/Engagement.astro` — `Range TBC` on all three engagement bands.
- `src/components/sections/CtaBand.astro` — `Response time TBC`. Note `/contact` currently asserts *"Within one business day"*; **these two disagree and must be reconciled.**

Also outstanding:

- Real `site` URL in `astro.config.mjs`.
- Verified sending domain in Resend.
- Approved outcome wording for the three project cards, and QR's sector and live URL.
- Meta/OG images, `robots.txt`, structured data, Lighthouse and axe passes.

---

## Licence

MIT — see [LICENSE](LICENSE).
