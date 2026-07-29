# Flujo de frontend con IA

## Modelo de trabajo

Todo el trabajo activo se realiza directamente sobre `master`.

No se crea una rama por contrato. Las ramas de prototipo se usan solo como referencia visual y funcional.

Dos chats cumplen papeles separados:

```text
Planificador y revisor
→ inspecciona el estado real
→ acepta, corrige, rechaza o bloquea
→ crea como máximo un contrato

Implementador
→ lee el contrato vigente
→ implementa únicamente ese alcance
→ informa el resultado
```

## Contrato vigente

`docs/ai/CURRENT_CONTRACT.md` es el único puntero autorizado.

Estados:

```text
EMPTY
READY
IN_PROGRESS
BLOCKED
AWAITING_REVIEW
ACCEPTED
CORRECTION_REQUIRED
REJECTED
CANCELLED
```

El planificador no prepara un contrato normal nuevo mientras exista una corrección pendiente.

## Correcciones

Los contratos históricos son inmutables. Una implementación defectuosa se corrige con un contrato nuevo relacionado:

```text
003-app-shell.md
003a-app-shell-fix.md
003b-app-shell-responsive-fix.md
```

Un contrato de corrección debe describir el defecto observado, el comportamiento actual, el resultado esperado y el alcance mínimo de reparación.

## Commits

No se exige un único commit por contrato.

El implementador puede crear varios commits cuando eso mejore el desarrollo, la recuperación o la revisión. Deben ser coherentes y pertenecer exclusivamente al contrato vigente.

Antes de entregar, `master` debe quedar ejecutable, sin cambios ajenos al contrato y con un informe final que enumere los commits relevantes.

No se reescribe historial ni se fuerza `master` como parte del flujo ordinario.

## Velocidad de inspección

El planificador y el implementador deben leer primero los documentos mínimos y después únicamente los archivos afectados.

No deben recorrer todo el repositorio cuando el contrato ya delimita archivos y responsabilidades.

No deben releer ramas de referencia completas en cada iteración. Solo se consultan cuando el contrato exige una comparación visual o funcional concreta.

El informe anterior es una guía; la revisión del código debe concentrarse en el diff y en los criterios de aceptación.

## Verificación proporcional

Cada contrato declara un nivel:

```text
Nivel 0 — inspección documental o estructural
Nivel 1 — pruebas técnicas, imports, sintaxis o módulos
Nivel 2 — comprobación visual breve y focalizada
Nivel 3 — comprobación visual completa
```

Chromium no se usa por defecto.

Solo se usa cuando el criterio depende realmente del navegador: layout, CSS, scroll, overlays, responsive, foco, interacción visual o consola.

Reglas de rapidez:

- no insistir con Chromium después de un timeout o bloqueo del entorno;
- registrar la limitación y continuar con las pruebas posibles;
- no probar toda la aplicación para un cambio local;
- no repetir pruebas equivalentes;
- no reconstruir manualmente el proyecto si puede ejecutarse desde el repositorio;
- usar `npm test` solo cuando el contrato o el cambio lo justifiquen;
- preferir una prueba corta y determinista sobre una exploración extensa.

Para Nivel 2, la prueba visual debe limitarse a una pantalla, una interacción principal y los viewports expresamente indicados.

Nivel 3 se reserva para contratos de integración, responsive, scroll, overlays, typewriter o regresión visual.

## Papel del planificador

El planificador:

1. lee `CURRENT_CONTRACT.md`;
2. inspecciona contrato, informe y diff;
3. clasifica el resultado como `ACCEPTED`, `CORRECTION_REQUIRED`, `REJECTED` o `BLOCKED`;
4. crea como máximo un contrato;
5. actualiza `CURRENT_CONTRACT.md`;
6. no implementa código de producto.

No confía ciegamente en el informe, pero tampoco repite todas las pruebas del implementador sin una razón concreta.

## Papel del implementador

El implementador:

1. trabaja sobre `master` actualizado;
2. lee el contrato vigente y los documentos obligatorios;
3. inspecciona solo los archivos relevantes;
4. implementa el alcance cerrado;
5. ejecuta la verificación indicada;
6. revisa el diff;
7. crea o actualiza el informe;
8. deja `CURRENT_CONTRACT.md` en `AWAITING_REVIEW` o `BLOCKED`.

No diseña producto, no adelanta backend ni simulación y no prepara el siguiente contrato.

## Documentos de autoridad

Antes de planificar o implementar se respetan:

```text
docs/ARCHITECTURE.md
docs/PRODUCT_DECISIONS.md
docs/CHAT_UI_DECISIONS.md
docs/COMBAT_COMPONENTS.md
docs/ai/FRONTEND_STAGE_1_PLAN.md
```
