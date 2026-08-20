# MindStack

Marketing site for MindStack — a team that builds websites and applications and runs the cloud infrastructure underneath them.

The site has exactly one conversion action: **Talk to sales**. Its own speed, accessibility and motion are the primary evidence that the craft is real, so build quality is a commercial requirement here rather than a nicety.

**Status:** pre-launch. The site builds and deploys, but some copy is still placeholder — see [Before launch](#before-launch).

---

## Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Astro 7.2 + TypeScript | No framework runtime outside `/contact` |
| Interactivity | React 19 island | Exactly one, site-wide: the contact form |
| Navigation | Astro View Transitions (`ClientRouter`) | 5.6 KB gzipped, on every page |
| Styling | CSS custom properties + Astro scoped styles | Runtime-swappable theme tokens |
| Motion | CSS keyframes + scroll-driven animation | No animation library |

### JS budget, measured

Per-page JavaScript, from the built output:

| Page | External JS | React |
|---|---|---|
| every static page | `ClientRouter` — 16 KB raw / **5.6 KB gz** | no |
| `/contact` | the above + React 19 + the form island | yes (57 KB gz) |

Plus three small inline module scripts on every page — theme toggle, mobile nav, reveal. React is loaded **only** on `/contact`; verify with `grep -l client\\. .vercel/output/static/**/*.html` after a build.
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
- `Logo.astro` uses `color: inherit` — see the scoping trap below.

### Astro scoped styles do not reach a child component's root

This has caused three separate bugs in this repo, so it is worth stating plainly: a class you pass into a component (`<Logo class="brand-logo" />`) **cannot be styled from the parent's scoped `<style>` block.** The rule compiles with the parent's scope attribute, which the child's root element does not carry. It fails silently — no error, no warning, the declaration simply never applies. `:global()` around part of the selector does not rescue it either.

What broke: the footer wordmark rendered invisible (`color` never applied); the footer brand had no bottom spacing for weeks (`margin-bottom` never applied); a wordmark `font-size` override did nothing.

Do instead, in order of preference:

1. **Expose a prop** on the child and let it style itself — `Logo` takes `size`, `orbit`, `wordSize`, `gap` for exactly this reason.
2. **Style the parent container** you do own (the footer sets `gap` on `.brand`, not margin on the logo).
3. Inherit through a CSS property — `color: inherit` on the child root.

Verify by computed style, not by reading the CSS. `getComputedStyle(el).marginBottom === '0px'` is how the dead rule was finally caught.

---

## Motion

Keyframes live in `motion.css`.

**Reveals run on the compositor where the browser allows it.** Under `@supports (animation-timeline: view())` the reveal is pure CSS driven by the scroll timeline, off the main thread. `src/scripts/reveal.ts` detects that support and *stands down*; it only takes over as an `IntersectionObserver` fallback in older browsers. Both paths must be kept working — if you change one, check the other.

- Offscreen animations are paused via `data-anim-scope` gating rather than left running.
- `prefers-reduced-motion: reduce` collapses durations to 1ms globally, and the logo orbit, diagram flow and reveals opt out explicitly.
- Pages using the `quiet` layout flag (`/contact`) disable animation entirely — nothing should move while someone is filling in a form.
- **The hidden state is set from JavaScript, never in CSS.** If JS fails or a crawler visits, all content stays visible.

Regression to watch for: a broken `animation-range` can leave `[data-reveal]` content stuck at `opacity: 0` — invisible but present, so the build and HTTP status stay green. Sweep every route and assert nothing onscreen is transparent after scrolling.

### The mark

`Logo.astro` is the identity's orbiting mark: five satellites rotating around a beating accent core, with a ghost reflection beneath. It is animated, and the timing differs by placement to match the hi-fi design:

| Placement | `size` | `orbit` | `beat` |
|---|---|---|---|
| Header | 23 | `16` (slow) | no |
| Footer | 46 | `9` (faster) | yes |

Props: `size`, `orbit` (seconds), `beat`, `wordmark`, `wordSize`, `gap`, `href`, `class`.

The header instance is `transition:persist`ed, so the orbit runs continuously across navigation instead of snapping back to zero on every page change.

### View Transitions

`ClientRouter` is enabled in `Base.astro`. Three things it forces, all already handled — **do not regress them**:

1. **Theme must be reapplied on `astro:after-swap`.** Astro replaces `<html>`'s attributes from the incoming document, which drops the JS-set `data-theme`. The inline head script rebinds it.
2. **Client scripts must not bind to elements by id at module scope.** Module scripts execute once; swapped-in DOM has no listeners. The theme toggle and mobile nav therefore use delegated `document`-level listeners. Binding `getElementById(...).addEventListener(...)` will appear to work on first load and silently die after the first client-side navigation.
3. **`reveal.ts` re-runs on `astro:after-swap`** and is idempotent via `data-revealed` / `data-anim-gated` markers.

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

- `src/components/sections/Engagement.astro` — `Range TBC` on all three engagement bands. The last remaining placeholder.
- `src/lib/legal.ts` — `registeredName` is `null`. The legal pages currently render the trading name "MindStack"; set the registered entity name before launch.

### Legal pages

`/privacy`, `/terms` and `/security` are written and live. Entity details are centralised in [`src/lib/legal.ts`](src/lib/legal.ts) — name, jurisdiction, contact email, last-updated date and the sub-processor list — so they are corrected in one place rather than across three pages.

Two things about them:

- **They have not been reviewed by a lawyer.** They are accurate about what the site does, and written in plain English rather than boilerplate, but a qualified review before launch is still the right call — particularly the liability and governing-law clauses in `/terms`.
- **The factual claims are verifiable, and were verified.** "No cookies", "no third-party requests", "no storage unless you change the theme" were each confirmed by loading every page in a real browser and inspecting cookies, storage and the network log. If you add analytics, an embed, a font CDN or a chat widget, **those statements become false** and `/privacy` and `/security` must be updated in the same change.

Response time is settled: **one business day**, stated in both places that claim it — `CtaBand.astro` ("Reply within one business day") and the `/contact` trust panel ("Within one business day."). If that commitment ever changes, both must change together; `grep -rn "business day" src/` finds them.

Also outstanding:

- Real `site` URL in `astro.config.mjs`.
- Verified sending domain in Resend.
- Approved outcome wording for the three project cards, and QR's sector and live URL.
- Meta/OG images, `robots.txt`, structured data, Lighthouse and axe passes.

---

## Licence

MIT — see [LICENSE](LICENSE).
