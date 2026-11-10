// Site-wide settings. Change the number here and it updates every WhatsApp link built by scripts.
export const WHATSAPP_NUMBER = '917845576330';
// ---- Payments (fill these in; a method with an empty value is hidden at checkout) ----
// UPI ID that receives shop payments, e.g. 'ishowelectro@okhdfcbank'
export const UPI_ID = '';
export const UPI_PAYEE = 'iShoweLectro';
// A Razorpay Payment Page / Payment Link URL that accepts a custom amount (cards, netbanking, wallets, UPI)
export const RAZORPAY_PAGE_URL = '';
export const PHONE_DISPLAY = '+91 78455 76330';

export const DOMAINS = [
  'ECE',
  'Power Electronics',
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
