# Phase 1 Data Model: Configurable Appliance Cards

All types are configuration/view-model shapes — there is no database; instances
live in the Lovelace dashboard config object Home Assistant already persists, and
are read fresh from the `hass` object on every update.

## Appliance

One configured item on the card (spec: Key Entities > Appliance; FR-001–FR-004,
FR-003a).

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `entity` | entity ID (string) | Yes | — | Primary entity. `setConfig` MUST reject a config missing this field. |
| `target_entity` | entity ID (string) | No | none | Optional target/setpoint entity (FR-003a). |
| `name` | string | No | entity's friendly name | Display-name override (FR-004). |
| `icon` | icon identifier (string, `mdi:*`) | No | entity's own icon | Icon override (FR-004). |
| `active_threshold` | number | No | `0` | Numeric entities are "active" when `Number(state) > active_threshold` (research.md §5). Ignored for non-numeric entities. |

**Validation rules** (enforced in `config.ts`, tested per constitution Principle
II):
- `entity` MUST be present and a non-empty string; `setConfig` throws a
  descriptive error otherwise (Home Assistant surfaces this as a card
  configuration error).
- `target_entity`, `name`, `icon`, `active_threshold`, when present, MUST match
  their declared type; a wrong type is a `setConfig` error, not a silently
  ignored field.
- No uniqueness constraint on `entity` across appliances — spec Edge Cases
  explicitly allows the same entity configured more than once, each rendering
  independently.

**Derived (not stored, computed per render from live `hass` state)**:

| Derived value | Computation |
|---|---|
| `activeState` | `'active' \| 'inactive' \| 'unavailable'` — from primary entity per research.md §5. An `entity`/`target_entity` absent from `hass.states` (e.g. removed from Home Assistant) is treated identically to state `unavailable`/`unknown` — same indicator, no separate "not found" case. |
| `primaryDisplayValue` | Primary entity's formatted state/value |
| `targetDisplayValue` | Target entity's formatted state/value, or absent if no `target_entity` |
| `targetUnavailable` | `true` when `target_entity` is set but unavailable/unknown, independent of the primary's own availability (spec Edge Cases) |

## AppliancePreset

A built-in, named default (spec: Key Entities > Appliance Preset; FR-005, FR-006).
Presets are static data (`presets.ts`), not user-editable state.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable key, e.g. `heat_pump`, `gas_boiler`, `hot_water`, `heating_circuit`. |
| `name` | string | Default display name, e.g. "Heat Pump". |
| `icon` | icon identifier | Default icon. |
| `roles` | `{ primary: true; target: boolean }` | Whether this preset slot expects a target entity (`hot_water` and `heating_circuit`: yes; `heat_pump`, `gas_boiler`: no), per research.md and spec FR-005. |
| `default_active_threshold` | number | Preset-specific default, falls back to `0` if unspecified. |

**Built-in preset set** (fixed, exactly 4 slots per spec FR-005):

1. `heat_pump` — "Heat Pump", primary only.
2. `gas_boiler` — "Gas Boiler", primary only.
3. `hot_water` — "Hot Water", primary + target.
4. `heating_circuit` — "Heating Circuit", primary + target.

**Applying a preset** (FR-006) produces one `Appliance` per supplied entity ID,
using the preset's `name`/`icon`/`default_active_threshold` as that appliance's
defaults — identical in shape to a manually-configured `Appliance`, so the
rendering and state-derivation logic never needs to know whether an appliance
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
