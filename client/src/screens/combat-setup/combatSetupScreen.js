export function createCombatSetupScreen(documentRef = document) {
  const section = documentRef.createElement('section');
  section.className = 'empty-screen';

  const title = documentRef.createElement('h1');
  title.textContent = 'Preparar combate';

  const description = documentRef.createElement('p');
  description.textContent = 'La configuración visual de participantes y relaciones se implementará más adelante.';

  section.append(title, description);
  return section;
}
