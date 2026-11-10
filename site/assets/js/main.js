// Shared behaviour for every page: mobile menu, active nav link, footer year,
// scroll-reveal and the 3D tilt effect on cards.
document.documentElement.classList.remove('no-js');

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

// 3D tilt on hover (mouse/pen only)
if (!reduceMotion && matchMedia('(hover: hover)').matches) {
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.tilt');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(800px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 10).toFixed(2)}deg) translateY(-4px)`;
  });
  document.addEventListener('pointerout', (e) => {
    const card = e.target.closest?.('.tilt');
    if (card && !card.contains(e.relatedTarget)) card.style.transform = '';
  });
}
