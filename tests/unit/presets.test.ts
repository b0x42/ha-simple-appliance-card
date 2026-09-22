import { expect } from '@open-wc/testing';
import { HEATING_PRESET_SLOTS, applyHeatingPreset } from '../../src/presets.js';

describe('built-in heating preset definitions', () => {
  it('defines exactly 4 fixed slots', () => {
    expect(HEATING_PRESET_SLOTS.map((s) => s.id)).to.deep.equal([
      'circulation_pump',
      'gas_burner',
      'hot_water',
      'heating_circuit',
    ]);
  });

  it('marks circulation_pump and gas_burner as primary-only (no driving, no target)', () => {
    const pump = HEATING_PRESET_SLOTS.find((s) => s.id === 'circulation_pump')!;
    const burner = HEATING_PRESET_SLOTS.find((s) => s.id === 'gas_burner')!;
    expect(pump.roles).to.deep.equal({ primary: true, driving: false, target: false });
    expect(burner.roles).to.deep.equal({ primary: true, driving: false, target: false });
  });

  it('marks hot_water and heating_circuit as driving + target slots', () => {
    const hotWater = HEATING_PRESET_SLOTS.find((s) => s.id === 'hot_water')!;
    const heatingCircuit = HEATING_PRESET_SLOTS.find((s) => s.id === 'heating_circuit')!;
    expect(hotWater.roles).to.deep.equal({ primary: true, driving: true, target: true });
    expect(heatingCircuit.roles).to.deep.equal({ primary: true, driving: true, target: true });
  });
});

describe('applyHeatingPreset', () => {
  it('produces a primary-only Appliance for circulation_pump using preset name/icon', () => {
    const appliances = applyHeatingPreset({ circulation_pump: 'sensor.boiler_heatingpumpmod' });
    expect(appliances).to.have.lengthOf(1);
    expect(appliances[0]).to.deep.include({
      entity: 'sensor.boiler_heatingpumpmod',
      name: 'Circulation Pump',
    });
    expect(appliances[0]?.active_entity).to.be.undefined;
    expect(appliances[0]?.target_entity).to.be.undefined;
  });

  it('produces a primary-only Appliance for gas_burner using preset name/icon', () => {
    const appliances = applyHeatingPreset({ gas_burner: 'sensor.boiler_curburnpow' });
    expect(appliances).to.have.lengthOf(1);
    expect(appliances[0]).to.deep.include({
      entity: 'sensor.boiler_curburnpow',
      name: 'Gas Burner',
    });
  });

  it('produces a full Appliance for hot_water with active_entity and target_entity', () => {
    const appliances = applyHeatingPreset({
      hot_water: {
        entity: 'sensor.boiler_dhw_curtemp',
        active_entity: 'binary_sensor.boiler_dhw_charging',
        target_entity: 'number.boiler_dhw_seltemp',
      },
    });
    expect(appliances).to.have.lengthOf(1);
    expect(appliances[0]).to.deep.include({
      entity: 'sensor.boiler_dhw_curtemp',
      active_entity: 'binary_sensor.boiler_dhw_charging',
      target_entity: 'number.boiler_dhw_seltemp',
      name: 'Hot Water',
    });
  });

  it('produces a full Appliance for heating_circuit with active_entity and target_entity', () => {
    const appliances = applyHeatingPreset({
      heating_circuit: {
        entity: 'sensor.boiler_curflowtemp',
        active_entity: 'binary_sensor.boiler_heatingactive',
        target_entity: 'sensor.thermostat_hc1_targetflowtemp',
      },
    });
    expect(appliances).to.have.lengthOf(1);
    expect(appliances[0]).to.deep.include({
      entity: 'sensor.boiler_curflowtemp',
      active_entity: 'binary_sensor.boiler_heatingactive',
      target_entity: 'sensor.thermostat_hc1_targetflowtemp',
      name: 'Heating Circuit',
    });
  });

  it('produces all 4 appliances in slot order when all 4 slots are supplied', () => {
    const appliances = applyHeatingPreset({
      circulation_pump: 'sensor.boiler_heatingpumpmod',
      gas_burner: 'sensor.boiler_curburnpow',
      hot_water: {
        entity: 'sensor.boiler_dhw_curtemp',
        active_entity: 'binary_sensor.boiler_dhw_charging',
        target_entity: 'number.boiler_dhw_seltemp',
      },
      heating_circuit: {
        entity: 'sensor.boiler_curflowtemp',
        active_entity: 'binary_sensor.boiler_heatingactive',
        target_entity: 'sensor.thermostat_hc1_targetflowtemp',
      },
    });
    expect(appliances.map((a) => a.entity)).to.deep.equal([
      'sensor.boiler_heatingpumpmod',
      'sensor.boiler_curburnpow',
      'sensor.boiler_dhw_curtemp',
      'sensor.boiler_curflowtemp',
    ]);
  });

  it('omits a slot entirely when it is not supplied (partial application)', () => {
    const appliances = applyHeatingPreset({ circulation_pump: 'sensor.boiler_heatingpumpmod' });
    expect(appliances.map((a) => a.name)).to.deep.equal(['Circulation Pump']);
  });
});
