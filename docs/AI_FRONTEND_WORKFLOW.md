# Flujo de trabajo con IA para el frontend

## Objetivo

Este documento define cómo desarrollar la primera etapa del frontend con dos chats separados sin perder decisiones, deformar el alcance ni introducir implementaciones incompatibles.

El flujo usa dos papeles:

```text
Planificador de contratos
→ decide qué se implementa a continuación
→ escribe un contrato cerrado

Implementador
→ lee el contrato vigente
→ inspecciona el repositorio
→ implementa exactamente ese alcance
→ informa el resultado
```

Los dos chats trabajan sobre el mismo repositorio, pero no cumplen la misma función.

---

## Principios

### 1. Un solo contrato vigente

Solo puede haber un contrato activo a la vez.

El archivo `docs/CURRENT_CONTRACT.md` señala cuál es.

El implementador no elige la siguiente tarea y no amplía el alcance por iniciativa propia.

### 2. Contratos pequeños y cerrados

Cada contrato debe producir un resultado demostrable, pero permanecer dentro de un solo sector del frontend.

No se usarán vertical slices que mezclen cliente, API y simulación durante esta etapa.

Un contrato debe poder implementarse, revisarse y corregirse sin requerir interpretar nuevamente todo el proyecto.

### 3. Los documentos de decisiones son autoridad

Antes de escribir un contrato, el planificador debe leer como mínimo:

```text
docs/ARCHITECTURE.md
docs/PRODUCT_DECISIONS.md
docs/CHAT_UI_DECISIONS.md
docs/FRONTEND_STAGE_1_PLAN.md
```

El contrato no puede contradecirlos silenciosamente.

Si detecta una contradicción o una decisión ausente que bloquea la implementación, debe detenerse y pedir una decisión antes de crear el contrato.

### 4. El contrato es inmutable durante la implementación

Una vez que el implementador comienza, el contrato no se modifica para acomodar lo que terminó haciendo.

Si el contrato estaba mal o necesita cambiar, se cancela y se crea otro.

Esto conserva trazabilidad.

### 5. El implementador no diseña producto

Puede tomar decisiones técnicas locales cuando el contrato lo permite, pero no puede redefinir:

- comportamiento visible;
- alcance;
- navegación;
- taxonomía de mensajes;
- reglas de interacción;
- arquitectura general;
- responsabilidades de carpetas;
- decisiones registradas.

### 6. No se simula backend ni juego

El frontend inicial puede usar estados de demostración y secuencias visuales fijas.

No debe implementar reglas de combate, parser, IA, persistencia falsa compleja ni resolución provisional del juego.

### 7. Toda implementación deja un informe

El implementador crea un informe separado en:

```text
docs/contracts/reports/<mismo-nombre-del-contrato>.md
```

El contrato original permanece sin alteraciones.

---

## Papel 1: planificador de contratos

El planificador trabaja de forma continuada sobre el orden de la primera etapa.

Sus responsabilidades son:

1. leer el estado actual del repositorio;
2. leer el contrato anterior y su informe;
3. comprobar qué parte del plan ya está implementada;
4. elegir la siguiente unidad mínima coherente;
5. resolver ambigüedades antes de contratar;
6. crear el contrato;
7. actualizar `docs/CURRENT_CONTRACT.md`;
8. no escribir código de producto.

El planificador debe inspeccionar la implementación real. No debe asumir que el contrato anterior fue cumplido correctamente solo porque existe un informe.

### Salida del planificador

Cada ejecución produce como máximo:

```text
un contrato nuevo
+ actualización de CURRENT_CONTRACT.md
```

No debe preparar una cola completa de contratos detallados por adelantado. El plan general ya está en `FRONTEND_STAGE_1_PLAN.md`; cada contrato se redacta al llegar su turno para incorporar lo aprendido.

---

## Papel 2: implementador

El implementador comienza siempre leyendo:

```text
docs/CURRENT_CONTRACT.md
```

Luego lee:

```text
el contrato señalado
los documentos obligatorios listados por el contrato
los archivos existentes afectados
el informe del contrato anterior si es relevante
```

Sus responsabilidades son:

1. verificar que el contrato esté activo;
2. inspeccionar antes de modificar;
3. implementar únicamente el objetivo cerrado;
4. respetar archivos permitidos y prohibidos;
5. ejecutar las comprobaciones exigidas;
6. revisar el diff final;
7. crear el informe de implementación;
8. cambiar el estado de `CURRENT_CONTRACT.md` a `AWAITING_REVIEW`.

El implementador no debe marcar un contrato como completado definitivamente. Esa aceptación corresponde al planificador o al usuario después de revisar el resultado.

---

## Estados del contrato vigente

`docs/CURRENT_CONTRACT.md` usa uno de estos estados:

```text
EMPTY
No existe contrato activo.

READY
El contrato está preparado y todavía no fue iniciado.

IN_PROGRESS
El implementador comenzó a trabajar.

BLOCKED
Existe un bloqueo que impide continuar sin una decisión.

AWAITING_REVIEW
La implementación terminó y espera revisión.

ACCEPTED
La implementación fue revisada y aceptada.

CANCELLED
El contrato fue descartado sin aceptarse.
```

Flujo normal:

```text
EMPTY
→ READY
→ IN_PROGRESS
→ AWAITING_REVIEW
→ ACCEPTED
→ READY para el siguiente contrato
```

---

## Formato de nombres

La nomenclatura debe ser mínima y ordenable:

```text
001-client-foundation.md
002-app-shell.md
003-message-model.md
004-message-feed.md
```

Reglas:

- número de tres dígitos;
- nombre corto en kebab-case;
- describe un resultado, no una actividad genérica;
- no incluye fechas, nombres de ramas ni estados;
- el informe usa exactamente el mismo nombre dentro de `reports/`.

---

## Contenido obligatorio de un contrato

Cada contrato debe incluir:

```text
Título
Estado inicial
Contexto mínimo
Objetivo cerrado
Resultado demostrable
Alcance funcional
Fuera de alcance
Archivos permitidos
Archivos permitidos para crear
Archivos prohibidos
Decisiones que deben respetarse
Comportamiento requerido
Criterios de aceptación
Comprobaciones obligatorias
Condiciones de bloqueo
Entrega esperada
```

Cuando corresponda, también:

```text
estructura de datos provisional
estados visuales de demostración
restricciones responsive
accesibilidad
compatibilidad con contratos futuros
```

El contrato no debe prescribir detalles internos innecesarios. Debe fijar resultados, fronteras y restricciones.

---

## Informe de implementación

El informe debe contener:

```text
Contrato implementado
Estado declarado
Resumen real de cambios
Archivos creados
Archivos modificados
Comprobaciones ejecutadas
Resultado de cada comprobación
Desviaciones respecto del contrato
Decisiones técnicas locales
Problemas conocidos
Trabajo no realizado
Commit o referencia final
```

Una desviación no debe ocultarse. Si fue necesaria, se documenta para que el planificador decida si acepta, corrige o reemplaza el contrato.

---

## Revisión entre contratos

Antes de emitir el siguiente contrato, el planificador debe realizar una revisión corta:

```text
¿El objetivo anterior existe realmente?
¿Los criterios de aceptación se cumplen?
¿Se introdujo lógica fuera de alcance?
¿La estructura sigue ARCHITECTURE.md?
¿El resultado conserva las decisiones visuales?
¿Hay deuda que deba corregirse antes de avanzar?
```

Si hay un defecto estructural, se crea un contrato de corrección antes de continuar.

No se acumulan defectos importantes con la idea de arreglarlos al final.

---

## Estrategia de ramas y commits

Cada contrato debe implementarse en una rama propia:

```text
feature/001-client-foundation
feature/002-app-shell
```

Un contrato puede usar varios commits internos, pero debe terminar con un estado revisable y demostrable.

No se mezclan dos contratos activos en la misma rama.

---

## Regla de escalamiento

El implementador se detiene y marca `BLOCKED` cuando:

- el contrato contradice una decisión registrada;
- falta una decisión funcional necesaria;
- los archivos permitidos no alcanzan;
- la implementación exige modificar arquitectura fuera del alcance;
- el repositorio no coincide con el estado que el contrato asume;
- un criterio de aceptación no puede cumplirse sin ampliar la tarea.

No debe improvisar una solución de producto para evitar el bloqueo.

---

## Resultado esperado

Este flujo busca que la IA sea rápida sin depender de memoria conversacional frágil.

La continuidad vive en el repositorio:

```text
decisiones permanentes
+ plan general
+ contrato vigente
+ contratos históricos
+ informes de implementación
+ código real
```

Los chats pueden cambiar o perder contexto sin perder la dirección del proyecto.