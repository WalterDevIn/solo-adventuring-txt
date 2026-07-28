# 001 — Client foundation

## Estado inicial

`READY`

## Contexto mínimo

La primera etapa del frontend debe producir un cliente demostrable en JavaScript vanilla sin implementar backend, parser, ECS, reglas de juego ni simulación.

En `master`, `client/` contiene únicamente `.gitkeep`; no existe todavía punto de entrada, entorno de desarrollo, estilos base ni pruebas del cliente.

Las ramas `prototype/combat-setup` y `prototype/player-experience` son referencias visuales y funcionales. No deben copiarse como arquitectura: concentran presentación, flujo de demostración y lógica provisional en archivos raíz y módulos monolíticos.

Este contrato inicia el Sector A de `docs/FRONTEND_STAGE_1_PLAN.md`. Solo establece una aplicación mínima ejecutable y una estructura preparada para los contratos siguientes.

## Documentación obligatoria

Antes de implementar, leer:

- `docs/ARCHITECTURE.md`;
- `docs/PRODUCT_DECISIONS.md`;
- `docs/CHAT_UI_DECISIONS.md`;
- `docs/AI_FRONTEND_WORKFLOW.md`;
- `docs/FRONTEND_STAGE_1_PLAN.md`;
- `docs/contracts/README.md`;
- `docs/CURRENT_CONTRACT.md`;
- este contrato.

Inspeccionar también, como referencia y no como código a trasladar:

- `prototype/combat-setup`;
- `prototype/player-experience`.

## Objetivo cerrado

Crear la fundación técnica mínima del cliente dentro de `client/`: entorno de desarrollo local, documento HTML inicial, punto de entrada JavaScript con módulos ES, estructura base de carpetas, estilos globales mínimos y una prueba automatizada de arranque estructural.

No crear todavía router, navegación, pantallas reales, modelos de mensajes ni componentes reutilizables.

## Resultado visible esperado

Al iniciar el entorno de desarrollo y abrir el cliente en el navegador debe verse una página mínima de “Solo Adventuring” que:

- ocupa correctamente el viewport;
- confirma visualmente que el cliente está listo;
- usa una base oscura sobria compatible con la dirección visual de los prototipos;
- no simula todavía chat, combate, catálogos ni navegación;
- no muestra errores en consola.

El resultado debe ser deliberadamente mínimo. Su propósito es demostrar que la aplicación arranca desde la estructura nueva.

## Contexto funcional

El producto final será un RPG narrativo presentado principalmente como chat. Esta intervención no construye esa experiencia todavía; prepara el contenedor técnico que recibirá el shell, el sistema visual y las pantallas posteriores.

La página mínima no debe sugerir decisiones de producto nuevas. Puede mostrar únicamente:

- nombre del producto;
- identificación de la etapa o estado de preparación;
- una frase breve indicando que el cliente frontend está operativo.

## Archivos permitidos para modificar

- `README.md`;
- `docs/CURRENT_CONTRACT.md`;
- `client/.gitkeep` únicamente para eliminarlo cuando la estructura real lo vuelva innecesario.

## Archivos permitidos para crear

- `.gitignore`;
- `package.json`;
- archivo de lock generado por el gestor de paquetes elegido;
- `client/public/index.html`;
- `client/src/main.js`;
- `client/src/app/bootstrap.js`;
- `client/src/styles/reset.css`;
- `client/src/styles/base.css`;
- `client/tests/clientFoundation.test.js`;
- `docs/contracts/reports/001-client-foundation.md`.

No crear otras carpetas vacías mediante archivos `.gitkeep`. Las carpetas futuras se crearán cuando tengan una responsabilidad implementada.

## Archivos prohibidos

- cualquier archivo dentro de `server/`;
- cualquier archivo dentro de `shared/`;
- los documentos de decisiones y planes en `docs/`, salvo `docs/CURRENT_CONTRACT.md` y el informe indicado;
- cualquier archivo de las ramas de referencia trasladado a `master`;
- assets de audio, imágenes o fuentes;
- archivos de router, rutas, pantallas, componentes, services, state o presentation;
- configuración de backend, API, base de datos o simulación.

## Decisiones arquitectónicas obligatorias

- El cliente vive íntegramente en `client/`.
- La implementación usa JavaScript vanilla y módulos ES nativos.
- `client/src/main.js` es el punto de entrada del código y delega el montaje en `client/src/app/bootstrap.js`.
- `bootstrap.js` puede coordinar el montaje inicial, pero no debe contener reglas de juego ni lógica de dominio.
- El HTML solo define el documento y un único punto raíz de montaje; la vista mínima se monta desde JavaScript.
- Los estilos globales se separan entre normalización (`reset.css`) y base provisional (`base.css`).
- La herramienta de desarrollo puede resolver servidor local y ejecución de pruebas, pero no puede introducir un framework de UI, router o sistema de componentes.
- No copiar la organización monolítica de `app.js` ni los scripts globales de los prototipos.
- No simular respuestas del servidor, combate, parser, IA ni persistencia.

## Comportamientos requeridos

1. El comando de desarrollo documentado inicia un servidor local que sirve `client/public/index.html` y permite cargar los módulos de `client/src/`.
2. El documento declara idioma español, codificación UTF-8, viewport responsive, título y descripción coherentes con el producto.
3. El HTML contiene un único nodo raíz de aplicación y carga `client/src/main.js` como módulo.
4. `main.js` importa y ejecuta una función explícita de bootstrap.
5. El bootstrap valida que el nodo raíz exista y falla con un error claro si falta.
6. El bootstrap monta el contenido mínimo sin usar `innerHTML` con contenido dinámico ni dependencias externas de UI.
7. La página permanece legible en un viewport de escritorio y en uno móvil estrecho.
8. Los estilos no fijan todavía tokens definitivos ni reproducen componentes concretos de los prototipos.
9. El repositorio ofrece un comando único de pruebas y un comando de desarrollo claramente documentados.
10. La prueba automatizada verifica al menos la existencia y coherencia del punto de entrada, el nodo de montaje y la delegación hacia bootstrap sin requerir un navegador real.

## Comportamientos fuera de alcance

- router o navegación;
- app shell definitivo;
- encabezados, barras laterales o menús;
- chat, mensajes, input, dados, highlights o typewriter;
- catálogos y formularios;
- datos de demostración del juego;
- responsive avanzado;
- audio;
- PWA, service worker o instalación offline;
- build de producción optimizado;
- linting o formateo automático como requisito del proyecto;
- pruebas end-to-end o visuales.

## Criterios de aceptación

- Existe una estructura real bajo `client/public`, `client/src/app`, `client/src/styles` y `client/tests`.
- `client/.gitkeep` fue eliminado.
- La instalación de dependencias, si existen, termina sin errores.
- El comando de desarrollo inicia el cliente desde la nueva estructura.
- La URL local muestra la página mínima descrita.
- La consola del navegador no muestra errores durante el arranque.
- La aplicación se monta mediante `main.js` y `bootstrap.js`; no hay lógica de producto en el HTML.
- No se añadió ningún framework de UI ni código de backend o simulación.
- El comando de pruebas termina correctamente.
- `README.md` explica únicamente los comandos necesarios para instalar, ejecutar y probar esta fundación, sin describir funcionalidades todavía inexistentes.
- El diff final solo contiene archivos permitidos.

## Comprobaciones manuales

1. Instalar dependencias desde la raíz mediante el comando documentado.
2. Ejecutar el comando de desarrollo.
3. Abrir la URL informada por el servidor.
4. Confirmar que se ve el nombre “Solo Adventuring”, el estado mínimo de cliente operativo y ninguna interfaz de juego ficticia.
5. Revisar la consola del navegador y confirmar que no contiene errores.
6. Probar aproximadamente `1440 × 900` y `360 × 800`; el contenido debe permanecer centrado, visible y sin scroll horizontal.
7. Detener y volver a iniciar el servidor para confirmar que el arranque es reproducible.

## Pruebas requeridas

Ejecutar el comando de pruebas definido en `package.json`.

La suite debe cubrir como mínimo:

- que `client/public/index.html` contiene el nodo raíz esperado;
- que carga `../src/main.js` como módulo mediante una ruta válida desde el HTML;
- que `main.js` delega el montaje a `bootstrap.js`;
- que no aparecen referencias a archivos raíz heredados de los prototipos como `app.js`, `chat.css`, `setup.css` o `experience.css`.

La prueba puede usar utilidades estándar de Node y lectura de archivos. No requiere DOM emulado.

## Documentación que debe actualizarse

- `README.md`: comandos reales de instalación, desarrollo y pruebas.
- `docs/CURRENT_CONTRACT.md`: al comenzar, cambiar a `IN_PROGRESS`; al terminar, cambiar a `AWAITING_REVIEW`, conservando este contrato y la rama esperada.
- `docs/contracts/reports/001-client-foundation.md`: crear el informe final.

No modificar documentos de arquitectura, producto, UI o planificación en esta intervención.

## Condiciones de bloqueo

Marcar el contrato como `BLOCKED` y detener la implementación si:

- el estado real de `master` ya contiene una fundación de cliente distinta de la inspeccionada;
- la herramienta elegida exige mover el cliente fuera de `client/`;
- resulta necesario introducir un framework de UI;
- los archivos permitidos no alcanzan para un arranque reproducible;
- una comprobación requiere definir navegación, pantallas o comportamiento de producto;
- existe una contradicción material con los documentos obligatorios.

No resolver esos casos ampliando silenciosamente el alcance.

## Forma esperada del informe de implementación

Crear `docs/contracts/reports/001-client-foundation.md` con estas secciones:

```markdown
# Informe — 001-client-foundation

## Contrato implementado
## Estado declarado
## Resumen real de cambios
## Archivos creados
## Archivos modificados
## Archivos eliminados
## Comprobaciones ejecutadas
## Resultado de cada comprobación
## Desviaciones respecto del contrato
## Decisiones técnicas locales
## Problemas conocidos
## Trabajo no realizado
## Commit o referencia final
```

El informe debe declarar explícitamente:

- herramienta de desarrollo y versión usada;
- gestor de paquetes y versión usada;
- comandos ejecutados;
- URL local comprobada;
- resultado de la revisión manual en escritorio y móvil;
- cualquier dependencia añadida y su propósito.

## Entrega esperada

Una implementación revisable en la rama:

```text
feature/001-client-foundation
```

La entrega incluye solamente la fundación del cliente, el informe correspondiente y `docs/CURRENT_CONTRACT.md` en estado `AWAITING_REVIEW`.