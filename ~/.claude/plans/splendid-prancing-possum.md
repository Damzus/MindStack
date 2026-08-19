# MindStack website — implementation plan

## Context

The MindStack Claude Design project contains a finished strategy, an identity exploration, a design system, wireframes and two hi-fi homepages. Nothing has been built. The files are now local in `c:\Users\SaurabNand\Downloads\MindStack` as standalone `.dc.html` documents that render via `support.js` (the dc-runtime) — they are presentation artefacts, not a codebase, and none of their markup carries forward directly.

The goal is a real, deployable ten-page marketing site for a firm that builds websites and applications and operates the cloud infrastructure underneath them. It has exactly one conversion action — *talk to sales*. Per the strategy doc the site's own performance and motion are the primary evidence that the craft is real, so build quality is a commercial requirement, not a nicety.

Decisions taken: **Astro + React islands**, **light and dark mode both first-class**, **MDX content collections**, **Vercel/Netlify hosting**.

## Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Astro 5 + TypeScript | Zero JS baseline; only the form and theme toggle hydrate |
| Interactivity | React 19 islands (`client:idle` / `client:visible`) | Keeps React skills applicable without a hydration tax on static pages |
| Styling | CSS custom properties + Astro scoped styles | Theming demands runtime-swappable tokens; a utility framework fights that |
| Content | Astro content collections (MDX + Zod schemas) | Enforces the case-study shape at build time |
| Motion | CSS keyframes + `IntersectionObserver` | Matches what the designs already do; no animation library needed |
| Forms | React island → Astro server endpoint → Resend + CRM webhook | Five fields, server-side validated |
| Hosting | Vercel (or Netlify) | `@astrojs/vercel` adapter; static output with one server route for the form |

## The crux: one component set, two themes

Homepage v2 already tags every themeable surface with `data-role` — 17 roles, `dim` (50 uses), `card` (12), `markbar` (12), `footlink` (11), `layer`, `navlink`, `gridlines`, `band`, `pill`, `panel`, `strip`, `header`, `glow`, `ghostlink`, `ghostbtn`, `footer`, `ctaband`. Its `Component.toggle()` then walks those roles and **assigns inline styles imperatively from a `LIGHT` object**. That works in a design canvas and must not be ported.

The transformation is mechanical and is the backbone of the build:

```
data-role="card"  →  class="card"  →  background: var(--surface-card);
                                      border-color: var(--border-card);
```

- `:root` holds the light theme (v1 palette — Paper `#faf9f7`, Ink `#14171a`, Surface `#fff`, Accent `oklch(.58 .15 245)`).
- `[data-theme="dark"]` overrides with v2's palette (`#08090b`, `#f2f4f7`, cyan `oklch(.8 .15 200)`).
- A blocking inline script in `<head>` reads `localStorage` then `prefers-color-scheme` and sets `data-theme` before first paint — no flash.
- The toggle is the only other React island; it writes `localStorage` and flips the attribute. No inline styles, no `LIGHT` map, no snapshot/restore.

Section structure comes from v2 (the richer, newer design). v1's sections map onto it almost one-to-one, so a single component set serves both themes:

| v1 | v2 | Component |
|---|---|---|
| LOGO STRIP | MARQUEE | `LogoStrip` |
| PROCESS | PIPELINE | `Pipeline` |
| SOLUTIONS / OBJECTIONS | ANSWERS | `Answers` |
| QUOTE | — | `Quote` (v1 only, keep) |
| — | TEAM | `Team` (v2 only, keep) |

## Repo structure

```
src/
  styles/tokens.css        colour · type · space · radius · elevation · motion, both themes
  layouts/Base.astro       head, fonts, no-flash theme script, skip link
  components/
    ui/                    Button, Card, Chip, Field, Eyebrow
    sections/              Hero, Work, Services, Pipeline, Engagement, Answers, Quote, Team, CTA
    islands/               ThemeToggle.tsx, ContactForm.tsx, MobileNav.tsx
  content/
    case-studies/*.mdx     constraint → decisions → outcome → what we'd do differently
    insights/*.mdx
    config.ts              Zod schemas
  pages/
    index.astro  what-we-do/[service].astro  work/[slug].astro
    solutions/[slug].astro  how-we-build.astro  engagement.astro
    contact.astro  about.astro  careers.astro  insights/[slug].astro
    api/contact.ts
```

Tokens are transcribed from the design system doc, not invented: 4px spacing base (4·8·12·20·32·48·72), radius 4/8/14/pill, breakpoints 640·900·1280, 1280px max width, motion `cubic-bezier(.22,.61,.36,1)` with hover 120ms / reveal 400ms / stagger 60ms.

## Build sequence

1. **Foundation** — Astro scaffold, `tokens.css` with both themes, `Base.astro`, no-flash script, `ThemeToggle`. Verify by toggling with JS disabled for the initial paint.
2. **Primitives** — the `ui/` set plus header and footer, checked against the design system's component specs (44px min button height, 68px sticky header, borders-before-shadows elevation).
3. **Homepage** — sections in v2's order, both themes, reveal system as one shared `useReveal` behaviour rather than six separate observers.
4. **Content model** — collections and schemas, two placeholder case studies and one insight to prove the templates.
5. **Remaining pages** — service ×3, work index + detail, solutions, how-we-build, engagement, contact, about, careers, insights.
6. **Contact flow** — form island, server endpoint, validation, response-time copy, confirmation state.
7. **Ship** — adapter, meta/OG, sitemap, `robots.txt`, structured data, Lighthouse and axe passes.

## Defects in the design files to fix, not port

- **`initAnimGating` is defined twice** in v2's script. The second definition silently overrides the first, so `[data-anim-scope]` subtree gating never runs — only `[data-anim]` nodes are gated. Implement the intended scope-based version once.
- **v2's theme toggle mutates inline styles.** Replaced by the token system above.
- **v2 breaks the design system's one-accent rule.** It uses violet `oklch(.74 .17 288)` (14×), amber `oklch(.85 .13 85)` (11×) and green `oklch(.8 .16 145)` decoratively, while the system states amber and red are signals, never decoration, and the accent is for the conversion action only. Needs a ruling before the dark theme is locked — otherwise "Talk to sales" stops being the loudest thing on the page.
- **v2 loads Manrope**, a fourth family the design system does not list. Drop it or amend the system.
- **The identity file is stale.** Its five logo directions were drawn for an "AI agents platform" premise; the hi-fi pages use the `1a` Ledger mark. The strategy doc flags this as needing rework. Build against `1a` and treat the mark as swappable — one SVG component, one place to change.
- **Reveal-on-scroll hides content when JS fails.** Set the hidden state from JS only (as v1 does), never in CSS, so no-JS and crawler views keep all content.

## Blocked on you

Wireframes and templates can be built with labelled placeholders, but these cannot ship without real material: named client work with permission to show the interface; engagement models and publishable ranges; the real stack and hosting posture; team size and who takes the first sales call; industries with genuine depth; and whether photography exists at all — if it does not, the art direction stays typographic.

## Verification

- `npm run build && npm run preview` — every route renders in both themes.
- Lighthouse on `/` and `/work/[slug]`: performance ≥ 95, accessibility 100. Confirm `/about` ships no JS.
- `prefers-reduced-motion: reduce` — reveals become instant, showpieces freeze on their final frame, nothing animates on `/contact`.
- Keyboard-only pass: skip link, focus rings, mobile nav sheet traps and restores focus.
- Theme: toggle, reload, confirm persistence and no flash; clear storage and confirm it follows the OS.
- Contact form: rejects bad email server-side, delivers, shows the confirmation state.
- Content: a case study missing a schema field fails the build.
