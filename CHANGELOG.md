# Changelog

All notable changes to this project are documented in this file.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/).

## [0.1.0] - Unreleased

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
