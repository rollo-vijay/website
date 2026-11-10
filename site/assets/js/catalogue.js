import { DOMAINS, escapeHtml } from './config.js';
import { projectCardHTML, loadProjects } from './cards.js';
import { observeReveal } from './main.js';

const ROOT = '../';
const PAGE_SIZE = 12;

const qInput = document.getElementById('q');
const chips = document.getElementById('domain-chips');
const results = document.getElementById('results');
const count = document.getElementById('count');
const more = document.getElementById('more');

const params = new URLSearchParams(location.search);
const state = { q: params.get('q') ?? '', domain: params.get('domain') ?? '', shown: PAGE_SIZE };
let projects = [];

function syncUrl() {
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.domain) p.set('domain', state.domain);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

function matches(p) {
  if (state.domain && p.domain !== state.domain) return false;
  if (!state.q) return true;
  const hay = [p.title, p.code, p.domain, p.abstract, ...(p.components ?? []), ...(p.features ?? [])].join(' ').toLowerCase();
  return state.q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}

function renderChips() {
  const counts = Object.fromEntries(DOMAINS.map((d) => [d, 0]));
  projects.forEach((p) => { counts[p.domain] = (counts[p.domain] ?? 0) + 1; });
  const all = [['', `All (${projects.length})`], ...Object.keys(counts).map((d) => [d, `${d} (${counts[d]})`])];
  chips.innerHTML = all
    .map(([value, label]) => `<button type="button" class="chip" data-domain="${escapeHtml(value)}" aria-pressed="${state.domain === value}">${escapeHtml(label)}</button>`)
    .join('');
}

function render() {
  const list = projects.filter(matches);
  const visible = list.slice(0, state.shown);
  results.innerHTML = visible.length
    ? visible.map((p) => projectCardHTML(p, ROOT)).join('')
    : '<p class="empty">No projects match. Try a different word, or <a href="../#contact">ask us for a custom project</a>.</p>';
  count.textContent = `${list.length} project${list.length === 1 ? '' : 's'}${state.domain ? ` in ${state.domain}` : ''}${state.q ? ` matching “${state.q}”` : ''}`;
  more.hidden = list.length <= state.shown;
  chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.domain === state.domain)));
  observeReveal(results);
}

let t;
qInput.value = state.q;
qInput.addEventListener('input', () => {
  clearTimeout(t);
  t = setTimeout(() => { state.q = qInput.value.trim(); state.shown = PAGE_SIZE; syncUrl(); render(); }, 150);
});
chips.addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  state.domain = btn.dataset.domain;
  state.shown = PAGE_SIZE;
  syncUrl();
  render();
});
more.addEventListener('click', () => { state.shown += PAGE_SIZE; render(); });

loadProjects(ROOT)
  .then((data) => { projects = data; renderChips(); render(); })
  .catch(() => { results.innerHTML = '<p class="empty">Projects could not be loaded. Please refresh the page.</p>'; });
