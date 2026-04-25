// ============================================================
// MIDGARD — login.js
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBTkMW6JOr6OJ67b-F-QnG5xhjMxJpzhkg",
  authDomain: "site-de-estudos-a4220.firebaseapp.com",
  projectId: "site-de-estudos-a4220",
  storageBucket: "site-de-estudos-a4220.firebasestorage.app",
  messagingSenderId: "817252796682",
  appId: "1:817252796682:web:2db240f2997fab71d1d2f3"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ─── REFS ───
const el = id => document.getElementById(id);

const emailInput    = () => el("email");
const passwordInput = () => el("password");
const loginBtn      = () => el("login-button");
const registerBtn   = () => el("register-button");
const recoveryBtn   = () => el("recovery-password-button");

// ─── VALIDAÇÃO ───
function validateEmail(v) { return /\S+@\S+\.\S+/.test(v); }

function isEmailValid()    { return validateEmail(emailInput().value.trim()); }
function isPasswordValid() { return passwordInput().value.length >= 6; }

window.onChangeEmail = function () {
  const v = emailInput().value.trim();
  el("email-required-error").style.display = !v ? "block" : "none";
  el("email-invalid-error").style.display  = (v && !validateEmail(v)) ? "block" : "none";
  toggleButtons();
};

window.onChangePassword = function () {
  const v = passwordInput().value;
  el("password-required-error").style.display = !v ? "block" : "none";
  toggleButtons();
};

function toggleButtons() {
  loginBtn().disabled    = !(isEmailValid() && isPasswordValid());
  recoveryBtn().disabled = !isEmailValid();
}

// ─── LOGIN ───
loginBtn().addEventListener("click", () => {
  signInWithEmailAndPassword(auth, emailInput().value.trim(), passwordInput().value)
    .then(() => { window.location.href = "index.html"; })
    .catch(err => {
      const msgs = {
        "auth/user-not-found":  "Usuário não encontrado.",
        "auth/wrong-password":  "Senha incorreta.",
        "auth/too-many-requests": "Muitas tentativas. Tente mais tarde."
      };
      alert(msgs[err.code] || "Erro: " + err.message);
    });
});

// ─── REGISTRO ───
registerBtn().addEventListener("click", () => {
  if (!isEmailValid() || !isPasswordValid()) {
    alert("Preencha um email válido e senha com mínimo 6 caracteres.");
    return;
  }
  createUserWithEmailAndPassword(auth, emailInput().value.trim(), passwordInput().value)
    .then(() => {
      alert("✅ Conta criada! Você já está logado.");
      window.location.href = "index.html";
    })
    .catch(err => {
      const msgs = { "auth/email-already-in-use": "Este email já está cadastrado." };
      alert(msgs[err.code] || "Erro: " + err.message);
    });
});

// ─── RECUPERAR SENHA ───
recoveryBtn().addEventListener("click", () => {
  sendPasswordResetEmail(auth, emailInput().value.trim())
    .then(() => alert("📧 Email de recuperação enviado! Verifique sua caixa de entrada."))
    .catch(() => alert("Erro ao enviar email. Verifique o endereço."));
});
