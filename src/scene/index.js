// Photorealistic 3D backdrop: a procedurally built PCB lit with image-based lighting,
// soft shadows, ACES tone mapping and bloom. The camera flies over the board as the page
// scrolls. Built into site/assets/js/scene3d.js with `npm run build:scene`.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, FogExp2, PMREMGenerator, DirectionalLight, SpotLight, Mesh, PlaneGeometry,
  MeshStandardMaterial, Vector3, CatmullRomCurve3, ACESFilmicToneMapping, SRGBColorSpace,
  Sprite, SpriteMaterial, CanvasTexture, AdditiveBlending, WebGLRenderTarget, HalfFloatType, Vector2, MathUtils,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { buildBoard } from './parts.js';
import { BT, mulberry32 } from './layout.js';

// Camera stations (position, target), spread evenly down the page.
const STATIONS = [
  [[-0.8, 10.4, 12.6], [0.0, -0.2, 0.5]],   // hero: whole board
  [[3.4, 3.2, 4.4], [1.3, 0.15, -0.4]],    // wireless module
  [[-5.0, 2.5, 3.4], [-2.7, 0.1, 0.1]],    // microcontroller
  [[5.9, 2.0, 3.4], [3.9, 0.3, 0.6]],      // capacitors + terminal
  [[-0.4, 10.8, 2.2], [0.0, 0.0, 0.0]],    // top-down
  [[-6.2, 1.5, -0.6], [-4.3, 0.45, -1.4]], // regulators
  [[1.6, 6.6, 8.2], [0.0, 0.0, 0.2]],      // pull back
];

const lerp = MathUtils.lerp;
const smooth = (t) => t * t * (3 - 2 * t);

function glowSprite() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.7, 'rgba(255,255,255,.55)'); gr.addColorStop(0.9, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 64, 0, Math.PI * 2); g.fill();
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}

export function startScene(canvas) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 640;
  const dprCap = mobile ? 1.5 : 2;

  const renderer = new WebGLRenderer({ canvas, antialias: mobile, powerPreference: 'high-performance' });
  renderer.setClearColor(0x070304, 1);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false; // the board is static; shadows are rendered once
  let dpr = Math.min(devicePixelRatio || 1, dprCap);
  renderer.setPixelRatio(dpr);

  const scene = new Scene();
  scene.background = new Color(0x070304);
  scene.fog = new FogExp2(0x070304, 0.022);

  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.42;

  const camera = new PerspectiveCamera(36, 1, 0.1, 120);

  // lights: warm key with soft shadow, orange rim from behind, cool kicker
  const key = new DirectionalLight(0xffcfa8, 2.3);
  key.position.set(6, 10, 7);
  key.castShadow = true;
  const ss = mobile ? 1024 : 2048;
  key.shadow.mapSize.set(ss, ss);
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 2, far: 30 });
  key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
  scene.add(key);
  const rim = new SpotLight(0xff6a2a, 110, 40, 0.7, 0.9, 1.4);
  rim.position.set(-8, 5, -7); rim.target.position.set(0, 0, 0); scene.add(rim, rim.target);
  const kick = new DirectionalLight(0x86a9ff, 0.55); kick.position.set(-7, 4, 6); scene.add(kick);

  // floor: dark, slightly glossy, so the board appears to sit on a studio surface
  const floor = new Mesh(new PlaneGeometry(160, 160), new MeshStandardMaterial({ color: 0x0d0709, roughness: 0.3, metalness: 0.15 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -BT / 2 - 0.5; floor.receiveShadow = true; scene.add(floor);

  const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy(), mobile ? 4 : 16);
  const { group: board, leds } = buildBoard({ aniso: maxAniso, mobile });
  scene.add(board);

  // out-of-focus bokeh discs for depth
  const bokehTex = glowSprite();
  const rnd = mulberry32(21);
  const bokeh = [];
  const nBokeh = mobile ? 10 : 26;
  for (let i = 0; i < nBokeh; i++) {
    const m = new SpriteMaterial({ map: bokehTex, color: rnd() < 0.7 ? 0xff7a35 : 0xffc9a0, transparent: true, opacity: 0.03 + rnd() * 0.06, blending: AdditiveBlending, depthWrite: false, fog: false });
    const s = new Sprite(m);
    s.position.set((rnd() - 0.5) * 30, 0.5 + rnd() * 9, (rnd() - 0.5) * 20);
    s.scale.setScalar(0.5 + rnd() * 1.8);
    s.userData = { speed: 0.05 + rnd() * 0.12, phase: rnd() * 6.28, base: s.position.clone() };
    scene.add(s); bokeh.push(s);
  }

  // post: MSAA HDR target -> bloom -> tone map
  let composer = null, bloom = null;
  function makeComposer() {
    const rt = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new Vector2(1, 1), 0.22, 0.6, 1.15);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }
  if (!mobile) makeComposer();

  // ---- camera path ----
  const posCurve = new CatmullRomCurve3(STATIONS.map((s) => new Vector3(...s[0])), false, 'centripetal');
  const tgtCurve = new CatmullRomCurve3(STATIONS.map((s) => new Vector3(...s[1])), false, 'centripetal');
  const pos = new Vector3(), tgt = new Vector3();

  let W = 0, H = 0;
  function resize() {
    const w = innerWidth, h = innerHeight;
    if (w === W && Math.abs(h - H) < 150) return;
    W = w; H = h;
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    composer?.setPixelRatio(dpr); composer?.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    need = true;
  }

  let progress = 0, shown = 0, need = true;
  // Pages can mark "scene windows" with data-station="n": when such an element is centred in the
  // viewport the camera sits at station n. Without any, progress is plain scroll position.
  function readScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const y = scrollY;
    const last = STATIONS.length - 1;
    const keys = [...document.querySelectorAll('[data-station]')].map((el) => {
      const r = el.getBoundingClientRect();
      return { y: y + r.top + r.height / 2 - innerHeight / 2, s: Number(el.dataset.station) };
    }).sort((a, b) => a.y - b.y);
    if (!keys.length) {
      progress = MathUtils.clamp(y / max, 0, 1);
    } else {
      keys.unshift({ y: 0, s: 0 }); keys.push({ y: Math.max(max, keys[keys.length - 1].y + 1), s: last });
      let i = 0; while (i < keys.length - 2 && y > keys[i + 1].y) i++;
      const a = keys[i], b = keys[i + 1];
      const f = MathUtils.clamp((y - a.y) / Math.max(1, b.y - a.y), 0, 1);
      progress = lerp(a.s, b.s, smooth(f)) / last;
    }
    need = true;
  }
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', () => { resize(); readScroll(); });

  let px = 0, py = 0, cx = 0, cy = 0;
  if (!reduceMotion) {
    addEventListener('pointermove', (e) => { px = (e.clientX / innerWidth - 0.5) * 2; py = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  }

  function aim(t) {
    // t = smoothed progress. Offset the pointer parallax a little and shift the board right in the hero on wide screens.
    posCurve.getPoint(t, pos); tgtCurve.getPoint(t, tgt);
    pos.x += cx * 0.35; pos.y += -cy * 0.2;
    camera.position.copy(pos); camera.lookAt(tgt);
    const wide = W > 900;
    const shift = wide ? W * 0.15 * (1 - smooth(MathUtils.clamp(t / 0.1, 0, 1))) : 0;
    if (shift > 0.5) camera.setViewOffset(W, H, -shift, 0, W, H); else camera.clearViewOffset();
  }

  // ---- loop ----
  const clock = { last: performance.now(), t: 0 };
  let slow = 0, tier = 0, running = false, firstFrame = null;
  const ready = new Promise((r) => { firstFrame = r; });
  let framesRendered = 0;

  function degrade() {
    tier++;
    if (tier === 1) { dpr = 1; W = 0; resize(); }
    else if (tier === 2) { composer = null; renderer.setPixelRatio(1); }
    else if (tier === 3) { stop(); }
  }

  let lastRead = 0;
  function frame(now) {
    if (now - lastRead > 350) { lastRead = now; readScroll(); } // layout settles after load (images, fetched projects, scene windows)
    const dt = Math.min((now - clock.last) / 1000, 0.1); clock.last = now; clock.t += dt;
    // adaptive quality
    if (framesRendered > 30) { if (dt > 0.036) slow++; else slow = Math.max(0, slow - 1); if (slow > 60) { slow = 0; degrade(); } }

    if (reduceMotion) { shown = progress; cx = px; cy = py; }
    else { const k = 1 - Math.exp(-dt * 4.5); shown += (progress - shown) * k; cx += (px - cx) * k; cy += (py - cy) * k; }
    aim(shown);

    leds.forEach((l, i) => { l.material.emissiveIntensity = 1.6 + Math.sin(clock.t * (1.1 + i * 0.37) + i * 1.7) * 0.9 + (i === 1 ? 0.6 : 0); });
    if (!reduceMotion) bokeh.forEach((s) => { const u = s.userData; s.position.set(u.base.x + Math.sin(clock.t * u.speed + u.phase) * 0.8, u.base.y + Math.cos(clock.t * u.speed * 0.8 + u.phase) * 0.5, u.base.z); });

    if (composer) composer.render(dt); else renderer.render(scene, camera);
    framesRendered++;
    if (framesRendered === 2) firstFrame();
  }

  function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);
    if (document.hidden) { clock.last = now; return; }
    if (reduceMotion && !need && Math.abs(progress - shown) < 1e-4) return;
    need = false;
    frame(now);
  }
  function start() { if (running) return; running = true; clock.last = performance.now(); requestAnimationFrame(loop); }
  function stop() { running = false; }

  resize(); readScroll(); shown = progress;
  // render the shadow map once, then keep it
  renderer.shadowMap.needsUpdate = true;
  start();

  return { ready, stop, start, get tier() { return tier; } };
}
