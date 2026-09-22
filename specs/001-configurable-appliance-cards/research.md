# Phase 0 Research: Configurable Appliance Cards

## 1. Component framework

**Decision**: `lit` (LitElement), declared as a normal `import` but treated as
already present in the browser at runtime (Home Assistant's own frontend loads
Lit for its own components; the constitution's Principle V explicitly names `lit`
as a primitive to prefer over new dependencies).

**Rationale**: Every actively maintained HA custom card in the ecosystem is built
on Lit; using anything else forces users to load a second reactive-rendering
library alongside the one Home Assistant already ships, directly violating
Principle V (bundle-size/maintenance justification). Lit's `@customElement`,
`@property`/`@state` decorators and scoped-style `css` tagged template map
cleanly onto the required custom-card lifecycle (`setConfig`, `hass` setter,
`render()`).

**Alternatives considered**: Vanilla `HTMLElement` (no framework) — rejected,
would hand-roll change detection and templating that Lit already provides for
free and that reviewers/contributors familiar with the ecosystem already expect.
React/Preact — rejected outright by Principle V (adds a second, heavier rendering
runtime purely for a handful of icons).

## 2. Helper utilities

**Decision**: Add `custom-card-helpers` as the one new runtime dependency, used
only for `fireEvent` (dispatching the `hass-more-info` event) and
`hasConfigOrEntityChanged` (cheap re-render gating).

**Rationale**: Both functions are a few lines each; every other maintained custom
card depends on this package for exactly this reason, so config/editor code reads
the same way a reviewer already expects. The package has no further transitive
dependencies and is typically inlined at a few hundred bytes after tree-shaking.

**Alternatives considered**: Hand-rolled equivalents — rejected; the maintenance
and bug-surface cost of re-implementing `fireEvent`'s bubbling/composed event
construction is not worth avoiding a near-zero-weight, ecosystem-standard
dependency. This satisfies Principle V's "justify in the PR description" bar at
the research stage.

## 3. Build tool

**Decision**: Rollup, producing a single IIFE bundle (`dist/ha-simple-appliance-card.js`)
with `lit` external (loaded from the HA frontend's own module graph) and
`custom-card-helpers` bundled in.

**Rationale**: Rollup is the toolchain most HACS Lovelace cards already use, has
first-class support for marking a dependency `external` while still bundling
others, and produces a clean single-file browser bundle without extra runtime
loader code — matching the constitution's "single self-contained JavaScript
bundle" requirement exactly.

**Alternatives considered**: esbuild — also acceptable per the constitution
(`Rollup or esbuild`) and faster, but Rollup's plugin ecosystem for
"bundle-this-dependency, externalize-that-one" is more mature and better
documented for this exact HA-custom-card pattern, so it was chosen for lower
long-term maintenance risk.

## 4. Testing stack

**Decision**: `@web/test-runner` running specs in real headless Chromium, with
`@open-wc/testing` for `fixture()`/`html` component-test helpers, plus
plain Mocha-style `describe`/`it` unit tests (no DOM) for pure logic, all under
one `c8` coverage report gating the constitution's 80% branch-coverage floor on
non-DOM logic (`state.ts`, `presets.ts`, `config.ts`).

**Rationale**: Lit's own documented testing pattern uses `@web/test-runner` in a
real browser rather than a DOM-emulation layer, because shadow DOM, CSS custom
property inheritance (needed to verify HA theme-variable rendering per
constitution Principle IV), and custom-element upgrade timing don't reliably
match real-browser behavior otherwise.

**Alternatives considered**: Vitest + `jsdom` — rejected as the primary tool;
jsdom's shadow DOM and CSS custom property support is incomplete enough that a
test asserting "the appliance renders using `--primary-color`" could pass in
jsdom and still be wrong in a real browser, undermining Principle IV's
verification story. Vitest remains a fine choice for pure-logic unit tests in
isolation, but using one runner for both keeps the test setup and coverage
report unified.

## 5. State-active threshold model

**Decision**: An appliance's active/inactive indicator is computed from its
primary entity's value: numeric entities (`sensor`, `number`) are active when
`Number(state) > threshold` (default `threshold = 0`, overridable per appliance);
non-numeric entities fall back to their base HA `state !== 'off'` (and
`!== 'unavailable'`/`'unknown'`, which map to the distinct unavailable indicator
per spec FR-002).

**Rationale**: Confirmed against the real reference Home Assistant heating
dashboard during `/speckit-clarify`: all 4 source icons key off numeric sensor
values (burner power, pump modulation %), not a switch/climate on-off state, so
a pure domain-based on/off check would misrepresent every preset appliance.

**Alternatives considered**: Domain-specific logic per entity domain (e.g. read
`hvac_action` for `climate`, `state` for `switch`) — rejected as the general
rule; adds a growing per-domain special-case table for marginal benefit, since
the numeric-threshold rule already correctly covers every entity type the
built-in preset targets, and any domain can still be pointed at manually with an
appropriate threshold.

## 6. Tap interaction

**Decision**: Tapping an appliance dispatches the standard Home Assistant
`hass-more-info` custom event (`bubbles: true, composed: true`, detail
`{ entityId }`) via `fireEvent`, opening the platform's own more-info dialog.

**Rationale**: This is the documented, ecosystem-standard way a custom card
delegates to Home Assistant's own entity dialog without reimplementing it or
calling any service/WebSocket API directly — satisfying both spec FR-007 and the
constitution's Principle III restriction against calling `hass.callService`/
`hass.callWS` outside documented user-triggered actions (this isn't a service
call at all).

**Alternatives considered**: Direct `hass.callService('homeassistant', 'toggle', ...)`
on tap — rejected per the clarified spec (FR-007 explicitly chose the platform
default dialog over a custom toggle action).

## 7. HACS distribution

**Decision**: Ship a root `hacs.json` (`name`, `render_readme: true`,
`content_in_root: false`, `filename: ha-simple-appliance-card.js`) plus a GitHub
Release per version with the built `dist/ha-simple-appliance-card.js` attached,
so users add this repository as a HACS "custom repository" (category:
"Lovelace") and HACS fetches the release asset directly.

**Rationale**: This is the documented HACS integration contract for a
single-file Lovelace card and requires no submission to the default HACS store,
matching spec FR-008/Assumptions exactly.

**Alternatives considered**: Committing `dist/` directly to `main` and pointing
`hacs.json` at the repo root — rejected; mixes generated build output into
version-controlled source history, conflicting with the constitution's `src/`
vs `dist/` separation and the Development Workflow's CI-builds-on-every-PR gate.
