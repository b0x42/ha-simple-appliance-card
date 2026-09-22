import { expect } from '@open-wc/testing';
import { deriveActiveState, deriveTargetDisplay } from '../../src/state.js';
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

describe('state derivation (deriveActiveState) — numeric-threshold/on-off mode', () => {
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

describe('state derivation (deriveActiveState) — separate boolean active_entity mode', () => {
  it('is active when active_entity is "on", regardless of the primary entity value', () => {
    const hass = fakeHass({
      'binary_sensor.boiler_dhw_charging': 'on',
      'sensor.boiler_dhw_curtemp': '38.2',
    });
    const appliance: Appliance = {
      entity: 'sensor.boiler_dhw_curtemp',
      active_entity: 'binary_sensor.boiler_dhw_charging',
    };
    expect(deriveActiveState(hass, appliance)).to.equal('active');
  });

  it('is inactive when active_entity is "off", even if the primary numeric value is > 0', () => {
    const hass = fakeHass({
      'binary_sensor.boiler_dhw_charging': 'off',
      'sensor.boiler_dhw_curtemp': '38.2',
    });
    const appliance: Appliance = {
      entity: 'sensor.boiler_dhw_curtemp',
      active_entity: 'binary_sensor.boiler_dhw_charging',
    };
    expect(deriveActiveState(hass, appliance)).to.equal('inactive');
  });

  it('is unavailable when active_entity is unavailable, even if the primary entity is fine', () => {
    const hass = fakeHass({
      'binary_sensor.boiler_dhw_charging': 'unavailable',
      'sensor.boiler_dhw_curtemp': '38.2',
    });
    const appliance: Appliance = {
      entity: 'sensor.boiler_dhw_curtemp',
      active_entity: 'binary_sensor.boiler_dhw_charging',
    };
    expect(deriveActiveState(hass, appliance)).to.equal('unavailable');
  });
});

describe('target display collapse rule (deriveTargetDisplay)', () => {
  it('does not show a target row when no target_entity is configured', () => {
    const hass = fakeHass({ 'sensor.boiler_heatingpumpmod': '42' });
    const appliance: Appliance = { entity: 'sensor.boiler_heatingpumpmod' };
    expect(deriveTargetDisplay(hass, appliance)).to.deep.equal({ show: false, unavailable: false });
  });

  it('shows current+target when active and the rounded values differ', () => {
    const hass = fakeHass({
      'binary_sensor.boiler_heatingactive': 'on',
      'sensor.boiler_curflowtemp': '42.1',
      'sensor.thermostat_hc1_targetflowtemp': '45.0',
    });
    const appliance: Appliance = {
      entity: 'sensor.boiler_curflowtemp',
      active_entity: 'binary_sensor.boiler_heatingactive',
      target_entity: 'sensor.thermostat_hc1_targetflowtemp',
    };
    expect(deriveTargetDisplay(hass, appliance)).to.deep.equal({ show: true, unavailable: false });
  });

  it('collapses to current-only when active but the rounded values are equal', () => {
    const hass = fakeHass({
      'binary_sensor.boiler_heatingactive': 'on',
      'sensor.boiler_curflowtemp': '45.1',
      'sensor.thermostat_hc1_targetflowtemp': '45.0',
    });
    const appliance: Appliance = {
      entity: 'sensor.boiler_curflowtemp',
      active_entity: 'binary_sensor.boiler_heatingactive',
      target_entity: 'sensor.thermostat_hc1_targetflowtemp',
    };
    expect(deriveTargetDisplay(hass, appliance)).to.deep.equal({ show: false, unavailable: false });
  });

  it('collapses to current-only when inactive, even if values differ', () => {
    const hass = fakeHass({
      'binary_sensor.boiler_heatingactive': 'off',
      'sensor.boiler_curflowtemp': '20.0',
      'sensor.thermostat_hc1_targetflowtemp': '45.0',
    });
    const appliance: Appliance = {
      entity: 'sensor.boiler_curflowtemp',
      active_entity: 'binary_sensor.boiler_heatingactive',
      target_entity: 'sensor.thermostat_hc1_targetflowtemp',
    };
    expect(deriveTargetDisplay(hass, appliance)).to.deep.equal({ show: false, unavailable: false });
  });

  it('always surfaces an unavailable target, independent of the collapse rule', () => {
    const hass = fakeHass({
      'binary_sensor.boiler_heatingactive': 'on',
      'sensor.boiler_curflowtemp': '42.1',
      'sensor.thermostat_hc1_targetflowtemp': 'unavailable',
    });
    const appliance: Appliance = {
      entity: 'sensor.boiler_curflowtemp',
      active_entity: 'binary_sensor.boiler_heatingactive',
      target_entity: 'sensor.thermostat_hc1_targetflowtemp',
    };
    expect(deriveTargetDisplay(hass, appliance)).to.deep.equal({ show: true, unavailable: true });
  });
});
