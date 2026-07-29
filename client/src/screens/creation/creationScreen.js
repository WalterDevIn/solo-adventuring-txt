export function createCreationScreen(documentRef = document) {
  const section = documentRef.createElement('section');
  section.className = 'empty-screen';

  const title = documentRef.createElement('h1');
  title.textContent = 'Creación';

  const description = documentRef.createElement('p');
  description.textContent = 'Los catálogos y editores de contenido se implementarán en contratos posteriores.';

  section.append(title, description);
  return section;
}
