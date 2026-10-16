// Minijuego de ritmo: 4 carriles que se tocan con el dedo (o flechas / D F J K).
import * as A from './audio.js';
import { rng } from './world.js';

const el = document.getElementById('rhythm'), cv = document.getElementById('rcv'), ctx = cv.getContext('2d');
const COL = ['#e2447a', '#3fa7c9', '#5bbf6a', '#f2c14e'], GLY = ['◀', '▼', '▲', '▶'];
const KEYS = { ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3, KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3 };
const FONT = '"Pixelify Sans", monospace';
let S = null, Wd = 0, Hd = 0, dpr = 1;
const AUTO = new URLSearchParams(location.search).has('autoplay'); // solo para pruebas

function layout() {
  dpr = Math.min(devicePixelRatio || 1, 2); Wd = innerWidth; Hd = innerHeight;
  cv.width = Wd * dpr; cv.height = Hd * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', () => { if (S) layout(); });
const lanes = () => { const lw = Math.min(86, (Math.min(Wd, 470) - 20) / 4); return { lw, x0: (Wd - lw * 4) / 2, hitY: Hd - Math.max(118, Hd * .17) }; };

function chart(cfg) {
  const r = rng(cfg.seed || 1), spb = 60 / cfg.bpm, notes = [], lead = 2.6; let last = -1;
  for (let b = 4; b < cfg.beats; b++) {
    if (cfg.easy && b % 2 === 1 && r() < .6) continue;
    if (r() < (cfg.easy ? .8 : .88)) { let l = r() * 4 | 0; if (l === last && r() < .6) l = (l + 1 + (r() * 3 | 0)) % 4; last = l; notes.push({ t: lead + b * spb, lane: l }); }
  }
  return { notes, lead };
}
const now = () => (S.t0 != null && A.actx) ? A.actx.currentTime - S.t0 : performance.now() / 1000 - S.p0;

function hit(l) {
  if (!S) return;
  const t = now(); S.flash[l] = 1; let best = null, bd = .17;
  for (const n of S.notes) if (!n.st && n.lane === l) { const d = Math.abs(n.t - t); if (d < bd) { bd = d; best = n; } }
  if (!best) return;
  best.st = 1; S.combo++; S.max = Math.max(S.max, S.combo);
  if (bd < .07) { S.perf++; S.judge = '¡PERFECTO!'; } else { S.good++; S.judge = 'BIEN'; }
  S.jt = .5; S.kick = { lane: l, k: 0 };
  const { lw, x0, hitY } = lanes();
  for (let k = 0; k < 8; k++) S.fx.push({ x: x0 + l * lw + lw / 2, y: hitY, vx: (Math.random() - .5) * 160, vy: -Math.random() * 160, l: .5, c: COL[l] });
}
cv.addEventListener('pointerdown', e => {
  if (!S) return; e.preventDefault(); A.unlock();
  const { lw, x0 } = lanes(); const l = Math.floor((e.clientX - x0) / lw);
  if (l >= 0 && l < 4) hit(l); else hit(e.clientX < Wd / 2 ? 0 : 3);
});
addEventListener('keydown', e => { if (!S) return; const l = KEYS[e.code]; if (l !== undefined) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) hit(l); } else if (e.code === 'Space') { e.preventDefault(); e.stopPropagation(); } }, true);

export function startRhythm(cfg) {
  return new Promise(res => {
    layout();
    const { notes, lead } = chart(cfg);
    S = { cfg, lead, res, perf: 0, good: 0, miss: 0, combo: 0, max: 0, flash: [0, 0, 0, 0], judge: '', jt: 0, kick: null, fx: [],
      notes: notes.map(n => ({ ...n, st: 0, fr: A.PENTA[(n.lane * 2 + (n.t * 7 | 0)) % 8] })) };
    S.end = S.notes[S.notes.length - 1].t + 1.6;
    const b = A.newBus(.55);
    if (A.actx && b) { S.t0 = A.actx.currentTime + .3; A.groove(b, S.t0 + lead, cfg.bpm, cfg.beats + 2); for (const n of S.notes) A.tone(S.t0 + n.t, b, n.fr, .18, 'triangle', .12); }
    else S.p0 = performance.now() / 1000 + .3;
    el.hidden = false;
  });
}
export function rhythmState() { return S ? { beat: Math.max(0, (now() - S.lead) * S.cfg.bpm / 60), kick: S.kick } : null; }

export function rhythmUpdate(dt) {
  if (!S) return;
  const t = now();
  for (let l = 0; l < 4; l++) S.flash[l] = Math.max(0, S.flash[l] - dt * 4);
  if (AUTO) for (const n of S.notes) if (!n.st && t - n.t > -.04 && t - n.t < .12) hit(n.lane);
  for (const n of S.notes) if (!n.st && t - n.t > .17) { n.st = 2; S.miss++; S.combo = 0; S.judge = 'FALLASTE'; S.jt = .5; }
  if (S.kick) { S.kick.k += dt * 5; if (S.kick.k >= 1) S.kick = null; }
  S.jt -= dt;
  S.fx.forEach(f => { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 400 * dt; f.l -= dt; }); S.fx = S.fx.filter(f => f.l > 0);
  draw(t);
  if (t > S.end) {
    const acc = (S.perf + S.good * .6) / S.notes.length;
    const out = { acc, pct: Math.round(acc * 100), pass: acc >= S.cfg.pass, maxCombo: S.max };
    const res = S.res; S = null; el.hidden = true; A.stopBus(); res(out);
  }
}

function txt(s, x, y, size, col, align = 'left', bold = false) {
  ctx.font = `${bold ? '700 ' : ''}${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillText(s, x + 1, y + 1); ctx.fillStyle = col; ctx.fillText(s, x, y);
}
function draw(t) {
  ctx.clearRect(0, 0, Wd, Hd);
  const { lw, x0, hitY } = lanes(), speed = hitY / 1.5, beat = Math.max(0, (t - S.lead) * S.cfg.bpm / 60), onB = 1 - (beat % 1);
  const g = ctx.createLinearGradient(0, 0, 0, Hd); g.addColorStop(0, 'rgba(10,8,22,0)'); g.addColorStop(.35, 'rgba(10,8,22,.45)'); g.addColorStop(1, 'rgba(10,8,22,.8)');
  ctx.fillStyle = g; ctx.fillRect(x0 - 8, 0, lw * 4 + 16, Hd);
  for (let l = 0; l < 4; l++) {
    const x = x0 + l * lw;
    ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(x, 0, 1, Hd);
    if (S.flash[l]) { ctx.fillStyle = `rgba(242,193,78,${S.flash[l] * .22})`; ctx.fillRect(x, hitY - 90, lw, Hd - hitY + 90); }
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x + 4, hitY - 14, lw - 8, 28);
    ctx.fillStyle = S.flash[l] ? COL[l] : 'rgba(42,33,64,.95)'; ctx.fillRect(x + 6, hitY - 12, lw - 12, 24);
    txt(GLY[l], x + lw / 2, hitY - 10, 18, S.flash[l] ? '#120e24' : COL[l], 'center', true);
    ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x + 4, hitY + 20, lw - 8, Hd - hitY - 26);
  }
  ctx.fillStyle = '#f2c14e'; ctx.fillRect(x0, hitY - 1, lw * 4, 2);
  ctx.globalAlpha = .25 + onB * .5; ctx.fillStyle = '#fff'; ctx.fillRect(x0, hitY - 1, lw * 4, 2); ctx.globalAlpha = 1;
  for (const n of S.notes) {
    if (n.st === 1) continue; const y = hitY - (n.t - t) * speed; if (y < -20 || y > Hd + 20) continue;
    const x = x0 + n.lane * lw; ctx.globalAlpha = n.st === 2 ? .3 : 1;
    ctx.fillStyle = '#000'; ctx.fillRect(x + 6, y - 13, lw - 12, 26); ctx.fillStyle = COL[n.lane]; ctx.fillRect(x + 8, y - 11, lw - 16, 22);
    txt(GLY[n.lane], x + lw / 2, y - 9, 16, '#120e24', 'center', true); ctx.globalAlpha = 1;
  }
  for (const f of S.fx) { ctx.fillStyle = f.c; ctx.fillRect(f.x, f.y, 4, 4); }
  const done = S.perf + S.good + S.miss, acc = done ? (S.perf + S.good * .6) / done : 1;
  const top = Hd > Wd ? 40 : 12; // deja espacio para el notch en vertical
  ctx.fillStyle = 'rgba(22,16,42,.86)'; ctx.fillRect(10, top, Math.min(260, Wd - 20), 64);
  txt(S.cfg.title || 'Ensayo', 18, top + 6, 15, '#f2c14e', 'left', true);
  txt(`Precisión ${Math.round(acc * 100)}%`, 18, top + 26, 14, acc >= S.cfg.pass ? '#5bbf6a' : '#e0524a');
  txt(`Meta ${Math.round(S.cfg.pass * 100)}%`, 140, top + 27, 12, '#b3a8cc');
  txt(`Combo ${S.combo}`, 18, top + 44, 13, S.combo > 9 ? '#f2c14e' : '#f4ecdc', 'left', true);
  ctx.fillStyle = '#000'; ctx.fillRect(120, top + 48, Math.min(130, Wd - 140), 5); ctx.fillStyle = '#3fa7c9'; ctx.fillRect(120, top + 48, Math.min(130, Wd - 140) * Math.min(1, t / S.end), 5);
  if (S.jt > 0) txt(S.judge, Wd / 2, hitY - 130, 24, S.judge === 'FALLASTE' ? '#e0524a' : '#f2c14e', 'center', true);
  if (t < S.lead) { const c = Math.ceil(S.lead - t); txt(c > 2 ? '¡Escucha el bombo!' : String(c), Wd / 2, Hd * .32, c > 2 ? 26 : 56, '#f4ecdc', 'center', true); if (c > 2) txt('Toca el carril cuando la flecha cruce la línea dorada', Wd / 2, Hd * .32 + 36, 14, '#b3a8cc', 'center'); }
}
