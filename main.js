import { setupExtra } from './extra.js';
import { setupLower } from './lower.js';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HL, HB, HD, DWL, hullGeometry, hullLines, deckGeometry, cabinGeometry, halfBeamAt } from './yacht.js';
import { sheerY } from './hullmath.js';
import { PROJECTS, picture, setupCases } from './cases.js';

gsap.registerPlugin(ScrollTrigger);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const lenis = new Lenis({ lerp: reduced ? 1 : 0.09, smoothWheel: !reduced });
// reduced motion: time-based tweens finish almost instantly, scrubbed sections follow the scrollbar 1:1
if (reduced) { gsap.globalTimeline.timeScale(20); document.documentElement.classList.add('reduced'); }
window.__lenis = lenis;
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

/* ---------- preloader ---------- */
const pctEl = document.getElementById('pct'), barEl = document.getElementById('bar');
const load = { v: 0 };
const setLoad = v => new Promise(res => gsap.to(load, { v, duration: .45, ease: 'power2.out', onComplete: res,
  onUpdate: () => { pctEl.textContent = String(Math.round(load.v)).padStart(3, '0'); barEl.style.width = load.v + '%'; } }));
setLoad(12);
const nextFrame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
const isMob = innerWidth < 760;
// let the loader + page paint first; build the 3D scene in small tasks afterwards
await nextFrame();

/* ---------- helpers ---------- */
const sm = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const clamp01 = x => Math.min(1, Math.max(0, x));
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; }

/* ---------- shared textures ---------- */
const paintTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f4f2ed'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1800; i++) { const v = 228 + Math.random() * 24 | 0; g.fillStyle = `rgba(${v},${v},${v - 4},.35)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
paintTex.wrapS = paintTex.wrapT = THREE.RepeatWrapping;
const teakTex = canvasTex(512, 128, (g, w, h) => { const pw = h / 8;
  for (let k = 0; k < 8; k++) { const v = Math.random() * 18 - 9; g.fillStyle = `rgb(${190 + v | 0},${150 + v | 0},${108 + v | 0})`; g.fillRect(0, k * pw, w, pw);
    for (let i = 0; i < 12; i++) { g.strokeStyle = `rgba(110,75,45,${Math.random() * .22})`; g.beginPath(); const y = k * pw + Math.random() * pw; g.moveTo(0, y); g.bezierCurveTo(w * .3, y + 2, w * .6, y - 2, w, y + 1); g.stroke(); }
    g.fillStyle = '#4a3c30'; g.fillRect(0, k * pw + pw - 1.6, w, 1.6); } });
teakTex.wrapS = teakTex.wrapT = THREE.RepeatWrapping; teakTex.repeat.set(.1, 1);
const groundAlpha = canvasTex(512, 512, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, w * .2, w / 2, h / 2, w / 2); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, false);
const rippleTex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { const x = Math.random() * w, y = Math.random() * h, l = 6 + Math.random() * 22; g.strokeStyle = `rgba(70,110,130,${.06 + Math.random() * .1})`; g.lineWidth = 1 + Math.random(); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 2, x + l, y); g.stroke(); } });
rippleTex.wrapS = rippleTex.wrapT = THREE.RepeatWrapping; rippleTex.repeat.set(6, 6);

/* ---------- material factory ---------- */
function baseMats() {
  const ah = { alphaHash: true, transparent: false, opacity: 1 };
  return {
    paint: new THREE.MeshStandardMaterial({ color: 0xffffff, map: paintTex, roughness: .35, metalness: .05, ...ah }),
    hull: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .3, metalness: .1, side: THREE.DoubleSide, ...ah }),
    teak: new THREE.MeshStandardMaterial({ color: 0xffffff, map: teakTex, roughness: .8, ...ah }),
    wood: new THREE.MeshStandardMaterial({ color: 0xa47a54, roughness: .6, ...ah }),
    metal: new THREE.MeshStandardMaterial({ color: 0xc6cbce, roughness: .25, metalness: .85, ...ah }),
    dark: new THREE.MeshStandardMaterial({ color: 0x23313f, roughness: .4, metalness: .3, ...ah }),
    pier: new THREE.MeshStandardMaterial({ color: 0xd6d1c6, roughness: .95, ...ah }),
    interior: new THREE.MeshStandardMaterial({ color: 0xefeae0, roughness: .85, ...ah }),
    fabric: new THREE.MeshStandardMaterial({ color: 0xdcd0b8, roughness: .95, ...ah }),
    cushion: new THREE.MeshStandardMaterial({ color: 0x46627a, roughness: .95, ...ah }),
    ceiling: new THREE.MeshStandardMaterial({ color: 0xf6f3ec, emissive: 0xffc98a, emissiveIntensity: 0, roughness: .9, ...ah }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x9db6c4, roughness: .04, metalness: .15, transparent: true, opacity: .32, depthWrite: false, envMapIntensity: 1.6, side: THREE.DoubleSide }),
    line: new THREE.LineBasicMaterial({ color: 0x2a5677, transparent: true, opacity: 1, depthWrite: false }),
  };
}

/* ---------- yacht: hull + four decks ---------- */
const FLOORS = [
  { name: 'Hull', sub: 'Engine room · tanks · crew mess', type: 'hull', h: HD, x: 0, w: HL, lx: 10.5, ly: .3, mlx: 4 },
  { name: 'Main deck', sub: 'Saloon · galley · owner suite', type: 'main', h: 2.6, x: -2, w: 15, beam: 6.6, rake: 2.2, louvers: true },
  { name: 'Upper deck', sub: 'Sky lounge · two guest cabins', type: 'upper', h: 2.4, x: -1.5, w: 11, beam: 6, rake: 1.8, louvers: true },
  { name: 'Bridge', sub: 'Wheelhouse · captain cabin', type: 'bridge', h: 2.3, x: .6, w: 6.5, beam: 5.4, rake: 1.6 },
  { name: 'Sun deck', sub: 'Hardtop · spa pool · sun pads', type: 'sun', h: 2.4, x: -.5, w: 8, beam: 5.6 },
];
function box(w, h, d, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; }
function cyl(r, h, mat, x, y, z, seg = 10) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.position.set(x, y, z); return m; }
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };

function buildFloor(F, i) {
  const mats = baseMats(); const g = new THREE.Group(); const louvers = [];
  if (F.type === 'hull') {
    const hull = mesh(hullGeometry(), mats.hull); hull.userData.noEdge = true; g.add(hull);
    const dk = mesh(deckGeometry(), mats.teak, 0, HD + .01, 0); dk.userData.noEdge = true; g.add(dk);
    g.add(box(1.6, .16, 6.8, mats.teak, -HL / 2 - .75, DWL + .5, 0));                         // swim platform
    g.add(box(.9, .42, 4.6, mats.cushion, -HL / 2 + 1.2, HD + .22, 0)); g.add(box(.3, .5, 4.6, mats.cushion, -HL / 2 + .8, HD + .55, 0)); // aft sofa
    g.add(box(1.3, .07, 2.2, mats.wood, -HL / 2 + 2.6, HD + .72, 0)); g.add(box(.18, .7, .18, mats.metal, -HL / 2 + 2.6, HD + .36, 0));
    g.add(box(2.8, .28, 2.8, mats.fabric, 8.6, HD + .15, 0)); g.add(box(.5, .4, 2.8, mats.fabric, 7.4, HD + .35, 0)); // foredeck pad
    g.add(cyl(.28, .35, mats.dark, 12.4, HD + .18, 0, 14));                                      // windlass
    // stanchions + rail tube along the sheer
    const railPts = { 1: [], '-1': [] };
    for (let x = -HL / 2 + .4; x < 13.2; x += 1.5) { const u = (x + HL / 2) / HL, y = sheerY(u); for (const s of [1, -1]) { const z = s * (halfBeamAt(x) - .1);
      const st = box(.04, .9, .04, mats.metal, x, y + .45, z); st.userData.noEdge = true; g.add(st); railPts[s].push(new THREE.Vector3(x, y + .9, z)); } }
    for (const s of [1, -1]) { const t = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts[s]), 60, .03, 5), mats.metal); t.userData.noEdge = true; g.add(t); }
    for (const x of [-12, -4, 4]) for (const s of [1, -1]) g.add(cyl(.07, .18, mats.metal, x, sheerY((x + HL / 2) / HL) + .1, s * (halfBeamAt(x) - .35)));
  } else {
    const { w, beam, h, rake = 0 } = F; const cx = F.x;
    g.add(mesh(cabinGeometry(w + .8, beam + .5, .22, rake * .1), mats.paint, cx, 0, 0));                         // deck slab
    if (F.type !== 'sun') {
      const gh = h - .22 - .22; const gz = .22 + .5;
      g.add(mesh(cabinGeometry(w, beam, .5, rake * .5 / h), mats.paint, cx, .22, 0));                           // painted band
      const gl = mesh(cabinGeometry(w - rake * .2 - .05, beam - .08, gh - .5, rake * (gh - .5) / h), mats.glass, cx - rake * .1, gz, 0); gl.userData.glass = true; g.add(gl);
      g.add(mesh(cabinGeometry(w - rake + .4, beam + .3, .22, 0), mats.paint, cx - rake / 2 + .1, h - .22, 0));  // roof
      const ceil = mesh(new THREE.PlaneGeometry(w - rake - .6, beam - .7), mats.ceiling, cx - rake / 2, h - .24, 0); ceil.rotation.x = Math.PI / 2; ceil.userData.noEdge = true; g.add(ceil);
      for (let x = cx - w / 2 + .5; x < cx + w / 2 - rake - .2; x += 1.6) for (const s of [1, -1]) g.add(box(.06, gh - .5, .06, mats.dark, x, gz + (gh - .5) / 2, s * (beam / 2 - .03)));
      if (F.louvers) for (let x = cx - w / 2 + .5; x < cx + w / 2 - rake - .4; x += .42) { const sh = box(.05, gh - .6, .4, mats.fabric, x, gz + (gh - .5) / 2, beam / 2 + .14); louvers.push(sh); g.add(sh); }
      if (F.type === 'main') {
        g.add(box(.8, .42, 3.2, mats.cushion, cx - 5.6, .45, 1.2)); g.add(box(2.6, .42, .8, mats.cushion, cx - 4.6, .45, 2.5));
        g.add(box(1.4, .38, .9, mats.wood, cx - 4, .42, .7));
        g.add(box(2.4, .06, 1.1, mats.wood, cx - 2.6, .98, -1.6)); for (const dx of [-.8, 0, .8]) for (const s of [-1, 1]) g.add(box(.45, .45, .45, mats.fabric, cx - 2.6 + dx, .45, -1.6 + s * .85));
        g.add(box(2.6, .9, .7, mats.interior, cx + .6, .67, -2.6)); g.add(box(.7, .9, 2, mats.interior, cx + 1.6, .67, -1.4));
        g.add(box(2, .5, 2.2, mats.fabric, cx + 3.6, .47, 0)); g.add(box(.25, 1, 2.2, mats.wood, cx + 2.5, .72, 0));
      }
      if (F.type === 'upper') {
        g.add(box(3, .42, .8, mats.cushion, cx - 2.6, .45, 2)); g.add(box(.8, .42, 2.4, mats.cushion, cx - 4.2, .45, 1));
        g.add(box(1.6, 1, .6, mats.wood, cx - .8, .72, -2.2));
        for (const s of [-1, 1]) g.add(box(1.8, .5, 1.6, mats.fabric, cx + 2.4, .47, s * 1.5));
      }
      if (F.type === 'bridge') {
        const con = mesh(cabinGeometry(1, beam - 1.2, .9, .4), mats.dark, cx + 1.6, .22, 0); g.add(con);
        for (const s of [-1, 0, 1]) g.add(box(.5, .9, .5, mats.cushion, cx + .7, .67, s * 1.2));
        g.add(box(1.4, .8, .9, mats.wood, cx - 2, .62, -1.6));
      }
    } else {
      for (const [x, z] of [[cx - w / 2 + .6, beam / 2 - .4], [cx - w / 2 + .6, -beam / 2 + .4], [cx + w / 2 - 1.6, beam / 2 - .4], [cx + w / 2 - 1.6, -beam / 2 + .4]]) g.add(box(.1, h - .2, .1, mats.metal, x, .22 + (h - .2) / 2, z));
      g.add(box(w - 1, .2, beam - .2, mats.paint, cx - .5, h + .1, 0));                                            // hardtop
      g.add(box(2.4, .3, 3.6, mats.fabric, cx + 2.6, .37, 0));                                                     // sun pads
      g.add(box(2, .55, 2, mats.paint, cx - 2.2, .5, -1.2)); const pool = box(1.7, .02, 1.7, mats.glass, cx - 2.2, .79, -1.2); pool.userData.glass = true; g.add(pool);
      g.add(box(.8, .4, 2.4, mats.cushion, cx - 2.6, .42, 1.4));
      for (const s of [1, -1]) { const p = box(w + .6, .85, .03, mats.glass, cx, .22 + .45, s * (beam / 2 + .2)); p.userData.glass = true; g.add(p); g.add(box(w + .6, .04, .06, mats.metal, cx, .22 + .88, s * (beam / 2 + .2))); }
      g.add(cyl(.08, 2.2, mats.metal, cx + .2, h + 1.3, 0)); g.add(box(.08, .08, 2.4, mats.metal, cx + .2, h + 1.9, 0));
      const dome = mesh(new THREE.SphereGeometry(.42, 18, 12), mats.paint, cx + .2, h + 2.6, 0); g.add(dome);
      g.add(box(1.9, .08, .14, mats.dark, cx - .9, h + .32, 0));
    }
  }
  const lines = new THREE.Group();
  g.traverse(o => { if (o.isMesh) { o.castShadow = !o.userData.glass; o.receiveShadow = true;
    if (o.userData.noEdge) return;
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 30), mats.line);
    e.position.copy(o.position); e.rotation.copy(o.rotation); e.scale.copy(o.scale);
    (o.parent === g ? lines : o.parent).add(e); } });
  if (F.type === 'hull') { lines.add(new THREE.LineSegments(hullLines(), mats.line)); const dl = new THREE.LineSegments(new THREE.EdgesGeometry(deckGeometry()), mats.line); dl.position.y = HD + .02; lines.add(dl); }
  g.add(lines);
  return { g, mats, louvers, F };
}

/* ---------- sea, pier, buoys ---------- */
function buildSite(mats) {
  const g = new THREE.Group();
  const sea = new THREE.Mesh(new THREE.CircleGeometry(70, 72), new THREE.MeshPhysicalMaterial({ color: 0x8fb1be, map: rippleTex, roughness: .22, metalness: .08, clearcoat: .5, alphaMap: groundAlpha, transparent: true, depthWrite: false, envMapIntensity: .7 }));
  sea.rotation.x = -Math.PI / 2; sea.receiveShadow = true; sea.renderOrder = 1; g.add(sea);
  const pz = -8.4;
  g.add(box(44, .3, 3.2, mats.pier, -2, .85, pz));
  for (let x = -23; x <= 19; x += 3) for (const s of [-1.4, 1.4]) g.add(cyl(.16, 2.6, mats.wood, x, -.45, pz + s, 8));
  for (const x of [-12, -1, 9]) g.add(cyl(.17, .4, mats.dark, x, 1.2, pz + 1.35, 12));
  for (let k = 0; k < 14; k++) g.add(box(.05, .03, 3.2, mats.wood, -22 + k * 3.2, 1.01, pz));
  const r = rng(11);
  for (let k = 0; k < 6; k++) { const a = r() * Math.PI * 2, rad = 20 + r() * 12; const b = mesh(new THREE.CylinderGeometry(.25, .4, 1.1, 10), mats.paint, Math.cos(a) * rad, .3, Math.abs(Math.sin(a)) * rad * .6 + 6); g.add(b); }
  return g;
}

/* ---------- main renderer ---------- */
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMob ? 1.25 : 1.5));   // lighter on phones
renderer.setClearColor(0, 0);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = isMob ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
const cam = new THREE.PerspectiveCamera(32, 1, .5, 400);
const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.castShadow = true;
sun.shadow.mapSize.set(isMob ? 1024 : 2048, isMob ? 1024 : 2048); Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 140 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xf1f3f2, 0xa9b8bd, .8); scene.add(hemi);

const world = new THREE.Group(); world.rotation.y = 1.2; scene.add(world);
await nextFrame();
const siteMats = baseMats();
const site = buildSite(siteMats); world.add(site);
const siteLines = new THREE.Group();
site.traverse(o => { if (o.isMesh && o.geometry.type === 'BoxGeometry') { const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry), siteMats.line); e.position.copy(o.position); siteLines.add(e); } });
world.add(siteLines);
const grid = new THREE.GridHelper(80, 80, 0x2a5677, 0x2a5677); grid.material.transparent = true; grid.material.depthWrite = false; grid.position.y = .02; world.add(grid);

const building = new THREE.Group(); world.add(building);
const floors = []; let yAcc = -DWL;
for (const [i, F] of FLOORS.entries()) { const f = buildFloor(F, i); f.base = yAcc; f.g.position.y = yAcc; yAcc += F.h; building.add(f.g); floors.push(f); setLoad(18 + i * 5); await nextFrame(); }
const BH = yAcc;
setLoad(40);

/* labels */
const fl = document.getElementById('flabels');
const labelEls = floors.map((f, i) => { const d = document.createElement('div'); d.className = 'fl'; d.style.setProperty('--len', (60 + (i % 2) * 30) + 'px');
  d.innerHTML = `<i></i><span></span><b>0${i} · ${f.F.name}<small>${f.F.sub}</small></b>`; fl.appendChild(d); return d; });

/* sizing */
let vw = innerWidth, vh = innerHeight, mobile = vw < 760;
function resize() { vw = innerWidth; vh = innerHeight; mobile = vw < 760;
  renderer.setSize(vw, vh, false); cam.aspect = vw / vh; cam.fov = mobile ? 44 : 32;
  if (mobile) cam.setViewOffset(vw, vh, 0, vh * .2, vw, vh); else cam.setViewOffset(vw, vh, -vw * .17, 0, vw, vh);
  cam.updateProjectionMatrix(); }
resize();

/* ---------- scroll triggers ---------- */
const mk = (sel, pin, len) => ScrollTrigger.create({ trigger: sel, pin, start: 'top top', end: () => '+=' + vh * len });
const stA = mk('.drawing', '.pinA', 3.2), stB = mk('.floors', '.pinB', 3), stC = mk('.light', '.pinC', 3);
gsap.to('#gl, #hud', { autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '#work', start: 'top bottom', end: 'top 35%', scrub: true } });
gsap.to('.hero .display, .hero .hero-foot, .hero .hero-meta', { yPercent: -40, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 35%', scrub: true } });

/* ---------- sun model ---------- */
const SUNKEYS = [ // t, hour, elev, color, intensity, hemi, bg1, bg2, label
  [0, 7, .12, '#ffd6b0', 1.4, .55, '#eef0ef', '#e1e7ea', 'Morning'],
  [.45, 13, .95, '#fffaf0', 2.6, .85, '#f1f1ec', '#e3e9e9', 'Midday'],
  [.8, 18.5, .2, '#ffbb80', 2.0, .55, '#f3ece2', '#e6ddd0', 'Golden hour'],
  [1, 20.2, .02, '#a3aed8', .35, .25, '#e5e8ee', '#d3dae3', 'Dusk'],
];
const BLUEPRINT = ['#e8eef3', '#d9e3ec'];
function sunAt(t) { let a = SUNKEYS[0], b = SUNKEYS[1];
  for (let i = 0; i < SUNKEYS.length - 1; i++) if (t >= SUNKEYS[i][0]) { a = SUNKEYS[i]; b = SUNKEYS[i + 1]; }
  const k = sm((t - a[0]) / Math.max(.001, b[0] - a[0]));
  const L = (x, y) => x + (y - x) * k; const C = (x, y) => new THREE.Color(x).lerp(new THREE.Color(y), k);
  return { hour: L(a[1], b[1]), elev: L(a[2], b[2]), color: C(a[3], b[3]), int: L(a[4], b[4]), hemi: L(a[5], b[5]), bg1: C(a[6], b[6]), bg2: C(a[7], b[7]), label: k < .5 ? a[8] : b[8] }; }

/* ---------- state from scroll ---------- */
function target() {
  const pA = stA.progress, pB = stB.progress, pC = stC.progress;
  const s = { build: 1, wire: 1, ex: 0, sun: 0.3, az: .7, el: .3, dist: 58, ty: 4, stage: '01 — Harbour', heroFade: 0 };
  s.dist = 58 - 6 * clamp01(lenis.scroll / vh); // hero dolly
  if (pA > 0 || pB > 0 || pC > 0) {
    s.build = 1 + 4 * sm(pA / .6); s.wire = 1 - sm((pA - .6) / .32);
    s.az = .7 + .4 * pA; s.el = .3 - .03 * pA; s.dist = 57 - 4 * pA; s.ty = 4 + 1.5 * pA; s.stage = pA < .6 ? '02 — Lines' : '02 — Finish';
  }
  if (pB > 0) { s.ex = sm(pB / .3) * (1 - sm((pB - .78) / .2)); s.az = 1.1 + .45 * pB; s.dist = 50 + 36 * s.ex; s.ty = 5.5 + 10 * s.ex; s.stage = '03 — Decks'; }
  if (pC > 0) { s.sun = .3 + .7 * pC; s.az = 1.55 + .5 * pC; s.el = .27 + .06 * Math.sin(pC * Math.PI); s.dist = 50; s.ty = 5.5; s.stage = '04 — Light'; }
  return s;
}
const cur = { build: 1, wire: 1, ex: 0, sun: .3, az: .7, el: .3, dist: 58, ty: 5 };
const hudStage = document.getElementById('hudStage'), hudTime = document.getElementById('hudTime');
const clockTime = document.getElementById('clockTime'), clockLabel = document.getElementById('clockLabel');
const aList = [...document.querySelectorAll('#aList li')];
const rootStyle = document.documentElement.style; const tmp = new THREE.Vector3();
let lastT = 0, intro = { v: 0 }, wob = 0, still = 0, lastScroll = -1, dirty = true;
const workEl = document.getElementById('work');
document.addEventListener('visibilitychange', () => { dirty = true; });
function frame(time) {
  const dt = Math.min(.1, Math.max(.001, time - (lastT || time - .016))); lastT = time;
  if (document.hidden || lenis.scroll > workEl.offsetTop - vh * .6) { dirty = true; return; } // canvas hidden / offscreen
  const T = target(); const k = reduced ? 1 : 1 - Math.pow(.88, dt * 60);
  let d = 0; for (const f in cur) { d = Math.max(d, Math.abs(T[f] - cur[f])); cur[f] += (T[f] - cur[f]) * k; }
  // idle pause: once the scene has settled and nothing scrolls, stop rendering (the slow drift freezes in place)
  const moving = dirty || d > 1e-3 || intro.v < 1 || Math.abs(lenis.scroll - lastScroll) > .5; lastScroll = lenis.scroll; dirty = false;
  still = moving ? 0 : still + dt; if (still > 2.5) return;
  if (!reduced) wob += dt;
  // floors
  floors.forEach((f, i) => {
    const a = clamp01((cur.build - i) * intro.v); const e = sm(a);
    f.g.visible = a > .001;
    f.g.position.y = f.base + (1 - e) * 7 + i * 5.2 * cur.ex;
    f.g.rotation.y = cur.ex * (i % 2 ? .04 : -.04) * i;
    const solid = e * (1 - cur.wire);
    for (const [n, m] of Object.entries(f.mats)) { if (n === 'line') m.opacity = e * cur.wire * .9 + solid * .0; else if (n === 'glass') m.opacity = .32 * solid; else m.opacity = solid; }
    f.g.traverse(o => { if (o.isMesh && !o.userData.glass) o.castShadow = solid > .5; });
    f.mats.line.visible = cur.wire > .01; f.mats.glass.visible = solid > .01;
    // louvers react to sun: close near noon
    const noon = 1 - Math.min(1, Math.abs(sunAt(cur.sun).hour - 13) / 5);
    f.louvers.forEach(l => l.rotation.y = .2 + noon * 1.0);
    const dusk = sm((cur.sun - .82) / .18); f.mats.ceiling.emissiveIntensity = dusk * 2.6;
  });
  const sw = 1 - cur.wire;
  for (const [n, m] of Object.entries(siteMats)) { if (n === 'line') m.opacity = cur.wire * .55; else if (n !== 'glass') m.opacity = sw; }
  site.children[0].material.opacity = .4 + .6 * sw; grid.material.opacity = cur.wire * .18;
  // sun
  const S = sunAt(cur.sun); const ang = (S.hour - 6) / 14 * Math.PI;
  sun.position.set(Math.cos(ang) * -45, 6 + S.elev * 50, 25 + Math.sin(ang) * 10); sun.color.copy(S.color); sun.intensity = S.int;
  hemi.intensity = S.hemi; renderer.toneMappingExposure = .9 + S.hemi * .2;
  const b1 = new THREE.Color(BLUEPRINT[0]).lerp(S.bg1, sw), b2 = new THREE.Color(BLUEPRINT[1]).lerp(S.bg2, sw);
  rootStyle.setProperty('--bg1', '#' + b1.getHexString()); rootStyle.setProperty('--bg2', '#' + b2.getHexString());
  // camera
  const dist = cur.dist * (mobile ? 1.45 + .15 * cur.ex : 1) * (1 + (1 - intro.v) * .25);
  const az = cur.az + (mobile ? .4 : 0) + Math.sin(wob * .15) * .02;
  cam.position.set(Math.sin(az) * Math.cos(cur.el) * dist, cur.ty + Math.sin(cur.el) * dist, Math.cos(az) * Math.cos(cur.el) * dist);
  cam.lookAt(0, cur.ty, 0);
  // HUD
  const hh = Math.floor(S.hour), mm = Math.floor((S.hour - hh) * 60 / 5) * 5; const ts = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  hudStage.textContent = T.stage; hudTime.textContent = ts; clockTime.textContent = ts; clockLabel.textContent = S.label;
  const pA = stA.progress; aList.forEach((li, i) => li.classList.toggle('on', i === (pA < .2 ? 0 : pA < .45 ? 1 : pA < .65 ? 2 : 3)));
  // labels
  const show = sm((cur.ex - .55) / .35); fl.style.opacity = show;
  if (show > 0) { cam.updateMatrixWorld(); labelEls.forEach((d, i) => { const f = floors[i];
    tmp.set(mobile ? (f.F.mlx ?? f.F.x + f.F.w * .15) : (f.F.lx ?? f.F.x + f.F.w / 2 + .3), f.F.ly ?? f.F.h * .5, 0); f.g.localToWorld(tmp); tmp.project(cam);
    const x = (tmp.x * .5 + .5) * vw, y = (-tmp.y * .5 + .5) * vh; d.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    d.style.display = (x > vw - (mobile ? 140 : 120) || y < 60 || y > vh) ? 'none' : ''; }); }
  renderer.render(scene, cam);
}

/* ---------- gallery: procedural project renders ---------- */
async function renderGallery() {
  const gal = document.getElementById('gallery'); const cred = document.getElementById('credits');
  PROJECTS.forEach((P, p) => { const { by, lic, licUrl, page } = P.credit;
    const a = document.createElement('a'); a.className = 'proj'; a.href = '#case-' + P.id; a.dataset.case = p; a.dataset.cursor = 'Open';
    a.setAttribute('aria-haspopup', 'dialog'); a.dataset.preview = `img/${P.img}-600.webp`;
    a.innerHTML = `<div class="ph">${picture(P.img, `${P.type}, stand-in photo`, 600, 1200, '(max-width: 760px) 92vw, 50vw')}</div><div class="meta"><span class="mono tag">[0${p + 1}]</span><h3>${P.name}</h3><span class="mono">${P.type} — ${P.place}<span class="sr"> — open case study</span></span></div><p class="mono pcred">Photo: ${by} · ${lic}</p>`;
    gal.appendChild(a);
    const li = document.createElement('li'); li.innerHTML = `<a href="${page}" target="_blank" rel="noopener">[0${p + 1}] ${by}</a> — <a href="${licUrl}" target="_blank" rel="noopener">${lic}</a>, via Wikimedia Commons (cropped/resized)`; cred.appendChild(li);
  });
}

/* ---------- reveals ---------- */
function setupReveals() { setupLower(lenis); setupExtra(lenis); setupCases(lenis); }

/* ---------- boot ---------- */
addEventListener('resize', () => { resize(); dirty = true; ScrollTrigger.refresh(); });
(async () => {
  renderer.compile(scene, cam); setLoad(60); await nextFrame();
  renderGallery(); setLoad(80);
  try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]); } catch (e) {}
  setupReveals(); ScrollTrigger.refresh();
  gsap.ticker.add(frame);
  await setLoad(100); await new Promise(r => setTimeout(r, reduced ? 0 : 150));
  gsap.timeline()
    .to('#loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' })
    .to(intro, { v: 1, duration: 2.2, ease: 'power3.out' }, '-=.5')
    .from('.hero .display .line', { yPercent: 105, duration: 1.2, stagger: .1, ease: 'power4.out' }, '-=2')
    .from('.hero-meta, .hero-foot, .chrome, .hud', { autoAlpha: 0, y: 16, duration: .9, stagger: .06 }, '-=1.4')
    .add(() => { document.getElementById('loader').style.display = 'none'; lenis.start(); });
})();
