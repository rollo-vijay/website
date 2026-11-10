// Shared behaviour for every page: mobile menu, active nav link, footer year,
// scroll-reveal, the 3D tilt effect on cards and the photorealistic 3D backdrop.
document.documentElement.classList.remove('no-js');
import('./motion.js');

// Mobile menu
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
if (toggle && nav) {
  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

// Active nav link
const page = document.body.dataset.page;
if (page) document.querySelector(`.nav a[data-nav="${page}"]`)?.setAttribute('aria-current', 'page');

// Footer year
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

// Reveal on scroll
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export function observeReveal(root = document) {
  const els = root.querySelectorAll('.reveal:not(.is-visible)');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach((el) => io.observe(el));
}
observeReveal();

// 3D tilt + moving glare on hover (mouse/pen only)
if (!reduceMotion && matchMedia('(hover: hover)').matches) {
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.tilt');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`);
    card.style.setProperty('--gy', `${((py + 0.5) * 100).toFixed(1)}%`);
    card.style.transform = `perspective(900px) rotateX(${(-py * 9).toFixed(2)}deg) rotateY(${(px * 12).toFixed(2)}deg) translateZ(18px)`;
  });
  document.addEventListener('pointerout', (e) => {
    const card = e.target.closest?.('.tilt');
    if (card && !card.contains(e.relatedTarget)) card.style.transform = '';
  });
}

// Photorealistic 3D backdrop (loaded after the page, skipped on save-data, no WebGL, or ?no3d)
function webgl2() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}
async function start3D() {
  if (new URLSearchParams(location.search).has('no3d')) return;
  if (navigator.connection?.saveData || !webgl2()) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'bg3d';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  try {
    const { startScene } = await import(new URL('./scene3d.js', import.meta.url));
    const scene = startScene(canvas);
    await scene.ready;
    document.documentElement.classList.add('has-3d');
  } catch (err) {
    console.warn('3D backdrop unavailable:', err);
    canvas.remove();
  }
}
const kick = () => setTimeout(start3D, 60);
if (document.readyState === 'complete') kick(); else addEventListener('load', kick, { once: true });
