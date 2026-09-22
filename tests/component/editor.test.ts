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

describe('ha-simple-appliance-card-editor', () => {
  it('adding an appliance row emits config-changed with one more appliance', async () => {
    const el = await renderEditor({ type: 'custom:ha-simple-appliance-card', appliances: [] });

    const listener = oneEvent(el, 'config-changed');
    el.shadowRoot!.querySelector<HTMLButtonElement>('.add-appliance')!.click();
    const event = await listener;

    const detail = (event as CustomEvent<{ config: CardConfig }>).detail;
    expect(detail.config.appliances).to.have.lengthOf(1);
  });

  it('editing an appliance entity field emits config-changed with the updated value', async () => {
    const el = await renderEditor({
      type: 'custom:ha-simple-appliance-card',
      appliances: [{ entity: 'sensor.a' }],
    });

    const listener = oneEvent(el, 'config-changed');
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('[data-field="entity"]')!;
    input.value = 'sensor.b';
    input.dispatchEvent(new Event('change', { bubbles: true }));
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
});
