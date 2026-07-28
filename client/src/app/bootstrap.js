const APP_ROOT_ID = 'app';

function createStatusView(documentRef) {
  const main = documentRef.createElement('main');
  main.className = 'foundation';

  const eyebrow = documentRef.createElement('p');
  eyebrow.className = 'foundation__eyebrow';
  eyebrow.textContent = 'Fundación del cliente';

  const title = documentRef.createElement('h1');
  title.textContent = 'Solo Adventuring';

  const status = documentRef.createElement('p');
  status.className = 'foundation__status';
  status.textContent = 'El cliente frontend está operativo.';

  main.append(eyebrow, title, status);
  return main;
}

export function bootstrap(documentRef = document) {
  const appRoot = documentRef.getElementById(APP_ROOT_ID);

  if (!appRoot) {
    throw new Error(`No se encontró el nodo raíz #${APP_ROOT_ID}.`);
  }

  appRoot.replaceChildren(createStatusView(documentRef));
}
