# Contract: Editor DOM/CSS Structure

This restyle changes markup and CSS inside `src/editor.ts` and
`src/styles.ts`'s `editorStyles`. It does **not** change the Lovelace-facing
lifecycle contract (`setConfig`, `hass`, `config-changed` — see
`specs/001-configurable-appliance-cards/contracts/lifecycle-events.md`,
unchanged). This document is the contract the *implementation and its tests*
must preserve so the restyle stays behavior-only per FR-006.

## Selectors and attributes that MUST be preserved

`tests/component/editor.test.ts` drives the editor through these hooks
today; the restyle MUST keep every one of them working unchanged (same tag,
same attribute value, same event name/detail shape):

| Hook | Used for |
|---|---|
| `[data-field="entity"]` (`ha-entity-picker`) | Primary entity picker, `value-changed` |
| `[data-field="active_entity"]` (`ha-entity-picker`) | Active-entity picker |
| `[data-field="target_entity"]` (`ha-entity-picker`) | Target-entity picker |
| `[data-field="name"]` (`ha-textfield`) | Name override, `input` event |
| `[data-field="icon"]` (`ha-textfield`) | Icon override |
| `[data-field="active_threshold"]` (`ha-textfield`) | Active threshold |
| `[data-field="new-appliance-type"]` (native `<select>`) | Add-appliance type choice, `change` event |
| `.add-appliance` (`<button>`) | Adds an appliance |
| `.remove-appliance` (`ha-icon-button`) | Removes the appliance row (restyled per FR-010, same class/tag/click behavior) |
| `.move-up` / `.move-down` (`ha-icon-button`) | Reorders the appliance row (restyled per FR-010, same class/tag/click behavior) |
| `ha-expansion-panel` (one per appliance) | Collapsible appliance section |

## New structural additions this feature introduces

| Addition | Purpose |
|---|---|
| `<ha-icon slot="leading-icon">` inside each appliance's `ha-expansion-panel` | Leading icon in the collapsed/expanded section header (User Story 2) |
| `.field-row` wrapper `<div>` around each field (`ha-entity-picker`, `ha-textfield`, the type `<select>`) | Shared filled-row container styling (label-above-value, consistent radius/padding/background) |
| Decorative, `pointer-events: none` chevron element inside the type `<select>`'s `.field-row` wrapper | Visual dropdown affordance without intercepting native `<select>` clicks (FR-005) |

No existing selector, class, attribute, tag, or event contract listed above
changes name, shape, or firing condition. New markup only wraps or decorates
existing elements; it does not replace them.
