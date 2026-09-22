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
