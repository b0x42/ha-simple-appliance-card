# Quickstart: Validate Native-Style Card Editor UI

## Prerequisites

- A running Home Assistant instance (dev container, HAOS, or Core) with this
  card installed/loaded (existing project dev workflow — see repo README).
- The build produced by `npm run build`, loaded as a Lovelace resource (or
  the project's existing local dev-loop for iterating on `src/editor.ts`).
- At least one dashboard with the card added via `custom:ha-simple-appliance-card`.

## Automated checks (run first, every time)

```sh
npm run lint
npm test
```

Both MUST pass unchanged — this feature does not add, remove, or alter any
existing test assertion in `tests/component/editor.test.ts` (see
`contracts/editor-dom-contract.md`). If a new snapshot of editor markup is
needed for the leading-icon/`field-row` additions, add assertions rather than
changing existing ones.

## Manual validation (visual — not automatable, see research.md §6)

1. **Open the card editor**: In the dashboard, edit the card via the UI (not
   YAML mode) to open `ha-simple-appliance-card-editor`.
2. **Compare row styling** (User Story 1): Each field (entity pickers, name/
   icon/threshold text fields, the appliance-type dropdown) should appear as
   a filled, rounded row with a small label above a larger value — visually
   consistent with any other native HA settings row (e.g. open a different
   built-in card's editor, or Settings → Areas, for a side-by-side).
3. **Toggle theme**: Switch the HA profile theme between a light theme and a
   dark theme (e.g. default "default" vs. a dark theme). Confirm all row
   backgrounds/text/icons re-color correctly with no hard-coded colors left
   over (Acceptance Scenarios 2–3).
4. **Collapse/expand appliance sections** (User Story 2): With 2+ appliances
   configured, confirm each collapsed row shows a leading icon, the
   appliance's name (or fallback), and a chevron; click one — only that
   section expands, others remain unaffected.
5. **Blank appliance fallback**: Add a new blank appliance (Generic type,
   no name/icon set yet). Confirm its collapsed row shows a fallback label
   ("New appliance" or its entity ID once set) and the generic fallback icon
   instead of a blank row.
6. **Add-appliance control** (User Story 3): Confirm the type dropdown looks
   like the other rows (not a plain browser `<select>`), and that picking a
   type + clicking "Add appliance" still produces a correctly pre-filled
   appliance (same as before this feature — verify against
   `tests/component/editor.test.ts`'s documented pre-fill behavior).
7. **Click reliability regression check** (FR-005): Click the type dropdown
   multiple times in a row, including immediately after adding an appliance
   (the control that regressed in v0.2.1). It MUST open/respond every time.
8. **Narrow width** (Edge Cases): Resize the browser (or use device toolbar)
   to ~360px width for the card-config dialog. Confirm rows stay
   single-column, readable, with no horizontal scrollbar, and long
   names/entity IDs truncate rather than overflow.
9. **Zero appliances**: Remove all appliances. Confirm the editor still
   renders (just the add-appliance control) without error.
10. **Row-action buttons** (FR-010): Confirm the remove/move-up/move-down
    icon buttons on each appliance section visually match the rest of the
    restyled section chrome (spacing, icon treatment, hover/focus state)
    rather than looking like an unstyled leftover.
11. **Keyboard-only navigation** (FR-007): Using only Tab/Shift+Tab, Enter,
    and Space (no mouse), navigate through an appliance section's leading
    icon area, header (expand/collapse), fields, and remove/move buttons,
    then through the type dropdown and "Add appliance" button. Confirm every
    interactive element is reachable, shows a visible focus indicator, and
    activates via keyboard exactly as it did before this restyle — the new
    leading-icon and chevron decoration MUST NOT be focusable or intercept
    Tab order (they carry no interactive semantics).

## Pass criteria

All 11 manual steps above match their described behavior, and both automated
checks (`npm run lint`, `npm test`) pass with zero changes to existing
assertions.
