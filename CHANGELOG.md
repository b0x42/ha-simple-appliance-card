# Changelog

All notable changes to this project are documented in this file.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/).

## [0.2.2] - Unreleased

### Fixed

- The "Add appliance" Type dropdown (shipped in 0.2.1 as `ha-select` +
  `mwc-list-item`) didn't respond to clicks in a live dashboard — a known
  fragility point with Material Web Components' list-item/selection-index
  resolution outside Home Assistant's own internal usage. Reverted just
  that field to a plain native `<select>`, styled to match; everything
  else from 0.2.1 (`ha-expansion-panel`, `ha-textfield`, `ha-icon-button`)
  is unaffected and stays.

## [0.2.1]

### Changed

- Editor now built entirely from Home Assistant's native form elements
  (`ha-select`, `ha-textfield`, `ha-expansion-panel` per appliance,
  `ha-icon-button` for row actions) instead of plain styled HTML, so it
  looks and feels like a stock HA card editor. Look-and-feel only — no
  config field or behavior changed. Inspired by
  github.com/ADNPolymerase/ha-appliance-card's editor UI (this card keeps
  its own multi-appliance-per-card config model).

## [0.2.0]

### Changed

- Replaced the editor's bulk "apply all 4 preset slots at once" form with a
  one-at-a-time flow: pick a **Type** (Generic, or a built-in heating preset
  slot) next to "+ Add appliance," then Add — the new appliance is pre-filled
  with that type's name/icon, ready for you to fill in its entity field(s).

## [0.1.1]

### Fixed

- Editor was completely unstyled (raw browser-default form controls) and
  entity fields were free-text inputs with no autocomplete — reported as
  "pretty unusable" after first live install. Added proper theme-aware
  styling and switched `entity`/`active_entity`/`target_entity` fields
  (both per-appliance and in the preset form) to `<ha-entity-picker>`.

## [0.1.0]

### Added

- Initial release: `ha-simple-appliance-card`, a configurable Lovelace card
  showing a list of appliances as icons with live state.
- Per-appliance `entity` (primary), optional `active_entity` (separate
  active/inactive driving signal), optional `target_entity`
  (current-vs-target, shown only while active and the values differ),
  `name`/`icon` overrides, and `active_threshold`.
- Built-in heating preset (Circulation Pump, Gas Burner, Hot Water, Heating
  Circuit) applied via the visual editor by entity ID only.
- Visual point-and-click card editor (add/edit/remove/reorder appliances,
  apply the preset) alongside full YAML configuration support.
- Tap/keyboard activation opens Home Assistant's standard entity more-info
  dialog.
- HACS custom-repository installable.
