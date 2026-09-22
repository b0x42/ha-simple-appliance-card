# Implementation Plan: Configurable Appliance Cards

**Branch**: `001-configurable-appliance-cards` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-configurable-appliance-cards/spec.md`

## Summary

Build a Home Assistant Lovelace custom card (`ha-simple-appliance-card`), installable
via a HACS custom repository, that renders a user-configured, ordered list of
"appliances" as icons. Each appliance is backed by a required primary entity and an
optional target entity; active/inactive state is a configurable numeric threshold on
the primary entity's value (default: active when > 0), with a distinct unavailable
indicator. The card ships a built-in preset covering the 4 appliances on the
reference Home Assistant heating dashboard (Heat Pump, Gas Boiler, Hot Water,
Heating Circuit) so users with matching entities need only supply entity IDs.
Configuration works via both hand-written Lovelace YAML and a visual point-and-click
editor (`getConfigElement`/`getStubConfig`). Tapping an appliance opens Home
Assistant's standard entity more-info dialog — no custom tap action.

## Technical Context

**Language/Version**: TypeScript 5.x, compiled to an ES2021+ target matching Home
Assistant frontend's own browser support baseline (evergreen Chrome/Firefox/Safari;
no IE/legacy transpilation).

**Primary Dependencies**: `lit` (already loaded by the Home Assistant frontend at
runtime — used as an external/peer, not bundled) for the card and editor custom
elements; `custom-card-helpers` (small, tree-shakeable, dev-time typed utilities:
`fireEvent`, `hasConfigOrEntityChanged`) as the only bundled runtime dependency,
justified per constitution Principle V in research.md.

**Storage**: N/A. The card holds no persistent storage of its own — its
configuration is the Lovelace dashboard YAML/storage object Home Assistant already
persists and passes in via `setConfig()`; live data comes from the `hass` object
Home Assistant injects at runtime.

**Testing**: `@web/test-runner` (real headless-browser execution) + `@open-wc/testing`
for card/editor component tests (custom element rendering, shadow DOM, live state
updates); plain Mocha+Chai-style unit tests (no DOM) for pure logic (threshold/state
derivation, preset application, config validation), with `c8` coverage enforcing the
constitution's 80% branch-coverage floor on that non-DOM logic.

**Target Platform**: Browser, embedded inside a user's Home Assistant frontend
(Lovelace dashboard). No server/backend component.

**Project Type**: Single frontend package — one custom element bundle (no
backend/API).

**Performance Goals**: Card must not introduce visible dashboard jank; appliance
state-indicator re-renders complete well under one animation frame (~16ms) per
update. Live state changes reach the rendered icon within the spec's SC-004 budget
(<2s), which is dominated by Home Assistant's own WebSocket push latency, not card
render time.

**Constraints**: Single self-contained JS bundle per constitution's Technology &
Build Standards (no unresolved runtime imports, no Node-only APIs in the built
artifact); must run correctly in both light and dark Home Assistant themes using
theme CSS custom properties only.

**Scale/Scope**: Designed for a realistic residential dashboard: comfortably renders
up to ~20 configured appliances on one card instance without layout or performance
degradation; the 4-appliance heating preset is the primary out-of-box scenario.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Type-Safe, Lint-Clean Code | TypeScript `strict`, ESLint+Prettier clean, config/editor/CSS-custom-property types exported | PASS |
| II. Test-First Development | `@web/test-runner`+`@open-wc/testing` for component behavior, Mocha-style unit tests for `setConfig`/threshold/preset logic, 80% branch coverage gate via `c8` | PASS |
| III. Home Assistant Contract Compliance | `setConfig`, `hass` setter, `getCardSize`, `getConfigElement`/`getStubConfig` (editor required by spec FR-009/FR-010) all implemented; no `hass` mutation; only `hass-more-info` event dispatched (no service/WS calls) | PASS |
| IV. Consistent, Accessible Lovelace UX | Render via HA theme CSS custom properties only; `aria-label` per appliance icon; keyboard-operable (tap target is a focusable, `Enter`/`Space`-activatable element); graceful unavailable/missing-entity handling (spec Edge Cases) | PASS |
| V. Simplicity & Long-Term Maintainability | `lit` treated as already-loaded (zero added weight); `custom-card-helpers` is the only new runtime dependency, justified in research.md against hand-rolling `fireEvent`/change-detection; SemVer + CHANGELOG per release | PASS |

No violations identified. Complexity Tracking table omitted (not required).

**Post-Phase-1 re-check**: `data-model.md` and `contracts/` introduce no new
runtime dependency, no new `hass.callService`/`hass.callWS` usage, and no
deviation from the lifecycle contract above — all five principles still PASS
unchanged after design.

## Project Structure

### Documentation (this feature)

```text
specs/001-configurable-appliance-cards/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── card-config.md
│   └── lifecycle-events.md
└── tasks.md               # Phase 2 output (/speckit-tasks command - NOT created here)
```

### Source Code (repository root)

```text
src/
├── ha-simple-appliance-card.ts   # Card custom element: setConfig, hass setter, getCardSize, render
├── editor.ts                      # Visual config editor custom element: getConfigElement/getStubConfig target
├── presets.ts                     # Built-in heating preset definitions (Heat Pump, Gas Boiler, Hot Water, Heating Circuit)
├── state.ts                       # Pure logic: primary/target value read + threshold-based active/inactive/unavailable derivation
├── config.ts                      # Config validation/normalization for setConfig (required/optional fields, defaults)
├── types.ts                       # ApplianceConfig, CardConfig, AppliancePreset, DerivedState types
├── styles.ts                      # Shared CSS using HA theme custom properties (light/dark safe)
└── index.ts                       # Entry point: registers card + editor elements, populates window.customCards

tests/
├── unit/                          # No DOM — pure logic, subject to the 80% branch-coverage gate
│   ├── state.test.ts
│   ├── presets.test.ts
│   └── config.test.ts
└── component/                     # Real-browser custom element tests via @web/test-runner
    ├── card.test.ts
    └── editor.test.ts

dist/                              # Build output only (constitution: never hand-edited)
└── ha-simple-appliance-card.js

hacs.json                          # HACS distribution metadata
package.json
tsconfig.json
rollup.config.mjs
web-test-runner.config.mjs
.eslintrc.cjs
README.md
CHANGELOG.md
```

**Structure Decision**: Single frontend package (no backend). The generic
"single project" template (`models/services/cli/lib`) doesn't fit a Lovelace
custom card, so `src/` is organized by the card's own concerns instead: the card
element, the editor element, preset data, pure state-derivation logic, and shared
types/styles. Tests are split into `unit/` (pure logic, no DOM — where the
constitution's 80% branch-coverage floor applies) and `component/` (real-browser
custom-element behavior). Build output stays isolated in `dist/`, matching the
constitution's `src/` vs `dist/` separation requirement.
