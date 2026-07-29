# Flujo de frontend con IA

## Modelo de trabajo

Todo el trabajo activo se realiza directamente sobre `master`.

Se usan dos chats separados:

```text
Planificador y revisor
→ inspecciona el estado actual
→ decide aceptar, corregir, rechazar o bloquear
→ genera un contrato `.txt` descargable
→ actualiza un único archivo de contexto

Implementador
→ recibe el contrato `.txt` adjunto en el chat
→ lee el contexto actual y la documentación de autoridad
→ implementa únicamente ese alcance
→ actualiza el contexto actual con el resultado
```

## Contratos portables

Los contratos nuevos no se guardan en el repositorio.

El planificador debe crear un archivo descargable con nombre simple:

```text
004-design-foundation.txt
004a-design-foundation-fix.txt
```

El usuario descarga ese archivo y lo adjunta al chat implementador.

El archivo adjunto es la fuente primaria de alcance de esa implementación.

Los contratos históricos que ya existen en `docs/ai/contracts/` permanecen solo como archivo. Ningún chat debe recorrerlos salvo que `CURRENT_CONTEXT.md` señale uno de forma explícita.

## Contexto actual

`docs/ai/CURRENT_CONTEXT.md` es el único documento operativo mutable.

Debe ser corto y contener únicamente:

```text
estado actual
último trabajo aceptado
trabajo pendiente o en revisión
defectos conocidos relevantes
archivos o sectores afectados
siguiente objetivo probable
verificación mínima recomendada
```

No debe copiar contratos completos, informes extensos ni decisiones permanentes.

El planificador lo actualiza después de revisar o emitir un contrato.

El implementador lo actualiza al terminar o quedar bloqueado.

## Documentación de autoridad

La documentación estable permanece en el repositorio:

```text
docs/ARCHITECTURE.md
docs/PRODUCT_DECISIONS.md
docs/CHAT_UI_DECISIONS.md
docs/COMBAT_COMPONENTS.md
docs/ai/FRONTEND_STAGE_1_PLAN.md
```

No es obligatorio releer todos esos archivos completos en cada intervención.

Regla:

```text
leer CURRENT_CONTEXT.md
→ leer el contrato adjunto
→ leer solo las secciones de autoridad citadas por el contrato
→ inspeccionar solo los archivos afectados
```

## Revisión y correcciones

El planificador clasifica el resultado como:

```text
ACCEPTED
CORRECTION_REQUIRED
REJECTED
BLOCKED
```

Si requiere corrección, genera un nuevo `.txt` relacionado:

```text
004-design-foundation.txt
004a-design-foundation-fix.txt
004b-design-foundation-layout-fix.txt
```

No modifica retroactivamente el contrato anterior.

## Commits

No se exige un único commit por contrato.

El implementador puede crear varios commits coherentes cuando eso facilite desarrollo, recuperación o revisión.

Todos los commits deben pertenecer al contrato adjunto y `master` debe quedar ejecutable al entregar.

## Verificación proporcional

Cada contrato debe declarar un nivel:

```text
Nivel 0 — inspección documental o estructural
Nivel 1 — pruebas técnicas, imports, sintaxis o módulos
Nivel 2 — comprobación visual breve y focalizada
Nivel 3 — comprobación visual completa
```

Chromium no se usa por defecto.

Solo se usa cuando el criterio depende realmente del navegador: layout, CSS, scroll, overlays, responsive, foco, interacción visual o consola.

Reglas de rapidez:

- no insistir con Chromium después de un timeout o bloqueo;
- no probar toda la aplicación para un cambio local;
- no repetir pruebas equivalentes;
- no ejecutar `npm test` si el contrato no lo requiere y el cambio no afecta lógica cubierta;
- preferir una prueba corta y determinista;
- registrar límites del entorno y continuar.

## Papel del planificador

El planificador:

1. lee `docs/ai/CURRENT_CONTEXT.md`;
2. inspecciona solo el diff y los archivos directamente relevantes;
3. clasifica el resultado anterior;
4. genera como máximo un contrato `.txt` descargable;
5. actualiza `CURRENT_CONTEXT.md`;
6. no guarda el contrato nuevo en el repositorio;
7. no implementa código de producto.

## Papel del implementador

El implementador:

1. trabaja sobre `master` actualizado;
2. toma el archivo `.txt` adjunto como contrato;
3. lee `CURRENT_CONTEXT.md`;
4. consulta solo la documentación citada por el contrato;
5. inspecciona únicamente los archivos relevantes;
6. implementa el alcance cerrado;
7. ejecuta la verificación indicada;
8. revisa el diff;
9. actualiza `CURRENT_CONTEXT.md` con el resultado;
10. no crea contratos ni informes históricos en el repositorio.

## Objetivo

El repositorio conserva dirección y estado, pero no acumula trabajo administrativo por cada iteración.

La continuidad queda distribuida así:

```text
decisiones permanentes → docs/
plan general → docs/ai/FRONTEND_STAGE_1_PLAN.md
estado operativo → docs/ai/CURRENT_CONTEXT.md
alcance puntual → archivo `.txt` adjunto al chat implementador
código y commits → master
```
