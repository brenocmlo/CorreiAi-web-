# Design

<!-- impeccable:design-schema 1 -->

## Scope

This file documents the visual system of the **public landing page only** (`/`, `src/app/page.tsx` and `src/components/landing/*`). It does not apply to the logged-in product (dashboard, imóveis, leads, funil, auth screens), which keeps its own earlier dark/brand-primary system in `src/app/globals.css` and `src/components/ui/*`, untouched by this work.

## World

**"Vitrine de imobiliária à noite"** — the landing is built as a real-estate agency's shopfront window lit up at night: printed property cards taped behind glass, warm shop-light, a storefront's own signage. Chosen by the user over the design process's dice-assigned direction, as their own top-ranked candidate from seven grounded directions derived from the Brazilian home-buyer's and corretor's real cultural world (storefront window, building intercom/porteiro, floor plan, "vende-se" yard sign, newspaper classifieds, property registry document, agent's key ring).

## Tokens

Defined in `src/app/landing.css`, scoped to `.landing-root` (never leaks into the app-wide theme):

| Token | Value | Role |
| --- | --- | --- |
| `--shop-ink` | `#07090d` | Base ground — the night outside the glass |
| `--shop-panel` | `#0c0f16` | Elevated panels/cards on the ink ground |
| `--shop-glass-line` | `rgba(255,255,255,0.08)` | Pane-seam hairlines |
| `--shop-brass` | `#d9bb4c` | Primary accent — warm, physical, "real world" actions |
| `--shop-brass-dim` | `#8a7232` | Brass at rest / secondary |
| `--shop-brass-glow` | `rgba(217,187,76,0.35)` | Shop-light bloom |
| `--shop-signal` | `#4c73f2` | Reserved exclusively for AI/digital actions (chat CTA) — cool vs. brass's warm, by design |
| `--shop-signal-soft` | `#a9bbf8` | Signal at low emphasis |
| `--shop-paper` | `#ece6d8` | Printed-card face (the showcase cards and hero peek-cards) |
| `--shop-paper-dim` | `#cfc7b2` | Paper at rest |
| `--shop-ink-text` | `#f3efe6` | Primary text on ink |
| `--shop-text-dim` | `rgba(243,239,230,0.62)` | Secondary text on ink |

Fonts: **Space Grotesk** (`.font-display`, headlines/numerals) + **DM Sans** (body/UI default), both self-hosted via `next/font/google`, loaded only on this page (`src/app/page.tsx`). No carryover from the app's Instrument Sans.

Radius: sharp, small (`2–4px`) throughout — signage/print register, not a SaaS rounded-card register. Shadows: soft offset+blur only, no flat/hard shadows.

## Components

- **LandingNavbar** — translucent ink strip, brass hairline bottom border, tag-shaped brand mark (`SunburstIcon.tsx`, repurposed from a generic sunburst into a price-tag glyph).
- **HeroSection** — full-bleed night video behind dimmed glass; a short, fast-fading glass-reflection ghost of the headline (clipped to a fixed box so it never bleeds into body copy); three loosely overlapping "peek" cards pinned to the right two-thirds, tilted at fixed per-card angles (not a grid); a thin brass "Aberto agora" signage strip anchoring the bottom edge; `24/7` as a tabular-numeral proof mark (a true, unfalsifiable claim — software is always available — chosen deliberately over an unverifiable stat number).
- **LandingMidShowcase** — the vitrine. Uses the same seven explicitly fictional properties from `assistant-demo.ts` as the chat, without requesting the private inventory API. Cards render as paper tickets taped behind glass: fixed per-card rotation + negative-margin overlap (`ROTATIONS`/`DROPS` arrays), never an even grid. The row is a plain horizontally-scrollable/swipeable strip at every viewport size — no scroll-jacking, no GSAP pin; the user scrolls the page freely at all times. Clicking a card isolates it (dims siblings, lifts it) — a restrained "select to inspect" borrowed discipline.
- **LeadCaptureForm** — the legacy component name now renders the SaaS demo chooser: two example agencies with illustrative photos, city and property count, followed by a button that opens that agency's demo in the chat. It does not collect phone/email or call lead registration on the software's sales page.
- **AssistantChat** — global dialog, 450px wide at the bottom right on desktop and full viewport height on mobile. Keeps the current page and conversation when closed. Indigo identifies AI actions; compact property cards show real prices and details, with separate detail and visit actions. The official agency phone stays in the header. Quick replies and a collapsed search summary keep the conversation concise. Anonymous visitors see inventory only in an explicitly published agency's URL, with conversation and cached messages separated by agency.
- **PublicAgencyLanding** (`/imobiliaria/{slug}`) — agency name and confirmed phone, warm catalog action, indigo chat action, responsive property cards and a short contact form with authorization. Real empty/error/loading states replace illustrative listings on this surface. The public detail page uses the same agency boundary and opens the chat over the property, with its ID selected for the conversation.
- **SaaS demonstration** (`/`) — the same dialog has a visible agency selector and clear fictional-data notice. Example properties show real image assets and illustrative prices; detail and visit buttons continue the simulation in the chat. No internal page, broker login or real callback is required. The data source is shared with the landing's showcase.
- **CinematicFooter** — closing-signage treatment: no gradient text, no glass-pill-everywhere default; a scrolling feature marquee, two real CTAs, and a brass-glow aurora instead of the prior blue one. Copyright `©` glyph forced through `system-ui` to avoid a DM-Sans subsetting gap that silently dropped the character.

## Motion

- Hero/showcase/footer entrances: single authored reveal per element (opacity+y, `power3.out`/cubic-bezier `[0.16,1,0.3,1]`), triggered once on scroll-into-view — never scroll-jacked, never repeated.
- `prefers-reduced-motion: reduce` is honored throughout: entrance animations resolve to their end state immediately, the hero reflection is omitted, magnetic-button pointer-follow in the footer is skipped.
- Button/link press feedback is instant (`active:scale-[0.97]`, no transition delay) per direct-manipulation practice — never only on release.

## Known constraints carried forward

- No Supabase credentials in the dev environment used to build this: the showcase's live-catalog fetch always fails here and renders its fallback — expected, not a defect.
- No real property photography or logo asset exists; card imagery is Unsplash placeholder, consistent with PRODUCT.md's instruction to keep any illustrative material honestly generic rather than inventing fake specificity.
