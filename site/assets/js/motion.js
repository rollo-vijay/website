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
  // scroll-scrubbed statement: words light up as the block crosses the viewport
  const scrubEl = document.querySelector('[data-scrub]');
  let scrubWords = [];
  if (scrubEl) {
    const walk = (node, hot) => [...node.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach((tok) => {
          if (!tok.trim()) { frag.append(tok); return; }
          const sp = document.createElement('span'); sp.className = hot ? 's hot' : 's'; sp.textContent = tok; frag.append(sp);
        });
        c.replaceWith(frag);
      } else if (c.nodeType === 1) walk(c, true);
    });
    walk(scrubEl, false);
    scrubWords = [...scrubEl.querySelectorAll('.s')];
  }
  const scrub = () => {
    if (!scrubEl) return;
    const r = scrubEl.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight * 0.85 - r.top) / (innerHeight * 0.55 + r.height * 0.5)));
    const n = Math.round(p * scrubWords.length);
    scrubWords.forEach((w, i) => w.classList.toggle('on', i < n));
  };
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    header?.classList.toggle('is-scrolled', y > 8);
    root.style.setProperty('--board', hero ? String(Math.max(0, 1 - y / (innerHeight * 0.85))) : '0');
    root.style.setProperty('--circuit', hero ? String(Math.min(1, y / (innerHeight * 0.6))) : '1');
    scrub();
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

  // 6. section headings rise in
  const hio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); hio.unobserve(e.target); } }), { threshold: 0.25 });
  document.querySelectorAll('.section-head').forEach((el) => hio.observe(el));

  // 7. cursor spotlight on cards + ambient glow that follows the pointer
  if (matchMedia('(pointer: fine)').matches) {
    const glow = Object.assign(document.createElement('div'), { className: 'cursor-glow' });
    glow.setAttribute('aria-hidden', 'true');
    document.body.append(glow);
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
    addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      const card = e.target.closest?.('.card, .prow, .trust article');
      if (card) { const r = card.getBoundingClientRect(); card.style.setProperty('--mx', `${e.clientX - r.left}px`); card.style.setProperty('--my', `${e.clientY - r.top}px`); }
    }, { passive: true });
    const follow = () => { gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12; glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`; requestAnimationFrame(follow); };
    follow();
  }

  // 8. animated circuit background: traces with travelling signal pulses
  const cv = Object.assign(document.createElement('canvas'), { className: 'circuit' });
  cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const ctx = cv.getContext('2d');
  const G = 44;
  let W, H, paths = [], base;
  const build = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paths = [];
    const count = Math.round((W * H) / 42000);
    for (let k = 0; k < count; k++) {
      let x = Math.round(Math.random() * W / G) * G, y = Math.round(Math.random() * H / G) * G, horiz = Math.random() < 0.5;
      const pts = [[x, y]]; let len = 0;
      for (let j = 0, n = 3 + Math.floor(Math.random() * 4); j < n; j++) {
        const d = (2 + Math.floor(Math.random() * 5)) * G * (Math.random() < 0.5 ? -1 : 1);
        if (horiz) x += d; else y += d;
        pts.push([x, y]); len += Math.abs(d); horiz = !horiz;
      }
      paths.push({ pts, len, t: Math.random(), v: 0.0012 + Math.random() * 0.0022, cool: Math.random() < 0.25 });
    }
    base = document.createElement('canvas'); base.width = cv.width; base.height = cv.height;
    const b = base.getContext('2d'); b.setTransform(dpr, 0, 0, dpr, 0, 0);
    b.lineWidth = 1; b.strokeStyle = 'rgba(255,150,80,.10)'; b.fillStyle = 'rgba(255,150,80,.22)';
    paths.forEach(({ pts }) => {
      b.beginPath(); pts.forEach(([px, py], i) => (i ? b.lineTo(px, py) : b.moveTo(px, py))); b.stroke();
      [pts[0], pts[pts.length - 1]].forEach(([px, py]) => { b.beginPath(); b.arc(px, py, 2.4, 0, 6.3); b.fill(); });
    });
  };
  const at = (p, dist) => {
    for (let i = 1; i < p.pts.length; i++) {
      const [ax, ay] = p.pts[i - 1], [bx, by] = p.pts[i], seg = Math.abs(bx - ax) + Math.abs(by - ay);
      if (dist <= seg) return [ax + (bx - ax) * dist / seg, ay + (by - ay) * dist / seg];
      dist -= seg;
    }
    return p.pts[p.pts.length - 1];
  };
  const frame = () => {
    if (!document.hidden && root.style.getPropertyValue('--circuit') !== '0') {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(base, 0, 0, W, H);
      paths.forEach((p) => {
        p.t += p.v; if (p.t > 1.2) p.t = -0.2;
        for (let k = 0; k < 6; k++) {
          const d = (p.t - k * 0.012) * p.len;
          if (d < 0 || d > p.len) continue;
          const [x, y] = at(p, d);
          ctx.beginPath(); ctx.arc(x, y, 2.2 - k * 0.3, 0, 6.3);
          ctx.fillStyle = p.cool ? `rgba(120,220,255,${0.9 - k * 0.15})` : `rgba(255,150,60,${0.9 - k * 0.15})`;
          ctx.shadowColor = p.cool ? '#5fd8ff' : '#ff7a28'; ctx.shadowBlur = k ? 0 : 14;
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;
    }
    requestAnimationFrame(frame);
  };
  build(); frame();
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(build, 200); });
  onScroll();
}
