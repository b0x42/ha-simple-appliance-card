# Data Model: Native-Style Card Editor UI

No new or changed data entities. This feature is a visual restyle of the
existing editor (`src/editor.ts`); it does not add, remove, or rename any
field on `Appliance` or `CardConfig` (see
`specs/001-configurable-appliance-cards/data-model.md` for those, unchanged).

The only "new" state is presentational and already ephemeral/UI-local:

- **Section expand/collapse state**: per-appliance, held by each
  `ha-expansion-panel`'s own internal `expanded` state (not persisted to
  config, not new — the editor already renders one panel per appliance
  today; this feature only adds a leading-icon slot to it).

No config schema change means no migration path is required (constitution
Principle III).
