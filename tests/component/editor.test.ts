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

/** ha-entity-picker and ha-textfield aren't registered in this headless test
 * environment, so each behaves as a plain element: it still accepts the
 * property bindings our editor sets on it (.value, .hass, .label), and
 * still dispatches whatever event a real interaction would — these helpers
 * fire that event by hand. The appliance-type field is a plain native
 * <select>, so selectType() below drives it with real DOM interaction. */
function pickEntity(root: ShadowRoot, selector: string, value: string): void {
  const picker = root.querySelector(selector)!;
  picker.dispatchEvent(new CustomEvent('value-changed', { detail: { value }, bubbles: true }));
}

function typeIntoTextField(root: ShadowRoot, selector: string, value: string): void {
  const field = root.querySelector(selector) as unknown as { value: string };
  field.value = value;
  (field as unknown as EventTarget).dispatchEvent(new Event('input', { bubbles: true }));
}

function selectType(root: ShadowRoot, typeId: string): void {
  const select = root.querySelector<HTMLSelectElement>('[data-field="new-appliance-type"]')!;
  select.value = typeId;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('ha-simple-appliance-card-editor', () => {
  it('adding a Generic appliance (default type) emits config-changed with one blank appliance', async () => {
    const el = await renderEditor({ type: 'custom:ha-simple-appliance-card', appliances: [] });

    const listener = oneEvent(el, 'config-changed');
    el.shadowRoot!.querySelector<HTMLButtonElement>('.add-appliance')!.click();
    const event = await listener;

    const detail = (event as CustomEvent<{ config: CardConfig }>).detail;
    expect(detail.config.appliances).to.have.lengthOf(1);
    expect(detail.config.appliances?.[0]).to.deep.equal({ entity: '' });
  });

  it('selecting "Hot Water" as type then clicking Add produces one appliance pre-filled with its name/icon, entity/active/target left blank', async () => {
    const el = await renderEditor({ type: 'custom:ha-simple-appliance-card', appliances: [] });

    selectType(el.shadowRoot!, 'hot_water');
    const listener = oneEvent(el, 'config-changed');
    el.shadowRoot!.querySelector<HTMLButtonElement>('.add-appliance')!.click();
    const event = await listener;

    const detail = (event as CustomEvent<{ config: CardConfig }>).detail;
    expect(detail.config.appliances).to.have.lengthOf(1);
    expect(detail.config.appliances?.[0]).to.deep.equal({
      entity: '',
      name: 'Hot Water',
      icon: 'mdi:water-boiler',
    });
  });

  it('the type selector resets to Generic after adding, so a second Add defaults to blank again', async () => {
    const el = await renderEditor({ type: 'custom:ha-simple-appliance-card', appliances: [] });

    selectType(el.shadowRoot!, 'gas_burner');
    let listener = oneEvent(el, 'config-changed');
    el.shadowRoot!.querySelector<HTMLButtonElement>('.add-appliance')!.click();
    await listener;
    await el.updateComplete;

    listener = oneEvent(el, 'config-changed');
    el.shadowRoot!.querySelector<HTMLButtonElement>('.add-appliance')!.click();
    const event = await listener;

    const detail = (event as CustomEvent<{ config: CardConfig }>).detail;
    expect(detail.config.appliances).to.have.lengthOf(2);
    expect(detail.config.appliances?.[1]).to.deep.equal({ entity: '' });
  });

  it('each appliance row renders inside a collapsible ha-expansion-panel', async () => {
    const el = await renderEditor({
      type: 'custom:ha-simple-appliance-card',
      appliances: [{ entity: 'sensor.a' }],
    });
    expect(el.shadowRoot!.querySelector('ha-expansion-panel')).to.exist;
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

  it('editing the name text field emits config-changed with the updated value', async () => {
    const el = await renderEditor({
      type: 'custom:ha-simple-appliance-card',
      appliances: [{ entity: 'sensor.a' }],
    });

    const listener = oneEvent(el, 'config-changed');
    typeIntoTextField(el.shadowRoot!, '[data-field="name"]', 'My Pump');
    const event = await listener;

    const detail = (event as CustomEvent<{ config: CardConfig }>).detail;
    expect(detail.config.appliances?.[0]?.name).to.equal('My Pump');
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

  it('overriding a preset-added appliance name via its own field still works (2.2)', async () => {
    const el = await renderEditor({ type: 'custom:ha-simple-appliance-card', appliances: [] });

    selectType(el.shadowRoot!, 'circulation_pump');
    let listener = oneEvent(el, 'config-changed');
    el.shadowRoot!.querySelector<HTMLButtonElement>('.add-appliance')!.click();
    await listener;
    await el.updateComplete;

    listener = oneEvent(el, 'config-changed');
    typeIntoTextField(el.shadowRoot!, '[data-field="name"]', 'My Pump');
    const event = (await listener) as CustomEvent<{ config: CardConfig }>;
    expect(event.detail.config.appliances?.[0]?.name).to.equal('My Pump');
  });

  it('every field row (entity pickers, text fields) renders inside a .field-row container (2.3)', async () => {
    const el = await renderEditor({
      type: 'custom:ha-simple-appliance-card',
      appliances: [{ entity: 'sensor.a' }],
    });

    const fieldSelectors = [
      '[data-field="entity"]',
      '[data-field="active_entity"]',
      '[data-field="target_entity"]',
      '[data-field="name"]',
      '[data-field="icon"]',
      '[data-field="active_threshold"]',
    ];
    for (const selector of fieldSelectors) {
      const field = el.shadowRoot!.querySelector(selector)!;
      expect(field.closest('.field-row'), `${selector} should be inside a .field-row`).to.exist;
    }
  });

  it('each appliance section has a leading icon matching its configured icon, or a fallback (2.3)', async () => {
    const el = await renderEditor({
      type: 'custom:ha-simple-appliance-card',
      appliances: [
        { entity: 'sensor.a', icon: 'mdi:water-boiler' },
        { entity: 'sensor.b' },
      ],
    });

    const panels = el.shadowRoot!.querySelectorAll('ha-expansion-panel');
    expect(panels).to.have.lengthOf(2);

    const iconWithIcon = panels[0]!.querySelector('ha-icon[slot="leading-icon"]');
    expect(iconWithIcon?.getAttribute('icon')).to.equal('mdi:water-boiler');

    const iconWithoutIcon = panels[1]!.querySelector('ha-icon[slot="leading-icon"]');
    expect(iconWithoutIcon?.getAttribute('icon')).to.equal('mdi:power-plug');
  });

  it('expanding one appliance section does not change another section’s expanded state (2.3)', async () => {
    const el = await renderEditor({
      type: 'custom:ha-simple-appliance-card',
      appliances: [{ entity: 'sensor.a' }, { entity: 'sensor.b' }],
    });

    const panels = el.shadowRoot!.querySelectorAll('ha-expansion-panel');
    expect(panels).to.have.lengthOf(2);
    const [first, second] = panels as unknown as [
      HTMLElement & { expanded: boolean },
      HTMLElement & { expanded: boolean },
    ];

    first.expanded = false;
    second.expanded = false;
    await el.updateComplete;

    first.expanded = true;
    await el.updateComplete;

    expect(first.expanded).to.be.true;
    expect(second.expanded).to.be.false;
  });

  it('the restyled type control is still a native <select> that fires change and adds a pre-filled appliance (2.3)', async () => {
    const el = await renderEditor({ type: 'custom:ha-simple-appliance-card', appliances: [] });

    const select = el.shadowRoot!.querySelector<HTMLSelectElement>(
      '[data-field="new-appliance-type"]',
    );
    expect(select).to.exist;
    expect(select!.tagName).to.equal('SELECT');
    expect(select!.closest('.field-row'), 'type select should be inside a .field-row').to.exist;

    selectType(el.shadowRoot!, 'hot_water');
    const listener = oneEvent(el, 'config-changed');
    el.shadowRoot!.querySelector<HTMLButtonElement>('.add-appliance')!.click();
    const event = await listener;

    const detail = (event as CustomEvent<{ config: CardConfig }>).detail;
    expect(detail.config.appliances?.[0]).to.deep.equal({
      entity: '',
      name: 'Hot Water',
      icon: 'mdi:water-boiler',
    });
  });

  it('renders without error with zero appliances configured (2.3)', async () => {
    const el = await renderEditor({ type: 'custom:ha-simple-appliance-card', appliances: [] });

    expect(el.shadowRoot!.querySelector('ha-expansion-panel')).to.not.exist;
    expect(el.shadowRoot!.querySelector('[data-field="new-appliance-type"]')).to.exist;
    expect(el.shadowRoot!.querySelector('.add-appliance')).to.exist;
  });
});
