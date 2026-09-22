import type { Appliance, AppliancePreset } from './types.js';

/**
 * The 4 built-in heating-dashboard preset slots (spec FR-005), confirmed
 * against kb.internal/heating-dashboard-icons.html and the live reference
 * dashboard. Circulation Pump and Gas Burner are two status readouts of one
 * physical gas boiler (not separate equipment) and use the numeric-threshold
 * active mode; Hot Water and Heating Circuit each have a separate boolean
 * entity driving their active indicator, decoupled from the temperature they
 * display.
 */
export const HEATING_PRESET_SLOTS: readonly AppliancePreset[] = [
  {
    id: 'circulation_pump',
    name: 'Circulation Pump',
    icon: 'mdi:pump',
    roles: { primary: true, driving: false, target: false },
  },
  {
    id: 'gas_burner',
    name: 'Gas Burner',
    icon: 'mdi:fire',
    roles: { primary: true, driving: false, target: false },
  },
  {
    id: 'hot_water',
    name: 'Hot Water',
    icon: 'mdi:water-boiler',
    roles: { primary: true, driving: true, target: true },
  },
  {
    id: 'heating_circuit',
    name: 'Heating Circuit',
    icon: 'mdi:radiator',
    roles: { primary: true, driving: true, target: true },
  },
];

/** Entity ID(s) a caller supplies for one driving+target preset slot. */
export interface DrivingSlotInput {
  entity: string;
  active_entity?: string;
  target_entity?: string;
}

/** Input to {@link applyHeatingPreset}: entity ID(s) per slot, all optional (partial application allowed). */
export interface HeatingPresetInput {
  circulation_pump?: string;
  gas_burner?: string;
  hot_water?: DrivingSlotInput;
  heating_circuit?: DrivingSlotInput;
}

function applianceFromSlot(
  slot: AppliancePreset,
  input: string | DrivingSlotInput,
): Appliance {
  const base: Appliance = {
    entity: typeof input === 'string' ? input : input.entity,
    name: slot.name,
    icon: slot.icon,
  };
  if (slot.default_active_threshold !== undefined) {
    base.active_threshold = slot.default_active_threshold;
  }
  if (typeof input !== 'string') {
    if (input.active_entity !== undefined) base.active_entity = input.active_entity;
    if (input.target_entity !== undefined) base.target_entity = input.target_entity;
  }
  return base;
}

/**
 * Applies the built-in heating preset (FR-006): produces one `Appliance` per
 * supplied slot, in `HEATING_PRESET_SLOTS` order, using each slot's default
 * name/icon. Slots not present in `input` are omitted (partial application).
 */
export function applyHeatingPreset(input: HeatingPresetInput): Appliance[] {
  const appliances: Appliance[] = [];
  for (const slot of HEATING_PRESET_SLOTS) {
    const slotInput = input[slot.id as keyof HeatingPresetInput];
    if (slotInput === undefined) continue;
    appliances.push(applianceFromSlot(slot, slotInput));
  }
  return appliances;
}
