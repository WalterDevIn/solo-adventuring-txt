const commandForm = document.querySelector("#commandForm");
const commandInput = document.querySelector("#commandInput");
const outputRow = document.querySelector("#outputRow");
const outputText = document.querySelector("#outputText");

let typingTimer = null;
let revealToken = 0;

function typeText(text, token) {
  clearTimeout(typingTimer);
  outputText.textContent = "";
  outputText.classList.add("is-typing");

  let index = 0;

  function writeNextCharacter() {
    if (token !== revealToken) {
      return;
    }

    outputText.textContent += text[index];
    index += 1;

    if (index < text.length) {
      const character = text[index - 1];
      const delay = /[.,;:!?]/.test(character) ? 65 : 24;
      typingTimer = window.setTimeout(writeNextCharacter, delay);
      return;
    }

    outputText.classList.remove("is-typing");
  }

  if (text.length > 0) {
    typingTimer = window.setTimeout(writeNextCharacter, 110);
  }
}

function showOutput(text) {
  revealToken += 1;
  const token = revealToken;

  clearTimeout(typingTimer);
  outputText.textContent = "";
  outputText.classList.remove("is-typing");
  outputRow.hidden = false;

  outputRow.classList.remove("is-entering");
  void outputRow.offsetWidth;
  outputRow.classList.add("is-entering");

  const handleRevealEnd = (event) => {
    if (event.target !== outputRow || token !== revealToken) {
      return;
    }

    outputRow.removeEventListener("animationend", handleRevealEnd);
    typeText(text, token);
  };

  outputRow.addEventListener("animationend", handleRevealEnd);
}

commandForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const command = commandInput.value.trim();
  if (!command) {
    commandInput.focus();
    return;
  }

  showOutput(command);
  commandInput.value = "";
  commandInput.focus();
});

window.addEventListener("load", () => {
  commandInput.focus();
});