// Process section: one pinned, scroll-scrubbed drawing with five acts
// (Concept, Hull lines, Naval engineering, Build, Sea trials) on a yacht general arrangement.
import { HL, HB, HD, DWL, planF, keelY, sheerY, hb } from './hullmath.js';
const sm = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const NS = 'http://www.w3.org/2000/svg';
const ACTS = 5;

// plan: 22 px = 1 m. Stern at x=130, stem at x=790, centreline y=200.
const S = 22, X0 = 130, CY = 200, PZ0 = 560; // PZ0 = design waterline in the profile view
const PX = m => X0 + m * S, PY = z => CY - z * S, PZ = y => PZ0 - (y - DWL) * S;
const f1 = n => +n.toFixed(1);
const EXT = 6, INT = 4;
const H = (x0, x1, y, t = EXT) => [x0, y - t / 2, x1, y + t / 2];
const V = (y0, y1, x, t = EXT) => [x - t / 2, y0, x + t / 2, y1];
const yT = PY(3.3), yB = PY(-3.3), xA = PX(5.5), xF = PX(20.5);
const WIN_X = [[268, 330], [345, 395], [420, 460], [490, 562]];
const solidRuns = (a, b) => { const r = []; let s = a; WIN_X.forEach(([w0, w1]) => { r.push([s, w0]); s = w1; }); r.push([s, b]); return r; };
const WALLS_EXT = [...solidRuns(xA, xF).flatMap(([a, b]) => [H(a, b, yT), H(a, b, yB)]), V(yT, 168, xA), V(232, yB, xA), V(yT, yB, xF)];
const WALLS_INT = [V(yT, 172, PX(12.5), INT), V(228, yB, PX(12.5), INT), V(yT, 188, PX(15.5), INT), V(212, yB, PX(15.5), INT)];
const WINDOWS = WIN_X.flatMap(([a, b]) => [H(a, b, yT), H(a, b, yB)]);
const ROOMS = [['Aft deck', PX(2.7), CY + 4, '24.1'], ['Saloon', PX(9), CY + 40, '44.6'], ['Galley', PX(14), CY - 34, '17.8'],
  ['Owner', PX(18), CY + 40, '29.7'], ['Foredeck', PX(25.6), CY + 48, '31.0']];

function el(tag, attrs = {}, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
const g = (cls, parent) => el('g', { class: cls }, parent);
const rectPath = ([x0, y0, x1, y1]) => `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
const poly = pts => 'M' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L');

// hull curves
const US = Array.from({ length: 61 }, (_, i) => i / 60);
const outline = () => { const top = US.map(u => [PX(u * HL), PY(HB * planF(u))]); const bot = US.slice().reverse().map(u => [PX(u * HL), PY(-HB * planF(u))]); return poly([...top, ...bot]) + 'Z'; };
const waterline = (y, side) => { const pts = US.filter(u => keelY(u) < y).map(u => [PX(u * HL), PY(side * hb(u, y))]); return pts.length > 1 ? poly(pts) : ''; };
const profileHull = () => { const sheer = US.map(u => [PX(u * HL), PZ(sheerY(u))]); const keel = US.slice().reverse().map(u => [PX(u * HL), PZ(keelY(u))]); return poly([...sheer, ...keel]) + 'Z'; };
function rough(d, r) { return d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (_, a, b) => `${f1(+a + (r() - .5) * 7)} ${f1(+b + (r() - .5) * 7)}`); }
function roughOutline(r, side) { const pts = US.filter((_, i) => i % 5 === 0).map(u => [PX(u * HL), PY(side * HB * planF(u))]); return rough(poly(pts), r); }

function buildSVG(svg) {
  const defs = el('defs', {}, svg);
  defs.innerHTML = `<pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#eceae3"/><line x1="0" y1="0" x2="0" y2="6" stroke="#1d2b3a" stroke-width="1.6"/></pattern>
  <pattern id="dots" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".9" fill="#7f8a93"/></pattern>
  <pattern id="teak" width="40" height="5" patternUnits="userSpaceOnUse"><rect width="40" height="5" fill="#d8c3a2"/><path d="M0 4.6H40" stroke="#8c7356" stroke-width=".7"/></pattern>
  <marker id="arw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#3f7f8c"/></marker>`;
  const r = (s => () => (s = (s * 9301 + 49297) % 233280) / 233280)(3);
  // grid axes (frame stations)
  const ax = g('axes', svg);
  [['0', 0], ['5', 5.5], ['12', 12.5], ['20', 20.5], ['30', 30]].forEach(([n, m]) => { const x = PX(m); el('path', { d: `M${x} 58V310`, class: 'axl' }, ax); el('circle', { cx: x, cy: 44, r: 13, class: 'bub' }, ax); el('text', { x, y: 48.5, class: 'bubt' }, ax).textContent = n; });
  [['P', yT], ['CL', CY], ['S', yB]].forEach(([n, y]) => { el('path', { d: `M80 ${y}H810`, class: 'axl' }, ax); el('circle', { cx: 64, cy: y, r: 13, class: 'bub' }, ax); el('text', { x: 64, y: y + 4.5, class: 'bubt' }, ax).textContent = n; });
  // CONCEPT layer: sea state, wind, passage route
  const L = g('L-listen', svg);
  for (let i = 0; i < 7; i++) { const y0 = 130 + i * 78; let d = `M-20 ${y0}`; for (let x = 0; x <= 1020; x += 60) d += ` Q${x + 30} ${f1(y0 + Math.sin(x * .02 + i) * 16 - 8)} ${x + 60} ${f1(y0 + Math.sin((x + 60) * .018 + i * .7) * 12)}`;
    el('path', { d, class: 'contour', pathLength: 1 }, L); el('text', { x: 20 + i * 9, y: y0 - 12, class: 'ctxt mono' }, L).textContent = `Hs ${(0.5 + i * .4).toFixed(1)} m`; }
  el('path', { d: 'M110 600 C 260 420, 420 140, 880 90', class: 'sunpath', pathLength: 1, id: 'sunArc' }, L);
  for (const [t, lab] of [[.02, 'Bergen'], [.45, 'Ålesund'], [.98, 'Lofoten']]) el('text', { class: 'sunlab mono', 'data-t': t }, L).textContent = lab;
  el('circle', { r: 11, class: 'sundot', id: 'sunDot' }, L);
  for (let i = 0; i < 4; i++) el('path', { d: `M${-10 + i * 30} ${50 + i * 70} q90 30 190 10`, class: 'wind', pathLength: 1, 'marker-end': 'url(#arw)' }, L);
  el('text', { x: 18, y: 30, class: 'note' }, L).textContent = 'SW swell — soft entry, fine bow';
  const buoys = [[90, 650], [860, 200], [900, 640], [60, 330], [940, 400]];
  buoys.forEach(([x, y]) => { const t = g('tree', L); el('circle', { cx: x, cy: y, r: 14, class: 'treec' }, t); el('path', { d: `M${x - 14} ${y}H${x + 14}M${x} ${y - 14}V${y + 14}`, class: 'treec' }, t); });
  [['8 guests · 5 crew', 640, 650], ['quiet at anchor', 120, 560], ['low wake in the fjords →', 590, 300]].forEach(([s, x, y]) => el('text', { x, y, class: 'note' }, L).textContent = s);
  // HULL LINES: pencil sketch first
  const D = g('L-draw', svg);
  [1, -1].forEach(sd => { el('path', { d: roughOutline(r, sd), class: 'sketch', pathLength: 1 }, D); el('path', { d: roughOutline(r, sd), class: 'sketch', pathLength: 1 }, D); });
  el('path', { d: rough(poly(US.filter((_, i) => i % 6 === 0).map(u => [PX(u * HL), PZ(sheerY(u))])), r), class: 'sketch', pathLength: 1 }, D);
  el('path', { d: rough(poly(US.filter((_, i) => i % 6 === 0).map(u => [PX(u * HL), PZ(keelY(u))])), r), class: 'sketch', pathLength: 1 }, D);
  // PLAN (general arrangement)
  const P = g('plan', svg);
  el('path', { d: outline(), class: 'floor' }, P);
  el('path', { d: `M${PX(-1.4)} ${PY(3.5)}H${X0}V${PY(-3.5)}H${PX(-1.4)}Z`, class: 'floor swim' }, P);
  const lines = g('hlines', P);
  el('path', { d: outline(), class: 'hl-out', pathLength: 1 }, lines);
  for (const y of [.6, 1.2, DWL, 2.4]) for (const sd of [1, -1]) { const d = waterline(y, sd); if (d) el('path', { d, class: 'hl-wl' + (y === DWL ? ' dwl' : ''), pathLength: 1 }, lines); }
  for (let m = 3; m < 30; m += 3) { const u = m / HL, w = HB * planF(u); el('path', { d: `M${PX(m)} ${f1(PY(w))}V${f1(PY(-w))}`, class: 'hl-st', pathLength: 1 }, lines); }
  el('path', { d: `M${PX(-1.6)} ${CY}H${PX(30.6)}`, class: 'hl-cl', pathLength: 1 }, lines);
  // profile (side elevation) with superstructure
  const pf = g('profile', P);
  el('path', { d: profileHull(), class: 'pf-hull' }, pf);
  el('path', { d: profileHull(), class: 'hl-out', pathLength: 1 }, pf);
  el('path', { d: `M${PX(-2)} ${PZ0}H${PX(31)}`, class: 'hl-wl dwl', pathLength: 1 }, pf);
  for (let m = 3; m < 30; m += 3) { const u = m / HL; el('path', { d: `M${PX(m)} ${f1(PZ(sheerY(u)))}V${f1(PZ(keelY(u)))}`, class: 'hl-st', pathLength: 1 }, pf); }
  const SUP = [[5.5, 20.5, HD, HD + 2.6, 2.2], [8, 19, HD + 2.6, HD + 5, 1.8], [12.35, 18.85, HD + 5, HD + 7.3, 1.6], [10.5, 18.5, HD + 7.3, HD + 7.5, 0]];
  SUP.forEach(([a, b, y0, y1, rk]) => el('path', { d: poly([[PX(a), PZ(y0)], [PX(b), PZ(y0)], [PX(b - rk), PZ(y1)], [PX(a), PZ(y1)]]) + 'Z', class: 'pf-sup', pathLength: 1 }, pf));
  el('path', { d: `M${PX(11)} ${PZ(HD + 7.5)}V${PZ(HD + 9.3)}M${PX(17.8)} ${PZ(HD + 7.5)}V${PZ(HD + 9.3)}M${PX(10.6)} ${PZ(HD + 9.3)}H${PX(18.2)}M${PX(15)} ${PZ(HD + 9.3)}V${PZ(HD + 10.6)}`, class: 'pf-sup', pathLength: 1 }, pf);
  el('text', { x: PX(30.8), y: PZ0 + 4, class: 'dimt mono', 'text-anchor': 'start' }, pf).textContent = 'DWL';
  // furniture
  const furn = g('furn', P);
  const F = (d, c = '') => el('path', { d, class: 'fu ' + c, pathLength: 1 }, furn);
  F(`M${PX(.6)} ${CY - 50}h18v100h-18z M${PX(1.6)} ${CY - 22}h40v44h-40z`);                                     // aft deck sofa + table
  F(`M${PX(6)} ${yT + 10}h110v26h-110z M${PX(6)} ${yT + 10}h22v70h-22z`); F(`M${PX(8.2)} ${CY - 4}h56v30h-56z`); // saloon L-sofa + coffee table
  F(`M${PX(9.2)} ${yB - 46}h80v26h-80z`); for (const dx of [10, 34, 58]) F(`M${PX(9.2) + dx + 6} ${yB - 54} a6 6 0 1 0 .1 0 M${PX(9.2) + dx + 6} ${yB - 12} a6 6 0 1 0 .1 0`); // dining
  F(`M${PX(12.7)} ${yT + 4}h62v20h-62z M${PX(15.2)} ${yT + 4}h-14v70h14z`); F(`M${PX(13.4)} ${CY + 18}h40v18h-40z`);   // galley
  F(`M${PX(16.6)} ${CY - 30}h62v60h-62z M${PX(16.6)} ${CY - 30}h14v60h-14z`); F(`M${PX(19.2)} ${yT + 4}h18v36h-18z M${PX(19.2)} ${yB - 40}h18v36h-18z`); // owner bed + wardrobes
  F(`M${PX(22.5)} ${CY - 28}h70v56h-70z M${PX(22.5)} ${CY}h70`);                                                   // foredeck sun pad
  F(`M${PX(26.5)} ${CY} m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M${PX(28)} ${CY - 6}h10v12h-10z`);             // windlass
  for (let i = 0; i < 4; i++) F(`M${PX(-1.4) + 5 + i * 7} ${CY - 40}v80`); // swim steps
  const win = g('wins', P); WINDOWS.forEach(([x0, y0, x1, y1]) => { el('path', { d: rectPath([x0, y0, x1, y1]), class: 'winf' }, win); el('path', { d: `M${x0} ${(y0 + y1) / 2}H${x1}`, class: 'winl', pathLength: 1 }, win); });
  const dr = g('doors', P);
  el('path', { d: `M${xA} 168V200 M${xA - 3} 200V232`, class: 'door', pathLength: 1 }, dr);
  el('path', { d: `M${PX(15.5)} 188 H${PX(15.5) + 24} A24 24 0 0 1 ${PX(15.5)} 212`, class: 'door', pathLength: 1 }, dr);
  el('path', { d: `M${PX(12.5)} 172 H${PX(12.5) - 26} A26 26 0 0 0 ${PX(12.5)} 198`, class: 'door', pathLength: 1 }, dr);
  const wE = g('wallsE', P); WALLS_EXT.forEach(w => el('path', { d: rectPath(w), class: 'wallE' }, wE));
  const wI = g('wallsI', P); WALLS_INT.forEach(w => el('path', { d: rectPath(w), class: 'wallI' }, wI));
  const lab = g('rooms', P); ROOMS.forEach(([n, x, y, a]) => { const t = el('text', { x, y, class: 'room' }, lab); t.textContent = n; el('text', { x, y: y + 14, class: 'area mono' }, lab).textContent = a + ' m²'; });
  // dimensions
  const dim = g('dims', svg);
  const chainH = (y, xs) => { el('path', { d: `M${xs[0]} ${y}H${xs[xs.length - 1]}`, class: 'dim', pathLength: 1 }, dim);
    xs.forEach(x => el('path', { d: `M${x - 5} ${y + 5}L${x + 5} ${y - 5} M${x} ${y - 9}V${y + 9}`, class: 'dim' }, dim));
    for (let i = 0; i < xs.length - 1; i++) el('text', { x: (xs[i] + xs[i + 1]) / 2, y: y - 6, class: 'dimt mono' }, dim).textContent = ((xs[i + 1] - xs[i]) / S).toFixed(2); };
  const chainV = (x, ys) => { el('path', { d: `M${x} ${ys[0]}V${ys[ys.length - 1]}`, class: 'dim', pathLength: 1 }, dim);
    ys.forEach(y => el('path', { d: `M${x - 5} ${y + 5}L${x + 5} ${y - 5} M${x - 9} ${y}H${x + 9}`, class: 'dim' }, dim));
    for (let i = 0; i < ys.length - 1; i++) { const t = el('text', { x: x - 8, y: (ys[i] + ys[i + 1]) / 2, class: 'dimt mono', transform: `rotate(-90 ${x - 8} ${(ys[i] + ys[i + 1]) / 2})` }, dim); t.textContent = ((ys[i + 1] - ys[i]) / S).toFixed(2); } };
  chainH(84, [X0, xA, PX(12.5), PX(15.5), xF, PX(30)]); chainH(72, [PX(-1.4), PX(30)]); chainV(104, [PY(HB), CY, PY(-HB)]);
  chainH(634, [X0, PX(15), PX(30)]);
  // section cut A–A (midship)
  const sec = g('section', svg); const xm = PX(12); el('path', { d: `M${xm} 96V306`, class: 'cut', pathLength: 1 }, sec);
  for (const y of [88, 314]) { el('circle', { cx: xm, cy: y, r: 11, class: 'bub' }, sec); el('text', { x: xm, y: y + 4.5, class: 'bubt' }, sec).textContent = 'A'; }
  // compass, scale bar, title block
  const meta = g('meta', svg);
  meta.innerHTML = `<g transform="translate(895 110)"><g class="north"><circle r="30" class="nc"/><path d="M0 -26 L10 14 L0 6 L-10 14Z" class="na"/><text y="-36" class="bubt">N</text></g></g>
  <g transform="translate(820 440)"><g class="scale"><rect width="22" height="8" class="sb1"/><rect x="22" width="22" height="8" class="sb2"/><rect x="44" width="22" height="8" class="sb1"/><rect x="66" width="22" height="8" class="sb2"/><rect x="88" width="22" height="8" class="sb1"/>
  <text y="24" class="dimt mono">0</text><text x="44" y="24" class="dimt mono">2</text><text x="110" y="24" class="dimt mono">5 m</text></g></g>
  <g transform="translate(810 500)"><g class="tblock"><rect width="175" height="160" class="tb"/><path d="M0 40H175 M0 80H175 M0 120H175 M90 80V160" class="tbl"/>
  <text x="10" y="26" class="tbt">Ebb 30</text><text x="10" y="64" class="tbs mono">General arrangement</text><text x="10" y="104" class="tbs mono">Ebbline</text>
  <text x="10" y="146" class="tbs mono">1:100</text><text x="100" y="146" class="tbs mono">GA-101</text></g></g>`;
  // ENGINEERING layer: midship section + stability callouts
  const DT = g('L-detail', svg);
  DT.innerHTML = `<circle cx="${xm}" cy="${CY}" r="30" class="callc"/><circle cx="${PX(13)}" cy="${PZ(1.1)}" r="26" class="callc"/>
  <path d="M${xm + 30} ${CY - 6} C 560 60, 740 40, 815 70" class="lead" pathLength="1"/><path d="M${PX(13) + 26} ${PZ(1.1)} C 560 500, 720 380, 815 340" class="lead" pathLength="1"/>
  <g transform="translate(815 30)"><g class="det"><rect width="175" height="220" class="detbg"/><text x="10" y="20" class="tbs mono">1 — Midship section 1:50</text>
    <path d="M88 44 H156 V100 C156 150 130 186 88 196" class="dline" pathLength="1"/><path d="M88 52 H148 V100 C148 146 124 178 88 188" class="dline" pathLength="1"/>
    <rect x="84" y="186" width="8" height="18" class="blk"/><path d="M88 44V204" class="dline thin" pathLength="1"/>
    <path d="M148 64 H96 M148 96 H96 M146 128 H96 M136 160 H96" class="dline thin" pathLength="1"/>
    <rect x="88" y="40" width="68" height="5" class="ins"/>
    <text x="12" y="48" class="tbs mono">teak 12</text><text x="12" y="98" class="tbs mono">frame 120</text><text x="12" y="140" class="tbs mono">alu 8 mm</text><text x="12" y="200" class="tbs mono">keel bar</text></g></g>
  <g transform="translate(815 270)"><g class="det"><rect width="175" height="190" class="detbg"/><text x="10" y="20" class="tbs mono">2 — Stability, GZ curve</text>
    <path d="M24 160H160 M24 160V40" class="dline thin" pathLength="1"/>
    <path d="M24 160 C 50 120, 74 70, 98 62 C 120 56, 140 96, 160 150" class="gz" pathLength="1"/>
    <path d="M24 160 L64 70" class="dline thin dash" pathLength="1"/>
    <text x="24" y="176" class="tbs mono">0°</text><text x="88" y="176" class="tbs mono">40°</text><text x="146" y="176" class="tbs mono">80°</text>
    <text x="70" y="50" class="tbs mono">GZ max 0.86 m</text><text x="40" y="112" class="tbs mono">GM 1.42</text></g></g>`;
  // BUILD + SEA TRIALS layers (iso, filled by JS)
  g('L-build', svg);
  const T = g('L-trials', svg);
  T.innerHTML = `<g transform="translate(890 120)"><g class="gauge"><path d="M-70 0 A70 70 0 0 1 70 0" class="g-arc"/><path d="M-70 0 A70 70 0 0 1 70 0" class="g-fill" id="gFill" pathLength="1"/>
    <path d="M-62 0H-52M62 0H52M0 -62V-52M-44 -44L-37 -37M44 -44L37 -37" class="g-tick"/><line x1="0" y1="0" x2="0" y2="-56" class="g-needle" id="gNeedle"/><circle r="5" class="g-hub"/>
    <text y="34" class="g-val" id="gVal">0.0</text><text y="52" class="tbs mono g-u">knots · trial 3/5</text></g></g>
    <g class="trial-log mono" transform="translate(820 230)"><text y="0" class="tbs mono" id="tl1">RPM 0</text><text y="18" class="tbs mono" id="tl2">Fuel 0 L/h</text><text y="36" class="tbs mono" id="tl3">Noise saloon — dB(A)</text><text y="54" class="tbs mono" id="tl4">Roll —</text></g>`;
}

/* ---------- isometric build (metres: x along hull from transom, y across from port edge) ---------- */
const OX = 260, OY = 240, K = 22;
const iso = (x, y, z) => [OX + (x - y) * .866 * K, OY + (x + y) * .5 * K - z * K];
const pts = a => a.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
function prism([x0, y0, x1, y1], z0, z1) {
  const P = iso;
  return { top: pts([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)]),
    s: pts([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)]),
    e: pts([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)]) };
}
const ring = (scale, z) => { const U = Array.from({ length: 29 }, (_, i) => i / 28);
  const a = U.map(u => [u * HL, HB - HB * planF(u) * scale, z]), b = U.slice().reverse().map(u => [u * HL, HB + HB * planF(u) * scale, z]); return [...a, ...b.slice(1)]; };
function buildIso(layer) {
  const sea = el('polygon', { class: 'iso-sea', points: pts([iso(-8, -10, DWL), iso(42, -10, DWL), iso(42, 18, DWL), iso(-8, 18, DWL)]) }, layer);
  const wake = el('g', { class: 'wake' }, layer);
  for (let i = 0; i < 4; i++) { const s = i * .9; const pa = [iso(-.5, HB - 2.6 - s, DWL), iso(-9 - i * 2, HB - 6 - s * 2.4, DWL)], pb = [iso(-.5, HB + 2.6 + s, DWL), iso(-9 - i * 2, HB + 6 + s * 2.4, DWL)];
    el('path', { d: `M${pa[0]} Q${iso(-4 - i, HB - 4 - s * 1.6, DWL)} ${pa[1]}`, class: 'wk', pathLength: 1 }, wake);
    el('path', { d: `M${pb[0]} Q${iso(-4 - i, HB + 4 + s * 1.6, DWL)} ${pb[1]}`, class: 'wk', pathLength: 1 }, wake); }
  for (let i = 0; i < 3; i++) { const s = i * .7; el('path', { d: `M${iso(27.5, HB - .4, DWL)} Q${iso(24 - s * 2, HB - 4 - s, DWL)} ${iso(18 - s * 4, HB - 6.4 - s * 1.6, DWL)}`, class: 'wk bow', pathLength: 1 }, wake);
    el('path', { d: `M${iso(27.5, HB + .4, DWL)} Q${iso(24 - s * 2, HB + 4 + s, DWL)} ${iso(18 - s * 4, HB + 6.4 + s * 1.6, DWL)}`, class: 'wk bow', pathLength: 1 }, wake); }
  const keel = el('path', { class: 'iso-keel', d: `M${iso(0, HB, 0)} L${iso(HL * .82, HB, 0)}`, pathLength: 1 }, layer);
  const hullG = el('g', { class: 'iso hull' }, layer);
  const sides = Array.from({ length: 56 }, () => el('polygon', { class: 'hs' }, hullG));
  const frames = el('g', { class: 'frames' }, layer);
  const frameEls = Array.from({ length: 13 }, (_, i) => el('path', { class: 'fr' }, frames));
  const deck = el('polygon', { class: 'hdeck' }, layer);
  const items = [];
  const mk = (rect, z0, z1, cls, phase, t0 = 0) => { const gg = el('g', { class: 'iso ' + cls }, layer);
    const f = { top: el('polygon', { class: 'ft' }, gg), s: el('polygon', { class: 'fs' }, gg), e: el('polygon', { class: 'fe' }, gg) };
    items.push({ m: rect, z0, z1, f, gg, phase, t0 }); };
  const yc = (h) => [HB - h, HB + h];
  // outfit on deck: aft sofa, foredeck pad, tender
  mk([.6, HB - 2.2, 1.4, HB + 2.2], HD, HD + .5, 'furn', 4, 0);
  mk([22.5, HB - 1.3, 25.7, HB + 1.3], HD, HD + .35, 'pad', 4, .2);
  // superstructure tiers: [x0,x1,half,z0,z1]
  const TIERS = [[5.5, 20.5, 3.3, HD, HD + 2.6], [8, 19, 3.0, HD + 2.6, HD + 5], [12.35, 18.85, 2.7, HD + 5, HD + 7.3]];
  TIERS.forEach(([a, b, h, z0, z1], i) => { const [p, q] = yc(h); const t0 = i / 3;
    mk([a, p, b, q], z0, z0 + .35, 'wext', 3, t0); mk([a + .15, p + .15, b - .15, q - .15], z0 + .35, z1 - .3, 'glz', 3, t0); mk([a - .3, p - .2, b + .1, q + .2], z1 - .3, z1, 'wext', 3, t0); });
  // flybridge: posts + hardtop + sun pads
  const [p4, q4] = yc(2.8);
  mk([15.5, HB - 1.6, 17.6, HB + 1.6], HD + 7.3, HD + 7.7, 'pad', 4, .4);
  mk([10.5, p4, 10.8, p4 + .3], HD + 5, HD + 9.3, 'post', 4, .5); mk([10.5, q4 - .3, 10.8, q4], HD + 5, HD + 9.3, 'post', 4, .5);
  mk([10.3, p4 - .1, 18.3, q4 + .1], HD + 9.3, HD + 9.55, 'wext', 4, .6);
  const mast = el('path', { class: 'mast', d: `M${iso(15, HB, HD + 9.55)} L${iso(15, HB, HD + 11.4)} M${iso(15, HB - 1.2, HD + 10.7)} L${iso(15, HB + 1.2, HD + 10.7)}` }, layer);
  const [dx, dy] = iso(15, HB, HD + 11.6); const dome = el('circle', { class: 'dome', cx: dx, cy: dy, r: 9 }, layer);
  return { items, sides, frameEls, deck, keel, mast, dome, sea, wake };
}
function updateIso(St, p, tr) { // p: 0..1 within Build, tr: 0..1 within Sea trials
  const ph = [sm(seg(p, 0, .16)), sm(seg(p, .12, .36)), sm(seg(p, .32, .58)), sm(seg(p, .55, .82)), sm(seg(p, .78, 1))];
  const lift = DWL * sm(tr);                       // in trials the waterline settles onto the sea plane
  St.keel.style.opacity = ph[0] * (1 - ph[2]); St.keel.style.strokeDashoffset = 1 - ph[0];
  // frames rising
  St.frameEls.forEach((fe, i) => { const m = 1.5 + i * 2.1, u = m / HL, w = HB * planF(u), z = HD * ph[1];
    const k = sm(seg(ph[1], i * .05, i * .05 + .4)); fe.style.opacity = k * (1 - ph[2] * .85);
    fe.setAttribute('d', `M${iso(m, HB - w, z * k)} Q${iso(m, HB - w * .3, 0)} ${iso(m, HB, 0)} Q${iso(m, HB + w * .3, 0)} ${iso(m, HB + w, z * k)}`); });
  // hull plating extrudes
  const zt = HD * Math.max(.02, ph[2]); const z0 = lift;
  const bot = ring(.35 + .55 * sm(tr), z0 - lift), top = ring(1, zt);
  const vis = ph[2] > .01; const shift = (P) => [P[0], P[1], P[2] - lift];
  const quads = [];
  for (let i = 0; i < bot.length - 1; i++) { const q = [bot[i], bot[i + 1], top[i + 1], top[i]].map(P => iso(...shift(P)));
    const area = q.reduce((s, a, j) => { const b = q[(j + 1) % 4]; return s + a[0] * b[1] - b[0] * a[1]; }, 0);
    quads.push({ q, area, d: bot[i][0] + bot[i][1] }); }
  St.sides.forEach((s, i) => { const Q = quads[i]; if (!Q || !vis || Q.area < 0) { s.setAttribute('points', ''); return; } s.setAttribute('points', pts(Q.q)); s.style.opacity = Math.min(1, ph[2] * 2); });
  St.deck.setAttribute('points', vis ? pts(top.map(P => iso(...shift(P)))) : ''); St.deck.style.opacity = sm(seg(ph[2], .6, 1));
  St.items.forEach(it => { const k = sm(seg(ph[it.phase], it.t0 * .8, it.t0 * .8 + .45)); it.gg.style.opacity = k > .001 ? Math.min(1, k * 3) : 0;
    const z1 = it.z0 + (it.z1 - it.z0) * Math.max(k, .02);
    const f = prism(it.m, it.z0 - lift, Math.max(it.z0 + .01, z1) - lift); it.f.top.setAttribute('points', f.top); it.f.s.setAttribute('points', f.s); it.f.e.setAttribute('points', f.e); });
  const mk = sm(seg(ph[4], .55, 1)); St.mast.style.opacity = mk; St.dome.style.opacity = mk;
  St.mast.setAttribute('transform', `translate(0 ${lift * K})`); St.dome.setAttribute('transform', `translate(0 ${lift * K})`);
  St.sea.style.opacity = .15 * ph[4] + .85 * sm(seg(tr, 0, .3));
  St.keel.setAttribute('transform', `translate(0 ${lift * K})`);
  return ph;
}

export function setupProcess() {
  const svg = document.getElementById('prSvg'); buildSVG(svg);
  const St = buildIso(svg.querySelector('.L-build'));
  const q = s => gsap.utils.toArray(svg.querySelectorAll(s));
  const draws = q('.contour, .sunpath, .wind, .sketch, .hl-out, .hl-wl, .hl-st, .hl-cl, .pf-sup, .fu, .door, .winl, .dim[pathLength], .cut, .lead, .dline, .gz, .wk, .iso-keel');
  gsap.set(draws, { strokeDasharray: 1, strokeDashoffset: 1 });
  const panels = gsap.utils.toArray('.pp'); const railLis = [...document.querySelectorAll('#rail li')];
  panels.forEach(pn => pn.querySelectorAll('h3, .body').forEach(e => { e.innerHTML = e.textContent.split(' ').map(w => `<span class="w"><span class="wi">${w}</span></span>`).join(' '); }));
  gsap.set(panels, { autoAlpha: 0 }); gsap.set(svg.querySelectorAll('.L-detail .det, .L-detail .callc'), { autoAlpha: 0 });
  // phases + swatches share one reserved strip under the drawing; both start hidden (fixes early phases + overlap)
  gsap.set('.phases', { autoAlpha: 0 }); gsap.set('.sw', { autoAlpha: 0 }); gsap.set('.L-trials', { autoAlpha: 0 });
  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  panels.forEach((pn, i) => {
    const words = pn.querySelectorAll('.wi'), chips = pn.querySelectorAll('.chips span'), lis = pn.querySelectorAll('.dl li'), checks = pn.querySelectorAll('.dl path');
    gsap.set(checks, { strokeDasharray: 1, strokeDashoffset: 1 });
    tl.set(pn, { autoAlpha: 1 }, i);
    tl.fromTo(words, { yPercent: 110 }, { yPercent: 0, stagger: .008, duration: .18, ease: 'power3.out', immediateRender: false }, i + .02)
      .fromTo(chips, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, stagger: .03, duration: .1, immediateRender: false }, i + .12)
      .fromTo(lis, { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, stagger: .05, duration: .1, immediateRender: false }, i + .2)
      .to(checks, { strokeDashoffset: 0, stagger: .12, duration: .12 }, i + .35);
    if (i < ACTS - 1) tl.to(pn, { autoAlpha: 0, y: -20, duration: .08 }, i + .92).set(pn, { y: 0 }, i + 1);
  });
  // ---- Act 1: Concept
  tl.to(q('.contour'), { strokeDashoffset: 0, stagger: .04, duration: .35 }, 0)
    .fromTo(q('.L-listen .tree'), { scale: 0, transformOrigin: 'center', transformBox: 'fill-box' }, { scale: 1, stagger: .04, duration: .15, ease: 'back.out(2)', immediateRender: false }, .15)
    .to(q('.sunpath'), { strokeDashoffset: 0, duration: .45 }, .2)
    .to(q('.wind'), { strokeDashoffset: 0, stagger: .05, duration: .2 }, .4)
    .fromTo(q('.L-listen .note'), { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, stagger: .08, duration: .1 }, .45)
    .fromTo('.axes', { autoAlpha: 0 }, { autoAlpha: 1, duration: .2 }, .6)
    .to('.L-listen', { autoAlpha: .2, duration: .15 }, 1.05);
  // ---- Act 2: Hull lines
  tl.to(q('.sketch'), { strokeDashoffset: 0, stagger: .02, duration: .3 }, 1)
    .fromTo('.plan .floor, .pf-hull', { autoAlpha: 0 }, { autoAlpha: 1, duration: .15 }, 1.25)
    .to(q('.hl-out, .hl-cl'), { strokeDashoffset: 0, duration: .2 }, 1.22)
    .to(q('.hl-wl, .hl-st'), { strokeDashoffset: 0, stagger: .008, duration: .25 }, 1.3)
    .to('.L-draw .sketch', { autoAlpha: .12, duration: .15 }, 1.42)
    .to(q('.pf-sup'), { strokeDashoffset: 0, stagger: .04, duration: .2 }, 1.42)
    .fromTo('.wallsE, .wallsI', { autoAlpha: 0 }, { autoAlpha: 1, duration: .12 }, 1.5)
    .to('.hlines .hl-wl, .hlines .hl-st', { autoAlpha: .35, duration: .1 }, 1.55)
    .to(q('.door, .winl'), { strokeDashoffset: 0, stagger: .01, duration: .15 }, 1.52)
    .fromTo('.wins .winf', { autoAlpha: 0 }, { autoAlpha: 1, duration: .1 }, 1.52)
    .to(q('.fu'), { strokeDashoffset: 0, stagger: .006, duration: .25 }, 1.56)
    .fromTo('.rooms text', { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, stagger: .015, duration: .1 }, 1.66)
    .to(q('.dims .dim[pathLength], .cut'), { strokeDashoffset: 0, stagger: .03, duration: .2 }, 1.62)
    .fromTo('.dims .dim:not([pathLength]), .dimt, .section circle, .section text', { autoAlpha: 0 }, { autoAlpha: 1, duration: .1 }, 1.72)
    .fromTo('.meta > g > g', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, stagger: .04, duration: .12 }, 1.74);
  // ---- Act 3: Naval engineering
  tl.to('.meta .north, .meta .scale, .meta .tblock', { autoAlpha: 0, duration: .08 }, 2)
    .to('.plan, .dims, .section, .axes', { scale: .92, x: -10, transformOrigin: '40% 50%', duration: .2 }, 2)
    .fromTo(q('.callc'), { autoAlpha: 0, scale: 0, transformOrigin: 'center', transformBox: 'fill-box' }, { autoAlpha: 1, scale: 1, stagger: .08, duration: .12, ease: 'back.out(2)', immediateRender: false }, 2.12)
    .to(q('.lead'), { strokeDashoffset: 0, stagger: .08, duration: .18 }, 2.22)
    .fromTo(q('.det'), { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, stagger: .1, duration: .16, immediateRender: false }, 2.3)
    .to(q('.dline, .gz'), { strokeDashoffset: 0, stagger: .02, duration: .22 }, 2.4)
    .fromTo('.sw', { autoAlpha: 0, y: 30, rotate: (i) => [-4, 3, -2, 4][i] }, { autoAlpha: 1, y: 0, rotate: 0, stagger: .06, duration: .16, ease: 'back.out(1.6)', immediateRender: false }, 2.45)
    .to('.sw', { autoAlpha: 0, y: 20, duration: .08, stagger: .02 }, 2.86)
    .to('.L-detail', { autoAlpha: 0, duration: .08 }, 2.95);
  // ---- Act 4: Build (phases appear only now)
  tl.to('.plan, .dims, .section, .axes, .L-listen, .L-draw', { autoAlpha: 0, duration: .12 }, 3)
    .fromTo('.L-build', { autoAlpha: 0 }, { autoAlpha: 1, duration: .08, immediateRender: false }, 3)
    .fromTo('.phases', { autoAlpha: 0 }, { autoAlpha: 1, duration: .08, immediateRender: false }, 3.04)
    .to('.phases', { autoAlpha: 0, duration: .08 }, 3.94);
  // ---- Act 5: Sea trials
  tl.fromTo('.L-trials', { autoAlpha: 0 }, { autoAlpha: 1, duration: .12, immediateRender: false }, 4.05)
    .to(q('.wk'), { strokeDashoffset: 0, stagger: .03, duration: .35 }, 4.25)
    .to({}, { duration: 1 }, 4);
  const arc = svg.querySelector('#sunArc'), dot = svg.querySelector('#sunDot'); const arcLen = arc.getTotalLength();
  svg.querySelectorAll('.sunlab').forEach(t => { const pt = arc.getPointAtLength(arcLen * +t.dataset.t); t.setAttribute('x', pt.x + 14); t.setAttribute('y', pt.y - 16); });
  const phaseEls = [...document.querySelectorAll('#phases span')];
  let lastStep = -1;
  const numStrip = document.querySelector('.pr-num .strip'), railFill = document.getElementById('railFill');
  const prX = document.getElementById('prX'), prY = document.getElementById('prY'), prZ = document.getElementById('prZ');
  const gFill = svg.querySelector('#gFill'), gNeedle = svg.querySelector('#gNeedle'), gVal = svg.querySelector('#gVal');
  const tlx = ['#tl1', '#tl2', '#tl3', '#tl4'].map(s => svg.querySelector(s));
  gsap.set(gFill, { strokeDasharray: 1, strokeDashoffset: 1 });
  const update = (P) => { // P in 0..5
    const pt = arc.getPointAtLength(arcLen * seg(P, .2, .95)); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); dot.style.opacity = P < 1.1 ? 1 : 0;
    const tr = seg(P, 4.05, 4.6);
    const ph = updateIso(St, seg(P, 3.05, 3.92), tr); phaseEls.forEach((e, i) => { e.classList.toggle('on', P > 3.02 && ph[i] > .02); e.style.setProperty('--k', ph[i]); });
    const kn = 14.6 * sm(seg(P, 4.2, 4.85)); gVal.textContent = kn.toFixed(1); gFill.style.strokeDashoffset = 1 - kn / 18; gNeedle.setAttribute('transform', `rotate(${-90 + kn / 18 * 180})`);
    tlx[0].textContent = 'RPM ' + Math.round(kn / 14.6 * 1850); tlx[1].textContent = 'Fuel ' + Math.round(Math.pow(kn / 14.6, 2.6) * 162) + ' L/h';
    tlx[2].textContent = 'Noise saloon ' + (kn > .1 ? (38 + kn * .7).toFixed(0) : '—') + ' dB(A)'; tlx[3].textContent = 'Roll ' + (kn > .1 ? (2.4 - kn * .06).toFixed(1) + '°' : '—');
    const step = Math.min(ACTS - 1, Math.floor(P)); const roll = Math.min(ACTS - 1, Math.max(0, P - .5)); const snapped = Math.floor(roll) + sm(seg(roll % 1, .0, 1) > .85 ? (roll % 1 - .85) / .15 : 0);
    numStrip.style.transform = `translateY(${-snapped * (100 / ACTS)}%)`;
    railFill.style.transform = innerWidth < 900 ? `scaleX(${P / ACTS})` : `scaleY(${P / ACTS})`; if (step !== lastStep) { lastStep = step; railLis.forEach((li, i) => { li.classList.toggle('on', i === step); li.classList.toggle('done', i < step); const b = li.firstElementChild; if (i === step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); }); }
    prX.textContent = 'X ' + (P * 6).toFixed(2).padStart(6, '0') + ' m'; prY.textContent = 'Y ' + (HB - P * .8).toFixed(2).padStart(6, '0') + ' m';
    prZ.textContent = ['SEA STATE', 'LINES 1:100', 'SECTION 1:50', 'AXO 1:200', 'TRIALS'][step];
  };
  const st = ScrollTrigger.create({ trigger: '.process', pin: '.pr-pin', start: 'top top', end: () => '+=' + innerHeight * 6, scrub: .6, animation: tl,
    onUpdate: () => update(tl.time()) });
  update(0); let lastTT = -1; gsap.ticker.add(() => { if (st.isActive && tl.time() !== lastTT) { lastTT = tl.time(); update(lastTT); } });
  const rmq = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('#rail button').forEach((b, i) => b.addEventListener('click', () => window.__lenis.scrollTo(st.start + (st.end - st.start) * (i + .45) / ACTS, { duration: 1.4, immediate: rmq })));
  gsap.from('.pr-head > *', { y: 30, autoAlpha: 0, stagger: .1, duration: 1, scrollTrigger: { trigger: '.process', start: 'top 80%' } });
}
