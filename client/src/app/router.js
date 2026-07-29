export function resolveRoute(hash, routes, fallbackRoute = routes[0]) {
  return routes.find((route) => route.hash === hash) ?? fallbackRoute;
}

export function createHashRouter({ routes, windowRef = window, onRouteChange }) {
  const fallbackRoute = routes[0];
  let hasRendered = false;

  function handleRouteChange() {
    const currentHash = windowRef.location.hash;
    const route = resolveRoute(currentHash, routes, fallbackRoute);

    if (currentHash !== route.hash) {
      windowRef.location.replace(route.hash);
      return;
    }

    onRouteChange(route, { isInitial: !hasRendered });
    hasRendered = true;
  }

  return {
    start() {
      windowRef.addEventListener('hashchange', handleRouteChange);
      handleRouteChange();
    },
    stop() {
      windowRef.removeEventListener('hashchange', handleRouteChange);
    },
  };
}
