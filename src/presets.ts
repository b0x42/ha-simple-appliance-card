import type { AppliancePreset } from './types.js';

/**
 * The 4 built-in heating-dashboard preset slots (spec FR-005), confirmed
 * against kb.internal/heating-dashboard-icons.html and the live reference
 * dashboard. Circulation Pump and Gas Burner are two status readouts of one
 * physical gas boiler (not separate equipment) and use the numeric-threshold
 * active mode; Hot Water and Heating Circuit each have a separate boolean
 * entity driving their active indicator, decoupled from the temperature they
 * display.
 *
 * Used by the editor's "add appliance" flow (pick a type, then add) to
 * pre-fill a new appliance's name/icon/default threshold — the user still
 * fills in the entity/active_entity/target_entity themselves via that
 * appliance's own entity pickers.
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
