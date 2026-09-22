<!--
Sync Impact Report
Version change: (none) → 1.0.0
Modified principles: n/a (initial ratification)
Added sections:
  - Core Principles: I. Type-Safe, Lint-Clean Code; II. Test-First Development;
    III. Home Assistant Contract Compliance; IV. Consistent, Accessible Lovelace UX;
    V. Simplicity & Long-Term Maintainability
  - Technology & Build Standards
  - Development Workflow & Quality Gates
  - Governance
Removed sections: none
Deferred TODOs: none
-->

# ha-simple-appliance-card Constitution

## Core Principles

### I. Type-Safe, Lint-Clean Code
All source code MUST be written in TypeScript with `strict` mode enabled; `any` is
forbidden except at documented Home Assistant API boundaries where upstream types are
missing, and each such exception MUST carry an inline comment naming the reason.
ESLint and Prettier MUST run clean (zero errors) before merge. Public card behavior
(config schema, editor fields, exposed CSS custom properties) MUST be typed and
exported so consumers and tests share one source of truth.
Rationale: a Lovelace card runs inside a user's live dashboard with no sandbox;
type errors and lint violations are the cheapest defects to catch and the most
expensive to debug in a stranger's browser console.

### II. Test-First Development (NON-NEGOTIABLE)
Every bug fix and feature MUST begin with a failing unit test that reproduces it,
written and reviewed before implementation code is written (Red-Green-Refactor).
Card logic that does not require a DOM or `hass` object (config parsing, state
derivation, formatting, validation) MUST reach a minimum of 80% branch coverage.
`setConfig()` MUST have explicit tests for missing required fields, invalid types,
and valid minimal/maximal configs.
Rationale: Lovelace cards have no compiler-enforced contract with the dashboard
YAML users write; tests are the only guard against silently broken configs shipped
to end users.

### III. Home Assistant Contract Compliance
The card MUST implement the standard custom-card lifecycle exactly as Home
Assistant expects: `setConfig(config)`, the `hass` setter, `getCardSize()`, and,
when an editor is offered, `getConfigElement()` / `getStubConfig()`. The card
MUST NOT mutate the `hass` object or call `hass.callService`/`hass.callWS` outside
documented user-triggered actions. Every entity domain and service the card reads
or calls MUST be documented in the README. Breaking changes to the config schema
MUST ship a migration path or a major version bump, never a silent behavior change.
Rationale: the card is a guest inside Home Assistant's frontend; violating its
lifecycle contract or state-management assumptions breaks dashboards outside this
project's own test suite and is hard for users to diagnose.

### IV. Consistent, Accessible Lovelace UX
The card MUST render correctly using Home Assistant theme variables (`--primary-color`,
`--card-background-color`, etc.) in both light and dark themes; hard-coded colors
are forbidden outside of semantic status colors (e.g. error/warning states), which
MUST still be theme-override-able. Interactive elements MUST be keyboard-operable
and carry accessible names (`aria-label` or visible text). The card MUST degrade
gracefully (clear error message, not a blank tile or thrown exception) when given
a missing or unavailable entity.
Rationale: users cannot patch a third-party card's CSS or fix a crash from their
dashboard; visual and functional breakage is a support burden this project owns.

### V. Simplicity & Long-Term Maintainability
New runtime dependencies MUST be justified in the PR description against the cost
of the increased bundle size and long-term maintenance burden; prefer Home
Assistant's own frontend primitives (`lit`, `custom-card-helpers`) already loaded
by the dashboard over adding new libraries. Every public function and exported
type MUST have a single, stated responsibility. Dead code and unused config
options MUST be removed rather than commented out. Semantic Versioning (MAJOR.MINOR.PATCH)
governs all releases; the CHANGELOG MUST be updated in the same PR as the change
it describes.
Rationale: this card is maintained part-time; complexity and undocumented history
compound faster than they can be paid down, and the fix is discipline at merge time.

## Technology & Build Standards

The build MUST produce a single self-contained JavaScript bundle (via Rollup or
esbuild) with no unresolved runtime imports, matching HACS distribution
requirements. The bundle MUST target the browser baseline Home Assistant's own
frontend supports; no Node-only APIs may leak into the built artifact. `hacs.json`
and the repository README MUST stay in sync with the actual installation path,
minimum Home Assistant version, and card name. Source and build output MUST be
kept in separate directories (`src/` vs `dist/`), and `dist/` MUST NOT be hand-edited.

## Development Workflow & Quality Gates

Every change lands through a pull request; direct pushes to `main` are prohibited
except for this constitution and repository metadata. CI MUST run lint, type-check,
unit tests, and the production build on every PR, and all four MUST pass before
merge. A PR that changes card-visible behavior (config schema, rendering, editor)
MUST include a before/after screenshot or short clip in the description. Releases
are cut only from `main` after CI is green, tagged with the semantic version, and
accompanied by a CHANGELOG entry.

## Governance

This constitution supersedes ad hoc practice for this repository. Amendments
require a PR that edits this file, states the version bump and rationale in the
Sync Impact Report comment, and is merged like any other change under the
Development Workflow gates above. Versioning policy: MAJOR for removal or
incompatible redefinition of a principle, MINOR for a new principle or materially
expanded guidance, PATCH for wording/clarification only. Every PR MUST be
reviewable against these principles; a reviewer MAY block a PR solely for
violating one, and any deliberate exception MUST be justified in the PR
description rather than silently merged.

**Version**: 1.0.0 | **Ratified**: 2026-09-22 | **Last Amended**: 2026-09-22
