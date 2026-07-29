# Informe — 002-browser-css-loading

## Contrato implementado

`docs/contracts/002-browser-css-loading.md`

## Estado declarado

BLOCKED

## Causa confirmada

`client/src/main.js` importaba `reset.css` y `base.css` como módulos JavaScript sin bundler. El servidor respondía con `Content-Type: text/css`, por lo que un navegador estándar rechazaba ambos recursos por MIME estricto y no llegaba a ejecutar `bootstrap()`.

## Resumen real de cambios

- Se retiraron las importaciones CSS de `client/src/main.js`.
- Se enlazaron `reset.css` y `base.css` desde `client/public/index.html`, en ese orden.
- Se ampliaron las pruebas estructurales para impedir regresiones de importación CSS desde JavaScript y verificar el orden de las hojas de estilo.
- Se registró en el informe anterior que la fundación fue rechazada por el defecto MIME.

## Archivos creados

- `docs/contracts/reports/002-browser-css-loading.md`

## Archivos modificados

- `client/public/index.html`
- `client/src/main.js`
- `client/tests/clientFoundation.test.js`
- `docs/contracts/reports/001-client-foundation.md`
- `docs/CURRENT_CONTRACT.md`

## Comprobaciones automatizadas ejecutadas

- `npm test`
- `npm run dev`
- comprobaciones HTTP de `/`, `/src/main.js`, `/src/app/bootstrap.js`, `/src/styles/reset.css` y `/src/styles/base.css`
- intento de validación con Chromium real mediante Playwright en 1440 × 900 y 360 × 800

## Resultado de cada comprobación automatizada

- `npm test`: 3 pruebas superadas, 0 fallidas.
- `npm run dev`: servidor iniciado en `http://localhost:5173`.
- HTTP: HTML 200 `text/html`; `main.js` y `bootstrap.js` 200 `text/javascript`; `reset.css` y `base.css` 200 `text/css`.
- La inspección estática confirma que `main.js` solo importa JavaScript y que el HTML enlaza primero `reset.css` y luego `base.css`.

## Comprobaciones manuales en navegador

Se intentó abrir la aplicación en Chromium real controlado por Playwright. El entorno de ejecución bloqueó toda navegación, incluyendo `http://localhost:5173`, `http://127.0.0.1:5173`, la IP interna del contenedor y rutas `file://`.

## Navegador y viewport utilizados

- Chromium instalado en `/usr/bin/chromium`.
- Viewports intentados: 1440 × 900 y 360 × 800.

## Resultado de Console y Network

No fue posible inspeccionar Console ni Network de la aplicación porque Chromium abortó la navegación antes de cargar el documento con `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Las respuestas HTTP y MIME sí fueron verificadas externamente, pero no se presentan como sustituto de la comprobación real exigida.

## Desviaciones respecto del contrato

La validación en navegador real no pudo completarse por una restricción administrativa del entorno. Por esa razón el contrato no se declara completo y `docs/CURRENT_CONTRACT.md` queda en `BLOCKED`.

## Decisiones técnicas locales

Se mantuvo el servidor y la estructura existentes. La corrección usa únicamente `<link rel="stylesheet">` nativo; no se incorporó bundler, dependencia ni comportamiento de producto.

## Problemas conocidos

La implementación requiere una comprobación final en un navegador sin la política que bloquea navegación local.

## Trabajo no realizado

No se modificaron diseño, bootstrap, servidor, navegación, router, chat, lógica de juego ni archivos fuera del alcance.

## Commit o referencia final

La referencia final será el commit de esta corrección en `feature/002-browser-css-loading`.
