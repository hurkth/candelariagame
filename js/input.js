// Joystick virtual (mitad izquierda), botón A (acción) y B (habilidad), más teclado.
import { unlock } from './audio.js';

export const input = { x: 0, y: 0, mag: 0, action: false, ability: false, menu: false, photo: false };
const keys = {};
const R = 52;
let joyId = null, ox = 0, oy = 0, jx = 0, jy = 0;

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'run', ShiftRight: 'run',
};

export function initInput() {
  const zone = document.getElementById('joyzone');
  const joy = document.getElementById('joy'), knob = document.getElementById('knob');
  zone.addEventListener('pointerdown', e => {
    unlock();
    if (joyId !== null) return;
    joyId = e.pointerId; zone.setPointerCapture(e.pointerId);
    ox = e.clientX; oy = e.clientY; jx = jy = 0;
    joy.style.left = ox + 'px'; joy.style.top = oy + 'px'; joy.hidden = false;
    knob.style.transform = 'translate(0,0)';
  });
  zone.addEventListener('pointermove', e => {
    if (e.pointerId !== joyId) return;
    let dx = e.clientX - ox, dy = e.clientY - oy;
    const L = Math.hypot(dx, dy);
    if (L > R) { // el joystick sigue al dedo si se pasa del borde
      ox += dx * (1 - R / L) * .5; oy += dy * (1 - R / L) * .5;
      joy.style.left = ox + 'px'; joy.style.top = oy + 'px';
      dx = e.clientX - ox; dy = e.clientY - oy;
      const L2 = Math.hypot(dx, dy); if (L2 > R) { dx *= R / L2; dy *= R / L2; }
    }
    jx = dx / R; jy = dy / R;
    knob.style.transform = `translate(${dx}px,${dy}px)`;
  });
  const end = e => { if (e.pointerId !== joyId) return; joyId = null; jx = jy = 0; joy.hidden = true; };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);

  const bind = (id, flag) => {
    const b = document.getElementById(id);
    b.addEventListener('pointerdown', e => { e.preventDefault(); unlock(); input[flag] = true; b.classList.add('on'); });
    const up = () => b.classList.remove('on');
    b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
  };
  bind('btn-a', 'action'); bind('btn-b', 'ability');
  document.getElementById('btn-menu').addEventListener('click', () => { input.menu = true; });
  document.getElementById('btn-photo').addEventListener('click', () => { input.photo = true; });

  addEventListener('keydown', e => {
    unlock();
    const k = KEYMAP[e.code];
    if (k) { keys[k] = true; e.preventDefault(); }
    if (e.repeat) return;
    if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'KeyF') input.action = true;
    if (e.code === 'Space') { input.ability = true; e.preventDefault(); }
    if (e.code === 'Escape' || e.code === 'KeyM') input.menu = true;
    if (e.code === 'KeyP') input.photo = true;
  });
  addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
}

export function pollInput() {
  if (joyId !== null) {
    const m = Math.min(1, Math.hypot(jx, jy));
    input.mag = m < .12 ? 0 : m; input.x = jx; input.y = -jy;
  } else {
    const kx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), ky = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
    const L = Math.hypot(kx, ky);
    if (L) { input.x = kx / L; input.y = ky / L; input.mag = keys.run ? 1 : .7; }
    else { input.x = input.y = input.mag = 0; }
  }
}
export function endFrame() { input.action = input.ability = input.menu = input.photo = false; }
export function clearSticks() { joyId = null; jx = jy = 0; document.getElementById('joy').hidden = true; }
