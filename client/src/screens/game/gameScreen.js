export function createGameScreen(documentRef = document) {
  const section = documentRef.createElement('section');
  section.className = 'empty-screen';

  const title = documentRef.createElement('h1');
  title.textContent = 'Juego';

  const description = documentRef.createElement('p');
  description.textContent = 'La experiencia narrativa principal se construirá en contratos posteriores.';

  section.append(title, description);
  return section;
}
