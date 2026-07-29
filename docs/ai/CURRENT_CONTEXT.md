# Contexto operativo actual

## Estado

```text
AWAITING_REVIEW
```

## Rama de trabajo

```text
master
```

## Último trabajo implementado

```text
003-app-shell
```

La aplicación dispone de shell global, router hash, navegación principal y cinco pantallas estructurales vacías.

## Estado de revisión

La implementación está pendiente de revisión breve. Las pruebas técnicas del router y del shell pasaron. La validación mediante Chromium no fue concluyente por bloqueo del entorno y no debe repetirse indefinidamente.

## Archivos principales afectados

```text
client/src/app/
client/src/screens/
client/src/styles/base.css
client/tests/appShell.test.js
```

## Defectos conocidos

No hay un defecto funcional confirmado. Queda pendiente una inspección visual humana breve para aceptar o emitir una corrección concreta.

## Siguiente objetivo probable

```text
design-foundation
```

Solo debe prepararse después de aceptar `003-app-shell`.

## Verificación recomendada

```text
Nivel 1 para revisión estructural.
Nivel 2 breve solo si se necesita confirmar layout o navegación visible.
No insistir con Chromium si el entorno vuelve a bloquearlo.
```
