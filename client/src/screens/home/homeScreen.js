export function createHomeScreen(documentRef = document) {
  const section = documentRef.createElement('section');
  section.className = 'empty-screen';

  const title = documentRef.createElement('h1');
  title.textContent = 'Inicio';

  const description = documentRef.createElement('p');
  description.textContent = 'Esta sección reunirá el acceso principal al producto en contratos posteriores.';

  section.append(title, description);
  return section;
}
