import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import '../../src/editor.js';
import type { HaSimpleApplianceCardEditor } from '../../src/editor.js';
import type { CardConfig, HomeAssistant } from '../../src/types.js';

function fakeHass(): HomeAssistant {
  return { states: {} } as unknown as HomeAssistant;
}

async function renderEditor(config: CardConfig): Promise<HaSimpleApplianceCardEditor> {
  const el = await fixture<HaSimpleApplianceCardEditor>(
    html`<ha-simple-appliance-card-editor></ha-simple-appliance-card-editor>`,
  );
  el.hass = fakeHass();
  el.setConfig(config);
  await el.updateComplete;
  return el;
}

/** ha-entity-picker isn't registered in this headless test environment, so
 * it behaves as a plain element: still accepts .hass/.value property
 * bindings, and this simulates a user's selection the same way the real
 * picker's own `value-changed` event does. */
function pickEntity(root: ShadowRoot, selector: string, value: string): void {
  const picker = root.querySelector(selector)!;
  picker.dispatchEvent(new CustomEvent('value-changed', { detail: { value }, bubbles: true }));
}

describe('ha-simple-appliance-card-editor', () => {
  it('adding an appliance row emits config-changed with one more appliance', async () => {
    const el = await renderEditor({ type: 'custom:ha-simple-appliance-card', appliances: [] });

    const listener = oneEvent(el, 'config-changed');
    el.shadowRoot!.querySelector<HTMLButtonElement>('.add-appliance')!.click();
    const event = await listener;

    const detail = (event as CustomEvent<{ config: CardConfig }>).detail;
    expect(detail.config.appliances).to.have.lengthOf(1);
  });

  it('editing an appliance entity picker emits config-changed with the updated value', async () => {
    const el = await renderEditor({
      type: 'custom:ha-simple-appliance-card',
      appliances: [{ entity: 'sensor.a' }],
    });

    const listener = oneEvent(el, 'config-changed');
    pickEntity(el.shadowRoot!, '[data-field="entity"]', 'sensor.b');
    const event = await listener;

    const detail = (event as CustomEvent<{ config: CardConfig }>).detail;
    expect(detail.config.appliances?.[0]?.entity).to.equal('sensor.b');
  });

  it('removing an appliance row emits config-changed with that appliance gone', async () => {
    const el = await renderEditor({
      type: 'custom:ha-simple-appliance-card',
      appliances: [{ entity: 'sensor.a' }, { entity: 'sensor.b' }],
    });

    const listener = oneEvent(el, 'config-changed');
    el.shadowRoot!.querySelector<HTMLButtonElement>('.remove-appliance')!.click();
    const event = await listener;

    const detail = (event as CustomEvent<{ config: CardConfig }>).detail;
    expect(detail.config.appliances).to.have.lengthOf(1);
    expect(detail.config.appliances?.[0]?.entity).to.equal('sensor.b');
  });

  it('reordering (move down) an appliance row emits config-changed with the new order', async () => {
    const el = await renderEditor({
      type: 'custom:ha-simple-appliance-card',
      appliances: [{ entity: 'sensor.a' }, { entity: 'sensor.b' }],
    });

    const listener = oneEvent(el, 'config-changed');
    el.shadowRoot!.querySelector<HTMLButtonElement>('.move-down')!.click();
    const event = await listener;

    const detail = (event as CustomEvent<{ config: CardConfig }>).detail;
    expect(detail.config.appliances?.[0]?.entity).to.equal('sensor.b');
    expect(detail.config.appliances?.[1]?.entity).to.equal('sensor.a');
  });

  it('applying the heating preset with 4 slots emits config-changed with 4 appliances using preset defaults (2.1)', async () => {
    const el = await renderEditor({ type: 'custom:ha-simple-appliance-card', appliances: [] });
    const root = el.shadowRoot!;

    pickEntity(root, '[data-preset-field="circulation_pump"]', 'sensor.boiler_heatingpumpmod');
    pickEntity(root, '[data-preset-field="gas_burner"]', 'sensor.boiler_curburnpow');
    pickEntity(root, '[data-preset-field="hot_water.entity"]', 'sensor.boiler_dhw_curtemp');
    pickEntity(
      root,
      '[data-preset-field="hot_water.active_entity"]',
      'binary_sensor.boiler_dhw_charging',
    );
    pickEntity(root, '[data-preset-field="hot_water.target_entity"]', 'number.boiler_dhw_seltemp');
    pickEntity(root, '[data-preset-field="heating_circuit.entity"]', 'sensor.boiler_curflowtemp');
    pickEntity(
      root,
      '[data-preset-field="heating_circuit.active_entity"]',
      'binary_sensor.boiler_heatingactive',
    );
    pickEntity(
      root,
      '[data-preset-field="heating_circuit.target_entity"]',
      'sensor.thermostat_hc1_targetflowtemp',
    );

    const listener = oneEvent(el, 'config-changed');
    root.querySelector<HTMLButtonElement>('.apply-preset')!.click();
    const event = await listener;

    const detail = (event as CustomEvent<{ config: CardConfig }>).detail;
    expect(detail.config.appliances).to.have.lengthOf(4);
    expect(detail.config.appliances?.map((a) => a.name)).to.deep.equal([
      'Circulation Pump',
      'Gas Burner',
      'Hot Water',
      'Heating Circuit',
    ]);
  });

  it('applying the preset appends to existing appliances without disturbing them, and an override on one preset slot leaves the rest on defaults (2.2)', async () => {
    const el = await renderEditor({
      type: 'custom:ha-simple-appliance-card',
      appliances: [{ entity: 'sensor.existing' }],
    });

    pickEntity(el.shadowRoot!, '[data-preset-field="circulation_pump"]', 'sensor.boiler_heatingpumpmod');

    const listener = oneEvent(el, 'config-changed');
    el.shadowRoot!.querySelector<HTMLButtonElement>('.apply-preset')!.click();
    const firstEvent = (await listener) as CustomEvent<{ config: CardConfig }>;
    expect(firstEvent.detail.config.appliances).to.have.lengthOf(2);
    expect(firstEvent.detail.config.appliances?.[1]?.name).to.equal('Circulation Pump');

    // Override the newly-added preset appliance's name via the normal per-row field.
    await el.updateComplete;
    const listener2 = oneEvent(el, 'config-changed');
    const nameInput = el.shadowRoot!.querySelectorAll<HTMLInputElement>('[data-field="name"]')[1]!;
    nameInput.value = 'My Pump';
    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    const secondEvent = (await listener2) as CustomEvent<{ config: CardConfig }>;
    expect(secondEvent.detail.config.appliances?.[1]?.name).to.equal('My Pump');
    expect(secondEvent.detail.config.appliances?.[0]?.entity).to.equal('sensor.existing');
  });
});
