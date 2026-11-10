// Procedural PCB surface: paints the colour map and a packed height/roughness/metal map.
//   colour map : sRGB albedo (solder mask, copper under mask, gold pads, silkscreen)
//   HRM map    : R = height (bump), G = roughness, B = metalness
import { BW, BD, P, buildPassives, mulberry32 } from './layout.js';

const hrm = (r, g, b) => `rgb(${r},${g},${b})`;

// style = { c: albedo, h: [height, roughness, metal] }
const ST = {
  mask:   { c: '#4c0a10', h: [110, 105, 0] },
  maskHi: { c: '#5e1017', h: [128, 95, 0] },       // copper under the mask, slightly raised and glossier
  edge:   { c: '#3a070c', h: [100, 110, 0] },
  gold:   { c: '#d8b15a', h: [150, 62, 255] },
  tin:    { c: '#c9c9c4', h: [148, 80, 255] },
  hole:   { c: '#0a0506', h: [0, 200, 0] },
  silk:   { c: '#efe8dc', h: [140, 150, 0] },
  keep:   { c: '#3a070c', h: [104, 110, 0] },
};

class Painter {
  constructor(colourPx, hrmPx) {
    const mk = (px) => {
      const c = document.createElement('canvas');
      c.width = px; c.height = Math.round((px * BD) / BW);
      return c;
    };
    this.layers = [
      { key: 'c', canvas: mk(colourPx), k: colourPx / BW },
      { key: 'h', canvas: mk(hrmPx), k: hrmPx / BW },
    ];
    this.layers.forEach((l) => { l.ctx = l.canvas.getContext('2d'); });
  }
  _paint(st, key) { return key === 'c' ? st.c : hrm(...st.h); }
  fill(st) {
    this.layers.forEach(({ ctx, canvas, key }) => { ctx.fillStyle = this._paint(st, key); ctx.fillRect(0, 0, canvas.width, canvas.height); });
  }
  rect(st, x, z, w, d, r = 0) {
    this.layers.forEach(({ ctx, k, key }) => {
      ctx.fillStyle = this._paint(st, key);
      const px = (x - w / 2 + BW / 2) * k, py = (z - d / 2 + BD / 2) * k;
      ctx.beginPath();
      if (r > 0 && ctx.roundRect) ctx.roundRect(px, py, w * k, d * k, r * k); else ctx.rect(px, py, w * k, d * k);
      ctx.fill();
    });
  }
  circle(st, x, z, rad) {
    this.layers.forEach(({ ctx, k, key }) => {
      ctx.fillStyle = this._paint(st, key);
      ctx.beginPath(); ctx.arc((x + BW / 2) * k, (z + BD / 2) * k, rad * k, 0, Math.PI * 2); ctx.fill();
    });
  }
  ring(st, x, z, rad, width) {
    this.layers.forEach(({ ctx, k, key }) => {
      ctx.strokeStyle = this._paint(st, key); ctx.lineWidth = width * k;
      ctx.beginPath(); ctx.arc((x + BW / 2) * k, (z + BD / 2) * k, rad * k, 0, Math.PI * 2); ctx.stroke();
    });
  }
  // rounded polyline
  poly(st, pts, width, corner = 0.08) {
    this.layers.forEach(({ ctx, k, key }) => {
      ctx.strokeStyle = this._paint(st, key); ctx.lineWidth = width * k; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const q = (p) => [(p[0] + BW / 2) * k, (p[1] + BD / 2) * k];
      ctx.beginPath();
      const first = q(pts[0]); ctx.moveTo(first[0], first[1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const a = q(pts[i]), b = q(pts[i + 1]);
        ctx.arcTo(a[0], a[1], b[0], b[1], corner * k);
      }
      const last = q(pts[pts.length - 1]); ctx.lineTo(last[0], last[1]);
      ctx.stroke();
    });
  }
  text(st, str, x, z, size, { rot = 0, align = 'left', font = 'Arial' } = {}) {
    this.layers.forEach(({ ctx, k, key }) => {
      ctx.save();
      ctx.fillStyle = this._paint(st, key);
      ctx.font = `bold ${size * k}px ${font}, sans-serif`;
      ctx.textAlign = align; ctx.textBaseline = 'middle';
      ctx.translate((x + BW / 2) * k, (z + BD / 2) * k); ctx.rotate(rot);
      ctx.fillText(str, 0, 0);
      ctx.restore();
    });
  }
  outline(st, x, z, w, d, width = 0.025) {
    this.layers.forEach(({ ctx, k, key }) => {
      ctx.strokeStyle = this._paint(st, key); ctx.lineWidth = width * k;
      ctx.strokeRect((x - w / 2 + BW / 2) * k, (z - d / 2 + BD / 2) * k, w * k, d * k);
    });
  }
}

// copper trace: a darker wide stroke for the mask edge, then the lighter raised copper
function trace(p, pts, w = 0.05, corner = 0.07) {
  p.poly(ST.edge, pts, w + 0.02, corner);
  p.poly(ST.maskHi, pts, w, corner);
}

function noise(canvas, amp, channel) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data, rnd = mulberry32(3);
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * amp;
    if (channel === 'rgb') { d[i] += n; d[i + 1] += n * 0.5; d[i + 2] += n * 0.5; } else { d[i] += n; d[i + 1] += n * 0.6; }
  }
  ctx.putImageData(img, 0, 0);
}

export function paintBoard({ colourPx = 4096, hrmPx = 2048 } = {}) {
  const p = new Painter(colourPx, hrmPx);
  p.fill(ST.mask);
  const rnd = mulberry32(11);

  // ----- traces (under the mask) -----
  // QFP right leads -> ESP left pads
  const qr = P.qfp.x + P.qfp.s / 2 + 0.2, el = P.esp.x - P.esp.w / 2;
  for (let i = 0; i < 12; i++) {
    const z1 = P.qfp.z - 0.5 + i * P.qfp.pitch, z2 = P.esp.z - 0.1 + i * 0.09;
    const xm = -1.05 + (i % 6) * 0.1;
    trace(p, [[qr, z1], [xm, z1], [xm, z2], [el + 0.05, z2]], 0.04);
  }
  // QFP top leads -> header A
  for (let i = 0; i < 14; i++) {
    const x1 = P.qfp.x - 0.55 + i * P.qfp.pitch, zt = P.qfp.z - P.qfp.s / 2 - 0.2;
    const px = P.hdrA.x + (i - 7) * P.hdrA.pitch;
    const zm = -1.35 - (i % 7) * 0.1;
    trace(p, [[x1, zt], [x1, zm], [px, zm - 0.18], [px, P.hdrA.z]], 0.04);
  }
  // ESP right edge -> header B
  for (let i = 0; i < 12; i++) {
    const z0 = P.esp.z - 0.6 + i * 0.12, xm = 2.45 + i * 0.07;
    const px = P.hdrB.x + (i - 6) * P.hdrB.pitch;
    trace(p, [[P.esp.x + P.esp.w / 2, z0], [xm, z0], [xm, -2.45 + (i % 4) * 0.08], [px, -2.45 + (i % 4) * 0.08], [px, P.hdrB.z]], 0.04);
  }
  // QFP bottom leads -> USB / crystal region
  for (let i = 0; i < 10; i++) {
    const x1 = P.qfp.x - 0.4 + i * P.qfp.pitch, zb = P.qfp.z + P.qfp.s / 2 + 0.2;
    const x2 = -1.3 + i * 0.09;
    trace(p, [[x1, zb], [x1, 1.55 + (i % 5) * 0.1], [x2, 2.05 + (i % 5) * 0.1], [x2, P.usb.z - 0.2]], 0.04);
  }
  // power rails (wide)
  trace(p, [[-4.3, -1.55], [-4.3, -1.35], [-3.8, -1.35], [-3.8, 1.4], [-1.2, 2.4], [P.usb.x - 0.3, P.usb.z - 0.2]], 0.16, 0.2);
  trace(p, [[3.9, 0.5], [3.4, 0.5], [3.4, 2.1], [2.0, 2.1], [2.0, 2.9], [1.4, 2.9]], 0.14, 0.2);
  trace(p, [[3.9, -0.55], [3.5, -0.55], [3.5, -1.3], [4.1, -1.3], [4.1, -1.8]], 0.14, 0.2);
  // via stitching around the edge
  const vias = [];
  for (let x = -4.75; x <= 4.75; x += 0.25) { vias.push([x, -3.3]); if (Math.abs(x + 0.9) > 0.7) vias.push([x, 3.3]); }
  for (let z = -3.1; z <= 3.1; z += 0.25) { vias.push([-4.85, z]); vias.push([4.85, z]); }

  // ----- footprints: pads and silkscreen -----
  // QFP leads + pad frame
  const half = P.qfp.s / 2;
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < P.qfp.perSide; i++) {
      const o = (i - (P.qfp.perSide - 1) / 2) * P.qfp.pitch;
      const hw = side % 2 === 0 ? 0.28 : 0.045, hd = side % 2 === 0 ? 0.045 : 0.28;
      const d = half + 0.1;
      const x = side === 2 ? -d : side === 3 ? d : o, z = side === 0 ? -d : side === 1 ? d : o;
      p.rect(ST.tin, P.qfp.x + x, P.qfp.z + z, hw, hd, 0.01);
    }
  }
  p.outline(ST.silk, P.qfp.x, P.qfp.z, P.qfp.s + 0.1, P.qfp.s + 0.1, 0.02);
  p.circle(ST.silk, P.qfp.x - half - 0.08, P.qfp.z - half - 0.08, 0.04);
  p.text(ST.silk, 'U1', P.qfp.x - 0.6, P.qfp.z - half - 0.55, 0.15);

  // ESP module pads (castellated edge) + silk
  for (let i = 0; i < 14; i++) {
    const z = P.esp.z - 0.35 + i * 0.09 - 0.0;
    p.rect(ST.gold, P.esp.x - P.esp.w / 2 - 0.02, z, 0.18, 0.05, 0.01);
    p.rect(ST.gold, P.esp.x + P.esp.w / 2 + 0.02, z, 0.18, 0.05, 0.01);
  }
  for (let i = 0; i < 8; i++) p.rect(ST.gold, P.esp.x - 0.4 + i * 0.1, P.esp.z + P.esp.d / 2 + 0.03, 0.05, 0.16, 0.01);
  p.outline(ST.silk, P.esp.x, P.esp.z, P.esp.w + 0.12, P.esp.d + 0.12, 0.02);
  p.text(ST.silk, 'U2  WIRELESS', P.esp.x, P.esp.z + P.esp.d / 2 + 0.28, 0.14, { align: 'center' });
  p.rect(ST.keep, P.esp.x, P.esp.z - P.esp.d / 2 - 0.15, P.esp.w + 0.1, 0.3); // antenna keep-out

  // headers
  [P.hdrA, P.hdrB].forEach((h) => {
    for (let i = 0; i < h.n; i++) {
      const x = h.x + (i - (h.n - 1) / 2) * h.pitch;
      p.circle(ST.gold, x, h.z, 0.095);
      p.circle(ST.hole, x, h.z, 0.04);
    }
    p.outline(ST.silk, h.x, h.z, h.n * h.pitch + 0.06, 0.32, 0.02);
    for (let i = 0; i < h.n; i += 5) p.text(ST.silk, String(i + 1), h.x + (i - (h.n - 1) / 2) * h.pitch, h.z + 0.28, 0.1, { align: 'center' });
  });
  p.text(ST.silk, 'J1', P.hdrA.x, P.hdrA.z - 0.34, 0.14, { align: 'center' });
  p.text(ST.silk, 'J2', P.hdrB.x, P.hdrB.z - 0.34, 0.14, { align: 'center' });

  // USB-C pads
  for (let i = 0; i < 6; i++) p.rect(ST.tin, P.usb.x - 0.3 + i * 0.12, P.usb.z - 0.15, 0.07, 0.3, 0.01);
  p.rect(ST.tin, P.usb.x - 0.42, P.usb.z + 0.05, 0.1, 0.2); p.rect(ST.tin, P.usb.x + 0.42, P.usb.z + 0.05, 0.1, 0.2);
  p.text(ST.silk, 'USB-C', P.usb.x, P.usb.z - 0.5, 0.14, { align: 'center' });

  // electrolytic caps: pads + silk circles with polarity half
  P.caps.forEach((c, i) => {
    p.rect(ST.tin, c.x - c.r * 0.55, c.z, 0.22, 0.2, 0.03); p.rect(ST.tin, c.x + c.r * 0.55, c.z, 0.22, 0.2, 0.03);
    p.ring(ST.silk, c.x, c.z, c.r + 0.06, 0.02);
    p.text(ST.silk, `C${i + 1}`, c.x, c.z + c.r + 0.2, 0.12, { align: 'center' });
  });
  // TO-220 pads
  P.to220.forEach((t, i) => {
    for (let k = -1; k <= 1; k++) p.circle(ST.gold, t.x + k * 0.2, t.z + 0.45, 0.075), p.circle(ST.hole, t.x + k * 0.2, t.z + 0.45, 0.03);
    p.outline(ST.silk, t.x, t.z + 0.1, 0.7, 0.4, 0.02);
    p.text(ST.silk, `Q${i + 1}`, t.x, t.z - 0.32, 0.13, { align: 'center' });
  });
  // SOIC pads
  P.soic.forEach((s, i) => {
    for (let k = 0; k < 4; k++) for (const sd of [-1, 1]) p.rect(ST.tin, s.x - 0.21 + k * 0.14, s.z + sd * 0.25, 0.07, 0.16, 0.01);
    p.circle(ST.silk, s.x - 0.32, s.z - 0.3, 0.025);
    p.text(ST.silk, `U${i + 3}`, s.x + 0.45, s.z, 0.12);
  });
  // inductors, crystal, terminal, LEDs
  P.inductors.forEach((l) => { p.rect(ST.tin, l.x - l.s * 0.38, l.z, 0.18, l.s * 0.7, 0.02); p.rect(ST.tin, l.x + l.s * 0.38, l.z, 0.18, l.s * 0.7, 0.02); });
  p.rect(ST.tin, P.crystal.x - 0.42, P.crystal.z, 0.18, 0.2, 0.02); p.rect(ST.tin, P.crystal.x + 0.42, P.crystal.z, 0.18, 0.2, 0.02);
  p.text(ST.silk, 'Y1', P.crystal.x, P.crystal.z + 0.3, 0.12, { align: 'center' });
  for (let i = 0; i < 2; i++) { p.circle(ST.gold, P.terminal.x - 0.25 + i * 0.5, P.terminal.z + 0.05, 0.12); p.circle(ST.hole, P.terminal.x - 0.25 + i * 0.5, P.terminal.z + 0.05, 0.055); }
  p.text(ST.silk, 'VIN', P.terminal.x, P.terminal.z + 0.46, 0.13, { align: 'center' });
  P.leds.forEach((l, i) => {
    p.rect(ST.tin, l.x - 0.12, l.z, 0.1, 0.12, 0.01); p.rect(ST.tin, l.x + 0.12, l.z, 0.1, 0.12, 0.01);
    p.text(ST.silk, `D${i + 1}`, l.x - 0.02, l.z - 0.17, 0.09, { align: 'center' });
  });

  // passives pads
  buildPassives().forEach((c) => {
    const o = 0.115;
    const dx = c.rot ? 0 : o, dz = c.rot ? o : 0;
    const pw = c.rot ? 0.1 : 0.09, pd = c.rot ? 0.09 : 0.1;
    p.rect(ST.tin, c.x - dx, c.z - dz, pw, pd, 0.012);
    p.rect(ST.tin, c.x + dx, c.z + dz, pw, pd, 0.012);
  });

  // vias
  vias.forEach(([x, z]) => { p.circle(ST.gold, x, z, 0.06); p.circle(ST.hole, x, z, 0.025); });

  // mounting holes
  P.holes.forEach(([x, z]) => {
    p.circle(ST.gold, x, z, 0.3); p.circle(ST.hole, x, z, 0.17);
    p.ring(ST.silk, x, z, 0.36, 0.02);
  });
  // fiducials
  [[-4.2, 3.0], [4.2, 3.0], [-4.2, -2.6]].forEach(([x, z]) => { p.circle(ST.gold, x, z, 0.05); p.ring(ST.keep, x, z, 0.1, 0.03); });

  // silkscreen branding
  p.text(ST.silk, 'iShoweLectro', -3.0, 2.78, 0.36, { font: '"Poppins", Arial' });
  p.text(ST.silk, 'IEEE FINAL YEAR PROJECT CENTRE', -3.0, 3.12, 0.12);
  p.text(ST.silk, 'REV 2.6   CHENNAI   2026', 1.5, 3.12, 0.11);
  p.text(ST.silk, '3V3', -4.2, -0.2, 0.1); p.text(ST.silk, 'GND', -4.2, 0.1, 0.1);
  p.rect(ST.silk, 0.2, 3.0, 0.36, 0.04); p.rect(ST.silk, 0.38, 3.0, 0.04, 0.2);   // little arrow/corner marks
  p.rect(ST.silk, 4.1, -3.18, 0.25, 0.02);

  // surface grain
  noise(p.layers[0].canvas, 9, 'rgb');
  noise(p.layers[1].canvas, 10, 'hr');
  return { colour: p.layers[0].canvas, hrm: p.layers[1].canvas };
}

// ----- small label textures for parts -----
export function labelTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); draw(ctx, w, h);
  return c;
}

export function chipLabel(lines, { bg = '#18181b', fg = '#b9b9c0', dot = true, size = 512 } = {}) {
  return labelTexture(size, size, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const r = mulberry32(5);
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.05})`; g.fillRect(r() * w, r() * h, 2, 2); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((l, i) => { g.font = `600 ${l.size ?? 44}px "Courier New", monospace`; g.fillText(l.t, w / 2, h * (0.4 + i * 0.14)); });
    if (dot) { g.beginPath(); g.arc(w * 0.14, h * 0.14, w * 0.03, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,.35)'; g.fill(); }
  });
}

export function shieldTexture() {
  return labelTexture(512, 640, (g, w, h) => {
    const r = mulberry32(9);
    g.fillStyle = '#c4c7cc'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '60,64,72'},${r() * 0.09})`; g.fillRect(0, r() * h, w, 1 + r() * 2); }
    g.fillStyle = '#2b2d33'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = '700 42px "Arial", sans-serif'; g.fillText('ESP32-S3-WROOM-1', 36, 90);
    g.font = '600 30px "Arial", sans-serif'; g.fillText('N16R8', 36, 140);
    g.fillStyle = '#4a4d55';
    for (let i = 0; i < 3; i++) g.fillRect(36, 200 + i * 20, 210 - i * 40, 5);
    // data-matrix style block
    const s = 12; g.fillStyle = '#2b2d33';
    for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) if (r() > 0.45 || x === 0 || y === 9) g.fillRect(360 + x * s, 190 + y * s, s - 1, s - 1);
    g.fillStyle = '#4a4d55'; g.font = '600 24px "Arial", sans-serif'; g.fillText('iShoweLectro DEV', 36, 560);
  });
}

export function espAntennaTexture() {
  // module substrate top (1.8 x 2.4): the antenna sits in the top third, the rest is covered by the shield
  return labelTexture(768, 1024, (g, w, h) => {
    g.fillStyle = '#0d0d0f'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d8b15a'; g.lineWidth = 9; g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath(); g.moveTo(60, 330);
    let x = 60, up = true;
    while (x < w - 120) { g.lineTo(x, up ? 70 : 330); x += 44; g.lineTo(x, up ? 70 : 330); up = !up; }
    g.lineTo(w - 60, 330); g.stroke();
    g.fillStyle = '#d8b15a'; g.fillRect(60, 345, w - 120, 14);
  });
}

export function sleeveTexture(color = '#10141f', stripe = '#c8ccd4') {
  return labelTexture(256, 256, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.fillStyle = stripe; g.fillRect(w * 0.04, 0, w * 0.1, h);
    g.fillStyle = '#e6e8ee'; g.save(); g.translate(w * 0.5, h * 0.5); g.rotate(-Math.PI / 2);
    g.font = '700 38px "Arial", sans-serif'; g.textAlign = 'center'; g.fillText('470µF  25V', 0, -20);
    g.font = '600 26px "Arial", sans-serif'; g.fillText('105°C  LOW ESR', 0, 22); g.restore();
  });
}

export function capTopTexture() {
  return labelTexture(256, 256, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
    grad.addColorStop(0, '#d9dce2'); grad.addColorStop(1, '#9ea3ad');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#555a64'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(w * 0.28, h * 0.28); g.lineTo(w * 0.72, h * 0.72); g.moveTo(w * 0.72, h * 0.28); g.lineTo(w * 0.28, h * 0.72); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.arc(w / 2, h / 2, w * 0.43, 0, Math.PI * 2); g.stroke();
  });
}
