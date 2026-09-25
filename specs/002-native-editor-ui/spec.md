# Feature Specification: Native-Style Card Editor UI

**Feature Branch**: `002-native-editor-ui`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "i want the ui when editing the card from https://github.com/Clooos/Bubble-Card/ [screenshot of Bubble Card's pop-up card editor] Looks like native hass"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Editor reads as a native HA settings screen (Priority: P1)

A dashboard editor opens the card's visual editor to configure appliances. The
fields, rows, and section groupings look and behave like the rest of Home
Assistant's own configuration screens (e.g. entity/area settings, other
well-built card editors) rather than a plain, custom-styled HTML form.

**Why this priority**: This is the entire ask — visual consistency with native
HA is the feature. Without it there is no user-visible change.

**Independent Test**: Open the card editor in a live HA dashboard and compare
row styling (filled background, label-above-value layout, spacing, corner
radius, iconography) side-by-side with a stock HA settings screen. Passes if a
user cannot tell the editor apart from a native screen on style alone.

**Acceptance Scenarios**:

1. **Given** the card editor is open with one or more appliances configured,
   **When** the editor renders, **Then** every field row (entity pickers, text
   fields) appears as a filled, rounded row with a small label above a larger
   value, matching native HA form row styling.
2. **Given** the active Home Assistant theme is dark, **When** the editor
   renders, **Then** all row backgrounds, text, and icon colors follow the
   active theme's colors (no hard-coded light-mode-only colors).
3. **Given** the active Home Assistant theme is light, **When** the editor
   renders, **Then** the same rows render correctly using the light theme's
   colors.

---

### User Story 2 - Appliance sections collapse like native grouped settings (Priority: P2)

A dashboard editor with several appliances configured wants to scan the list
without every appliance's full field set open at once, the way grouped
settings sections (e.g. "Header settings", "Pop-up settings" in the reference
screenshot) collapse to a single labeled, icon-led row until expanded.

**Why this priority**: Directly visible in the reference screenshot and
already partially supported (existing per-appliance panels already collapse);
this raises that existing behavior to match the native visual treatment
(leading icon, bold title, trailing chevron, bordered rounded container).

**Independent Test**: With 3+ appliances configured, collapse all sections and
confirm each collapsed row shows a leading icon, the appliance's name (or a
placeholder), and a chevron indicating expand/collapse state; clicking a row
expands only that row's fields.

**Acceptance Scenarios**:

1. **Given** an appliance section is collapsed, **When** the editor renders
   it, **Then** the row shows a leading icon representing the appliance, the
   appliance's display name, and a trailing chevron.
2. **Given** a collapsed appliance section, **When** the user clicks it,
   **Then** it expands in place to reveal that appliance's fields without
   affecting other sections' expand/collapse state.
3. **Given** an appliance has no name override and no icon configured,
   **When** its section renders, **Then** a reasonable fallback label (its
   entity ID or "New appliance") and a generic icon are shown instead of a
   blank row.

---

### User Story 3 - Add-appliance control matches native dropdown styling (Priority: P3)

A dashboard editor adding a new appliance picks its type from a dropdown
before clicking "Add appliance." Today this dropdown is a plain, unstyled
HTML `<select>`; it should look like the rest of the restyled editor.

**Why this priority**: Smaller surface area (one control) than the other two
stories, and lowest functional risk, so it is safe to land last without
blocking the higher-value restyle.

**Independent Test**: Open the "add appliance" control and confirm the type
dropdown renders with the same filled-row, label-above-value style as other
fields, and that selecting a type and clicking "Add appliance" still adds a
correctly-configured appliance row.

**Acceptance Scenarios**:

1. **Given** the add-appliance control is visible, **When** it renders,
   **Then** the type dropdown matches the filled-row style used elsewhere in
   the editor rather than a raw browser `<select>`.
2. **Given** a type is selected and "Add appliance" is clicked, **Then** a new
   appliance section is added with the same pre-filled fields (name, icon,
   active threshold) the existing add flow already produces.

---

### Edge Cases

- What happens when the editor is opened with zero appliances configured? The
  editor MUST still render the (empty) add-appliance control without error.
- How does the layout respond on a narrow (mobile-width) card-config dialog?
  Rows and sections MUST remain single-column and fully readable without
  horizontal scrolling.
- What happens when an appliance's name or entity ID is very long? Row text
  MUST truncate (e.g. with an ellipsis) rather than overflow or break the row
  layout.
- What happens if a user's HA theme defines unusual custom colors (e.g. very
  low contrast)? The editor MUST use the same theme variables as the rest of
  HA so any contrast issue is a theme-wide issue, not one specific to this
  card.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The editor MUST render every field row (entity pickers, text
  inputs, the type dropdown) using a filled, rounded row style with the
  field's label shown above its value, matching Home Assistant's native
  configuration-screen row style.
- **FR-002**: Each appliance MUST be represented as a collapsible section with
  a leading icon, the appliance's display name as its title, and a trailing
  chevron that reflects expanded/collapsed state.
- **FR-003**: Collapsing or expanding one appliance section MUST NOT change
  the expand/collapse state of any other appliance section.
- **FR-004**: All editor colors (row backgrounds, text, icons, borders) MUST
  be sourced from Home Assistant theme variables so the editor renders
  correctly in both light and dark themes without hard-coded colors.
- **FR-005**: The add-appliance type control MUST use the same filled-row
  visual style as other fields rather than an unstyled native `<select>`,
  while preserving current keyboard operability and click reliability (the
  editor previously shipped a regression where a styled dropdown stopped
  responding to clicks; the replacement MUST NOT reintroduce that failure
  mode).
- **FR-006**: All existing editing actions — add appliance, remove appliance,
  reorder appliance (move up/down), edit entity/active entity/target entity,
  edit name/icon/active threshold overrides — MUST continue to work
  identically to today; this feature changes appearance only, not behavior or
  the config schema.
- **FR-007**: Interactive elements (rows, chevrons, remove/move buttons) MUST
  remain keyboard-operable and carry accessible names, consistent with the
  project's existing accessibility requirement.
- **FR-008**: Row and section layout MUST remain single-column and fully
  readable at narrow (mobile) card-config dialog widths.
- **FR-009**: Appliance type MUST remain a one-time choice made only when
  adding a new appliance via the add-appliance control; this feature restyles
  the editor's appearance only (row style, section grouping, iconography) and
  does not add a new editable-after-creation "type" field. The reference
  screenshot's left-hand settings panel (filled rows + collapsible
  icon/title/chevron sections) is the style target, not its specific fields.

### Key Entities

- **Appliance**: A single configured appliance within the card (existing
  entity: `entity`, `active_entity`, `target_entity`, `name`, `icon`,
  `active_threshold`). This feature does not add or remove attributes on this
  entity; it changes only how its editor fields are presented.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a side-by-side visual comparison against a native Home
  Assistant settings screen, testers cannot identify the card editor as
  third-party styling in at least 90% of trials.
- **SC-002**: 100% of existing editor actions (add, remove, reorder, edit each
  field) produce the same resulting configuration before and after this
  change — zero functional regressions.
- **SC-003**: The editor renders with no unstyled native HTML form controls
  (e.g. raw `<select>`) visible to the user.
- **SC-004**: The editor remains fully usable (no horizontal scrolling, no
  truncated-beyond-reading text) at a 360px-wide card-config dialog.

## Assumptions

- The Bubble Card screenshot is a style reference only (row shape, spacing,
  iconography treatment, collapsible-section pattern); this feature does not
  adopt Bubble Card's own settings, features, or one-card-per-popup config
  model. This card keeps its existing multi-appliance-per-card data model.
- Per-appliance fields stay grouped as a single flat set inside each
  appliance's section (current structure: entity pickers + text fields); this
  feature does not introduce a second level of nested sub-groups (e.g.
  separate "Entities" vs. "Display" sub-panels), since the current field count
  per appliance is small enough that one level of grouping is sufficient.
- The leading icon shown on each collapsed appliance section uses the
  appliance's configured icon (or a generic fallback icon when none is set),
  not a fixed icon shared by all appliances.
- Only the card editor is restyled by this feature; the card's own (non-edit)
  dashboard rendering is out of scope.
- The known prior regression (a Material Web Components dropdown that stopped
  responding to clicks, fixed in v0.2.2 by reverting to a native `<select>`)
  is a hard constraint on any replacement control design, not merely a
  historical note.
