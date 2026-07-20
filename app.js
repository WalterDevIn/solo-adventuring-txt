const commandForm = document.querySelector("#commandForm");
const commandInput = document.querySelector("#commandInput");
const outputRow = document.querySelector("#outputRow");
const outputText = document.querySelector("#outputText");

function showOutput(text) {
  outputText.textContent = text;
  outputRow.hidden = false;

  // Reinicia la animación incluso cuando ya existe una salida visible.
  outputRow.classList.remove("is-entering");
  void outputRow.offsetWidth;
  outputRow.classList.add("is-entering");
}

commandForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const command = commandInput.value.trim();
  if (!command) {
    commandInput.focus();
    return;
  }

  // Respuesta provisional: permite diseñar la interfaz antes del motor de juego.
  showOutput(command);
  commandInput.value = "";
  commandInput.focus();
});

window.addEventListener("load", () => {
  commandInput.focus();
});
