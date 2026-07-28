# Decisiones de producto y simulación

## Estado del documento

Este documento registra las decisiones tomadas hasta ahora sobre la experiencia del jugador, la interfaz, la interpretación de comandos, la simulación, el multijugador, la persistencia y el alcance inicial del proyecto.

No reemplaza `ARCHITECTURE.md` ni `COMBAT_COMPONENTS.md`.

Su propósito es conservar las decisiones funcionales que deben guiar el orden de implementación.

---

# 1. Naturaleza del producto

El producto es esencialmente un RPG narrativo presentado como un chat.

El flujo principal es:

```text
El jugador escribe una intención libre.
El sistema interpreta esa intención.
La simulación decide qué ocurre.
El sistema explica la decisión y presenta el resultado.
```

El texto no es un historial secundario agregado a una interfaz tradicional.

El texto es la interfaz principal del juego.

La experiencia final debe apuntar a narrar los hechos y no limitarse a exponer resultados mecánicos como:

```text
Infliges 6 puntos de daño.
```

La primera versión puede presentar mensajes técnicos mientras se construye el sistema narrativo.

---

# 2. Separación general

La separación funcional acordada es:

```text
client
→ interfaz y presentación

server
→ API REST, persistencia, sesiones y coordinación multijugador

game
→ lógica del juego y simulación autoritativa
```

El ECS vive dentro de `game` y representa el mundo de la simulación.

El ECS no es responsable de:

- HTTP;
- autenticación;
- base de datos;
- DOM;
- salas multijugador;
- usuarios conectados;
- presentación textual;
- animaciones;
- sonidos.

El cliente y el backend son marcos mediante los cuales los usuarios interactúan con la simulación.

---

# 3. Cliente

El cliente será una aplicación sencilla en JavaScript vanilla.

Las áreas principales previstas son:

```text
Inicio y catálogos
Creación de contenido
Configuración de combate
Sala multijugador
Pantalla de juego
```

No se consideran necesarios paneles permanentes como:

- Party;
- Nearby;
- Time;
- Objective;
- Journal.

La información debe pedirse al sistema cuando el jugador la necesite.

Más adelante, el jugador podrá crear etiquetas o marcadores persistentes para mantener visibles consultas o recordatorios concretos.

Ejemplos futuros:

```text
Recordar el momento del día.
Mostrar los PG actuales de un aliado.
Marcar quién tiene el turno.
```

Por ahora se preparará un sistema genérico de etiquetas o marcadores, sin fijar paneles específicos.

---

# 4. Pantalla de juego

La pantalla de juego debe conservar el estilo visual de:

```text
prototype/combat-setup
prototype/player-experience
```

Se consideran importantes:

- estilo visual;
- entradas y salidas del chat;
- etiquetas o marcadores;
- sonidos;
- presentación progresiva de mensajes.

La pantalla de juego debe contener principalmente:

```text
historial narrativo
entrada libre de texto
mensajes del Dungeon Master
mensajes de criaturas
mensajes de dados
etiquetas o marcadores
interacciones semánticas sobre el texto
```

No se utilizará una interfaz basada principalmente en botones para seleccionar acciones.

---

# 5. Entrada del jugador

El jugador escribe comandos o intenciones libres en lenguaje natural limitado.

No se usará IA generativa para interpretar comandos del jugador.

También existirán metacomandos o supercomandos.

Ejemplos:

```text
/kill creature
/stop time
/revive creature
```

Los mensajes del jugador deben registrarse junto con:

- la interpretación producida;
- la decisión tomada;
- las causas de esa decisión;
- las tiradas;
- los eventos resultantes;
- la narración presentada.

Debe ser posible inspeccionar por qué el sistema tomó una decisión concreta.

---

# 6. Parser determinista

La interpretación del texto se realizará mediante un parser determinista con contexto.

El jugador podrá escribir frases como:

```text
Ataco al goblin.
Ataco.
Lo golpeo otra vez.
Uso la poción.
Defiendo a Penélope.
```

El parser deberá reconocer y resolver, cuando sea posible:

- acción;
- actor;
- objetivo;
- instrumento;
- condiciones;
- referencias contextuales;
- omisiones recuperables.

No habrá autocompletado obligatorio en el campo de entrada.

Sí habrá completado semántico mediante contexto.

Ejemplo:

```text
Entrada: Ataco.

Resolución posible:
acción = atacar
arma = arma equipada
objetivo = último objetivo válido
```

El contexto de interpretación puede incluir:

```text
última criatura mencionada
último objetivo elegido
última acción realizada
arma equipada
objeto seleccionado
criatura controlada activa
última aclaración solicitada
```

Completar una intención no significa adivinar arbitrariamente.

---

# 7. Resultado de la interpretación

La interpretación no será binaria.

Debe poder producir estados conceptuales como:

```text
RESOLVED
La intención está completa.

RESOLVED_WITH_ASSUMPTIONS
La intención fue completada usando contexto.

NEEDS_CLARIFICATION
Falta una elección significativa.

IMPOSSIBLE
La intención fue entendida, pero no puede realizarse.
```

Ejemplos:

```text
“Ataco.”
→ RESOLVED_WITH_ASSUMPTIONS
→ arma equipada + último objetivo
```

```text
“Le pego.”
→ NEEDS_CLARIFICATION
→ existen varios objetivos igualmente plausibles
```

```text
“Lanzo Bola de fuego.”
→ IMPOSSIBLE
→ el personaje no conoce o no puede lanzar ese conjuro
```

El sistema no debe rechazar automáticamente una entrada ambigua o imposible.

Debe actuar como lo haría naturalmente un Dungeon Master.

---

# 8. Ambigüedad y aclaraciones

Regla principal:

> El Dungeon Master completa todo lo que pueda inferirse sin alterar significativamente la intención del jugador y pregunta cuando elegir por su cuenta cambiaría una decisión táctica o narrativa relevante.

Ejemplos que pueden resolverse automáticamente:

```text
“Ataco.”
→ única arma equipada
→ último objetivo hostil
```

```text
“Bebo una poción.”
→ única poción utilizable
```

Ejemplos que requieren aclaración:

```text
“Ataco al más débil.”
```

Cuando “débil” puede significar varias cosas.

```text
“Uso una poción.”
```

Cuando existen varias pociones con efectos distintos.

```text
“Lo ataco.”
```

Cuando existen varios referentes igualmente plausibles.

El Dungeon Master puede:

- preguntar;
- exponer su interpretación;
- ofrecer una elección;
- explicar por qué una intención no puede realizarse.

No debe responder con un simple error técnico salvo en modo de depuración.

---

# 9. Dungeon Master

El Dungeon Master no es una criatura ni una entidad ECS.

Es la voz del mundo y del sistema.

Regla acordada:

```text
Si habla una criatura, habla la criatura.
Si se presenta una tirada, habla o se representa el dado.
Si no es una criatura ni un dado, habla el Dungeon Master.
```

El Dungeon Master comunica:

- aclaraciones;
- resultados;
- imposibilidades;
- cambios del mundo;
- consultas;
- narración;
- interpretaciones asumidas;
- eventos no atribuibles a una criatura concreta.

El mundo y el Dungeon Master representan la misma autoridad narrativa.

---

# 10. Eventos, decisiones, narración y presentación

Se distinguen cuatro conceptos:

```text
GameEvent
Hecho ocurrido en la simulación.

DecisionTrace
Explicación de por qué el sistema tomó una decisión.

NarrativeMessage
Representación textual para el jugador.

PresentationTiming
Cómo y cuándo el cliente revela el mensaje.
```

Ejemplo:

```text
GameEvent
ATTACK_HIT

DecisionTrace
El atacante obtuvo 17 contra CA 15.

NarrativeMessage
La espada alcanza al goblin en el costado.

PresentationTiming
Se muestra después de la tirada con una aparición progresiva media.
```

La simulación debe producir hechos estructurados.

El cliente debe decidir cómo representarlos visualmente.

---

# 11. Narración

En la primera versión se acepta utilizar mensajes técnicos.

La dirección futura es narración determinista mediante plantillas con variaciones controladas.

Las plantillas deben evitar que todos los resultados se expresen exactamente igual.

La IA generativa no se utilizará como narrador general.

Su uso previsto se limita a situaciones de lógica psicológica compleja en NPC inteligentes.

Ejemplo conceptual:

```text
personalidad
+ memoria
+ estado psicológico
+ contexto
→ nueva reacción o decisión del NPC
```

También podrá transformar estados duros en diálogos naturales.

La IA generativa no debe:

- resolver reglas;
- interpretar comandos del jugador;
- modificar directamente el ECS;
- narrar libremente todos los eventos.

---

# 12. Modo de depuración

La narración es obligatoria para la experiencia del jugador, pero debe poder ocultarse o reemplazarse en depuración.

El modo de depuración debe poder mostrar:

- eventos técnicos;
- intenciones interpretadas;
- decisiones;
- causas;
- tiradas;
- estados internos relevantes;
- intenciones de todas las criaturas.

En juego normal, el jugador solo verá:

- sus propias intenciones;
- las narraciones de lo que ocurre;
- información que las reglas permitan revelar.

Las intenciones internas de otras criaturas pueden permanecer ocultas.

---

# 13. Highlight semántico

El highlight no es una pantalla ni una vista independiente.

Es una capacidad de presentación semántica del texto.

El flujo acordado es:

```text
Game
→ produce eventos y referencias semánticas

Cliente
→ construye el mensaje
→ aplica estilos e interacciones
```

Ejemplo:

```text
Penélope golpea al goblin con su espada.
```

Fragmentos semánticos posibles:

```text
Penélope
entityType = creature
entityId = creature-12
role = actor

goblin
entityType = creature
entityId = creature-38
role = target

espada
entityType = item
entityId = item-44
role = instrument
```

El juego decide qué representa cada fragmento.

El cliente decide:

- color;
- subrayado;
- cursor;
- menú contextual;
- ficha que se abre;
- interacción al pulsar.

No se debe intentar detectar entidades mediante expresiones regulares sobre texto ya generado.

Los highlights podrán funcionar también como enlaces e interacciones semánticas.

---

# 14. Presentación progresiva

La aparición progresiva de mensajes existe para:

- hacer que el jugador consuma tiempo;
- crear un ritmo más natural;
- suavizar la presentación;
- evitar que todo ocurra instantáneamente.

No todos los mensajes tendrán la misma velocidad.

Algunos mensajes podrán aparecer juntos o sin espera.

Ejemplos:

- tiradas enfrentadas;
- mensajes consecutivos del mismo resultado;
- información crítica que debe verse inmediatamente.

El usuario deberá poder acelerar o saltar la presentación en el futuro.

La arquitectura debe permitirlo aunque la interacción exacta se diseñe más adelante.

---

# 15. Tiempo reglamentario y tiempo de presentación

Se distinguen dos relojes:

```text
Reloj del juego
→ turnos, deadlines, reacciones y expiraciones

Reloj de presentación
→ typewriter, sonidos y ritmo narrativo
```

La latencia no debe reducir injustamente el tiempo disponible para reaccionar.

La ventana de reacción no debe comenzar simplemente cuando el servidor produce internamente el evento.

Flujo acordado:

```text
1. La simulación llega a un punto reactivo.
2. El servidor produce el evento crítico.
3. El servidor envía el mensaje a los clientes relevantes.
4. Los clientes confirman recepción y presentación mínima.
5. El servidor abre la ventana de reacción.
6. Comienza el temporizador reglamentario.
7. Los jugadores reaccionan o el tiempo expira.
8. La simulación continúa.
```

La presentación mínima no tiene que esperar a que termine todo el efecto decorativo.

Debe existir un punto de sincronización en el que la información crítica ya sea visible.

Solo deben bloquear la apertura de la ventana los clientes que controlen criaturas con una reacción válida.

No se debe esperar a espectadores o usuarios no involucrados.

---

# 16. Simulación por ticks

La simulación utilizará ticks porque:

- los jugadores tienen tiempo limitado para actuar;
- las criaturas controladas por IA también consumen tiempo;
- existen ventanas de reacción;
- hay expiraciones y pausas;
- el servidor debe coordinar tiempos de presentación e interacción.

No se requiere un loop de acción a alta frecuencia.

Los ticks servirán para:

- reducir temporizadores;
- expirar ventanas;
- activar decisiones de IA;
- resolver esperas;
- manejar pausas;
- manejar desconexiones;
- coordinar mensajes programados.

---

# 17. Turnos e IA

Las criaturas actúan cuando llega su turno.

Las criaturas controladas por IA también tendrán un tiempo propio antes de resolver su acción, para conservar ritmo y permitir reacciones.

La simulación debe continuar hasta que:

- necesite una decisión humana;
- se abra una ventana de reacción;
- deba esperar un deadline;
- termine el combate.

Debe evitarse que una cadena extensa de turnos de IA bloquee o vuelva pesada la experiencia.

La estrategia exacta se resolverá al diseñar el runtime.

---

# 18. Creación de personajes

La creación de personajes debe sentirse como utilizar hojas de D&D.

No será un wizard paso a paso.

La interfaz se organizará mediante hojas o secciones completas.

Ejemplos:

```text
Hoja principal
Hoja de rasgos
Hoja de conjuros
Hoja de apariencia
Inventario
```

No todas las hojas serán necesarias en la primera versión.

Raza, subraza, trasfondo, clase y otras definiciones vendrán del backend.

Estas selecciones podrán:

- modificar valores;
- otorgar componentes;
- agregar rasgos;
- agregar acciones;
- habilitar nuevas hojas, como conjuros o magia.

No se puede seleccionar una clase, raza o trasfondo inexistente.

Para utilizar contenido personalizado, primero debe crearse esa definición.

Antes de un combate se podrá ajustar el estado específico con el que el personaje entra a esa pelea.

---

# 19. Creación de criaturas

El editor de criaturas será completo desde el comienzo.

No se dividirá inicialmente en modo simple y modo avanzado.

El jugador podrá comenzar por cualquier parte del editor.

Una criatura puede:

- equiparse con objetos;
- poseer ataques naturales;
- copiarse desde otra definición;
- utilizar el mismo modelo general que una criatura oficial.

El contenido oficial y el contenido creado por usuarios se distinguen mediante procedencia.

Ejemplo:

```text
origin = OFFICIAL
origin = USER
```

Crear una criatura significa crear una definición reutilizable.

Al incluirla en un combate se crea una instancia configurada para esa pelea.

---

# 20. Definiciones e instancias

Se mantiene la distinción:

```text
Definition
→ qué es algo reutilizable

Instance
→ ejemplar concreto

CombatState
→ estado mutable dentro del combate
```

Ejemplo:

```text
CreatureDefinition
Goblin chamán

CreatureInstance
Krik, Goblin chamán

CombatState
Krik entra con 5 PG, una carga gastada y una condición concreta
```

El frontend tendrá pantallas para crear definiciones reutilizables.

La configuración precombate servirá para crear y ajustar instancias.

---

# 21. Contenido y base de datos

Se utilizará una base de datos real desde el comienzo.

No se implementará modding en el planteo inicial.

El juego sí contemplará que el usuario cree directamente:

- personajes;
- criaturas;
- clases;
- razas;
- trasfondos;
- objetos;
- objetos mágicos;
- conjuros;
- otras definiciones necesarias.

El contenido oficial y el contenido del usuario vivirán en la base de datos con procedencia explícita.

Los archivos podrán utilizarse como seeds o recursos de instalación, pero la base de datos será la fuente operativa.

---

# 22. Catálogos y navegación

La navegación general prevista es:

```text
Inicio
├─ Personajes
│  ├─ Lista
│  └─ Editor
├─ Criaturas
│  ├─ Lista
│  └─ Editor
├─ Objetos
├─ Conjuros
├─ otras definiciones
├─ Nuevo combate
└─ Juego
```

`Nuevo combate` contiene el flujo específico de:

```text
seleccionar definiciones
crear instancias
asignar controladores
configurar estado inicial
establecer relaciones
comenzar combate
```

---

# 23. Combate aislado

La primera etapa del producto utiliza combates aislados.

Cada combate corresponde a un mundo ECS independiente.

```text
una sesión de combate
→ un World ECS
```

No existe una simulación global compartida entre salas.

No todos los combates están interconectados.

En la primera versión:

```text
definición persistente
→ instancia nueva para el combate
→ estado mutable durante el combate
→ el resultado no modifica la definición
```

El estado final del personaje no persiste todavía entre combates.

La progresión y continuidad de estado llegarán con dungeon y RPG.

---

# 24. Party

El concepto `Party` se posterga.

Por ahora se utilizarán conceptos más precisos:

```text
ControllerAssignment
→ qué usuario controla cada criatura

Relationship
→ qué relación mantiene cada criatura con las demás
```

`Party` no es necesariamente equivalente a:

- aliados actuales;
- criaturas controladas por jugadores;
- mismo bando;
- grupo persistente de viaje.

En el futuro podrá representar un grupo persistente del RPG.

---

# 25. Multijugador

El multijugador inicial será por sala.

Características acordadas:

```text
usuarios identificados
código de invitación
conexión desde otras computadoras
uno o más personajes asignados por usuario
cada usuario actúa cuando llega el turno de una criatura que controla
```

Una criatura puede cambiar de controlador durante el combate debido a reglas o efectos.

Ante desconexión del jugador, la decisión inicial es pasar el turno.

No se asignará automáticamente una IA en la primera implementación.

Las reacciones de criaturas controladas por un usuario se resolverán cuando se diseñe el sistema de ventanas de reacción.

---

# 26. Persistencia

Se guardarán:

- definiciones;
- personajes;
- criaturas;
- sesiones de combate;
- estado de combate;
- historial completo;
- mensajes del jugador;
- interpretaciones;
- decisiones;
- causas;
- tiradas;
- eventos;
- narraciones.

Los combates podrán:

- guardarse;
- reanudarse;
- inspeccionarse después de terminar.

La persistencia debe permitir volver a un punto anterior.

---

# 27. Historial y bifurcaciones

Volver a un punto anterior no destruye la historia original.

Se crea una nueva bifurcación.

```text
Combate original
├─ evento 1
├─ evento 2
├─ evento 3
└─ evento 4

Nueva rama desde evento 2
├─ evento 1
├─ evento 2
├─ nueva continuación
```

La nueva rama debe poder registrar conceptualmente:

```text
parentSessionId
branchPointEventId
createdByUserId
createdAt
```

El historial debe considerarse inmutable.

Las correcciones y reintentos generan nuevas líneas.

La estrategia técnica concreta podrá combinar eventos y snapshots periódicos.

---

# 28. Snapshot y frontera del juego

La decisión acordada es:

```text
Game
→ construye una proyección semántica del estado

Backend
→ transforma esa proyección al contrato HTTP
```

El backend no debe inspeccionar directamente los almacenes internos del ECS.

El game no debe conocer REST.

---

# 29. Entidades ECS y elementos externos

Recomendación aceptada por ahora:

Entidades ECS:

- criaturas participantes;
- objetos concretos cuando su estado individual importe;
- efectos temporales complejos cuando resulte necesario;
- futuros elementos del escenario.

Fuera del ECS:

- usuarios;
- requests HTTP;
- definiciones de catálogo;
- mensajes visuales;
- sesiones de red;
- base de datos;
- conjuros como definiciones;
- Dungeon Master como voz.

Los elementos no resueltos se decidirán cuando aparezca una necesidad concreta.

---

# 30. Contenido mínimo inicial

Contenido mínimo propuesto y aceptado:

```text
2 personajes
1 personaje combatiente
1 personaje lanzador

3 criaturas
1 acompañante

clases de ejemplo
razas y trasfondos de ejemplo

3 armas
2 armaduras
1 escudo
1 consumible
1 objeto mágico

3 conjuros
5 condiciones
```

La selección exacta se definirá más adelante.

---

# 31. Criterio de demo

Se considera que existe una demo desde que el frontend es recorrible con la experiencia planteada.

Sin embargo, la primera demo que se considera verdaderamente mostrable es:

```text
La experiencia visual del prototipo conectada a la simulación real.
```

Equivale a una demo integrada en la que:

- el jugador escribe;
- el sistema interpreta;
- la simulación resuelve;
- el cliente presenta el resultado;
- los sonidos y tiempos funcionan;
- la sesión puede persistirse.

---

# 32. Orden de desarrollo

El orden todavía no está fijado.

Se acordó no cerrar el plan antes de comprender con precisión:

- la interacción textual;
- el highlight;
- la narración;
- el runtime temporal;
- las reacciones;
- la persistencia;
- la relación entre cliente, backend y game.

Se considera válido desarrollar por etapas y sectores, siempre que:

- cada etapa produzca algo demostrable;
- las fronteras estén claras;
- no se replique lógica de juego en el cliente;
- los contratos permitan reemplazar implementaciones temporales;
- exista una integración obligatoria al cerrar las grandes etapas.

El orden definitivo se resolverá después de completar las decisiones funcionales pendientes.

---

# 33. Decisiones pendientes

Todavía deben resolverse, entre otras:

- cómo representar intenciones persistentes o condicionales;
- qué tipos exactos de mensajes produce el Dungeon Master;
- cómo se estructuran las ventanas de reacción;
- cómo se sincronizan clientes lentos o desconectados;
- cómo se organiza el runtime de ticks;
- qué nivel de contexto conserva el parser;
- cómo se presentan aclaraciones sin volver lento el juego;
- cómo se combina event log con snapshots;
- cómo se estructuran las hojas de personaje;
- cómo se diseñan las etiquetas o marcadores;
- cómo se limita el contenido de la primera versión.
