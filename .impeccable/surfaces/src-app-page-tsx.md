---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

# Surface brief — `/` (public landing page)

Mode: Persuade. Audience: home-seekers deciding whether to trust CorreAI with their housing search, plus a secondary audience of real-estate agencies evaluating the product. Job: understand the AI-matching offer in seconds, then either talk to the assistant or submit the quick capture form. Proof/content: real property data from `/api/imoveis` (fallback to clearly-illustrative sample cards), the two real working endpoints (`/api/imoveis`, `/api/leads/public`), no fabricated testimonials/pricing/customers. Constraints: product name "CorreAI" fixed; no existing logo file or locked palette (full creative freedom confirmed by user).

## Direction contract

**THESIS:** The landing *is* a real-estate agency's shopfront window, lit up at night — the universal, zero-explanation ritual of walking past a corretora and seeing property cards taped behind glass — refusing the category default of a SaaS hero (headline / subcopy / button / logo row) and the AI-tool default of a chat-bubble-in-a-browser-chrome mockup.

**OWN-WORLD:** Near-black storefront ground (`#07090d`→`#0c1018`), warm shop-light amber/brass accent (`#D9BB4C` family) as the single committed color carrying 30–60% of weight, a cool signal-blue (`#2F5DE0` family, descended from the app's existing brand-primary) reserved only for AI/digital moments (chat, links, the assistant's "voice") so warm=physical/real and cool=AI/intelligence read as two deliberate registers. Glass is a real surface: panels get a faint reflected ghost of their own headline text, soft amber bloom at the edges, a subtle vertical seam line per "pane." Property cards are printed cards pinned/taped behind the glass, not browser cards. Type: DM Sans for UI/body (workhorse, legible, matches the CRM register), Space Grotesk for display/headlines (cut, confident, reads like letraset shop lettering) — no Instrument Sans carryover, this is a full visual reset.

**STORY:** Visitor arrives "outside the window," reads the one claim only CorreAI can prove (the AI already matched real, available inventory to what you're about to ask for), sees real cards behind the glass, and either knocks (opens the assistant chat) or leaves a card with their info (capture form) — both framed as the storefront's two doors, not a feature list.

**FIRST VIEWPORT:** Full-bleed dark storefront glass fills the frame edge-to-edge. Left third: large Space Grotesk headline in white with a faint amber-ghosted reflection duplicate behind it, one-line subcopy, two actions styled as the shopfront's doors ("Falar com a IA" / "Deixar meu contato"), not pill buttons. Right two-thirds: the property cards pinned behind glass in a loose, slightly overlapping taped-up arrangement (not a clean grid) — 3–4 visible at the fold, amber shop-light pooling from above. A thin brass "OPEN" style strip or small agency signage detail anchors the bottom edge as a materiality cue.

**FORM:** seed:a101482db9f3e73a — user-chosen pick card (candidate 1 of 7 derived grounded directions; assigned index was 7, user overrode with their own top choice, valid per "a user- or brief-pinned decision beats the roll, always").

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Raises (donated from declined challengers, weighed against this direction)

- Tabular/monospace figures for prices, specs, and any proof numerals (from the ASCII-glyph and anime-command-wall challengers) — numeric precision reads as trustworthy data.
- Click-to-isolate: selecting a property card in the showcase dims its neighbors instead of an instant unrelated-state change (from the particle-detector challenger).
- A persistent one-line status/caption under major sections, already a pattern in this codebase's scroll-pinned showcase (from the broadcast-signal challenger) — kept, not newly invented.
- One monumental bold-numeral proof stat (e.g. live count of available properties) rendered large, toned down from alarm registers (from the anime-command-wall challenger).
- Warm amber sodium-glow atmosphere and a ghosted glass reflection of the headline (from the indoor-weather-sun challenger) — genuinely native to a storefront window, not a borrowed costume.
- Deliberate color-shift micro-transition (not an instant class swap) when a status badge changes state, e.g. disponível → vendido (from the cephalopod-skin challenger).

## Unresolved decisions

- Exact property photography: none available (no real photos in this environment); use the existing gradient-tinted placeholder treatment already built for cards without `imagem_url`, re-skinned to the new palette, never a stock photo presented as a real listing.
- `/assistente` and the logged-in app (dashboard, imóveis, leads, funil) are explicitly out of scope for this pass — only the public landing (`/`) and its direct components are rebuilt.
