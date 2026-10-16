// Puno compacto: barrio Laykakota (casa de Rosa), Plaza de Armas y Catedral,
// Jr. Lima peatonal, Parque Pino y su Santuario, avenida al malecón y el muelle del Titicaca.
// Cuadrícula: manzanas de 28 m, calles de 12 m (centros en múltiplos de 40).
import { mat, geo, mesh, box, cyl, sph, cone, at, ORO, GOLD, SKIN, makeCholita, makeMan, poseWalk, poseIdle } from './models.js';
const T = THREE;

export function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function canvasTex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]); t.anisotropy = 4; return t;
}
function boxUV(w, h, d, tw, th) {
  const g = new T.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / tw, uv.getY(i) * dims[f][1] / th); }
  return g;
}
const BAY = { brick: [21, 21, 22, 24], colonial: [18, 16, 28, 32] };
function facadeTex(kind) {
  return canvasTex(256, 256, x => {
    const r = rng(kind === 'brick' ? 3 : 7);
    if (kind === 'brick') {
      x.fillStyle = '#b5603a'; x.fillRect(0, 0, 256, 256);
      for (let row = 0; row < 64; row++) for (let c = 0; c < 17; c++) { const o = (row % 2) * 8; x.fillStyle = `hsl(${14 + r() * 8},${45 + r() * 15}%,${36 + r() * 10}%)`; x.fillRect(c * 16 + o - 8, row * 4, 15, 3); }
    } else {
      x.fillStyle = '#ece3d2'; x.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(0,0,0,${r() * .05})`; x.fillRect(r() * 256, r() * 256, 4, 4); }
      x.fillStyle = 'rgba(0,0,0,.12)'; for (let f = 0; f < 4; f++) x.fillRect(0, f * 64 + 60, 256, 4);
    }
    const [a, b, c, d] = BAY[kind];
    for (let bx = 0; bx < 4; bx++) for (let by = 0; by < 4; by++) {
      const X = bx * 64, Y = by * 64;
      if (kind === 'brick') { x.fillStyle = '#e8e2d6'; x.fillRect(X + a - 3, Y + b - 3, c + 6, d + 6); x.fillStyle = '#1f1a2e'; x.fillRect(X + a, Y + b, c, d); x.fillStyle = '#e8e2d6'; x.fillRect(X + a + c / 2 - 1, Y + b, 2, d); }
      else { x.fillStyle = '#5a3418'; x.fillRect(X + a - 4, Y + b - 4, c + 8, d + 8); x.fillStyle = '#1f1a2e'; x.fillRect(X + a, Y + b, c, d); x.fillStyle = '#7a4a24'; x.fillRect(X + a - 8, Y + b + d + 2, c + 16, 6); for (let k = 0; k < 6; k++) x.fillRect(X + a - 6 + k * 7, Y + b + d - 8, 2, 10); }
    }
  });
}
function winTex(kind, seed) {
  return canvasTex(256, 256, x => {
    x.fillStyle = '#000'; x.fillRect(0, 0, 256, 256); const r = rng(seed); const [a, b, c, d] = BAY[kind];
    for (let bx = 0; bx < 4; bx++) for (let by = 0; by < 4; by++) if (r() < .42) { x.fillStyle = r() < .25 ? '#ff9a6a' : '#ffd27a'; x.fillRect(bx * 64 + a, by * 64 + b, c, d); }
  });
}
function groundTex(kind, rep) {
  return canvasTex(128, 128, x => {
    const r = rng(kind.length * 13 + 1);
    if (kind === 'asfalto') { x.fillStyle = '#3f3852'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(255,255,255,${r() * .05})`; x.fillRect(r() * 128, r() * 128, 2, 2); } }
    if (kind === 'plaza') { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#7a6f8e' : '#6c6182'; x.fillRect(i * 16, j * 16, 16, 16); } }
    if (kind === 'jr') { x.fillStyle = '#8a7e6e'; x.fillRect(0, 0, 128, 128); for (let j = 0; j < 16; j++) for (let i = 0; i < 9; i++) { const o = (j % 2) * 8; x.fillStyle = `hsl(${30 + r() * 10},${12 + r() * 8}%,${40 + r() * 10}%)`; x.fillRect(i * 16 + o - 8 + 1, j * 8 + 1, 14, 6); } }
    if (kind === 'cesped') { x.fillStyle = '#3f6e3f'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 700; i++) { x.fillStyle = `hsl(${95 + r() * 30},${35 + r() * 20}%,${25 + r() * 15}%)`; x.fillRect(r() * 128, r() * 128, 2, 3); } }
    if (kind === 'madera') { for (let j = 0; j < 8; j++) { x.fillStyle = `hsl(28,${35 + r() * 10}%,${30 + r() * 8}%)`; x.fillRect(0, j * 16, 128, 15); } }
    if (kind === 'acera') { x.fillStyle = '#6d6585'; x.fillRect(0, 0, 128, 128); x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 2; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, 128); x.moveTo(0, i * 32); x.lineTo(128, i * 32); x.stroke(); } }
    if (kind === 'patio') { x.fillStyle = '#9c6b4e'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = `hsl(18,${35 + r() * 10}%,${36 + r() * 8}%)`; x.fillRect(i * 32 + 1, j * 32 + 1, 30, 30); } }
  }, rep);
}

/* Cascabeles del mapa: 6 en alturas (caporal), 6 dentro de multitudes (diablo), 12 a la vista */
export const CASC = [
  { id: 'k1', x: 10, z: 10, y: 2.95, req: 'caporal' }, { id: 'k2', x: -10, z: 10, y: 2.95, req: 'caporal' },
  { id: 'k3', x: 10, z: -10, y: 2.95, req: 'caporal' }, { id: 'k4', x: -10, z: -10, y: 2.95, req: 'caporal' },
  { id: 'k5', x: 166, z: -6, y: 2.95, req: 'caporal' }, { id: 'k6', x: 166, z: 46, y: 2.95, req: 'caporal' },
  { id: 'd1', x: 1.5, z: 86, req: 'diablo' }, { id: 'd2', x: -60, z: 60, req: 'diablo' }, { id: 'd3', x: 60, z: 100, req: 'diablo' },
  { id: 'd4', x: 9, z: 168, req: 'diablo' }, { id: 'd5', x: 158, z: -30, req: 'diablo' }, { id: 'd6', x: -100, z: -40, req: 'diablo' },
  { id: 'o1', x: -60, z: -40 }, { id: 'o2', x: -100, z: 40 }, { id: 'o3', x: -140, z: -30 }, { id: 'o4', x: 20, z: 140 },
  { id: 'o5', x: 60, z: -20 }, { id: 'o6', x: 100, z: 60 }, { id: 'o7', x: 140, z: 100 }, { id: 'o8', x: 140, z: -60 },
  { id: 'o9', x: -20, z: 180 }, { id: 'o10', x: 100, z: 180 }, { id: 'o11', x: 206, z: 20 }, { id: 'o12', x: -60, z: 120 },
];
const CLUSTERS = CASC.filter(c => c.req === 'diablo').map(c => [c.x, c.z]);

export function buildWorld() {
  const scene = new T.Scene();
  const SKY = '#2b2752'; scene.background = new T.Color(SKY); scene.fog = new T.Fog(SKY, 55, 150);
  const W = { scene, boxes: [], rings: [], crowds: [], walkers: [], mapRects: [], mapAreas: [] };
  const r = rng(7);

  /* luces */
  const hemi = new T.HemisphereLight('#b4bcff', '#3b2f4f', .95); scene.add(hemi);
  const sun = new T.DirectionalLight('#ffd6b0', .75); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 120 }); sun.shadow.bias = -.0006;
  scene.add(sun, sun.target); W.sun = sun; W.hemi = hemi;
  for (const [x, z, c, i] of [[0, 0, '#ffb35a', .7], [0, 80, '#ffb35a', .6], [0, 160, '#ffd27a', .6], [160, 20, '#9fd0ff', .6], [-115, 0, '#ffb35a', .5]]) { const p = new T.PointLight(c, i, 45); p.position.set(x, 9, z); scene.add(p); }

  /* colisiones con hash espacial */
  const HS = 10, hash = new Map(); let stamp = 0;
  function addBox(x0, x1, z0, z1, h, type = 'solid', group = null) {
    const b = { x0, x1, z0, z1, h, type, group, _s: 0 }; W.boxes.push(b);
    for (let i = Math.floor(x0 / HS); i <= Math.floor(x1 / HS); i++) for (let j = Math.floor(z0 / HS); j <= Math.floor(z1 / HS); j++) { const k = i + ',' + j; if (!hash.has(k)) hash.set(k, []); hash.get(k).push(b); }
    return b;
  }
  function query(x, z, rad) {
    stamp++; const out = [];
    for (let i = Math.floor((x - rad) / HS); i <= Math.floor((x + rad) / HS); i++) for (let j = Math.floor((z - rad) / HS); j <= Math.floor((z + rad) / HS); j++) {
      const L = hash.get(i + ',' + j); if (L) for (const b of L) if (b._s !== stamp) { b._s = stamp; out.push(b); }
    }
    return out;
  }
  W.addBox = addBox;
  W.blocked = (x, z, y, rad) => {
    for (const b of query(x, z, rad)) {
      if (b.type === 'crowd' && b.group && b.group.open > 0) continue;
      if (b.h <= y + .35) continue;
      const cx = clamp(x, b.x0, b.x1), cz = clamp(z, b.z0, b.z1);
      if ((x - cx) ** 2 + (z - cz) ** 2 < rad * rad) return b;
    }
    for (const g of W.rings) { if (g.open > 0 || y >= g.h) continue; const d = Math.hypot(x - g.x, z - g.z); if (Math.abs(d - g.r) < g.w / 2 + rad) return g; }
    return null;
  };
  W.groundAt = (x, z, y) => {
    let gnd = 0;
    for (const b of query(x, z, 0)) { if (b.type !== 'solid') continue; if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1 && b.h <= y + .35) gnd = Math.max(gnd, b.h); }
    return gnd;
  };

  /* suelo */
  const plane = (w, d, m, x, z, y = 0) => { const p = new T.Mesh(new T.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.receiveShadow = true; scene.add(p); return p; };
  plane(600, 420, new T.MeshStandardMaterial({ map: groundTex('asfalto', [60, 42]), roughness: .95 }), 30, 60);
  const swMat = new T.MeshStandardMaterial({ map: groundTex('acera', [8, 8]), roughness: .9 });
  const swHalf = new T.MeshStandardMaterial({ map: groundTex('acera', [2.5, 8]), roughness: .9 });
  // líneas de carril en calles principales
  const lineM = new T.MeshBasicMaterial({ color: '#d8c98a' });
  for (const z of [-20, 20, 60, 100, 140]) for (let x = -138; x < 146; x += 8) { if (Math.abs(x) < 20 && z !== 140) continue; const l = new T.Mesh(geo('lane', () => new T.PlaneGeometry(3, .18)), lineM); l.rotation.x = -Math.PI / 2; l.position.set(x, .02, z); scene.add(l); }

  /* texturas de fachada */
  const TEX = { brick: facadeTex('brick'), colonial: facadeTex('colonial'), brickW: winTex('brick', 11), colonialW: winTex('colonial', 12) };
  const facMats = {};
  const facMat = (kind, tint) => facMats[kind + tint] || (facMats[kind + tint] = new T.MeshStandardMaterial({ color: tint, map: TEX[kind], emissive: '#ffffff', emissiveMap: TEX[kind + 'W'], emissiveIntensity: .75, roughness: .85 }));
  const TINT = { brick: ['#ffffff', '#f3dccb', '#e9cdb6'], colonial: ['#ffffff', '#fff1c4', '#dcefff', '#ffe0e6', '#e6ffd9'] };
  function building(x0, x1, z0, z1, h, kind) {
    const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const fm = facMat(kind, TINT[kind][(r() * TINT[kind].length) | 0]); const roof = mat(kind === 'brick' ? '#5a4038' : '#7a332c');
    const m = new T.Mesh(boxUV(w, h, d, 28, 14), [fm, fm, roof, roof, fm, fm]); m.position.set(cx, h / 2, cz); m.castShadow = m.receiveShadow = true; scene.add(m);
    addBox(x0, x1, z0, z1, h); W.mapRects.push([x0, z0, w, d, kind]);
    if (kind === 'brick') {
      if (r() < .65) scene.add(at(cyl(.7, .7, 1.3, 10, '#1d1d24'), x0 + 1.5 + r() * (w - 3), h + .65, z0 + 1.5 + r() * (d - 3)));
      if (r() < .45) { const bx = x0 + .4 + r() * (w - 1.2), bz = z0 + .4 + r() * (d - 1.2); for (let k = 0; k < 4; k++) scene.add(at(box(.07, 1.5, .07, '#6a6a70'), bx + (k % 2) * .6, h + .75, bz + (k >> 1) * .6)); }
    } else scene.add(at(mesh(geo(`corn${w.toFixed(1)},${d.toFixed(1)}`, () => new T.BoxGeometry(w + .5, .35, d + .5)), mat('#d9ccb0')), cx, h + .17, cz));
  }
  function sidewalk(cx, cz) { plane(30.5, 30.5, swMat, cx, cz, .03); }

  function normalBlock(i, j) {
    const x0 = 40 * i - 14, x1 = 40 * i + 14, z0 = 40 * j - 14, z1 = 40 * j + 14; sidewalk(40 * i, 40 * j);
    const kind = (Math.abs(i) <= 1 && j <= 1) ? 'colonial' : 'brick';
    const H = () => kind === 'colonial' ? 8 + r() * 3 : 6 + r() * 9;
    const mode = r();
    if (mode < .35) { const s = x0 + 10 + r() * 8; building(x0, s, z0, z1, H(), kind); building(s, x1, z0, z1, H(), kind); }
    else if (mode < .7) { const s = z0 + 10 + r() * 8; building(x0, x1, z0, s, H(), kind); building(x0, x1, s, z1, H(), kind); }
    else { const sx = x0 + 11 + r() * 6, sz = z0 + 11 + r() * 6; building(x0, sx, z0, sz, H(), kind); building(sx, x1, z0, sz, H(), kind); building(x0, sx, sz, z1, H(), kind); building(sx, x1, sz, z1, H(), kind); }
  }
  function jrLimaBlock(j) {
    const z0 = 40 * j - 14, z1 = 40 * j + 14;
    plane(9.5, 30.5, swHalf, -9.5, 40 * j, .03); plane(9.5, 30.5, swHalf, 9.5, 40 * j, .03);
    const signs = ['#e2447a', '#3fa7c9', '#f2c14e', '#5bbf6a', '#9b5de5'];
    for (const [a, b, face] of [[-14, -5.5, -1], [5.5, 14, 1]]) {
      let z = z0;
      while (z < z1 - 1) {
        const len = Math.min(z1 - z, 8 + r() * 6); building(a, b, z, z + len, 8 + r() * 3, 'colonial');
        const sc = signs[(r() * 5) | 0]; const fx = face < 0 ? -5.5 : 5.5;
        const sign = box(.12, .7, Math.min(4, len - 1), sc, { emissive: sc, emissiveIntensity: .6 }); sign.castShadow = false; sign.position.set(fx - face * .07, 3.2, z + len / 2); scene.add(sign);
        if (len > 4) scene.add(at(box(.9, 1.8, Math.min(3, len - 2), '#5a3418'), fx - face * .45, 5.6, z + len / 2));
        z += len;
      }
    }
  }
  function catedral() {
    sidewalk(0, -40);
    const stone = '#c7b48c';
    scene.add(at(box(26, 15, 22, stone), 0, 7.5, -41));
    for (const s of [-1, 1]) { scene.add(at(box(5, 22, 5, stone), s * 10.5, 11, -28.5)); scene.add(at(cone(3.2, 4, 4, '#a8946c'), s * 10.5, 24, -28.5)); scene.add(at(box(.25, 1.6, .25, ORO, GOLD), s * 10.5, 26.6, -28.5)); }
    scene.add(at(box(8, 12, 1.4, '#b8a47c'), 0, 6, -29.4));
    scene.add(at(box(3, 5, .2, '#2a1e18'), 0, 2.5, -28.6));
    const rose = cyl(1.3, 1.3, .2, 16, '#ffcf7a', { emissive: '#ffb35a', emissiveIntensity: 1 }); rose.rotation.x = Math.PI / 2; rose.position.set(0, 9.5, -28.6); scene.add(rose);
    addBox(-14, 14, -54, -26, 22); W.mapRects.push([-14, -54, 28, 28, 'church']);
  }
  function santuario() {
    sidewalk(40, 160);
    const white = '#efe8da';
    scene.add(at(box(20, 12, 24, white), 42, 6, 160));
    scene.add(at(box(5, 20, 5, white), 29.5, 10, 151)); scene.add(at(cone(3, 3.5, 4, '#c0392b'), 29.5, 21.7, 151));
    const dome = sph(5, '#d8cdb4', {}, 12); dome.scale.y = .7; dome.position.set(44, 12, 160); scene.add(dome);
    scene.add(at(box(.3, 1.8, .3, ORO, GOLD), 44, 16.8, 160));
    scene.add(at(box(1.4, 9, 7, '#e2d8c4'), 31.3, 4.5, 160)); scene.add(at(box(.2, 4.5, 2.6, '#2a1e18'), 30.5, 2.25, 160));
    addBox(26, 54, 146, 174, 20); W.mapRects.push([26, 146, 28, 28, 'church']);
  }
  function patio() {
    sidewalk(-120, 0);
    building(-134, -106, -14, -6, 7, 'brick'); building(-134, -106, 6, 14, 6.5, 'brick'); building(-134, -124, -6, 6, 7.5, 'brick');
    plane(18, 12, new T.MeshStandardMaterial({ map: groundTex('patio', [4, 3]) }), -115, 0, .04);
    scene.add(at(box(1.4, 2.2, .7, '#6b3a1e'), -122.6, 1.1, 5.2)); scene.add(at(box(1.2, .08, .05, ORO), -122.6, 1.4, 4.82)); addBox(-123.3, -121.9, 4.85, 5.55, 2.2);
    scene.add(at(box(2, .45, .6, '#7a5a3a'), -121, .22, -4.9)); addBox(-122, -120, -5.2, -4.6, .45);
    for (const [x, z] of [[-123, -1.5], [-123, 1.5], [-108, -5.3], [-108, 5.3]]) { scene.add(at(cyl(.3, .24, .5, 8, '#a0522d'), x, .25, z)); scene.add(at(sph(.35, '#4a8a3a'), x, .7, z)); scene.add(at(sph(.12, '#e2447a'), x + .15, .95, z)); }
    for (let k = 0; k < 5; k++) { const c = new T.Mesh(geo('aguayo', () => new T.PlaneGeometry(1.4, 1)), new T.MeshStandardMaterial({ color: ['#e2447a', '#f2c14e', '#3fa7c9', '#5bbf6a', '#9b5de5'][k], side: T.DoubleSide })); c.position.set(-118 + k * 1.6, 2.4, 3); scene.add(c); }
    scene.add(at(box(9, .03, .03, '#dddddd'), -115, 2.95, 3));
    W.mapAreas.push([-124, -6, 18, 12, '#9c6b4e']);
  }

  /* manzanas */
  for (let i = -3; i <= 3; i++) for (let j = -1; j <= 4; j++) {
    if ((i === 0 && j === 0) || (i === 0 && j === 4)) continue;
    if (i === 0 && j === -1) catedral();
    else if (i === 1 && j === 4) santuario();
    else if (i === -3 && j === 0) patio();
    else if (i === 0 && j >= 1 && j <= 3) jrLimaBlock(j);
    else normalBlock(i, j);
  }

  /* Plaza de Armas */
  plane(28.5, 28.5, new T.MeshStandardMaterial({ map: groundTex('plaza', [7, 7]) }), 0, 0, .03); W.mapAreas.push([-14, -14, 28, 28, '#8b80a0']);
  scene.add(at(box(2.4, 2.8, 2.4, '#bdb3a0'), 0, 1.4, 0)); scene.add(at(box(.7, 1.4, .5, '#6a6a6a'), 0, 3.5, 0)); scene.add(at(sph(.28, '#6a6a6a'), 0, 4.4, 0)); addBox(-1.2, 1.2, -1.2, 1.2, 4.6);
  for (const [x, z] of [[10, 10], [-10, 10], [10, -10], [-10, -10]]) { scene.add(at(box(2.2, 2, 2.2, '#2f6d8a'), x, 1, z)); scene.add(at(box(2.8, .2, 2.8, '#c0392b'), x, 2.1, z)); addBox(x - 1.4, x + 1.4, z - 1.4, z + 1.4, 2.2); }
  scene.add(at(box(3, .5, 4, '#6b4a2e'), -11, .25, 0)); addBox(-12.5, -9.5, -2, 2, .5);
  for (const s of [-1, 1]) scene.add(at(box(.15, 3, .15, '#3a2a20'), -12.4, 1.5, s * 1.9));
  scene.add(at(box(.1, .8, 4, '#e2447a', { emissive: '#e2447a', emissiveIntensity: .5 }), -12.4, 2.9, 0));
  for (const [x, z, ry] of [[5, 12, 0], [-5, 12, 0], [12.5, 5, 1], [12.5, -5, 1]]) { const b = box(2, .45, .6, '#6b4a2e'); b.position.set(x, .22, z); b.rotation.y = ry * Math.PI / 2; scene.add(b); if (ry) addBox(x - .3, x + .3, z - 1, z + 1, .45); else addBox(x - 1, x + 1, z - .3, z + .3, .45); }
  const tree = (x, z, s = 1) => { scene.add(at(cyl(.15, .2, 1.6 * s, 6, '#5a3a20'), x, .8 * s, z)); const c = sph(1.3 * s, '#3f7a3f', {}, 7); c.position.set(x, 2.3 * s, z); c.scale.y = 1.2; scene.add(c); addBox(x - .3, x + .3, z - .3, z + .3, 3); };
  for (const [x, z] of [[6, 6], [-6, 6], [6, -6], [-6, -6]]) tree(x, z);

  /* puestos de mate */
  const mateStall = (x, z) => { scene.add(at(box(1.6, 1, .8, '#7a5a3a'), x, .5, z)); scene.add(at(box(2.1, .1, 1.5, '#5bbf6a'), x, 2.1, z)); for (const s of [-1, 1]) scene.add(at(box(.06, 2.1, .06, '#4a3020'), x + s * .95, 1.05, z - .6)); scene.add(at(cyl(.1, .08, .18, 8, '#ffffff'), x - .35, 1.09, z)); scene.add(at(cyl(.1, .08, .18, 8, '#ffffff'), x + .3, 1.09, z)); addBox(x - .8, x + .8, z - .4, z + .4, 1); };
  mateStall(11, 0); mateStall(3.6, 100); mateStall(155, 40);

  /* Jr. Lima */
  plane(11, 132, new T.MeshStandardMaterial({ map: groundTex('jr', [3, 36]) }), 0, 80, .025); W.mapAreas.push([-5.5, 14, 11, 132, '#a89a86']);
  const flags = []; for (let z = 22; z < 146; z += 9) for (let k = 0; k < 10; k++) flags.push([-4.6 + k * 1.02, 6.2 - Math.sin(k / 9 * Math.PI) * .7, z, k]);
  for (let x = -13; x < 14; x += 9) if (Math.abs(x) > 2) for (let k = 0; k < 10; k++) flags.push([x, 6 - Math.sin(k / 9 * Math.PI) * .6, -13 + k * 2.9, k]);
  const pf = new T.InstancedMesh(geo('flag', () => new T.PlaneGeometry(.5, .6)), new T.MeshStandardMaterial({ side: T.DoubleSide, emissive: '#331a33' }), flags.length);
  const dm = new T.Object3D(); const pfc = ['#e2447a', '#f2c14e', '#3fa7c9', '#5bbf6a', '#ff8a3d'].map(c => new T.Color(c));
  flags.forEach((f, i) => { dm.position.set(f[0], f[1], f[2]); dm.rotation.set(0, Math.abs(f[0]) > 6 ? Math.PI / 2 : 0, 0); dm.updateMatrix(); pf.setMatrixAt(i, dm.matrix); pf.setColorAt(i, pfc[(i + f[3]) % 5]); });
  scene.add(pf);

  /* Parque Pino */
  plane(28.5, 28.5, new T.MeshStandardMaterial({ map: groundTex('cesped', [6, 6]) }), 0, 160, .03); W.mapAreas.push([-14, 146, 28, 28, '#3f6e3f']);
  plane(3, 28.5, mat('#a89a86'), 0, 160, .04); plane(28.5, 3, mat('#a89a86'), 0, 160, .045);
  for (const [x, z] of [[-11, 149], [11, 149], [-11, 171], [11, 150], [6, 172], [-2, 172]]) tree(x, z, 1.15);

  /* malecón, muelle y lago */
  plane(28, 252, new T.MeshStandardMaterial({ map: groundTex('cesped', [6, 54]) }), 160, 60, .03); W.mapAreas.push([146, -66, 28, 252, '#3f6e3f']);
  scene.add(at(box(.6, .5, 252, '#b8ad9a'), 174, .25, 60));
  for (const [x, z] of [[166, -6], [166, 46]]) { scene.add(at(box(2.2, 2, 2.2, '#8a5a2e'), x, 1, z)); scene.add(at(box(2.8, .2, 2.8, '#e2447a'), x, 2.1, z)); addBox(x - 1.4, x + 1.4, z - 1.4, z + 1.4, 2.2); }
  const pier = plane(36, 6, new T.MeshStandardMaterial({ map: groundTex('madera', [6, 1]) }), 192, 20, .3); pier.castShadow = true;
  for (let x = 176; x <= 210; x += 4) for (const z of [17.2, 22.8]) scene.add(at(cyl(.12, .12, 1.2, 6, '#5a3a20'), x, -.1, z));
  addBox(174, 210, 17, 23, .3); W.mapAreas.push([174, 17, 36, 6, '#7a5a3a']);
  const lakeG = new T.PlaneGeometry(260, 440, 26, 44);
  const lake = new T.Mesh(lakeG, new T.MeshStandardMaterial({ color: '#2a6f9a', roughness: .25, metalness: .35, flatShading: true }));
  lake.rotation.x = -Math.PI / 2; lake.position.set(304, -.25, 60); scene.add(lake); W.mapAreas.push([174, -160, 260, 440, '#2a6f9a']);
  addBox(174, 600, -400, 17, 99); addBox(174, 600, 23, 400, 99); addBox(210, 600, 17, 23, 99);
  const boats = [];
  for (const [x, z, ry] of [[184, 8, .3], [190, 33, -.2], [200, 4, .9], [214, 30, .1]]) {
    const b = new T.Group(); const hull = cyl(.55, .55, 5, 8, '#c9b06b'); hull.rotation.x = Math.PI / 2; b.add(hull);
    for (const s of [-1, 1]) { const tip = cone(.55, 1.4, 8, '#c9b06b'); tip.rotation.x = s * Math.PI / 2; tip.position.z = s * 3.1; b.add(tip); b.add(at(cone(.18, .8, 6, '#c9b06b'), 0, .6, s * 3.6)); }
    b.position.set(x, .15, z); b.rotation.y = ry; scene.add(b); boats.push(b);
  }

  /* bordes del mundo */
  addBox(-400, -146, -400, 400, 99); addBox(-400, 600, -400, -66, 99); addBox(-400, 600, 186, 400, 99);

  /* cerros y cielo */
  const far = new T.MeshBasicMaterial({ color: '#241e48', fog: false }), snow = new T.MeshBasicMaterial({ color: '#d8d4ec', fog: false });
  for (let k = 0; k < 26; k++) {
    const a = k / 26 * Math.PI * 2, R = 330 + r() * 60, h = 50 + r() * 70; const m = new T.Mesh(geo(`mt${k % 5}`, () => new T.ConeGeometry(70, 1, 5)), far);
    m.scale.y = h; m.position.set(30 + Math.cos(a) * R, h / 2 - 6, 60 + Math.sin(a) * R); scene.add(m);
    if (h > 95) { const c = new T.Mesh(geo('snowc', () => new T.ConeGeometry(70, 1, 5)), snow); c.scale.set(.28, h * .28, .28); c.position.set(m.position.x, h - 6 - h * .14, m.position.z); scene.add(c); }
  }
  const sp = new Float32Array(1500); for (let i = 0; i < 500; i++) { const a = r() * Math.PI * 2, e = .15 + r() * 1.2, R = 480; sp[i * 3] = 30 + Math.cos(a) * Math.cos(e) * R; sp[i * 3 + 1] = Math.sin(e) * R; sp[i * 3 + 2] = 60 + Math.sin(a) * Math.cos(e) * R; }
  const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3));
  scene.add(new T.Points(sg, new T.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, fog: false })));
  const moon = new T.Mesh(new T.SphereGeometry(14, 16, 12), new T.MeshBasicMaterial({ color: '#fff6d8', fog: false })); moon.position.set(400, 220, -200); scene.add(moon);

  /* faroles (instanciados) */
  const lamps = [];
  for (let i = -3; i <= 3; i++) for (let j = -1; j <= 4; j++) for (const sx of [-1, 1]) for (const sz of [-1, 1]) lamps.push([40 * i + sx * 15.6, 40 * j + sz * 15.6]);
  for (let z = -60; z <= 180; z += 20) lamps.push([148, z]);
  const posts = new T.InstancedMesh(geo('lp', () => new T.CylinderGeometry(.07, .1, 4.4, 6)), mat('#1d1830'), lamps.length);
  const bulbs = new T.InstancedMesh(geo('lb', () => new T.SphereGeometry(.28, 8, 6)), new T.MeshStandardMaterial({ color: '#ffd27a', emissive: '#ffb35a', emissiveIntensity: 1.6 }), lamps.length);
  lamps.forEach((p, i) => { dm.position.set(p[0], 2.2, p[1]); dm.rotation.set(0, 0, 0); dm.updateMatrix(); posts.setMatrixAt(i, dm.matrix); dm.position.y = 4.5; dm.updateMatrix(); bulbs.setMatrixAt(i, dm.matrix); });
  scene.add(posts, bulbs);

  /* multitudes */
  const people = [];
  const CROWD_COLS = ['#e2447a', '#3fa7c9', '#f2c14e', '#5bbf6a', '#9b5de5', '#e86a2e', '#f4ecdc', '#c0392b', '#2f6d8a'].map(c => new T.Color(c));
  const person = (x, z, g = null) => people.push({ x, z, g, ph: r() * 6, c: (r() * CROWD_COLS.length) | 0 });
  for (const [cx, cz] of CLUSTERS) {
    const g = { type: 'cluster', x: cx, z: cz, open: 0, reach: 3 };
    for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) { if (a > 0 && a < 4 && b > 0 && b < 4) continue; person(cx - 2 + a, cz - 2 + b, g); }
    for (let k = 0; k < 4; k++) person(cx + (k % 2 ? .6 : -.6), cz + (k > 1 ? .6 : -.6), g);
    addBox(cx - 2.4, cx + 2.4, cz - 2.4, cz + 2.4, 3.2, 'crowd', g); W.crowds.push(g);
  }
  // anillo de gente en Parque Pino (bordado 2): el caporal lo salta, el diablo lo abre
  { const g = { type: 'ring', x: -6, z: 160, r: 3.6, w: 1.2, h: 1.7, open: 0, reach: 4 }; for (let k = 0; k < 22; k++) { const a = k / 22 * Math.PI * 2; person(g.x + Math.cos(a) * g.r, g.z + Math.sin(a) * g.r, g); } W.rings.push(g); W.crowds.push(g); }
  // público de adorno pegado a las paredes
  const row = (x0, z0, x1, z1, step = 1.1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(L / step); for (let k = 0; k <= n; k++) person(x0 + (x1 - x0) * k / n + (r() - .5) * .3, z0 + (z1 - z0) * k / n + (r() - .5) * .3); addBox(Math.min(x0, x1) - .45, Math.max(x0, x1) + .45, Math.min(z0, z1) - .45, Math.max(z0, z1) + .45, 3.2, 'crowd'); };
  row(-4.7, 22, -4.7, 78); row(-4.7, 94, -4.7, 140); row(4.7, 24, 4.7, 70); row(4.7, 104, 4.7, 142);
  row(-12, -25, 12, -25); row(172, -50, 172, 12); row(172, 30, 172, 180); row(-13, 175.5, 13, 175.5);
  const N = people.length;
  const bodies = new T.InstancedMesh(geo('crb', () => new T.CylinderGeometry(.2, .34, 1.0, 7)), new T.MeshStandardMaterial({ roughness: .8, flatShading: true }), N);
  const heads = new T.InstancedMesh(geo('crh', () => new T.SphereGeometry(.15, 6, 5)), mat(SKIN), N);
  const hats = new T.InstancedMesh(geo('crt', () => new T.CylinderGeometry(.12, .19, .16, 8)), mat('#2b2b2b'), N);
  people.forEach((p, i) => bodies.setColorAt(i, CROWD_COLS[p.c]));
  bodies.castShadow = true; scene.add(bodies, heads, hats);

  /* caminantes */
  const routes = [[[-100, -20], [100, -20]], [[-140, 20], [140, 20]], [[20, -60], [20, 180]], [[-20, -60], [-20, 180]], [[60, -60], [60, 180]], [[-60, -60], [-60, 180]], [[0, 18], [0, 144]], [[-100, 60], [100, 60]], [[-140, 100], [140, 100]], [[100, -60], [100, 180]], [[152, -60], [152, 180]], [[-140, 140], [140, 140]]];
  const wc = ['#e2447a', '#3fa7c9', '#f2c14e', '#5bbf6a', '#9b5de5', '#e86a2e'];
  for (let k = 0; k < 26; k++) {
    const R = routes[k % routes.length];
    const m = k % 3 === 0 ? makeMan({ shirt: wc[(k + 2) % 6], poncho: k % 2 ? '#8a4a2a' : null, hat: k % 2 ? 'chullo' : 'fedora', hatColor: wc[k % 6] }) : makeCholita(wc[k % 6], ['#6b3b8a', '#2f6d8a', '#8a3a3a'][k % 3]);
    scene.add(m);
    W.walkers.push({ m, a: R[0], b: R[1], t: r(), dir: r() < .5 ? 1 : -1, sp: 1.1 + r() * .7, off: (r() < .5 ? -1 : 1) * (R[0][0] === 0 ? 1 + r() * 1.8 : 3.5 + r() * 1.5), push: 0, px: 0, pz: 0, ph: r() * 6, x: 0, z: 0 });
  }
  W.pushWalkers = (x, z, rad, force = 2.5) => { for (const w of W.walkers) { const d = Math.hypot(w.x - x, w.z - z); if (d < rad) { const k = (rad - d) / rad; w.px += (w.x - x) / (d || 1) * force * k; w.pz += (w.z - z) / (d || 1) * force * k; w.push = 1.2; } } };

  /* fuegos artificiales */
  const FN = 600, fp = new Float32Array(FN * 3), fc = new Float32Array(FN * 3); const fgeo = new T.BufferGeometry();
  fgeo.setAttribute('position', new T.BufferAttribute(fp, 3)); fgeo.setAttribute('color', new T.BufferAttribute(fc, 3));
  scene.add(new T.Points(fgeo, new T.PointsMaterial({ size: .6, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false })));
  const fparts = Array.from({ length: FN }, () => ({ l: 0, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, c: new T.Color() })); let fpi = 0;
  const fpal = [ORO, '#e2447a', '#3fa7c9', '#ffffff', '#9fe0a0'];
  W.burst = (x, y, z) => { const col = new T.Color(fpal[(Math.random() * fpal.length) | 0]); for (let k = 0; k < 60; k++) { const p = fparts[fpi++ % FN]; const a = Math.random() * 6.28, b = Math.acos(2 * Math.random() - 1), s = 6 + Math.random() * 3; Object.assign(p, { l: 1.8, x, y, z, vx: Math.sin(b) * Math.cos(a) * s, vy: Math.cos(b) * s, vz: Math.sin(b) * Math.sin(a) * s }); p.c.copy(col); } };

  /* puntos de la historia */
  W.spots = {
    spawn: [-114, 0], rosa: [-119.5, -3.6], honorio: [-109.5, 4.5], torito: [-100, 6], ropero: [-122.6, 4],
    plaza: [0, 4], ciro: [6, -8.5], banda: [0, -11], stage: [-11, 0], mates: [[11, 0], [3.6, 100], [155, 40]],
    parque: [0, 158], ring: [-6, 160], muelle: [160, 26], pier: [192, 20], raceStart: [8, 20],
  };

  /* actualización por cuadro */
  let fr = 0;
  W.update = (dt, t) => {
    fr++;
    if (fr % 2 === 0) { const pos = lakeG.attributes.position; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y0 = pos.getY(i); pos.setZ(i, Math.sin(x * .12 + t * 1.1) * .25 + Math.cos(y0 * .15 + t * .9) * .2); } pos.needsUpdate = true; if (fr % 6 === 0) lakeG.computeVertexNormals(); }
    boats.forEach((b, i) => { b.position.y = .15 + Math.sin(t * 1.3 + i) * .08; b.rotation.z = Math.sin(t + i) * .05; });
    for (const g of W.crowds) { g.open = Math.max(0, g.open - dt); g.k = clamp((g.k || 0) + (g.open > 0 ? dt * 3 : -dt * 1.5), 0, 1); }
    for (let i = 0; i < N; i++) {
      const p = people[i]; let x = p.x, z = p.z;
      if (p.g && p.g.k > 0) { const dx = p.x - p.g.x, dz = p.z - p.g.z, L = Math.hypot(dx, dz) || 1; const s = p.g.k * (p.g.type === 'ring' ? 2.2 : 2.6); x += dx / L * s; z += dz / L * s; }
      const bob = Math.max(0, Math.sin(t * 6 + p.ph)) * .08;
      dm.rotation.set(0, 0, 0);
      dm.position.set(x, .5 + bob, z); dm.updateMatrix(); bodies.setMatrixAt(i, dm.matrix);
      dm.position.y = 1.15 + bob; dm.updateMatrix(); heads.setMatrixAt(i, dm.matrix);
      dm.position.y = 1.3 + bob; dm.updateMatrix(); hats.setMatrixAt(i, dm.matrix);
    }
    bodies.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = hats.instanceMatrix.needsUpdate = true;
    for (const w of W.walkers) {
      const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
      if (w.push > 0) w.push -= dt; else w.t += w.dir * w.sp * dt / L;
      if (w.t > 1) { w.t = 1; w.dir = -1; } if (w.t < 0) { w.t = 0; w.dir = 1; }
      w.px *= Math.exp(-dt * 1.5); w.pz *= Math.exp(-dt * 1.5);
      const ux = (w.b[0] - w.a[0]) / L, uz = (w.b[1] - w.a[1]) / L;
      w.x = w.a[0] + (w.b[0] - w.a[0]) * w.t - uz * w.off + w.px; w.z = w.a[1] + (w.b[1] - w.a[1]) * w.t + ux * w.off + w.pz;
      w.m.position.set(w.x, 0, w.z); w.m.rotation.y = Math.atan2(ux * w.dir, uz * w.dir);
      if (w.push > 0) poseIdle(w.m, t); else poseWalk(w.m, t * 5 * w.sp + w.ph, .5);
    }
    for (let i = 0; i < FN; i++) { const p = fparts[i]; if (p.l > 0) { p.l -= dt; p.vy -= 5 * dt; p.vx *= .985; p.vz *= .985; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; } fp[i * 3] = p.x; fp[i * 3 + 1] = p.l > 0 ? p.y : -99; fp[i * 3 + 2] = p.z; const k = Math.max(0, p.l / 1.8); fc[i * 3] = p.c.r * k; fc[i * 3 + 1] = p.c.g * k; fc[i * 3 + 2] = p.c.b * k; }
    fgeo.attributes.position.needsUpdate = fgeo.attributes.color.needsUpdate = true;
  };
  return W;
}
