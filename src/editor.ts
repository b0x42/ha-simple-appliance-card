import { LitElement, html, type TemplateResult } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import type { Appliance, CardConfig, HomeAssistant } from './types.js';
import { normalizeConfig } from './config.js';
import { HEATING_PRESET_SLOTS } from './presets.js';
import { editorStyles } from './styles.js';

type ValueChangedEvent = CustomEvent<{ value: string }>;
interface ValueTarget {
  value: string;
}

const APPLIANCE_TYPE_OPTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: '', label: 'Generic appliance' },
  ...HEATING_PRESET_SLOTS.map((slot) => ({ id: slot.id, label: slot.name })),
];

/** Leading-icon fallback for an appliance section with no configured icon.
 * Intentionally mirrors `DEFAULT_ICON` in ha-simple-appliance-card.ts rather
 * than importing it — this feature's file scope is editor.ts/styles.ts only
 * (specs/002-native-editor-ui/research.md §3). */
const FALLBACK_ICON = 'mdi:power-plug';

/**
 * Visual point-and-click editor for ha-simple-appliance-card. See
 * specs/001-configurable-appliance-cards/contracts/lifecycle-events.md for
 * the `config-changed` event contract this element implements.
 *
 * Built mostly from Home Assistant's own native form elements
 * (`ha-entity-picker`, `ha-textfield`, `ha-expansion-panel`, `ha-icon-button`)
 * so the editor looks and behaves like a stock HA card editor rather than a
 * raw HTML form — inspired by github.com/ADNPolymerase/ha-appliance-card's
 * editor UI (adopted for look-and-feel only; this card keeps its own
 * multi-appliance-per-card config model, not that project's
 * one-appliance-per-card design). The appliance-type field is a deliberate
 * exception: a plain native `<select>` rather than `ha-select` +
 * `mwc-list-item`, after the latter shipped in 0.2.1 and didn't respond to
 * clicks in a live dashboard — a known fragility point with Material Web
 * Components' list-item/selection-index resolution outside HA's own
 * internal usage. A native `<select>` has no such failure mode.
 *
 * The HA-provided elements above are Home Assistant frontend custom
 * elements, resolved by tag name at runtime (no import — registered
 * globally by the HA frontend the same way `<ha-icon>` is, per plan.md's
 * distinction between that and a bundled npm dependency like `lit`). They
 * are undefined outside a real Home Assistant page (e.g. in this project's
 * own component tests), where each still accepts its property bindings and
 * still dispatches whatever event tests fire at it by hand.
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
      <div class="field-row">
        <ha-entity-picker
          data-field=${dataField}
          .hass=${this.hass}
          .value=${value}
          .label=${label}
          allow-custom-entity
          @value-changed=${(e: ValueChangedEvent) => onChange(e.detail.value)}
        ></ha-entity-picker>
      </div>
    `;
  }

  private _textField(
    label: string,
    dataField: string,
    value: string,
    onChange: (value: string) => void,
    type: 'text' | 'number' = 'text',
  ): TemplateResult {
    return html`
      <div class="field-row">
        <ha-textfield
          data-field=${dataField}
          type=${type}
          .label=${label}
          .value=${value}
          @input=${(e: Event) => onChange((e.target as unknown as ValueTarget).value)}
        ></ha-textfield>
      </div>
    `;
  }

  private _renderAddAppliance(): TemplateResult {
    return html`
      <div class="add-appliance-row">
        <div class="field-row type-field-row">
          <label class="type-field">
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
        </div>
        <button class="add-appliance" type="button" @click=${() => this._addAppliance()}>
          <ha-icon icon="mdi:plus"></ha-icon>
          Add appliance
        </button>
      </div>
    `;
  }

  private _rowHeader(appliance: Appliance): string {
    return appliance.name || appliance.entity || 'New appliance';
  }

  private _renderRow(appliance: Appliance, index: number): TemplateResult {
    return html`
      <ha-expansion-panel outlined .header=${this._rowHeader(appliance)}>
        <ha-icon
          slot="leading-icon"
          icon=${appliance.icon ?? FALLBACK_ICON}
        ></ha-icon>
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
            ${this._textField('Name override', 'name', appliance.name ?? '', (v) =>
              this._updateField(index, 'name', v),
            )}
            ${this._textField('Icon override (mdi:...)', 'icon', appliance.icon ?? '', (v) =>
              this._updateField(index, 'icon', v),
            )}
            ${this._textField(
              'Active threshold',
              'active_threshold',
              appliance.active_threshold?.toString() ?? '',
              (v) => this._updateField(index, 'active_threshold', v),
              'number',
            )}
          </div>
          <div class="row-actions">
            <ha-icon-button
              class="move-up"
              .label=${'Move appliance up'}
              @click=${() => this._moveAppliance(index, -1)}
            >
              <ha-icon icon="mdi:arrow-up"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              class="move-down"
              .label=${'Move appliance down'}
              @click=${() => this._moveAppliance(index, 1)}
            >
              <ha-icon icon="mdi:arrow-down"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              class="remove-appliance"
              .label=${'Remove appliance'}
              @click=${() => this._removeAppliance(index)}
            >
              <ha-icon icon="mdi:delete"></ha-icon>
            </ha-icon-button>
          </div>
        </div>
      </ha-expansion-panel>
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
