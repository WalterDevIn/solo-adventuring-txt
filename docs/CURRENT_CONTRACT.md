# Contrato de implementación vigente

## Estado

```text
AWAITING_REVIEW
```

## Contrato

```text
docs/contracts/003-app-shell.md
```

## Rama esperada

```text
feature/003-app-shell
```

## Rama base requerida

```text
feature/002-browser-css-loading
```

## Último contrato aceptado

```text
docs/contracts/002-browser-css-loading.md
```

La corrección fue revisada estructuralmente y validada por el usuario en un navegador real. La página carga contenido visible y ya no presenta los errores MIME causados por importar CSS como módulos JavaScript.

El contrato `001-client-foundation` se considera recuperado mediante la corrección aceptada de `002-browser-css-loading`.

## Instrucción para el planificador

No crear otro contrato mientras este permanezca en estado `READY`, `IN_PROGRESS`, `BLOCKED` o `AWAITING_REVIEW`.

Inspeccionar el código real, el informe, las pruebas y la navegación antes de aceptar o emitir una corrección.

## Instrucción para el implementador

1. La implementación de `docs/contracts/003-app-shell.md` está lista para revisión en `feature/003-app-shell`.
2. No ampliar el alcance ni marcar el contrato como `ACCEPTED`.
3. La revisión debe confirmar visualmente las cinco rutas, atrás/adelante, recarga, fallback, viewport de 320 px y consola sin errores.
