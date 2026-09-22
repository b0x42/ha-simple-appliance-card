import type { Appliance, DerivedState, HomeAssistant } from './types.js';

const UNAVAILABLE_STATES = new Set(['unavailable', 'unknown']);

/**
 * Reads a single entity's active state, per research.md §5: numeric entities
 * are active when `Number(state) > threshold`; non-numeric entities fall back
 * to `state !== 'off'`. An entity absent from `hass.states` is treated
 * identically to `unavailable`/`unknown` (data-model.md's derived-value note).
 */
function deriveEntityState(
  hass: HomeAssistant,
  entityId: string,
  threshold: number,
): DerivedState {
  const stateObj = hass.states[entityId];
  if (stateObj === undefined) {
    return 'unavailable';
  }
  const rawState = stateObj.state;
  if (UNAVAILABLE_STATES.has(rawState)) {
    return 'unavailable';
  }

  const numeric = Number(rawState);
  if (!Number.isNaN(numeric) && rawState.trim() !== '') {
    return numeric > threshold ? 'active' : 'inactive';
  }

  return rawState !== 'off' ? 'active' : 'inactive';
}

/** Derives an appliance's active/inactive/unavailable indicator from its primary entity. */
export function deriveActiveState(hass: HomeAssistant, appliance: Appliance): DerivedState {
  return deriveEntityState(hass, appliance.entity, appliance.active_threshold ?? 0);
}

/** Derives the target entity's own active/inactive/unavailable indicator, if configured. */
export function deriveTargetState(hass: HomeAssistant, appliance: Appliance): DerivedState | undefined {
  if (appliance.target_entity === undefined) {
    return undefined;
  }
  return deriveEntityState(hass, appliance.target_entity, 0);
}
