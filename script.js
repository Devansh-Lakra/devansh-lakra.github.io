const messages = document.getElementById("messages");
const input = document.getElementById("userInput");

// Smooth scroll
function scrollToBottom() {
  messages.scrollTop = messages.scrollHeight;
}

function addMessage(text, sender) {
  const p = document.createElement("p");
  p.className = sender;
  p.innerHTML = text;
  messages.appendChild(p);
  scrollToBottom();
}

function showTyping() {
  const p = document.createElement("p");
  p.className = "bot";
  p.id = "typingIndicator";
  p.innerHTML = `<span class="typing"></span><span class="typing"></span><span class="typing"></span>`;
  messages.appendChild(p);
  scrollToBottom();
}

function removeTyping() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.remove();
}

async function ask() {
  const question = input.value.trim();
  if (!question) return;
  addMessage(question, "user");
  input.value = "";

  showTyping();

  try {
    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    const data = await res.json();
    removeTyping();

    if (data.answer) {
      typeAnswer(data.answer);
    } else {
      addMessage("Error: No answer received", "bot");
    }
  } catch (err) {
    removeTyping();
    addMessage("Error: Something went wrong", "bot");
    console.error(err);
  }
}

// Typing effect for bot answer
function typeAnswer(text) {
  const p = document.createElement("p");
  p.className = "bot";
  messages.appendChild(p);
  scrollToBottom();

  let i = 0;
  const speed = 20; // typing speed in ms
  function type() {
    if (i < text.length) {
      p.innerHTML += text[i];
      i++;
      scrollToBottom();
      setTimeout(type, speed);
    }
  }
  type();
}
