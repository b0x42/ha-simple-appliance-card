import './ha-simple-appliance-card.js';
import './editor.js';

interface CustomCardRegistration {
  type: string;
  name: string;
  description: string;
  preview: boolean;
}

declare global {
  interface Window {
    customCards?: CustomCardRegistration[];
  }
}

window.customCards = window.customCards ?? [];
window.customCards.push({
  type: 'ha-simple-appliance-card',
  name: 'Simple Appliance Card',
  description: 'A configurable card that shows your appliances as icons with live state.',
  preview: true,
});
