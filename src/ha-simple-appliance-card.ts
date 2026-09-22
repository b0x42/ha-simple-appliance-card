import { LitElement, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import type { Appliance, CardConfig, HomeAssistant } from './types.js';
import { normalizeConfig } from './config.js';
import { deriveActiveState, deriveTargetDisplay } from './state.js';
import { cardStyles } from './styles.js';

const DEFAULT_ICON = 'mdi:power-plug';

function relevantEntityIds(config: CardConfig & { appliances: Appliance[] }): string[] {
  return config.appliances.flatMap((a) =>
    [a.entity, a.active_entity, a.target_entity].filter((id): id is string => id !== undefined),
  );
}

function formatValue(hass: HomeAssistant, entityId: string | undefined): string | undefined {
  if (entityId === undefined) return undefined;
  const stateObj = hass.states[entityId];
  if (stateObj === undefined) return undefined;
  const unit = stateObj.attributes['unit_of_measurement'];
  return typeof unit === 'string' ? `${stateObj.state} ${unit}` : stateObj.state;
}

/**
 * A configurable Home Assistant Lovelace card rendering a list of appliances
 * as icons. See specs/001-configurable-appliance-cards/contracts/ for the
 * config and lifecycle contracts this element implements.
 */
export class HaSimpleApplianceCard extends LitElement {
  static override styles = cardStyles;

  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  declare hass: HomeAssistant;

  declare private _config?: CardConfig & { appliances: Appliance[] };

  public setConfig(config: CardConfig): void {
    this._config = normalizeConfig(config);
  }

  public getCardSize(): number {
    if (!this._config) return 1;
    const rows = Math.max(1, Math.ceil(this._config.appliances.length / 4));
    return rows + (this._config.title ? 1 : 0);
  }

  public static getConfigElement(): HTMLElement {
    return document.createElement('ha-simple-appliance-card-editor');
  }

  public static getStubConfig(): Partial<CardConfig> {
    return { appliances: [] };
  }

  protected override shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('_config')) return true;
    if (!this._config) return false;
    if (changedProps.has('hass')) {
      const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
      if (!oldHass) return true;
      const ids = relevantEntityIds(this._config);
      return ids.some((id) => oldHass.states[id] !== this.hass.states[id]);
    }
    return true;
  }

  private _handleTap(entityId: string): void {
    fireEvent(this, 'hass-more-info', { entityId });
  }

  private _handleKeydown(event: KeyboardEvent, entityId: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this._handleTap(entityId);
    }
  }

  private _renderAppliance(appliance: Appliance): TemplateResult {
    const activeState = deriveActiveState(this.hass, appliance);
    const targetDisplay = deriveTargetDisplay(this.hass, appliance);
    const stateObj = this.hass.states[appliance.entity];
    const name = appliance.name ?? stateObj?.attributes['friendly_name'] ?? appliance.entity;
    const icon = appliance.icon ?? stateObj?.attributes['icon'] ?? DEFAULT_ICON;
    const primaryValue = formatValue(this.hass, appliance.entity);
    const targetValue = formatValue(this.hass, appliance.target_entity);

    return html`
      <div
        class="appliance ${activeState}"
        role="button"
        tabindex="0"
        aria-label="${String(name)}"
        @click=${() => this._handleTap(appliance.entity)}
        @keydown=${(e: KeyboardEvent) => this._handleKeydown(e, appliance.entity)}
      >
        <ha-icon class="appliance-icon" icon="${String(icon)}"></ha-icon>
        <div class="appliance-name">${name}</div>
        ${primaryValue !== undefined
          ? html`<div class="appliance-value">${primaryValue}</div>`
          : nothing}
        ${targetDisplay.show
          ? html`<div class="appliance-value appliance-target">
              ${targetDisplay.unavailable || targetValue === undefined
                ? 'target: unavailable'
                : `target: ${targetValue}`}
            </div>`
          : nothing}
      </div>
    `;
  }

  protected override render(): TemplateResult {
    if (!this._config || !this.hass) {
      return html``;
    }

    return html`
      <ha-card>
        ${this._config.title ? html`<div class="title">${this._config.title}</div>` : nothing}
        ${this._config.appliances.length === 0
          ? html`<div class="empty-state">No appliances configured yet.</div>`
          : html`<div class="appliances">
              ${this._config.appliances.map((appliance) => this._renderAppliance(appliance))}
            </div>`}
      </ha-card>
    `;
  }
}

customElements.define('ha-simple-appliance-card', HaSimpleApplianceCard);

declare global {
  interface HTMLElementTagNameMap {
    'ha-simple-appliance-card': HaSimpleApplianceCard;
  }
}
