// Motion layer: scroll progress, hero entrance, staggered reveals, count-up stats,
// magnetic buttons, header elevation, hero parallax. No dependencies.
// Everything is skipped when the visitor prefers reduced motion.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
if (!reduce) {
  root.classList.add('motion');

  // 1. scroll progress bar + header elevation + hero parallax (one rAF-throttled handler)
  const bar = Object.assign(document.createElement('div'), { className: 'scroll-progress' });
  bar.setAttribute('aria-hidden', 'true');
  document.body.prepend(bar);
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('.hero__content');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    header?.classList.toggle('is-scrolled', y > 8);
    if (hero && y < innerHeight) { hero.style.transform = `translate3d(0, ${y * 0.12}px, 0)`; hero.style.opacity = String(1 - y / (innerHeight * 1.1)); }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // 2a. masked word-by-word headline reveal
  const h1 = document.querySelector('.hero h1');
  if (h1) {
    let n = 0;
    const wrap = (node) => {
      [...node.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok.trim()) { frag.append(tok); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('i'); i.textContent = tok; i.style.setProperty('--i', n++);
            w.append(i); frag.append(w);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1) wrap(c);
      });
    };
    wrap(h1);
  }

  // 2. hero entrance: stagger direct children
  document.querySelectorAll('.hero__content > *:not(h1)').forEach((el, i) => {
    el.classList.add('enter');
    el.style.setProperty('--d', `${120 + i * 90}ms`);
  });

  // 3. stagger siblings inside grids/lists when they reveal
  const stagger = (container) => [...container.children].forEach((c, i) => { if (c.classList.contains('reveal')) c.style.transitionDelay = `${Math.min(i, 8) * 70}ms`; });
  document.querySelectorAll('.grid, .trust, .steps, .services, .faq').forEach(stagger);
  new MutationObserver((muts) => muts.forEach((m) => { if (m.target.matches?.('#products, #featured-grid, #catalogue, .plist')) stagger(m.target); })).observe(document.body, { childList: true, subtree: true });

  // 4. count-up for the stat numbers
  document.querySelectorAll('.stats strong').forEach((el) => {
    const m = el.textContent.match(/^(\d+)(.*)$/);
    if (!m || el.textContent.includes('–')) return;
    const target = +m[1], suffix = m[2];
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1100;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io.observe(el);
  });

  // 5. magnetic buttons (fine pointers only)
  if (matchMedia('(pointer: fine)').matches) {
    document.addEventListener('pointermove', (e) => {
      const b = e.target.closest?.('.hero .btn, .cta-band .btn, .section-head .btn--primary');
      document.querySelectorAll('.btn.is-magnet').forEach((x) => { if (x !== b) { x.style.transform = ''; x.classList.remove('is-magnet'); } });
      if (!b) return;
      const r = b.getBoundingClientRect();
      b.classList.add('is-magnet');
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
    });
  }
}
