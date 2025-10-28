// Cloud Chat Frontend (GitHub Pages + Firebase)
// Instrucciones:
// 1) Crea un proyecto en Firebase, habilita Authentication (Email/Password) y Firestore.
// 2) Copia tu configuración en firebaseConfig abajo.
// 3) Publica en GitHub Pages (solo archivos estáticos).

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, limit, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// === Pega aquí tu configuración de Firebase ===
const firebaseConfig = {
  apiKey: "AIzaSyDCT5wLUIn2dclMnEsjKKN0mTKJR3jiMKo",
  authDomain: "chatuan-7f6ca.firebaseapp.com",
  projectId: "chatuan-7f6ca",
  storageBucket: "chatuan-7f6ca.firebasestorage.app",
  messagingSenderId: "247139724411",
  appId: "1:247139724411:web:a0113eab8698427dd886de",
  measurementId: "G-QD2RNTELFS"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos del DOM
const authCard = document.getElementById("authCard");
const chatCard = document.getElementById("chatCard");
const userPanel = document.getElementById("userPanel");
const userName = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");

const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");
const authError = document.getElementById("authError");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const messagesEl = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const msgError = document.getElementById("msgError");

// Tabs comportamiento
tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
    authError.textContent = "";
  });
});

// Registro
registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.textContent = "";
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const pass = document.getElementById("regPass").value;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }
  } catch (err) {
    authError.textContent = prettifyAuthError(err);
  }
});

// Login
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.textContent = "";
  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPass").value;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    authError.textContent = prettifyAuthError(err);
  }
});

logoutBtn?.addEventListener("click", () => signOut(auth));

// Estado de autenticación
let unsubMessages = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    // UI
    authCard.classList.add("hidden");
    chatCard.classList.remove("hidden");
    userPanel.classList.remove("hidden");
    userName.textContent = user.displayName || user.email?.split("@")[0] || "Usuario";

    // Suscripción a mensajes
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"), limit(200));
    unsubMessages?.();
    unsubMessages = onSnapshot(q, (snapshot) => {
      // Render
      messagesEl.innerHTML = "";
      snapshot.forEach((doc) => {
        const data = doc.data();
        renderMessage({
          uid: data.uid,
          name: data.name,
          text: data.text,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        }, user.uid);
      });
      // Scroll al final
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });

  } else {
    // UI
    chatCard.classList.add("hidden");
    userPanel.classList.add("hidden");
    authCard.classList.remove("hidden");
    messagesEl.innerHTML = "";
    unsubMessages?.();
  }
});

// Enviar mensaje
messageForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgError.textContent = "";
  const text = messageInput.value.trim();
  if (!text) return;

  const user = auth.currentUser;
  if (!user) {
    msgError.textContent = "Debes iniciar sesión.";
    return;
  }

  try {
    await addDoc(collection(db, "messages"), {
      uid: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "Usuario",
      text: sanitize(text),
      createdAt: serverTimestamp()
    });
    messageInput.value = "";
    messageInput.focus();
  } catch (err) {
    msgError.textContent = "No se pudo enviar el mensaje. Intenta de nuevo.";
    console.error(err);
  }
});

// Utilidades
function sanitize(s){
  // Evita inyección básica en el render. Firestore escapará texto, pero mejor prevenir.
  return s.replace(/[&<>]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
}

function renderMessage({uid, name, text, createdAt}, myUid){
  const li = document.createElement("li");
  li.className = "msg" + (uid === myUid ? " me" : "");

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `${name} • ${formatTime(createdAt)}`;

  const body = document.createElement("div");
  body.className = "body";
  body.innerHTML = text; // ya sanitizado

  bubble.appendChild(meta);
  bubble.appendChild(body);
  li.appendChild(bubble);
  messagesEl.appendChild(li);
}

function formatTime(d){
  try{
    const date = (d instanceof Date) ? d : new Date(d);
    return date.toLocaleString();
  }catch{
    return "";
  }
}

function prettifyAuthError(err){
  const code = err?.code || "";
  if (code.includes("email-already-in-use")) return "Ese correo ya está en uso.";
  if (code.includes("invalid-email")) return "Correo inválido.";
  if (code.includes("weak-password")) return "La contraseña es muy débil (mínimo 6).";
  if (code.includes("invalid-credential") || code.includes("wrong-password")) return "Credenciales inválidas.";
  if (code.includes("user-not-found")) return "Usuario no encontrado.";
  return "Ocurrió un error. Intenta nuevamente.";
}
