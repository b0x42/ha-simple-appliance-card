# Tasks: Configurable Appliance Cards

**Input**: Design documents from `/specs/001-configurable-appliance-cards/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. Constitution Principle II ("Test-First Development
(NON-NEGOTIABLE)") mandates a failing test before implementation for every
change, so test tasks are not optional here — they precede their corresponding
implementation task in every phase below.

**Organization**: Tasks are grouped by user story (spec.md P1/P2/P3) so each
story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unmet dependencies)
- **[Story]**: US1 / US2 / US3, from spec.md
- File paths are exact, per plan.md's Project Structure

## Path Conventions

Single frontend package per plan.md: `src/` (card, editor, presets, state,
config, types, styles) and `tests/unit/` + `tests/component/` at repository
root; build output isolated in `dist/`.

---

## Phase 1: Setup

**Purpose**: Project scaffolding and toolchain, per plan.md Technical Context
and research.md §§1-4, 7.

- [X] T001 Create directory structure per plan.md Project Structure: `src/`,
      `tests/unit/`, `tests/component/`, `dist/` (empty, git-ignored contents)
- [X] T002 Initialize `package.json`: `lit` and `custom-card-helpers` as
      bundled runtime dependencies (research.md §1 correction), `typescript`,
      `rollup` + plugins, `@web/test-runner` (+`-playwright`), `@open-wc/testing`,
      `eslint`, `prettier` as devDependencies (research.md §§1-4)
- [X] T003 [P] Configure `tsconfig.json` with `strict: true` per constitution
      Principle I ("All source code MUST be written in TypeScript with `strict`
      mode enabled")
- [X] T004 [P] Configure `eslint.config.mjs` (flat config, required by
      ESLint 9) + Prettier so both "MUST run clean (zero errors) before merge"
      per constitution Principle I
- [X] T005 [P] Configure `rollup.config.mjs`: bundle `lit` and
      `custom-card-helpers` into a single IIFE output
      `dist/ha-simple-appliance-card.js`, per research.md §3 and the
      constitution's "single self-contained JavaScript bundle" requirement
- [X] T006 [P] Configure `web-test-runner.config.mjs` (headless Chromium via
      `@web/test-runner-playwright`) with its built-in coverage reporter
      enforcing the 80% branch-coverage floor on `src/state.ts`,
      `src/presets.ts`, `src/config.ts` per constitution Principle II
- [X] T007 [P] Create root `hacs.json` (`name`, `render_readme: true`,
      `content_in_root: false`, `filename: ha-simple-appliance-card.js`) per
      research.md §7 and spec FR-008

**Checkpoint**: Toolchain builds and tests can run (on empty/stub sources).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, config validation, and state-derivation logic every
user story depends on. **MUST complete before any user-story phase.**

- [X] T008 [P] Write unit tests for config validation in
      `tests/unit/config.test.ts`: reject a config missing `entity` ("`entity`
      MUST be present and a non-empty string; `setConfig` throws a descriptive
      error otherwise"), reject wrong-typed `target_entity`/`name`/`icon`/
      `active_threshold` when present, accept a minimal valid config
      (`{ entity: '...' }`) and a maximal one (all optional fields set), accept
      an absent/empty `appliances` array as valid — per data-model.md
      `Appliance`/`CardConfig` validation rules. Tests MUST fail (no
      implementation yet).
- [X] T009 Define shared types in `src/types.ts`: `Appliance`, `AppliancePreset`,
      `CardConfig`, `DerivedState` exactly matching the field tables in
      data-model.md (`Appliance`: `entity: string` required, `active_entity?`,
      `target_entity?`, `name?`, `icon?`, `active_threshold?: number` default
      `0`; `CardConfig`: `type`, `appliances: Appliance[]` default `[]`,
      `title?`) — `active_entity` added during `/speckit-implement` per
      research.md §5's correction (kb.internal/heating-dashboard-icons.html)
- [X] T010 Implement `src/config.ts` `setConfig` validation/normalization
      satisfying T008: throw when `appliances` is present but not an array;
      throw when any entry is missing `entity` or has a wrong-typed optional
      field; treat an absent/empty `appliances` array as valid (depends on
      T009)
- [X] T011 [P] Write unit tests for state derivation in `tests/unit/state.test.ts`:
      both active-state modes from research.md §5 (separate boolean
      `active_entity` → `is_state(x,'on')`; fallback numeric primary value
      `> active_threshold` default `0`, or non-numeric `state !== 'off'`),
      `unavailable`/`unknown`/missing → `'unavailable'` in both modes, and the
      target-display collapse rule (research.md §5a) via `deriveTargetDisplay`.
      Tests MUST fail (no implementation yet). Reworked during
      `/speckit-implement` per the kb.internal correction (see research.md §5).
- [X] T012 Implement `src/state.ts` `deriveActiveState` (both modes from
      research.md §5) and `deriveTargetDisplay` (collapse rule, research.md
      §5a) satisfying T011, reading entities from `hass.states`; treat any
      `entity`/`active_entity`/`target_entity` absent from `hass.states`
      identically to state `unavailable`/`unknown` (no separate "not found"
      case), per data-model.md's derived-value table (depends on T009)
- [X] T013 [P] Create `src/styles.ts`: shared CSS using only Home Assistant
      theme custom properties (`--primary-color`, `--card-background-color`,
      etc.), no hard-coded colors outside theme-overridable semantic
      status colors, per constitution Principle IV

**Checkpoint**: Foundation ready — user story phases can begin.

---

## Phase 3: User Story 1 - Configure a custom set of appliances (Priority: P1) 🎯 MVP

**Goal**: A user adds the card to a dashboard, configures a list of their own
entities (via YAML or the visual editor), each optionally named/iconed, and
sees each render as a live-updating icon.

**Independent Test**: Add the card with a YAML config listing 1+ entities;
confirm each renders as an icon reflecting live state, and that a name/icon
override is honored.

### Tests for User Story 1

- [X] T014 [P] [US1] Write component tests in `tests/component/card.test.ts`:
      one configured appliance renders one icon reflecting its entity's
      current state (Acceptance Scenario 1.1); a live `hass` state change
      updates the rendered icon without re-adding the element, asserting the
      updated icon is visible within 2 seconds of the state change per spec
      SC-004 (1.2); a configured `name`/`icon` override is shown instead of
      the entity's own (1.3). Tests MUST fail (no implementation yet). Later
      extended with the target-display collapse rule (FR-003a) during the
      kb.internal rework — see research.md §5a.
- [X] T015 [P] [US1] Write component tests in `tests/component/editor.test.ts`:
      adding, editing, removing, and reordering an appliance row each produce
      a correctly-shaped `config-changed` event per
      `contracts/lifecycle-events.md`. Tests MUST fail (no implementation yet).

### Implementation for User Story 1

- [X] T016 [US1] Implement the `ha-simple-appliance-card` custom element
      skeleton in `src/ha-simple-appliance-card.ts`: `setConfig()` delegating
      to `src/config.ts` (T010), `hass` setter, `getCardSize()` (depends on
      T010). Implemented without Lit decorators (`static properties` +
      `declare` fields + explicit `customElements.define`) — the esbuild
      transform used by `@web/test-runner` didn't reliably honor
      `tsconfig.json`'s legacy-decorator settings; this sidesteps that
      toolchain fragility entirely rather than fighting the transform config.
- [X] T017 [US1] Implement appliance icon rendering with the
      active/inactive/unavailable indicator from `src/state.ts` in
      `src/ha-simple-appliance-card.ts`, satisfying T014 (depends on T012,
      T013, T016). Also includes the current-vs-target rendering originally
      scoped to T028 (built together since both live in the same render
      method; reworked in place for the collapse rule during the kb.internal
      correction) and the tap/keyboard handling originally scoped to
      T030/T031 (same reasoning).
- [X] T018 [US1] Implement per-appliance name/icon override fallback (configured
      value, else the entity's own `friendly_name`/`icon`) in
      `src/ha-simple-appliance-card.ts` per FR-004 (depends on T017)
- [X] T019 [US1] Guard re-renders to only happen on relevant entity state
      changes, in `src/ha-simple-appliance-card.ts` (depends on T016).
      Implemented as a Lit `shouldUpdate()` override comparing each
      appliance's relevant entity IDs (`entity`, `active_entity`,
      `target_entity`) between old/new `hass`, rather than importing
      `custom-card-helpers`' `hasConfigOrEntityChanged` — that helper assumes
      a single `config.entity`, which doesn't fit this card's
      multiple-appliances-per-instance config shape; the local `shouldUpdate`
      generalizes the same technique (entity-state-reference comparison) to a
      list.
- [X] T020 [US1] Implement the `ha-simple-appliance-card-editor` custom
      element base in `src/editor.ts`: entity picker, name/icon override
      fields, add/remove/reorder appliance rows, dispatching `config-changed`
      per `contracts/lifecycle-events.md`, satisfying T015 (depends on T010).
      Entity/target "picker" fields are plain text inputs (not
      `ha-entity-picker`) — kept dependency-free and fully testable outside a
      live Home Assistant instance; still satisfies FR-010's "picking an
      entity... through the Lovelace UI."
- [X] T021 [US1] Implement static `getConfigElement()`/`getStubConfig()` on the
      card, wiring to the editor, in `src/ha-simple-appliance-card.ts` per
      FR-009/FR-010 (depends on T016, T020)
- [X] T022 [US1] Register both custom elements and the `window.customCards`
      entry in `src/index.ts` per `contracts/lifecycle-events.md`'s
      Registration contract (depends on T016, T020)

**Checkpoint**: User Story 1 fully functional and independently testable —
this is the MVP.

---

## Phase 4: User Story 2 - Start fast with the built-in heating preset (Priority: P2)

**Goal**: A user applies the built-in 4-appliance heating preset by supplying
only entity IDs, getting preset default names/icons, with per-slot overrides
still respected.

**Independent Test**: Apply the preset with 4 entity IDs only; confirm all 4
render with preset defaults, and that overriding one slot leaves the rest on
defaults.

### Tests for User Story 2

- [X] T023 [P] [US2] Write unit tests in `tests/unit/presets.test.ts`: the
      4 fixed preset slots (`circulation_pump`, `gas_burner` primary-only,
      numeric-threshold mode; `hot_water`, `heating_circuit`
      primary+active_entity+target) each produce an `Appliance` using the
      preset's `name`/`icon`/`default_active_threshold` when the slot's
      required entity ID(s) are supplied (one for the primary-only slots;
      primary + active + target for the other two), per data-model.md
      `AppliancePreset`. Tests MUST fail (no implementation yet).
- [X] T024 [P] [US2] Write component tests in `tests/component/editor.test.ts`:
      applying the heating preset with each slot's required entity ID(s)
      produces 4 appliances with preset defaults (Acceptance Scenario 2.1);
      overriding one slot's name/icon leaves the other 3 on preset defaults
      (2.2). Tests MUST fail (no preset action implemented yet).

### Implementation for User Story 2

- [X] T025 [US2] Implement the 4 built-in preset definitions in
      `src/presets.ts` per data-model.md `AppliancePreset` table (depends on
      T009)
- [X] T026 [US2] Implement preset-application logic (per-slot entity ID(s) →
      `Appliance[]` using preset defaults) in `src/presets.ts`, satisfying
      T023 (depends on T025)
- [X] T027 [US2] Add an "Apply built-in heating preset" action to the editor
      (entity-ID inputs per slot's roles → calls preset-application, emits
      `config-changed`) in `src/editor.ts`, satisfying T024 (depends on T020,
      T026)
- [x] T028 [US2] ~~Implement current-vs-target rendering for appliances with a
      `target_entity`~~ — **done early as part of T017** (both live in the
      same `_renderAppliance` method); reworked in place for the collapse
      rule (research.md §5a) during the kb.internal correction, with its own
      tests in `tests/component/card.test.ts` and `tests/unit/state.test.ts`.
      No separate work remains for this task.

**Checkpoint**: User Stories 1 and 2 both independently functional.

---

## Phase 5: User Story 3 - Inspect and control an appliance via Home Assistant's standard dialog (Priority: P3)

**Goal**: Tapping a configured appliance opens Home Assistant's standard
more-info dialog for its entity.

**Independent Test**: Tap a configured appliance icon; confirm the standard
more-info dialog opens for the underlying entity, including when that entity
is unavailable.

### Tests for User Story 3

- [x] T029 [P] [US3] Write component tests in `tests/component/card.test.ts`:
      tapping an appliance dispatches `hass-more-info` with
      `detail.entityId` equal to the appliance's primary entity (Acceptance
      Scenario 3.1), including when that entity is unavailable (3.2), per
      `contracts/lifecycle-events.md`. **Process deviation, noted for
      transparency**: the tap handler (T030/T031) was implemented early as
      part of T017 before this test existed, so this ran green rather than
      red-then-green — the constitution's test-first intent was not honored
      for this one task; recorded here rather than silently left as if it
      had been.

### Implementation for User Story 3

- [x] T030 [US3] Implement a tap/click handler on each appliance icon
      dispatching `hass-more-info` via `fireEvent(this, 'hass-more-info',
      { entityId })` in `src/ha-simple-appliance-card.ts` — **done early as
      part of T017** (depends on T017)
- [x] T031 [US3] Make each appliance icon a focusable, `Enter`/`Space`-
      activatable element with an `aria-label` (entity's display name) in
      `src/ha-simple-appliance-card.ts` per constitution Principle IV — **done
      early as part of T017** (depends
      on T030)

**Checkpoint**: All 3 user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T032 [P] Implement the empty-state message when `appliances` is empty
      in `src/ha-simple-appliance-card.ts`, per spec Edge Cases
- [X] T033 [P] Implement wrap-to-additional-rows layout for more appliances
      than fit one row, in `src/styles.ts`, per spec Edge Cases
- [X] T034 [P] Add a component-test regression case in
      `tests/component/card.test.ts` for the same `entity` configured as two
      appliances, confirming both render independently with matching live
      state, per spec Edge Cases
- [X] T035 [P] Add a component-test regression case in
      `tests/component/card.test.ts` for a `target_entity` that's unavailable
      while the primary entity is not, confirming the primary still renders
      and only the target shows unavailable, per spec Edge Cases
- [X] T036 [P] Write `README.md` § Installation: step-by-step HACS
      custom-repository install (add repository URL, category Lovelace,
      install, add resource if needed), per FR-011 and spec Assumptions
      (HACS already installed)
- [X] T037 [P] Write `README.md` § Configuration Reference: a table of every
      `Appliance` field (`entity`, `active_entity`, `target_entity`, `name`,
      `icon`, `active_threshold`) and every `CardConfig` field (`type`,
      `appliances`, `title`) with type, required/optional, and default, taken
      verbatim from data-model.md's field tables, per FR-011 (depends on T009
      for final field names)
- [X] T038 [P] Write `README.md` § Examples: four worked YAML examples —
      minimal single-appliance, name/icon override, built-in heating preset
      (4 slots, including a `hot_water`/`heating_circuit` slot showing
      `active_entity` + `target_entity` together), and a standalone appliance
      with a `target_entity` — matching `contracts/card-config.md`, per
      FR-011/SC-006
- [X] T039 [P] Write `README.md` § Entities & Events: document every entity
      domain the card reads (`sensor`, `number`, and any domain a user points
      it at) and the one event it emits (`hass-more-info`); no services are
      called — per constitution Principle III
- [X] T040 [P] Write initial `CHANGELOG.md` entry for `0.1.0` per constitution
      Principle V
- [X] T041 Verify `npm run build` produces a single `dist/ha-simple-appliance-card.js`
      with no unresolved runtime imports, per constitution's Technology & Build
      Standards (depends on T005, and on all `src/` implementation tasks)
- [ ] T042 Run through `quickstart.md` end-to-end against a real or test Home
      Assistant instance and record results (depends on T041)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. Blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational only.
- **User Story 2 (Phase 4)**: Depends on Foundational; T028 additionally
  depends on US1's T017 (icon rendering) existing.
- **User Story 3 (Phase 5)**: Depends on Foundational; T030 additionally
  depends on US1's T017 (icon rendering) existing.
- **Polish (Phase 6)**: Depends on all three user stories being complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on US2/US3. This is the MVP.
- **US2 (P2)**: Reuses US1's rendering (T017) for current-vs-target display
  (T028) but is otherwise independently testable (preset logic in
  `src/presets.ts` has no US1 dependency).
- **US3 (P3)**: Reuses US1's rendering (T017) as the tap target but is
  otherwise independently testable.

### Within Each Phase

- Tests MUST be written and FAIL before their corresponding implementation
  task (constitution Principle II).
- Types (T009) before validation/state logic (T010, T012).
- Card skeleton (T016) before card rendering/behavior (T017-T021, T028, T030).
- Editor base (T020) before preset action (T027).

### Parallel Opportunities

- T003-T007 (Setup, all different config files).
- T008 and T011 (different test files, no shared dependency).
- T014 and T015 (different test files).
- T023 and T024 (different test files).
- T032-T040 (Polish, all different files; T036-T039 all edit different
  sections of the same `README.md`, so treat as parallel-safe only if each
  contributor appends their own section rather than overwriting the file).
- Once Foundational (Phase 2) is done, US1, US2, and US3 test-writing tasks
  (T014/T015, T023/T024, T029) can all start in parallel; their implementation
  tasks that touch `src/ha-simple-appliance-card.ts` (T017-T019, T028, T030,
  T031) share one file and so are sequential regardless of story.

---

## Parallel Example: Phase 2 (Foundational)

```bash
Task: "Write unit tests for config validation in tests/unit/config.test.ts"
Task: "Write unit tests for state derivation in tests/unit/state.test.ts"
Task: "Create shared styles in src/styles.ts using HA theme CSS custom properties"
```

## Parallel Example: User Story 1 tests

```bash
Task: "Write component tests in tests/component/card.test.ts for render/live-update/override"
Task: "Write component tests in tests/component/editor.test.ts for add/edit/remove/reorder"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational (blocks everything)
3. Phase 3: User Story 1
4. **STOP and VALIDATE**: run `tests/unit` + `tests/component` for US1, and the
   relevant `quickstart.md` steps (§§2-3), independently of US2/US3
5. This is a demoable MVP: manual YAML configuration, live state, name/icon
   overrides, and the visual editor for arbitrary entities

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add US1 → validate independently → MVP
3. Add US2 (preset) → validate independently (`quickstart.md` §4)
4. Add US3 (tap → more-info) → validate independently (`quickstart.md` §5)
5. Phase 6 polish (edge cases, README, build verification, full
   `quickstart.md` run)

---

## Notes

- `src/ha-simple-appliance-card.ts` is touched by tasks across all three user
  stories (T017-T019 in US1; T028 in US2; T030-T031 in US3) — these are
  correctly unmarked `[P]` and must run in task-ID order even when stories are
  otherwise being worked in parallel by different people.
- Commit after each task or logical group, per constitution Development
  Workflow.
- Stop at any checkpoint to validate a story independently before continuing.
