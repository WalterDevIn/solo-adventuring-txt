import { createAppShell } from './appShell.js';
import { createHashRouter } from './router.js';
import { routes } from './routes.js';

const APP_ROOT_ID = 'app';

export function bootstrap(documentRef = document, windowRef = window) {
  const appRoot = documentRef.getElementById(APP_ROOT_ID);

  if (!appRoot) {
    throw new Error(`No se encontró el nodo raíz #${APP_ROOT_ID}.`);
  }

  const shell = createAppShell({ documentRef, routes });
  appRoot.replaceChildren(shell.element);

  const router = createHashRouter({
    routes,
    windowRef,
    onRouteChange: shell.renderRoute,
  });
  router.start();

  return router;
}
