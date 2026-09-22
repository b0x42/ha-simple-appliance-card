# Feature Specification: Configurable Appliance Cards

**Feature Branch**: `001-configurable-appliance-cards`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "build a home assistant lovelace plugin that can be installed via hacs (hacs store integration out of scope) with configurable appliances. in hass heating dashboard 4 icons are the basis for the first set of appliances"

## Clarifications

### Session 2026-09-22

- Q: For non-binary appliances (sensor/number-backed, like the real heating
  dashboard's modulation % and burner power icons), what determines "active" vs
  "inactive"? → A: A configurable numeric threshold on the appliance's primary
  entity value, active by default when the value is greater than 0 — confirmed
  against the actual Home Assistant heating dashboard, whose 4 icons are driven
  by `sensor`/`number` values, not switch/climate state.
- Q: Should an appliance support an optional second "target/setpoint" entity
  alongside its primary entity? → A: Yes. An appliance has one required primary
  entity and one optional target entity; when a target is set, the card shows
  current-vs-target (matching how the real dashboard's Warmwasser and Heizung
  icons show current + target temperature).

### Session 2026-09-22 (during `/speckit-implement`, via kb.internal/heating-dashboard-icons.html)

- Discovery: the reference dashboard's own design-system documentation, found
  mid-implementation, revealed two facts the original clarification session
  above got wrong because the live dashboard config alone didn't show them:
  1. "Heat Pump" and "Gas Boiler" are not two separate physical units — both
     are sensor readouts (circulation-pump modulation %, gas-burner power %)
     on *one* physical gas boiler. Kept as two preset slots (they're two
     independently useful status icons), but renamed to avoid implying
     separate equipment: **Circulation Pump** and **Gas Burner**.
  2. Hot Water and Heating Circuit do **not** use a numeric threshold on the
     displayed value to decide "active." Each has its own separate boolean
     entity (`binary_sensor.boiler_dhw_charging`,
     `binary_sensor.boiler_heatingactive`) that drives the active/inactive
     indicator, decoupled from the temperature value shown. Their
     current/target display also only appears while active *and* the two
     values (rounded) differ — otherwise only the current value is shown.
  This changes FR-001, FR-002, FR-003a, and FR-005 below (previously
  clarified as a single "numeric-threshold-on-primary, always-show-target"
  model) and required rework of already-implemented state-derivation logic.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure a custom set of appliances (Priority: P1)

A Home Assistant user adds the card to a Lovelace dashboard and configures it with
a list of their own entities (one per appliance), each optionally given a custom
name and icon, so the dashboard shows exactly the appliances they care about.

**Why this priority**: Without configurable appliances the card has no purpose;
this is the minimum viable slice — any single user can add the card and get value
from it immediately.

**Independent Test**: Can be fully tested by adding the card to a dashboard with a
YAML config listing 1+ entities and confirming each renders as an icon showing
that entity's live state.

**Acceptance Scenarios**:

1. **Given** a dashboard editor adds the card with one configured appliance
   (a valid entity ID), **When** the dashboard loads, **Then** the card shows one
   icon reflecting that entity's current state.
2. **Given** a card configured with multiple appliances, **When** an appliance's
   underlying entity changes state in Home Assistant, **Then** the card's icon for
   that appliance updates without a page reload.
3. **Given** an appliance configured with a custom name and icon override,
   **When** the card renders, **Then** the override values are shown instead of
   the entity's own name/icon.

---

### User Story 2 - Start fast with the built-in heating preset (Priority: P2)

A user with a typical Home Assistant heating setup adds the card and applies the
built-in default preset of 4 heating-related appliances (matching the icons shown
on Home Assistant's own heating dashboard), supplying only their entity IDs, so
they get a working card without designing a configuration from scratch.

**Why this priority**: Removes setup friction for the most common use case the
card targets, but the card is already useful via User Story 1 without it.

**Independent Test**: Can be fully tested by configuring the card with the preset
option and each slot's required entity IDs only (no names/icons) and confirming
all 4 render with the preset's default names and icons.

**Acceptance Scenarios**:

1. **Given** the built-in heating preset is selected, **When** the user supplies
   only the entity ID(s) each preset slot requires (one for Circulation Pump/Gas
   Burner; primary, active, and target entity IDs for Hot Water/Heating Circuit),
   **Then** each appliance renders with the preset's default name and icon.
2. **Given** the built-in heating preset is selected, **When** the user overrides
   the name or icon for one preset slot, **Then** that slot uses the override and
   the remaining slots keep the preset defaults.

---

### User Story 3 - Inspect and control an appliance via Home Assistant's standard dialog (Priority: P3)

A user taps a configured appliance's icon on the card to open Home Assistant's
standard "more info" dialog for that entity — the same behavior as tapping any
other stock Lovelace tile — so they can see full detail and use whatever controls
Home Assistant itself offers for that entity, without leaving the dashboard.

**Why this priority**: Adds convenience on top of the read-only view delivered by
User Story 1 and 2; valuable but the card still functions as a status display
without it.

**Independent Test**: Can be fully tested by tapping a configured appliance icon
and confirming Home Assistant's standard more-info dialog opens for the
underlying entity.

**Acceptance Scenarios**:

1. **Given** an appliance configured against any entity, **When** the user taps
   its icon, **Then** Home Assistant's standard more-info dialog opens for that
   entity, matching the platform's default tap behavior.
2. **Given** an appliance whose entity is unavailable, **When** the user taps its
   icon, **Then** the standard more-info dialog opens and shows the unavailable
   state, the same as it would for any other Lovelace tile.

---

### Edge Cases

- What happens when a configured entity is unavailable or has been removed from
  Home Assistant? The card MUST show a clear "unavailable" state for that
  appliance rather than an error or a blank dashboard.
- How does the card handle zero appliances configured? It MUST show an empty-state
  message rather than rendering nothing, so the user knows configuration is
  needed.
- How does the card handle more configured appliances than fit the available
  card width? Appliances MUST wrap to additional rows rather than being clipped
  or overflowing the dashboard layout.
- What happens if the same entity is configured as more than one appliance? Each
  configured instance MUST render independently and reflect the same live state.
- What happens when an appliance's target entity is unavailable while its primary
  entity is not? The card MUST still show the primary value and indicate the
  target as unavailable, rather than hiding the whole appliance.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Card MUST let a user configure an ordered list of appliances on
  their Lovelace dashboard, each backed by one required primary Home Assistant
  entity ID (the displayed value), one optional separate "active" entity ID
  driving the active/inactive indicator, and one optional target/setpoint
  entity ID.
- **FR-002**: Card MUST render each configured appliance as an icon with a visual
  indicator of that appliance's active state, using one of two modes:
  - When an active entity is configured: active when that entity's state is
    `on`, inactive otherwise, unavailable when that entity is unavailable/
    unknown/missing — independent of the primary entity's own value.
  - When no active entity is configured: active when the primary entity's
    numeric value is above a configurable threshold (default greater than 0),
    inactive at or below the threshold, non-numeric entities falling back to
    their base on/off state.
  Either mode shows a distinct unavailable indicator when its driving entity
  is unavailable, unknown, or missing.
- **FR-003**: Card MUST update a rendered appliance's state indicator whenever the
  underlying entity's state changes in Home Assistant, without requiring a
  dashboard reload.
- **FR-003a**: When an appliance has a target entity configured, the card MUST
  display the target entity's value alongside the primary entity's value
  (current-vs-target) only while the appliance is active AND the two values
  (rounded) differ; otherwise it MUST show only the primary value. A target
  entity that is itself unavailable MUST always be surfaced as such,
  regardless of this collapse rule. All of this MUST update live as any of
  the involved entities change.
- **FR-004**: Card MUST allow a per-appliance override of display name and icon;
  when not overridden, the name and icon MUST fall back to the entity's own
  friendly name and icon.
- **FR-005**: Card MUST ship with a built-in preset of 4 default appliances
  matching the icons shown on the reference Home Assistant heating dashboard:
  **Circulation Pump** (primary only, numeric-threshold active mode),
  **Gas Burner** (primary only, numeric-threshold active mode), **Hot Water**
  (primary + target + separate active entity), and **Heating Circuit**
  (primary + target + separate active entity).
- **FR-006**: Card MUST let a user apply the built-in heating preset by supplying
  only entity IDs, without needing to specify names or icons for those 4 slots.
- **FR-007**: Card MUST support tapping a configured appliance icon to open Home
  Assistant's standard "more info" dialog for the underlying entity — the
  platform's default tap behavior — rather than performing a custom action.
- **FR-008**: Card MUST be installable into a Home Assistant instance via HACS's
  "custom repository" mechanism (adding this project's Git repository URL
  directly); listing the card in HACS's default/curated store catalog is out of
  scope for this feature.
- **FR-009**: Card configuration MUST be supported both via Lovelace YAML and via
  a visual (point-and-click) card editor integrated into the Lovelace UI, so users
  are not required to hand-write YAML to configure the card.
- **FR-010**: The visual card editor MUST let a user add, edit, and remove
  appliances — picking an entity and overriding its name/icon — and apply the
  built-in heating preset, entirely through the Lovelace UI.
- **FR-011**: Project MUST ship user-facing documentation (README) covering:
  step-by-step HACS custom-repository installation, a complete reference of
  every configuration parameter (name, type, required/optional, default
  value), and configuration examples for at least: the minimal single-appliance
  config, a name/icon override, the built-in heating preset, and an appliance
  with a target entity.

### Key Entities

- **Appliance**: One configured item on the card — a required primary Home
  Assistant entity ID, an optional separate "active" entity ID (drives the
  active/inactive indicator independently of the primary value), an optional
  target/setpoint entity ID, an optional active-threshold override (used only
  when no active entity is configured), and optional display-name and icon
  overrides.
- **Appliance Preset**: A built-in, named default definition (icon + display name
  + expected primary/active/target entity roles) that a user can apply to
  quickly fill in the 4 heating-dashboard-based appliance slots by supplying
  only entity IDs.
- **Card Configuration**: The complete set of a user's choices for one instance of
  the card on a dashboard — the ordered list of Appliances plus any card-level
  display options.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can go from installing the card via HACS to seeing a
  correctly configured appliance's live state on their dashboard in under 10
  minutes, following only the project's README.
- **SC-002**: A user applying the built-in heating preset can get all 4 default
  appliances showing correct live state by supplying only each slot's required
  entity ID(s) — one each for Circulation Pump/Gas Burner, up to three
  (primary/active/target) each for Hot Water/Heating Circuit — with no other
  configuration required.
- **SC-003**: An appliance's on/off/unavailable status is distinguishable at a
  glance (icon and/or color) without needing to tap into further detail, for 90%
  of users in informal usability review.
- **SC-004**: An appliance's displayed state reflects a real Home Assistant state
  change within 2 seconds under normal network conditions.
- **SC-005**: A user can configure every field of an appliance (entity, name,
  icon) and apply the built-in heating preset entirely through the visual editor,
  without writing or editing YAML by hand.
- **SC-006**: A user can write a correct config for a new appliance — including
  one with a target entity — using only the README's parameter reference and
  examples, without needing outside help.

## Assumptions

- Users installing this card already run a current, supported version of Home
  Assistant with Lovelace dashboards and have HACS installed; HACS installation
  itself is out of scope.
- "Installable via HACS" means installable as a HACS custom repository; getting
  the card accepted into HACS's default curated store is explicitly out of scope
  for this feature (per the user's stated boundary).
- Appliance types outside heating are still configurable manually via User
  Story 1 but are not given their own preset in this feature.
- The 4 preset appliances (circulation pump, gas burner, hot water, heating
  circuit) are typically backed by `sensor`/`number`/`binary_sensor` entities
  reporting modulation, power, temperature, or a charging/heating-active
  boolean, rather than simple switch/climate on-off state; exact icon
  identifiers and default thresholds per preset slot are a planning-phase
  detail, not a specification concern. Hot Water and Heating Circuit each use
  a separate boolean entity to drive their active indicator, decoupled from
  the temperature value they display (confirmed against
  kb.internal/heating-dashboard-icons.html).
- English is the only required language for default preset names in v1;
  localization of the card's own UI strings is not required.
- The card targets a single dashboard "card" instance per configuration; sharing
  appliance configuration across multiple card instances is not required.
