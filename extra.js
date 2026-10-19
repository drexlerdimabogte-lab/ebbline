import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HL, HB, HD, DWL, hullGeometry, hullLines, deckGeometry, halfBeamAt } from './yacht.js';
const sm = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================= 07: top-down deck plan -> perspective walk-through ================= */
function setupWalk() {
  // pin is created now (layout), the WebGL scene is only built when the section gets close
  let target = 0, active = false, draw = null, built = false;
  ScrollTrigger.create({ trigger: '.walk', pin: '.walk-pin', start: 'top top', end: () => '+=' + innerHeight * 3, scrub: true,
    onUpdate: s => { target = s.progress; }, onToggle: s => { if (s.isActive && draw) draw.resize(); } });
  ScrollTrigger.create({ trigger: '.walk', start: 'top bottom', end: 'bottom top', onToggle: s => { active = s.isActive; } });
  const build = () => { if (built) return; built = true; draw = buildWalk(() => target); };
  ScrollTrigger.create({ trigger: '.walk', start: 'top bottom+=150%', end: 'bottom top', onToggle: s => { if (s.isActive) build(); } });
  let last = 0; gsap.ticker.add(t => { const dt = Math.min(.1, t - (last || t - .016)); last = t; if (active && draw && !document.hidden) draw(dt); });
}
function buildWalk(getTarget) {
  const mobDev = innerWidth < 760;
  const canvas = document.getElementById('walkgl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobDev ? 1.25 : 1.5));
  renderer.setClearColor(0, 0); renderer.shadowMap.enabled = true; renderer.shadowMap.type = mobDev ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene(); const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(renderer), .04).texture;
  const cam = new THREE.PerspectiveCamera(32, 1, .3, 300);
  const sun = new THREE.DirectionalLight(0xffe6c8, 0); sun.position.set(-14, 22, 12); sun.castShadow = true;
  sun.shadow.mapSize.set(mobDev ? 1024 : 2048, mobDev ? 1024 : 2048); Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, far: 80 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
  const hemi = new THREE.HemisphereLight(0xf6f7f4, 0xaabbc2, .6); scene.add(sun, hemi);
  const solids = [], lines = [];
  const ink = new THREE.LineBasicMaterial({ color: 0x1d2b3a, transparent: true, depthWrite: false });
  const mat = (o) => { const m = new THREE.MeshStandardMaterial({ alphaHash: true, ...o }); solids.push(m); return m; };
  const M = { paint: mat({ color: 0xf2f0ea, roughness: .4 }), teak: mat({ color: 0xc09a6e, roughness: .75 }), wood: mat({ color: 0xa47a54, roughness: .6 }),
    hull: mat({ vertexColors: true, roughness: .3, metalness: .1, side: THREE.DoubleSide }), fabric: mat({ color: 0xdcd0b8, roughness: 1 }), cushion: mat({ color: 0x46627a, roughness: 1 }),
    dark: mat({ color: 0x23313f, roughness: .45, metalness: .3 }), metal: mat({ color: 0xc6cbce, roughness: .25, metalness: .85 }),
    interior: mat({ color: 0xefeae0, roughness: .85 }), water: mat({ color: 0x8fb1be, roughness: .15, metalness: .15 }) };
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x9db6c4, roughness: .03, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const yacht = new THREE.Group(); scene.add(yacht);
  const add = (geo, m, x, y, z, edges = true, parent = yacht) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = m !== glass && m !== M.water; o.receiveShadow = true; parent.add(o);
    if (edges) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), ink); e.position.copy(o.position); parent.add(e); lines.push(e); } return o; };
  const B = (w, h, d, m, x, y, z, e) => add(new THREE.BoxGeometry(w, h, d), m, x, y, z, e);
  const DK = HD - DWL;                              // deck height above the water
  // sea (stays in world space)
  const sea = new THREE.Mesh(new THREE.CircleGeometry(60, 64), M.water); sea.rotation.x = -Math.PI / 2; sea.receiveShadow = true; scene.add(sea);
  // hull + lines plan + deck
  add(hullGeometry(), M.hull, 0, -DWL, 0, false);
  const hl = new THREE.LineSegments(hullLines(), ink); hl.position.y = -DWL; yacht.add(hl); lines.push(hl);
  add(deckGeometry(), M.teak, 0, DK + .01, 0, false);
  const dl = new THREE.LineSegments(new THREE.EdgesGeometry(deckGeometry()), ink); dl.position.y = DK + .03; yacht.add(dl); lines.push(dl);
  B(1.6, .16, 6.8, M.teak, -HL / 2 - .75, .5 - .05, 0);                                    // swim platform
  // main-deck superstructure walls (no roof so the plan reads)
  const WH = 2.3, T = .16, y0 = DK;
  const wall = (x1, z1, x2, z2, m = M.paint, h = WH) => { const L = Math.hypot(x2 - x1, z2 - z1); return B(x1 === x2 ? T : L + T, h, x1 === x2 ? L + T : T, m, (x1 + x2) / 2, y0 + h / 2, (z1 + z2) / 2); };
  const win = (x1, z1, x2, z2) => { wall(x1, z1, x2, z2, glass, WH - .1); };
  const xa = -9.5, xf = 5.5, zs = 3.2;
  for (const z of [zs, -zs]) { wall(xa, z, xa + .8, z); win(xa + .8, z, -3.2, z); wall(-3.2, z, -2.4, z); win(-2.4, z, 1.6, z); wall(1.6, z, 2.2, z); win(2.2, z, 4.8, z); wall(4.8, z, xf, z); }
  wall(xa, -zs, xa, -1.3); win(xa, -1.3, xa, 1.3); wall(xa, 1.3, xa, zs);                   // aft: glass doors
  win(xf, -zs, xf, zs);                                                                       // forward windscreen
  wall(-2.4, zs, -2.4, 1.2, M.paint, WH); wall(-2.4, -1.2, -2.4, -zs, M.paint, WH);           // saloon | galley
  wall(1.6, zs, 1.6, .9, M.paint, 1.1);                                                       // galley | helm (half height)
  // furniture
  B(.8, .45, 3.4, M.cushion, -8.6, y0 + .25, .6); B(3, .45, .8, M.cushion, -7.2, y0 + .25, 2.5); B(1.4, .4, .9, M.wood, -6.6, y0 + .22, .5);   // saloon sofa + table
  B(2.4, .06, 1.1, M.wood, -4.6, y0 + .8, -1.6); for (const dx of [-.8, 0, .8]) for (const s of [-1, 1]) B(.45, .45, .45, M.fabric, -4.6 + dx, y0 + .25, -1.6 + s * .85);
  B(3.4, .9, .65, M.interior, -.4, y0 + .45, 2.75); B(1.8, .9, .9, M.interior, -.4, y0 + .45, -.4);                                         // galley
  add(new THREE.BoxGeometry(.9, 1, 4), M.dark, 4.6, y0 + .5, 0); for (const s of [-1, 1]) B(.6, .9, .6, M.cushion, 3.4, y0 + .45, s * 1.1);   // helm
  B(3.2, .3, 3.2, M.fabric, 9.4, y0 + .15, 0); B(.5, .45, 3.2, M.fabric, 7.6, y0 + .3, 0); add(new THREE.CylinderGeometry(.3, .3, .35, 14), M.dark, 12.6, y0 + .18, 0); // foredeck
  B(.9, .42, 4.6, M.cushion, -HL / 2 + 1.2, y0 + .22, 0); B(1.3, .07, 2.2, M.wood, -HL / 2 + 2.7, y0 + .72, 0); B(.18, .7, .18, M.metal, -HL / 2 + 2.7, y0 + .36, 0, false); // aft deck
  // pergola over aft deck
  for (let x = -14.2; x <= -10; x += .6) B(.08, .1, 6, M.wood, x, y0 + WH + .1, 0, true);
  for (const [x, z] of [[-14.2, 2.9], [-14.2, -2.9]]) B(.1, WH + .1, .1, M.metal, x, y0 + (WH + .1) / 2, z);
  // stanchions
  for (let x = -14.6; x < 13; x += 1.5) for (const s of [1, -1]) B(.04, .9, .04, M.metal, x, y0 + .45, s * (halfBeamAt(x) - .12), false);
  // mobile: lay the hull along the screen's long axis
  const mob = innerWidth < 760; if (mob) yacht.rotation.y = Math.PI / 2;
  // labels
  const labels = [['Swim platform', -HL / 2 - .8, .7, 0], ['Aft deck', -12.4, 1, -1.5], ['Saloon', -6.6, 1, -.4], ['Galley', -.6, 1, 1.4], ['Helm', 3.6, 1.2, 0], ['Foredeck · sun pads', 9.6, .6, 0]].map(([n, x, y, z]) => {
    const d = document.createElement('div'); d.className = 'wl mono'; d.innerHTML = `<i></i>${n}`; document.getElementById('walkLabels').appendChild(d); return { d, v: new THREE.Vector3(x, DK + y - 1, z) }; });

  let vw = 0, vh = 0, dirty = true; const resize = () => { vw = canvas.clientWidth; vh = canvas.clientHeight; renderer.setSize(vw, vh, false); cam.aspect = vw / vh; cam.fov = vw < 760 ? 44 : 32; cam.updateProjectionMatrix(); dirty = true; };
  resize(); addEventListener('resize', resize);
  const P0 = new THREE.Vector3(0, mob ? 62 : 54, .001), P1 = new THREE.Vector3(10, mob ? 46 : 44, 36), P2 = mob ? new THREE.Vector3(24, 15, 30) : new THREE.Vector3(1, 14, 44);
  const L0 = new THREE.Vector3(mob ? 0 : -1, 0, mob ? 1 : 0), L2 = mob ? new THREE.Vector3(-1, 1.4, -1) : new THREE.Vector3(-2, 1.2, -1);
  const U0 = new THREE.Vector3(0, 0, -1), U1 = new THREE.Vector3(0, 1, 0);
  const tmp = new THREE.Vector3(), up = new THREE.Vector3(), look = new THREE.Vector3();
  let cur = 0;
  const mode = document.getElementById('walkMode'), bar = document.getElementById('walkBar'), pct = document.getElementById('walkPct');
  const draw = (dt) => {
    const target = getTarget();
    if (!dirty && Math.abs(target - cur) < 1e-4) return;                 // idle: nothing changed, skip the render
    dirty = false;
    cur += (target - cur) * (reduced ? 1 : 1 - Math.pow(.86, dt * 60));
    const c = sm(cur / .82), solid = sm((cur - .28) / .4), light = sm((cur - .5) / .35);
    const a = (1 - c) * (1 - c), b = 2 * (1 - c) * c, d = c * c;
    cam.position.set(P0.x * a + P1.x * b + P2.x * d, P0.y * a + P1.y * b + P2.y * d, P0.z * a + P1.z * b + P2.z * d);
    look.lerpVectors(L0, L2, c); up.lerpVectors(U0, U1, sm(c * 1.6)).normalize(); cam.up.copy(up); cam.lookAt(look);
    solids.forEach(m => m.opacity = solid); glass.opacity = .35 * solid; ink.opacity = 1 - .82 * solid;
    sun.intensity = 2.6 * light; hemi.intensity = .5 + .4 * light; renderer.toneMappingExposure = .95 + .1 * light;
    yacht.traverse(o => { if (o.isMesh) o.castShadow = light > .2 && o.material !== glass; });
    mode.textContent = c < .25 ? 'Deck plan — 1:100' : c < .6 ? 'Axonometric' : solid < .95 ? 'Perspective — linework' : 'Perspective — materials';
    bar.style.transform = `scaleX(${cur})`; pct.textContent = String(Math.round(cur * 100)).padStart(3, '0');
    cam.updateMatrixWorld(); yacht.updateMatrixWorld();
    labels.forEach(({ d, v }) => { tmp.copy(v); yacht.localToWorld(tmp); tmp.project(cam); d.style.transform = `translate(${((tmp.x * .5 + .5) * vw).toFixed(1)}px,${((-tmp.y * .5 + .5) * vh).toFixed(1)}px)`; d.style.opacity = tmp.z < 1 ? 1 - light * .35 : 0; });
    renderer.render(scene, cam);
  };
  draw(.016); draw.resize = resize; return draw;
}

/* ================= 08: ink sketch -> tone -> colour photo ================= */
function setupSketch() {
  const paths = gsap.utils.toArray('.sk-svg path');
  gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set('.sk-line', { clipPath: 'inset(0 100% 0 0)' });
  gsap.set('.sk-shade', { clipPath: 'circle(0% at 87% 19%)' });
  gsap.set('.sk-color', { clipPath: 'polygon(0% 100%, 0% 100%, 0% 100%, 0% 100%)' });
  gsap.set('.sun', { scale: 0, svgOrigin: '1400 170' }); gsap.set('.vp', { scale: 0, svgOrigin: '1560 690' });
  gsap.set('.sk-tag', { autoAlpha: 0, y: 10 });
  const stage = document.getElementById('skStage');
  const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '#sketch', pin: '.sk-pin', start: 'top top', end: () => '+=' + innerHeight * 3.2, scrub: .6,
    onUpdate: s => { stage.textContent = s.progress < .33 ? '01 — Lines' : s.progress < .62 ? '02 — Tone' : '03 — Colour'; } } });
  tl.to('.sk-svg .cl path', { strokeDashoffset: 0, stagger: .05, duration: .5 }, 0)
    .to('.vp', { scale: 1, duration: .1, ease: 'back.out(3)' }, .2)
    .to('.sk-line', { clipPath: 'inset(0 0% 0 0)', duration: .9 }, .15)
    .to('.sun', { scale: 1, duration: .4, ease: 'power2.out' }, .3)
    .to('.t1', { autoAlpha: 1, y: 0, duration: .15 }, .4)
    .to('.sk-svg .ticks path', { strokeDashoffset: 0, duration: .4 }, .5)
    // tone blooms out of the sun
    .to('.sk-shade', { clipPath: 'circle(130% at 87% 19%)', duration: 1, ease: 'power1.in' }, 1.15)
    .to('.t2', { autoAlpha: 1, y: 0, duration: .15 }, 1.4)
    .to('.sun', { attr: { r: 60 }, duration: .8 }, 1.3)
    // colour sweeps in diagonally; drawing aids fade
    .to('.sk-color', { clipPath: 'polygon(0% 100%, 0% -40%, 140% -40%, 100% 100%)', duration: 1.2, ease: 'power2.inOut' }, 2.3)
    .to('.sk-svg .cl, .vp', { opacity: .12, duration: .8 }, 2.4)
    .to('.sun', { attr: { r: 14 }, opacity: .9, duration: .8 }, 2.6)
    .to('.t3', { autoAlpha: 1, y: 0, duration: .15 }, 3.1)
    .to('.t1, .t2', { autoAlpha: .35, duration: .2 }, 3.1)
    .to({}, { duration: .5 });
  gsap.from('.sk-head .h2, .sk-head .kicker', { y: 40, autoAlpha: 0, duration: 1, stagger: .1, scrollTrigger: { trigger: '#sketch', start: 'top 75%' } });
}

import { setupProcess } from './process.js';
export function setupExtra() { setupProcess(); setupWalk(); setupSketch(); ScrollTrigger.refresh(); }
