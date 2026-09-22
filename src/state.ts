import type { Appliance, DerivedState, HomeAssistant } from './types.js';

const UNAVAILABLE_STATES = new Set(['unavailable', 'unknown']);

function isUnavailableState(rawState: string): boolean {
  return UNAVAILABLE_STATES.has(rawState);
}

function numericValue(rawState: string): number | undefined {
  if (rawState.trim() === '') return undefined;
  const numeric = Number(rawState);
  return Number.isNaN(numeric) ? undefined : numeric;
}

/**
 * Derives one entity's own active/inactive/unavailable state, per
 * research.md §5: numeric entities are active when `Number(state) >
 * threshold`; non-numeric entities fall back to `state !== 'off'`. An entity
 * absent from `hass.states` is treated identically to `unavailable`/`unknown`.
 */
function deriveNumericOrOnOffState(
  hass: HomeAssistant,
  entityId: string,
  threshold: number,
): DerivedState {
  const stateObj = hass.states[entityId];
  if (stateObj === undefined) return 'unavailable';
  const rawState = stateObj.state;
  if (isUnavailableState(rawState)) return 'unavailable';

  const numeric = numericValue(rawState);
  if (numeric !== undefined) {
    return numeric > threshold ? 'active' : 'inactive';
  }
  return rawState !== 'off' ? 'active' : 'inactive';
}

/**
 * Derives an appliance's active/inactive/unavailable indicator.
 *
 * Confirmed against kb.internal/heating-dashboard-icons.html: when
 * `active_entity` is configured, it is a separate boolean signal
 * (`is_state(active_entity, 'on')`) decoupled from the primary entity's own
 * displayed value — e.g. Hot Water's icon is driven by
 * `binary_sensor.boiler_dhw_charging`, not by a threshold on the displayed
 * temperature. When absent, falls back to the numeric-threshold/on-off model
 * on the primary entity itself.
 */
export function deriveActiveState(hass: HomeAssistant, appliance: Appliance): DerivedState {
  if (appliance.active_entity !== undefined) {
    const stateObj = hass.states[appliance.active_entity];
    if (stateObj === undefined) return 'unavailable';
    if (isUnavailableState(stateObj.state)) return 'unavailable';
    return stateObj.state === 'on' ? 'active' : 'inactive';
  }
  return deriveNumericOrOnOffState(hass, appliance.entity, appliance.active_threshold ?? 0);
}

/** Derives the target entity's own active/inactive/unavailable indicator, if configured. */
export function deriveTargetState(hass: HomeAssistant, appliance: Appliance): DerivedState | undefined {
  if (appliance.target_entity === undefined) return undefined;
  return deriveNumericOrOnOffState(hass, appliance.target_entity, 0);
}

export interface TargetDisplay {
  /** Whether the target row should render at all this cycle. */
  show: boolean;
  /** True when target_entity is configured but its own state is unavailable. */
  unavailable: boolean;
}

/**
 * Decides whether to show the target value alongside the primary value, per
 * kb.internal/heating-dashboard-icons.html's "current/target-with-collapse"
 * pattern: show current+target only while the appliance is active AND the
 * two values (rounded) differ; otherwise show current only. A target that is
 * itself unavailable is always surfaced (distinct from the collapse case) so
 * the spec's "target unavailable while primary is fine" edge case still
 * shows a clear indicator rather than silently hiding the row.
 */
export function deriveTargetDisplay(hass: HomeAssistant, appliance: Appliance): TargetDisplay {
  if (appliance.target_entity === undefined) {
    return { show: false, unavailable: false };
  }

  const targetState = deriveTargetState(hass, appliance);
  if (targetState === 'unavailable') {
    return { show: true, unavailable: true };
  }

  const activeState = deriveActiveState(hass, appliance);
  if (activeState !== 'active') {
    return { show: false, unavailable: false };
  }

  const primaryRaw = hass.states[appliance.entity]?.state;
  const targetRaw = hass.states[appliance.target_entity]?.state;
  const primaryNumeric = primaryRaw !== undefined ? numericValue(primaryRaw) : undefined;
  const targetNumeric = targetRaw !== undefined ? numericValue(targetRaw) : undefined;

  if (primaryNumeric === undefined || targetNumeric === undefined) {
    // Non-numeric values: show whenever they differ verbatim.
    return { show: primaryRaw !== targetRaw, unavailable: false };
  }

  return { show: Math.round(primaryNumeric) !== Math.round(targetNumeric), unavailable: false };
}
