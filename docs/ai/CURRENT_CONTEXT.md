# Contexto operativo actual

## Estado

```text
READY
```

## Rama de trabajo

```text
master
```

## Último trabajo aceptado

```text
003-app-shell
```

El shell global, el router hash, la navegación principal y las cinco pantallas estructurales cumplen el alcance previsto. Las pruebas técnicas cubren rutas, fallback, navegación activa y foco posterior a cambios de pantalla.

## Próximo trabajo

```text
004-design-foundation
```

Establecer tokens visuales y aplicar una identidad base coherente al shell existente, tomando los prototipos únicamente como referencia visual.

## Sectores afectados

```text
client/public/index.html
client/src/styles/
client/tests/
```

## Defectos conocidos

Ninguno bloqueante confirmado.

## Verificación recomendada

```text
Nivel 3: pruebas estructurales breves y comprobación visual del shell en escritorio y móvil.
Usar un navegador disponible; no exigir Chromium ni repetir intentos después de un bloqueo persistente.
```
