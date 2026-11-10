// 3D hero: a slowly turning circuit board with chips, copper traces and glowing
// signal pulses travelling along them. Uses the global THREE from three.js r128.
// Falls back to the CSS background when WebGL, the library, or motion is unavailable.

const canvas = document.querySelector('.hero__canvas');
const THREE = window.THREE;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

if (canvas && THREE && webglAvailable()) init();

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,230,190,1)');
  grad.addColorStop(0.25, 'rgba(255,140,50,0.9)');
  grad.addColorStop(1, 'rgba(255,80,20,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x12070a, 0.045);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

  scene.add(new THREE.AmbientLight(0xffd9c4, 0.35));
  const key = new THREE.PointLight(0xff7a2a, 2.2, 30);
  key.position.set(3, 6, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffb27a, 0.6);
  rim.position.set(-5, 4, -3);
  scene.add(rim);

  // Board
  const rig = new THREE.Group();
  scene.add(rig);
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.16, 7),
    new THREE.MeshStandardMaterial({ color: 0x2a0b10, roughness: 0.55, metalness: 0.25 })
  );
  rig.add(board);
  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(board.geometry),
    new THREE.LineBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: 0.55 })
  );
  rig.add(edge);

  const TOP = 0.09;
  const chipMat = new THREE.MeshStandardMaterial({ color: 0x141014, roughness: 0.35, metalness: 0.6 });
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.3, metalness: 0.9 });

  function chip(x, z, w, d, h = 0.22) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), chipMat);
    body.position.y = TOP + h / 2;
    g.add(body);
    const pins = Math.max(2, Math.round(w / 0.28));
    const pinGeo = new THREE.BoxGeometry(0.08, 0.04, 0.18);
    for (let i = 0; i < pins; i++) {
      const px = -w / 2 + (i + 0.5) * (w / pins);
      for (const s of [-1, 1]) {
        const p = new THREE.Mesh(pinGeo, pinMat);
        p.position.set(px, TOP + 0.03, s * (d / 2 + 0.08));
        g.add(p);
      }
    }
    g.position.set(x, 0, z);
    rig.add(g);
    return { x, z, w, d };
  }

  const mcu = chip(0.3, 0, 1.6, 1.6, 0.26);
  const chips = [
    chip(-3.2, -1.8, 1.1, 0.7),
    chip(-3.4, 1.6, 0.9, 0.6),
    chip(3.4, -2.0, 1.2, 0.8),
    chip(3.6, 1.9, 0.8, 0.5),
    chip(-0.8, 2.5, 0.7, 0.45),
    chip(1.6, -2.6, 0.7, 0.45),
  ];

  // Capacitors
  const capMat = new THREE.MeshStandardMaterial({ color: 0x3a3f4a, roughness: 0.4, metalness: 0.7 });
  [[-1.8, 0.2], [2.2, 0.9], [-2.0, -0.9], [4.2, -0.2], [-4.3, 0]].forEach(([x, z]) => {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.4, 20), capMat);
    cap.position.set(x, TOP + 0.2, z);
    rig.add(cap);
  });

  // Traces: Manhattan routes from each chip to the MCU
  const traceMat = new THREE.LineBasicMaterial({ color: 0xff8a3d, transparent: true, opacity: 0.75 });
  const routes = [];
  const y = TOP + 0.005;
  chips.forEach((c, i) => {
    const lanes = 3;
    for (let k = 0; k < lanes; k++) {
      const off = (k - 1) * 0.22;
      const sx = c.x + (c.x < mcu.x ? c.w / 2 : -c.w / 2);
      const sz = c.z + off;
      const ex = mcu.x + (c.x < mcu.x ? -mcu.w / 2 : mcu.w / 2);
      const ez = mcu.z + off * 0.8 + (i % 3 - 1) * 0.25;
      const midX = (sx + ex) / 2 + (k - 1) * 0.18;
      const pts = [
        new THREE.Vector3(sx, y, sz),
        new THREE.Vector3(midX, y, sz),
        new THREE.Vector3(midX, y, ez),
        new THREE.Vector3(ex, y, ez),
      ];
      rig.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), traceMat));
      routes.push(pts);
    }
  });
  // Decorative bus lines along the board edges
  for (let i = 0; i < 6; i++) {
    const zz = -3.2 + i * 0.12;
    const pts = [new THREE.Vector3(-4.6, y, zz), new THREE.Vector3(4.6, y, zz)];
    rig.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), traceMat));
    routes.push(pts);
  }

  // Via pads
  const viaGeo = new THREE.CircleGeometry(0.06, 12);
  const viaMat = new THREE.MeshBasicMaterial({ color: 0xffb070 });
  routes.forEach((pts) => {
    [pts[0], pts[pts.length - 1]].forEach((p) => {
      const v = new THREE.Mesh(viaGeo, viaMat);
      v.rotation.x = -Math.PI / 2;
      v.position.set(p.x, y + 0.002, p.z);
      rig.add(v);
    });
  });

  // Signal pulses
  const tex = glowTexture();
  const pulseMat = new THREE.SpriteMaterial({ map: tex, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const pulses = routes.map((pts, i) => {
    const s = new THREE.Sprite(pulseMat);
    s.scale.setScalar(0.32);
    rig.add(s);
    const lens = [];
    let total = 0;
    for (let j = 1; j < pts.length; j++) { const l = pts[j].distanceTo(pts[j - 1]); lens.push(l); total += l; }
    return { s, pts, lens, total, t: Math.random(), speed: 0.12 + (i % 5) * 0.03 };
  });
  function place(p) {
    let d = p.t * p.total;
    for (let j = 0; j < p.lens.length; j++) {
      if (d <= p.lens[j]) { p.s.position.lerpVectors(p.pts[j], p.pts[j + 1], d / p.lens[j]); p.s.position.y += 0.05; return; }
      d -= p.lens[j];
    }
  }

  // MCU glow
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xff6a1a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  core.position.set(mcu.x, TOP + 0.6, mcu.z);
  core.scale.setScalar(2.4);
  rig.add(core);

  // Floating particles
  const N = 260;
  const ppos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    ppos[i * 3] = (Math.random() - 0.5) * 24;
    ppos[i * 3 + 1] = Math.random() * 8 - 1;
    ppos[i * 3 + 2] = (Math.random() - 0.5) * 18;
  }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
  const particles = new THREE.Points(pgeo, new THREE.PointsMaterial({ size: 0.06, color: 0xffa060, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(particles);

  // Layout: board on the right on wide screens, centred behind text on narrow ones
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const wide = w > 900;
    camera.position.set(wide ? -3.2 : 0, wide ? 7.5 : 9.5, wide ? 9.5 : 11.5);
    camera.lookAt(wide ? -3.2 : 0, 0, 0);
    rig.position.set(wide ? 1.2 : 0, 0, wide ? 0 : -1);
    camera.updateProjectionMatrix();
    if (reduceMotion) renderer.render(scene, camera);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  // Pointer parallax
  let tx = 0, ty = 0, cx = 0, cy = 0;
  window.addEventListener('pointermove', (e) => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // Only animate while visible
  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) loop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });

  const clock = new THREE.Clock();
  let running = false;
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    cx += (tx - cx) * 0.05;
    cy += (ty - cy) * 0.05;
    rig.rotation.y = -0.35 + Math.sin(t * 0.15) * 0.25 + cx * 0.25;
    rig.rotation.x = 0.05 + cy * 0.08;
    rig.position.y = Math.sin(t * 0.6) * 0.08;
    pulses.forEach((p) => { p.t = (p.t + dt * p.speed) % 1; place(p); });
    core.material.opacity = 0.55 + Math.sin(t * 2.2) * 0.2;
    particles.rotation.y = t * 0.02;
    renderer.render(scene, camera);
  }
  function loop() {
    if (running) return;
    running = true;
    clock.getDelta();
    const tick = () => {
      if (!visible || document.hidden) { running = false; return; }
      frame();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  pulses.forEach(place);
  if (reduceMotion) {
    renderer.render(scene, camera); // one still frame, no animation
  } else {
    loop();
  }
  canvas.classList.add('is-ready');
}
