import { LitElement, html, type TemplateResult } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import type { Appliance, CardConfig, HomeAssistant } from './types.js';
import { normalizeConfig } from './config.js';
import { applyHeatingPreset, type HeatingPresetInput } from './presets.js';
import { editorStyles } from './styles.js';

interface PresetFormState {
  circulation_pump: string;
  gas_burner: string;
  hot_water_entity: string;
  hot_water_active_entity: string;
  hot_water_target_entity: string;
  heating_circuit_entity: string;
  heating_circuit_active_entity: string;
  heating_circuit_target_entity: string;
}

const EMPTY_PRESET_FORM: PresetFormState = {
  circulation_pump: '',
  gas_burner: '',
  hot_water_entity: '',
  hot_water_active_entity: '',
  hot_water_target_entity: '',
  heating_circuit_entity: '',
  heating_circuit_active_entity: '',
  heating_circuit_target_entity: '',
};

type ValueChangedEvent = CustomEvent<{ value: string }>;

/**
 * Visual point-and-click editor for ha-simple-appliance-card. See
 * specs/001-configurable-appliance-cards/contracts/lifecycle-events.md for
 * the `config-changed` event contract this element implements.
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
    _presetForm: { state: true },
  };

  declare hass: HomeAssistant;

  declare private _config?: CardConfig & { appliances: Appliance[] };

  declare private _presetForm: PresetFormState;

  constructor() {
    super();
    this._presetForm = { ...EMPTY_PRESET_FORM };
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

  private _setPresetField(field: keyof PresetFormState, value: string): void {
    this._presetForm = { ...this._presetForm, [field]: value };
  }

  private _applyPreset(): void {
    if (!this._config) return;
    const form = this._presetForm;
    const input: HeatingPresetInput = {};
    if (form.circulation_pump !== '') input.circulation_pump = form.circulation_pump;
    if (form.gas_burner !== '') input.gas_burner = form.gas_burner;
    if (form.hot_water_entity !== '') {
      input.hot_water = {
        entity: form.hot_water_entity,
        ...(form.hot_water_active_entity !== ''
          ? { active_entity: form.hot_water_active_entity }
          : {}),
        ...(form.hot_water_target_entity !== ''
          ? { target_entity: form.hot_water_target_entity }
          : {}),
      };
    }
    if (form.heating_circuit_entity !== '') {
      input.heating_circuit = {
        entity: form.heating_circuit_entity,
        ...(form.heating_circuit_active_entity !== ''
          ? { active_entity: form.heating_circuit_active_entity }
          : {}),
        ...(form.heating_circuit_target_entity !== ''
          ? { target_entity: form.heating_circuit_target_entity }
          : {}),
      };
    }
    const presetAppliances = applyHeatingPreset(input);
    this._emitChange([...this._config.appliances, ...presetAppliances]);
    this._presetForm = { ...EMPTY_PRESET_FORM };
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

  /** An entity picker for a preset-form field. */
  private _presetEntityPicker(label: string, presetField: string, key: keyof PresetFormState): TemplateResult {
    return html`
      <ha-entity-picker
        data-preset-field=${presetField}
        .hass=${this.hass}
        .value=${this._presetForm[key]}
        .label=${label}
        allow-custom-entity
        @value-changed=${(e: ValueChangedEvent) => this._setPresetField(key, e.detail.value)}
      ></ha-entity-picker>
    `;
  }

  private _renderPresetForm(): TemplateResult {
    return html`
      <fieldset class="preset-form">
        <legend>Apply built-in heating preset</legend>

        <div class="preset-slot">
          <div class="slot-title">Circulation Pump</div>
          <div class="pickers">
            ${this._presetEntityPicker('Entity', 'circulation_pump', 'circulation_pump')}
          </div>
        </div>

        <div class="preset-slot">
          <div class="slot-title">Gas Burner</div>
          <div class="pickers">
            ${this._presetEntityPicker('Entity', 'gas_burner', 'gas_burner')}
          </div>
        </div>

        <div class="preset-slot">
          <div class="slot-title">Hot Water</div>
          <div class="pickers">
            ${this._presetEntityPicker('Entity', 'hot_water.entity', 'hot_water_entity')}
            ${this._presetEntityPicker(
              'Active entity',
              'hot_water.active_entity',
              'hot_water_active_entity',
            )}
            ${this._presetEntityPicker(
              'Target entity',
              'hot_water.target_entity',
              'hot_water_target_entity',
            )}
          </div>
        </div>

        <div class="preset-slot">
          <div class="slot-title">Heating Circuit</div>
          <div class="pickers">
            ${this._presetEntityPicker('Entity', 'heating_circuit.entity', 'heating_circuit_entity')}
            ${this._presetEntityPicker(
              'Active entity',
              'heating_circuit.active_entity',
              'heating_circuit_active_entity',
            )}
            ${this._presetEntityPicker(
              'Target entity',
              'heating_circuit.target_entity',
              'heating_circuit_target_entity',
            )}
          </div>
        </div>

        <button class="apply-preset" type="button" @click=${() => this._applyPreset()}>
          Apply preset
        </button>
      </fieldset>
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
        <button class="add-appliance" type="button" @click=${() => this._addAppliance()}>
          + Add appliance
        </button>
        ${this._renderPresetForm()}
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
