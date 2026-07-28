# Arquitectura del proyecto

## Estado

Este documento fija la arquitectura base del proyecto.

El producto se divide en tres responsabilidades principales:

```text
client
→ interfaz para el usuario

server/features
→ API REST, base de datos y coordinación

server/game
→ simulación autoritativa y reglas del juego
```

El ECS pertenece a `server/game`, pero no representa por sí solo toda la aplicación. El cliente y la API son marcos mediante los cuales los usuarios interactúan con la simulación.

La arquitectura debe permitir crecer en este orden:

```text
simulador de combates aislados
→ simulador de dungeon
→ simulador de RPG
```

## Estructura raíz

```text
solo-adventuring-txt/
├─ client/
├─ server/
├─ shared/
└─ docs/
```

## Fronteras principales

### Cliente

El cliente:

- presenta pantallas;
- mantiene estado efímero de interfaz;
- recoge decisiones del usuario;
- envía peticiones al servidor;
- representa snapshots y eventos;
- reproduce animaciones, sonidos y texto progresivo.

El cliente no resuelve reglas autoritativas.

### Servidor

El servidor:

- expone la API REST;
- valida peticiones;
- guarda y recupera datos;
- coordina sesiones y multijugador;
- invoca la simulación;
- devuelve snapshots y eventos.

### Juego

`server/src/game` contiene la lógica de negocio real:

- mundo ECS;
- entidades y componentes;
- sistemas;
- comandos;
- eventos;
- reglas;
- IA;
- construcción de personajes;
- resolución de combate.

### Shared

`shared/` contiene solamente contratos de frontera compartidos por cliente y servidor:

- DTO;
- esquemas de requests y responses;
- nombres públicos de eventos;
- constantes transportables.

No contiene reglas del juego ni componentes ECS internos.

# Cliente JavaScript vanilla

## Estructura general recomendada

```text
client/
├─ public/
│  ├─ index.html
│  └─ assets/
│
├─ src/
│  ├─ app/
│  ├─ screens/
│  ├─ components/
│  ├─ services/
│  ├─ state/
│  ├─ presentation/
│  ├─ styles/
│  └─ main.js
│
└─ tests/
```

## Adaptación al proyecto

```text
client/
├─ public/
│  ├─ index.html
│  └─ assets/
│     ├─ icons/
│     ├─ images/
│     └─ sounds/
│
├─ src/
│  ├─ app/
│  │  ├─ bootstrap.js
│  │  ├─ router.js
│  │  ├─ routes.js
│  │  └─ appState.js
│  │
│  ├─ screens/
│  │  ├─ game/
│  │  │  ├─ gameScreen.js
│  │  │  ├─ gameView.js
│  │  │  ├─ combatLogView.js
│  │  │  ├─ partyPanelView.js
│  │  │  ├─ nearbyPanelView.js
│  │  │  └─ gameScreen.css
│  │  │
│  │  ├─ character-setup/
│  │  │  ├─ characterSetupScreen.js
│  │  │  ├─ generalStep.js
│  │  │  ├─ raceStep.js
│  │  │  ├─ backgroundStep.js
│  │  │  ├─ abilitiesStep.js
│  │  │  ├─ inventoryStep.js
│  │  │  ├─ spellsStep.js
│  │  │  └─ characterSetup.css
│  │  │
│  │  ├─ creature-setup/
│  │  │  ├─ creatureSetupScreen.js
│  │  │  ├─ creatureForm.js
│  │  │  ├─ actionsEditor.js
│  │  │  └─ creatureSetup.css
│  │  │
│  │  ├─ item-setup/
│  │  ├─ spell-setup/
│  │  │
│  │  ├─ combat-setup/
│  │  │  ├─ combatSetupScreen.js
│  │  │  ├─ participantSelector.js
│  │  │  ├─ controllerSelector.js
│  │  │  └─ relationshipEditor.js
│  │  │
│  │  └─ multiplayer/
│  │     ├─ multiplayerScreen.js
│  │     ├─ lobbyView.js
│  │     └─ roomView.js
│  │
│  ├─ components/
│  │  ├─ button/
│  │  ├─ modal/
│  │  ├─ panel/
│  │  ├─ form-field/
│  │  ├─ tabs/
│  │  ├─ dice-message/
│  │  └─ typewriter-message/
│  │
│  ├─ services/
│  │  ├─ apiClient.js
│  │  ├─ characterApi.js
│  │  ├─ creatureApi.js
│  │  ├─ itemApi.js
│  │  ├─ spellApi.js
│  │  ├─ combatApi.js
│  │  ├─ multiplayerApi.js
│  │  ├─ eventBus.js
│  │  └─ audioService.js
│  │
│  ├─ state/
│  │  ├─ store.js
│  │  ├─ characterDraftState.js
│  │  ├─ combatState.js
│  │  ├─ sessionState.js
│  │  └─ selectors.js
│  │
│  ├─ presentation/
│  │  ├─ render.js
│  │  ├─ combatEventPresenter.js
│  │  ├─ snapshotMapper.js
│  │  ├─ textHighlighter.js
│  │  ├─ typewriterPresenter.js
│  │  └─ formatters.js
│  │
│  ├─ styles/
│  │  ├─ reset.css
│  │  ├─ tokens.css
│  │  ├─ layout.css
│  │  ├─ game.css
│  │  └─ utilities.css
│  │
│  └─ main.js
│
└─ tests/
```

## Corrección sobre `highlight`

`highlight` no es una pantalla ni una vista independiente.

Es una capacidad de presentación aplicada al texto mostrado dentro de otras pantallas, especialmente `game`.

Por eso debe vivir en:

```text
presentation/textHighlighter.js
```

O, si más adelante gana varias piezas propias:

```text
presentation/highlight/
├─ parseHighlights.js
├─ renderHighlights.js
└─ highlightRules.js
```

La pantalla de juego decide dónde mostrar texto. El highlighter decide cómo marcar nombres, dados, acciones, objetivos o estados dentro de ese texto.

# Backend API REST orientado a features

## Estructura general recomendada

```text
server/
├─ src/
│  ├─ app/
│  ├─ features/
│  ├─ game/
│  ├─ database/
│  ├─ transport/
│  ├─ realtime/
│  └─ shared/
└─ tests/
```

## Adaptación al proyecto

```text
server/
├─ src/
│  ├─ app/
│  │  ├─ createServer.js
│  │  ├─ createDependencies.js
│  │  ├─ config.js
│  │  └─ startServer.js
│  │
│  ├─ features/
│  │  ├─ characters/
│  │  │  ├─ routes.js
│  │  │  ├─ handlers.js
│  │  │  ├─ characterService.js
│  │  │  ├─ characterRepository.js
│  │  │  ├─ characterSchemas.js
│  │  │  └─ characterMapper.js
│  │  │
│  │  ├─ creatures/
│  │  │  ├─ routes.js
│  │  │  ├─ handlers.js
│  │  │  ├─ creatureService.js
│  │  │  ├─ creatureRepository.js
│  │  │  ├─ creatureSchemas.js
│  │  │  └─ creatureMapper.js
│  │  │
│  │  ├─ items/
│  │  │  ├─ routes.js
│  │  │  ├─ handlers.js
│  │  │  ├─ itemService.js
│  │  │  ├─ itemRepository.js
│  │  │  └─ itemSchemas.js
│  │  │
│  │  ├─ spells/
│  │  │  ├─ routes.js
│  │  │  ├─ handlers.js
│  │  │  ├─ spellService.js
│  │  │  ├─ spellRepository.js
│  │  │  └─ spellSchemas.js
│  │  │
│  │  ├─ combats/
│  │  │  ├─ routes.js
│  │  │  ├─ handlers.js
│  │  │  ├─ combatService.js
│  │  │  ├─ combatRepository.js
│  │  │  ├─ combatSchemas.js
│  │  │  └─ combatMapper.js
│  │  │
│  │  ├─ game-sessions/
│  │  │  ├─ routes.js
│  │  │  ├─ handlers.js
│  │  │  ├─ sessionService.js
│  │  │  └─ sessionRepository.js
│  │  │
│  │  └─ multiplayer/
│  │     ├─ routes.js
│  │     ├─ handlers.js
│  │     ├─ multiplayerService.js
│  │     ├─ roomRepository.js
│  │     └─ playerConnectionService.js
│  │
│  ├─ game/
│  │  └─ simulación ECS
│  │
│  ├─ database/
│  │  ├─ connection.js
│  │  ├─ migrations/
│  │  ├─ seeds/
│  │  ├─ transaction.js
│  │  └─ models/
│  │
│  ├─ transport/
│  │  ├─ httpServer.js
│  │  ├─ middleware/
│  │  │  ├─ errorHandler.js
│  │  │  ├─ requestValidation.js
│  │  │  └─ authentication.js
│  │  └─ errors/
│  │
│  ├─ realtime/
│  │  ├─ gateway.js
│  │  ├─ rooms.js
│  │  ├─ connections.js
│  │  └─ messages.js
│  │
│  └─ shared/
│     ├─ ids/
│     ├─ validation/
│     ├─ errors/
│     ├─ logging/
│     └─ serialization/
│
└─ tests/
```

## Responsabilidad de una feature

Cada feature agrupa su flujo vertical:

```text
HTTP route
→ handler
→ service
→ repository o game
→ mapper
→ HTTP response
```

No se adopta MVC global. Cada feature mantiene juntas sus rutas, validación, coordinación, persistencia y mapeo.

El backend no replica reglas del juego. Para resolver juego llama a `server/src/game`.

# Juego y ECS

## Estructura ECS general recomendada

```text
game/
├─ ecs/
├─ components/
├─ entities/
├─ commands/
├─ systems/
├─ rules/
├─ events/
├─ queries/
├─ snapshots/
├─ simulation/
├─ random/
└─ tests/
```

## Adaptación al proyecto

```text
server/src/game/
├─ ecs/
│  ├─ world/
│  │  ├─ createWorld.js
│  │  ├─ worldState.js
│  │  ├─ addEntity.js
│  │  ├─ removeEntity.js
│  │  └─ cloneWorld.js
│  ├─ entities/
│  │  ├─ entityId.js
│  │  ├─ entityRegistry.js
│  │  └─ entityQueries.js
│  ├─ components/
│  │  ├─ componentStore.js
│  │  ├─ componentTypes.js
│  │  └─ componentQueries.js
│  ├─ systems/
│  │  ├─ systemRunner.js
│  │  ├─ systemContext.js
│  │  └─ systemPipeline.js
│  └─ scheduler/
│     ├─ schedule.js
│     └─ phaseOrder.js
│
├─ components/
│  ├─ Identity.js
│  ├─ CreatureProfile.js
│  ├─ AbilityScores.js
│  ├─ Proficiencies.js
│  ├─ Skills.js
│  ├─ Health.js
│  ├─ Defense.js
│  ├─ DamageAffinities.js
│  ├─ Resources.js
│  ├─ Traits.js
│  ├─ Actions.js
│  ├─ Reactions.js
│  ├─ Conditions.js
│  ├─ Inventory.js
│  ├─ Equipment.js
│  ├─ Spellcasting.js
│  ├─ SpellSheet.js
│  ├─ CharacterBuild.js
│  ├─ CompanionProgression.js
│  ├─ Controller.js
│  ├─ Faction.js
│  ├─ ActionEconomy.js
│  └─ TurnState.js
│
├─ entities/
│  ├─ createCreature.js
│  ├─ createCharacter.js
│  ├─ createCompanion.js
│  ├─ createItemInstance.js
│  ├─ createCombat.js
│  └─ instantiateDefinition.js
│
├─ commands/
│  ├─ createCombatCommand.js
│  ├─ addCombatantCommand.js
│  ├─ assignControllerCommand.js
│  ├─ setRelationshipCommand.js
│  ├─ startCombatCommand.js
│  ├─ attackCommand.js
│  ├─ castSpellCommand.js
│  ├─ useItemCommand.js
│  ├─ dodgeCommand.js
│  └─ passCommand.js
│
├─ systems/
│  ├─ setup/
│  ├─ turns/
│  ├─ actions/
│  ├─ effects/
│  ├─ reactions/
│  ├─ concentration/
│  ├─ ai/
│  └─ lifecycle/
│
├─ rules/
│  ├─ attacks/
│  ├─ armor-class/
│  ├─ damage/
│  ├─ saving-throws/
│  ├─ conditions/
│  ├─ spells/
│  ├─ items/
│  ├─ resources/
│  ├─ targeting/
│  └─ victory/
│
├─ character-building/
│  ├─ buildCharacter.js
│  ├─ applyRace.js
│  ├─ applySubrace.js
│  ├─ applyBackground.js
│  ├─ applyClass.js
│  ├─ applyEquipment.js
│  ├─ applySpells.js
│  └─ resolveDerivedValues.js
│
├─ definitions/
│  ├─ creatureDefinition.js
│  ├─ raceDefinition.js
│  ├─ backgroundDefinition.js
│  ├─ classDefinition.js
│  ├─ itemDefinition.js
│  ├─ spellDefinition.js
│  ├─ traitDefinition.js
│  └─ conditionDefinition.js
│
├─ events/
│  ├─ eventTypes.js
│  ├─ eventCollector.js
│  └─ createEvent.js
│
├─ queries/
│  ├─ getCurrentActor.js
│  ├─ getAvailableActions.js
│  ├─ getValidTargets.js
│  ├─ getCombatants.js
│  └─ getCombatStatus.js
│
├─ snapshots/
│  ├─ buildCombatSnapshot.js
│  ├─ buildCreatureSnapshot.js
│  ├─ buildCharacterSnapshot.js
│  └─ buildAvailableActionsSnapshot.js
│
├─ simulation/
│  ├─ executeCommand.js
│  ├─ runSystemPipeline.js
│  ├─ advanceUntilPlayerInput.js
│  └─ createSimulationContext.js
│
├─ random/
│  ├─ diceRoller.js
│  └─ randomSource.js
│
└─ tests/
```

## Responsabilidades internas

```text
ecs/
infraestructura genérica del mundo ECS

components/
datos puros

entities/
factories y ensamblado de entidades

commands/
intenciones de modificar el mundo

systems/
procesamiento de componentes y comandos

rules/
cálculos, validadores y políticas reutilizables

events/
resultados semánticos producidos por la simulación

queries/
lecturas controladas del mundo

snapshots/
representaciones públicas para API y cliente

simulation/
coordinación de comandos, sistemas y avance del mundo
```

## Flujo completo

```text
cliente
→ request REST
→ server/features
→ cargar datos desde database
→ crear comando de juego
→ server/game/simulation
→ sistemas ECS
→ eventos + mundo actualizado
→ guardar estado
→ construir snapshot
→ respuesta REST
→ cliente representa
```

## Dependencias permitidas

```text
client
→ shared

server/features
→ shared
→ database
→ server/game

server/game
→ no depende del cliente
→ no depende de HTTP
→ no depende directamente de la base de datos
```

## Decisiones fijadas

- El servidor es autoritativo.
- El backend es una API REST orientada a features.
- La base de datos se utiliza desde la primera versión.
- El juego real vive en `server/src/game`.
- La simulación usa ECS.
- El ECS representa el mundo del juego, no toda la aplicación.
- Jugador e IA producen comandos compatibles.
- Los sistemas producen eventos semánticos.
- El cliente recibe snapshots, no el mundo ECS interno.
- El frontend es JavaScript vanilla y se organiza principalmente por pantallas y servicios.
- `highlight` es presentación de texto, no una pantalla.
- Multijugador puede añadir transporte en tiempo real sin mover las reglas fuera de `game`.
- Las carpetas se crean cuando exista una responsabilidad real; esta estructura es una guía, no una obligación de generar directorios vacíos.
