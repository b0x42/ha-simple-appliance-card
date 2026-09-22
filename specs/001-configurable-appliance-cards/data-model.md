# Phase 1 Data Model: Configurable Appliance Cards

All types are configuration/view-model shapes — there is no database; instances
live in the Lovelace dashboard config object Home Assistant already persists, and
are read fresh from the `hass` object on every update.

## Appliance

One configured item on the card (spec: Key Entities > Appliance; FR-001–FR-004,
FR-003a).

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `entity` | entity ID (string) | Yes | — | Primary entity — the displayed value. `setConfig` MUST reject a config missing this field. |
| `active_entity` | entity ID (string) | No | none | Optional separate boolean entity driving the active/inactive indicator, decoupled from `entity`'s own value (FR-002). Confirmed via kb.internal/heating-dashboard-icons.html: Hot Water/Heating Circuit need this because their driving signal (`binary_sensor.boiler_dhw_charging`, `binary_sensor.boiler_heatingactive`) is not the temperature they display. |
| `target_entity` | entity ID (string) | No | none | Optional target/setpoint entity (FR-003a). |
| `name` | string | No | entity's friendly name | Display-name override (FR-004). |
| `icon` | icon identifier (string, `mdi:*`) | No | entity's own icon | Icon override (FR-004). |
| `active_threshold` | number | No | `0` | Only used when `active_entity` is absent: numeric entities are "active" when `Number(state) > active_threshold` (research.md §5). Ignored for non-numeric entities and ignored entirely when `active_entity` is set. |

**Validation rules** (enforced in `config.ts`, tested per constitution Principle
II):
- `entity` MUST be present and a non-empty string; `setConfig` throws a
  descriptive error otherwise (Home Assistant surfaces this as a card
  configuration error).
- `active_entity`, `target_entity`, `name`, `icon`, `active_threshold`, when
  present, MUST match their declared type; a wrong type is a `setConfig`
  error, not a silently ignored field.
- No uniqueness constraint on `entity` across appliances — spec Edge Cases
  explicitly allows the same entity configured more than once, each rendering
  independently.

**Derived (not stored, computed per render from live `hass` state)**:

| Derived value | Computation |
|---|---|
| `activeState` | `'active' \| 'inactive' \| 'unavailable'`. When `active_entity` is set: `active` iff its state is `on`, `unavailable` iff it is unavailable/unknown/missing from `hass.states` — the primary entity's own value is not consulted. Otherwise: numeric-threshold/on-off fallback on `entity` itself, per research.md §5. Either mode treats an entity absent from `hass.states` identically to state `unavailable`/`unknown`. |
| `primaryDisplayValue` | Primary entity's formatted state/value |
| `targetDisplay` | `{ show: boolean; unavailable: boolean }` — `show` is true only when (a) `target_entity`'s own state is unavailable (then `unavailable: true`, always surfaced regardless of the rule below), or (b) `activeState === 'active'` AND the primary and target values (rounded, for numeric values) differ. Otherwise `show` is false and only the primary value renders (the "collapse rule", FR-003a, confirmed via kb.internal/heating-dashboard-icons.html). |

## AppliancePreset

A built-in, named default (spec: Key Entities > Appliance Preset; FR-005, FR-006).
Presets are static data (`presets.ts`), not user-editable state.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable key, e.g. `circulation_pump`, `gas_burner`, `hot_water`, `heating_circuit`. |
| `name` | string | Default display name, e.g. "Circulation Pump". |
| `icon` | icon identifier | Default icon. |
| `roles` | `{ primary: true; driving: boolean; target: boolean }` | Whether this preset slot expects a separate active entity (`hot_water`, `heating_circuit`: yes; `circulation_pump`, `gas_burner`: no) and/or a target entity (`hot_water`, `heating_circuit`: yes; others: no), per research.md and spec FR-005. |
| `default_active_threshold` | number | Preset-specific default, falls back to `0` if unspecified. Only relevant to slots with `roles.driving === false`. |

**Built-in preset set** (fixed, exactly 4 slots per spec FR-005; entity/role
mapping confirmed against kb.internal/heating-dashboard-icons.html):

1. `circulation_pump` — "Circulation Pump", primary only, numeric-threshold
   active mode (e.g. `sensor.boiler_heatingpumpmod`).
2. `gas_burner` — "Gas Burner", primary only, numeric-threshold active mode
   (e.g. `sensor.boiler_curburnpow`).
3. `hot_water` — "Hot Water", primary + active entity + target (e.g. primary
   `sensor.boiler_dhw_curtemp`, active `binary_sensor.boiler_dhw_charging`,
   target `number.boiler_dhw_seltemp`).
4. `heating_circuit` — "Heating Circuit", primary + active entity + target
   (e.g. primary `sensor.boiler_curflowtemp`, active
   `binary_sensor.boiler_heatingactive`, target
   `sensor.thermostat_hc1_targetflowtemp`).

**Picking a preset type when adding an appliance** (FR-006) produces one
`Appliance`, pre-filled with the selected slot's `name`/`icon`/
`default_active_threshold` and an empty `entity` (plus empty `active_entity`/
`target_entity` for `hot_water`/`heating_circuit`) — the user fills in the
entity ID(s) afterward via that same appliance's own fields. The result is
identical in shape to a manually-configured `Appliance` (picking "Generic"
instead of a preset just skips the pre-fill), so the rendering and
state-derivation logic never needs to know whether an appliance's defaults
came from a preset.

## CardConfig

The complete configuration for one card instance (spec: Key Entities > Card
Configuration).

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `type` | `'custom:ha-simple-appliance-card'` | Yes | — | Standard Lovelace card-type discriminator. |
| `appliances` | `Appliance[]` | Yes | `[]` | Ordered list rendered in this order (FR-001). Empty array renders the empty-state (spec Edge Cases). |
| `title` | string | No | none | Optional card-level heading. |

**Validation rules**:
- `appliances` MUST be an array when present; a missing/empty array is valid
  (renders the empty state), not an error.
- Each entry in `appliances` is validated as an `Appliance` (see above); a card
  with one invalid entry among several valid ones fails `setConfig` entirely —
  Home Assistant's own convention for card configuration errors, keeping
  validation behavior consistent and predictable rather than silently dropping
  the bad entry.

## Relationships

```text
CardConfig 1 ──── * Appliance
AppliancePreset ── (applied via editor/config authoring, not a runtime reference)
                    produces plain Appliance entries with no residual link back
                    to the preset id
```

There is no state machine — an `Appliance`'s `activeState` is recomputed from
live `hass` data on every relevant update; it is not a stored/transitioned field.
