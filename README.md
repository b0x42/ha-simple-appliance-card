# Simple Appliance Card

A configurable [Home Assistant](https://www.home-assistant.io/) Lovelace card
that shows a list of your appliances as icons, with live state, and a
built-in preset for the common "heating boiler" set of readouts (circulation
pump, gas burner, hot water, heating circuit).

## Installation

Install via [HACS](https://hacs.xyz/) as a **custom repository** (this card
is not in HACS's default store):

1. In Home Assistant, open **HACS**.
2. Click the three-dot menu in the top right → **Custom repositories**.
3. Add this repository's URL, with category **Lovelace**.
4. Find "Simple Appliance Card" in HACS and click **Download**.
5. Restart Home Assistant if prompted, then hard-refresh your browser
   (HACS normally adds the required dashboard resource for you).
6. Edit any dashboard → **Add Card** → search for "Simple Appliance Card",
   or add it manually with `type: custom:ha-simple-appliance-card`.

## Configuration Reference

### Card (`CardConfig`)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `type` | string | Yes | — | Always `custom:ha-simple-appliance-card`. |
| `appliances` | list of Appliance | No | `[]` | The appliances to show, in order. Empty shows a placeholder message. |
| `title` | string | No | none | Optional heading shown above the appliances. |

### Appliance

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `entity` | entity ID | Yes | — | The primary entity — its value is what the card displays. |
| `active_entity` | entity ID | No | none | A separate boolean entity that decides active/inactive, independent of `entity`'s own value. Use this when the thing that decides "is it running" isn't the value you want to show (see Hot Water/Heating Circuit examples below). |
| `target_entity` | entity ID | No | none | An optional setpoint/target entity. Shown next to the primary value only while the appliance is active *and* the two values differ — otherwise only the primary value shows. |
| `name` | string | No | entity's `friendly_name` | Overrides the displayed name. |
| `icon` | string (`mdi:*`) | No | entity's own icon | Overrides the displayed icon. |
| `active_threshold` | number | No | `0` | Only used when `active_entity` is **not** set: the primary entity's numeric value must be greater than this to count as active. Ignored for non-numeric entities (which use their own on/off state instead) and ignored entirely when `active_entity` is set. |

Tap any appliance to open Home Assistant's standard entity dialog for its
`entity` — the same as tapping any other Lovelace tile.

## Examples

### Minimal — one appliance

```yaml
type: custom:ha-simple-appliance-card
appliances:
  - entity: input_boolean.dishwasher
```

### Name/icon override

```yaml
type: custom:ha-simple-appliance-card
appliances:
  - entity: switch.washing_machine
    name: Washer
    icon: mdi:washing-machine
```

### An appliance with a target (current-vs-target)

```yaml
type: custom:ha-simple-appliance-card
appliances:
  - entity: sensor.boiler_curflowtemp
    active_entity: binary_sensor.boiler_heatingactive
    target_entity: sensor.thermostat_hc1_targetflowtemp
    name: Heating Circuit
```

### Built-in heating preset (all 4 slots)

Add each appliance one at a time via the visual editor: pick its **Type**
(Circulation Pump / Gas Burner / Hot Water / Heating Circuit) from the
dropdown next to "+ Add appliance" instead of "Generic," click **Add
appliance**, then fill in that appliance's entity field(s) — its name and
icon are already filled in from the preset. Repeat for all 4 to get the YAML
below. Two slots (Circulation Pump, Gas Burner) are two status readouts of
one physical gas boiler, not separate equipment; either can point at any
equivalent modulation-% sensor (e.g. a different integration's
`sensor.heatpump_heatingpumpmod` works identically to
`sensor.boiler_heatingpumpmod`).

```yaml
type: custom:ha-simple-appliance-card
title: Heating
appliances:
  - entity: sensor.boiler_heatingpumpmod
    name: Circulation Pump
    icon: mdi:pump
  - entity: sensor.boiler_curburnpow
    name: Gas Burner
    icon: mdi:fire
  - entity: sensor.boiler_dhw_curtemp
    active_entity: binary_sensor.boiler_dhw_charging
    target_entity: number.boiler_dhw_seltemp
    name: Hot Water
    icon: mdi:water-boiler
  - entity: sensor.boiler_curflowtemp
    active_entity: binary_sensor.boiler_heatingactive
    target_entity: sensor.thermostat_hc1_targetflowtemp
    name: Heating Circuit
    icon: mdi:radiator
```

## Entities & Events

This card only **reads** entity state — it never calls a Home Assistant
service or the WebSocket API. It works with any entity domain you point it
at; the built-in preset above typically uses `sensor`, `number`, and
`binary_sensor` entities.

The only event it emits is the standard Home Assistant `hass-more-info`
event, dispatched when a user taps (or presses Enter/Space on a focused)
appliance icon — the same event any other stock Lovelace tile dispatches to
open its entity's detail dialog.

## Development

```bash
npm install
npm test           # unit + component tests, headless Chromium via Playwright
npm run lint
npm run build       # produces dist/ha-simple-appliance-card.js
```

See `specs/001-configurable-appliance-cards/` for the full spec, design
decisions, and data model behind this card.
