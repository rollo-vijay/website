// 3D components for the board. Everything is procedural so the site ships no model files.
import {
  Group, Mesh, InstancedMesh, Object3D, BoxGeometry, CylinderGeometry, CircleGeometry, SphereGeometry, TorusGeometry,
  MeshStandardMaterial, MeshPhysicalMaterial, CanvasTexture, SRGBColorSpace, RepeatWrapping, Color, Matrix4, DoubleSide,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { P, TOP, BT, BW, BD, buildPassives, mulberry32 } from './layout.js';
import { paintBoard, chipLabel, shieldTexture, espAntennaTexture, sleeveTexture, capTopTexture } from './paint.js';

export function buildBoard({ aniso = 8, mobile = false } = {}) {
  const root = new Group();
  const leds = [];
  const tex = (canvas, srgb = true) => {
    const t = new CanvasTexture(canvas);
    if (srgb) t.colorSpace = SRGBColorSpace;
    t.anisotropy = aniso; t.needsUpdate = true;
    return t;
  };
  const shadow = (m, cast = true, receive = true) => { m.castShadow = cast; m.receiveShadow = receive; return m; };
  const add = (m, parent = root) => { parent.add(m); return m; };

  // ---------- materials ----------
  const metal = (color, rough = 0.3, extra = {}) => new MeshStandardMaterial({ color, metalness: 1, roughness: rough, ...extra });
  const mat = {
    gold: metal(0xd8b15a, 0.28),
    tin: metal(0xcfd1d6, 0.3),
    steel: metal(0xb9bcc2, 0.38),
    brass: metal(0xc79a3a, 0.35),
    plastic: new MeshPhysicalMaterial({ color: 0x141418, roughness: 0.5, clearcoat: 0.15, clearcoatRoughness: 0.5 }),
    epoxy: new MeshStandardMaterial({ color: 0x17171b, roughness: 0.62 }),
    blue: new MeshPhysicalMaterial({ color: 0x1346b8, roughness: 0.4, clearcoat: 0.4, clearcoatRoughness: 0.35 }),
    fr4: new MeshStandardMaterial({ color: 0x7a6a3a, roughness: 0.85 }),
    underside: new MeshStandardMaterial({ color: 0x2a0709, roughness: 0.6 }),
  };

  // ---------- PCB ----------
  const { colour, hrm } = paintBoard(mobile ? { colourPx: 2560, hrmPx: 1536 } : { colourPx: 4096, hrmPx: 2048 });
  const map = tex(colour), hr = tex(hrm, false);
  const boardTop = new MeshPhysicalMaterial({
    map, roughnessMap: hr, metalnessMap: hr, bumpMap: hr, bumpScale: 2.2, roughness: 1, metalness: 1,
    clearcoat: 0.18, clearcoatRoughness: 0.4,
  });
  const boardGeo = new BoxGeometry(BW, BT, BD);
  const board = new Mesh(boardGeo, [mat.fr4, mat.fr4, boardTop, mat.underside, mat.fr4, mat.fr4]);
  shadow(board); add(board);

  // brass standoffs (hex) + screws under / over the mounting holes
  P.holes.forEach(([x, z]) => {
    const so = shadow(new Mesh(new CylinderGeometry(0.16, 0.16, 0.5, 6), mat.brass)); so.position.set(x, -BT / 2 - 0.25, z); add(so);
    const sc = shadow(new Mesh(new CylinderGeometry(0.17, 0.17, 0.06, 28), mat.steel)); sc.position.set(x, TOP + 0.03, z); add(sc);
    const slot = new Mesh(new BoxGeometry(0.22, 0.012, 0.035), new MeshStandardMaterial({ color: 0x1a1a1d, roughness: 0.8 })); slot.position.set(x, TOP + 0.066, z); slot.rotation.y = x > 0 ? 0.5 : -0.3; add(slot);
  });

  // ---------- ESP32-style module ----------
  {
    const g = new Group(); g.position.set(P.esp.x, TOP, P.esp.z); add(g);
    const sub = shadow(new Mesh(new BoxGeometry(P.esp.w, 0.06, P.esp.d), [mat.epoxy, mat.epoxy, new MeshStandardMaterial({ color: 0xffffff, map: tex(espAntennaTexture()), roughness: 0.45 }), mat.epoxy, mat.epoxy, mat.epoxy]));
    sub.position.y = 0.04; g.add(sub);
    const shieldMat = new MeshStandardMaterial({ map: tex(shieldTexture()), metalness: 1, roughness: 0.34 });
    const shieldGeo = new RoundedBoxGeometry(1.56, 0.2, 1.5, 3, 0.03);
    const shield = shadow(new Mesh(shieldGeo, shieldMat)); shield.position.set(0, 0.17, P.esp.d / 2 - 0.82); g.add(shield);
    // fix texture orientation on the top face of the rounded box by rotating UVs is unnecessary: map reads fine from the +z side
    // castellated edge pads
    const pad = new BoxGeometry(0.1, 0.045, 0.05);
    const pads = new InstancedMesh(pad, mat.gold, 14 * 2 + 8);
    const m = new Matrix4(); let n = 0;
    for (let i = 0; i < 14; i++) for (const s of [-1, 1]) { m.makeTranslation(s * (P.esp.w / 2 - 0.02), 0.075, -0.35 + i * 0.09 - 0.0 + 0.0); pads.setMatrixAt(n++, m); }
    for (let i = 0; i < 8; i++) { m.makeTranslation(-0.4 + i * 0.1, 0.075, P.esp.d / 2 - 0.02); pads.setMatrixAt(n++, m); }
    pads.position.z = 0; pads.castShadow = false; g.add(pads);
    // pads were authored relative to board z; shift so they line up with the texture rows
    pads.position.z = 0;
    // small can on the module (RF)
    const rf = shadow(new Mesh(new BoxGeometry(0.28, 0.07, 0.28), mat.steel)); rf.position.set(-0.55, 0.1, -0.52); g.add(rf);
  }

  // ---------- QFP microcontroller ----------
  {
    const s = P.qfp.s, half = s / 2;
    const g = new Group(); g.position.set(P.qfp.x, TOP, P.qfp.z); add(g);
    const top = new MeshPhysicalMaterial({ map: tex(chipLabel([{ t: 'iSE-MCU64', size: 52 }, { t: 'ARM CORTEX-M4', size: 34 }, { t: '2026  ISE', size: 30 }, { t: 'TW 2608 A', size: 28 }])), roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.45 });
    const body = shadow(new Mesh(new RoundedBoxGeometry(s, 0.16, s, 2, 0.03), [mat.epoxy, mat.epoxy, top, mat.epoxy, mat.epoxy, mat.epoxy]));
    // rounded box has per-face groups; fall back to a single material if groups are missing
    if (!body.geometry.groups.length) body.material = top;
    body.position.y = 0.1; g.add(body);
    // gull-wing leads
    const n = P.qfp.perSide, count = n * 4;
    const lead = new BoxGeometry(0.045, 0.022, 0.22);
    const leads = new InstancedMesh(lead, mat.tin, count);
    const dum = new Object3D(); let k = 0;
    for (let side = 0; side < 4; side++) for (let i = 0; i < n; i++) {
      const o = (i - (n - 1) / 2) * P.qfp.pitch;
      dum.rotation.set(0, side < 2 ? 0 : Math.PI / 2, 0);
      const d = half + 0.07;
      dum.position.set(side === 2 ? -d : side === 3 ? d : o, 0.04, side === 0 ? -d : side === 1 ? d : o);
      dum.updateMatrix(); leads.setMatrixAt(k++, dum.matrix);
    }
    leads.castShadow = true; g.add(leads);
  }

  // ---------- SOIC-8 ----------
  P.soic.forEach((s, idx) => {
    const g = new Group(); g.position.set(s.x, TOP, s.z); add(g);
    const top = new MeshStandardMaterial({ map: tex(chipLabel([{ t: `ISE${idx + 3}25`, size: 78 }, { t: 'F26', size: 60 }], { size: 256 })), roughness: 0.55 });
    const b = shadow(new Mesh(new BoxGeometry(0.62, 0.1, 0.38), [mat.epoxy, mat.epoxy, top, mat.epoxy, mat.epoxy, mat.epoxy])); b.position.y = 0.07; g.add(b);
    const lead = new BoxGeometry(0.06, 0.02, 0.2);
    const ls = new InstancedMesh(lead, mat.tin, 8);
    const dm = new Object3D(); let q = 0;
    for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) { dm.position.set(-0.21 + i * 0.14, 0.025, sd * 0.25); dm.updateMatrix(); ls.setMatrixAt(q++, dm.matrix); }
    g.add(ls);
  });

  // ---------- TO-220 regulators ----------
  P.to220.forEach((t) => {
    const g = new Group(); g.position.set(t.x, TOP, t.z); add(g);
    const label = new MeshStandardMaterial({ map: tex(chipLabel([{ t: 'LM7805', size: 76 }, { t: '5V 1A', size: 54 }], { size: 256, dot: false })), roughness: 0.55 });
    const body = shadow(new Mesh(new BoxGeometry(0.62, 0.56, 0.2), [mat.epoxy, mat.epoxy, mat.epoxy, mat.epoxy, label, mat.epoxy]));
    body.position.set(0, 0.4, 0); g.add(body);
    const tab = shadow(new Mesh(new BoxGeometry(0.62, 0.34, 0.045), mat.steel)); tab.position.set(0, 0.85, -0.085); g.add(tab);
    const hole = new Mesh(new CylinderGeometry(0.075, 0.075, 0.05, 20), new MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.9 })); hole.rotation.x = Math.PI / 2; hole.position.set(0, 0.9, -0.085); g.add(hole);
    for (let k = -1; k <= 1; k++) {
      // leads drop from the body, then run flat to the pads
      const drop = shadow(new Mesh(new BoxGeometry(0.05, 0.1, 0.022), mat.tin)); drop.position.set(k * 0.2, 0.17, 0.0); g.add(drop);
      const foot = shadow(new Mesh(new BoxGeometry(0.05, 0.022, 0.5), mat.tin)); foot.position.set(k * 0.2, 0.034, 0.24); g.add(foot);
    }
  });

  // ---------- electrolytic capacitors ----------
  P.caps.forEach((c, i) => {
    const g = new Group(); g.position.set(c.x, TOP, c.z); add(g);
    const sl = sleeveTexture(i === 1 ? '#201a0e' : '#0f1320', i === 1 ? '#d7b04a' : '#c8ccd4'); const st = new CanvasTexture(sl); st.colorSpace = SRGBColorSpace; st.anisotropy = aniso;
    const side = new MeshPhysicalMaterial({ map: st, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 });
    const body = shadow(new Mesh(new CylinderGeometry(c.r, c.r, c.h - 0.08, 64, 1, true), side)); body.position.y = c.h / 2 + 0.01; g.add(body);
    const topA = new CanvasTexture(capTopTexture()); topA.colorSpace = SRGBColorSpace; topA.anisotropy = aniso;
    const cap = shadow(new Mesh(new CylinderGeometry(c.r * 0.97, c.r * 0.97, 0.07, 64), [new MeshStandardMaterial({ color: 0x9a9fa8, metalness: 1, roughness: 0.4 }), new MeshStandardMaterial({ map: topA, metalness: 1, roughness: 0.38 }), new MeshStandardMaterial({ color: 0x101012 })]));
    cap.position.y = c.h - 0.02; g.add(cap);
    const lip = shadow(new Mesh(new TorusGeometry(c.r * 0.97, 0.018, 12, 64), mat.steel)); lip.rotation.x = Math.PI / 2; lip.position.y = c.h - 0.055; g.add(lip);
    const base = shadow(new Mesh(new CylinderGeometry(c.r * 1.02, c.r * 1.02, 0.06, 64), new MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.7 }))); base.position.y = 0.04; g.add(base);
  });

  // ---------- headers ----------
  [P.hdrA, P.hdrB].forEach((h) => {
    const g = new Group(); g.position.set(h.x, TOP, h.z); add(g);
    const w = h.n * h.pitch;
    const base = shadow(new Mesh(new BoxGeometry(w, 0.24, 0.26), mat.plastic)); base.position.y = 0.12; g.add(base);
    const pin = new BoxGeometry(0.058, 0.62, 0.058);
    const pins = new InstancedMesh(pin, mat.gold, h.n);
    const dm = new Object3D();
    for (let i = 0; i < h.n; i++) { dm.position.set((i - (h.n - 1) / 2) * h.pitch, 0.3, 0); dm.updateMatrix(); pins.setMatrixAt(i, dm.matrix); }
    pins.castShadow = true; g.add(pins);
    // chamfered pin tips
    const tip = new CylinderGeometry(0.004, 0.04, 0.05, 4);
    const tips = new InstancedMesh(tip, mat.gold, h.n);
    for (let i = 0; i < h.n; i++) { dm.position.set((i - (h.n - 1) / 2) * h.pitch, 0.635, 0); dm.rotation.y = Math.PI / 4; dm.updateMatrix(); tips.setMatrixAt(i, dm.matrix); }
    g.add(tips);
  });

  // ---------- USB-C ----------
  {
    const u = P.usb; const g = new Group(); g.position.set(u.x, TOP, u.z); add(g);
    const shell = shadow(new Mesh(new RoundedBoxGeometry(u.w, 0.32, u.d, 4, 0.08), mat.steel)); shell.position.y = 0.17; g.add(shell);
    const mouth = new Mesh(new RoundedBoxGeometry(u.w - 0.14, 0.17, 0.06, 3, 0.07), new MeshStandardMaterial({ color: 0x050506, roughness: 0.9 })); mouth.position.set(0, 0.17, u.d / 2 + 0.002); g.add(mouth);
    const tongue = new Mesh(new BoxGeometry(u.w - 0.3, 0.045, 0.1), new MeshStandardMaterial({ color: 0x1b1b1f, roughness: 0.7 })); tongue.position.set(0, 0.17, u.d / 2 - 0.04); g.add(tongue);
    for (let i = 0; i < 12; i++) { const pn = new Mesh(new BoxGeometry(0.028, 0.012, 0.07), mat.gold); pn.position.set(-0.28 + i * 0.051, 0.196, u.d / 2 - 0.02); g.add(pn); }
  }

  // ---------- screw terminal ----------
  {
    const t = P.terminal; const g = new Group(); g.position.set(t.x, TOP, t.z); add(g);
    const body = shadow(new Mesh(new RoundedBoxGeometry(t.w, 0.52, t.d, 3, 0.03), mat.blue)); body.position.y = 0.27; g.add(body);
    for (let i = 0; i < 2; i++) {
      const cx = -0.25 + i * 0.5;
      const well = new Mesh(new CylinderGeometry(0.17, 0.17, 0.04, 28), new MeshStandardMaterial({ color: 0x0a2a78, roughness: 0.5 })); well.position.set(cx, 0.52, 0.05); g.add(well);
      const screw = shadow(new Mesh(new CylinderGeometry(0.13, 0.13, 0.07, 28), mat.steel)); screw.position.set(cx, 0.55, 0.05); g.add(screw);
      const slot = new Mesh(new BoxGeometry(0.2, 0.02, 0.035), new MeshStandardMaterial({ color: 0x222226, roughness: 0.8 })); slot.position.set(cx, 0.592, 0.05); slot.rotation.y = 0.5 + i; g.add(slot);
      const entry = new Mesh(new BoxGeometry(0.32, 0.26, 0.04), new MeshStandardMaterial({ color: 0x050a1a, roughness: 0.9 })); entry.position.set(cx, 0.26, t.d / 2 + 0.002); g.add(entry);
    }
  }

  // ---------- inductors + crystal ----------
  P.inductors.forEach((l) => {
    const g = new Group(); g.position.set(l.x, TOP, l.z); add(g);
    const b = shadow(new Mesh(new RoundedBoxGeometry(l.s, 0.3, l.s, 3, 0.04), new MeshStandardMaterial({ color: 0x232328, roughness: 0.65, metalness: 0.4 }))); b.position.y = 0.17; g.add(b);
    for (const sd of [-1, 1]) { const e = shadow(new Mesh(new BoxGeometry(0.1, 0.07, l.s * 0.74), mat.tin)); e.position.set(sd * (l.s / 2 - 0.0), 0.05, 0); g.add(e); }
    const mark = new Mesh(new CircleGeometry(0.06, 20), new MeshStandardMaterial({ color: 0xcfcfd4, roughness: 0.6 })); mark.rotation.x = -Math.PI / 2; mark.position.set(-l.s * 0.3, 0.322, -l.s * 0.3); g.add(mark);
  });
  {
    const y = P.crystal; const g = new Group(); g.position.set(y.x, TOP, y.z); add(g);
    const can = shadow(new Mesh(new RoundedBoxGeometry(y.w, 0.28, y.d, 4, 0.1), new MeshStandardMaterial({ color: 0xcfd2d8, metalness: 1, roughness: 0.28 }))); can.position.y = 0.19; g.add(can);
    for (const sd of [-1, 1]) { const f = shadow(new Mesh(new BoxGeometry(0.12, 0.05, 0.22), mat.tin)); f.position.set(sd * (y.w / 2 + 0.01), 0.035, 0); g.add(f); }
  }

  // ---------- LEDs ----------
  P.leds.forEach((l) => {
    const g = new Group(); g.position.set(l.x, TOP, l.z); add(g);
    const base = shadow(new Mesh(new BoxGeometry(0.34, 0.05, 0.16), new MeshStandardMaterial({ color: 0xe9e4d6, roughness: 0.6 }))); base.position.y = 0.03; g.add(base);
    const col = new Color(l.color);
    const lens = new Mesh(new SphereGeometry(0.08, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), new MeshStandardMaterial({ color: col.clone().multiplyScalar(0.5), emissive: col, emissiveIntensity: 2.2, roughness: 0.25 }));
    lens.scale.set(1.4, 0.8, 1); lens.position.y = 0.055; g.add(lens);
    leds.push(lens);
  });

  // ---------- SMD passives (instanced) ----------
  {
    const list = buildPassives();
    const res = list.filter((c) => c.kind === 'res'), cap = list.filter((c) => c.kind === 'cap');
    const mk = (items, bodyMat) => {
      const bodyGeo = new BoxGeometry(0.2, 0.075, 0.1), endGeo = new BoxGeometry(0.036, 0.082, 0.104);
      const bodies = new InstancedMesh(bodyGeo, bodyMat, items.length);
      const ends = new InstancedMesh(endGeo, mat.tin, items.length * 2);
      const o = new Object3D(); let e = 0;
      items.forEach((c, i) => {
        o.position.set(c.x, TOP + 0.0375, c.z); o.rotation.set(0, c.rot ? Math.PI / 2 : 0, 0); o.updateMatrix(); bodies.setMatrixAt(i, o.matrix);
        for (const sd of [-1, 1]) {
          o.position.set(c.x + (c.rot ? 0 : sd * 0.082), TOP + 0.0415, c.z + (c.rot ? sd * 0.082 : 0)); o.updateMatrix(); ends.setMatrixAt(e++, o.matrix);
        }
      });
      bodies.castShadow = ends.castShadow = true; bodies.receiveShadow = true;
      add(bodies); add(ends);
    };
    mk(res, new MeshStandardMaterial({ color: 0x111113, roughness: 0.55 }));
    mk(cap, new MeshStandardMaterial({ color: 0x9c7a4e, roughness: 0.5 }));
  }

  return { group: root, leds, board };
}
