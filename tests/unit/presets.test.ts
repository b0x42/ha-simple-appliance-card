import { expect } from '@open-wc/testing';
import { HEATING_PRESET_SLOTS } from '../../src/presets.js';

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

  it('gives every slot a distinct default name and icon', () => {
    const names = HEATING_PRESET_SLOTS.map((s) => s.name);
    const icons = HEATING_PRESET_SLOTS.map((s) => s.icon);
    expect(new Set(names).size).to.equal(4);
    expect(new Set(icons).size).to.equal(4);
  });
});
