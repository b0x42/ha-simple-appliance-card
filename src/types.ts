/**
 * Shared config/view-model types for the Simple Appliance Card.
 * Field shapes mirror specs/001-configurable-appliance-cards/data-model.md.
 */

import type { HomeAssistant, LovelaceCardConfig } from 'custom-card-helpers';

export type { HomeAssistant };

/** One configured item on the card (data-model.md > Appliance). */
export interface Appliance {
  /** Required primary entity. */
  entity: string;
  /** Optional target/setpoint entity, shown as current-vs-target. */
  target_entity?: string;
  /** Display-name override; falls back to the entity's own friendly_name. */
  name?: string;
  /** Icon override (mdi:*); falls back to the entity's own icon. */
  icon?: string;
  /** Active-state threshold for numeric entities. Default 0. */
  active_threshold?: number;
}

/** A built-in, named default appliance (data-model.md > AppliancePreset). */
export interface AppliancePreset {
  id: string;
  name: string;
  icon: string;
  roles: {
    primary: true;
    target: boolean;
  };
  default_active_threshold?: number;
}

/** The complete configuration for one card instance. */
export interface CardConfig extends LovelaceCardConfig {
  type: string;
  appliances?: Appliance[];
  title?: string;
}

/** Derived (not stored) active-state of an appliance's primary entity. */
export type DerivedState = 'active' | 'inactive' | 'unavailable';
