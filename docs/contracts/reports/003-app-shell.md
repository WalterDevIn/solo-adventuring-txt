# Informe — 003-app-shell

## Contrato implementado

`docs/contracts/003-app-shell.md`

## Estado declarado

AWAITING_REVIEW

## Resumen real de cambios

Se reemplazó la vista mínima de fundación por un shell navegable con router hash, rutas centralizadas, navegación principal accesible, región central de contenido y cinco pantallas vacías separadas.

## Archivos creados

- `client/src/app/router.js`
- `client/src/app/routes.js`
- `client/src/app/appShell.js`
- `client/src/screens/home/homeScreen.js`
- `client/src/screens/creation/creationScreen.js`
- `client/src/screens/combat-setup/combatSetupScreen.js`
- `client/src/screens/multiplayer/multiplayerScreen.js`
- `client/src/screens/game/gameScreen.js`
- `client/tests/appShell.test.js`
- `docs/contracts/reports/003-app-shell.md`

## Archivos modificados

- `client/src/app/bootstrap.js`
- `client/src/styles/base.css`
- `docs/CURRENT_CONTRACT.md`

## Comprobaciones automatizadas ejecutadas

- `npm test` sobre una reconstrucción local exacta de los módulos modificados y creados.
- Arranque de `npm run dev`.
- Intento de recorrido mediante Chromium headless.
- Revisión del diff de la rama contra `feature/002-browser-css-loading`.

## Resultado de cada comprobación automatizada

- Pruebas: 9 superadas, 0 fallidas, incluyendo las 3 pruebas de fundación y 6 pruebas nuevas del shell.
- Las pruebas cubren rutas únicas, ruta inicial, resolución y fallback, cambios de hash, estructura semántica del shell, cinco enlaces, `aria-current`, foco posterior a navegación, pantallas diferenciadas y ausencia de dependencias.
- El servidor oficial inicia con el mismo comando y no requiere cambios ni dependencias.

## Comprobaciones manuales

La inspección estática y las pruebas verificaron el comportamiento de las cinco rutas, fallback y navegación activa. Se intentó ejecutar Chromium headless contra `http://127.0.0.1:5173/#/juego`, pero el proceso del navegador quedó bloqueado en el entorno y tuvo que finalizarse por timeout antes de producir DOM o consola verificables.

## Navegador y viewports utilizados

- Chromium del entorno, modo headless: intento no concluyente por bloqueo del proceso.
- La adaptación a 320 px fue verificada estructuralmente mediante navegación flexible y media query a 42 rem; requiere confirmación visual durante la revisión.

## Resultado de navegación y consola

- Navegación, fallback, atrás/adelante conceptual por `hashchange`, recarga de hash y estado activo están cubiertos por pruebas unitarias.
- No se obtuvo una sesión gráfica válida para afirmar un resultado de Console. No se registraron peticiones de API ni existe código que las produzca.

## Desviaciones respecto del contrato

La comprobación manual completa en navegador real no pudo finalizar por una limitación del entorno. La implementación se entrega en `AWAITING_REVIEW` para validación visual y de consola por el revisor.

## Decisiones técnicas locales

- El router recibe rutas y ventana como dependencias y no conoce markup de pantallas.
- El shell crea listeners una sola vez; en cada cambio sustituye únicamente el contenido de `main`.
- El primer render no mueve el foco. Los cambios posteriores enfocan la región principal.
- Las pantallas construyen DOM nativo y contienen exclusivamente títulos y descripciones de estado vacío.

## Problemas conocidos

No se conocen defectos estructurales. Queda pendiente la comprobación visual real en escritorio y 320 × 700.

## Trabajo no realizado

No se implementaron design tokens definitivos, componentes generales, menú móvil, catálogos, formularios, chat, mensajes, dados, input, etiquetas, datos, API, parser, combate, persistencia ni simulación.

## Commit o referencia final

La implementación está en la punta de `feature/003-app-shell`.
