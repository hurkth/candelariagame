// Interfaz: diálogos, tarjetas, toasts, menús y modales.
import * as A from './audio.js';
import { save, persist, wipe } from './save.js';
import { PAL, PAL_NAMES, COSTS } from './models.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const SPEAKERS = {
  'Rosa': ['R', '#b3306a'], 'Rosa joven': ['R', '#e2447a'], 'Honorio': ['H', '#a0581f'], 'Josep': ['J', '#2f7fb5'],
  'Don Ciro': ['C', '#2f6d8a'], 'Ruperto': ['S', '#6b2fa8'], 'Eusebio': ['E', '#a8800f'], 'Mamá Juana': ['J', '#7b3fbf'], 'Narrador': ['✦', '#4a3d7a'],
};
export const BORDADOS = [
  { n: 1, name: 'La primera vez que bailé', ch: 'Capítulo 1' },
  { n: 2, name: 'El primer traje que bordé', ch: 'Escondido en Parque Pino' },
  { n: 3, name: '???', ch: 'Capítulo 2' }, { n: 4, name: '???', ch: 'Capítulo 3' }, { n: 5, name: '???', ch: 'Capítulo 3' },
  { n: 6, name: '???', ch: 'Capítulo 4' }, { n: 7, name: '???', ch: 'Capítulo 5' },
];

/* ---------- diálogo ---------- */
export function say(lines) {
  return new Promise(res => {
    const d = $('dialog'); let i = 0, timer = null, full = '';
    const show = () => {
      const [who, text] = lines[i]; const s = SPEAKERS[who] || ['?', '#555'];
      $('dlg-por').textContent = s[0]; $('dlg-por').style.background = s[1]; $('dlg-who').textContent = who;
      full = text; let k = 0; $('dlg-txt').textContent = ''; clearInterval(timer);
      timer = setInterval(() => { k += 2; $('dlg-txt').textContent = full.slice(0, k); if (k >= full.length) { clearInterval(timer); timer = null; } }, 24);
    };
    const adv = () => {
      if (timer) { clearInterval(timer); timer = null; $('dlg-txt').textContent = full; return; }
      i++;
      if (i >= lines.length) { d.hidden = true; d.onpointerdown = null; removeEventListener('keydown', kh, true); res(); }
      else { A.sfx(700, .03, 'square', .025); show(); }
    };
    const kh = e => { if (['Space', 'Enter', 'KeyE'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) adv(); } };
    d.hidden = false; d.onpointerdown = e => { e.preventDefault(); A.unlock(); adv(); };
    addEventListener('keydown', kh, true); show();
  });
}

/* ---------- avisos ---------- */
let toastT = null;
export function toast(msg, ms = 2400) { const t = $('toast'); t.textContent = msg; t.hidden = false; t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, ms); }
export function big(text, ms = 750) { const b = $('big'); b.textContent = text; b.hidden = false; b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; clearTimeout(big.t); big.t = setTimeout(() => { b.hidden = true; }, ms); }
export function card(title, sub, ms = 2600) {
  return new Promise(res => { $('card-t').textContent = title; $('card-s').textContent = sub || ''; $('card').hidden = false; setTimeout(() => { $('card').hidden = true; res(); }, ms); });
}
export function objective(t, x) { $('obj-t').textContent = t; $('obj-x').textContent = x; $('obj-e').textContent = ''; requestAnimationFrame(syncBars); }
export function objExtra(x) { if ($('obj-e').textContent !== x) { $('obj-e').textContent = x; requestAnimationFrame(syncBars); } }
function syncBars() { const h = $('obj').getBoundingClientRect().height; document.documentElement.style.setProperty('--objh', h + 'px'); }
export function hud(on) { $('hud').hidden = !on; }
export function controls(on) { $('controls').hidden = !on; }

/* ---------- modales ---------- */
export function modal(html) { const m = $('modal'); m.innerHTML = `<div class="panel">${html}</div>`; m.hidden = false; return m; }
export function closeModal() { $('modal').hidden = true; $('modal').innerHTML = ''; }

const trajeSwatch = (kind, ci) => kind === 'caporal'
  ? `background:linear-gradient(180deg,#15111f 0 18%,${PAL.caporal[ci]} 18% 62%,#f2c14e 62% 66%,#1e1a2e 66% 86%,#f4ecdc 86%)`
  : `background:radial-gradient(circle at 50% 30%,#d6453d 0 16%,transparent 17%),linear-gradient(180deg,#2a1020 0 10%,${PAL.diablo[ci]} 10% 70%,#f2c14e 70% 74%,#20141e 74%)`;

export function chooseTraje() {
  return new Promise(res => {
    const m = modal(`<h2>¿Con qué traje cumplirás la promesa?</h2>
      <p class="muted">Puedes cambiarlo después en el ropero de la abuela.</p>
      <div class="grid2">
        <button class="traje" data-t="caporal"><div class="sw" style="${trajeSwatch('caporal', 0)}"></div><b>Caporal</b><small><b style="font-size:14px">Salto de cascabel.</b> Doble salto para llegar a techos y quioscos. Corre más rápido.</small></button>
        <button class="traje" data-t="diablo"><div class="sw" style="${trajeSwatch('diablo', 0)}"></div><b>Diablo</b><small><b style="font-size:14px">Rugido de máscara.</b> Abre paso entre la multitud y asusta a los perros.</small></button>
      </div>`);
    m.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { A.chime(); closeModal(); res(b.dataset.t); });
  });
}
export function bordadoGet(n, extra) {
  return new Promise(res => {
    const b = BORDADOS[n - 1];
    const m = modal(`<div class="big-bd"></div><h2 style="text-align:center">Bordado ${n} de 7</h2><h3 style="text-align:center;color:var(--oro)">«${esc(b.name)}»</h3>
      ${extra ? `<p style="text-align:center">${esc(extra)}</p>` : ''}<button class="btn primary" id="bd-ok">Coser al pañuelo</button>`);
    A.seq([523, 659, 784, 1047], .1, 'triangle', .12);
    m.querySelector('#bd-ok').onclick = () => { closeModal(); res(); };
  });
}
export function chapterDone(stats) {
  return new Promise(res => {
    const m = modal(`<h2>Capítulo 1 completo</h2>
      <div class="stat"><span>Bordados</span><b>${stats.bordados}/7</b></div>
      <div class="stat"><span>Cascabeles encontrados</span><b>${stats.found}/24</b></div>
      <div class="stat"><span>Cascabeles en bolsa</span><b>${stats.wallet}</b></div>
      <div class="teaser"><h3>Próximamente · Capítulo 2: Día central</h3>
      <p class="muted">2 de febrero. Misa, procesión y concurso de autóctonos en el estadio. Un conjunto autóctono perdió su estandarte, hay danzarines que guiar en su recorrido… y un recuerdo de Rosa revelará quién era aquel muchacho de diablada.</p></div>
      <p class="muted">Mientras tanto Puno sigue abierto: busca cascabeles, el bordado escondido en Parque Pino, y vuelve cada día al Ensayo del día.</p>
      <button class="btn primary" id="cd-ok">Seguir explorando</button>`);
    m.querySelector('#cd-ok').onclick = () => { closeModal(); res(); };
  });
}
export function confirm(title, text, yes = 'Sí', no = 'Cancelar') {
  return new Promise(res => {
    const m = modal(`<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="stack"><button class="btn primary" id="cf-y">${esc(yes)}</button><button class="btn ghost" id="cf-n">${esc(no)}</button></div>`);
    m.querySelector('#cf-y').onclick = () => { closeModal(); res(true); }; m.querySelector('#cf-n').onclick = () => { closeModal(); res(false); };
  });
}

export function album() {
  return new Promise(res => {
    const bd = BORDADOS.map(b => save.bordados.includes(b.n) ? `<div class="bd on">${b.n}</div>` : `<div class="bd">${b.n}<br>${esc(b.ch)}</div>`).join('');
    const names = BORDADOS.filter(b => save.bordados.includes(b.n)).map(b => `<div class="stat"><span>${b.n}. ${esc(b.name)}</span><b>✓</b></div>`).join('');
    const found = save.found.length, fc = save.found.filter(i => i[0] === 'k').length, fd = save.found.filter(i => i[0] === 'd').length;
    const m = modal(`<h2>El pañuelo de Rosa</h2><div class="bordados">${bd}<div class="bd" style="border-style:solid">${save.bordados.length}/7</div></div>${names}
      <h3>Cascabeles · ${found}/24</h3>
      <div class="stat"><span>En alturas (solo Caporal)</span><b>${fc}/6</b></div>
      <div class="stat"><span>Entre la multitud (solo Diablo)</span><b>${fd}/6</b></div>
      <div class="stat"><span>A la vista</span><b>${found - fc - fd}/12</b></div>
      <div class="stat"><span>Racha de ensayo diario</span><b>${save.daily.streak} día${save.daily.streak === 1 ? '' : 's'}</b></div>
      ${save.bestRace ? `<div class="stat"><span>Mejor carrera vs. Ruperto</span><b>${save.bestRace.toFixed(1)} s</b></div>` : ''}
      <button class="btn primary" id="al-ok">Cerrar</button>`);
    m.querySelector('#al-ok').onclick = () => { closeModal(); res(); };
  });
}

export function ropero(onEquip) {
  return new Promise(res => {
    let kind = save.traje || 'caporal';
    const render = () => {
      const sw = PAL[kind].map((c, i) => {
        const owned = save.owned[kind].includes(i), sel = save.traje === kind && save.colors[kind] === i, cost = COSTS[i];
        const lab = owned ? (sel ? 'Puesto' : 'Usar') : cost === null ? 'Racha 7 días' : `${cost} cascabeles`;
        return `<button class="swatch ${sel ? 'sel' : ''} ${owned ? '' : 'lock'}" data-i="${i}"><i style="background:${c}"></i>${esc(PAL_NAMES[kind][i])}<br><b>${lab}</b></button>`;
      }).join('');
      const m = modal(`<h2>Ropero de la abuela</h2><p class="muted">Tienes <b style="color:var(--oro)">${save.wallet}</b> cascabeles.</p>
        <div class="tabs"><button class="btn small ${kind === 'caporal' ? 'on' : ''}" data-k="caporal">Caporal</button><button class="btn small ${kind === 'diablo' ? 'on' : ''}" data-k="diablo">Diablo</button></div>
        <div class="swatches">${sw}</div><button class="btn primary" id="rp-ok">Listo</button>`);
      m.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { kind = b.dataset.k; render(); });
      m.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
        const i = +b.dataset.i, owned = save.owned[kind].includes(i), cost = COSTS[i];
        if (!owned) { if (cost === null || save.wallet < cost) { A.sfx(160, .15, 'sawtooth', .06); toast(cost === null ? 'Se gana con 7 días seguidos de Ensayo del día' : `Te faltan ${cost - save.wallet} cascabeles`); return; } save.wallet -= cost; save.owned[kind].push(i); A.coin(); }
        save.traje = kind; save.colors[kind] = i; persist(); onEquip(kind, i); A.jingle(); render();
      });
      m.querySelector('#rp-ok').onclick = () => { closeModal(); res(); };
    };
    render();
  });
}

export function help() {
  return new Promise(res => {
    const m = modal(`<h2>Cómo jugar</h2>
      <p><b>Celular:</b> arrastra el pulgar en la mitad izquierda para moverte; empuja hasta el borde para correr. <b>A</b> hace la acción (hablar, subir, recoger). <b>B</b> es la habilidad de tu traje.</p>
      <p><b>Mototaxi:</b> apunta el joystick hacia donde quieres ir. Chocar gente sube el <b>chisme</b>: si se llena, Don Ciro te multa.</p>
      <p><b>Teclado:</b> WASD o flechas, Shift corre, E acción, Espacio habilidad, M menú, P foto.</p>
      <p><b>Aire:</b> a 3,827 msnm correr cansa. Toma mate en los puestos verdes.</p>
      <button class="btn primary" id="hp-ok">Entendido</button>`);
    m.querySelector('#hp-ok').onclick = () => { closeModal(); res(); };
  });
}

export function menu(G) {
  return new Promise(res => {
    const m = modal(`<h2>Pausa</h2><div class="stack">
      <button class="btn primary" data-a="back">Seguir jugando</button>
      <button class="btn" data-a="album">Pañuelo y cascabeles</button>
      ${save.traje && !G.busy && !G.flash ? '<button class="btn" data-a="ropero">Ropero</button>' : ''}
      <button class="btn" data-a="help">Cómo jugar</button>
      <button class="btn" data-a="mute">${A.isMuted() ? 'Activar sonido' : 'Silenciar'}</button>
      <a class="btn" style="text-align:center;text-decoration:none" href="https://candelariacentral.com" target="_blank" rel="noopener">Conoce las danzas reales</a>
      <button class="btn ghost" data-a="reset">Borrar progreso</button></div>`);
    m.querySelectorAll('[data-a]').forEach(b => b.onclick = async () => {
      const a = b.dataset.a; closeModal();
      if (a === 'album') await album();
      if (a === 'ropero') await ropero((k, i) => G.equip(k, i));
      if (a === 'help') await help();
      if (a === 'mute') { A.setMuted(!A.isMuted()); save.muted = A.isMuted(); persist(); }
      if (a === 'reset') { if (await confirm('¿Borrar todo?', 'Se pierde tu avance, cascabeles y bordados en este celular.', 'Borrar y empezar', 'No')) { wipe(); location.reload(); return; } }
      res();
    });
  });
}

export function photoResult(dataUrl) {
  return new Promise(res => {
    const m = modal(`<h2>¡Qué foto!</h2><img class="photo-out" src="${dataUrl}" alt="Tu foto en Puno"><div class="stack">
      <button class="btn primary" id="pr-share">Compartir</button><a class="btn" id="pr-dl" download="promesa-candelaria.png" href="${dataUrl}" style="text-align:center;text-decoration:none">Descargar</a>
      <button class="btn ghost" id="pr-ok">Cerrar</button></div><p class="muted">En iPhone también puedes mantener presionada la imagen para guardarla.</p>`);
    m.querySelector('#pr-share').onclick = async () => {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'promesa-candelaria.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'Promesa de Candelaria', text: 'Bailando en Puno 💃 Juega gratis:' });
        else toast('Tu navegador no comparte imágenes: usa Descargar');
      } catch (e) { /* cancelado */ }
    };
    m.querySelector('#pr-ok').onclick = () => { closeModal(); res(); };
  });
}

/* ---------- título ---------- */
export function title({ progress, daily, onPlay, onNew, onDaily }) {
  $('title').hidden = false;
  $('t-play').textContent = progress ? 'Continuar' : 'Jugar';
  $('t-new').hidden = !progress; $('t-daily').hidden = !daily;
  $('t-play').onclick = () => { A.unlock(); $('title').hidden = true; onPlay(); };
  $('t-daily').onclick = () => { A.unlock(); $('title').hidden = true; onDaily(); };
  let armed = false;
  $('t-new').onclick = () => { if (!armed) { armed = true; $('t-new').textContent = '¿Seguro? Toca otra vez para borrar'; return; } A.unlock(); $('title').hidden = true; onNew(); };
}
