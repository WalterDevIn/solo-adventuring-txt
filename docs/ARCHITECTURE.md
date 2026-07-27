# Arquitectura del proyecto

## Estado del documento

Este documento fija la arquitectura base del proyecto real en la rama `master`.

Su propósito es establecer fronteras claras entre cliente, servidor y código compartido antes de comenzar la implementación del simulador de combates aislados.

La arquitectura debe permitir ampliar el producto en este orden:

```text
Simulador de combates aislados
→ simulador de exploración de dungeon
→ simulador de RPG
```

La primera implementación solo necesita resolver combates aislados, pero no debe introducir dependencias que obliguen a rehacer el núcleo cuando se incorporen escenarios, progresión, exploración, mundo persistente o simulación fuera de pantalla.

Este documento define responsabilidades y dependencias. No fija todavía framework, base de datos, protocolo definitivo, lenguaje de persistencia ni estructura final de despliegue.

---

## Principios arquitectónicos

### 1. El servidor es autoritativo

El servidor posee y modifica el estado canónico del juego.

El cliente:

- presenta información;
- recoge decisiones del usuario;
- envía intenciones;
- representa snapshots y eventos recibidos.

El cliente no decide:

- si una acción es válida;
- cuánto daño se aplica;
- qué recursos se consumen;
- quién actúa después;
- si un combate terminó;
- qué acción elige una IA;
- cuál es el estado final de una criatura.

Regla central:

```text
El cliente solicita.
El servidor valida y resuelve.
El cliente representa.
```

### 2. Jugador e IA usan el mismo contrato de acciones

Una acción no cambia según quién la solicite.

```text
Jugador
→ ActionRequest

IA
→ ActionRequest

Servidor
→ misma validación y misma resolución
```

No deben existir sistemas paralelos como:

```text
resolvePlayerAttack
resolveEnemyAttack
```

Debe existir una ruta común:

```text
submitAction
→ validateAction
→ resolveAction
→ emitEvents
→ buildSnapshot
```

### 3. Las reglas no dependen de la interfaz

El servidor no conoce:

- DOM;
- botones;
- componentes visuales;
- animaciones;
- sonidos;
- diseño de pantallas;
- estado local de formularios.

La simulación produce resultados semánticos, no instrucciones visuales.

Ejemplo correcto:

```text
DAMAGE_APPLIED
CONDITION_ADDED
TURN_STARTED
COMBAT_FINISHED
```

Ejemplo incorrecto:

```text
SHOW_RED_FLASH
PLAY_HIT_SOUND
MOVE_HEALTH_BAR
```

### 4. El contenido se separa de las reglas

Criaturas, razas, trasfondos, clases, objetos, objetos mágicos, conjuros y comportamientos de IA deben expresarse principalmente como definiciones de contenido.

Las reglas generales interpretan esas definiciones.

```text
Regla de ataque
+ definición de espada larga
+ estado del atacante
+ estado del objetivo
= resultado
```

No debe codificarse una función especial para cada criatura, arma o conjuro salvo que una regla verdaderamente excepcional lo requiera.

### 5. El estado mutable se separa de las definiciones

Las definiciones son reutilizables e inmutables.

Las instancias identifican ejemplares concretos.

El estado de combate contiene valores mutables de la sesión.

```text
Definition
→ qué es algo

Instance
→ qué ejemplar concreto existe

CombatState
→ qué le está ocurriendo durante este combate
```

### 6. Las etapas futuras agregan módulos, no reemplazan el núcleo

La actualización de dungeon debe añadir escenario, posición, movimiento, exploración y progresión alrededor del combate existente.

La actualización de RPG debe añadir mundo, tiempo, relaciones, misiones y persistencia alrededor de los sistemas anteriores.

```text
RPG
└─ Dungeon
   └─ Combat
```

El combate no debe depender de que existan dungeon o mundo.

---

## Estructura raíz

```text
client/
server/
shared/
docs/
```

### `client/`

Aplicación visible e interactiva.

Responsable de:

- pantallas;
- formularios;
- interacción del usuario;
- estado efímero de interfaz;
- presentación de snapshots;
- representación de eventos;
- comunicación con el servidor.

### `server/`

Aplicación autoritativa.

Responsable de:

- creación y validación de entidades;
- sesiones de combate;
- reglas;
- simulación;
- IA;
- contenido;
- persistencia futura;
- exposición de operaciones al cliente.

### `shared/`

Contratos que cliente y servidor deben interpretar de la misma manera.

Responsable de:

- mensajes;
- DTO;
- identificadores;
- esquemas de validación de frontera;
- nombres de eventos;
- versiones del protocolo.

No contiene reglas autoritativas.

### `docs/`

Decisiones y pautas de desarrollo.

Debe documentar:

- arquitectura;
- componentes;
- contratos;
- límites;
- decisiones relevantes;
- estado y evolución del proyecto.

---

# Arquitectura del servidor

## Estructura propuesta

```text
server/
├─ src/
│  ├─ application/
│  ├─ domain/
│  ├─ simulation/
│  ├─ ai/
│  ├─ content/
│  ├─ infrastructure/
│  └─ transport/
└─ tests/
```

Las carpetas pueden introducirse gradualmente. La primera versión no necesita llenarlas todas, pero cada responsabilidad debe terminar en su capa correspondiente.

---

## `server/src/application/`

Coordina casos de uso del servidor.

No contiene fórmulas de combate ni detalles de transporte.

Ejemplos:

```text
createCharacter
updateCharacterBuild
createCombatSession
addCombatant
removeCombatant
assignController
setRelationship
startCombat
submitAction
advanceAiTurns
finishCombat
```

Una operación de aplicación:

1. recibe datos ya transportados;
2. carga o recibe el estado necesario;
3. invoca reglas del dominio y la simulación;
4. guarda el nuevo estado cuando corresponda;
5. devuelve eventos y snapshot.

Ejemplo conceptual:

```text
submitAction(command)
├─ obtener sesión
├─ comprobar actor y turno
├─ validar acción
├─ resolver acción
├─ procesar efectos y reacciones
├─ avanzar turno
├─ comprobar final del combate
└─ devolver eventos + snapshot
```

La capa de aplicación no debe saber cómo se dibuja el resultado ni cómo se serializa internamente una base de datos.

---

## `server/src/domain/`

Contiene conceptos y reglas invariantes del juego.

Estructura inicial sugerida:

```text
domain/
├─ creature/
├─ character/
├─ race/
├─ background/
├─ class/
├─ companion/
├─ item/
├─ spell/
├─ condition/
├─ combat/
├─ action/
├─ effect/
├─ resource/
└─ relationship/
```

Responsabilidades:

- validar estructuras del dominio;
- construir personajes y criaturas;
- resolver valores derivados;
- expresar acciones, efectos, rasgos y condiciones;
- mantener invariantes;
- representar estado canónico.

Ejemplos de invariantes:

- una instancia posee un ID único;
- una puntuación de característica es válida;
- un objeto equipado existe en el inventario;
- una criatura no gasta más recursos de los disponibles;
- una condición aplicada referencia una definición existente;
- un personaje conserva el origen de sus concesiones;
- el estado actual de PG no supera el máximo salvo regla explícita.

El dominio no depende de:

- HTTP;
- WebSocket;
- archivos;
- base de datos;
- navegador;
- framework visual.

---

## `server/src/simulation/`

Ejecuta la evolución del estado durante una sesión.

Estructura inicial sugerida:

```text
simulation/
├─ combat/
├─ turns/
├─ actions/
├─ targeting/
├─ rolls/
├─ damage/
├─ healing/
├─ conditions/
├─ resources/
├─ reactions/
├─ concentration/
└─ events/
```

Responsabilidades:

- iniciativa;
- rondas y turnos;
- economía de acciones;
- validación contextual;
- tiradas;
- aplicación de efectos;
- daño y curación;
- condiciones;
- concentración;
- reacciones;
- consumo y recuperación de recursos;
- determinación del resultado.

La simulación recibe estado e intención y produce nuevo estado más eventos.

Ideal conceptual:

```text
nextState, events = simulate(previousState, request)
```

No es obligatorio que toda la implementación sea puramente funcional, pero los cambios deben ser explícitos, deterministas bajo una fuente de aleatoriedad controlada y fáciles de probar.

### Aleatoriedad

Las tiradas deben pasar por una abstracción controlable.

```text
DiceRoller
├─ producción: aleatorio real
└─ pruebas: resultados predeterminados
```

Los sistemas no deben invocar `Math.random()` directamente en múltiples lugares.

---

## `server/src/ai/`

Genera intenciones para criaturas controladas por IA.

Estructura inicial sugerida:

```text
ai/
├─ behaviors/
├─ perception/
├─ evaluation/
└─ chooseAction/
```

Responsabilidad:

```text
CombatSnapshot visible para el actor
+ BehaviorDefinition
→ ActionRequest
```

La IA no:

- aplica daño;
- cambia turnos;
- modifica PG;
- ignora validación;
- accede directamente a la interfaz.

Comportamientos iniciales posibles:

```text
aggressive-melee
aggressive-ranged
defensive
support-ally
cowardly
random-valid-action
```

El comportamiento es contenido o configuración. El sistema común de IA lo interpreta.

---

## `server/src/content/`

Contiene definiciones concretas del juego.

Estructura sugerida:

```text
content/
├─ creatures/
├─ races/
├─ subraces/
├─ backgrounds/
├─ classes/
├─ subclasses/
├─ companionClasses/
├─ feats/
├─ items/
├─ magicItems/
├─ spells/
├─ conditions/
├─ actions/
├─ traits/
├─ reactions/
└─ behaviors/
```

El contenido debe ser registrable y consultable por ID.

```text
ContentRegistry
├─ getCreature(id)
├─ getItem(id)
├─ getSpell(id)
├─ getTrait(id)
└─ ...
```

Las definiciones deben referenciar otras definiciones por ID, no por copias anidadas innecesarias.

Ejemplo:

```text
Espada larga
└─ concede action.weapon.longsword

Action.weapon.longsword
└─ produce daño cortante según sus reglas
```

El contenido puede estar inicialmente en módulos de código. Su almacenamiento definitivo se decidirá después.

---

## `server/src/infrastructure/`

Implementa detalles externos al dominio.

Estructura futura:

```text
infrastructure/
├─ persistence/
├─ repositories/
├─ ids/
├─ clock/
├─ random/
└─ logging/
```

En la primera versión puede existir solo memoria.

```text
InMemoryCombatSessionRepository
InMemoryCharacterRepository
```

La aplicación debe depender de interfaces o contratos propios, no directamente de una base de datos específica.

Esto permitirá cambiar:

```text
memoria
→ archivos
→ base de datos
```

sin modificar las reglas de combate.

---

## `server/src/transport/`

Adapta protocolos externos a casos de uso de aplicación.

Estructura posible:

```text
transport/
├─ http/
├─ websocket/
└─ local/
```

Responsabilidades:

- recibir solicitudes;
- autenticar en el futuro;
- validar forma externa;
- transformar DTO en comandos de aplicación;
- transformar respuestas en DTO;
- devolver errores de protocolo.

No resuelve reglas.

Durante el desarrollo inicial puede existir un transporte local o una API HTTP mínima. La arquitectura no debe obligar todavía a elegir WebSocket para todas las operaciones.

---

# Arquitectura del cliente

## Estructura propuesta

```text
client/
├─ src/
│  ├─ app/
│  ├─ screens/
│  ├─ features/
│  ├─ components/
│  ├─ state/
│  ├─ api/
│  ├─ presentation/
│  └─ assets/
└─ tests/
```

---

## `client/src/app/`

Compone la aplicación.

Responsable de:

- arranque;
- rutas o navegación;
- composición de dependencias;
- configuración global;
- selección del gateway;
- manejo global de errores.

No contiene reglas de combate.

---

## `client/src/screens/`

Representa pantallas completas.

Pantallas iniciales previstas:

```text
CharacterBuilderScreen
CreatureCatalogScreen
CombatSetupScreen
CombatScreen
CombatResultScreen
```

Una pantalla coordina features y componentes visuales, pero no calcula resultados autoritativos.

---

## `client/src/features/`

Agrupa capacidades de usuario por dominio de interfaz.

Estructura posible:

```text
features/
├─ character-builder/
├─ inventory-editor/
├─ spell-sheet-editor/
├─ creature-selection/
├─ relationship-editor/
├─ controller-assignment/
├─ combat-actions/
├─ combat-log/
└─ combat-summary/
```

Cada feature puede incluir:

```text
ui
local state
mapping
validation de formulario
api calls
```

La validación del cliente mejora la experiencia, pero nunca sustituye la validación autoritativa del servidor.

---

## `client/src/components/`

Componentes visuales reutilizables sin conocimiento profundo del caso de uso.

Ejemplos:

```text
Button
Modal
Tabs
Select
NumberInput
EntityCard
ResourceBar
DiceResult
MessageBubble
```

No deben importar directamente módulos del servidor.

---

## `client/src/state/`

Contiene estado de interfaz y copias de lectura del estado remoto.

Debe distinguir:

```text
Server state
→ snapshots recibidos

UI state
→ pestaña activa, selección temporal, formulario, modal, filtros
```

El cliente puede mantener una caché del snapshot, pero no convertirla en autoridad paralela.

No debe modificar localmente el estado canónico para fingir que una acción ya fue aceptada, salvo una representación optimista explícita y reversible en una etapa futura.

Para la primera versión se prefiere:

```text
intención enviada
→ estado pendiente
→ respuesta del servidor
→ render del nuevo snapshot
```

---

## `client/src/api/`

Única frontera de comunicación con el servidor.

Estructura sugerida:

```text
api/
├─ gameGateway.js
├─ httpGameGateway.js
├─ localGameGateway.js
├─ requestMappers.js
└─ responseMappers.js
```

La interfaz debería permitir reemplazar el transporte sin modificar pantallas.

```text
GameGateway
├─ createCharacter
├─ updateCharacter
├─ listCreatureDefinitions
├─ createCombatSession
├─ configureCombat
├─ startCombat
├─ submitAction
└─ getCombatSnapshot
```

El prototipo guionado no debe convertirse en la implementación del gateway real. Puede servir como referencia de experiencia, no como fuente de reglas.

---

## `client/src/presentation/`

Transforma DTO del servidor en modelos cómodos para mostrar.

Responsabilidades:

- etiquetas;
- orden de información;
- formato de números;
- textos de eventos;
- agrupación del historial;
- selección de iconos;
- visibilidad contextual.

Ejemplo:

```text
Evento semántico:
DAMAGE_APPLIED { sourceId, targetId, amount, damageType }

Presentación:
"Walter inflige 5 de daño cortante a la rata de cueva."
```

El servidor no necesita enviar la frase final salvo que en el futuro exista narración generada autoritativamente como un producto separado.

---

# Arquitectura compartida

## Estructura propuesta

```text
shared/
├─ src/
│  ├─ contracts/
│  ├─ schemas/
│  ├─ events/
│  ├─ identifiers/
│  ├─ enums/
│  └─ protocol/
└─ tests/
```

---

## `shared/src/contracts/`

DTO que cruzan la frontera cliente-servidor.

Ejemplos:

```text
CreateCharacterRequest
CharacterSheetDto
CreateCombatRequest
CombatSetupDto
ActionRequestDto
CombatSnapshotDto
CombatResultDto
ErrorDto
```

Los contratos externos no necesitan copiar exactamente la estructura interna del dominio.

```text
Domain model
≠ necesariamente
Transport DTO
```

Esto permite cambiar internamente el servidor sin romper el cliente, siempre que el contrato se mantenga.

---

## `shared/src/schemas/`

Validación estructural de mensajes y DTO.

Se usa en ambos extremos para detectar:

- campos faltantes;
- tipos incorrectos;
- versiones incompatibles;
- valores externos desconocidos.

La validación estructural compartida no contiene reglas como:

- el actor puede usar esta acción;
- el objetivo es hostil;
- quedan espacios de conjuro;
- el objeto está equipado.

Esas reglas pertenecen al servidor.

---

## `shared/src/events/`

Nombres y forma pública de eventos semánticos.

Eventos iniciales posibles:

```text
COMBAT_CREATED
COMBAT_STARTED
ROUND_STARTED
TURN_STARTED
ACTION_ACCEPTED
ACTION_REJECTED
ATTACK_ROLLED
SAVING_THROW_ROLLED
DAMAGE_APPLIED
HEALING_APPLIED
TEMPORARY_HP_GRANTED
CONDITION_APPLIED
CONDITION_REMOVED
RESOURCE_SPENT
REACTION_USED
CONCENTRATION_STARTED
CONCENTRATION_ENDED
CREATURE_DEFEATED
COMBAT_FINISHED
```

Los eventos públicos sirven para:

- historial;
- animaciones;
- sonido;
- depuración;
- pruebas;
- futura reproducción de combates.

No todos los eventos internos necesitan exponerse al cliente.

---

## `shared/src/identifiers/`

Convenciones de identificadores.

Categorías iniciales:

```text
CharacterId
CreatureDefinitionId
CombatantId
CombatSessionId
ItemDefinitionId
ItemInstanceId
SpellId
ActionId
TraitId
ConditionId
ResourceId
FactionId
RequestId
```

Aunque en JavaScript se representen como cadenas, deben tratarse conceptualmente como tipos distintos.

Convención sugerida para contenido:

```text
creature.goblin
race.dwarf
background.soldier
class.fighter
item.longsword
spell.fire-bolt
action.weapon.longsword
trait.dwarven-resilience
condition.poisoned
behavior.aggressive-melee
```

Los IDs de instancia deben generarse por infraestructura y no confundirse con IDs de definición.

---

## `shared/src/protocol/`

Versiona la comunicación.

Ejemplo:

```text
protocolVersion: 1
```

Los cambios compatibles pueden ampliar campos opcionales.

Los cambios incompatibles deben incrementar la versión o incluir una estrategia de migración.

---

# Flujo de datos

## Creación de personaje

```text
Cliente
├─ recoge elecciones
├─ valida formulario básico
└─ envía CharacterBuildRequest

Servidor
├─ valida IDs y elecciones
├─ aplica raza y subraza
├─ aplica trasfondo
├─ aplica clase y niveles
├─ concede objetos y conjuros
├─ resuelve componentes derivados
├─ guarda o mantiene la instancia
└─ devuelve CharacterSheetDto

Cliente
└─ representa la hoja resultante y sus fuentes
```

El cliente no construye por sí solo la hoja canónica.

---

## Configuración de combate

```text
Cliente
├─ selecciona participantes
├─ asigna facciones y relaciones
├─ asigna PLAYER o AI
└─ solicita iniciar combate

Servidor
├─ instancia combatientes
├─ crea CombatState
├─ valida hostilidad y controladores
├─ calcula iniciativa
├─ determina actor inicial
└─ devuelve eventos + CombatSnapshot
```

---

## Acción de jugador

```text
Cliente
└─ ActionRequestDto

Servidor
├─ valida sesión
├─ valida actor
├─ valida turno
├─ valida acción
├─ valida objetivos
├─ consume economía y recursos
├─ realiza tiradas
├─ aplica efectos
├─ procesa reacciones
├─ avanza estado
└─ devuelve eventos + snapshot
```

---

## Turno de IA

```text
Servidor
├─ detecta controlador AI
├─ crea contexto perceptible
├─ solicita intención al comportamiento
├─ obtiene ActionRequest interno
└─ usa exactamente la misma ruta de validación y resolución
```

El cliente puede mostrar la intención de IA si el producto lo requiere, pero no la genera ni la resuelve.

---

# Snapshots, comandos y eventos

## Comando o solicitud

Expresa lo que alguien intenta hacer.

```text
ActionRequest
```

No implica éxito.

## Evento

Expresa algo que ocurrió como resultado de la resolución.

```text
DAMAGE_APPLIED
```

## Snapshot

Expresa el estado canónico visible después de la resolución.

```text
CombatSnapshot
```

La respuesta normal del servidor debería contener:

```text
requestId
events
snapshot
```

Los eventos explican la transición. El snapshot permite recuperar consistencia aunque el cliente haya perdido un evento o se reconecte.

---

# Estado interno y estado visible

El servidor puede tener información que no debe exponerse completa.

En el simulador de combate inicial probablemente casi todo sea visible. Aun así, conviene distinguir:

```text
CombatState
→ estado interno completo

CombatSnapshot
→ proyección autorizada para un cliente
```

Esto permitirá incorporar posteriormente:

- criaturas ocultas;
- información desconocida;
- hechizos secretos;
- IA con memoria privada;
- trampas;
- niebla de guerra;
- varios jugadores con perspectivas distintas.

---

# Manejo de errores

Los errores deben ser semánticos y estables.

Ejemplos:

```text
COMBAT_NOT_FOUND
COMBAT_ALREADY_STARTED
COMBAT_NOT_ACTIVE
ACTOR_NOT_FOUND
NOT_ACTOR_TURN
ACTION_NOT_AVAILABLE
INVALID_TARGET
INSUFFICIENT_RESOURCE
REACTION_UNAVAILABLE
INVALID_CHARACTER_BUILD
CONTENT_DEFINITION_NOT_FOUND
```

La respuesta puede incluir:

```text
code
message
fieldErrors opcional
context opcional
```

El cliente decide cómo presentar el error, pero no debe depender de comparar textos libres.

---

# Dependencias permitidas

## Servidor

```text
transport
→ application
→ domain / simulation

application
→ domain
→ simulation
→ repositories abstraídos

simulation
→ domain

ai
→ domain visible / contratos internos de acción

content
→ definiciones del domain

infrastructure
→ interfaces requeridas por application/domain
```

Dependencias prohibidas:

```text
domain → transport
domain → infrastructure concreta
simulation → client
content → UI
```

## Cliente

```text
app
→ screens
→ features
→ api / presentation / components

features
→ api
→ shared contracts

components
→ modelos visuales simples
```

Dependencias prohibidas:

```text
client → server/src/domain
client → server/src/simulation
components → transporte concreto
```

## Shared

```text
client → shared
server → shared
```

`shared` no depende de `client` ni de `server`.

---

# Estrategia de pruebas

## Servidor

Prioridad:

1. reglas puras y valores derivados;
2. validación de acciones;
3. resolución de efectos;
4. turnos y finalización;
5. IA como productora de intenciones;
6. casos de uso de aplicación;
7. transporte.

Las pruebas deben poder fijar resultados de dados.

Ejemplo:

```text
Dado que Walter ataca con una espada larga
Y el d20 predeterminado es 15
Y el daño predeterminado es 6
Cuando se resuelve la acción
Entonces se emite ATTACK_ROLLED
Y se emite DAMAGE_APPLIED por 6
Y el snapshot contiene los PG actualizados
```

## Cliente

Prioridad:

- mapeo de DTO a presentación;
- flujos de formularios;
- estados de carga y error;
- selección de acciones y objetivos;
- historial de eventos;
- adaptación de pantallas.

Las pruebas del cliente no deben volver a probar fórmulas del servidor.

## Contratos

Debe verificarse que:

- cliente y servidor aceptan los mismos esquemas;
- ejemplos de mensajes siguen siendo válidos;
- cambios incompatibles sean detectados.

---

# Preparación para la actualización de dungeon

La etapa de dungeon agregará, como mínimo:

```text
Scenario
Position
Movement
Distance
Reach
Range validation
Line of sight
Cover
Terrain
Rooms
Doors
Exploration state
Progression between combats
```

Estos módulos deberán integrarse principalmente en:

```text
server/domain/scenario
server/simulation/movement
server/simulation/spatial
server/content/scenarios
client/features/map
shared/contracts/scenario
```

Las acciones existentes conservarán identidad y efectos. Se activarán validaciones espaciales previamente diferidas.

Ejemplo:

```text
Ataque con espada larga
antes: valida actor, objetivo, recurso y estado

después: además valida alcance, posición y línea de visión cuando corresponda
```

---

# Preparación para la actualización de RPG

La etapa de RPG agregará:

```text
WorldState
Time
Locations
Travel
NPC persistence
Relationships
Quests
Factions
Economy
Downtime
World simulation
Narrative context
```

El combate seguirá siendo un subsistema invocado por el mundo.

```text
WorldSession
└─ inicia CombatSession
   └─ devuelve CombatResult
      └─ WorldSession consolida consecuencias
```

El resultado de combate debe poder integrarse luego en un estado persistente sin convertir la sesión de combate en propietaria del mundo entero.

---

# Alcance de la primera implementación

La primera implementación real debe mantenerse pequeña.

Servidor mínimo:

```text
application/
  createCharacter
  createCombatSession
  configureCombat
  startCombat
  submitAction

domain/
  creature
  character
  item
  spell
  combat
  action
  effect
  condition

simulation/
  turns
  actions
  rolls
  damage
  resources

ai/
  chooseAction

content/
  conjunto mínimo de definiciones

transport/
  gateway inicial
```

Cliente mínimo:

```text
CharacterBuilderScreen
CombatSetupScreen
CombatScreen
CombatResultScreen
GameGateway
```

Shared mínimo:

```text
IDs
ActionRequestDto
CharacterSheetDto
CombatSnapshotDto
CombatEventDto
ErrorDto
```

No deben crearse módulos vacíos únicamente para imitar la arquitectura completa. Las carpetas se incorporan cuando existe una responsabilidad real, respetando desde el comienzo las fronteras aquí definidas.

---

# Decisiones fijadas

1. El servidor es autoritativo.
2. El cliente envía intenciones y representa resultados.
3. Jugador e IA producen la misma clase de solicitud de acción.
4. Las reglas generales viven en dominio y simulación, no en contenido ni interfaz.
5. El contenido se identifica por IDs estables.
6. Definiciones, instancias y estado mutable permanecen separados.
7. `shared/` contiene contratos, no lógica autoritativa.
8. Las respuestas importantes incluyen eventos y snapshot.
9. El transporte no contiene reglas.
10. La persistencia se abstrae y puede comenzar en memoria.
11. El combate debe funcionar sin escenario.
12. Dungeon y RPG deben ampliar el sistema mediante nuevos módulos.
13. El cliente nunca importa módulos internos del servidor.
14. Los dados usan una fuente de aleatoriedad controlable.
15. Las excepciones reglamentarias se expresan mediante rasgos, modificadores, acciones, reacciones y efectos, no mediante bifurcaciones específicas repartidas por el sistema.

---

# Decisiones pendientes

Se discutirán antes de implementar las partes correspondientes:

- lenguaje y runtime definitivos;
- framework del cliente;
- transporte inicial;
- forma exacta de los repositorios;
- almacenamiento del contenido;
- estrategia de serialización;
- granularidad de eventos internos y públicos;
- modelo exacto de reacciones y ventanas de interrupción;
- modelo de modificadores y excepciones;
- esquema detallado de acciones, efectos, objetos y conjuros;
- persistencia de personajes;
- autenticación y múltiples usuarios;
- reproducción o historial completo de combates.
