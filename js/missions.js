// Historia: Prólogo + Capítulo 1 "Llegada de bandas" + recuerdo de 1978, y el mundo libre.
import { save, persist, today } from './save.js';
import * as UI from './ui.js';
import * as A from './audio.js';
import { makeCholita, makeMan, makeDiablo, makeCaporal, makeDog, makeMiniMask, makeInstrument, makeBordado, makeRingCP, PAL } from './models.js';

const ORDER = ['prologo', 'honorio', 'instrumentos', 'carrera', 'perro', 'ensayo', 'flashback', 'libre'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
const D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const pos = G => G.P.veh ? [G.P.veh.x, G.P.veh.z] : [G.P.x, G.P.z];
const touch = () => matchMedia('(pointer:coarse)').matches;

const ROSA = () => makeCholita('#b3306a', '#6b5a7a', { hair: '#a0a0a0', hat: '#3a3a3a' });
const HONORIO = () => makeMan({ shirt: '#5a3a2a', poncho: '#8a4a2a', hat: 'fedora', hatColor: '#3a2a20', mustache: true, gray: true });
const CIRO = () => makeMan({ shirt: '#2f6d8a', pants: '#1e1e2e', hat: 'fedora', hatColor: '#3a2a20', mustache: true });
const RUPERTO = () => makeDiablo('#6b2fa8');
const EUSEBIO = () => makeMan({ shirt: '#1e3a6a', pants: '#1e3a6a', uniform: true, hat: 'cap', hatColor: '#ffffff', mustache: true, gray: true, item: 'trompeta' });

const INSTR = [
  { id: 'bombo', name: 'Bombo', x: 0, z: 60 }, { id: 'trompeta', name: 'Trompeta', x: 0, z: 128 }, { id: 'platillos', name: 'Platillos', x: 8, z: 152 },
  { id: 'tuba', name: 'Bombardino', x: 80, z: 20 }, { id: 'matraca', name: 'Matraca', x: 198, z: 20 }, { id: 'zampona', name: 'Zampoña', x: -60, z: -20 },
];

const L = {
  p1: [['Rosa', 'Josep, hijito, ven. Siéntate un ratito con tu abuela.'],
    ['Rosa', 'Cuarenta febreros bailé para la Mamacha Candelaria. Este año mis rodillas ya no me acompañan.'],
    ['Josep', 'Abuela, no digas eso…'],
    ['Rosa', 'Una promesa no se abandona, Josep. Se hereda.'],
    ['Rosa', 'Pero antes muéstrame tu paso. Escucha el bombo, no tus pies.']],
  p2: [['Rosa', '¡Eso es! Así bailaba yo a tu edad.'], ['Rosa', 'Ahora dime: ¿con qué traje vas a cumplir mi promesa?']],
  pCap: [['Rosa', 'Caporal… como tu abuelo Honorio de joven. Salta alto, que los cascabeles se escuchen hasta el lago.']],
  pDia: [['Rosa', 'Diablo… vaya, hijito. Con esa máscara vas a abrir paso hasta en la plaza llena.']],
  p3: [['Rosa', 'Toma. Mi pañuelo de promesante.'],
    ['Rosa', 'Míralo bien: le faltan siete bordados. Cada uno era un recuerdo mío.'],
    ['Rosa', 'Se fueron perdiendo por Puno, como se pierde todo en la fiesta. Encuéntralos, Josep. Quiero recordar.']],
  p4: [['Honorio', '¡Rosa! Ya estás otra vez con tus bordados…'],
    ['Honorio', 'Josep, Don Ciro te espera en la Plaza de Armas. Llévate a la Torito.'],
    ['Honorio', 'Mi mototaxi tiene más años que tú. Me la cuidas, ¿ya?']],
  h1: [['Don Ciro', '¡Josep! Llegas justo. Soy Don Ciro, guía de Sentimiento Altiplánico.'],
    ['Don Ciro', 'Tu abuela me avisó que vienes a cumplir su promesa. Aquí la promesa se cumple bailando y sudando.']],
  i1: [['Don Ciro', 'Llegó la Banda Lira Altiplánica… y en la bajada se les abrió la carreta.'],
    ['Don Ciro', 'Hay instrumentos regados desde el Jr. Lima hasta el muelle. Sin banda no hay danza.'],
    ['Don Ciro', 'Tráelos de dos en dos. Usa la Torito si quieres. Y si te falta el aire, toma un mate en los puestos verdes.']],
  i2: [['Don Ciro', '¡Eso, hijo! Ahora sí suena la Lira Altiplánica.']],
  c1: [['Ruperto', '¿Tú eres el nieto de doña Rosa? Mi abuelo Fermín dice que tu familia nunca supo perder.'],
    ['Josep', '¿Y tú quién eres?'],
    ['Ruperto', 'Ruperto. Diablada Herederos del Inframundo. Me dicen el Supay.'],
    ['Ruperto', 'Carrera de mototaxis: hasta el muelle y de vuelta a la catedral. Si ganas, te dejo en paz… por hoy.']],
  c2: [['Ruperto', 'Tsss… suerte de principiante.'], ['Ruperto', 'Esa Torito corre más de lo que parece.']],
  d1: [['Ruperto', '¡Oye! ¡Ese perro se llevó mi máscara!'], ['Ruperto', '¡Es la máscara de mi abuelo Fermín! Si la pierdo, me mata.'], ['Josep', '¡Yo lo agarro!']],
  d2: [['Ruperto', '…Gracias, Josep.'],
    ['Ruperto', 'Mi abuelo bailó cuarenta años con esta máscara. Dice que se la regaló alguien a quien nunca volvió a ver.'],
    ['Ruperto', 'Y no le cuentes a nadie que me ayudó uno de Sentimiento Altiplánico, ¿ya?']],
  e1: [['Don Ciro', '(mensaje de voz) ¡Josep! Ensayo general en el malecón del muelle. ¡Ahorita, hijo!']],
  e2: [['Don Ciro', 'Aquí frente al lago se ensaya desde que yo era chiquito.'], ['Don Ciro', 'Sigue las flechas con la banda. Con menos de 60% de precisión, no sales en la entrada.']],
  e3: [['Don Ciro', '¡Así se baila! Mañana la gente va a hablar de ti… pero bien, ¿ah?']],
  e4: [['Eusebio', 'Muchacho… ese pañuelo. Es el de la Rosita, ¿no?'],
    ['Eusebio', 'Soy Eusebio, trompeta de la Lira desde hace cincuenta años.'],
    ['Eusebio', 'En el 78 tu abuela me regaló un bordadito para la suerte. Lo he cargado en el estuche de mi trompeta desde entonces.'],
    ['Eusebio', 'Ya es hora de que vuelva a su dueña.']],
  f1: [['Mamá Juana', 'Rosita, ¿nerviosa? Tranquila. La Mamacha baila contigo.'], ['Rosa joven', '¡Mamá! Ya están tocando en Parque Pino. ¡Me van a dejar!']],
  f2: [['Rosa', 'Tenía quince años. Me temblaban las piernas.'],
    ['Rosa', 'Esa noche, entre tanta gente, un muchacho de diablada me dio la mano para cruzar la calle.'],
    ['Rosa', 'Nunca le vi la cara. Solo la máscara… y unos ojos que se reían.']],
  end: [['Josep', 'Quince años… y un muchacho de diablada.'], ['Josep', 'Me faltan seis bordados. Puno, allá voy.']],
};

/* ---------- escenario según el paso guardado ---------- */
function setBanda(G, playing) {
  const items = ['bombo', 'trompeta', 'tuba', 'platillos', 'trompeta'];
  for (let k = 0; k < 5; k++) G.npc('banda' + k, makeMan({ shirt: '#1e3a6a', pants: '#1e3a6a', uniform: true, hat: 'cap', hatColor: '#ffffff', item: playing ? items[k] : null }), -6 + k * 3, -12.5, 0, playing ? 'dance' : 'idle');
  G.bandaPlaying = playing;
}
function placeRupertoMuelle(G) {
  const rv = G.vehicles.ruperto; rv.x = 163; rv.z = 38; rv.h = 0; rv.speed = 0; rv.m.visible = true; rv.driver.visible = false; rv.m.position.set(rv.x, 0, rv.z); rv.m.rotation.y = 0;
  G.npc('ruperto', RUPERTO(), 166, 31, -Math.PI / 2);
}
function stage(G) {
  const S = G.spots, idx = Math.max(0, ORDER.indexOf(save.step)), tor = G.vehicles.torito;
  G.npc('rosa', ROSA(), S.rosa[0], S.rosa[1], Math.PI / 2);
  G.npc('honorio', HONORIO(), S.honorio[0], S.honorio[1], -Math.PI / 2);
  if (idx >= 1) G.npc('ciro', CIRO(), S.ciro[0], S.ciro[1], Math.PI);
  setBanda(G, idx >= 3);
  if (idx === 0) { G.setModel('josep'); G.place(S.spawn[0], S.spawn[1], -Math.PI / 2); }
  else {
    G.setModel(save.traje || 'caporal', save.colors[save.traje || 'caporal'] || 0);
    if (idx === 1) G.place(-104, 2, Math.PI / 2);
    else { G.place(4, 12, Math.PI); tor.x = 10; tor.z = 17; tor.h = Math.PI / 2; tor.m.position.set(tor.x, 0, tor.z); tor.m.rotation.y = tor.h; }
  }
  if (idx >= 6) { placeRupertoMuelle(G); G.npc('eusebio', EUSEBIO(), 157, 31, Math.PI / 2); }
}

/* ---------- sistemas siempre activos ---------- */
let globals = false;
export function setupGlobal(G) {
  if (globals) return; globals = true;
  const S = G.spots, P = G.P;
  S.mates.forEach((m, i) => G.addInter({ id: 'mate' + i, x: m[0], z: m[1], r: 2.8, label: 'Mate', can: () => !G.flash, use: () => { if (P.air > 98) { UI.toast('Ya tienes aire de sobra'); return; } P.air = 100; A.seq([440, 554, 659], .08, 'sine', .08); UI.toast('Mate de coca: aire al 100%'); } }));
  G.addInter({ id: 'ropero', x: S.ropero[0] + .9, z: S.ropero[1], r: 2.4, label: 'Ropero', can: () => !!save.traje && !G.busy && !G.flash, use: () => G.modal(() => UI.ropero((k, i) => G.equip(k, i))) });
  G.addInter({ id: 'daily', x: S.stage[0], z: S.stage[1], r: 3.2, label: 'Ensayo', can: () => !!save.traje && !G.busy && !G.flash, use: () => G.daily() });
  const tor = G.vehicles.torito;
  G.addInter({ id: 'torito', get x() { return tor.x; }, get z() { return tor.z; }, r: 2.7, label: 'Subir', can: () => save.step !== 'prologo' && !G.flash && tor.m.visible, use: () => G.enterVehicle(tor) });
  const rosaLines = () => [[['Rosa', `¿Ya encontraste algún bordado, hijito? Llevas ${save.bordados.length} de 7.`]], [['Rosa', 'Tu abuelo dice que manejas como él… eso no es un halago, ¿ah?']], [['Rosa', 'Los cascabeles se esconden donde la gente no mira: en lo alto o en medio del gentío.']]][(Math.random() * 3) | 0];
  G.addInter({ id: 'rosa-talk', x: S.rosa[0], z: S.rosa[1], r: 2.6, label: 'Hablar', can: () => save.step !== 'prologo' && !G.busy && !G.flash, use: () => G.say(rosaLines()) });
  G.addInter({ id: 'honorio-talk', x: S.honorio[0], z: S.honorio[1], r: 2.6, label: 'Hablar', can: () => save.step !== 'prologo' && !G.busy && !G.flash, use: () => G.say([['Honorio', P.veh ? '¡Bájate de mi Torito para saludar, pues!' : '¿Y mi Torito? Más te vale que no tenga ni un rayón.']]) });

  // cascabeles del mapa
  G.ticker(dt => {
    for (const c of G.W.cascabeles) { if (!c.m.visible) continue; c.m.rotation.y += dt * 2; }
    if (G.flash || G.mode !== 'play') return;
    const [px, pz] = pos(G), py = P.veh ? 0 : P.y;
    for (const c of G.W.cascabeles) {
      if (!c.m.visible) continue;
      if (Math.hypot(c.x - px, c.z - pz) < (P.veh ? 2.2 : 1.3) && Math.abs((c.y || .9) - (py + .9)) < 1.4) {
        c.m.visible = false; save.found.push(c.id); save.wallet++; persist(); A.jingle(2);
        UI.toast(`Cascabel ${save.found.length}/24` + (c.req === 'caporal' ? ' · ¡en lo alto!' : c.req === 'diablo' ? ' · ¡entre la gente!' : ''));
      }
    }
  });
  // bordado 2 escondido en Parque Pino (dentro del anillo de gente)
  const ring = G.W.rings[0], b2 = makeBordado(); b2.position.set(ring.x, 1.2, ring.z); G.scene.add(b2); b2.visible = !save.bordados.includes(2);
  G.ticker(dt => {
    if (!b2.visible) return; b2.rotation.y += dt * 1.5; b2.position.y = 1.2 + Math.sin(G.t * 2) * .15;
    if (G.flash || !save.traje || P.veh || G.lock || G.mode !== 'play') return;
    if (Math.hypot(P.x - ring.x, P.z - ring.z) < 1.5) {
      b2.visible = false; save.bordados.push(2); persist(); G.burst();
      G.modal(() => UI.bordadoGet(2, 'Rosa lo bordó a escondidas para su primer traje. Este recuerdo se abrirá en el Capítulo 2.'));
    }
  });
}

/* ---------- pasos de la historia ---------- */
const STEPS = {
  async prologo(G) {
    const S = G.spots;
    await G.card('Prólogo', 'Enero, en el barrio Laykakota');
    G.objective('Prólogo', 'Habla con la abuela Rosa en el patio');
    G.target(S.rosa[0], S.rosa[1]);
    UI.toast(touch() ? 'Arrastra el pulgar a la izquierda para caminar · A = acción' : 'WASD o flechas para caminar · E = acción', 4000);
    await G.interact('rosa', S.rosa[0], S.rosa[1], 'Hablar');
    G.clearTarget(); G.face('rosa', G.P.x, G.P.z);
    await G.say(L.p1);
    for (;;) {
      const r = await G.rhythm({ title: 'El paso de la abuela', bpm: 88, beats: 30, seed: 5, pass: .5, easy: true, cam: Math.PI / 2 });
      if (r.pass) break;
      await G.say([['Rosa', `${r.pct}%… Otra vez, despacito. Escucha el bombo, no tus pies.`]]);
    }
    await G.say(L.p2);
    const t = await G.modal(() => UI.chooseTraje());
    save.traje = t; save.colors[t] = 0; persist(); G.setModel(t, 0); A.jingle();
    await G.say(t === 'caporal' ? L.pCap : L.pDia);
    await G.say(L.p3);
    UI.toast('Nuevo: el pañuelo de Rosa · 0/7 (Menú → Pañuelo)', 3500);
    G.face('honorio', G.P.x, G.P.z);
    await G.say(L.p4);
    UI.toast(t === 'caporal' ? 'B = Salto de cascabel (tócalo dos veces para doble salto)' : 'B = Rugido: abre paso entre la multitud', 4000);
  },

  async honorio(G) {
    const S = G.spots, P = G.P, tor = G.vehicles.torito;
    G.npc('ciro', CIRO(), S.ciro[0], S.ciro[1], Math.PI);
    G.objective('Prólogo', 'Sube a la Torito, la mototaxi del abuelo Honorio');
    G.targetFollow(() => [tor.x, tor.z]);
    await G.until(() => P.veh === tor);
    UI.toast(touch() ? 'Apunta el joystick hacia donde quieres ir · B = bocina' : 'Flechas para manejar · E para bajar · Espacio = bocina', 4000);
    G.objective('Prólogo', 'Maneja hasta la Plaza de Armas (sigue la flecha dorada)');
    G.target(0, 18);
    await G.until(() => D(pos(G), [0, 18]) < 12);
    G.objective('Prólogo', 'Bájate (A) y habla con Don Ciro, junto a la banda');
    G.target(S.ciro[0], S.ciro[1]);
    await G.interact('ciro', S.ciro[0], S.ciro[1], 'Hablar');
    G.clearTarget(); G.face('ciro', P.x, P.z);
    await G.say(L.h1);
    await G.card('Capítulo 1', 'Llegada de bandas');
  },

  async instrumentos(G) {
    const S = G.spots, P = G.P;
    await G.say(L.i1);
    for (;;) {
      const items = INSTR.map(it => { const m = makeInstrument(it.id); m.scale.setScalar(1.6); G.scene.add(m); return { ...it, m, state: 'ground' }; });
      let carry = [], done = 0;
      G.objective('Llegada de bandas', 'Junta los 6 instrumentos (máx. 2 a la vez) y llévalos a la banda');
      G.timerStart(210); G.busy = true;
      G.ticker(dt => {
        if (!G.timer) return false;
        const [px, pz] = pos(G), pr = P.veh ? 3 : 1.9;
        for (const it of items) {
          if (it.state === 'ground') {
            it.m.position.set(it.x, 1.2 + Math.sin(G.t * 3 + it.x) * .25, it.z); it.m.rotation.y += dt * 1.6;
            if (carry.length < 2 && Math.hypot(it.x - px, it.z - pz) < pr) { it.state = 'carry'; carry.push(it); UI.toast(`Recogiste: ${it.name}`); A.seq([880, 1100], .06); }
          } else if (it.state === 'carry') { const k = carry.indexOf(it); it.m.position.set(px + (k ? .55 : -.55), (P.veh ? 2.6 : P.y + 2.5) + Math.sin(G.t * 5 + k) * .08, pz); it.m.rotation.y = G.t * 2; }
          else { it.m.position.set(-7 + it.slot * 2.8, .5, -10); it.m.rotation.y = 0; }
        }
        if (carry.length && Math.hypot(S.banda[0] - px, S.banda[1] - pz) < 8) {
          carry.forEach(it => { it.state = 'done'; it.slot = done++; }); carry = [];
          UI.toast(done < 6 ? `¡${done} de 6 en la banda!` : '¡Banda completa!'); A.seq([523, 659, 784], .08, 'square', .06);
        }
        G.objExtra(`Banda ${done}/6 · En manos ${carry.length}/2`);
        if (carry.length >= 2 || done + carry.length === 6) G.target(S.banda[0], S.banda[1] + 2);
        else { let best = null, bd = 1e9; for (const it of items) if (it.state === 'ground') { const d = Math.hypot(it.x - px, it.z - pz); if (d < bd) { bd = d; best = it; } } if (best) G.target(best.x, best.z); }
      });
      await G.until(() => done === 6 || !G.timer || G.timer.left <= 0);
      G.timerStop(); G.busy = false; G.clearTarget(); G.objExtra('');
      items.forEach(it => G.scene.remove(it.m));
      if (done === 6) break;
      await G.say([['Don Ciro', 'Ya se hizo tarde y la banda sigue incompleta. ¡Otra vez, rápido! Usa la Torito para lo que está lejos.']]);
    }
    setBanda(G, true); G.burst(0, -12);
    await G.say(L.i2);
    G.reward(5, 'Banda completa');
  },

  async carrera(G) {
    const P = G.P, rv = G.vehicles.ruperto;
    rv.x = 20; rv.z = -4; rv.h = 0; rv.m.visible = true; rv.driver.visible = false; rv.m.position.set(rv.x, 0, rv.z); rv.m.rotation.y = 0;
    G.npc('ruperto', RUPERTO(), 17, -8, -Math.PI / 2);
    A.honk();
    G.objective('Capítulo 1', 'Alguien toca bocina en la esquina de la plaza…');
    G.target(17, -8);
    await G.interact('ruperto', 17, -8, 'Hablar');
    G.clearTarget(); G.face('ruperto', P.x, P.z);
    await G.say(L.c1);
    for (;;) {
      const r = await race(G, false);
      if (r.win) break;
      G.npc('ruperto', RUPERTO(), rv.x + 1.8, rv.z, -Math.PI / 2); rv.driver.visible = false;
      await G.say([['Ruperto', '¡Jajay! El Supay no pierde en su tierra. ¿Otra?']]);
    }
    rv.driver.visible = false; G.npc('ruperto', RUPERTO(), rv.x + 1.8, rv.z + 1, Math.PI); G.face('ruperto', P.veh ? P.veh.x : P.x, P.veh ? P.veh.z : P.z);
    await G.say(L.c2);
    G.reward(5, 'Le ganaste al Supay');
  },

  async perro(G) {
    const P = G.P;
    if (!G.npcs.ruperto) G.npc('ruperto', RUPERTO(), 14, -17, 0);
    A.bark();
    await G.say(L.d1);
    for (;;) {
      const dog = makeDog('#8a6a4a'); const mask = makeMiniMask(); mask.position.set(0, 0, .06); dog.userData.mouth.add(mask); G.scene.add(dog);
      const path = [[6, -14], [6, 12], [0, 24], [0, 60], [0, 100], [0, 140], [6, 158], [16, 170], [20, 150], [20, 110], [20, 70], [20, 30], [14, 16]];
      const d = { x: 12, z: -18, wi: 0, burst: 0, tired: 0, stun: 0, ph: 0, barkT: 2 };
      let caught = false, warn = 0;
      G.busy = true; G.timerStart(90);
      G.objective('¡El perro de la máscara!', 'Atrápalo a pie. Empuja el joystick al borde para correr.' + (save.traje === 'diablo' ? ' Tu rugido lo deja quieto.' : ' Cuando se canse, ¡alcánzalo!'));
      G.targetFollow(() => [d.x, d.z]);
      G.onRoar = () => { if (Math.hypot(d.x - P.x, d.z - P.z) < 9) { d.stun = 2.6; UI.toast('¡El perro se quedó tieso del susto!'); } };
      G.ticker(dt => {
        if (caught || !G.timer) return false;
        if (G.lock) return;
        const pd = Math.hypot(d.x - P.x, d.z - P.z);
        let sp;
        if (d.stun > 0) { d.stun -= dt; sp = 0; }
        else if (d.burst > 0) { d.burst -= dt; sp = 6.9; if (d.burst <= 0) d.tired = 1.8; }
        else if (d.tired > 0) { d.tired -= dt; sp = 3.4; }
        else { sp = 5.2; if (pd < 5.5) { d.burst = 1.3; A.bark(); } }
        const w = path[d.wi], dx = w[0] - d.x, dz = w[1] - d.z, L2 = Math.hypot(dx, dz);
        if (L2 < 1) d.wi = (d.wi + 1) % path.length; else { d.x += dx / L2 * sp * dt; d.z += dz / L2 * sp * dt; dog.rotation.y = Math.atan2(dx, dz); }
        d.ph += dt * sp * 3;
        dog.userData.legs.forEach((l, i) => { l.rotation.x = Math.sin(d.ph + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * .7 * Math.min(1, sp / 3); });
        dog.userData.tail.rotation.y = Math.sin(G.t * 14) * .5;
        dog.position.set(d.x, d.stun > 0 ? Math.abs(Math.sin(G.t * 20)) * .05 : 0, d.z);
        d.barkT -= dt; if (d.barkT < 0) { d.barkT = 3 + Math.random() * 3; A.bark(); }
        if (!P.veh && pd < 1.6) caught = true;
        if (P.veh && pd < 5) { warn -= dt; if (warn <= 0) { warn = 3; UI.toast('¡Bájate de la mototaxi para agarrarlo!'); } }
        G.objExtra(d.stun > 0 ? '¡Quieto!' : d.tired > 0 ? '¡Se cansó, ahora!' : `A ${Math.round(pd)} m`);
      });
      await G.until(() => caught || !G.timer || G.timer.left <= 0);
      G.timerStop(); G.busy = false; G.clearTarget(); G.onRoar = null; G.objExtra('');
      G.scene.remove(dog);
      if (caught) { A.chime(); break; }
      await G.say([['Ruperto', '¡Se escapó! Debe estar dando vueltas por el Jr. Lima… ¡otra vez!']]);
    }
    G.npc('ruperto', RUPERTO(), P.x + 1.6, P.z + 1.2, 0); G.face('ruperto', P.x, P.z);
    await G.say(L.d2);
    G.reward(5, 'Máscara recuperada');
  },

  async ensayo(G) {
    const P = G.P, M = G.spots.muelle;
    await G.say(L.e1);
    G.npcRemove('ruperto');
    G.objective('Capítulo 1', 'Ve al ensayo general en el malecón del muelle');
    G.target(M[0], M[1]);
    await G.until(() => D(pos(G), M) < 9);
    G.clearTarget(); if (P.veh) G.exitVehicle();
    P.x = M[0]; P.z = M[1];
    const kind = save.traje || 'caporal';
    for (let k = 0; k < 6; k++) G.npc('tr' + k, kind === 'caporal' ? makeCaporal(PAL.caporal[k % 4]) : makeDiablo(PAL.diablo[k % 4]), M[0] - 3.6 + (k % 3) * 3.6, M[1] - 2.6 - (k > 2 ? 2.2 : 0), 0, 'dance');
    G.npc('ciro', CIRO(), M[0] + 4.5, M[1] + 1, -Math.PI / 2);
    await G.say(L.e2);
    for (;;) {
      const r = await G.rhythm({ title: 'Ensayo general', bpm: 100, beats: 40, seed: 11, pass: .6 });
      if (r.pass) { await G.say([['Don Ciro', `${r.pct}% de precisión.`], ...L.e3]); break; }
      await G.say([['Don Ciro', `${r.pct}%. El bombo, Josep. Escucha el bombo. ¡Otra vez!`]]);
    }
    G.npc('eusebio', EUSEBIO(), P.x + 2.4, P.z + 1.6, 0); G.face('eusebio', P.x, P.z);
    await G.say(L.e4);
    save.bordados.push(1); persist(); G.burst();
    await G.modal(() => UI.bordadoGet(1, 'Rosa tenía quince años la primera vez que bailó para la Mamacha.'));
    for (let k = 0; k < 6; k++) G.npcRemove('tr' + k);
  },

  async flashback(G) {
    const P = G.P;
    G.npcRemove('eusebio');
    await G.card('Recuerdo', 'Puno, febrero de 1978');
    G.flashback(true);
    G.place(0, 40, 0);
    G.npc('juana', makeCholita('#7b3fbf', '#3a2a4a', { hair: '#2a2a2a' }), 1.6, 37, 0); G.face('juana', P.x, P.z);
    await G.say(L.f1);
    G.objective('Recuerdo · 1978', 'Corre a Parque Pino: tu conjunto ya está saliendo');
    G.target(0, 150);
    await G.until(() => Math.hypot(P.x, P.z - 150) < 9);
    G.clearTarget(); G.npcRemove('juana');
    const cols = ['#e2447a', '#f2c14e', '#3fa7c9'];
    for (let k = 0; k < 6; k++) G.npc('fb' + k, makeCholita(cols[k % 3], '#8a3a6a'), P.x - 3.6 + (k % 3) * 3.6, P.z - 2.6 - (k > 2 ? 2.2 : 0), 0, 'dance');
    await G.rhythm({ title: 'Mi primera entrada · 1978', bpm: 94, beats: 26, seed: 78, pass: 0, easy: true });
    for (let k = 0; k < 6; k++) G.npcRemove('fb' + k);
    await G.say(L.f2);
    G.flashback(false);
    placeRupertoMuelle(G); G.npc('eusebio', EUSEBIO(), 157, 31, Math.PI / 2); G.npc('ciro', CIRO(), G.spots.ciro[0], G.spots.ciro[1], Math.PI);
    G.place(160, 24, Math.PI);
    await G.say(L.end);
    G.burst();
    await G.modal(() => UI.chapterDone({ bordados: save.bordados.length, found: save.found.length, wallet: save.wallet }));
  },

  async libre(G) {
    if (!G.npcs.ruperto) placeRupertoMuelle(G);
    const freeObj = () => G.objective('Puno libre', 'Busca cascabeles y el bordado escondido en Parque Pino. Ruperto espera la revancha en el muelle.');
    freeObj();
    G.addInter({ id: 'eusebio-talk', x: 157, z: 31, r: 2.6, label: 'Hablar', can: () => !G.busy && !G.flash && !!G.npcs.eusebio, use: () => G.say([['Eusebio', 'Tu abuela bailaba como nadie. Y el que bailaba a su lado… ese también era bueno, ¿ah?']]) });
    G.addInter({ id: 'revancha', x: 166, z: 31, r: 2.8, label: 'Revancha', can: () => !G.busy && !G.flash && !!G.npcs.ruperto, use: async () => {
      await G.say([['Ruperto', save.bestRace ? `Tu mejor tiempo: ${save.bestRace.toFixed(1)} s. ¿Lo bajas?` : '¿Revancha? Hasta la catedral, como la otra vez.']]);
      const r = await race(G, true);
      G.vehicles.ruperto.driver.visible = false;
      if (r.win) { const best = !save.bestRace || r.time < save.bestRace; if (best) save.bestRace = r.time; persist(); G.reward(2, best ? `¡Récord! ${r.time.toFixed(1)} s` : `${r.time.toFixed(1)} s`); }
      else UI.toast('Ruperto ganó esta vez. ¡Revancha en el muelle!');
      placeRupertoMuelle(G); freeObj();
    } });
    await new Promise(() => {});
  },
};

/* ---------- carrera contra Ruperto ---------- */
async function race(G, rematch) {
  const P = G.P, tor = G.vehicles.torito, rv = G.vehicles.ruperto, ST = G.spots.raceStart;
  G.npcRemove('ruperto'); rv.m.visible = true; rv.driver.visible = true;
  if (P.veh !== tor) { G.objective('Carrera', 'Sube a la Torito'); G.targetFollow(() => [tor.x, tor.z]); await G.until(() => P.veh === tor); }
  G.objective('Carrera', 'Ve a la línea de partida, al lado sur de la plaza'); G.target(ST[0], ST[1]);
  rv.x = ST[0]; rv.z = ST[1] + 2.6; rv.h = Math.PI / 2; rv.speed = 0; rv.m.position.set(rv.x, 0, rv.z); rv.m.rotation.y = rv.h;
  await G.until(() => Math.hypot(tor.x - ST[0], tor.z - ST[1]) < 7);
  G.clearTarget(); G.busy = true; G.noExit = true; G.lockDrive = true;
  tor.x = ST[0]; tor.z = ST[1] - 2.6; tor.h = Math.PI / 2; tor.speed = 0;
  const CPS = [[60, 20], [120, 20], [160, 20], [160, -20], [100, -20], [60, -20], [10, -20]];
  const rings = CPS.map((c, i) => { const prev = i ? CPS[i - 1] : ST; const m = makeRingCP(); m.position.set(c[0], 3.4, c[1]); m.rotation.y = Math.atan2(c[0] - prev[0], c[1] - prev[1]); G.scene.add(m); return m; });
  G.objective('Carrera vs. Ruperto', 'Pasa por los 7 aros dorados. Gana quien llegue primero a la catedral.');
  for (const c of ['3', '2', '1']) { UI.big(c); A.sfx(440, .15, 'square', .08); await G.wait(.8); }
  UI.big('¡YA!'); A.sfx(880, .3, 'square', .1); G.lockDrive = false;
  let pi = 0, ri = 0, done = null; const t0 = G.t, aiSpd = rematch ? 12.5 : 11.4;
  G.ticker(dt => {
    if (done) return false;
    if (G.lock) return;
    rings.forEach((m, i) => { m.visible = i >= pi && i <= pi + 1; m.material.opacity = i === pi ? .9 : .3; m.scale.setScalar(i === pi ? 1 + Math.sin(G.t * 6) * .05 : 1); });
    if (pi < CPS.length && Math.hypot(tor.x - CPS[pi][0], tor.z - CPS[pi][1]) < 6.5) { pi++; A.chime(); }
    if (pi < CPS.length) G.target(CPS[pi][0], CPS[pi][1]);
    if (ri < CPS.length) {
      const c = CPS[ri], d = angDiff(Math.atan2(c[0] - rv.x, c[1] - rv.z), rv.h);
      rv.h += clamp(d, -2.6 * dt, 2.6 * dt);
      const want = Math.abs(d) > .5 ? 7 : aiSpd; rv.speed += (want - rv.speed) * Math.min(1, dt * 2);
      rv.x += Math.sin(rv.h) * rv.speed * dt; rv.z += Math.cos(rv.h) * rv.speed * dt;
      if (Math.hypot(rv.x - c[0], rv.z - c[1]) < 5) ri++;
    } else rv.speed *= .9;
    rv.m.position.set(rv.x, 0, rv.z); rv.m.rotation.y = rv.h; for (const w of rv.m.userData.wheels) w.rotation.x += rv.speed * dt / .32;
    G.objExtra(`Aros ${pi}/${CPS.length} · Ruperto ${ri}/${CPS.length} · ${(G.t - t0).toFixed(1)} s`);
    if (pi >= CPS.length) done = 'win'; else if (ri >= CPS.length) done = 'lose';
  });
  await G.until(() => done);
  const time = G.t - t0;
  rings.forEach(m => G.scene.remove(m)); G.clearTarget(); G.busy = false; G.noExit = false; G.objExtra('');
  UI.big(done === 'win' ? '¡GANASTE!' : 'PERDISTE', 1400);
  if (done === 'win') G.burst(10, -20);
  await G.wait(1.2);
  return { win: done === 'win', time };
}

/* ---------- ensayo del día ---------- */
export async function startDaily(G) {
  const d = today(), done = save.daily.last === d, S = G.spots.stage;
  if (G.P.veh) G.exitVehicle();
  G.place(S[0], S[1], Math.PI / 2); G.P.y = .5;
  await G.say([['Don Ciro', done ? 'Ya cumpliste el ensayo de hoy. Puedes practicar, pero el premio vuelve mañana.' : `Ensayo del día. Tu racha: ${save.daily.streak} día${save.daily.streak === 1 ? '' : 's'}. ¡A todo pulmón!`]]);
  const seed = [...d].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  const r = await G.rhythm({ title: 'Ensayo del día', bpm: 100 + (Math.abs(seed) % 12), beats: 34, seed, pass: .6, cam: Math.PI / 2 });
  if (done) { UI.toast(`Práctica: ${r.pct}%`); return; }
  if (!r.pass) { await G.say([['Don Ciro', `${r.pct}%. Casi. El día todavía no termina: inténtalo otra vez.`]]); return; }
  const y = today(new Date(Date.now() - 864e5));
  save.daily.streak = save.daily.last === y ? save.daily.streak + 1 : 1; save.daily.last = d;
  const n = 3 + (save.daily.streak % 3 === 0 ? 3 : 0); save.wallet += n; persist(); A.coin(); G.burst();
  await G.say([['Don Ciro', `${r.pct}%. ¡Bien, hijo! +${n} cascabeles. Racha: ${save.daily.streak} día${save.daily.streak === 1 ? '' : 's'}. Vuelve mañana.`]]);
  if (save.daily.streak >= 7 && !save.devota) {
    save.devota = true; for (const k of ['caporal', 'diablo']) if (!save.owned[k].includes(4)) save.owned[k].push(4); persist();
    UI.toast('¡7 días seguidos! Desbloqueaste el traje Oro devoto en el ropero', 4500);
  }
}

/* ---------- director ---------- */
export async function runStory(G, before) {
  stage(G);
  if (before) await before();
  let i = Math.max(0, ORDER.indexOf(save.step));
  for (; i < ORDER.length; i++) { save.step = ORDER[i]; persist(); await STEPS[ORDER[i]](G); }
}
