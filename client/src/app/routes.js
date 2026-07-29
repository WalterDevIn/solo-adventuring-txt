import { createCombatSetupScreen } from '../screens/combat-setup/combatSetupScreen.js';
import { createCreationScreen } from '../screens/creation/creationScreen.js';
import { createGameScreen } from '../screens/game/gameScreen.js';
import { createHomeScreen } from '../screens/home/homeScreen.js';
import { createMultiplayerScreen } from '../screens/multiplayer/multiplayerScreen.js';

export const routes = Object.freeze([
  { id: 'home', hash: '#/inicio', label: 'Inicio', createScreen: createHomeScreen },
  { id: 'creation', hash: '#/creacion', label: 'Creación', createScreen: createCreationScreen },
  {
    id: 'combat-setup',
    hash: '#/preparar-combate',
    label: 'Preparar combate',
    createScreen: createCombatSetupScreen,
  },
  { id: 'multiplayer', hash: '#/sala', label: 'Sala multijugador', createScreen: createMultiplayerScreen },
  { id: 'game', hash: '#/juego', label: 'Juego', createScreen: createGameScreen },
]);

export const initialRoute = routes[0];
