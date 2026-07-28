# Contratos de implementación

Esta carpeta contiene contratos cerrados para implementar el proyecto mediante chats separados.

## Convención

```text
001-client-foundation.md
002-app-shell.md
003-message-model.md
```

Cada contrato conserva su número y nombre para siempre.

Los informes se guardan en:

```text
docs/contracts/reports/<mismo-nombre>.md
```

Ejemplo:

```text
docs/contracts/004-message-feed.md
docs/contracts/reports/004-message-feed.md
```

## Autoridad

Un contrato debe respetar:

```text
docs/ARCHITECTURE.md
docs/PRODUCT_DECISIONS.md
docs/CHAT_UI_DECISIONS.md
docs/FRONTEND_STAGE_1_PLAN.md
docs/AI_FRONTEND_WORKFLOW.md
```

Si existe una contradicción, el contrato no tiene autoridad para cambiar silenciosamente esos documentos.

## Contrato vigente

El contrato activo se consulta únicamente en:

```text
docs/CURRENT_CONTRACT.md
```

No debe inferirse cuál sigue mirando el número más alto de esta carpeta.

## Plantilla mínima

```markdown
# NNN — Nombre

## Estado inicial
READY

## Contexto mínimo

## Objetivo cerrado

## Resultado demostrable

## Alcance funcional

## Fuera de alcance

## Archivos permitidos para modificar

## Archivos permitidos para crear

## Archivos prohibidos

## Decisiones que deben respetarse

## Comportamiento requerido

## Criterios de aceptación

## Comprobaciones obligatorias

## Condiciones de bloqueo

## Entrega esperada
```

## Reglas

- Un contrato implementa una unidad coherente.
- No introduce backend, juego o persistencia durante la primera etapa del frontend.
- No se modifica después de comenzar la implementación.
- No se reutiliza un número cancelado.
- El implementador informa desviaciones en lugar de ocultarlas.
- El siguiente contrato se prepara después de revisar el resultado real del anterior.