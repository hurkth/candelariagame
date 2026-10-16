// Promesa de Candelaria · MVP mundo abierto
import { save, load, persist, wipe, hasProgress } from './save.js';
import * as A from './audio.js';
import { buildWorld, CASC } from './world.js';
import { makeCaporal, makeDiablo, makeCholita, makeMan, makeMototaxi, makeBeacon, makeCascabel, PAL,
  poseWalk, poseIdle, poseSit, poseJump, poseDance, poseKick, poseRoar, poseWave } from './models.js';
import { input, initInput, pollInput, endFrame, clearSticks } from './input.js';
import * as UI from './ui.js';
import { startRhythm, rhythmUpdate, rhythmState } from './rhythm.js';
import { runStory, setupGlobal, startDaily } from './missions.js';

const T = THREE;
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

load(); A.setMuted(save.muted);

/* ---------- render ---------- */
const canvas = $('gl');
let renderer;
try {
  renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  $('loading').innerHTML = '<p style="text-align:center;padding:20px">Tu navegador no tiene WebGL activo.<br>Prueba con Chrome o Safari actualizados.</p>';
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
const W = buildWorld(); const scene = W.scene;
const camera = new T.PerspectiveCamera(50, 1, .1, 900);
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

/* ---------- estado global ---------- */
const P = { x: 0, y: 0, z: 0, vy: 0, h: 0, jumps: 0, grounded: true, air: 100, ph: 0, veh: null, model: null, kind: 'josep', roarCd: 0, roarT: 0, pose: null };
const G = window.__G = {
  W, scene, camera, renderer, P, save, spots: W.spots,
  t: 0, mode: 'title', lock: false, busy: false, flash: false, lockDrive: false, noExit: false,
  waiters: [], tickers: [], inter: [], vehicles: {}, npcs: {}, chisme: 0, chismeCd: 0, timer: null, tgt: null, camOverride: null, shake: 0, onRoar: null,
};

/* ---------- jugador ---------- */
G.setModel = (kind, ci = 0) => {
  if (P.model) scene.remove(P.model);
  let m;
  if (kind === 'caporal') m = makeCaporal(PAL.caporal[ci]);
  else if (kind === 'diablo') m = makeDiablo(PAL.diablo[ci]);
  else if (kind === 'rosa') m = makeCholita('#e2447a', '#8a3a6a', { scale: 1.32 });
  else m = makeMan({ shirt: '#3a7bd5', pants: '#2a2a3a', hat: 'cap', hatColor: '#f2c14e' });
  P.model = m; P.kind = kind; scene.add(m);
};
G.equip = (kind, ci) => { if (!G.flash) G.setModel(kind, ci); };
G.place = (x, z, h = 0) => { P.x = x; P.z = z; P.y = 0; P.vy = 0; P.h = h; camPos.set(x, 14, z + 11); camLook.set(x, 0, z); };

/* ---------- vehículos ---------- */
function makeVeh(id, col, x, z, h) { const m = makeMototaxi(col); scene.add(m); const v = { id, x, z, h, speed: 0, m, ai: false }; G.vehicles[id] = v; syncVeh(v, 0); return v; }
function syncVeh(v, dt) { v.m.position.set(v.x, 0, v.z); v.m.rotation.y = v.h; for (const w of v.m.userData.wheels) w.rotation.x += v.speed * dt / .32; }
makeVeh('torito', '#c0392b', W.spots.torito[0], W.spots.torito[1], Math.PI);
const rup = makeVeh('ruperto', '#6b2fa8', 24, -6, 0); rup.m.visible = false;
{ const d = makeDiablo('#6b2fa8'); d.position.set(0, .2, .42); poseSit(d); rup.m.add(d); rup.driver = d; }

G.enterVehicle = v => { P.veh = v; A.engine(true, 0); A.sfx(180, .15, 'sawtooth', .05); };
G.exitVehicle = () => {
  const v = P.veh; if (!v) return; P.veh = null; v.speed = 0; A.engine(false);
  const rx = Math.cos(v.h), rz = -Math.sin(v.h);
  for (const s of [1.8, -1.8]) { const x = v.x + rx * s, z = v.z + rz * s; if (!W.blocked(x, z, 0, .4)) { P.x = x; P.z = z; break; } }
  P.y = W.groundAt(P.x, P.z, 1); P.vy = 0; P.h = v.h;
};

function driveVehicle(v, dt) {
  const ctrl = G.lockDrive ? { mag: 0 } : input;
  if (ctrl.mag > .15) {
    const target = Math.atan2(ctrl.x, -ctrl.y); const d = angDiff(target, v.h);
    const want = 13 * Math.min(1, ctrl.mag / .85) * (Math.abs(d) > 2.2 ? .3 : 1);
    v.speed += (want - v.speed) * Math.min(1, dt * 1.6);
    const turn = 2.5 * Math.min(1, Math.abs(v.speed) / 4 + .3); v.h += clamp(d, -turn * dt, turn * dt);
  } else v.speed *= Math.exp(-dt * 1.8);
  const dx = Math.sin(v.h) * v.speed * dt, dz = Math.cos(v.h) * v.speed * dt;
  const hit = W.blocked(v.x + dx, v.z + dz, 0, 1.0);
  if (hit) {
    if (Math.abs(v.speed) > 5) { A.bump(); G.shake = .25; }
    if (hit.type === 'crowd' || hit.group) addChisme(12);
    v.speed *= -.25;
  } else { v.x += dx; v.z += dz; }
  if (Math.abs(v.speed) > 3) for (const w of W.walkers) if (Math.hypot(w.x - v.x, w.z - v.z) < 1.6) { W.pushWalkers(v.x, v.z, 2.5, 4); addChisme(14); A.bump(); }
  A.engine(true, v.speed);
  syncVeh(v, dt);
  v.m.rotation.z = clamp(-(ctrl.mag > .15 ? angDiff(Math.atan2(ctrl.x, -ctrl.y), v.h) : 0) * v.speed * .006, -.08, .08);
}
function addChisme(n) { if (G.chismeCd > 0 || G.flash) return; G.chisme += n; G.chismeCd = .6; if (G.chisme < 100) UI.toast('¡Cuidado con la gente! Sube el chisme', 1500); }

/* ---------- a pie ---------- */
function moveCircle(dx, dz, r) {
  const cur = W.blocked(P.x, P.z, P.y, r);
  if (cur || !W.blocked(P.x + dx, P.z, P.y, r)) P.x += dx;
  if (cur || !W.blocked(P.x, P.z + dz, P.y, r)) P.z += dz;
}
function footUpdate(dt, ctrl) {
  const mv = ctrl.mag > .1;
  const canRun = P.air > 2 && !G.flash;
  const running = mv && ctrl.mag > .85 && canRun;
  const base = P.kind === 'caporal' ? 6.6 : P.kind === 'diablo' ? 6.1 : 5.6;
  const spd = mv ? (running ? base : 1.2 + 3.2 * Math.min(1, ctrl.mag / .85)) : 0;
  if (mv) { const L = Math.hypot(ctrl.x, ctrl.y) || 1; const dx = ctrl.x / L, dz = -ctrl.y / L; P.h += angDiff(Math.atan2(dx, dz), P.h) * (1 - Math.exp(-dt * 14)); moveCircle(dx * spd * dt, dz * spd * dt, .4); }
  P.air = running ? Math.max(0, P.air - 7 * dt) : Math.min(100, P.air + 3 * dt);
  const g = W.groundAt(P.x, P.z, P.y);
  if (P.y > g + .001 || P.vy > 0) { P.vy -= 20 * dt; P.y += P.vy * dt; P.grounded = false; if (P.y <= g) { P.y = g; P.vy = 0; P.jumps = 0; P.grounded = true; } }
  else { P.y = g; P.vy = 0; P.jumps = 0; P.grounded = true; }
  P.ph += dt * spd * 1.9;
  const m = P.model;
  if (!P.grounded) poseJump(m); else if (P.roarT > 0) poseRoar(m, 1 - P.roarT / .6); else if (mv) poseWalk(m, P.ph, running ? .95 : .6); else poseIdle(m, G.t);
}
function ability() {
  if (G.flash) return;
  if (P.veh) { A.honk(); W.pushWalkers(P.veh.x, P.veh.z, 7); return; }
  if (P.kind === 'caporal') {
    if (P.grounded) { P.vy = 7.2; P.jumps = 1; P.grounded = false; A.jingle(); }
    else if (P.jumps < 2) { P.vy = 6.8; P.jumps = 2; A.jingle(1); }
  } else if (P.kind === 'diablo' && P.roarCd <= 0) {
    P.roarCd = 1.2; P.roarT = .6; A.roar(); G.shake = .35;
    for (const c of W.crowds) if (Math.hypot(c.x - P.x, c.z - P.z) < c.reach + 5.5) { if (c.open <= 0) UI.toast('¡La gente abre paso!', 1400); c.open = 10; }
    W.pushWalkers(P.x, P.z, 6); if (G.onRoar) G.onRoar();
  }
}

/* ---------- interacciones, objetivos, temporizador ---------- */
G.addInter = o => { G.inter = G.inter.filter(i => i.id !== o.id); G.inter.push(o); return o; };
G.removeInter = id => { G.inter = G.inter.filter(i => i.id !== id); };
G.interact = (id, x, z, label, r = 2.6) => new Promise(res => G.addInter({ id, x, z, r, label, use: () => { G.removeInter(id); res(); } }));
function nearestInter() {
  let best = null, bd = 1e9;
  for (const i of G.inter) { if (i.can && !i.can()) continue; const d = Math.hypot(i.x - P.x, i.z - P.z); if (d < i.r && d < bd) { bd = d; best = i; } }
  return best;
}
const beacon = makeBeacon('#f2c14e'); beacon.visible = false; scene.add(beacon);
G.target = (x, z, label = '') => { G.tgt = { x, z, label, follow: null }; beacon.visible = true; beacon.position.set(x, 0, z); };
G.targetFollow = (fn, label = '') => { G.tgt = { x: 0, z: 0, label, follow: fn }; beacon.visible = true; };
G.clearTarget = () => { G.tgt = null; beacon.visible = false; };
G.objective = UI.objective; G.objExtra = UI.objExtra;
G.timerStart = s => { G.timer = { left: s }; $('timer').hidden = false; };
G.timerStop = () => { G.timer = null; $('timer').hidden = true; };
G.until = fn => new Promise(res => G.waiters.push({ fn, res }));
G.wait = s => { const end = G.t + s; return G.until(() => G.t >= end); };
G.ticker = fn => G.tickers.push(fn);
G.say = async lines => { G.lock = true; UI.controls(false); clearSticks(); await UI.say(lines); G.lock = false; if (G.mode === 'play') UI.controls(true); };
G.card = async (t, s) => { G.lock = true; await UI.card(t, s); G.lock = false; };
G.modal = async p => { G.lock = true; UI.controls(false); clearSticks(); const r = await p(); G.lock = false; if (G.mode === 'play') UI.controls(true); return r; };
G.reward = (n, why) => { save.wallet += n; persist(); A.coin(); UI.toast(`+${n} cascabeles · ${why}`); };
G.burst = (x = P.x, z = P.z) => { for (let k = 0; k < 3; k++) setTimeout(() => W.burst(x + (Math.random() - .5) * 20, 18 + Math.random() * 8, z - 10 + (Math.random() - .5) * 10), k * 250); };

/* ---------- NPCs ---------- */
G.npc = (id, model, x, z, h = 0, anim = 'idle') => { G.npcRemove(id); model.position.set(x, 0, z); model.rotation.y = h; scene.add(model); return (G.npcs[id] = { m: model, x, z, h, anim, ph: Math.random() * 6 }); };
G.npcRemove = id => { const n = G.npcs[id]; if (n) { scene.remove(n.m); delete G.npcs[id]; } };
G.face = (id, x, z) => { const n = G.npcs[id]; if (n) n.m.rotation.y = Math.atan2(x - n.m.position.x, z - n.m.position.z); };

/* ---------- ritmo ---------- */
G.rhythm = async cfg => {
  if (P.veh) G.exitVehicle();
  G.mode = 'rhythm'; G.lock = true; UI.controls(false); UI.hud(false); clearSticks();
  const ca = cfg.cam || 0; P.h = ca; P.y = W.groundAt(P.x, P.z, 1);
  G.camOverride = () => { const s = Math.sin(G.t * .35) * .12; camera.position.set(P.x + Math.sin(ca + s) * 6.4, P.y + 2.5, P.z + Math.cos(ca + s) * 6.4); camera.lookAt(P.x, P.y + .4, P.z); };
  const r = await startRhythm(cfg);
  G.camOverride = null; G.mode = 'play'; G.lock = false; UI.controls(true); UI.hud(true);
  return r;
};
G.daily = () => startDaily(G);

/* ---------- flashback ---------- */
G.flashback = on => {
  G.flash = on; canvas.classList.toggle('sepia', on);
  if (on) { if (P.veh) G.exitVehicle(); G.setModel('rosa'); for (const v of Object.values(G.vehicles)) v.m.visible = false; }
  else { G.setModel(save.traje || 'josep', save.colors[save.traje] || 0); G.vehicles.torito.m.visible = true; }
};

/* ---------- cámara ---------- */
const camPos = new T.Vector3(0, 30, 30), camLook = new T.Vector3(), tmp = new T.Vector3(), tmp2 = new T.Vector3();
function updateCamera(dt) {
  if (G.camOverride) { G.camOverride(dt); camPos.copy(camera.position); return; }
  if (G.mode === 'title') {
    const a = G.t * .07; camera.position.set(Math.sin(a) * 46, 24, 18 + Math.cos(a) * 46); camera.lookAt(0, 3, 12); camPos.copy(camera.position);
    W.sun.position.set(-20, 40, 14); W.sun.target.position.set(0, 0, 0); return;
  }
  const v = P.veh, tx = v ? v.x : P.x, tz = v ? v.z : P.z, ty = v ? 0 : P.y;
  const k = (v ? 1.3 : 1) * (camera.aspect < .9 ? 1.32 : 1);
  const ahead = v ? v.speed * .4 : 0, lx = tx + Math.sin(v ? v.h : 0) * ahead, lz = tz + Math.cos(v ? v.h : 0) * ahead;
  camPos.lerp(tmp.set(lx, ty + 11 * k, lz + 8.5 * k), 1 - Math.exp(-dt * 4));
  camLook.lerp(tmp2.set(lx, ty + .6, lz), 1 - Math.exp(-dt * 6));
  camera.position.copy(camPos);
  if (G.shake > 0) { camera.position.x += (Math.random() - .5) * G.shake; camera.position.y += (Math.random() - .5) * G.shake; }
  camera.lookAt(camLook);
  W.sun.position.set(tx - 20, 40, tz + 14); W.sun.target.position.set(tx, 0, tz);
}

/* ---------- HUD ---------- */
const btnA = $('btn-a'), btnAL = $('btn-a-l'), btnB = $('btn-b'), btnBL = $('btn-b-l'), arrow = $('arrow');
const mm = $('minimap'), mctx = mm.getContext('2d');
const MAP = document.createElement('canvas'); MAP.width = 560; MAP.height = 340; // x -150..410, z -80..260 (1 px = 1 m)
{
  const c = MAP.getContext('2d'); c.fillStyle = '#4a4163'; c.fillRect(0, 0, 560, 340);
  for (const [x, z, w, d, col] of W.mapAreas) { c.fillStyle = col; c.fillRect(x + 150, z + 80, w, d); }
  for (const [x, z, w, d, k] of W.mapRects) { c.fillStyle = k === 'church' ? '#e9ddc0' : k === 'colonial' ? '#9d8fb8' : '#7a5a52'; c.fillRect(x + 150, z + 80, w, d); }
}
let hudT = 0;
function drawMinimap() {
  const cx = P.veh ? P.veh.x : P.x, cz = P.veh ? P.veh.z : P.z, S = 1.1;
  mctx.save(); mctx.clearRect(0, 0, 220, 220); mctx.beginPath(); mctx.arc(110, 110, 108, 0, 7); mctx.clip();
  mctx.fillStyle = '#1b1530'; mctx.fillRect(0, 0, 220, 220);
  mctx.translate(110, 110); mctx.scale(S, S); mctx.drawImage(MAP, -(cx + 150), -(cz + 80));
  const dot = (x, z, col, r = 4, clampIt = false) => { let dx = x - cx, dz = z - cz; const L = Math.hypot(dx, dz), R = 92 / S; if (L > R) { if (!clampIt) return; dx *= R / L; dz *= R / L; } mctx.fillStyle = col; mctx.beginPath(); mctx.arc(dx, dz, r / S * 1.4, 0, 7); mctx.fill(); mctx.strokeStyle = '#000'; mctx.lineWidth = 1 / S; mctx.stroke(); };
  for (const [x, z] of W.spots.mates) dot(x, z, '#5bbf6a', 3);
  if (save.traje) dot(W.spots.stage[0], W.spots.stage[1], '#e2447a', 3);
  if (!P.veh) dot(G.vehicles.torito.x, G.vehicles.torito.z, '#c0392b', 3);
  if (G.tgt) dot(G.tgt.x, G.tgt.z, '#f2c14e', 5, true);
  mctx.restore();
  mctx.save(); mctx.translate(110, 110); mctx.rotate(Math.PI - (P.veh ? P.veh.h : P.h));
  mctx.fillStyle = '#ffffff'; mctx.strokeStyle = '#000'; mctx.lineWidth = 2; mctx.beginPath(); mctx.moveTo(0, -12); mctx.lineTo(8, 9); mctx.lineTo(0, 4); mctx.lineTo(-8, 9); mctx.closePath(); mctx.fill(); mctx.stroke(); mctx.restore();
}
function updateHUD(dt) {
  // botones
  let aLabel = null;
  if (G.mode === 'play' && !G.lock) {
    if (P.veh) aLabel = G.noExit ? null : 'Bajar';
    else { const it = nearestInter(); if (it) aLabel = it.label; }
  }
  btnA.classList.toggle('dim', !aLabel); btnAL.textContent = aLabel || '·';
  const bl = P.veh ? 'Bocina' : P.kind === 'caporal' ? 'Salto' : P.kind === 'diablo' ? 'Rugido' : null;
  btnB.hidden = !bl || G.flash; if (bl) btnBL.textContent = bl;
  // flecha al objetivo
  if (G.tgt && G.mode === 'play') {
    tmp.set(G.tgt.x, 1.5, G.tgt.z).project(camera);
    const behind = tmp.z > 1; let x = tmp.x, y = tmp.y; if (behind) { x = -x; y = -y; }
    if (!behind && Math.abs(x) < .88 && Math.abs(y) < .8) arrow.hidden = true;
    else { const a = Math.atan2(x, y), m = Math.max(Math.abs(x) / .86, Math.abs(y) / .78); x /= m; y /= m; arrow.hidden = false; arrow.style.left = ((x * .5 + .5) * innerWidth) + 'px'; arrow.style.top = ((-y * .5 + .5) * innerHeight) + 'px'; arrow.style.transform = `rotate(${a}rad)`; }
  } else arrow.hidden = true;
  hudT -= dt; if (hudT > 0) return; hudT = .1;
  $('air-i').style.width = P.air + '%'; $('air-i').style.background = P.air < 25 ? '#e0524a' : '#9fe0a0';
  $('ch-w').hidden = G.chisme <= 1; $('ch-i').style.width = Math.min(100, G.chisme) + '%';
  $('cas-n').textContent = save.wallet;
  if (G.timer) { const s = Math.max(0, Math.ceil(G.timer.left)); $('timer').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; $('timer').classList.toggle('low', s <= 20); }
  drawMinimap();
}

/* ---------- foto ---------- */
let photoA = 0, photoDrag = null, photoPose = 'paso';
function enterPhoto() {
  if (G.lock || G.mode !== 'play') return;
  G.mode = 'photo'; UI.hud(false); UI.controls(false); clearSticks(); $('photo').hidden = false;
  photoA = (P.veh ? P.veh.h : P.h);
  G.camOverride = () => { const tx = P.veh ? P.veh.x : P.x, tz = P.veh ? P.veh.z : P.z; camera.position.set(tx + Math.sin(photoA) * 4.6, P.y + 1.8, tz + Math.cos(photoA) * 4.6); camera.lookAt(tx, P.y + 1.1, tz); };
}
function exitPhoto() { $('photo').hidden = true; G.camOverride = null; G.mode = 'play'; UI.hud(true); UI.controls(true); }
canvas.addEventListener('pointerdown', e => { if (G.mode === 'photo') photoDrag = e.clientX; });
addEventListener('pointermove', e => { if (G.mode === 'photo' && photoDrag !== null) { photoA -= (e.clientX - photoDrag) * .01; photoDrag = e.clientX; } });
addEventListener('pointerup', () => { photoDrag = null; });
$('ph-exit').onclick = exitPhoto;
document.querySelectorAll('[data-pose]').forEach(b => b.onclick = () => { photoPose = b.dataset.pose; A.jingle(); });
$('ph-shot').onclick = async () => {
  A.sfx(1800, .05, 'square', .06);
  renderer.render(scene, camera);
  const src = canvas.toDataURL('image/png');
  const img = new Image(); img.src = src; await img.decode();
  const c = document.createElement('canvas'); const w = Math.min(1080, img.width), h = Math.round(img.height * w / img.width); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
  const bh = Math.round(Math.max(h * .09, w * .17)), pad = Math.round(w * .05);
  x.fillStyle = 'rgba(18,14,36,.88)'; x.fillRect(0, h - bh, w, bh); x.fillStyle = '#f2c14e'; x.fillRect(0, h - bh, w, Math.max(2, bh * .04));
  x.textBaseline = 'middle'; x.textAlign = 'left';
  x.fillStyle = '#f2c14e'; x.font = `700 ${Math.round(Math.min(bh * .36, w * .075))}px "Pixelify Sans", monospace`; x.fillText('Promesa de Candelaria', pad, h - bh * .6);
  x.fillStyle = '#f4ecdc'; x.font = `${Math.round(Math.min(bh * .22, w * .045))}px "Atkinson Hyperlegible", sans-serif`; x.fillText('Puno · Festividad de la Virgen de la Candelaria', pad, h - bh * .25);
  await G.modal(() => UI.photoResult(c.toDataURL('image/png')));
};

/* ---------- bucle ---------- */
const ZERO = { x: 0, y: 0, mag: 0 };
let bandaT = 0;
function step(dt) {
  if (G.mode === 'play') {
    if (!G.lock) {
      if (input.menu) { G.modal(() => UI.menu(G)); }
      else if (input.photo) enterPhoto();
      if (input.action) { if (P.veh) { if (!G.noExit) G.exitVehicle(); } else { const it = nearestInter(); if (it) it.use(); } }
      if (input.ability) ability();
    }
    if (P.veh) driveVehicle(P.veh, G.lock ? 0 : dt);
    else footUpdate(dt, G.lock ? ZERO : input);
  }
  if (G.mode === 'rhythm' && P.model) {
    const s = rhythmState(); P.model.position.set(P.x, P.y, P.z); P.model.rotation.y = P.h;
    if (s) { if (s.kick) poseKick(P.model, s.kick.lane, s.kick.k); else poseDance(P.model, s.beat, 1); }
  }
  if (P.veh) { const v = P.veh; P.model.position.set(v.x + Math.sin(v.h) * .42, .2, v.z + Math.cos(v.h) * .42); P.model.rotation.y = v.h; poseSit(P.model); }
  else if (G.mode !== 'rhythm' && P.model) { P.model.position.set(P.x, P.y, P.z); P.model.rotation.y = P.h; }
  P.roarCd -= dt; P.roarT -= dt;
  const beat = (rhythmState() || { beat: G.t * 1.8 }).beat;
  for (const n of Object.values(G.npcs)) {
    if (n.anim === 'idle') poseIdle(n.m, G.t + n.ph); else if (n.anim === 'dance') poseDance(n.m, beat + n.ph * .02, 0); else if (n.anim === 'wave') poseWave(n.m, G.t + n.ph); else if (n.anim === 'sit') poseSit(n.m);
  }
  W.update(dt, G.t);
  for (let i = G.tickers.length - 1; i >= 0; i--) if (G.tickers[i](dt) === false) G.tickers.splice(i, 1);
  for (let i = G.waiters.length - 1; i >= 0; i--) if (G.waiters[i].fn()) { const w = G.waiters.splice(i, 1)[0]; w.res(); }
  if (G.timer && !G.lock && G.mode === 'play') G.timer.left -= dt;
  G.chismeCd -= dt; G.chisme = Math.max(0, G.chisme - dt * 4);
  if (G.chisme >= 100) {
    G.chisme = 0; A.whistle(); const lost = Math.min(3, save.wallet); save.wallet -= lost; persist();
    if (P.veh && !G.noExit) G.exitVehicle();
    UI.toast(`¡Don Ciro te vio! Multa de ${lost} cascabeles por el chisme`, 3200);
  }
  G.shake = Math.max(0, G.shake - dt);
  if (G.tgt) { if (G.tgt.follow) { const [x, z] = G.tgt.follow(); G.tgt.x = x; G.tgt.z = z; beacon.position.set(x, 0, z); } beacon.userData.ring.scale.setScalar(1 + Math.sin(G.t * 4) * .12); }
  if (G.bandaPlaying && G.mode === 'play') { bandaT -= dt; if (bandaT <= 0) { bandaT = 2; const d = Math.hypot(P.x - W.spots.banda[0], P.z - W.spots.banda[1]); if (d < 45) A.bandaBar(.05 * (1 - d / 45)); } }
}
let last = performance.now(), first = true;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  pollInput();
  if (G.mode !== 'photo') { G.t += dt; step(dt); }
  else if (P.model && photoPose) { if (photoPose === 'paso') poseDance(P.model, G.t * 1.6, 1); else if (photoPose === 'saludo') poseWave(P.model, G.t); else poseJump(P.model); }
  if (G.mode === 'title') { if (Math.random() < .03) W.burst((Math.random() - .5) * 60, 22 + Math.random() * 10, -10 - Math.random() * 30); }
  updateCamera(dt);
  if (G.mode === 'rhythm') rhythmUpdate(dt);
  renderer.render(scene, camera);
  if (G.mode !== 'title') updateHUD(dt);
  endFrame();
  if (first) { first = false; $('loading').hidden = true; }
  requestAnimationFrame(frame);
}

/* ---------- cascabeles del mapa ---------- */
W.cascabeles = CASC.map(c => { const m = makeCascabel(); m.position.set(c.x, c.y || .9, c.z); scene.add(m); m.visible = !save.found.includes(c.id); return { ...c, m }; });

/* ---------- inicio ---------- */
initInput();
G.setModel(save.traje || 'josep', save.traje ? save.colors[save.traje] : 0);
G.place(W.spots.spawn[0], W.spots.spawn[1], Math.PI / 2);
function start(daily = false) {
  G.mode = 'play'; UI.hud(true); UI.controls(true);
  setupGlobal(G);
  runStory(G, daily ? () => G.daily() : null);
}
UI.title({
  progress: hasProgress(), daily: !!save.traje,
  onPlay: () => start(false), onDaily: () => start(true),
  onNew: () => { wipe(); W.cascabeles.forEach(c => c.m.visible = true); G.setModel('josep'); start(false); },
});
requestAnimationFrame(frame);
