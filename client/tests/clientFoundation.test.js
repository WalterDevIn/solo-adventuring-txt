import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readProjectFile = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('el HTML define el montaje, los estilos y el punto de entrada modular', async () => {
  const html = await readProjectFile('client/public/index.html');
  const resetIndex = html.indexOf('href="../src/styles/reset.css"');
  const baseIndex = html.indexOf('href="../src/styles/base.css"');

  assert.match(html, /<div id="app"><\/div>/);
  assert.match(html, /<script type="module" src="\.\.\/src\/main\.js"><\/script>/);
  assert.ok(resetIndex >= 0, 'reset.css debe enlazarse desde el HTML');
  assert.ok(baseIndex >= 0, 'base.css debe enlazarse desde el HTML');
  assert.ok(resetIndex < baseIndex, 'reset.css debe cargarse antes que base.css');
});

test('main delega el montaje al bootstrap sin importar CSS', async () => {
  const main = await readProjectFile('client/src/main.js');

  assert.match(main, /import \{ bootstrap \} from ['"]\.\/app\/bootstrap\.js['"]/);
  assert.match(main, /bootstrap\(\)/);
  assert.doesNotMatch(main, /import\s+['"][^'"]+\.css['"]/);
});

test('la fundación no referencia archivos heredados de los prototipos', async () => {
  const files = await Promise.all([
    readProjectFile('client/public/index.html'),
    readProjectFile('client/src/main.js'),
    readProjectFile('client/src/app/bootstrap.js'),
  ]);
  const source = files.join('\n');

  for (const legacyFile of ['app.js', 'chat.css', 'setup.css', 'experience.css']) {
    assert.doesNotMatch(source, new RegExp(`(?:^|[/'"])${legacyFile.replace('.', '\\.')}(?:$|[?'\"])`));
  }
});
