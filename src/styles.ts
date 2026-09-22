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
    gap: 16px;
  }

  .appliance-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border-radius: var(--ha-card-border-radius, 8px);
    border: 1px solid var(--divider-color, #e0e0e0);
    background: var(--card-background-color, #fff);
  }

  .appliance-row .pickers {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
  }

  .appliance-row .fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px;
  }

  .field label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.85em;
    color: var(--secondary-text-color, #727272);
  }

  .field input {
    box-sizing: border-box;
    width: 100%;
    padding: 8px;
    font-size: 1em;
    font-family: inherit;
    color: var(--primary-text-color, #000);
    background: var(--card-background-color, #fff);
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 4px;
  }

  .field input:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: -1px;
  }

  .row-actions {
    display: flex;
    justify-content: flex-end;
    gap: 4px;
  }

  button {
    font: inherit;
    color: var(--primary-color, #03a9f4);
    background: none;
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 4px;
    padding: 6px 10px;
    cursor: pointer;
  }

  button:hover {
    background: var(--secondary-background-color, #f5f5f5);
  }

  button:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 1px;
  }

  .add-appliance-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 12px;
    border-radius: var(--ha-card-border-radius, 8px);
    border: 1px dashed var(--divider-color, #e0e0e0);
  }

  .add-appliance-row .field {
    flex: 1;
    max-width: 260px;
  }

  .add-appliance-row select {
    box-sizing: border-box;
    width: 100%;
    padding: 8px;
    font-size: 1em;
    font-family: inherit;
    color: var(--primary-text-color, #000);
    background: var(--card-background-color, #fff);
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 4px;
  }

  .add-appliance {
    align-self: flex-end;
  }
`;
