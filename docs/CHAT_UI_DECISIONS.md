# Decisiones de interfaz del chat narrativo

## Estado del documento

Este documento amplía `PRODUCT_DECISIONS.md` y registra las decisiones específicas sobre la pantalla de juego, las voces del chat, la presentación de mensajes, el highlight semántico, el input, las etiquetas y el layout.

No define todavía contratos de implementación ni estructuras técnicas cerradas.

---

# 1. Modelo general de interacción

La experiencia principal es un chat narrativo.

El flujo conceptual es:

```text
Una criatura emite una intención.
El mundo la resuelve.
El Dungeon Master narra el resultado.
El dado interviene como una voz independiente.
```

Este flujo aplica por igual a criaturas controladas por jugadores y a criaturas controladas por IA.

---

# 2. Voces visibles

Las voces principales del chat son:

```text
Criatura
Dungeon Master
Dado
Metacomando
Depuración
```

El foco visual de una intención debe estar en la criatura que actúa, no en el usuario que la controla.

Ejemplo:

```text
Penélope
Ataco al goblin.
```

Internamente puede conservarse también:

```text
usuario controlador: Walter
criatura: Penélope
texto original: "Ataco al goblin."
```

El usuario controlador puede mostrarse en el detalle expandido o en modo de depuración.

---

# 3. Intenciones de criaturas

Toda criatura actúa emitiendo una intención.

Una criatura controlada por IA sigue la misma lógica que una criatura controlada por un jugador:

```text
IA
→ genera intención
→ criatura emite intención
→ mundo resuelve
→ Dungeon Master narra
```

Las intenciones pueden tener visibilidad diferente según las reglas:

```text
visible para todos
visible para determinados jugadores
oculta
visible solo en depuración
```

La visibilidad de una intención pertenece al estado o reglas del juego, no debe ser una decisión improvisada del cliente.

Cuando una criatura actúa sin hablar, se muestran dos voces:

```text
Criatura
→ emite su intención

Dungeon Master
→ narra cómo el mundo la resolvió
```

---

# 4. Dungeon Master

El Dungeon Master es la voz del mundo y del sistema.

No es una criatura ni una entidad ECS.

Se utiliza para:

- narrar consecuencias;
- formular aclaraciones;
- expresar imposibilidades;
- informar cambios del mundo;
- responder consultas;
- presentar resultados no atribuibles a una criatura o dado;
- explicar reglas en contexto cuando sea necesario.

Regla visual:

```text
Si habla una criatura, habla la criatura.
Si se presenta una tirada, habla el dado.
Si no es una criatura ni un dado, habla el Dungeon Master.
```

---

# 5. Dado como voz independiente

El dado es una voz visible e independiente.

Representa la parte del resultado que no decide ni el jugador ni el Dungeon Master.

Ejemplo:

```text
Dado
1d20 + 5 → 17
```

Las tiradas son visibles y expandibles.

El detalle puede mostrar:

```text
1d20: 12
Fuerza: +3
Competencia: +2
Total: 17
```

Cuando existen tiradas enfrentadas, deben mostrarse juntas en la misma fila o bloque visual.

Ejemplo:

```text
Dado

Penélope    1d20 + 5 → 17
Goblin      1d20 + 2 → 13
```

---

# 6. Interpretación del comando

La interpretación normal del parser queda oculta para el jugador.

Ejemplo:

```text
Entrada:
Ataco.

Interpretación interna:
arma = arma equipada
objetivo = último objetivo válido
```

El jugador no espera un mensaje separado que explique cada inferencia normal.

La intención estructurada y sus causas deben quedar disponibles en:

```text
detalle técnico
modo de depuración
historial interno
```

Solo se expone una interpretación explícita cuando hace falta resolver una ambigüedad relevante.

---

# 7. Aclaraciones

Cuando una intención está incompleta, el input entra en un modo especial de aclaración.

Ejemplo:

```text
Penélope
Lo ataco.

Dungeon Master
¿Al goblin herido o al guardia?
```

La siguiente entrada puede completar la intención suspendida:

```text
Penélope
Al goblin.
```

También debe existir una forma de abandonar la intención anterior y emitir otra diferente.

La forma concreta todavía no está fijada, pero un metacomando como `/cancel` es una opción compatible.

El tiempo del juego no se detiene mientras se aclara.

---

# 8. Metacomandos

Los metacomandos se registran en el mismo historial cronológico que las demás entradas.

Ejemplo:

```text
Penélope
/stop time
```

Deben tener una apariencia especial para dejar claro que no son una intención ordinaria ni diálogo literal.

Pueden distinguirse mediante:

- prefijo visible;
- tipografía;
- borde;
- icono;
- etiqueta técnica;
- estilo propio.

Narrativamente siguen formando parte de la historia de la sesión.

---

# 9. Anatomía de un mensaje

Un mensaje puede contener:

```text
autor o voz
contenido principal
fragmentos semánticos
estado de presentación
acciones contextuales
contenido técnico expandible
```

No se mostrará la ronda dentro de cada mensaje.

La ronda, el turno o cualquier dato semejante podrá mostrarse más adelante mediante etiquetas o marcadores.

Cada mensaje relevante puede expandirse para mostrar:

- evento técnico;
- intención interpretada;
- tiradas;
- modificadores;
- reglas aplicadas;
- actor;
- objetivo;
- instrumento;
- efectos;
- causas de la decisión.

---

# 10. Highlight semántico

El highlight representa el tipo semántico del fragmento, no su relación táctica.

Tipos previstos:

```text
creature
player
item
spell
condition
action
roll
numeric-value
damage-type
resource
location futuro
time-reference futuro
```

Todas las criaturas utilizan el mismo color base.

No se asignan colores diferentes por:

```text
aliado
enemigo
controlado por mí
controlado por otro usuario
```

La relación podrá expresarse mediante otros recursos:

- icono;
- borde;
- indicador secundario;
- etiqueta;
- ficha emergente.

## Daño tipado

La cantidad de daño hereda el color de su tipo.

Ejemplo:

```text
6 de daño de fuego
```

El número `6` y el tipo `fuego` deben compartir el estilo semántico correspondiente.

Esto aplica también a otros tipos de daño.

---

# 11. Interacciones semánticas

Al tocar o pulsar una referencia semántica se abre una ficha breve flotante.

Aplicaciones iniciales:

```text
criatura
objeto
conjuro
condición
```

La ficha debe respetar la información que el jugador realmente conoce.

Al tocar una tirada se muestra su desglose completo.

Al tocar una condición se muestra:

```text
definición
efecto actual
duración conocida
origen
```

---

# 12. Temporalidad de mensajes

Existe una cola narrativa general porque el orden importa.

Secuencia típica:

```text
intención
→ tirada
→ reacción
→ resolución
→ narración
```

Los mensajes dependientes deben respetar ese orden.

Puede haber varios mensajes apareciendo al mismo tiempo cuando la situación lo exige.

Casos previstos:

- tiradas enfrentadas;
- reacciones simultáneas;
- mensajes que deben sentirse como si llegaran juntos;
- múltiples criaturas reaccionando;
- mensajes sin demora deliberada.

Los mensajes críticos podrían interrumpir la cola, por ejemplo una reacción disponible, pero esta decisión se confirmará al probar el ritmo real.

---

# 13. Typewriter y escritura simultánea

La aparición progresiva se usa para dar ritmo, suavidad y consumo temporal a la narración.

No todos los mensajes deben usar la misma velocidad ni la misma demora.

Algunos mensajes pueden no tener demora o aparecer agrupados.

El jugador puede comenzar a escribir mientras todavía se presentan mensajes anteriores.

Debe distinguirse:

```text
escribir
→ puede estar permitido

enviar
→ depende de si el juego acepta una intención en ese momento
```

La posibilidad de acelerar o saltar la presentación se deja preparada para una etapa posterior.

---

# 14. Input principal

El input principal es de una sola línea.

Decisiones acordadas:

```text
Enter envía
los metacomandos comienzan con /
no hay botones auxiliares de acciones
```

No se utilizarán botones visibles para:

```text
Atacar
Pasar
Cancelar
```

El placeholder puede variar según el contexto:

```text
¿Qué haces?
¿A quién te refieres?
Describe tu reacción.
Escribe un metacomando...
```

La criatura activa puede estar indicada mediante una etiqueta, aunque la narración también debe dejarlo claro.

---

# 15. Historial de comandos con flechas

Las teclas de flecha vertical permiten recorrer entradas anteriores del jugador.

Comportamiento esperado:

```text
↑
recupera la entrada anterior

↓
avanza hacia entradas más recientes
```

Ejemplo:

```text
1. Ataco al goblin.
2. Uso la poción.
3. Me alejo.
```

Pulsar `↑` recupera primero:

```text
Me alejo.
```

Otra pulsación recupera:

```text
Uso la poción.
```

Esta función aplica tanto a intenciones ordinarias como a metacomandos.

---

# 16. Ventana visible del historial

El output debe soportar una ventana visible de 20 mensajes y scroll.

La base de datos podrá conservar el historial completo aunque el cliente solo muestre una ventana limitada.

Todavía queda por definir:

- si los 20 elementos cuentan bloques completos o entradas individuales;
- si los mensajes antiguos se cargan al hacer scroll hacia arriba;
- si el journal será la única forma de consultar el historial completo.

---

# 17. Etiquetas y marcadores

Las etiquetas viven principalmente en una columna lateral derecha en escritorio.

También pueden existir como elementos flotantes.

Propiedades acordadas:

```text
visibles
reordenables
cerrables
actualizables en tiempo real
```

No se asume que pulsarlas produzca una acción.

Algunas podrán adquirir comportamiento propio en el futuro.

Se distinguen dos categorías.

## Etiquetas fijadas por el jugador

Ejemplos:

```text
Turno: Penélope
PG de Baobab: 8/12
Tiempo restante: 14 s
```

## Indicadores temporales del sistema

Ejemplos:

```text
Reacción disponible
Esperando aclaración
Otro jugador está actuando
Tiempo detenido
```

Los indicadores temporales pueden aparecer y desaparecer automáticamente.

---

# 18. Layout de escritorio

En escritorio, el chat ocupa la mayor parte de la pantalla y las etiquetas se ubican a la derecha.

```text
┌───────────────────────────────────────────────┐
│                                               │
│ chat narrativo                 etiquetas      │
│ chat narrativo                 etiquetas      │
│ chat narrativo                 etiquetas      │
│                                               │
├───────────────────────────────────────────────┤
│ input                                         │
└───────────────────────────────────────────────┘
```

Debe existir una columna lateral opcional.

Los detalles se abren superpuestos para no abandonar el chat.

---

# 19. Layout móvil

En móvil, el chat ocupa prácticamente toda la pantalla.

Las etiquetas y detalles deben resolverse mediante elementos flotantes, overlays, drawers u otra solución equivalente.

```text
┌───────────────────────────────┐
│ indicadores temporales        │
├───────────────────────────────┤
│                               │
│ chat narrativo                │
│                               │
├───────────────────────────────┤
│ input                         │
└───────────────────────────────┘
```

La forma definitiva de presentar etiquetas en móvil queda abierta a validación visual.

---

# 20. Modos de visualización del output

El output debe poder admitir más de un modo de visualización.

Modos conceptuales previstos:

```text
Modo narrativo
→ muestra lo necesario para jugar

Modo técnico
→ agrega tiradas y resultados mecánicos

Modo de depuración
→ agrega intenciones, eventos, decisiones, reglas y datos ocultos
```

No es necesario implementar todos los modos completos desde el inicio, pero el sistema de mensajes no debe asumir una única representación fija.

---

# 21. Decisiones todavía abiertas

Quedan abiertas para una etapa posterior:

1. Qué ocurre exactamente con el texto preparado cuando todavía no puede enviarse.
2. Cómo se cancela o reemplaza una intención durante una aclaración.
3. Cómo se cuentan los 20 mensajes visibles.
4. Cómo se recuperan mensajes antiguos.
5. Si los modos del output son globales o configurables por tipo de mensaje.
6. Si los mensajes críticos interrumpen siempre la cola.
7. La solución final para etiquetas en móvil.
8. La anchura y variantes concretas del output en cada modo de visualización.
