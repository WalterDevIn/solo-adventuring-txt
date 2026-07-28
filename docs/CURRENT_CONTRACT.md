# Contrato de implementación vigente

## Estado

```text
READY
```

## Contrato

```text
docs/contracts/001-client-foundation.md
```

## Rama esperada

```text
feature/001-client-foundation
```

## Último contrato aceptado

```text
Ninguno
```

## Instrucción para el planificador

No crear otro contrato mientras este permanezca en estado `READY`, `IN_PROGRESS`, `BLOCKED` o `AWAITING_REVIEW`.

Cuando la implementación quede en `AWAITING_REVIEW`, inspeccionar el código real y el informe antes de aceptar, corregir o reemplazar el contrato.

## Instrucción para el implementador

1. Leer `docs/contracts/001-client-foundation.md` y toda su documentación obligatoria.
2. Crear o usar exclusivamente la rama `feature/001-client-foundation`.
3. Cambiar este estado a `IN_PROGRESS` al comenzar.
4. Implementar únicamente el alcance del contrato.
5. Crear `docs/contracts/reports/001-client-foundation.md`.
6. Cambiar este estado a `AWAITING_REVIEW` al terminar.
7. No marcar el contrato como `ACCEPTED`.