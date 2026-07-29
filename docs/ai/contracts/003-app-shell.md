# 003 — App shell

## Estado inicial

READY

## Objetivo cerrado

Construir un shell de aplicación navegable con router hash, navegación principal y cinco pantallas vacías estructurales.

## Rutas

```text
#/inicio
#/creacion
#/preparar-combate
#/sala
#/juego
```

Hash vacío o desconocido debe redirigir a `#/inicio`.

## Alcance

- router hash mínimo;
- rutas centralizadas;
- shell global;
- navegación accesible;
- cinco pantallas vacías separadas;
- estado activo mediante `aria-current="page"`;
- atrás, adelante y recarga sobre ruta hash;
- pruebas estructurales con herramientas ya disponibles.

## Fuera de alcance

- identidad visual definitiva;
- catálogos;
- formularios;
- chat;
- mensajes;
- dados;
- etiquetas;
- backend;
- parser;
- reglas de juego;
- persistencia.

## Archivos principales permitidos

```text
client/src/app/**
client/src/screens/**
client/src/styles/base.css
client/tests/**
README.md
docs/ai/CURRENT_CONTRACT.md
docs/ai/contracts/reports/003-app-shell.md
```

## Archivos prohibidos

```text
server/**
shared/**
docs/ARCHITECTURE.md
docs/PRODUCT_DECISIONS.md
docs/CHAT_UI_DECISIONS.md
```

## Criterios de aceptación

- las cinco rutas existen y se navegan;
- hash vacío o inválido vuelve a Inicio;
- atrás, adelante y recarga funcionan;
- solo una ruta activa usa `aria-current`;
- cada pantalla vive en su módulo;
- no se agregan dependencias ni lógica de sectores posteriores;
- las pruebas técnicas pasan.

## Nivel de verificación

Nivel 1 para router, rutas y estructura.

Una comprobación visual breve de Nivel 2 puede realizarse durante la revisión, pero un bloqueo de Chromium no invalida por sí solo la entrega si las pruebas técnicas cubren el comportamiento contratado.
