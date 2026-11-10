import { escapeHtml, formatINR, waLink } from './config.js';
import { observeReveal } from './main.js';

const ROOT = '../';
const CART_KEY = 'ise-cart-v1';

const $ = (id) => document.getElementById(id);
const grid = $('products');
const chips = $('cat-chips');
const qInput = $('q');
const count = $('count');
const more = $('more');

let products = [];
const state = { q: '', cat: '' };

// ---------- cart storage (falls back to memory if storage is blocked) ----------
let memoryCart = {};
function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) ?? {}; } catch { return memoryCart; }
}
function writeCart(cart) {
  memoryCart = cart;
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* memory only */ }
  renderCart();
}
function addToCart(id, n = 1) {
  const cart = readCart();
  cart[id] = Math.max(0, (cart[id] ?? 0) + n);
  if (!cart[id]) delete cart[id];
  writeCart(cart);
}

// ---------- icons per category ----------
const ICONS = {
  Boards: '<rect x="6" y="6" width="12" height="12" rx="1"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  Sensors: '<circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/><path d="M2 12h2M20 12h2"/>',
  'Motors & Drivers': '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 5v3M12 16v3M5 12h3M16 12h3"/>',
  Modules: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h6M7 14h4M17 10v4"/>',
  Accessories: '<path d="M4 20c4-8 12-8 16-16M4 4l3 3M17 17l3 3"/>',
};
const icon = (cat) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[cat] ?? ICONS.Modules}</svg>`;

// ---------- product grid ----------
const PAGE = 60;
let shown = PAGE;
const priceText = (p) => (p.price == null ? 'Price on request' : formatINR(p.price));
const imgSrc = (p) => (/^https?:/.test(p.image) ? escapeHtml(p.image) : ROOT + escapeHtml(p.image));
const FALLBACK_ATTR = `onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'product-card__fallback'}))"`;
function artHtml(p, big) {
  const cat = `<span class="product-card__fallback product-card__fallback--icon">${icon(p.category)}</span>`;
  const im = p.image ? `<img src="${imgSrc(p)}" referrerpolicy="no-referrer" alt="${escapeHtml(p.name)}" loading="lazy" ${big ? '' : 'width="600" height="420"'} ${FALLBACK_ATTR}>` : cat;
  const credit = p.imageSource ? `<a class="photo-credit" href="${escapeHtml(p.imageSource)}" target="_blank" rel="noopener">Photo: Wikimedia Commons</a>` : '';
  return im + credit;
}

function renderChips() {
  const cats = [...new Set(products.map((p) => p.category))];
  chips.innerHTML = [['', 'All'], ...cats.map((c) => [c, c])]
    .map(([v, l]) => `<button type="button" class="chip" data-cat="${escapeHtml(v)}" aria-pressed="${state.cat === v}">${escapeHtml(l)}</button>`)
    .join('');
}

function filtered() {
  const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
  return products.filter((p) => (!state.cat || p.category === state.cat) && words.every((w) => `${p.name} ${p.category} ${p.note ?? ''} ${p.specs ?? ''} ${p.tags ?? ''}`.toLowerCase().includes(w)));
}

function render(reset = true) {
  if (reset) shown = PAGE;
  const list = filtered();
  const slice = list.slice(0, shown);
  grid.innerHTML = slice.length
    ? slice.map((p) => `
      <article class="card tilt product-card reveal" data-open="${escapeHtml(p.id)}" tabindex="0" role="button" aria-label="View details: ${escapeHtml(p.name)}">
        <div class="product-card__art">${artHtml(p)}</div>
        <span class="tag" style="align-self:flex-start">${escapeHtml(p.category)}</span>
        <h3>${escapeHtml(p.name)}</h3>
        ${p.note || p.specs ? `<p class="note">${escapeHtml(p.note || p.specs)}</p>` : ''}
        <p class="price">${priceText(p)}${p.price == null ? '' : ` <small>/ ${escapeHtml(p.unit)}</small>`}</p>
        <div class="product-card__actions"><span class="btn btn--primary btn--sm">View &amp; verify</span></div>
      </article>`).join('')
    : '<p class="empty">No parts match your search.</p>';
  count.textContent = `${list.length} item${list.length === 1 ? '' : 's'}`;
  more.hidden = list.length <= shown;
  more.textContent = `Show more (${Math.min(PAGE, list.length - shown)} of ${list.length - shown} remaining)`;
  chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.cat === state.cat)));
  observeReveal(grid);
}

more.addEventListener('click', () => { shown += PAGE; render(false); });
chips.addEventListener('click', (e) => {
  const c = e.target.closest('.chip');
  if (c) { state.cat = c.dataset.cat; render(); }
});
let timer;
qInput.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { state.q = qInput.value.trim(); render(); }, 150); });

// ---------- part detail modal: verify, then add ----------
const modal = $('part-modal');
const modalBackdrop = $('part-backdrop');
let current = null;
let lastFocus = null;

function openPart(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  current = p;
  lastFocus = document.activeElement;
  const rows = [['Category', p.category], ['Package / form', p.package], ['Key specs', p.specs], ['Details', p.note || p.description], ['Sold per', p.unit]].filter(([, v]) => v);
  $('part-art').innerHTML = artHtml(p, true);
  $('part-title').textContent = p.name;
  $('part-price').textContent = priceText(p);
  $('part-specs').innerHTML = rows.map(([k, v]) => `<tr><th scope="row">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join('');
  $('part-desc').textContent = p.description && p.description !== p.note ? p.description : '';
  $('part-photo-note').hidden = !p.imageSource;
  $('part-noimg-note').hidden = !!p.image;
  $('part-verify').checked = false;
  $('part-qty').value = 1;
  $('part-add').disabled = true;
  $('part-pay').hidden = !p.razorpayLink;
  if (p.razorpayLink) $('part-pay').href = p.razorpayLink;
  modal.hidden = false; modalBackdrop.hidden = false;
  document.body.style.overflow = 'hidden';
  $('part-close').focus();
}
function closePart() {
  modal.hidden = true; modalBackdrop.hidden = true;
  document.body.style.overflow = '';
  current = null;
  if (lastFocus) lastFocus.focus();
}
grid.addEventListener('click', (e) => { const c = e.target.closest('[data-open]'); if (c && !e.target.closest('a')) openPart(c.dataset.open); });
grid.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-open]')) { e.preventDefault(); openPart(e.target.dataset.open); } });
$('part-close').addEventListener('click', closePart);
modalBackdrop.addEventListener('click', closePart);
$('part-verify').addEventListener('change', (e) => { $('part-add').disabled = !e.target.checked; });
$('part-add').addEventListener('click', () => {
  if (!current || !$('part-verify').checked) return;
  const n = Math.max(1, Math.min(9999, parseInt($('part-qty').value, 10) || 1));
  addToCart(current.id, n);
  closePart();
  setDrawer(true);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closePart(); });

// ---------- cart drawer ----------
const drawer = $('cart');
const backdrop = $('cart-backdrop');
const openBtn = $('cart-open');

function cartItems() {
  const cart = readCart();
  return Object.entries(cart)
    .map(([id, qty]) => ({ p: products.find((x) => x.id === id), qty }))
    .filter((x) => x.p && x.qty > 0);
}

function renderCart() {
  const items = cartItems();
  const total = items.reduce((s, { p, qty }) => s + (p.price ?? 0) * qty, 0);
  const quoted = items.filter(({ p }) => p.price == null).length;
  $('cart-count').textContent = items.reduce((s, { qty }) => s + qty, 0);
  $('cart-total').textContent = formatINR(total) + (quoted ? ` + ${quoted} on quote` : '');
  $('cart-order').disabled = !items.length;
  $('cart-lines').innerHTML = items.length
    ? items.map(({ p, qty }) => `
      <div class="cart-line">
        <div><div class="cart-line__name">${escapeHtml(p.name)}</div><div class="cart-line__sub">${p.price == null ? `Price on request × ${qty}` : `${formatINR(p.price)} × ${qty} = ${formatINR(p.price * qty)}`}</div></div>
        <div class="qty" role="group" aria-label="Quantity for ${escapeHtml(p.name)}">
          <button type="button" data-dec="${escapeHtml(p.id)}" aria-label="Remove one">−</button><span>${qty}</span><button type="button" data-inc="${escapeHtml(p.id)}" aria-label="Add one">+</button>
        </div>
        ${p.razorpayLink ? `<a class="cart-line__sub" href="${escapeHtml(p.razorpayLink)}" target="_blank" rel="noopener">Pay online for this item</a>` : ''}
      </div>`).join('')
    : '<p class="empty">Your cart is empty.</p>';
}

$('cart-lines').addEventListener('click', (e) => {
  const inc = e.target.closest('[data-inc]');
  const dec = e.target.closest('[data-dec]');
  if (inc) addToCart(inc.dataset.inc, 1);
  if (dec) addToCart(dec.dataset.dec, -1);
});

function setDrawer(open) {
  drawer.hidden = !open;
  backdrop.hidden = !open;
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) $('cart-close').focus(); else openBtn.focus();
}
openBtn.addEventListener('click', () => setDrawer(true));
$('cart-close').addEventListener('click', () => setDrawer(false));
backdrop.addEventListener('click', () => setDrawer(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) setDrawer(false); });

$('cart-clear').addEventListener('click', () => writeCart({}));
$('cart-order').addEventListener('click', () => {
  const items = cartItems();
  if (!items.length) return;
  const name = $('cart-name').value.trim();
  const total = items.reduce((s, { p, qty }) => s + (p.price ?? 0) * qty, 0);
  const quoted = items.filter(({ p }) => p.price == null).length;
  const lines = [
    'Hi iShoweLectro, I would like to order:',
    ...items.map(({ p, qty }, i) => `${i + 1}. ${p.name} × ${qty}${p.price == null ? ' (please quote price)' : ' = ' + formatINR(p.price * qty)}`),
    `Total (priced items): ${formatINR(total)}${quoted ? ` + ${quoted} item(s) to be quoted` : ''}`,
    name && `Name: ${name}`,
    'Please confirm availability and delivery/pickup.',
  ].filter(Boolean);
  window.open(waLink(lines.join('\n')), '_blank', 'noopener');
});

// ---------- load ----------
const getJson = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(); return r.json(); });
Promise.all([getJson(`${ROOT}data/products.json`), getJson(`${ROOT}data/parts.json`).catch(() => [])])
  .then(([featured, parts]) => { products = [...featured, ...parts]; renderChips(); render(); renderCart(); })
  .catch(() => { grid.innerHTML = '<p class="empty">Products could not be loaded. Please refresh the page.</p>'; });
