import { css } from 'lit';

/**
 * Shared card styles. Uses Home Assistant theme CSS custom properties only —
 * no hard-coded colors outside theme-overridable semantic status colors
 * (constitution Principle IV).
 */
export const cardStyles = css`
  :host {
    display: block;
  }

  ha-card {
    padding: 16px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color, #000);
  }

  .title {
    font-size: 1.1em;
    font-weight: 500;
    margin-bottom: 12px;
    color: var(--primary-text-color, #000);
  }

  .appliances {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .appliance {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px;
    min-width: 72px;
    border-radius: var(--ha-card-border-radius, 8px);
    cursor: pointer;
    background: none;
    border: none;
    font: inherit;
    color: inherit;
  }

  .appliance:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 2px;
  }

  .appliance-icon {
    --mdc-icon-size: 32px;
    color: var(--state-icon-color, var(--paper-item-icon-color, #44739e));
  }

  .appliance.active .appliance-icon {
    color: var(--state-icon-active-color, var(--primary-color, #03a9f4));
  }

  .appliance.unavailable .appliance-icon {
    color: var(--state-icon-unavailable-color, var(--disabled-text-color, #bdbdbd));
  }

  .appliance-name {
    font-size: 0.85em;
    text-align: center;
    color: var(--secondary-text-color, #727272);
  }

  .appliance-value {
    font-size: 0.75em;
    color: var(--secondary-text-color, #727272);
  }

  .appliance-target {
    opacity: 0.7;
  }

  .empty-state {
    color: var(--secondary-text-color, #727272);
    font-style: italic;
    padding: 16px 0;
    text-align: center;
  }
`;

/**
 * Editor styles. Same theme-variable-only rule as cardStyles (constitution
 * Principle IV) — the editor renders inside Lovelace's own card-config
 * dialog, which is already themed, so it must match rather than look like
 * an unstyled HTML form.
 */
export const editorStyles = css`
  :host {
    display: block;
  }

  .editor {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  ha-expansion-panel {
    --expansion-panel-content-padding: 0;
    border-radius: var(--ha-card-border-radius, 8px);
  }

  /*
   * Shared filled-row container for every editable field (entity pickers,
   * text fields, the appliance-type select). ha-entity-picker/ha-textfield
   * already render Material's filled label-above-value style on their own;
   * this wrapper's job is just the consistent rounded corners + background
   * that make every row read as one native-looking set, matching
   * specs/002-native-editor-ui/research.md §4.
   */
  .field-row {
    display: block;
    width: 100%;
    min-width: 0;
    border-radius: var(--ha-card-border-radius, 12px);
    overflow: hidden;
    background: var(--secondary-background-color, var(--card-background-color, #fff));
  }

  .appliance-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    min-width: 0;
  }

  .appliance-row .pickers,
  .appliance-row .fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 8px;
    min-width: 0;
  }

  .appliance-row ha-entity-picker,
  .appliance-row ha-textfield {
    width: 100%;
  }

  .row-actions {
    display: flex;
    justify-content: flex-end;
    gap: 4px;
    padding-top: 4px;
    border-top: 1px solid var(--divider-color, #e0e0e0);
  }

  .row-actions ha-icon-button {
    border-radius: 50%;
    --mdc-icon-button-size: 36px;
    color: var(--secondary-text-color, #727272);
  }

  .row-actions ha-icon-button:hover {
    background: var(--secondary-background-color, rgba(0, 0, 0, 0.05));
    color: var(--primary-text-color, #000);
  }

  .row-actions ha-icon-button:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: -2px;
  }

  .add-appliance-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
    padding: 12px;
    border-radius: var(--ha-card-border-radius, 8px);
    border: 1px dashed var(--divider-color, #e0e0e0);
  }

  /*
   * The appliance-type control stays a real native select for click
   * reliability (specs/002-native-editor-ui/research.md §5 - a styled
   * overlay is exactly how the v0.2.1 click regression happened). Only its
   * decoration is layered on: appearance:none removes the browser's own
   * arrow, and the chevron below is drawn with pointer-events:none so it
   * can never intercept a click meant for the select underneath it.
   */
  .type-field-row {
    position: relative;
    flex: 1;
    min-width: 0;
    max-width: 260px;
  }

  .type-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 36px 8px 12px;
    font-size: 0.85em;
    color: var(--secondary-text-color, #727272);
  }

  .type-field select {
    appearance: none;
    -webkit-appearance: none;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    padding: 4px 0;
    font-size: 1em;
    font-family: inherit;
    color: var(--primary-text-color, #000);
    background: none;
    border: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .type-field select:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 2px;
  }

  .type-field-row::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 14px;
    width: 8px;
    height: 8px;
    margin-top: -6px;
    pointer-events: none;
    border-right: 2px solid var(--secondary-text-color, #727272);
    border-bottom: 2px solid var(--secondary-text-color, #727272);
    transform: rotate(45deg);
  }

  .add-appliance {
    display: flex;
    align-items: center;
    gap: 4px;
    font: inherit;
    color: var(--primary-color, #03a9f4);
    background: none;
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 4px;
    padding: 8px 12px;
    cursor: pointer;
  }

  .add-appliance:hover {
    background: var(--secondary-background-color, #f5f5f5);
  }

  .add-appliance:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 1px;
  }
`;
