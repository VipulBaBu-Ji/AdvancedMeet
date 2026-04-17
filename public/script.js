const socket = io();

const input = document.getElementById("message");
const messages = document.getElementById("messages");
const typingDiv = document.getElementById("typing");
const chatControls = document.getElementById("chatControls");
const disconnectedUsers = document.getElementById("disconnectedUsers");
const languageSelect = document.getElementById("languageSelect");
const translationStatus = document.getElementById("translationStatus");
const sendButton = document.querySelector(".input button");
const leaveButton = document.querySelector(".leave-button");
const askAIButton = document.getElementById("askAIBtn");
const welcomePanel = document.getElementById("welcomePanel");
const topBar = document.querySelector(".topBar");
const pollPanel = document.getElementById("pollPanel");
const filePortal = document.getElementById("filePortal");
const portalStatus = document.getElementById("portalStatus");

let username = "";
let currentLanguage = "en";
let activePoll = null;
let currentTheme = localStorage.getItem('theme') || 'dark';

const translationMap = {
  es: {
    "File:": "Archivo:",
    "is typing...": "está escribiendo...",
    "Connected": "Conectado",
    "Global Chat Pro": "Chat Global Pro",
    "Send": "Enviar",
    "Leave Chat": "Salir",
    "Disconnect": "Desconectar",
    "Upload File": "Subir archivo",
    "Current: English": "Actual: Inglés",
    "Type message...": "Escribe un mensaje...",
    "Start Chat": "Iniciar chat",
    "Start Poll": "Iniciar encuesta",
    "Start File Sharing Portal": "Iniciar portal de archivos",
    "Ask AI": "Preguntar IA",
    "Disconnect": "Desconectar",
    "Share File": "Compartir archivo",
    "Create Poll": "Crear encuesta"
  },
  fr: {
    "File:": "Fichier:",
    "is typing...": "est en train d'écrire...",
    "Connected": "Connecté",
    "Global Chat Pro": "Chat Global Pro",
    "Send": "Envoyer",
    "Leave Chat": "Quitter",
    "Disconnect": "Déconnecter",
    "Upload File": "Téléverser",
    "Current: English": "Courant: Anglais",
    "Type message...": "Tapez un message...",
    "Start Chat": "Démarrer le chat",
    "Start Poll": "Démarrer un sondage",
    "Start File Sharing Portal": "Démarrer le portail de fichiers",
    "Ask AI": "Demander à l'IA",
    "Disconnect": "Déconnecter",
    "Share File": "Partager fichier",
    "Create Poll": "Créer un sondage"
  },
  de: {
    "File:": "Datei:",
    "is typing...": "schreibt...",
    "Connected": "Verbunden",
    "Global Chat Pro": "Globaler Chat Pro",
    "Send": "Senden",
    "Leave Chat": "Chat verlassen",
    "Disconnect": "Trennen",
    "Upload File": "Datei hochladen",
    "Current: English": "Aktuell: Englisch",
    "Type message...": "Nachricht eingeben...",
    "Start Chat": "Chat starten",
    "Start Poll": "Umfrage starten",
    "Start File Sharing Portal": "Dateifreigabe-Portal starten",
    "Ask AI": "KI fragen",
    "Disconnect": "Trennen",
    "Share File": "Datei teilen",
    "Create Poll": "Umfrage erstellen"
  }
};

function translateText(text, lang) {
  if (lang === "en") return text;
  const map = translationMap[lang] || {};
  return map[text] || text;
}

function updateLanguageUI() {
  currentLanguage = languageSelect.value;
  translationStatus.textContent = `Current: ${languageSelect.options[languageSelect.selectedIndex].text}`;
  sendButton.textContent = translateText("Send", currentLanguage);
  leaveButton.textContent = translateText("Disconnect", currentLanguage);
  if (askAIButton) askAIButton.textContent = translateText("Ask AI", currentLanguage);
  const messageInput = document.querySelector(".input input");
  messageInput.placeholder = translateText("Type message...", currentLanguage);
}

function ensureUser() {
  if (!username) {
    username = prompt("Enter your name");
    if (!username) return false;
    socket.emit("join", username);
  }
  return true;
}

function startChat() {
  if (!ensureUser()) return;
  activateChat();
}

function askAI() {
  if (!ensureUser()) return;
  activateChat();

  // Ask user to choose AI type
  const aiChoice = prompt("Choose AI: Type 'chatgpt' for ChatGPT or 'gemini' for Gemini AI:");
  if (!aiChoice) return;

  const aiType = aiChoice.toLowerCase().includes('gemini') ? 'gemini' : 'chatgpt';

  const question = prompt(`Ask ${aiType === 'gemini' ? 'Gemini AI' : 'ChatGPT'} a question:`);
  if (!question) return;

  // Display user's question in chat
  const userMsg = document.createElement("li");
  userMsg.className = "msg me";
  userMsg.innerHTML = `<b>${username}:</b> ${question}`;
  messages.appendChild(userMsg);

  socket.emit("askAI", { question, aiType });
}

function toggleTheme() {
  const body = document.body;
  const toggleBtn = document.getElementById('themeToggle');
  
  if (currentTheme === 'dark') {
    body.classList.add('light-theme');
    currentTheme = 'light';
    toggleBtn.textContent = '☀️ Light';
  } else {
    body.classList.remove('light-theme');
    currentTheme = 'dark';
    toggleBtn.textContent = '🌙 Dark';
  }
  
  localStorage.setItem('theme', currentTheme);
}

function activateChat() {
  welcomePanel.style.display = "none";
  topBar.style.display = "flex";
  chatControls.style.display = "flex";
  pollPanel.style.display = "none";
  filePortal.style.display = "none";
  messages.style.display = "block";
  typingDiv.style.display = "block";
  updateLanguageUI();
}

function startPoll() {
  if (!ensureUser()) return;
  welcomePanel.style.display = "none";
  topBar.style.display = "none";
  chatControls.style.display = "none";
  pollPanel.style.display = "block";
  filePortal.style.display = "none";
  messages.style.display = "none";
  typingDiv.style.display = "none";
}

function openFilePortal() {
  if (!ensureUser()) return;
  welcomePanel.style.display = "none";
  topBar.style.display = "none";
  chatControls.style.display = "none";
  filePortal.style.display = "block";
  pollPanel.style.display = "none";
  messages.style.display = "none";
  typingDiv.style.display = "none";
}

function updateFileDetails(file) {
  if (!file) {
    document.getElementById("fileName").textContent = "None";
    document.getElementById("fileType").textContent = "None";
    document.getElementById("fileSize").textContent = "0 KB";
    return;
  }

  document.getElementById("fileName").textContent = file.name;
  document.getElementById("fileType").textContent = file.type || "Unknown";
  document.getElementById("fileSize").textContent = `${(file.size / 1024).toFixed(2)} KB`;
}

function createPoll() {
  const question = document.getElementById("pollQuestion").value.trim();
  const options = [
    document.getElementById("pollOption1").value.trim(),
    document.getElementById("pollOption2").value.trim()
  ].filter(Boolean);

  if (!question || options.length < 2) {
    alert("Please enter a question and at least two options.");
    return;
  }

  activePoll = {
    question,
    options: options.map((text) => ({ text, votes: 0 }))
  };
  renderPoll();
}

function renderPoll() {
  const pollResults = document.getElementById("pollResults");
  pollResults.innerHTML = `
    <div class="poll-card">
      <strong>${activePoll.question}</strong>
      <div class="poll-options"></div>
    </div>
  `;

  const optionsContainer = pollResults.querySelector(".poll-options");
  activePoll.options.forEach((option, index) => {
    const optionEl = document.createElement("div");
    optionEl.className = "poll-option";
    optionEl.innerHTML = `
      <span>${option.text}</span>
      <button onclick="votePoll(${index})">Vote</button>
      <span class="vote-count">${option.votes} votes</span>
    `;
    optionsContainer.appendChild(optionEl);
  });
}

function votePoll(index) {
  activePoll.options[index].votes += 1;
  renderPoll();
}

function setLanguage() {
  updateLanguageUI();
}

function sendMessage() {
  const msg = input.value.trim();
  if (!msg) return;
  socket.emit("sendMessage", msg);
  input.value = "";
}

socket.on("message", (data) => {
  const li = document.createElement("li");
  if (typeof data === "string") {
    li.textContent = translateText(data, currentLanguage);
  } else {
    li.innerHTML = `
      <b>${data.user}:</b> ${translateText(data.text, currentLanguage)}
      <button onclick="react('${data.id}', '👍')">👍</button>
    `;
  }
  messages.appendChild(li);
});

socket.on("userDisconnected", (user) => {
  const li = document.createElement("li");
  li.textContent = user;
  disconnectedUsers.appendChild(li);
});

input.addEventListener("input", () => {
  if (!username) return;
  socket.emit("typing");
  setTimeout(() => socket.emit("stopTyping"), 1000);
});

socket.on("typing", (user) => {
  typingDiv.innerText = translateText(`${user} is typing...`, currentLanguage);
});

socket.on("stopTyping", () => {
  typingDiv.innerText = "";
});

function react(id, emoji) {
  socket.emit("react", { messageId: id, emoji });
}

socket.on("reactionUpdate", ({ messageId, emoji }) => {
  console.log("Reaction:", messageId, emoji);
});

async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/upload", { method: "POST", body: formData });
  const data = await res.json();
  socket.emit("sendMessage", `File: ${data.fileUrl}`);
}

async function uploadFilePortal() {
  const file = document.getElementById("fileInputPortal").files[0];
  if (!file) {
    portalStatus.textContent = "Please select a file first.";
    return;
  }
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/upload", { method: "POST", body: formData });
  const data = await res.json();
  portalStatus.textContent = `Shared: ${data.fileUrl}`;
  socket.emit("sendMessage", `File: ${data.fileUrl}`);
}

function leaveChat() {
  if (username) {
    const li = document.createElement("li");
    li.textContent = username;
    disconnectedUsers.appendChild(li);
    socket.emit("leave");
  }
  topBar.style.display = "none";
  chatControls.style.display = "none";
  pollPanel.style.display = "none";
  filePortal.style.display = "none";
  welcomePanel.style.display = "block";
  messages.style.display = "none";
  typingDiv.style.display = "none";
}

window.addEventListener("load", () => {
  topBar.style.display = "none";
  pollPanel.style.display = "none";
  filePortal.style.display = "none";
  messages.style.display = "none";
  typingDiv.style.display = "none";
  
  // Apply saved theme
  const toggleBtn = document.getElementById('themeToggle');
  if (currentTheme === 'light') {
    document.body.classList.add('light-theme');
    toggleBtn.textContent = '☀️ Light';
  } else {
    toggleBtn.textContent = '🌙 Dark';
  }
});