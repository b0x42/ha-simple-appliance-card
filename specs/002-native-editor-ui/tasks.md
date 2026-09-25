# Tasks: Native-Style Card Editor UI

**Input**: Design documents from `/specs/002-native-editor-ui/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included for new structural additions (leading-icon slot,
`.field-row` wrapper, type-dropdown click-reliability regression guard), per
constitution Principle II ("every feature MUST begin with a failing test").
No new *pure logic* is introduced (data-model.md), so the 80%-branch-coverage
gate is unaffected — these are component/DOM tests in
`tests/component/editor.test.ts`, alongside the existing suite that MUST stay
green unchanged (`contracts/editor-dom-contract.md`).

**Organization**: Tasks are grouped by user story (spec.md P1/P2/P3) so each
story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unmet dependencies)
- **[Story]**: US1 / US2 / US3, from spec.md
- File paths are exact, per plan.md's Project Structure

## Path Conventions

Single frontend package, restyle scoped to two files per plan.md: `src/editor.ts`
(markup) and `src/styles.ts` (CSS). Tests in `tests/component/editor.test.ts`.
No other source file changes (plan.md Project Structure).

---

## Phase 1: Setup

**Purpose**: Confirm a clean starting point before any restyle work.

- [ ] T001 Run `npm run lint` and `npm test` on the current tree (no file
      changes) and confirm both pass — establishes the pre-restyle baseline
      that `tests/component/editor.test.ts`'s existing assertions must keep
      passing unchanged throughout this feature (SC-002).

**Checkpoint**: Baseline green. Safe to start restyle work.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared row-container CSS that User Story 1 and User Story 3 both
build on. **MUST complete before those stories' implementation tasks.**

- [ ] T002 Add a `.field-row` base rule to `editorStyles` in `src/styles.ts`:
      filled background via `var(--secondary-background-color, ...)`,
      `border-radius: var(--ha-card-border-radius, 12px)`, and consistent
      padding — the shared filled-row container research.md §4 designs
      around the existing floating-label behavior `ha-entity-picker`/
      `ha-textfield` already provide. Theme-variable-only colors (FR-004,
      constitution Principle IV) — no hard-coded values.

**Checkpoint**: `.field-row` class exists and is ready to wrap fields in.
User Story 1, 2, and 3 phases can now proceed (US2 doesn't depend on this
class, but still requires this phase complete per the Setup→Foundational→
Stories ordering).

---

## Phase 3: User Story 1 - Editor reads as a native HA settings screen (Priority: P1) 🎯 MVP

**Goal**: Every entity-picker and text-field row in the editor renders as a
filled, rounded, label-above-value row matching native HA styling, correctly
themed in both light and dark.

**Independent Test**: Open the card editor with appliances configured;
compare row styling side-by-side with a stock HA settings screen in both a
light and a dark theme (spec User Story 1 Independent Test).

### Tests for User Story 1

- [ ] T003 [P] [US1] In `tests/component/editor.test.ts`, add an assertion
      that each of `[data-field="entity"]`, `[data-field="active_entity"]`,
      `[data-field="target_entity"]`, `[data-field="name"]`,
      `[data-field="icon"]`, `[data-field="active_threshold"]` is contained
      within an ancestor `.field-row` element. Test MUST fail before
      implementation (no `.field-row` wrapper exists yet).

### Implementation for User Story 1

- [ ] T004 [US1] In `_entityPicker()` (`src/editor.ts`), wrap the rendered
      `<ha-entity-picker>` in a `.field-row` container (implements T003 for
      the three entity-picker fields).
- [ ] T005 [US1] In `_textField()` (`src/editor.ts`), wrap the rendered
      `<ha-textfield>` in a `.field-row` container (implements T003 for the
      three text fields).
- [ ] T006 [P] [US1] Restyle the `.row-actions` remove/move `ha-icon-button`s
      in `editorStyles` (`src/styles.ts`) — spacing, icon treatment,
      hover/focus state — so they read as part of the same restyled section
      chrome rather than an unstyled leftover (FR-010).
- [ ] T007 [US1] Audit all rules touched or added in `editorStyles`
      (`src/styles.ts`) — `.field-row`, `.row-actions`, existing
      `ha-expansion-panel`/`.appliance-row` rules — and confirm every color
      value is a Home Assistant theme CSS custom property (FR-004,
      constitution Principle IV); fix any hard-coded value found.
- [ ] T008 [US1] Manual: run `quickstart.md` steps 1–3 (row-styling
      side-by-side comparison against native HA — this is User Story 1's
      own stated Independent Test — plus dark theme, light theme row-color
      check) in a live/dev Home Assistant instance; fix any styling or
      theme-variable gap found.

**Checkpoint**: User Story 1 is fully functional and independently testable —
every field row matches native HA row styling in both themes, and
`tests/component/editor.test.ts`'s pre-existing assertions still pass
unchanged.

---

## Phase 4: User Story 2 - Appliance sections collapse like native grouped settings (Priority: P2)

**Goal**: Each appliance renders as a collapsible section with a leading
icon, bold title, and chevron; sections collapse/expand independently; a
blank new appliance gets a sensible fallback label and icon.

**Independent Test**: With 3+ appliances configured, collapse all sections
and confirm each shows a leading icon, name, and chevron; clicking one
expands only that section (spec User Story 2 Independent Test).

### Tests for User Story 2

- [ ] T009 [P] [US2] In `tests/component/editor.test.ts`, add an assertion
      that each appliance's `ha-expansion-panel` contains a child
      `<ha-icon slot="leading-icon">` whose `icon` attribute equals the
      appliance's configured `icon` when set, and the fallback icon
      constant (T010) when not set. Also add an assertion for FR-003: with
      2+ appliances rendered, expanding one panel (set/toggle its
      `expanded` property or click its header) leaves every other panel's
      `expanded` state unchanged. Test MUST fail before implementation.

### Implementation for User Story 2

- [ ] T010 [US2] In `src/editor.ts`, add a local fallback-icon constant
      (value `'mdi:power-plug'`, intentionally mirroring `DEFAULT_ICON` in
      `src/ha-simple-appliance-card.ts` per research.md §3 — duplicated
      rather than imported, since this feature's file scope is
      `src/editor.ts`/`src/styles.ts` only per plan.md).
- [ ] T011 [US2] In `_renderRow()` (`src/editor.ts`), add
      `<ha-icon slot="leading-icon" icon=${appliance.icon ?? FALLBACK_ICON}>`
      as a child of each appliance's `ha-expansion-panel` (implements T009).
- [ ] T013 [US2] Manual: run `quickstart.md` steps 4–5 (independent
      collapse/expand, blank-appliance fallback icon/label) in a live HA
      dev instance. Along the way, confirm `_rowHeader()`'s existing
      fallback label logic (name → entity → `'New appliance'`) still reads
      correctly alongside the new leading icon for a blank appliance (spec
      User Story 2 Acceptance Scenario 3) — no functional change to
      `_rowHeader()` is expected.

**Checkpoint**: User Story 2 is fully functional and independently testable —
sections show icon + title + chevron, collapse/expand independently, and
blank appliances get a sensible fallback.

---

## Phase 5: User Story 3 - Add-appliance control matches native dropdown styling (Priority: P3)

**Goal**: The appliance-type `<select>` visually matches the restyled field
rows without reintroducing the v0.2.1 click-responsiveness regression.

**Independent Test**: Open the add-appliance control, confirm it matches the
filled-row style, and confirm selecting a type + clicking "Add appliance"
still adds a correctly pre-filled appliance (spec User Story 3 Independent
Test).

### Tests for User Story 3

- [ ] T014 [P] [US3] In `tests/component/editor.test.ts`, add/extend
      assertions confirming `[data-field="new-appliance-type"]` remains a
      native `<select>` element that still fires `change` via the existing
      `selectType()` helper, and that `.add-appliance` still produces the
      same pre-filled appliance as today — a regression guard for FR-005 and
      FR-009. Existing assertions in this file MUST NOT need to change.

### Implementation for User Story 3

- [ ] T015 [US3] In `_renderAddAppliance()` (`src/editor.ts`), wrap the type
      `<select>` in a `.field-row` container (reusing Phase 2's shared
      class).
- [ ] T016 [US3] In `editorStyles` (`src/styles.ts`): set `appearance: none`
      on the type `<select>`, add a decorative, `pointer-events: none`
      chevron icon positioned inside its `.field-row` wrapper (research.md
      §5), and remove the now-superseded `.add-appliance-row select`
      raw-`<select>` styling block.
- [ ] T017 [US3] Manual regression check (FR-005): click the type dropdown
      repeatedly, including immediately after clicking "Add appliance,"
      and confirm it opens/responds every time — `quickstart.md` step 7.
- [ ] T018 [US3] Manual: run `quickstart.md` step 6 (visual match check for
      the add-appliance control).

**Checkpoint**: All three user stories are independently functional. The
editor is fully restyled and the add-appliance control carries zero
click-reliability regression.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases and release hygiene spanning all three stories.

- [ ] T019 [P] Narrow-width check (`quickstart.md` step 8): at a ~360px-wide
      card-config dialog, confirm rows stay single-column with no horizontal
      scroll and long names/entity IDs truncate with an ellipsis; add
      `text-overflow: ellipsis` (and related `overflow`/`white-space` rules)
      to `.field-row`/row-header text in `src/styles.ts` where missing
      (FR-008, spec Edge Cases).
- [ ] T020 [P] Zero-appliances check (`quickstart.md` step 9): remove all
      appliances and confirm the editor still renders (just the
      add-appliance control) without error.
- [ ] T021 Update `CHANGELOG.md` with this restyle, per constitution
      Technology & Build Standards ("the CHANGELOG MUST be updated in the
      same PR as the change it describes").
- [ ] T022 Full regression: run `npm run lint && npm test`; confirm zero
      changes were needed to any pre-existing assertion in
      `tests/component/editor.test.ts` (SC-002), and confirm by inspection
      that no unstyled raw HTML form control remains visible anywhere in the
      editor (SC-003).
- [ ] T023 Keyboard-only navigation check (`quickstart.md` step 11, FR-007,
      constitution Principle IV): Tab/Shift+Tab, Enter, and Space through an
      appliance section's leading icon, header, fields, and remove/move
      buttons, then through the type dropdown and "Add appliance" button —
      no mouse. Every interactive element MUST be reachable with a visible
      focus indicator and MUST activate exactly as before this restyle; the
      new leading-icon and decorative chevron MUST NOT be focusable or
      break Tab order. Fix any regression found in `src/editor.ts`/
      `src/styles.ts`.
- [ ] T024 Run the full `quickstart.md` 11-step manual checklist end-to-end
      as final sign-off (including step 10, the row-action button restyle
      from FR-010/T006, and step 11, T023's keyboard-nav check).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3-5)**: All depend on Foundational completion.
  - US1 and US3 additionally depend on Phase 2's `.field-row` class existing
    (T002) before their wrapper tasks (T004/T005, T015) — not on each other.
  - US2 touches an unrelated part of the DOM (`ha-expansion-panel`'s
    `leading-icon` slot) and has no dependency on US1 or US3.
  - All three stories can proceed in parallel once Phase 2 is done.
- **Polish (Phase 6)**: Depends on all three user stories being complete.

### Within Each User Story

- Test task(s) written and confirmed failing before implementation tasks
  (constitution Principle II).
- Implementation tasks before manual `quickstart.md` validation tasks.
- Story complete (checkpoint) before starting Polish tasks that touch the
  same files.

### Parallel Opportunities

- T003 (US1 test), T009 (US2 test), T014 (US3 test) can be written in
  parallel — different assertions in the same test file, but no shared
  editing conflict if done as separate small diffs; if working solo, land
  them as sequential small commits instead to avoid merge noise in one file.
- T006 (US1 row-action restyle) is `[P]` against T004/T005 (different CSS
  rule vs. markup-wrapper tasks).
- Once Phase 2 completes, US1, US2, and US3 implementation tasks can be
  worked in any order or in parallel (different concerns:
  `.field-row` wrapping vs. `leading-icon` slot vs. type-`<select>` restyle).
- T019 and T020 (Polish) are `[P]` — independent checks.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (`.field-row` class).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: run `quickstart.md` steps 1–3 independently.
5. This alone delivers the core visual-consistency ask (spec User Story 1
   "Why this priority": *"the entire ask"*).

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. User Story 1 → validate → this is the MVP.
3. User Story 2 → validate → appliance sections match native grouped
   settings.
4. User Story 3 → validate → add-appliance control matches, zero click
   regression.
5. Polish → validate the full `quickstart.md` checklist end-to-end.

---

## Notes

- No entities, contracts, or endpoints beyond `contracts/editor-dom-contract.md`
  (a DOM/selector stability contract, not a network/API contract) — reflected
  above as regression-guard test tasks (T003, T009, T014) rather than
  contract-test scaffolding.
- `data-model.md` confirms no new/changed config fields — no model tasks.
- Commit after each task or logical group; verify each new test fails before
  implementing, then passes after.
