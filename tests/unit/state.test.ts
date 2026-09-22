import { expect } from '@open-wc/testing';
import { deriveActiveState } from '../../src/state.js';
import type { Appliance, HomeAssistant } from '../../src/types.js';

function fakeHass(states: Record<string, string>): HomeAssistant {
  const entries = Object.fromEntries(
    Object.entries(states).map(([entityId, state]) => [
      entityId,
      { entity_id: entityId, state, attributes: {} },
    ]),
  );
  return { states: entries } as unknown as HomeAssistant;
}

describe('state derivation (deriveActiveState)', () => {
  it('is active when a numeric primary value is above the default threshold (0)', () => {
    const hass = fakeHass({ 'sensor.boiler_heatingpumpmod': '42' });
    const appliance: Appliance = { entity: 'sensor.boiler_heatingpumpmod' };
    expect(deriveActiveState(hass, appliance)).to.equal('active');
  });

  it('is inactive when a numeric primary value is at or below the default threshold (0)', () => {
    const hass = fakeHass({ 'sensor.boiler_heatingpumpmod': '0' });
    const appliance: Appliance = { entity: 'sensor.boiler_heatingpumpmod' };
    expect(deriveActiveState(hass, appliance)).to.equal('inactive');
  });

  it('respects a custom active_threshold', () => {
    const hass = fakeHass({ 'sensor.boiler_curburnpow': '3' });
    const appliance: Appliance = { entity: 'sensor.boiler_curburnpow', active_threshold: 5 };
    expect(deriveActiveState(hass, appliance)).to.equal('inactive');
  });

  it('is unavailable when the primary entity state is "unavailable"', () => {
    const hass = fakeHass({ 'sensor.boiler_heatingpumpmod': 'unavailable' });
    const appliance: Appliance = { entity: 'sensor.boiler_heatingpumpmod' };
    expect(deriveActiveState(hass, appliance)).to.equal('unavailable');
  });

  it('is unavailable when the primary entity state is "unknown"', () => {
    const hass = fakeHass({ 'sensor.boiler_heatingpumpmod': 'unknown' });
    const appliance: Appliance = { entity: 'sensor.boiler_heatingpumpmod' };
    expect(deriveActiveState(hass, appliance)).to.equal('unavailable');
  });

  it('is unavailable when the primary entity is absent from hass.states', () => {
    const hass = fakeHass({});
    const appliance: Appliance = { entity: 'sensor.does_not_exist' };
    expect(deriveActiveState(hass, appliance)).to.equal('unavailable');
  });

  it('falls back to base on/off state for a non-numeric entity: "on" is active', () => {
    const hass = fakeHass({ 'switch.pump': 'on' });
    const appliance: Appliance = { entity: 'switch.pump' };
    expect(deriveActiveState(hass, appliance)).to.equal('active');
  });

  it('falls back to base on/off state for a non-numeric entity: "off" is inactive', () => {
    const hass = fakeHass({ 'switch.pump': 'off' });
    const appliance: Appliance = { entity: 'switch.pump' };
    expect(deriveActiveState(hass, appliance)).to.equal('inactive');
  });
});
