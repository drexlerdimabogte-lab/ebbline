// Parametric yacht geometry shared by the hero model and the walk-through.
import * as THREE from 'three';
import { HL, HB, HD, DWL, planF, keelY, sheerY, hb } from './hullmath.js';
export { HL, HB, HD, DWL };

// hull skin; origin at keel, x = -HL/2 (transom) .. +HL/2 (stem)
export function hullGeometry(N = 64, M = 18, colors = true) {
  const pos = [], col = [], idx = [];
  const cA = new THREE.Color(0x8a5a4a), cB = new THREE.Color(0xe3d6bb), cC = new THREE.Color(0x2f4a62);
  for (const side of [1, -1]) {
    const base = pos.length / 3;
    for (let i = 0; i <= N; i++) { const u = i / N, k = keelY(u), s = sheerY(u);
      for (let j = 0; j <= M; j++) { const t = j / M, y = k + (s - k) * t; pos.push(u * HL - HL / 2, y, side * hb(u, y));
        const c = y < DWL - .05 ? cA : y < DWL + .22 ? cB : cC; col.push(c.r, c.g, c.b); } }
    for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = base + i * (M + 1) + j, b = a + M + 1;
      if (side > 0) idx.push(a, b, a + 1, b, b + 1, a + 1); else idx.push(a, a + 1, b, b, a + 1, b + 1); }
  }
  // transom cap
  const tb = pos.length / 3;
  for (let j = 0; j <= M; j++) { const y = sheerY(0) * j / M; for (const side of [1, -1]) { pos.push(-HL / 2, y, side * hb(0, y)); const c = y < DWL - .05 ? cA : y < DWL + .22 ? cB : cC; col.push(c.r, c.g, c.b); } }
  for (let j = 0; j < M; j++) { const a = tb + j * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (colors) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
// lines plan in 3D: stations, waterlines, sheer + keel
export function hullLines() {
  const v = []; const P = (u, y, s) => [u * HL - HL / 2, y, s * hb(u, y)];
  const seg = (a, b) => v.push(...a, ...b);
  for (let st = 1; st < 20; st++) { const u = st / 20, k = keelY(u), s = sheerY(u);
    for (const sd of [1, -1]) for (let j = 0; j < 12; j++) seg(P(u, k + (s - k) * j / 12, sd), P(u, k + (s - k) * (j + 1) / 12, sd)); }
  for (const y of [.5, 1, DWL, 2.3, 2.9]) for (const sd of [1, -1]) { let prev = null;
    for (let i = 0; i <= 80; i++) { const u = i / 80; if (keelY(u) > y || sheerY(u) < y) { prev = null; continue; } const p = P(u, y, sd); if (prev) seg(prev, p); prev = p; } }
  for (const sd of [1, -1]) for (let i = 0; i < 80; i++) { const u = i / 80, w = i / 80 + 1 / 80; seg(P(u, sheerY(u), sd), P(w, sheerY(w), sd)); }
  for (let i = 0; i < 80; i++) { const u = i / 80, w = u + 1 / 80; seg([u * HL - HL / 2, keelY(u), 0], [w * HL - HL / 2, keelY(w), 0]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); return g;
}
// flat deck plate (outline at sheer) at height y
export function deckGeometry(inset = .12) {
  const s = new THREE.Shape(); const N = 60;
  for (let i = 0; i <= N; i++) { const u = i / N; const p = [u * HL - HL / 2, Math.max(0, HB * planF(u) - inset)]; i ? s.lineTo(...p) : s.moveTo(...p); }
  for (let i = N; i >= 0; i--) { const u = i / N; s.lineTo(u * HL - HL / 2, -Math.max(0, HB * planF(u) - inset)); }
  const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); return g;
}
// cabin with raked front: profile in x/y, extruded across beam (centred)
export function cabinGeometry(len, beam, h, rake = 0) {
  const s = new THREE.Shape(); s.moveTo(-len / 2, 0); s.lineTo(len / 2, 0); s.lineTo(len / 2 - rake, h); s.lineTo(-len / 2, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: beam, bevelEnabled: false }); g.translate(0, 0, -beam / 2); return g;
}
export const halfBeamAt = x => HB * planF((x + HL / 2) / HL);
