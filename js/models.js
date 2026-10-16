// Modelos low-poly hechos con primitivas (sin archivos externos).
const T = THREE;
const MATS = {}, GEOS = {};
export function mat(c, o = {}) {
  const k = c + '|' + JSON.stringify(o);
  return MATS[k] || (MATS[k] = new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .75, metalness: 0, flatShading: true }, o)));
}
export const GOLD = { metalness: .6, roughness: .35, emissive: '#3a2a00' };
export const ORO = '#f2c14e', SKIN = '#c98e5a';
export function geo(k, f) { return GEOS[k] || (GEOS[k] = f()); }
export function mesh(g, m, sh = true) { const o = new T.Mesh(g, m); o.castShadow = sh; o.receiveShadow = true; return o; }
export const box = (w, h, d, c, o) => mesh(geo(`b${w},${h},${d}`, () => new T.BoxGeometry(w, h, d)), mat(c, o));
export const cyl = (rt, rb, h, s, c, o) => mesh(geo(`c${rt},${rb},${h},${s}`, () => new T.CylinderGeometry(rt, rb, h, s)), mat(c, o));
export const sph = (r, c, o, s = 8) => mesh(geo(`s${r},${s}`, () => new T.SphereGeometry(r, s, Math.max(4, s * .75 | 0))), mat(c, o));
export const cone = (r, h, s, c, o) => mesh(geo(`k${r},${h},${s}`, () => new T.ConeGeometry(r, h, s)), mat(c, o));
export function at(o, x, y, z) { o.position.set(x, y, z); return o; }
const dark = c => '#' + new T.Color(c).multiplyScalar(.55).getHexString();

export const PAL = {
  caporal: ['#e2447a', '#3a7bd5', '#2f9e6a', '#7b3fbf', '#d4a017'],
  diablo: ['#c0202a', '#6b2fa8', '#1f7a4a', '#2a2a2a', '#d4a017'],
};
export const PAL_NAMES = {
  caporal: ['Rosa altiplano', 'Azul Titicaca', 'Verde puna', 'Morado vigilia', 'Oro devoto'],
  diablo: ['Rojo Supay', 'Morado inframundo', 'Verde serpiente', 'Negro azufre', 'Oro devoto'],
};
export const COSTS = [0, 8, 15, 25, null]; // el último se gana con racha de 7 días

/* ---------------- personajes ---------------- */
export function makeCaporal(col) {
  const G = new T.Group(), body = new T.Group(); G.add(body); const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const hip = at(new T.Group(), s * .13, .9, 0);
    hip.add(at(box(.16, .6, .18, '#1e1a2e'), 0, -.32, 0));
    hip.add(at(box(.21, .26, .28, '#f4ecdc'), 0, -.74, .03));
    for (let k = 0; k < 3; k++) hip.add(at(sph(.045, ORO, GOLD, 6), s * .11, -.78 + k * .08, -.05 + k * .05));
    body.add(hip); legs.push(hip);
  }
  body.add(at(box(.5, .56, .3, col), 0, 1.18, 0));
  body.add(at(box(.52, .06, .32, ORO, GOLD), 0, 1.44, 0)); body.add(at(box(.52, .06, .32, ORO, GOLD), 0, .92, 0));
  body.add(at(box(.08, .5, .02, ORO, GOLD), 0, 1.18, .16));
  for (const s of [-1, 1]) body.add(at(box(.18, .12, .36, ORO, GOLD), s * .34, 1.42, 0));
  for (const s of [-1, 1]) { const sh = at(new T.Group(), s * .33, 1.36, 0); sh.add(at(box(.13, .44, .14, col), 0, -.22, 0)); sh.add(at(sph(.07, SKIN), 0, -.47, 0)); body.add(sh); arms.push(sh); }
  body.add(at(sph(.15, SKIN), 0, 1.6, 0));
  body.add(at(cyl(.34, .34, .03, 14, '#15111f'), 0, 1.73, 0));
  body.add(at(cyl(.15, .17, .2, 12, '#15111f'), 0, 1.84, 0));
  body.add(at(cyl(.175, .175, .04, 12, ORO, GOLD), 0, 1.77, 0));
  G.userData = { legs, arms, body };
  return G;
}

export function makeDiablo(col) {
  const G = new T.Group(), body = new T.Group(); G.add(body); const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const hip = at(new T.Group(), s * .14, .9, 0);
    hip.add(at(box(.17, .6, .19, '#20141e'), 0, -.32, 0));
    hip.add(at(box(.22, .24, .3, '#3a2214'), 0, -.76, .03));
    body.add(hip); legs.push(hip);
  }
  body.add(at(box(.62, .26, .38, col), 0, .86, 0));
  body.add(at(box(.64, .05, .4, ORO, GOLD), 0, .73, 0));
  body.add(at(box(.54, .56, .32, col), 0, 1.2, 0));
  body.add(at(box(.38, .3, .02, ORO, GOLD), 0, 1.24, .17));
  for (const s of [-1, 1]) body.add(at(box(.22, .12, .38, ORO, GOLD), s * .36, 1.44, 0));
  const cape = at(box(.66, .95, .04, dark(col)), 0, 1.0, -.2); body.add(cape);
  for (const s of [-1, 1]) { const sh = at(new T.Group(), s * .35, 1.36, 0); sh.add(at(box(.14, .44, .15, col), 0, -.22, 0)); sh.add(at(sph(.08, '#d6453d'), 0, -.47, 0)); body.add(sh); arms.push(sh); }
  const head = at(new T.Group(), 0, 1.66, 0); body.add(head);
  const face = sph(.22, '#d6453d', {}, 10); face.scale.set(1, 1.05, .85); head.add(face);
  for (const s of [-1, 1]) {
    head.add(at(sph(.065, '#ffffff', { emissive: '#ffffaa', emissiveIntensity: .3 }, 6), s * .09, .04, .17));
    head.add(at(sph(.03, '#111111', {}, 5), s * .09, .04, .225));
    const h = cone(.05, .32, 6, ORO, GOLD); h.position.set(s * .15, .24, 0); h.rotation.z = -s * .5; head.add(h);
    const sn = cone(.035, .2, 5, '#2b8a3a'); sn.position.set(s * .07, .27, .06); sn.rotation.z = -s * .2; head.add(sn);
  }
  head.add(at(box(.18, .05, .04, '#ffffff'), 0, -.1, .18));
  G.userData = { legs, arms, body, head, cape };
  return G;
}

export function makeCholita(col, shawl = '#6b3b8a', o = {}) {
  const hair = o.hair || '#151515', hat = o.hat || '#2b2b2b';
  const G = new T.Group(), body = new T.Group(); G.add(body);
  const inner = new T.Group(); inner.scale.setScalar(o.scale || 1.3); body.add(inner);
  inner.add(at(cyl(.2, .46, .62, 9, col), 0, .31, 0));
  inner.add(at(cyl(.47, .47, .05, 9, ORO, GOLD), 0, .05, 0));
  inner.add(at(cyl(.15, .2, .36, 7, shawl), 0, .8, 0));
  const arms = [];
  for (const s of [-1, 1]) { const sh = at(new T.Group(), s * .19, .95, 0); sh.add(at(box(.1, .34, .1, shawl), 0, -.17, 0)); sh.add(at(sph(.055, SKIN), 0, -.36, 0)); inner.add(sh); arms.push(sh); }
  inner.add(at(sph(.13, SKIN), 0, 1.06, 0));
  inner.add(at(cyl(.2, .2, .02, 10, hat), 0, 1.16, 0)); inner.add(at(sph(.1, hat, {}, 8), 0, 1.2, 0));
  for (const s of [-1, 1]) inner.add(at(box(.04, .45, .04, hair), s * .1, .85, -.1));
  G.userData = { body, arms, legs: [] };
  return G;
}

export function makeMan(o = {}) {
  const shirt = o.shirt || '#3a7bd5', pants = o.pants || '#2a2a3a';
  const G = new T.Group(), body = new T.Group(); G.add(body); const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const hip = at(new T.Group(), s * .12, .9, 0);
    hip.add(at(box(.16, .62, .18, pants), 0, -.32, 0)); hip.add(at(box(.18, .12, .26, '#1a1a1a'), 0, -.68, .03));
    body.add(hip); legs.push(hip);
  }
  body.add(at(box(.46, .56, .28, shirt), 0, 1.18, 0));
  if (o.poncho) { body.add(at(box(.66, .52, .4, o.poncho), 0, 1.22, 0)); body.add(at(box(.67, .06, .41, ORO), 0, 1.1, 0)); }
  if (o.uniform) { body.add(at(box(.47, .05, .29, ORO, GOLD), 0, 1.0, 0)); body.add(at(box(.05, .45, .02, ORO, GOLD), 0, 1.2, .15)); }
  const sleeve = o.poncho || shirt;
  for (const s of [-1, 1]) { const sh = at(new T.Group(), s * .3, 1.36, 0); sh.add(at(box(.12, .44, .13, sleeve), 0, -.22, 0)); sh.add(at(sph(.065, SKIN), 0, -.46, 0)); body.add(sh); arms.push(sh); }
  body.add(at(sph(.15, SKIN), 0, 1.6, 0));
  if (o.mustache) body.add(at(box(.12, .03, .03, o.gray ? '#d8d8d8' : '#222'), 0, 1.55, .14));
  if (o.gray) body.add(at(box(.3, .07, .22, '#cfcfcf'), 0, 1.7, -.03));
  const hc = o.hatColor;
  if (o.hat === 'chullo') { body.add(at(cone(.17, .32, 8, hc || '#c0392b'), 0, 1.83, 0)); body.add(at(sph(.05, ORO, {}, 6), 0, 2.0, 0)); for (const s of [-1, 1]) body.add(at(box(.05, .18, .1, hc || '#c0392b'), s * .14, 1.6, 0)); }
  if (o.hat === 'fedora') { body.add(at(cyl(.3, .3, .03, 12, hc || '#2a2a2a'), 0, 1.72, 0)); body.add(at(cyl(.15, .17, .17, 12, hc || '#2a2a2a'), 0, 1.81, 0)); }
  if (o.hat === 'cap') { body.add(at(cyl(.16, .16, .12, 10, hc || '#ffffff'), 0, 1.74, 0)); body.add(at(box(.2, .03, .16, hc || '#ffffff'), 0, 1.69, .15)); }
  if (o.item) { const t = makeInstrument(o.item); t.scale.setScalar(.55); t.position.set(0, -.45, .15); arms[1].add(t); }
  G.userData = { legs, arms, body };
  return G;
}

export function makeDog(col = '#8a6a4a') {
  const G = new T.Group(), body = new T.Group(); G.add(body);
  body.add(at(box(.32, .3, .72, col), 0, .52, 0));
  const head = at(new T.Group(), 0, .7, .42); body.add(head);
  head.add(box(.26, .24, .26, col)); head.add(at(box(.16, .12, .18, dark(col)), 0, -.04, .18)); head.add(at(sph(.035, '#111111', {}, 5), 0, 0, .28));
  for (const s of [-1, 1]) head.add(at(cone(.06, .14, 4, dark(col)), s * .09, .17, -.02));
  const legs = [];
  for (const [x, z] of [[-.1, .26], [.1, .26], [-.1, -.26], [.1, -.26]]) { const l = at(new T.Group(), x, .4, z); l.add(at(box(.08, .4, .08, col), 0, -.2, 0)); body.add(l); legs.push(l); }
  const tail = at(box(.05, .05, .32, col), 0, .66, -.44); tail.rotation.x = .7; body.add(tail);
  const mouth = at(new T.Group(), 0, -.06, .3); head.add(mouth);
  G.userData = { legs, body, tail, mouth, head };
  return G;
}
export function makeMiniMask() {
  const G = new T.Group();
  const f = sph(.16, '#d6453d', {}, 8); f.scale.z = .7; G.add(f);
  for (const s of [-1, 1]) { G.add(at(sph(.04, '#ffffff', {}, 5), s * .06, .03, .1)); const h = cone(.035, .2, 5, ORO, GOLD); h.position.set(s * .1, .16, 0); h.rotation.z = -s * .5; G.add(h); }
  return G;
}

/* ---------------- vehículos y objetos ---------------- */
export function makeMototaxi(col = '#c0392b') {
  const G = new T.Group();
  const wg = geo('wheel', () => { const g = new T.CylinderGeometry(.32, .32, .16, 12); g.rotateZ(Math.PI / 2); return g; });
  const wm = mat('#151515'); const wheels = [];
  for (const p of [[0, .32, 1.15], [-.62, .32, -.55], [.62, .32, -.55]]) { const w = mesh(wg, wm); w.position.set(...p); G.add(w); wheels.push(w); }
  G.add(at(box(.3, .5, .9, col), 0, .6, .75));
  G.add(at(box(.08, .7, .08, '#888888'), 0, .8, 1.12));
  G.add(at(box(.7, .06, .06, '#222222'), 0, 1.15, 1.0));
  G.add(at(box(1.5, .5, 1.3, col), 0, .75, -.45));
  G.add(at(box(1.62, .08, 1.32, ORO, GOLD), 0, .95, -.45));
  G.add(at(box(1.3, .18, .6, '#3a2a20'), 0, 1.05, -.6));
  G.add(at(box(.36, .14, .5, '#222222'), 0, 1.0, .45));
  G.add(at(box(1.6, .08, 2.3, '#e8e2d0'), 0, 2.05, -.05));
  for (const x of [-.75, .75]) for (const z of [-1.05, .95]) G.add(at(box(.05, 1.05, .05, '#555555'), x, 1.52, z));
  G.add(at(box(1.6, .6, .04, col), 0, 1.75, -1.1));
  G.add(at(sph(.1, '#ffffff', { emissive: '#fff6d0', emissiveIntensity: 1.2 }), 0, .95, 1.22));
  G.userData = { wheels };
  return G;
}

export function makeInstrument(id) {
  const G = new T.Group();
  switch (id) {
    case 'bombo': { const d = cyl(.45, .45, .38, 14, '#d6453d'); d.rotation.x = Math.PI / 2; G.add(d); for (const s of [-1, 1]) { const f = cyl(.42, .42, .02, 14, '#e8d8b8'); f.rotation.x = Math.PI / 2; f.position.z = s * .2; G.add(f); } break; }
    case 'trompeta': { const t = cyl(.04, .04, .8, 6, ORO, GOLD); t.rotation.z = Math.PI / 2; G.add(t); const b = cone(.18, .3, 10, ORO, GOLD); b.rotation.z = Math.PI / 2; b.position.x = -.5; G.add(b); G.add(at(box(.15, .12, .08, ORO, GOLD), .05, .08, 0)); break; }
    case 'platillos': for (const s of [-1, 1]) { const p = cyl(.35, .35, .03, 14, ORO, GOLD); p.rotation.x = Math.PI / 2.3; p.position.set(s * .25, 0, 0); G.add(p); } break;
    case 'tuba': { const tr = mesh(geo('tor', () => new T.TorusGeometry(.28, .07, 6, 12)), mat(ORO, GOLD)); G.add(tr); const b = cone(.22, .35, 10, ORO, GOLD); b.position.set(.25, .35, 0); G.add(b); break; }
    case 'matraca': G.add(box(.5, .35, .3, '#8a5a2e')); G.add(at(box(.08, .4, .08, '#5a3a1e'), 0, -.35, 0)); G.add(at(box(.52, .06, .32, ORO, GOLD), 0, .12, 0)); break;
    case 'zampona': for (let k = 0; k < 6; k++) G.add(at(cyl(.05, .05, .9 - k * .1, 6, '#d9b56b'), -.3 + k * .11, -(k * .05), 0)); G.add(at(box(.7, .06, .12, '#e2447a'), -.02, .05, 0)); break;
  }
  return G;
}

export function makeCascabel() {
  const G = new T.Group();
  const m = mat(ORO, { metalness: .8, roughness: .2, emissive: '#7a5400', emissiveIntensity: .8 });
  for (let k = 0; k < 3; k++) { const s = mesh(geo('casc', () => new T.SphereGeometry(.17, 10, 8)), m); s.position.set(Math.cos(k * 2.09) * .2, Math.sin(k * 2.09) * .2, 0); G.add(s); }
  const ring = mesh(geo('cring', () => new T.TorusGeometry(.12, .03, 6, 12)), m); ring.position.y = .34; G.add(ring);
  return G;
}

let bordTex = null;
export function makeBordado() {
  if (!bordTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#e2447a'; x.fillRect(0, 0, 128, 128);
    x.strokeStyle = ORO; x.lineWidth = 6; x.strokeRect(6, 6, 116, 116);
    for (let i = 0; i < 8; i++) { x.save(); x.translate(64, 64); x.rotate(i * Math.PI / 4); x.fillStyle = i % 2 ? '#ffd6e5' : ORO; x.beginPath(); x.ellipse(0, -26, 9, 20, 0, 0, 7); x.fill(); x.restore(); }
    x.fillStyle = '#7a1f45'; x.beginPath(); x.arc(64, 64, 12, 0, 7); x.fill(); x.fillStyle = ORO; x.beginPath(); x.arc(64, 64, 6, 0, 7); x.fill();
    bordTex = new T.CanvasTexture(c);
  }
  const m = new T.Mesh(geo('bordp', () => new T.PlaneGeometry(.9, .9)), new T.MeshStandardMaterial({ map: bordTex, side: T.DoubleSide, emissive: '#ff6aa0', emissiveIntensity: .35, emissiveMap: bordTex }));
  const G = new T.Group(); G.add(m); return G;
}

export function makeBeacon(color = '#f2c14e', h = 34) {
  const G = new T.Group();
  const m1 = new T.Mesh(geo(`bc${h}`, () => new T.CylinderGeometry(1, 1, h, 16, 1, true)), new T.MeshBasicMaterial({ color, transparent: true, opacity: .2, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
  m1.position.y = h / 2; G.add(m1);
  const m2 = new T.Mesh(geo(`bci${h}`, () => new T.CylinderGeometry(.28, .28, h, 8, 1, true)), new T.MeshBasicMaterial({ color, transparent: true, opacity: .55, blending: T.AdditiveBlending, depthWrite: false }));
  m2.position.y = h / 2; G.add(m2);
  const ring = new T.Mesh(geo('bcr', () => new T.RingGeometry(1.25, 1.65, 32)), new T.MeshBasicMaterial({ color, transparent: true, opacity: .75, side: T.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .07; G.add(ring); G.userData.ring = ring;
  return G;
}
export function makeRingCP() {
  return new T.Mesh(geo('cp', () => new T.TorusGeometry(3.4, .28, 8, 28)), new T.MeshBasicMaterial({ color: ORO, transparent: true, opacity: .85 }));
}

/* ---------------- poses ---------------- */
export function poseReset(m) {
  const u = m.userData;
  (u.legs || []).forEach(l => l.rotation.set(0, 0, 0));
  (u.arms || []).forEach(a => a.rotation.set(0, 0, 0));
  u.body.position.y = 0; u.body.rotation.set(0, 0, 0);
}
export function poseWalk(m, ph, amp = .7) {
  const u = m.userData;
  if (u.legs && u.legs.length === 2) { u.legs[0].rotation.set(Math.sin(ph) * amp, 0, 0); u.legs[1].rotation.set(-Math.sin(ph) * amp, 0, 0); }
  if (u.arms && u.arms.length) { u.arms[0].rotation.set(-Math.sin(ph) * amp * .8, 0, 0); u.arms[1].rotation.set(Math.sin(ph) * amp * .8, 0, 0); }
  u.body.position.y = Math.abs(Math.sin(ph)) * .05 * amp;
  u.body.rotation.set(0, 0, u.legs && u.legs.length ? 0 : Math.sin(ph) * .07 * amp);
}
export function poseIdle(m, t) {
  poseReset(m); const u = m.userData;
  u.body.position.y = Math.sin(t * 2) * .012;
  if (u.arms && u.arms.length) { u.arms[0].rotation.z = -.08; u.arms[1].rotation.z = .08; }
}
export function poseDance(m, beat, sway = 0) {
  const u = m.userData; const p = beat % 1, up = Math.sin(p * Math.PI), side = Math.floor(beat) % 2;
  if (u.legs && u.legs.length === 2) { u.legs[0].rotation.set(side ? -up * 1.1 : 0, 0, 0); u.legs[1].rotation.set(side ? 0 : -up * 1.1, 0, 0); }
  if (u.arms && u.arms.length) { u.arms[0].rotation.set(0, 0, -.4 - up * .6); u.arms[1].rotation.set(0, 0, .4 + up * .6); }
  u.body.position.y = up * .18; u.body.rotation.set(0, Math.sin(beat * Math.PI) * .25 * sway, u.legs && u.legs.length ? 0 : Math.sin(beat * Math.PI) * .12);
}
export function poseKick(m, lane, k) {
  poseReset(m); const u = m.userData; const a = Math.sin(Math.min(1, k) * Math.PI); const L = u.legs || [], A = u.arms || [];
  if (A.length) { A[0].rotation.z = -.4; A[1].rotation.z = .4; }
  if (lane === 0) { if (L[0]) L[0].rotation.z = -a * .9; if (A[0]) A[0].rotation.z = -1.6 * a - .4; }
  if (lane === 3) { if (L[1]) L[1].rotation.z = a * .9; if (A[1]) A[1].rotation.z = 1.6 * a + .4; }
  if (lane === 1) { u.body.position.y = -a * .15; if (L[0]) L[0].rotation.x = -a * .8; if (L[1]) L[1].rotation.x = -a * .8; }
  if (lane === 2) { u.body.position.y = a * .5; if (A[0]) A[0].rotation.z = -2.4 * a; if (A[1]) A[1].rotation.z = 2.4 * a; }
}
export function poseJump(m) {
  poseReset(m); const u = m.userData;
  if (u.legs && u.legs.length === 2) { u.legs[0].rotation.x = -1; u.legs[1].rotation.x = .4; }
  if (u.arms && u.arms.length) { u.arms[0].rotation.z = -2.4; u.arms[1].rotation.z = 2.4; }
}
export function poseRoar(m, k) {
  poseReset(m); const u = m.userData;
  if (u.arms && u.arms.length) { u.arms[0].rotation.z = -2.2; u.arms[1].rotation.z = 2.2; u.arms[0].rotation.x = -.5; u.arms[1].rotation.x = -.5; }
  u.body.rotation.x = -.15 * Math.sin(k * Math.PI);
}
export function poseSit(m) {
  poseReset(m); const u = m.userData;
  if (u.legs && u.legs.length === 2) { u.legs[0].rotation.x = -1.35; u.legs[1].rotation.x = -1.35; }
  if (u.arms && u.arms.length) { u.arms[0].rotation.x = -1.1; u.arms[1].rotation.x = -1.1; }
}
export function poseWave(m, t) {
  poseIdle(m, t); const u = m.userData;
  if (u.arms && u.arms.length) { u.arms[1].rotation.z = 2.5 + Math.sin(t * 8) * .3; }
}
