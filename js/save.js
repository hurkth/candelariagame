// Guardado local del progreso (solo en este navegador).
const KEY = 'promesa_candelaria_v1';

const fresh = () => ({
  step: 'prologo',            // paso de la historia en curso
  traje: null,                // 'caporal' | 'diablo'
  colors: { caporal: 0, diablo: 0 },
  owned: { caporal: [0], diablo: [0] },
  wallet: 0,                  // cascabeles para gastar
  found: [],                  // ids de cascabeles encontrados en el mapa
  bordados: [],               // números de bordados recuperados
  daily: { last: null, streak: 0 },
  bestRace: null,
  devota: false,
  muted: false,
});

export const save = fresh();

export function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s) Object.assign(save, fresh(), s);
  } catch (e) { /* sin almacenamiento: se juega igual */ }
}
export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* ignorar */ }
}
export function wipe() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ignorar */ }
  Object.assign(save, fresh());
}
export const hasProgress = () => save.step !== 'prologo' || save.traje !== null;

export function today(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
