// Shared parametric hull (metres). u: 0 = transom, 1 = stem. y: height above keel.
export const HL = 30, HB = 4.1, HD = 3.4, DWL = 1.6;
export function planF(u) { if (u < .55) return .84 + .16 * Math.sin(u / .55 * Math.PI / 2); const t = (u - .55) / .45; return Math.pow(Math.max(0, Math.cos(t * Math.PI / 2)), .8); }
export const keelY = u => u > .7 ? Math.pow((u - .7) / .3, 1.6) * HD * .82 : 0;
export const sheerY = u => HD + .6 * u * u;
export function hb(u, y) { const k = keelY(u), s = sheerY(u); const t = Math.min(1, Math.max(0, (y - k) / Math.max(.01, s - k))); return HB * planF(u) * Math.pow(t, .18 + .4 * u); }
