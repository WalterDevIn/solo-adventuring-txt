# Contexto operativo actual

## Estado

```text
AWAITING_REVIEW
```

## Rama de trabajo

```text
master
```

## Trabajo implementado

```text
004-design-foundation
```

Se agregó `tokens.css` con tokens semánticos de color, tipografía, espaciado, radios y transición. El HTML carga `reset.css`, `tokens.css` y `base.css` en ese orden. El shell conserva su estructura y comportamiento, con una identidad retro técnica oscura, foco visible y ruta activa diferenciada por superficie, borde, peso y separación cromática.

## Archivos afectados

```text
client/public/index.html
client/src/styles/tokens.css
client/src/styles/base.css
client/tests/clientFoundation.test.js
client/tests/designFoundation.test.js
docs/ai/CURRENT_CONTEXT.md
```

## Verificación

- Pruebas técnicas del conjunto reconstruido desde los archivos de `master`: 7 superadas, 0 fallidas.
- `npm run dev`: inicio correcto.
- Respuestas HTTP 200 verificadas para `/`, `main.js`, `bootstrap.js`, `reset.css`, `tokens.css` y `base.css`.
- Sin dependencias nuevas y sin importaciones CSS desde JavaScript.
- El único intento visual con Chromium agotó el tiempo por limitaciones del entorno antes de producir captura; no se repitió.

## Revisión pendiente

Confirmar visualmente las cinco rutas en aproximadamente 1280 × 720 y 360 × 800, incluyendo foco, navegación completa, ausencia de solapamientos y ausencia de scroll horizontal.
