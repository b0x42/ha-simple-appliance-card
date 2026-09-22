# Quickstart: Validating Configurable Appliance Cards

Manual/integration validation for the acceptance scenarios in `spec.md`. Assumes
a running Home Assistant instance with HACS installed (per spec Assumptions) and
this repository built (`npm run build` → `dist/ha-simple-appliance-card.js`).

## Prerequisites

- Home Assistant instance reachable in a browser, with at least one real or
  `input_boolean`/`input_number` test entity to point appliances at.
- HACS installed on that instance.
- This repo's `dist/ha-simple-appliance-card.js` attached to a GitHub Release
  (or, for local dev, served and added as a Lovelace resource directly).

## 1. Install via HACS custom repository (SC-001, FR-008)

1. HACS → the three-dot menu → **Custom repositories**.
2. Add this repository's URL, category **Lovelace**.
3. Install the resulting "Simple Appliance Card" entry.
4. Confirm elapsed time from step 1 to a working card on the dashboard (step 4
   below) is under 10 minutes — SC-001.

## 2. Minimal manual config (User Story 1, SC-002 baseline)

Edit a dashboard view → **Add Card** → **Manual**, paste:

```yaml
type: custom:ha-simple-appliance-card
appliances:
  - entity: input_boolean.test_appliance
```

**Expected**: one icon renders, reflecting `input_boolean.test_appliance`'s
current state. Toggle the helper in Developer Tools → States; the icon updates
without reloading the dashboard, visibly within 2 seconds of the toggle —
SC-004 (Acceptance Scenario 1.2).

## 3. Name/icon override (Acceptance Scenario 1.3)

Add `name: My Appliance` and `icon: mdi:washing-machine` to the entry above.
**Expected**: card shows the override name/icon instead of the entity's own.

## 4. Built-in heating preset (User Story 2, SC-002, SC-005)

Via the visual editor (**Add Card** → search "Simple Appliance Card" → editor
UI), apply the built-in heating preset and supply each slot's entity ID(s)
(real ones if available):
- Circulation Pump: `sensor.boiler_heatingpumpmod` (or
  `sensor.heatpump_heatingpumpmod`, an equivalent modulation-% sensor from a
  different integration — the preset is entity-agnostic)
- Gas Burner: `sensor.boiler_curburnpow`
- Hot Water: primary `sensor.boiler_dhw_curtemp`, active
  `binary_sensor.boiler_dhw_charging`, target `number.boiler_dhw_seltemp`
- Heating Circuit: primary `sensor.boiler_curflowtemp`, active
  `binary_sensor.boiler_heatingactive`, target
  `sensor.thermostat_hc1_targetflowtemp`

**Expected**:
- All 4 render with preset default names/icons (Circulation Pump, Gas Burner,
  Hot Water, Heating Circuit) — Acceptance Scenario 2.1.
- Hot Water and Heating Circuit derive active/inactive from their `active`
  entity, not their displayed temperature, and show current-vs-target only
  while active and the (rounded) values differ (FR-002, FR-003a) — toggle the
  `active` helper in Developer Tools → States to see the collapse behavior.
- Every field was set through the editor UI alone, with no hand-written YAML —
  SC-005.
- Resulting YAML (view via the card's "Edit in YAML" toggle) needs only each
  slot's required entity ID(s), no other configuration — SC-002.

## 5. Tap → more-info (User Story 3)

Tap any configured appliance icon. **Expected**: Home Assistant's standard
more-info dialog opens for that entity — same as tapping any other stock tile
(Acceptance Scenario 3.1). Repeat for an entity temporarily made unavailable
(e.g. reload an integration) — dialog still opens, showing the unavailable
state (Acceptance Scenario 3.2).

## 6. Edge cases

- Remove/rename the entity behind a configured appliance → card shows a clear
  "unavailable" indicator for that appliance, not an error or blank card.
- Set `appliances: []` → card shows the empty-state message.
- Configure more appliances than fit one row → they wrap to additional rows,
  nothing is clipped.
- Configure the same `entity` twice → both render independently with matching
  live state.
- Configure a `target_entity` that's unavailable while the primary is fine →
  primary value still shows; target shows its own unavailable indicator.

## 7. Theming (constitution Principle IV)

Toggle the Home Assistant profile theme between a light and a dark theme with
the card on screen. **Expected**: card background/text/icon colors follow the
theme with no hard-coded colors breaking either mode.
