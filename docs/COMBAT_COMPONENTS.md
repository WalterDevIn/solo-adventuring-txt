# Componentes del simulador de combate

## Estado del documento

Este documento fija el modelo conceptual acordado para la primera etapa real del proyecto: un simulador de combates aislados.

Su propósito es evitar que las decisiones sobre entidades y componentes se pierdan mientras se profundiza posteriormente en la arquitectura del proyecto.

Todavía no define:

- estructura definitiva de módulos;
- API entre cliente y servidor;
- persistencia;
- escenarios;
- movimiento o posición;
- progresión entre combates;
- implementación concreta de los sistemas.

## Alcance de la primera etapa

El simulador debe permitir:

- crear personajes;
- elegir raza, subraza, trasfondo y clase;
- establecer puntuaciones de característica;
- configurar inventario, equipo y hoja de conjuros;
- elegir criaturas y monstruos para el combate;
- usar acompañantes;
- asignar control humano o IA;
- establecer relaciones entre participantes;
- iniciar y resolver un combate completo.

El escenario queda deliberadamente excluido. En esta etapa no existen posición, movimiento, distancia real, terreno, cobertura ni línea de visión.

## Principio central

`Creature` es la entidad combatiente común.

Personajes, monstruos y acompañantes no usan motores diferentes. Son distintas composiciones de una criatura capaz de participar en combate.

```text
Personaje
= Creature construida mediante raza + trasfondo + clase + elecciones

Monstruo
= Creature definida directamente por un bloque reutilizable

Acompañante
= Creature base + progresión de acompañante + controlador
```

La diferencia entre estas categorías está en su construcción y composición, no en las reglas utilizadas para atacar, lanzar conjuros, recibir daño o actuar durante un turno.

## Definición, instancia y estado

Toda entidad reutilizable debe distinguir tres niveles.

### Definition

Describe qué es algo en el catálogo.

Ejemplos:

- definición de goblin;
- definición de espada larga;
- definición de bola de fuego;
- definición de trasfondo soldado.

La definición no contiene estado mutable de una sesión.

### Instance

Representa un ejemplar concreto.

Ejemplos:

- goblin A;
- la espada concreta equipada por Walter;
- un personaje construido por el usuario.

Cada instancia posee un identificador propio aunque proceda de la misma definición.

### CombatState

Contiene el estado mutable de la instancia durante un combate.

Ejemplos:

- puntos de golpe actuales;
- puntos de golpe temporales;
- condiciones aplicadas;
- recursos gastados;
- reacción disponible;
- concentración activa.

La definición nunca pierde puntos de golpe ni gasta recursos.

## Componentes comunes de Creature

```text
Creature
├─ Identity
├─ CreatureProfile
├─ AbilityScores
├─ Proficiencies
├─ Skills
├─ Defense
├─ Health
├─ DamageAffinities
├─ ResourcePools
├─ TraitSet
├─ ActionSet
├─ ReactionSet
├─ Inventory                 opcional
├─ Equipment                 opcional
├─ Spellcasting              opcional
├─ SpellSheet                opcional
├─ CharacterBuild            opcional
├─ CompanionProgression      opcional
└─ Controller                asignado en el combate
```

## Identity

Identidad mínima de la criatura.

Campos previstos:

- `name`;
- `description`;
- referencia visual opcional;
- etiquetas descriptivas libres.

No incluye todavía personalidad completa, ideales, vínculos, biografía ni relaciones sociales.

## CreatureProfile

Describe la naturaleza reglamentaria de la criatura.

Campos previstos:

- `category`: humanoide, bestia, dragón, constructo, muerto viviente, etc.;
- `subtypes`: humano, orco, demonio, elfo, etc.;
- `size`: menudo, pequeño, mediano, grande, enorme o gargantuesco.

El tipo y los subtipos son relevantes porque rasgos, objetos y conjuros pueden filtrar objetivos por estas categorías.

El tamaño se conserva aunque todavía no haya espacio físico, porque puede intervenir en presas, transformaciones, límites de objetivos y futuras reglas de escenario.

Datos diferidos:

- velocidades;
- espacio ocupado;
- capacidades de vuelo, nado o excavación.

## AbilityScores

Contiene las seis puntuaciones:

- Fuerza;
- Destreza;
- Constitución;
- Inteligencia;
- Sabiduría;
- Carisma.

Los modificadores se calculan y no se almacenan como fuente independiente.

```text
modifier = floor((score - 10) / 2)
```

Las puntuaciones se usan en ataques, daño, iniciativa, salvaciones, CD, lanzamiento de conjuros y rasgos.

## Proficiencies

Contiene competencias mecánicas del combatiente.

Incluye:

- bonificador de competencia;
- tiradas de salvación competentes;
- grupos o armas concretas;
- armaduras;
- escudos;
- herramientas cuando una acción de combate las use.

Cada competencia debe conservar su fuente.

```text
longsword proficiency
└─ source: class.fighter
```

Esto permite explicar la hoja, detectar duplicados y reconstruir el personaje.

## Skills

Las habilidades se incorporan desde esta primera versión porque raza, trasfondo y clase pueden concederlas.

Niveles previstos:

- `none`;
- `proficient`;
- `expertise`;
- `half-proficiency` cuando corresponda.

La mayoría podrán permanecer inactivas durante el primer combate, pero forman parte de la hoja y preparan las siguientes etapas.

## Defense

Describe cómo se obtiene la Clase de Armadura, no solo su resultado final.

Puede provenir de:

- base natural;
- armadura equipada;
- Destreza;
- escudo;
- rasgos;
- objetos mágicos;
- efectos temporales.

La CA final es un valor derivado por reglas y modificadores.

## Health

Configuración duradera:

- puntos de golpe máximos;
- dados de golpe;
- reglas aplicables al llegar a 0 PG.

Estado de combate:

- PG actuales;
- PG temporales;
- éxitos y fallos de salvación contra muerte;
- estabilidad;
- derrota o muerte.

Las reglas de 0 PG deben ser configurables. Un personaje, un acompañante importante y un monstruo menor no necesariamente usan el mismo procedimiento.

## DamageAffinities

Incluye:

- resistencias al daño;
- vulnerabilidades al daño;
- inmunidades al daño;
- inmunidades a condiciones.

Las afinidades deben admitir restricciones, por ejemplo:

- solo contra daño no mágico;
- excepto ataques de plata;
- solo mientras una condición esté activa.

No deben limitarse para siempre a listas de cadenas simples.

## ResourcePools

Sistema genérico para recursos gastables.

Ejemplos:

- espacios de conjuro;
- ira;
- ki;
- segundo aliento;
- canalizar divinidad;
- dados de superioridad;
- cargas de objetos;
- acciones con recarga;
- usos diarios de monstruos.

Cada recurso define máximo, valor actual y regla de recuperación.

## TraitSet

Contiene rasgos pasivos, disparados o modificadores de reglas.

Los rasgos pueden:

- reaccionar a eventos;
- conceder ventaja o desventaja;
- modificar daño;
- impedir estados;
- alterar reglas generales;
- conceder acciones, reacciones o recursos.

Los rasgos particulares deben imponerse a las reglas generales cuando así lo indiquen.

No se debe repartir la lógica de cada rasgo mediante condicionales específicos dentro de los sistemas generales.

## ActionSet

Lista las acciones disponibles para la criatura.

Las acciones pueden provenir de:

- reglas universales;
- armas equipadas;
- raza;
- clase;
- monstruo;
- hechizos;
- objetos;
- efectos temporales.

Acciones mínimas del primer simulador:

- atacar;
- lanzar un conjuro;
- usar un objeto;
- esquivar;
- pasar.

Cada acción debe declarar:

- coste en economía de acciones;
- requisitos;
- tipo y cantidad de objetivos;
- tiradas necesarias;
- efectos producidos;
- recursos consumidos.

Los requisitos espaciales quedan desactivados hasta la etapa de escenarios.

## ReactionSet

Contiene reacciones disponibles.

Cada reacción necesita:

- evento disparador;
- condiciones de uso;
- coste de reacción;
- efectos;
- recursos opcionales.

El estado de combate debe indicar si la reacción está disponible.

## Effects

Acciones, rasgos, hechizos y objetos no deben modificar directamente el estado. Deben producir efectos comunes que el sistema de resolución aplica.

Efectos iniciales previstos:

- `APPLY_DAMAGE`;
- `HEAL`;
- `GRANT_TEMPORARY_HP`;
- `APPLY_CONDITION`;
- `REMOVE_CONDITION`;
- `MODIFY_ROLL`;
- `MODIFY_ARMOR_CLASS`;
- `SPEND_RESOURCE`;
- `RESTORE_RESOURCE`;
- `FORCE_SAVING_THROW`;
- `START_CONCENTRATION`;
- `END_CONCENTRATION`.

## CharacterBuild

Existe únicamente en personajes construidos mediante opciones de jugador.

```text
CharacterBuild
├─ RaceSelection
├─ BackgroundSelection
├─ ClassLevels
├─ FeatSelections
└─ SelectedOptions
```

Debe conservar las elecciones de origen, pero la criatura final contiene también los componentes resultantes.

## Raza y subraza

La raza es una fuente declarativa de construcción.

Puede conceder:

- tipo, subtipo y tamaño;
- aumentos de características;
- competencias;
- rasgos;
- resistencias e inmunidades;
- acciones y reacciones;
- magia innata;
- grupos de elecciones;
- subrazas disponibles.

La selección concreta conserva:

- `raceId`;
- `subraceId`;
- opciones elegidas;
- personalizaciones de origen cuando correspondan.

Datos raciales diferidos pero conservados:

- velocidad;
- idiomas;
- edad;
- tendencias de alineamiento;
- rangos de altura.

## Trasfondo

El trasfondo también es una fuente declarativa de construcción.

Puede conceder:

- competencias en habilidades;
- competencias en herramientas;
- equipo inicial;
- rasgos de trasfondo;
- elecciones configurables;
- etiquetas narrativas mínimas.

Los rasgos puramente narrativos pueden conservarse sin sistema activo durante esta etapa.

Debe admitirse posteriormente un trasfondo personalizado construido mediante elecciones equivalentes.

## Clase y niveles

La clase aplica componentes y concesiones según el nivel.

Puede aportar:

- dado de golpe;
- competencias;
- recursos;
- rasgos;
- acciones y reacciones;
- lanzamiento de conjuros;
- elecciones de clase;
- subclase cuando corresponda.

La clase no debe convertirse en una entidad monolítica con un sistema de combate propio.

## Orden de construcción del personaje

Orden conceptual inicial:

```text
1. Identidad
2. Base de criatura
3. Puntuaciones de característica base
4. Raza
5. Subraza
6. Trasfondo
7. Clase y niveles
8. Opciones de clase
9. Dotes
10. Equipo inicial
11. Hechizos
12. Resolución de valores derivados
```

La implementación debe preferir operaciones acumulables y una fase final de resolución para reducir dependencias rígidas del orden.

## Operaciones de construcción

Raza, trasfondo, clase y otras fuentes deberían expresarse mediante operaciones declarativas.

Operaciones previstas:

- `MODIFY_ABILITY_SCORE`;
- `GRANT_PROFICIENCY`;
- `GRANT_SKILL_PROFICIENCY`;
- `GRANT_TRAIT`;
- `GRANT_ACTION`;
- `GRANT_REACTION`;
- `GRANT_RESOURCE`;
- `GRANT_ITEM`;
- `GRANT_SPELL`;
- `ADD_DAMAGE_RESISTANCE`;
- `ADD_DAMAGE_IMMUNITY`;
- `ADD_CONDITION_IMMUNITY`.

Toda concesión debe conservar `sourceId`.

## Inventario

El inventario contiene instancias de objetos.

Campos mínimos por instancia:

- identificador;
- definición de origen;
- cantidad;
- estado mutable;
- ranura equipada opcional.

El inventario calcula el peso total. El peso es relevante desde esta versión, aunque todavía no genere penalizaciones de velocidad.

## Equipment

Representa qué objetos están equipados y en qué ranuras.

Ranuras iniciales previstas:

- mano principal;
- mano secundaria;
- armadura;
- escudo cuando corresponda;
- ranuras adicionales solo cuando un objeto las necesite.

El equipo puede conceder acciones, defensa, rasgos y modificadores.

## Objetos

Separación obligatoria:

```text
ItemDefinition
= qué clase de objeto es

ItemInstance
= ejemplar concreto poseído por alguien
```

Campos generales de definición:

- identidad;
- categoría;
- peso;
- reglas de cantidad;
- reglas de equipamiento;
- etiquetas;
- acciones y rasgos concedidos;
- reglas de consumo opcionales.

Categorías iniciales:

- arma;
- armadura;
- escudo;
- consumible;
- munición;
- foco;
- herramienta;
- misceláneo.

## Armas

Una definición de arma puede declarar:

- fórmula de daño;
- tipo de daño;
- característica usada;
- competencias necesarias;
- propiedades;
- variantes de uso;
- acciones concedidas.

El alcance y rango se conservan como datos, pero no se validan hasta que existan escenarios.

## Armaduras y escudos

Una armadura puede declarar:

- categoría;
- CA base;
- contribución de Destreza;
- límite de Destreza;
- requisito de Fuerza;
- desventaja de sigilo;
- competencias necesarias.

Los requisitos relacionados con movimiento pueden quedar inactivos hasta escenarios.

## Objetos mágicos

Un objeto mágico es una definición de objeto con propiedades mágicas adicionales.

Puede declarar:

- rareza;
- sintonización;
- requisitos de sintonización;
- cargas;
- recuperación de cargas;
- modificadores;
- rasgos;
- acciones;
- reacciones;
- conjuros concedidos.

El estado de una instancia guarda:

- cargas actuales;
- criatura sintonizada;
- usos actuales de propiedades.

## Spellcasting

Describe cómo lanza conjuros una criatura.

Campos previstos:

- característica de lanzamiento;
- fuente de lanzamiento;
- fórmula de ataque de conjuro;
- fórmula de CD de salvación;
- modificadores aplicables.

Los valores finales deben ser derivados para admitir objetos y efectos temporales.

## SpellSheet

Describe qué conjuros puede utilizar la criatura y sus recursos asociados.

Puede contener:

- conjuros conocidos;
- conjuros preparados;
- conjuros siempre preparados;
- trucos;
- espacios por nivel;
- usos innatos;
- fuentes de lanzamiento.

Los conjuros raciales, de clase, de monstruo y de objetos deben usar el mismo modelo de definición de conjuro.

## SpellDefinition

Una definición de conjuro puede declarar:

- identidad;
- nivel;
- escuela;
- tiempo y coste de lanzamiento;
- componentes;
- duración;
- concentración;
- objetivos;
- ataque o salvación;
- secuencia de efectos;
- escalado;
- consumo de recursos.

Alcance, área, línea de visión y cobertura se conservan como datos, pero no se validan hasta escenarios.

## Condiciones

Aunque no sean una de las categorías principales solicitadas, son imprescindibles para el combate.

Se distinguen:

```text
ConditionDefinition
= reglas de la condición

AppliedCondition
= aplicación concreta sobre una criatura
```

Una condición aplicada debe conservar:

- definición;
- fuente;
- duración;
- momento de expiración;
- salvación para terminarla cuando corresponda;
- acumulación o sustitución.

## Monstruos y criaturas de catálogo

Una definición de monstruo puede contener:

- identidad;
- perfil de criatura;
- características;
- competencias y salvaciones;
- defensa;
- salud;
- afinidades de daño;
- inmunidades a condiciones;
- recursos;
- rasgos;
- acciones;
- reacciones;
- equipo;
- lanzamiento de conjuros opcional;
- valor de desafío como metadato.

Se excluyen inicialmente:

- velocidad aplicada;
- sentidos aplicados;
- idiomas aplicados;
- acciones de guarida;
- reglas espaciales;
- descripción ecológica dentro del motor.

El valor de desafío se conserva para catálogo y futura construcción de encuentros, pero no modifica directamente las tiradas.

## Acompañantes

Un acompañante no es una entidad distinta.

```text
Companion
= Creature
+ CompanionProgression
+ Controller
```

La progresión puede identificar roles como:

- experto;
- guerrero;
- lanzador de conjuros.

La criatura base y la progresión de acompañante producen la hoja combatiente final.

Puede ser controlada por el jugador o por IA sin cambiar sus reglas.

## Controller

El controlador se asigna a la instancia dentro de la configuración del combate, no a la definición de criatura.

Tipos iniciales:

- `PLAYER`;
- `AI`.

Un controlador de IA referencia un comportamiento, pero debe producir las mismas solicitudes de acción que un jugador.

No existen resoluciones separadas para ataques de jugador y ataques de enemigo.

## Relaciones de combate

Las relaciones pertenecen a la sesión de combate, no a la definición de criatura.

Relaciones iniciales:

- aliado;
- neutral;
- hostil.

El modelo debe permitir varias facciones y no asumir únicamente dos equipos.

## Composición por categoría

### Personaje

```text
Identity
CreatureProfile
CharacterBuild
AbilityScores
Proficiencies
Skills
Defense
Health
DamageAffinities
ResourcePools
TraitSet
ActionSet
ReactionSet
Inventory
Equipment
Spellcasting opcional
SpellSheet opcional
Controller asignado en combate
```

### Criatura o monstruo

```text
Identity
CreatureProfile
AbilityScores
Proficiencies
Skills opcionales
Defense
Health
DamageAffinities
ResourcePools
TraitSet
ActionSet
ReactionSet
Equipment opcional
Spellcasting opcional
SpellSheet opcional
ChallengeMetadata
Controller asignado en combate
```

### Acompañante

```text
Todo lo de Creature
+ CompanionProgression
+ Inventory opcional
+ Equipment opcional
+ Spellcasting opcional
+ Controller PLAYER o AI
```

### Objeto

```text
ItemIdentity
ItemCategory
Weight
StackRules
EquipRules
GrantedActions
GrantedTraits
ConsumableRules opcional
WeaponProfile opcional
ArmorProfile opcional
```

### Objeto mágico

```text
Todo lo de Item
+ Rarity
+ Attunement
+ Charges opcionales
+ MagicModifiers
+ GrantedMagicActions
+ GrantedMagicReactions
+ GrantedSpells
```

### Hechizo

```text
SpellIdentity
Level
School
CastingCost
Components
Duration
Concentration
TargetSpecification
AttackOrSave
EffectSequence
Scaling
ResourceCost
```

## Datos excluidos de la primera etapa

No se implementan todavía:

- posición;
- velocidad aplicada;
- movimiento;
- rutas;
- distancia;
- alcance validado;
- línea de visión;
- cobertura;
- terreno;
- altura;
- vuelo como movimiento;
- ataques de oportunidad causados por desplazamiento;
- carrera y retirada espacial;
- áreas medidas sobre un mapa;
- acciones de guarida;
- peligros ambientales;
- viaje;
- comida y agua;
- iluminación;
- sigilo espacial;
- percepción pasiva aplicada al escenario.

## Datos conservados pero inactivos

Se conservan en definiciones para no perder información necesaria después:

- tamaño;
- velocidad racial o de criatura;
- alcance de armas;
- rango y área de conjuros;
- requisito de Fuerza de armaduras;
- peso de objetos;
- valor de desafío;
- dados de golpe;
- momentos de recuperación;
- idiomas;
- sentidos.

No implementar una regla todavía no significa eliminar la información que esa regla necesitará.

## Decisiones que este documento fija

1. `Creature` es la base combatiente común.
2. Personajes, monstruos y acompañantes comparten sistemas.
3. Raza, trasfondo y clase son fuentes declarativas de construcción.
4. Todo objeto separa definición e instancia.
5. Todo estado mutable del combate vive fuera de la definición.
6. Acciones, hechizos, rasgos y objetos producen efectos comunes.
7. El controlador genera intenciones; no resuelve reglas.
8. Las relaciones pertenecen a la sesión de combate.
9. La información espacial se pospone sin borrar sus datos fuente.
10. Toda concesión debe conservar su origen mediante `sourceId`.

## Puntos pendientes de discusión

Este documento no cierra todavía:

- granularidad exacta de los componentes;
- formato de operaciones declarativas;
- modelo de eventos;
- orden definitivo de resolución;
- economía de acciones completa;
- representación de modificadores y predicados;
- contratos compartidos;
- estructura de carpetas interna;
- sistema de IDs;
- serialización;
- validación de contenido;
- fronteras entre dominio, aplicación y simulación.

Estos puntos se resolverán al diseñar la arquitectura de la primera etapa.