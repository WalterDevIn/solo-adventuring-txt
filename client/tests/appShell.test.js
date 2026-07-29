import assert from 'node:assert/strict';
import test from 'node:test';

import { createAppShell } from '../src/app/appShell.js';
import { createHashRouter, resolveRoute } from '../src/app/router.js';
import { initialRoute, routes } from '../src/app/routes.js';

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.attributes = new Map();
    this.children = [];
    this.dataset = {};
    this.focusCount = 0;
  }

  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  removeAttribute(name) { this.attributes.delete(name); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  focus() { this.focusCount += 1; }
}

const documentRef = { createElement: (tagName) => new FakeElement(tagName) };

function createWindow(hash = '') {
  const listeners = new Map();
  const location = {
    hash,
    replace(nextHash) {
      this.hash = nextHash;
      listeners.get('hashchange')?.();
    },
  };

  return {
    location,
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); },
    dispatchHashChange() { listeners.get('hashchange')?.(); },
  };
}

test('las rutas son cinco, únicas y comienzan en inicio', () => {
  assert.equal(routes.length, 5);
  assert.equal(new Set(routes.map((route) => route.hash)).size, 5);
  assert.equal(initialRoute.hash, '#/inicio');
  assert.deepEqual(
    routes.map((route) => route.hash),
    ['#/inicio', '#/creacion', '#/preparar-combate', '#/sala', '#/juego'],
  );
});

test('el router resuelve rutas conocidas y usa inicio como fallback', () => {
  assert.equal(resolveRoute('#/juego', routes), routes[4]);
  assert.equal(resolveRoute('', routes), initialRoute);
  assert.equal(resolveRoute('#/desconocida', routes), initialRoute);
});

test('el router redirige hashes inválidos y notifica cambios posteriores', () => {
  const windowRef = createWindow('#/desconocida');
  const calls = [];
  const router = createHashRouter({ routes, windowRef, onRouteChange: (...args) => calls.push(args) });

  router.start();
  assert.equal(windowRef.location.hash, '#/inicio');
  assert.equal(calls[0][0], initialRoute);
  assert.equal(calls[0][1].isInitial, true);

  windowRef.location.hash = '#/juego';
  windowRef.dispatchHashChange();
  assert.equal(calls.at(-1)[0], routes[4]);
  assert.equal(calls.at(-1)[1].isInitial, false);
});

test('el shell construye navegación, región principal y una ruta activa', () => {
  const shell = createAppShell({ documentRef, routes });
  const [header, main] = shell.element.children;
  const [, navigation] = header.children;

  assert.equal(header.tagName, 'header');
  assert.equal(navigation.tagName, 'nav');
  assert.equal(main.tagName, 'main');
  assert.equal(navigation.children.length, 5);
  assert.deepEqual(navigation.children.map((link) => link.href), routes.map((route) => route.hash));

  shell.renderRoute(routes[2], { isInitial: true });
  assert.equal(
    navigation.children.filter((link) => link.getAttribute('aria-current') === 'page').length,
    1,
  );
  assert.equal(main.children[0].children[0].textContent, 'Preparar combate');
  assert.equal(main.focusCount, 0);

  shell.renderRoute(routes[4]);
  assert.equal(navigation.children[4].getAttribute('aria-current'), 'page');
  assert.equal(main.children[0].children[0].textContent, 'Juego');
  assert.equal(main.focusCount, 1);
});

test('cada ruta produce una pantalla vacía diferenciada', () => {
  const titles = routes.map((route) => route.createScreen(documentRef).children[0].textContent);
  assert.deepEqual(titles, ['Inicio', 'Creación', 'Preparar combate', 'Sala multijugador', 'Juego']);
});

test('el proyecto conserva cero dependencias', async () => {
  const { readFile } = await import('node:fs/promises');
  const packageJson = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));

  assert.equal(packageJson.dependencies, undefined);
  assert.equal(packageJson.devDependencies, undefined);
});
