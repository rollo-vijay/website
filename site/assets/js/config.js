// Site-wide settings. Change the number here and it updates every WhatsApp link built by scripts.
export const WHATSAPP_NUMBER = '917845576330';
export const PHONE_DISPLAY = '+91 78455 76330';

export const DOMAINS = [
  'ECE',
  'Robotics',
  'PCB Design',
  'Edge AI',
  'Wireless & IoT',
  'Vision',
  'Real-time Hardware',
  'Hardware ML',
  'Software',
];

export function waLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}
