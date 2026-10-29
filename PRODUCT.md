# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Corretores (real estate agents)** and **admins de corretora** — the logged-in operators. They manage a property catalog, a lead pipeline (Kanban funnel: Novo → Em atendimento → Visita agendada → Proposta → Fechado), and act on leads the AI assistant has already pre-qualified.
- **Visitantes / leads** — people arriving at the public landing page looking for a property to buy or rent. They either fill a quick capture form or talk to the AI assistant directly. They are evaluating whether to trust this company with their housing search, not comparing CRM software.

## Product Purpose

CorreAI is an AI-assisted real-estate CRM. It gives a real-estate agency (corretora) a catalog of properties, a lead/funnel pipeline, and — on the public side — an AI assistant that holds a real conversation with a visitor, understands what they're looking for (type, budget, neighborhood), matches it against the agency's real, available inventory, and hands the agent a pre-qualified lead instead of a cold form submission.

## Positioning

The differentiator confirmed by the user: **the AI does the pre-sales work, not just capture it.** Most real-estate sites/CRMs either show a static listing or collect a lead form that a human must then qualify from scratch. CorreAI's assistant converses, narrows preferences, cross-references the agency's actual live catalog (not generic listings), and delivers the agent a lead that is already qualified and matched — the agent's first touch is a warm one, not cold outreach.

## Operating Context

- The public landing page (`/`) is the top-of-funnel surface: anonymous, no login, must load fast and build trust quickly.
- From the landing, a visitor either submits the quick capture form (`POST /api/leads/public`) or goes to `/assistente`, a full chat interface with the AI, which can also be reached directly.
- The property showcase on the landing reads real, available inventory from `GET /api/imoveis` (now public) and falls back to illustrative example cards only when the catalog is empty or unreachable.
- Once a lead is captured, it lands in the agent's Kanban funnel (`/funil`) and lead list (`/leads`), where the agent moves it through stages and works it to close.
- Agents separately manage the property catalog (`/imoveis`) — create, edit, mark status (disponível/vendido/alugado), delete with confirmation.

## Capabilities and Constraints

- Stack: Next.js (App Router) + React + Tailwind CSS v4, Supabase (Postgres + storage + auth backing), GSAP for scroll-driven motion, Motion (Framer Motion) for component animation, lucide-react icons. This is an existing, mature codebase — not greenfield.
- Roles: `lead` (client), `corretor`, `admin_corretora`, `super_admin` — enforced both in middleware and in the UI.
- No real logo file, no confirmed brand palette prior to this work, no real testimonials or case studies. The product name **"CorreAI"** is fixed and must not change.
- Dev environment here has no Supabase credentials configured, so dynamic data (real property photos, live counts) cannot be exercised end-to-end locally; fallbacks must look intentional, not broken.

## Brand Commitments

- Product name: **CorreAI**. Keep exactly this spelling/casing in UI copy (the repo historically also used "CorreIA"/"CorreAi" inconsistently — "CorreAI" is the one to standardize on going forward for anything newly written).
- No other binding brand assets. The user granted full creative freedom for palette, type, logo mark, and visual language on this surface (confirmed: "Nenhum — liberdade total").

## Evidence on Hand

- Real, working API routes for properties (`/api/imoveis`) and public lead capture (`/api/leads/public`) — use these, don't invent new ones.
- No real property photos, no real testimonials/case studies/press/pricing. Any such content on the landing must read as illustrative (e.g., sample catalog cards), never as a fabricated factual claim (no invented client names, numbers, or quotes presented as real).

## Product Principles

1. **The AI assistant is the hero claim, not a feature footnote.** The landing's entire narrative arc should earn the visitor's trust in "talk to it, it actually understands and matches you" before asking for contact info.
2. **Show real inventory whenever possible; never fake specificity.** Prefer the live catalog; when falling back, keep the fallback honest (generic, clearly a sample) rather than inventing fake addresses/prices presented as real.
3. **Low friction to the two real actions.** Every path on the page should lead to either the capture form or the assistant chat — nothing decorative should compete with those two CTAs.
4. **Agents are a second, credible audience.** The agency/agent side (why a corretora would adopt this) deserves a believable value beat, even though the primary visitor is the home-seeker.
5. **Fast and trustworthy over spectacle.** Motion and visual ambition serve clarity and credibility (a CRM handling someone's housing search is a trust-sensitive context), not performance for its own sake.
