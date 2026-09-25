# Implementation Plan: Native-Style Card Editor UI

**Branch**: `002-native-editor-ui` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-native-editor-ui/spec.md`

## Summary

Restyle `ha-simple-appliance-card-editor` so it visually matches native Home
Assistant configuration screens (per the Bubble Card reference screenshot):
filled, rounded, label-above-value rows for every field; each appliance
rendered as a collapsible section with a leading icon, bold title, and
chevron; the add-appliance type control and the remove/move icon buttons
restyled to match. This is a
cosmetic-only change — no config schema change, no new editor behavior, and
the existing `config-changed` lifecycle contract is untouched. Achieved via
CSS and light-DOM wrapper markup on the editor's existing components
(`ha-entity-picker`, `ha-textfield`, `ha-expansion-panel`'s built-in
`leading-icon` slot, and the existing native `<select>`) rather than adopting
Home Assistant's `ha-form`/`ha-selector` stack, to avoid reintroducing the
click-responsiveness regression that v0.2.1's `ha-select`/`mwc-list-item`
dropdown shipped (fixed in v0.2.2).

## Technical Context

**Language/Version**: TypeScript 5.x, same ES2021+ browser-baseline target as
the rest of the project (unchanged from feature 001).

**Primary Dependencies**: None added. Uses `lit` (already bundled) and Home
Assistant frontend custom elements already relied on by `src/editor.ts`
(`ha-entity-picker`, `ha-textfield`, `ha-expansion-panel`, `ha-icon`,
`ha-icon-button`) — resolved by tag name at runtime inside a real HA page, no
new import.

**Storage**: N/A — no config schema change (see data-model.md).

**Testing**: Existing `@web/test-runner` + `@open-wc/testing` component tests
(`tests/component/editor.test.ts`) MUST continue to pass unchanged (this
feature's DOM contract, `contracts/editor-dom-contract.md`, is written
specifically to keep every selector/event they rely on stable); new
assertions may be added for the new `leading-icon` slot content and
`.field-row` wrapper presence. No new unit-test surface — no new pure logic
is introduced.

**Target Platform**: Browser, inside a user's Home Assistant frontend
(Lovelace card-config dialog). Unchanged.

**Project Type**: Single frontend package (unchanged).

**Performance Goals**: No new performance goals — this is CSS/markup only;
render cost stays within the same order of magnitude as today's editor
render.

**Constraints**: Must use Home Assistant theme CSS custom properties only,
in both light and dark themes (constitution Principle IV, spec FR-004).
Must not regress the type-dropdown click-reliability the project already
fixed once (spec FR-005) — decorative additions around the native `<select>`
must be `pointer-events: none` so they cannot intercept its clicks.

**Scale/Scope**: Same appliance-count scale as feature 001 (~20 appliances
per card); editor must remain usable at ~360px-wide card-config dialogs
(spec Edge Cases / SC-004).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Type-Safe, Lint-Clean Code | No new `any`; new helper methods (row/leading-icon rendering) typed like existing `_entityPicker`/`_textField` helpers; ESLint+Prettier clean | PASS |
| II. Test-First Development | `tests/component/editor.test.ts` continues to gate all editing behavior; per constitution this is DOM-dependent component behavior, not the 80%-branch-coverage pure-logic bucket (no new pure logic is added, so that gate is unaffected) | PASS |
| III. Home Assistant Contract Compliance | `setConfig`/`hass`/`config-changed` contract unchanged (see `contracts/editor-dom-contract.md`); no config schema change, so no migration path is needed | PASS |
| IV. Consistent, Accessible Lovelace UX | Theme-CSS-custom-properties only (no hard-coded colors); `ha-expansion-panel`'s native leading-icon slot and chevron preserve existing keyboard/ARIA behavior; decorative chevron/icon additions carry no interactive semantics so nothing new needs an accessible name | PASS |
| V. Simplicity & Long-Term Maintainability | Zero new runtime dependencies; explicitly rejects a larger `ha-form`/`ha-selector` migration in research.md §1 as unjustified scope/risk for a cosmetic feature | PASS |

No violations identified. Complexity Tracking table omitted (not required).

**Post-Phase-1 re-check**: `data-model.md` confirms no new/changed config
entity; `contracts/editor-dom-contract.md` confirms the Lovelace-facing
lifecycle contract and every test-relied-upon selector/event stay unchanged;
`research.md` explicitly chose the lower-risk, no-new-dependency path at each
decision point. All five principles still PASS unchanged after design.

## Project Structure

### Documentation (this feature)

```text
specs/002-native-editor-ui/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   └── editor-dom-contract.md
└── tasks.md               # Phase 2 output (/speckit-tasks command - NOT created here)
```

### Source Code (repository root)

```text
src/
├── editor.ts       # MODIFIED: leading-icon slot per appliance section,
│                   #   .field-row wrapper markup around each field,
│                   #   restyled add-appliance type control markup
├── styles.ts        # MODIFIED: editorStyles gets .field-row, leading-icon,
│                    #   and type-dropdown-chevron rules (theme-variable-only)
└── (all other files unchanged)

tests/
└── component/
    └── editor.test.ts   # UNCHANGED assertions preserved; may gain new
                          #   assertions for leading-icon/.field-row markup
```

**Structure Decision**: No new files, no new modules. This feature is scoped
entirely to `src/editor.ts` (markup) and `src/styles.ts` (CSS), matching its
cosmetic-only scope; the project's existing single-frontend-package layout
from feature 001 is otherwise unchanged.
