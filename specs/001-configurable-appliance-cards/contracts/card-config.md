# Contract: Card Configuration (Lovelace YAML / editor output)

This is the public contract between a user's dashboard and the card: the shape of
the object passed to `setConfig()`, whether hand-written as YAML or produced by
the visual editor (FR-009). Both paths MUST produce/accept the identical shape —
the editor is not a different config format, it's a UI over this one.

## Shape

```yaml
type: custom:ha-simple-appliance-card
title: Heating            # optional
appliances:
  - entity: sensor.boiler_heatingpumpmod
    name: Circulation Pump     # optional, overrides entity friendly_name
    icon: mdi:pump               # optional, overrides entity icon
    active_threshold: 0            # optional, default 0; ignored if active_entity is set
  - entity: sensor.boiler_dhw_curtemp
    active_entity: binary_sensor.boiler_dhw_charging   # optional; decouples active state from entity's own value
    target_entity: number.boiler_dhw_seltemp             # optional
    name: Hot Water
```

## Minimal valid config

```yaml
type: custom:ha-simple-appliance-card
appliances:
  - entity: sensor.boiler_heatingpumpmod
```

## Applying the built-in heating preset

The editor's preset action expands to 4 `Appliance` entries using the preset's
defaults (see `data-model.md` > AppliancePreset), so the *stored* config a user
ends up with is always plain `appliances` entries — there is no separate
`preset:` key persisted in the config. This keeps the config contract to one
shape regardless of how it was authored (spec FR-006, SC-002). Two of the four
slots (Hot Water, Heating Circuit) produce an appliance with `active_entity`
and `target_entity` both set; the other two (Circulation Pump, Gas Burner)
produce a primary-only appliance.

## Errors

`setConfig()` throws a synchronous `Error` (rendered by Home Assistant as the
card's own config-error UI, per constitution Principle IV's "degrade
gracefully" requirement) when:

- `appliances` is present but not an array.
- Any entry in `appliances` is missing `entity`, or has a non-string `entity`.
- Any entry's `active_entity`, `target_entity`, `name`, `icon`, or
  `active_threshold` is present but the wrong type.

An empty or absent `appliances` array is **not** an error — it is the documented
empty state (spec Edge Cases).

## Compatibility

Any future breaking change to this shape (field removal or type change) MUST
ship either a migration on read (in `config.ts`) or a MAJOR version bump per
constitution Principle III — never a silent behavior change for existing users'
saved dashboard YAML.
