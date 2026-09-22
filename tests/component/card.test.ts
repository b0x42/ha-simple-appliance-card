import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import '../../src/ha-simple-appliance-card.js';
import type { HaSimpleApplianceCard } from '../../src/ha-simple-appliance-card.js';
import type { HomeAssistant } from '../../src/types.js';

function fakeHass(
  states: Record<string, { state: string; attributes?: Record<string, unknown> }>,
): HomeAssistant {
  const entries = Object.fromEntries(
    Object.entries(states).map(([entityId, { state, attributes }]) => [
      entityId,
      { entity_id: entityId, state, attributes: attributes ?? {} },
    ]),
  );
  return { states: entries } as unknown as HomeAssistant;
}

async function renderCard(
  config: Record<string, unknown>,
  hass: HomeAssistant,
): Promise<HaSimpleApplianceCard> {
  const el = await fixture<HaSimpleApplianceCard>(
    html`<ha-simple-appliance-card></ha-simple-appliance-card>`,
  );
  el.setConfig(config as never);
  el.hass = hass;
  await el.updateComplete;
  return el;
}

describe('ha-simple-appliance-card', () => {
  it('renders one icon reflecting the configured entity current state (1.1)', async () => {
    const hass = fakeHass({ 'sensor.boiler_heatingpumpmod': { state: '42' } });
    const el = await renderCard(
      { type: 'custom:ha-simple-appliance-card', appliances: [{ entity: 'sensor.boiler_heatingpumpmod' }] },
      hass,
    );
    const appliances = el.shadowRoot!.querySelectorAll('.appliance');
    expect(appliances).to.have.lengthOf(1);
    expect(appliances[0]!.classList.contains('active')).to.be.true;
  });

  it('updates the rendered icon within 2 seconds of a live hass state change, without re-adding the element (1.2, SC-004)', async () => {
    const hass1 = fakeHass({ 'sensor.boiler_heatingpumpmod': { state: '0' } });
    const el = await renderCard(
      { type: 'custom:ha-simple-appliance-card', appliances: [{ entity: 'sensor.boiler_heatingpumpmod' }] },
      hass1,
    );
    expect(el.shadowRoot!.querySelector('.appliance')!.classList.contains('inactive')).to.be.true;

    const start = Date.now();
    const hass2 = fakeHass({ 'sensor.boiler_heatingpumpmod': { state: '42' } });
    el.hass = hass2;
    await el.updateComplete;
    const elapsedMs = Date.now() - start;

    expect(el.shadowRoot!.querySelectorAll('.appliance')).to.have.lengthOf(1);
    expect(el.shadowRoot!.querySelector('.appliance')!.classList.contains('active')).to.be.true;
    expect(elapsedMs).to.be.lessThan(2000);
  });

  it('shows a configured name/icon override instead of the entity own name/icon (1.3)', async () => {
    const hass = fakeHass({
      'sensor.boiler_heatingpumpmod': {
        state: '10',
        attributes: { friendly_name: 'Boiler Pump Modulation', icon: 'mdi:pump' },
      },
    });
    const el = await renderCard(
      {
        type: 'custom:ha-simple-appliance-card',
        appliances: [
          { entity: 'sensor.boiler_heatingpumpmod', name: 'My Heat Pump', icon: 'mdi:heat-pump' },
        ],
      },
      hass,
    );
    const appliance = el.shadowRoot!.querySelector('.appliance')!;
    expect(appliance.querySelector('.appliance-name')!.textContent).to.include('My Heat Pump');
    expect(appliance.querySelector('ha-icon')!.getAttribute('icon')).to.equal('mdi:heat-pump');
  });

  it('shows current+target only while active and the values differ (collapse rule, FR-003a)', async () => {
    const hass = fakeHass({
      'binary_sensor.boiler_heatingactive': { state: 'on' },
      'sensor.boiler_curflowtemp': { state: '42.1' },
      'sensor.thermostat_hc1_targetflowtemp': { state: '45.0' },
    });
    const el = await renderCard(
      {
        type: 'custom:ha-simple-appliance-card',
        appliances: [
          {
            entity: 'sensor.boiler_curflowtemp',
            active_entity: 'binary_sensor.boiler_heatingactive',
            target_entity: 'sensor.thermostat_hc1_targetflowtemp',
          },
        ],
      },
      hass,
    );
    const appliance = el.shadowRoot!.querySelector('.appliance')!;
    expect(appliance.querySelector('.appliance-target')).to.exist;
    expect(appliance.querySelector('.appliance-target')!.textContent).to.include('45.0');
  });

  it('hides the target row when active but rounded values are equal (collapse rule, FR-003a)', async () => {
    const hass = fakeHass({
      'binary_sensor.boiler_heatingactive': { state: 'on' },
      'sensor.boiler_curflowtemp': { state: '45.1' },
      'sensor.thermostat_hc1_targetflowtemp': { state: '45.0' },
    });
    const el = await renderCard(
      {
        type: 'custom:ha-simple-appliance-card',
        appliances: [
          {
            entity: 'sensor.boiler_curflowtemp',
            active_entity: 'binary_sensor.boiler_heatingactive',
            target_entity: 'sensor.thermostat_hc1_targetflowtemp',
          },
        ],
      },
      hass,
    );
    const appliance = el.shadowRoot!.querySelector('.appliance')!;
    expect(appliance.querySelector('.appliance-target')).to.not.exist;
  });

  it('falls back to the entity own friendly_name/icon when no override is configured', async () => {
    const hass = fakeHass({
      'sensor.boiler_heatingpumpmod': {
        state: '10',
        attributes: { friendly_name: 'Boiler Pump Modulation', icon: 'mdi:pump' },
      },
    });
    const el = await renderCard(
      { type: 'custom:ha-simple-appliance-card', appliances: [{ entity: 'sensor.boiler_heatingpumpmod' }] },
      hass,
    );
    const appliance = el.shadowRoot!.querySelector('.appliance')!;
    expect(appliance.querySelector('.appliance-name')!.textContent).to.include('Boiler Pump Modulation');
    expect(appliance.querySelector('ha-icon')!.getAttribute('icon')).to.equal('mdi:pump');
  });

  it('dispatches hass-more-info with the primary entity id on tap (3.1, contracts/lifecycle-events.md)', async () => {
    const hass = fakeHass({ 'sensor.boiler_heatingpumpmod': { state: '42' } });
    const el = await renderCard(
      { type: 'custom:ha-simple-appliance-card', appliances: [{ entity: 'sensor.boiler_heatingpumpmod' }] },
      hass,
    );
    const listener = oneEvent(el, 'hass-more-info');
    (el.shadowRoot!.querySelector('.appliance') as HTMLElement).click();
    const event = await listener;
    expect((event as CustomEvent<{ entityId: string }>).detail.entityId).to.equal(
      'sensor.boiler_heatingpumpmod',
    );
  });

  it('dispatches hass-more-info even when the entity is unavailable (3.2)', async () => {
    const hass = fakeHass({ 'sensor.boiler_heatingpumpmod': { state: 'unavailable' } });
    const el = await renderCard(
      { type: 'custom:ha-simple-appliance-card', appliances: [{ entity: 'sensor.boiler_heatingpumpmod' }] },
      hass,
    );
    const listener = oneEvent(el, 'hass-more-info');
    (el.shadowRoot!.querySelector('.appliance') as HTMLElement).click();
    const event = await listener;
    expect((event as CustomEvent<{ entityId: string }>).detail.entityId).to.equal(
      'sensor.boiler_heatingpumpmod',
    );
  });

  it('is keyboard-activatable: Enter on a focused appliance dispatches hass-more-info (constitution Principle IV)', async () => {
    const hass = fakeHass({ 'sensor.boiler_heatingpumpmod': { state: '42' } });
    const el = await renderCard(
      { type: 'custom:ha-simple-appliance-card', appliances: [{ entity: 'sensor.boiler_heatingpumpmod' }] },
      hass,
    );
    const applianceEl = el.shadowRoot!.querySelector('.appliance') as HTMLElement;
    expect(applianceEl.getAttribute('tabindex')).to.equal('0');
    expect(applianceEl.getAttribute('role')).to.equal('button');
    expect(applianceEl.hasAttribute('aria-label')).to.be.true;

    const listener = oneEvent(el, 'hass-more-info');
    applianceEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    const event = await listener;
    expect((event as CustomEvent<{ entityId: string }>).detail.entityId).to.equal(
      'sensor.boiler_heatingpumpmod',
    );
  });
});
