import { expect } from '@open-wc/testing';
import { normalizeConfig } from '../../src/config.js';
import type { CardConfig } from '../../src/types.js';

const TYPE = 'custom:ha-simple-appliance-card';

describe('config validation (setConfig)', () => {
  it('accepts a minimal valid config (one appliance, entity only)', () => {
    const config: CardConfig = {
      type: TYPE,
      appliances: [{ entity: 'sensor.boiler_heatingpumpmod' }],
    };
    expect(() => normalizeConfig(config)).to.not.throw();
    const normalized = normalizeConfig(config);
    expect(normalized.appliances).to.have.lengthOf(1);
    expect(normalized.appliances[0]?.entity).to.equal('sensor.boiler_heatingpumpmod');
  });

  it('accepts a maximal valid config (all optional fields set)', () => {
    const config: CardConfig = {
      type: TYPE,
      title: 'Heating',
      appliances: [
        {
          entity: 'sensor.boiler_dhw_curtemp',
          target_entity: 'number.boiler_dhw_seltemp',
          name: 'Hot Water',
          icon: 'mdi:water-boiler',
          active_threshold: 5,
        },
      ],
    };
    expect(() => normalizeConfig(config)).to.not.throw();
  });

  it('accepts an absent appliances array as valid (empty state)', () => {
    const config: CardConfig = { type: TYPE };
    const normalized = normalizeConfig(config);
    expect(normalized.appliances).to.deep.equal([]);
  });

  it('accepts an empty appliances array as valid (empty state)', () => {
    const config: CardConfig = { type: TYPE, appliances: [] };
    expect(() => normalizeConfig(config)).to.not.throw();
  });

  it('throws when appliances is present but not an array', () => {
    const config = { type: TYPE, appliances: 'not-an-array' } as unknown as CardConfig;
    expect(() => normalizeConfig(config)).to.throw(/appliances/i);
  });

  it('throws when an appliance is missing entity', () => {
    const config = {
      type: TYPE,
      appliances: [{ name: 'No Entity' }],
    } as unknown as CardConfig;
    expect(() => normalizeConfig(config)).to.throw(/entity/i);
  });

  it('throws when an appliance entity is not a string', () => {
    const config = {
      type: TYPE,
      appliances: [{ entity: 42 }],
    } as unknown as CardConfig;
    expect(() => normalizeConfig(config)).to.throw(/entity/i);
  });

  it('throws when target_entity is present but not a string', () => {
    const config = {
      type: TYPE,
      appliances: [{ entity: 'sensor.x', target_entity: 42 }],
    } as unknown as CardConfig;
    expect(() => normalizeConfig(config)).to.throw(/target_entity/i);
  });

  it('throws when name is present but not a string', () => {
    const config = {
      type: TYPE,
      appliances: [{ entity: 'sensor.x', name: 42 }],
    } as unknown as CardConfig;
    expect(() => normalizeConfig(config)).to.throw(/name/i);
  });

  it('throws when icon is present but not a string', () => {
    const config = {
      type: TYPE,
      appliances: [{ entity: 'sensor.x', icon: 42 }],
    } as unknown as CardConfig;
    expect(() => normalizeConfig(config)).to.throw(/icon/i);
  });

  it('throws when active_threshold is present but not a number', () => {
    const config = {
      type: TYPE,
      appliances: [{ entity: 'sensor.x', active_threshold: 'high' }],
    } as unknown as CardConfig;
    expect(() => normalizeConfig(config)).to.throw(/active_threshold/i);
  });
});
