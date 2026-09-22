# Contract: Home Assistant Custom-Card Lifecycle & Events

The public interface this card exposes *to Home Assistant/Lovelace* (not to end
users directly) — the standard custom-card contract required by constitution
Principle III, and the one event the card emits.

## Custom element: `ha-simple-appliance-card`

| Member | Signature | Contract |
|---|---|---|
| `setConfig(config)` | `(config: CardConfig) => void` | Validates and stores config per `contracts/card-config.md`; throws on invalid input; MUST be safe to call again with a new config on the same instance (Lovelace does this on every dashboard-config change). |
| `hass` (setter) | `set hass(hass: HomeAssistant)` | Called by Lovelace on every state change bus update; MUST be cheap (guarded by `hasConfigOrEntityChanged`) since it fires frequently for unrelated entities. MUST NOT mutate the passed `hass` object. |
| `getCardSize()` | `() => number` | Returns an approximate row-height count for Lovelace's masonry layout; based on appliance count / wrap rows. |
| `getConfigElement()` | `() => HTMLElement` (static) | Returns the `ha-simple-appliance-card-editor` element (FR-009/FR-010). |
| `getStubConfig()` | `() => Partial<CardConfig>` (static) | Returns a minimal valid config (one placeholder appliance or the empty array) used when a user first adds the card via the dashboard's "Add Card" UI, before opening the editor. |

## Custom element: `ha-simple-appliance-card-editor`

| Member | Signature | Contract |
|---|---|---|
| `setConfig(config)` | `(config: CardConfig) => void` | Receives the current card config to populate the editor UI. |
| `hass` (setter) | `set hass(hass: HomeAssistant)` | Needed for entity pickers to list/validate available entities. |
| (emits) `config-changed` | `CustomEvent<{ config: CardConfig }>`, `bubbles: true, composed: true` | Standard Lovelace editor contract: dispatched on every user edit (add/remove/edit/reorder an appliance, apply the preset) with the full updated `CardConfig`; Lovelace itself calls the card's `setConfig()` with this value. |

## Registration contract

`index.ts` MUST, at module load:

1. `customElements.define('ha-simple-appliance-card', ...)`
2. `customElements.define('ha-simple-appliance-card-editor', ...)`
3. Push an entry onto `window.customCards` (creating the array if absent):
   `{ type: 'ha-simple-appliance-card', name: 'Simple Appliance Card', description: '...', preview: true }`
   — this is what makes the card discoverable in Lovelace's visual "Add Card"
   picker, not just usable via raw YAML.

## Event emitted to Home Assistant: `hass-more-info`

| Field | Value |
|---|---|
| Event name | `hass-more-info` |
| `bubbles` / `composed` | `true` / `true` (must cross the card's shadow DOM boundary) |
| `detail` | `{ entityId: string }` — the tapped appliance's **primary** entity ID |
| Dispatched via | `fireEvent(this, 'hass-more-info', { entityId })` from `custom-card-helpers` |
| Trigger | User taps/activates (click, or `Enter`/`Space` when focused — Principle IV keyboard requirement) a rendered appliance icon (spec FR-007, User Story 3) |

No other Home Assistant event, service call, or WebSocket call is made by this
card (constitution Principle III: no `hass.callService`/`hass.callWS` outside
documented user-triggered actions — this feature has none).
