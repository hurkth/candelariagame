// Audio sintetizado con WebAudio: bombo, cascabeles, banda, mototaxi.
export let actx = null;
let master = null, bus = null, noise = null, eng = null, engGain = null;
let muted = false;

export function unlock() {
  if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(actx.destination);
    noise = actx.createBuffer(1, actx.sampleRate * .5, actx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { actx = null; }
}
export function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 1; }
export const isMuted = () => muted;

export function newBus(vol = .5) { if (!actx) return null; stopBus(); bus = actx.createGain(); bus.gain.value = vol; bus.connect(master); return bus; }
export function stopBus() { if (bus) { try { bus.gain.setValueAtTime(0, actx.currentTime); bus.disconnect(); } catch (e) {} bus = null; } }

export function kick(t, b = master, vol = .9) {
  const o = actx.createOscillator(), v = actx.createGain();
  o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + .16);
  v.gain.setValueAtTime(vol, t); v.gain.exponentialRampToValueAtTime(.001, t + .25);
  o.connect(v); v.connect(b); o.start(t); o.stop(t + .3);
}
export function hat(t, b = master, vol = .12, len = .04, freq = 6000) {
  const s = actx.createBufferSource(); s.buffer = noise;
  const f = actx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = freq;
  const v = actx.createGain(); v.gain.setValueAtTime(vol, t); v.gain.exponentialRampToValueAtTime(.001, t + len);
  s.connect(f); f.connect(v); v.connect(b); s.start(t); s.stop(t + len + .02);
}
export function tone(t, b, fr, dur, type = 'triangle', vol = .18) {
  const o = actx.createOscillator(), v = actx.createGain(); o.type = type; o.frequency.value = fr;
  v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(vol, t + .01); v.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(v); v.connect(b || master); o.start(t); o.stop(t + dur + .05);
}
export function sfx(fr, dur = .08, type = 'square', vol = .08) { if (actx) tone(actx.currentTime, master, fr, dur, type, vol); }
export function seq(freqs, step = .08, type = 'triangle', vol = .1) { if (!actx) return; const t = actx.currentTime; freqs.forEach((f, i) => tone(t + i * step, master, f, step * 1.8, type, vol)); }

export const PENTA = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];

/* saya: bombo en 1 y 3, cascabeles en corcheas, acento en el "y" de 2 y 4 */
export function groove(b, t0, bpm, beats) {
  const spb = 60 / bpm;
  for (let i = 0; i < beats; i++) {
    const t = t0 + i * spb;
    if (i % 2 === 0) kick(t, b);
    hat(t, b, .1); hat(t + spb / 2, b, i % 2 ? .22 : .08, i % 2 ? .09 : .04);
    if (i % 4 === 0) tone(t, b, i % 8 === 0 ? 110 : 98, spb * 1.8, 'sine', .25);
  }
}
/* un compás de banda para ambientar la plaza */
export function bandaBar(vol = .05) {
  if (!actx) return;
  const t = actx.currentTime + .05, spb = .5, m = [4, 3, 2, 3, 4, 4, 5, 4];
  m.forEach((n, i) => tone(t + i * spb / 2, master, PENTA[n], spb * .45, 'square', vol * .7));
  for (let i = 0; i < 4; i++) { if (i % 2 === 0) kick(t + i * spb, master, vol * 6); hat(t + i * spb + spb / 2, master, vol * 2); }
}

export function jingle(k = 0) { if (!actx) return; const t = actx.currentTime; for (let i = 0; i < 3; i++) hat(t + i * .035, master, .12, .08, 5000 + k * 1500 + i * 600); }
export function chime() { seq([784, 988, 1175], .07, 'triangle', .1); }
export function coin() { seq([1320, 1760], .06, 'triangle', .08); }
export function bump() { if (!actx) return; kick(actx.currentTime, master, .5); }
export function honk() { if (!actx) return; const t = actx.currentTime; tone(t, master, 392, .25, 'square', .08); tone(t, master, 494, .25, 'square', .06); }
export function bark() { if (!actx) return; const t = actx.currentTime; for (let i = 0; i < 2; i++) { const o = actx.createOscillator(), v = actx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(520, t + i * .16); o.frequency.exponentialRampToValueAtTime(260, t + i * .16 + .1); v.gain.setValueAtTime(.12, t + i * .16); v.gain.exponentialRampToValueAtTime(.001, t + i * .16 + .12); o.connect(v); v.connect(master); o.start(t + i * .16); o.stop(t + i * .16 + .14); } }
export function whistle() { if (!actx) return; const t = actx.currentTime; const o = actx.createOscillator(), l = actx.createOscillator(), lg = actx.createGain(), v = actx.createGain(); o.frequency.value = 2300; l.frequency.value = 28; lg.gain.value = 120; l.connect(lg); lg.connect(o.frequency); v.gain.setValueAtTime(.08, t); v.gain.exponentialRampToValueAtTime(.001, t + .7); o.connect(v); v.connect(master); o.start(t); l.start(t); o.stop(t + .7); l.stop(t + .7); }
export function roar() {
  if (!actx) return; const t = actx.currentTime;
  const s = actx.createBufferSource(); s.buffer = noise; const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(150, t + .5);
  const v = actx.createGain(); v.gain.setValueAtTime(.5, t); v.gain.exponentialRampToValueAtTime(.001, t + .55); s.connect(f); f.connect(v); v.connect(master); s.start(t); s.stop(t + .6);
  tone(t, master, 70, .5, 'sawtooth', .15);
}
export function engine(on, speed = 0) {
  if (!actx) return;
  if (!eng && on) {
    eng = actx.createOscillator(); eng.type = 'sawtooth';
    const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
    engGain = actx.createGain(); engGain.gain.value = 0; eng.connect(f); f.connect(engGain); engGain.connect(master); eng.start();
  }
  if (eng) { eng.frequency.setTargetAtTime(36 + Math.abs(speed) * 6, actx.currentTime, .1); engGain.gain.setTargetAtTime(on ? .045 : 0, actx.currentTime, .15); }
}
