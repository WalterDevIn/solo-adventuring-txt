export function createAppShell({ documentRef = document, routes }) {
  const shell = documentRef.createElement('div');
  shell.className = 'app-shell';

  const header = documentRef.createElement('header');
  header.className = 'app-header';

  const identity = documentRef.createElement('a');
  identity.className = 'app-identity';
  identity.href = routes[0].hash;
  identity.textContent = 'Solo Adventuring';

  const navigation = documentRef.createElement('nav');
  navigation.className = 'app-navigation';
  navigation.setAttribute('aria-label', 'Navegación principal');

  const links = routes.map((route) => {
    const link = documentRef.createElement('a');
    link.href = route.hash;
    link.textContent = route.label;
    link.dataset.routeId = route.id;
    navigation.append(link);
    return link;
  });

  const main = documentRef.createElement('main');
  main.className = 'app-content';
  main.id = 'main-content';
  main.tabIndex = -1;

  header.append(identity, navigation);
  shell.append(header, main);

  function renderRoute(route, { isInitial = false } = {}) {
    for (const link of links) {
      if (link.dataset.routeId === route.id) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    }

    main.replaceChildren(route.createScreen(documentRef));

    if (!isInitial) {
      main.focus();
    }
  }

  return { element: shell, renderRoute };
}
