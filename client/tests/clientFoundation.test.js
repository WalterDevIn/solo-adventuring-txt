import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readProjectFile = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('el HTML define el montaje y carga el punto de entrada modular', async () => {
  const html = await readProjectFile('client/public/index.html');

  assert.match(html, /<div id="app"><\/div>/);
  assert.match(html, /<script type="module" src="\.\.\/src\/main\.js"><\/script>/);
});

test('main delega el montaje al bootstrap', async () => {
  const main = await readProjectFile('client/src/main.js');

  assert.match(main, /import \{ bootstrap \} from ['"]\.\/app\/bootstrap\.js['"]/);
  assert.match(main, /bootstrap\(\)/);
});

test('la fundación no referencia archivos heredados de los prototipos', async () => {
  const files = await Promise.all([
    readProjectFile('client/public/index.html'),
    readProjectFile('client/src/main.js'),
    readProjectFile('client/src/app/bootstrap.js'),
  ]);
  const source = files.join('\n');

  for (const legacyFile of ['app.js', 'chat.css', 'setup.css', 'experience.css']) {
    assert.doesNotMatch(source, new RegExp(`(?:^|[/'\"])${legacyFile.replace('.', '\\.')}(?:$|[?'\"])`));
  }
});
