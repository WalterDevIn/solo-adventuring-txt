# Plan de la primera etapa del frontend

## Objetivo de la etapa

Construir un cliente JavaScript vanilla demostrable que represente la experiencia prevista sin implementar todavía backend, parser, reglas de juego ni simulación.

La etapa termina cuando el usuario puede recorrer las pantallas principales, comprender el producto y reproducir una experiencia narrativa visual completa mediante estados de demostración.

---

## Límites

Esta etapa incluye:

- estructura del cliente;
- navegación;
- pantalla de juego narrativa;
- sistema visual de mensajes;
- dados;
- highlight semántico;
- entrada de texto;
- historial de entradas con flechas;
- etiquetas y marcadores;
- fichas breves y detalles técnicos;
- modos narrativo, técnico y depuración;
- catálogos;
- editores visuales de contenido;
- configuración de combate;
- sala multijugador visual;
- responsive y sonidos.

Esta etapa no incluye:

- API real;
- base de datos;
- autenticación real;
- red multijugador;
- parser funcional;
- ECS;
- reglas de combate;
- IA;
- persistencia;
- cálculo de tiradas;
- narración generada dinámicamente.

---

## Orden por sectores

El trabajo se organiza por sectores coherentes del frontend, no por verticales completas entre cliente, backend y juego.

### Sector A — Fundación

1. `client-foundation`
   - estructura de carpetas;
   - punto de entrada;
   - sistema de módulos;
   - entorno de desarrollo;
   - estilos base;
   - página mínima funcional.

2. `app-shell`
   - layout global;
   - router;
   - rutas iniciales;
   - navegación;
   - estados de pantalla vacíos.

3. `design-foundation`
   - tokens visuales;
   - tipografía;
   - superficies;
   - espaciado;
   - controles básicos;
   - adaptación del estilo de los prototipos.

Resultado demostrable del sector:

```text
El cliente inicia, navega y conserva una identidad visual coherente.
```

### Sector B — Núcleo narrativo

4. `message-model`
   - modelo provisional de mensajes visuales;
   - voces;
   - fragmentos semánticos;
   - detalles expandibles;
   - estados de presentación.

5. `message-feed`
   - output con máximo visible inicial de veinte mensajes;
   - scroll;
   - orden cronológico;
   - mensajes del jugador, criatura, DM, dado, metacomando y depuración.

6. `presentation-queue`
   - aparición progresiva;
   - grupos simultáneos;
   - secuencias dependientes;
   - mensajes sin demora;
   - posibilidad futura de acelerar o saltar.

7. `dice-presentation`
   - dado como voz propia;
   - tiradas simples;
   - tiradas enfrentadas en una fila;
   - desglose expandible;
   - hooks de sonido.

8. `semantic-highlights`
   - estilos por tipo semántico;
   - cantidades de daño coloreadas por tipo;
   - referencias interactivas;
   - preparación de fichas breves.

9. `message-details`
   - expansión técnica;
   - eventos;
   - intención interpretada;
   - tiradas;
   - reglas aplicadas;
   - datos de depuración.

Resultado demostrable del sector:

```text
Una secuencia narrativa completa puede reproducirse con ritmo, dados, sonido, highlight e inspección técnica.
```

### Sector C — Pantalla de juego

10. `game-screen-layout`
    - chat como superficie principal;
    - input inferior;
    - columna derecha de etiquetas en escritorio;
    - disposición móvil;
    - overlays sin abandonar el chat.

11. `command-input`
    - una sola línea;
    - Enter para enviar;
    - metacomandos con `/`;
    - estados contextuales;
    - escritura mientras llegan mensajes;
    - envío habilitado o bloqueado según estado visual.

12. `input-history`
    - flecha arriba recupera entradas anteriores;
    - flecha abajo avanza hacia entradas recientes;
    - preservación del borrador actual;
    - historial local de comandos.

13. `clarification-mode`
    - intención pendiente;
    - pregunta del DM;
    - respuesta asociada;
    - posibilidad visual de abandonar o reemplazar la intención;
    - el tiempo continúa visible.

14. `tags-and-indicators`
    - etiquetas fijadas por el jugador;
    - columna lateral;
    - reordenamiento y cierre;
    - indicadores temporales del sistema;
    - elementos flotantes en móvil.

15. `semantic-popovers`
    - ficha breve de criatura;
    - objeto;
    - conjuro;
    - condición;
    - tirada;
    - respeto por información visible al jugador.

16. `output-modes`
    - modo narrativo;
    - modo técnico;
    - modo depuración;
    - filtrado visual sin perder orden cronológico.

Resultado demostrable del sector:

```text
La pantalla de juego se siente como el producto previsto y permite recorrer una escena de combate ficticia sin resolver reglas.
```

### Sector D — Catálogos y creación

17. `catalog-shell`
    - personajes;
    - criaturas;
    - razas;
    - trasfondos;
    - clases;
    - objetos;
    - conjuros;
    - listas, detalle, creación, edición y duplicación.

18. `character-editor-shell`
    - hoja principal;
    - rasgos;
    - apariencia;
    - inventario;
    - conjuros cuando corresponda;
    - navegación no lineal entre hojas.

19. `creature-editor-shell`
    - editor completo;
    - estadísticas;
    - acciones;
    - rasgos;
    - inventario;
    - equipo;
    - conjuros;
    - procedencia oficial o personalizada.

20. `definition-editors-shell`
    - raza;
    - trasfondo;
    - clase;
    - objeto;
    - conjuro;
    - formularios visuales extensibles sin reglas reales.

Resultado demostrable del sector:

```text
El usuario puede recorrer las superficies de creación y entender cómo se compondrá el contenido del juego.
```

### Sector E — Preparación y sala

21. `combat-setup`
    - selección de definiciones;
    - instancias de combate;
    - estado inicial;
    - controladores;
    - relaciones;
    - equipamiento temporal;
    - inicio visual del combate.

22. `multiplayer-room`
    - código de invitación;
    - usuarios presentes;
    - criaturas asignadas;
    - estado preparado;
    - comienzo de sesión;
    - comportamiento visual ante desconexión.

Resultado demostrable del sector:

```text
El usuario puede crear visualmente una configuración de combate, preparar una sala y entrar en la pantalla de juego.
```

### Sector F — Cierre de etapa

23. `responsive-polish`
    - escritorio;
    - móvil;
    - overlays;
    - columna de etiquetas;
    - tamaños del output;
    - modos de visualización.

24. `audio-polish`
    - sonidos heredados de los prototipos;
    - dado;
    - aparición de mensajes;
    - controles básicos de audio.

25. `frontend-demo-flow`
    - recorrido completo;
    - datos de demostración centralizados;
    - una escena narrativa reproducible;
    - navegación entre creación, configuración, sala y juego;
    - eliminación de comportamientos provisionales contradictorios.

26. `stage-one-review`
    - revisión arquitectónica;
    - revisión visual;
    - accesibilidad básica;
    - deuda registrada;
    - preparación para contratos del backend.

Resultado final:

```text
Demo A completa:
frontend navegable y demostrable.

Base visual para Demo E:
la experiencia prevista está lista para recibir backend y simulación reales.
```

---

## Regla de planificación

Los nombres anteriores describen unidades previstas, no contratos irrevocables.

El planificador puede:

- dividir una unidad si resulta demasiado grande;
- combinar unidades pequeñas si no pierde claridad;
- insertar correcciones;
- cambiar el orden dentro de un sector;
- volver temporalmente a un sector anterior.

No puede omitir silenciosamente un comportamiento acordado ni adelantar lógica de backend o simulación.

Cada contrato concreto se crea únicamente después de revisar el estado real dejado por el contrato anterior.