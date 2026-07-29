# Contrato de implementación vigente

## Estado

```text
BLOCKED
```

## Contrato

```text
docs/contracts/002-browser-css-loading.md
```

## Rama esperada

```text
feature/002-browser-css-loading
```

## Rama base requerida

```text
feature/001-client-foundation
```

## Último contrato aceptado

```text
Ninguno
```

## Contrato anterior no aceptado

```text
docs/contracts/001-client-foundation.md
```

Motivo: la implementación carga archivos CSS mediante importaciones de módulos JavaScript sin bundler. El navegador rechaza `reset.css` y `base.css` por MIME estricto, no ejecuta el bootstrap y muestra una página vacía.

## Bloqueo actual

La corrección está implementada y las pruebas estructurales y HTTP pasan, pero el entorno de ejecución bloquea toda navegación de Chromium con `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Falta completar la validación obligatoria en navegador real antes de pasar a `AWAITING_REVIEW`.

## Instrucción para el planificador

No crear otro contrato mientras este permanezca en estado `READY`, `IN_PROGRESS`, `BLOCKED` o `AWAITING_REVIEW`.

Cuando la corrección pueda validarse en navegador real, inspeccionar el código, el informe y la ejecución antes de aceptar la fundación del cliente.

## Instrucción para el implementador

1. Leer `docs/contracts/002-browser-css-loading.md` completo y toda su documentación obligatoria.
2. Usar exclusivamente `feature/002-browser-css-loading`, basada en `feature/001-client-foundation`.
3. Completar la validación en navegador real en un entorno que permita navegar a `http://localhost:5173/`.
4. Si la validación pasa, actualizar el informe y cambiar este estado a `AWAITING_REVIEW`.
5. No marcar el contrato como `ACCEPTED`.
