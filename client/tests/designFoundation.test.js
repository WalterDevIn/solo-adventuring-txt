import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readProjectFile = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

const requiredTokens = [
  '--color-background',
  '--color-surface',
  '--color-surface-active',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-border-primary',
  '--color-border-subtle',
  '--color-fringe-red',
  '--color-fringe-blue',
  '--color-glow',
  '--font-family-primary',
  '--space-1',
  '--radius-small',
  '--transition-duration',
];

test('tokens.css declara la base visual semántica requerida', async () => {
  const tokens = await readProjectFile('client/src/styles/tokens.css');

  for (const token of requiredTokens) {
    assert.match(tokens, new RegExp(`${token}\\s*:`), `falta el token ${token}`);
  }
});

test('base.css consume tokens en el shell y sus estados interactivos', async () => {
  const base = await readProjectFile('client/src/styles/base.css');

  for (const selector of [
    'body',
    '#app',
    '.app-shell',
    '.app-header',
    '.app-identity',
    '.app-navigation',
    '.app-content',
    '.empty-screen',
  ]) {
    assert.match(base, new RegExp(selector.replace('.', '\\.') + '\\s*[{,]'));
  }

  assert.match(base, /var\(--color-background\)/);
  assert.match(base, /var\(--color-text-primary\)/);
  assert.match(base, /var\(--font-family-primary\)/);
  assert.match(base, /a\[aria-current="page"\]/);
  assert.match(base, /:focus-visible/);
  assert.match(base, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(base, /overflow\s*:\s*hidden/);
});

test('la ruta activa combina superficie, borde y énfasis tipográfico', async () => {
  const base = await readProjectFile('client/src/styles/base.css');
  const activeRule = base.match(/\.app-navigation a\[aria-current="page"\]\s*\{([^}]+)\}/s)?.[1] ?? '';

  assert.match(activeRule, /background:/);
  assert.match(activeRule, /border-color:/);
  assert.match(activeRule, /font-weight:/);
});

test('el proyecto conserva CSS nativo y cero dependencias', async () => {
  const main = await readProjectFile('client/src/main.js');
  const packageJson = JSON.parse(await readProjectFile('package.json'));

  assert.doesNotMatch(main, /\.css['"]/);
  assert.equal(packageJson.dependencies, undefined);
  assert.equal(packageJson.devDependencies, undefined);
});
