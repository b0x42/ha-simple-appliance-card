import { LitElement, html, type TemplateResult } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import type { Appliance, CardConfig, HomeAssistant } from './types.js';
import { normalizeConfig } from './config.js';
import { HEATING_PRESET_SLOTS } from './presets.js';
import { editorStyles } from './styles.js';

type ValueChangedEvent = CustomEvent<{ value: string }>;

const APPLIANCE_TYPE_OPTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: '', label: 'Generic appliance' },
  ...HEATING_PRESET_SLOTS.map((slot) => ({ id: slot.id, label: slot.name })),
];

/**
 * Visual point-and-click editor for ha-simple-appliance-card. See
 * specs/001-configurable-appliance-cards/contracts/lifecycle-events.md for
 * the `config-changed` event contract this element implements.
 *
 * Appliances are added one at a time: pick a type (a built-in heating preset
 * slot, or "Generic"), then Add — this pre-fills the new appliance's
 * name/icon/default threshold from that type, leaving entity/active_entity/
 * target_entity for the user to fill in via that row's own entity pickers.
 *
 * Entity fields use `<ha-entity-picker>` — a Home Assistant frontend custom
 * element, resolved by tag name at runtime (no import: it's already
 * registered globally by the HA frontend the same way `<ha-icon>` is, per
 * plan.md's distinction between that and a bundled npm dependency like
 * `lit`). It is undefined outside a real Home Assistant page (e.g. in this
 * project's own component tests), where it behaves as a plain element that
 * still accepts the `.hass`/`.value` property bindings and still dispatches
 * whatever `value-changed` event tests fire at it by hand.
 */
export class HaSimpleApplianceCardEditor extends LitElement {
  static override styles = editorStyles;

  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
    _newApplianceType: { state: true },
  };

  declare hass: HomeAssistant;

  declare private _config?: CardConfig & { appliances: Appliance[] };

  declare private _newApplianceType: string;

  constructor() {
    super();
    this._newApplianceType = '';
  }

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
    const slot = HEATING_PRESET_SLOTS.find((s) => s.id === this._newApplianceType);
    const appliance: Appliance = slot
      ? {
          entity: '',
          name: slot.name,
          icon: slot.icon,
          ...(slot.default_active_threshold !== undefined
            ? { active_threshold: slot.default_active_threshold }
            : {}),
        }
      : { entity: '' };
    this._emitChange([...this._config.appliances, appliance]);
    this._newApplianceType = '';
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

  private _updateField(index: number, field: keyof Appliance, rawValue: string): void {
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

  /** An entity picker for a per-appliance-row field (entity/active_entity/target_entity). */
  private _entityPicker(
    label: string,
    dataField: string,
    value: string,
    onChange: (value: string) => void,
  ): TemplateResult {
    return html`
      <ha-entity-picker
        data-field=${dataField}
        .hass=${this.hass}
        .value=${value}
        .label=${label}
        allow-custom-entity
        @value-changed=${(e: ValueChangedEvent) => onChange(e.detail.value)}
      ></ha-entity-picker>
    `;
  }

  private _renderAddAppliance(): TemplateResult {
    return html`
      <div class="add-appliance-row">
        <label class="field">
          Type
          <select
            data-field="new-appliance-type"
            .value=${this._newApplianceType}
            @change=${(e: Event) => {
              this._newApplianceType = (e.target as HTMLSelectElement).value;
            }}
          >
            ${APPLIANCE_TYPE_OPTIONS.map(
              (opt) => html`<option value=${opt.id}>${opt.label}</option>`,
            )}
          </select>
        </label>
        <button class="add-appliance" type="button" @click=${() => this._addAppliance()}>
          + Add appliance
        </button>
      </div>
    `;
  }

  private _renderRow(appliance: Appliance, index: number): TemplateResult {
    return html`
      <div class="appliance-row">
        <div class="pickers">
          ${this._entityPicker('Entity', 'entity', appliance.entity, (v) =>
            this._updateField(index, 'entity', v),
          )}
          ${this._entityPicker(
            'Active entity (optional)',
            'active_entity',
            appliance.active_entity ?? '',
            (v) => this._updateField(index, 'active_entity', v),
          )}
          ${this._entityPicker(
            'Target entity (optional)',
            'target_entity',
            appliance.target_entity ?? '',
            (v) => this._updateField(index, 'target_entity', v),
          )}
        </div>
        <div class="fields">
          <div class="field">
            <label>
              Name override
              <input
                data-field="name"
                placeholder="entity's own name"
                .value=${appliance.name ?? ''}
                @change=${(e: Event) =>
                  this._updateField(index, 'name', (e.target as HTMLInputElement).value)}
              />
            </label>
          </div>
          <div class="field">
            <label>
              Icon override
              <input
                data-field="icon"
                placeholder="mdi:..."
                .value=${appliance.icon ?? ''}
                @change=${(e: Event) =>
                  this._updateField(index, 'icon', (e.target as HTMLInputElement).value)}
              />
            </label>
          </div>
          <div class="field">
            <label>
              Active threshold
              <input
                data-field="active_threshold"
                type="number"
                placeholder="0"
                .value=${appliance.active_threshold?.toString() ?? ''}
                @change=${(e: Event) =>
                  this._updateField(index, 'active_threshold', (e.target as HTMLInputElement).value)}
              />
            </label>
          </div>
        </div>
        <div class="row-actions">
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
      </div>
    `;
  }

  protected override render(): TemplateResult {
    if (!this._config) return html``;
    return html`
      <div class="editor">
        ${this._config.appliances.map((appliance, index) => this._renderRow(appliance, index))}
        ${this._renderAddAppliance()}
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
