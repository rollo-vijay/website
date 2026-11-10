// Shared board layout: the texture painter (pads, silkscreen, traces) and the 3D parts
// both read from here so everything lines up. Units are scene units; board is centred
// on the origin, x to the right, z towards the viewer, y up.

export const BW = 10;     // board width  (x)
export const BD = 7;      // board depth  (z)
export const BT = 0.16;   // board thickness
export const TOP = BT / 2; // y of the board's top surface

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Main parts. w = size along x, d = size along z.
export const P = {
  esp: { x: 1.3, z: -0.4, w: 1.8, d: 2.4 },        // module, antenna towards -z
  qfp: { x: -2.6, z: 0.1, s: 1.6, perSide: 16, pitch: 0.085 },
  usb: { x: -0.9, z: 3.2, w: 0.9, d: 0.7 },
  hdrA: { x: -2.1, z: -3.05, n: 15, pitch: 0.25 },
  hdrB: { x: 2.3, z: -3.05, n: 15, pitch: 0.25 },
  caps: [
    { x: 3.9, z: 1.4, r: 0.42, h: 0.8 },
    { x: 3.9, z: -0.9, r: 0.34, h: 0.62 },
    { x: 2.9, z: 2.5, r: 0.3, h: 0.55 },
  ],
  to220: [{ x: -4.3, z: -2.0 }, { x: -4.3, z: -0.9 }],
  soic: [{ x: -0.8, z: -0.9 }, { x: -0.8, z: -2.0 }, { x: 3.0, z: 0.3 }],
  inductors: [{ x: -0.8, z: 0.3, s: 0.6 }, { x: 2.9, z: 1.2, s: 0.55 }],
  crystal: { x: -0.7, z: 1.7, w: 0.8, d: 0.3 },
  terminal: { x: 4.1, z: -2.1, w: 1.0, d: 0.6 },
  leds: [
    { x: -4.55, z: 0.9, color: 0xff2a1a },
    { x: -4.55, z: 1.3, color: 0x2bff6a },
    { x: -4.55, z: 1.7, color: 0xff8a1f },
    { x: -4.55, z: 2.1, color: 0x3a8bff },
  ],
  holes: [[-4.6, -3.1], [4.6, -3.1], [-4.6, 3.1], [4.6, 3.1]],
};

// Axis-aligned keep-out boxes (cx, cz, half-w, half-d) used for passive placement.
export function keepouts() {
  const k = [];
  const add = (x, z, hw, hd) => k.push({ x, z, hw, hd });
  add(P.esp.x, P.esp.z, P.esp.w / 2 + 0.05, P.esp.d / 2 + 0.05);
  add(P.qfp.x, P.qfp.z, P.qfp.s / 2 + 0.25, P.qfp.s / 2 + 0.25);
  add(P.usb.x, P.usb.z, P.usb.w / 2 + 0.05, P.usb.d / 2 + 0.05);
  add(P.hdrA.x, P.hdrA.z, (P.hdrA.n * P.hdrA.pitch) / 2 + 0.05, 0.2);
  add(P.hdrB.x, P.hdrB.z, (P.hdrB.n * P.hdrB.pitch) / 2 + 0.05, 0.2);
  P.caps.forEach((c) => add(c.x, c.z, c.r + 0.08, c.r + 0.08));
  P.to220.forEach((t) => add(t.x, t.z + 0.2, 0.42, 0.5));
  P.soic.forEach((s) => add(s.x, s.z, 0.3, 0.4));
  P.inductors.forEach((i) => add(i.x, i.z, i.s / 2 + 0.08, i.s / 2 + 0.08));
  add(P.crystal.x, P.crystal.z, P.crystal.w / 2 + 0.08, P.crystal.d / 2 + 0.08);
  add(P.terminal.x, P.terminal.z, P.terminal.w / 2 + 0.05, P.terminal.d / 2 + 0.05);
  P.leds.forEach((l) => add(l.x, l.z, 0.2, 0.14));
  P.holes.forEach(([x, z]) => add(x, z, 0.35, 0.35));
  return k;
}

// SMD passives (0603-style). Placed in rings around the ICs plus a scatter over free board.
export function buildPassives(seed = 7) {
  const rnd = mulberry32(seed);
  const blocked = keepouts();
  const out = [];
  const L = 0.2, W = 0.1; // body footprint
  const hit = (x, z, rot, pad = 0) => {
    const hw = (rot ? W : L) / 2 + pad, hd = (rot ? L : W) / 2 + pad;
    if (Math.abs(x) > 4.75 - hw || Math.abs(z) > 3.35 - hd) return true;
    for (const b of blocked) if (Math.abs(x - b.x) < b.hw + hw && Math.abs(z - b.z) < b.hd + hd) return true;
    for (const p of out) {
      const phw = (p.rot ? W : L) / 2, phd = (p.rot ? L : W) / 2;
      if (Math.abs(x - p.x) < phw + hw + 0.04 && Math.abs(z - p.z) < phd + hd + 0.04) return true;
    }
    return false;
  };
  const tryPlace = (cx, cz, spread, n, kind) => {
    let tries = 0;
    while (n > 0 && tries++ < n * 60 + 200) {
      const a = rnd() * Math.PI * 2, r = spread[0] + rnd() * (spread[1] - spread[0]);
      const snap = (v) => Math.round(v / 0.06) * 0.06;
      const x = snap(cx + Math.cos(a) * r), z = snap(cz + Math.sin(a) * r);
      const rot = rnd() < 0.5 ? 0 : 1;
      if (hit(x, z, rot)) continue;
      out.push({ x, z, rot, kind: kind ?? (rnd() < 0.55 ? 'res' : 'cap') });
      n--;
    }
  };
  // bypass clusters around the ICs
  tryPlace(P.qfp.x, P.qfp.z, [1.05, 1.5], 22);
  tryPlace(P.esp.x, P.esp.z + 0.2, [1.45, 1.9], 18);
  P.soic.forEach((s) => tryPlace(s.x, s.z, [0.5, 0.8], 5));
  P.inductors.forEach((i) => tryPlace(i.x, i.z, [0.5, 0.8], 4));
  // LED series resistors
  P.leds.forEach((l) => out.push({ x: l.x + 0.42, z: l.z, rot: 0, kind: 'res' }));
  // scatter
  tryPlace(0, 0, [0.5, 4.6], 70);
  return out;
}
