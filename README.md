# Solo Adventuring TXT

Prototipo de interfaz para un RPG de texto de navegador.

## Rama `prototype/player-experience`

Esta rama contiene un prototipo exclusivamente visual y guionado para evaluar la experiencia del jugador antes de construir la simulación real.

El recorrido incluye:

- selección inicial de personaje y aventura;
- llegada a un asentamiento;
- conversación con un NPC;
- viaje e investigación;
- combate presentado dentro del flujo narrativo;
- recompensa, regreso y cambio del mundo durante la ausencia del jugador.

Las respuestas, tiradas, resultados y transiciones son predeterminadas. No representan reglas reales, IA, persistencia ni un servidor autoritativo.

La interfaz funciona como si consumiera resultados externos: recibe una intención compatible con la escena actual y avanza al siguiente bloque del guion. Su propósito es evaluar claridad, ritmo, orientación, presentación de consecuencias y sensación de mundo vivo.

## Ejecutar

No requiere instalación ni compilación. Abrir `index.html` directamente o iniciar el repositorio con Live Server.

## Controles

Cada escena muestra intenciones contextuales. Al seleccionar una sugerencia, esta se copia al campo de entrada; el jugador debe enviarla para avanzar.
