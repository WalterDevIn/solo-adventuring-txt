export function createMultiplayerScreen(documentRef = document) {
  const section = documentRef.createElement('section');
  section.className = 'empty-screen';

  const title = documentRef.createElement('h1');
  title.textContent = 'Sala multijugador';

  const description = documentRef.createElement('p');
  description.textContent = 'La sala y sus estados de preparación se implementarán en contratos posteriores.';

  section.append(title, description);
  return section;
}
