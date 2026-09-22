import { LitElement, html, type TemplateResult } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import type { Appliance, CardConfig, HomeAssistant } from './types.js';
import { normalizeConfig } from './config.js';

/**
 * Visual point-and-click editor for ha-simple-appliance-card. See
 * specs/001-configurable-appliance-cards/contracts/lifecycle-events.md for
 * the `config-changed` event contract this element implements.
 */
export class HaSimpleApplianceCardEditor extends LitElement {
  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  declare hass: HomeAssistant;

  declare private _config?: CardConfig & { appliances: Appliance[] };

  public setConfig(config: CardConfig): void {
    this._config = normalizeConfig(config);
  }

  private _emitChange(appliances: Appliance[]): void {
    if (!this._config) return;
    const config: CardConfig = { ...this._config, appliances };
    this._config = { ...config, appliances };
    fireEvent(this, 'config-changed', { config });
  }

  private _addAppliance(): void {
    if (!this._config) return;
    this._emitChange([...this._config.appliances, { entity: '' }]);
  }

  private _removeAppliance(index: number): void {
    if (!this._config) return;
    const appliances = this._config.appliances.filter((_, i) => i !== index);
    this._emitChange(appliances);
  }

  private _moveAppliance(index: number, direction: -1 | 1): void {
    if (!this._config) return;
    const appliances = [...this._config.appliances];
    const target = index + direction;
    if (target < 0 || target >= appliances.length) return;
    const [moved] = appliances.splice(index, 1);
    if (moved === undefined) return;
    appliances.splice(target, 0, moved);
    this._emitChange(appliances);
  }

  private _updateField(
    index: number,
    field: keyof Appliance,
    rawValue: string,
  ): void {
    if (!this._config) return;
    const appliances = this._config.appliances.map((appliance, i) => {
      if (i !== index) return appliance;
      const next: Appliance = { ...appliance };
      if (field === 'active_threshold') {
        if (rawValue === '') {
          delete next.active_threshold;
        } else {
          next.active_threshold = Number(rawValue);
        }
        return next;
      }
      if (rawValue === '') {
        delete next[field];
      } else {
        next[field] = rawValue;
      }
      return next;
    });
    this._emitChange(appliances);
  }

  private _renderRow(appliance: Appliance, index: number): TemplateResult {
    return html`
      <div class="appliance-row">
        <input
          data-field="entity"
          placeholder="entity (e.g. sensor.boiler_heatingpumpmod)"
          .value=${appliance.entity}
          @change=${(e: Event) =>
            this._updateField(index, 'entity', (e.target as HTMLInputElement).value)}
        />
        <input
          data-field="target_entity"
          placeholder="target entity (optional)"
          .value=${appliance.target_entity ?? ''}
          @change=${(e: Event) =>
            this._updateField(index, 'target_entity', (e.target as HTMLInputElement).value)}
        />
        <input
          data-field="name"
          placeholder="name override (optional)"
          .value=${appliance.name ?? ''}
          @change=${(e: Event) =>
            this._updateField(index, 'name', (e.target as HTMLInputElement).value)}
        />
        <input
          data-field="icon"
          placeholder="icon override (optional)"
          .value=${appliance.icon ?? ''}
          @change=${(e: Event) =>
            this._updateField(index, 'icon', (e.target as HTMLInputElement).value)}
        />
        <input
          data-field="active_threshold"
          type="number"
          placeholder="active threshold (optional)"
          .value=${appliance.active_threshold?.toString() ?? ''}
          @change=${(e: Event) =>
            this._updateField(index, 'active_threshold', (e.target as HTMLInputElement).value)}
        />
        <button
          class="move-up"
          type="button"
          aria-label="Move appliance up"
          @click=${() => this._moveAppliance(index, -1)}
        >
          ↑
        </button>
        <button
          class="move-down"
          type="button"
          aria-label="Move appliance down"
          @click=${() => this._moveAppliance(index, 1)}
        >
          ↓
        </button>
        <button
          class="remove-appliance"
          type="button"
          aria-label="Remove appliance"
          @click=${() => this._removeAppliance(index)}
        >
          ✕
        </button>
      </div>
    `;
  }

  protected override render(): TemplateResult {
    if (!this._config) return html``;
    return html`
      <div class="editor">
        ${this._config.appliances.map((appliance, index) => this._renderRow(appliance, index))}
        <button class="add-appliance" type="button" @click=${() => this._addAppliance()}>
          + Add appliance
        </button>
      </div>
    `;
  }
}

customElements.define('ha-simple-appliance-card-editor', HaSimpleApplianceCardEditor);

declare global {
  interface HTMLElementTagNameMap {
    'ha-simple-appliance-card-editor': HaSimpleApplianceCardEditor;
  }
}
