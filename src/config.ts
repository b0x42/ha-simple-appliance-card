import type { Appliance, CardConfig } from './types.js';

function assertOptionalString(value: unknown, field: string): void {
  if (value !== undefined && typeof value !== 'string') {
    throw new Error(`ha-simple-appliance-card: "${field}" must be a string when set.`);
  }
}

function normalizeAppliance(raw: unknown, index: number): Appliance {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`ha-simple-appliance-card: appliances[${index}] must be an object.`);
  }
  const candidate = raw as Record<string, unknown>;

  if (typeof candidate['entity'] !== 'string' || candidate['entity'].length === 0) {
    throw new Error(
      `ha-simple-appliance-card: appliances[${index}].entity is required and must be a non-empty string.`,
    );
  }

  assertOptionalString(candidate['active_entity'], `appliances[${index}].active_entity`);
  assertOptionalString(candidate['target_entity'], `appliances[${index}].target_entity`);
  assertOptionalString(candidate['name'], `appliances[${index}].name`);
  assertOptionalString(candidate['icon'], `appliances[${index}].icon`);

  if (candidate['active_threshold'] !== undefined && typeof candidate['active_threshold'] !== 'number') {
    throw new Error(
      `ha-simple-appliance-card: appliances[${index}].active_threshold must be a number when set.`,
    );
  }

  const appliance: Appliance = { entity: candidate['entity'] };
  if (typeof candidate['active_entity'] === 'string') appliance.active_entity = candidate['active_entity'];
  if (typeof candidate['target_entity'] === 'string') appliance.target_entity = candidate['target_entity'];
  if (typeof candidate['name'] === 'string') appliance.name = candidate['name'];
  if (typeof candidate['icon'] === 'string') appliance.icon = candidate['icon'];
  if (typeof candidate['active_threshold'] === 'number')
    appliance.active_threshold = candidate['active_threshold'];
  return appliance;
}

/**
 * Validates and normalizes a raw Lovelace card config into a `CardConfig`
 * with `appliances` always present as an array. Throws a descriptive Error
 * on any invalid field, per data-model.md's Appliance/CardConfig validation
 * rules.
 */
export function normalizeConfig(config: CardConfig): CardConfig & { appliances: Appliance[] } {
  if (config === undefined || config === null || typeof config !== 'object') {
    throw new Error('ha-simple-appliance-card: config is required.');
  }

  const rawAppliances = config.appliances;
  if (rawAppliances !== undefined && !Array.isArray(rawAppliances)) {
    throw new Error('ha-simple-appliance-card: "appliances" must be an array when set.');
  }

  const appliances = (rawAppliances ?? []).map((entry, index) => normalizeAppliance(entry, index));

  return { ...config, appliances };
}
