# Landing Page Premium Prep Audit (Phase 0)

This document captures a safe, non-breaking preparation pass before any premium landing UI implementation.

## Scope Guardrails

- Do **not** change core medical workflow logic.
- Do **not** modify login/auth, dashboards, chatbot, risk/diagnostic/conclusion/recommendation/treatment logic.
- Limit upcoming design work to landing-page-only surfaces and shared style tokens only when isolated.

## Framework & Architecture Snapshot

- Framework: Angular 21 standalone components with Angular Router and SSR support.
- Styling stack: global CSS (`src/styles.css`) + component-scoped inline styles in standalone components.
- Entry and shell routing start from `src/app/app.routes.ts` and `src/app/app.ts`.

## Landing-related Files (Primary)

1. `src/app/components/landing/landing.ts`
2. `src/app/app.routes.ts` (route wiring for `/home`)

## Landing-adjacent Files (Edit only if truly required)

1. `src/styles.css` (global tokens/utilities; avoid risky global overrides)
2. `src/app/app.ts` (shell-level layout concerns only if needed)
3. `src/index.html` (meta/brand-only, no functional logic)

## Protected / No-touch Areas for Premium Landing Work

- `src/app/components/auth/auth.ts`
- `src/app/components/dashboard/dashboard.ts`
- `src/app/components/case-list/case-list.ts`
- `src/app/components/case-detail/case-detail.ts`
- `src/app/services/ai.ts`
- `src/app/services/supabase.ts`
- Domain diagnostic components/services (neuromotor, rehabilitation, SDH, heart, respiratory)

## Package Manager Detection

- Active package manager: **npm** (confirmed by `package-lock.json` and npm scripts).

## Animation Library Check

Checked for requested libraries:

- `framer-motion`: not installed
- `gsap`: not installed
- `three.js`: not installed
- `lucide-react`: not installed

Additional note:

- `motion` package is already installed and is the safest first option for subtle landing animations without introducing React-specific or heavy 3D runtime dependencies.

## Safest Animation Approach Recommendation

1. Prefer CSS transitions/keyframes + existing Angular animations for micro-interactions.
2. If additional runtime animation is needed, use the already-installed `motion` package first.
3. Defer `gsap`/`three.js` until there is a concrete requirement (they increase complexity and payload risk).

## Validation Status (Current)

- Build: passes (`npm run build`) with existing warnings (component style budget + CommonJS optimization warnings).
- Lint: passes (`npm run lint`).

## Readiness

- Project is ready for the next phase: landing-only premium UI enhancement with strict scope isolation.
