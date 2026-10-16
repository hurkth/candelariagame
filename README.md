# Promesa de Candelaria

Juego en el navegador inspirado en la Festividad de la Virgen de la Candelaria (Puno). Mundo abierto pensado para celular, hecho con three.js y sin build.

**Historia:** la abuela Rosa ya no puede bailar y le deja a su nieto Josep su promesa y un pañuelo al que le faltan siete bordados. Cada bordado es un recuerdo jugable.

## MVP (esta rama)
- **Prólogo + Capítulo 1 "Llegada de bandas"** y el recuerdo de 1978.
- **Mapa:** barrio Laykakota (casa de Rosa), Plaza de Armas y Catedral, Jr. Lima, Parque Pino y su Santuario, malecón y muelle.
- **Trajes:** Caporal (doble salto) y Diablo (rugido que abre la multitud).
- **Misiones:** instrumentos de la banda, carrera de mototaxis contra Ruperto "el Supay", el perro de la máscara, ensayo general.
- **Loops:** 24 cascabeles (6 solo caporal, 6 solo diablo), ropero con colores, Ensayo del día con racha, modo foto para compartir, guardado local.

Conjuntos y personajes son ficticios.

## Controles
- **Celular:** pulgar a la izquierda = joystick (al borde corre), **A** = acción, **B** = habilidad.
- **Teclado:** WASD/flechas, Shift corre, E acción, Espacio habilidad, M menú, P foto.

## Estructura
```
index.html          UI y capas
css/style.css       estilos
vendor/three.min.js three.js r128
js/main.js          bucle, cámara, jugador, mototaxi, HUD
js/world.js         mapa, colisiones, multitudes, NPCs que caminan
js/models.js        modelos low-poly y poses
js/missions.js      historia y misiones
js/rhythm.js        minijuego de ritmo
js/ui.js            diálogos, menús, modales
js/input.js         joystick y botones
js/audio.js         audio sintetizado
js/save.js          guardado local
prototipo-v2.html   prototipo anterior por niveles
```

## Correr local
```bash
npx serve .
```
`?autoplay` en la URL hace que el minijuego de ritmo se juegue solo (para pruebas).
