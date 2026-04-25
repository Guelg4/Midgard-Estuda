// ============================================================
// MIDGARD — script.js
// Firestore para checklist, materiais e ranking
// ============================================================
import { initializeApp }          from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut }
                                  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc,
  collection, addDoc, getDocs, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ─── CONFIG ───
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
const db   = getFirestore(app);

// ─── ESTADO GLOBAL ───
let currentUser     = null;
let checked         = {};
let materials       = [];
let subjectMats     = {};
let ranking         = [];
let selectedFilter  = 'all';
let matTypeFilter   = 'all';
let currentPanelSub = null;
let currentPanelTab = 'resumos';

// ─── MATÉRIAS ───
const SUBJECTS = [
  { id: 'arte',    name: 'Arte',               icon: '🎨' },
  { id: 'bio',     name: 'Biologia',            icon: '🧬' },
  { id: 'edf',     name: 'Educação Física',     icon: '🏃' },
  { id: 'fis',     name: 'Física',              icon: '⚡' },
  { id: 'geo',     name: 'Geografia',           icon: '🌎' },
  { id: 'hist',    name: 'História',            icon: '🏛' },
  { id: 'ing',     name: 'Língua Inglesa',      icon: '🌐' },
  { id: 'port',    name: 'Língua Portuguesa',   icon: '📖' },
  { id: 'mat',     name: 'Matemática',          icon: '📐' },
  { id: 'quim',    name: 'Química',             icon: '🧪' },
  { id: 'soc',     name: 'Sociologia',          icon: '💬' },
  { id: 'adm_fin', name: 'Adm. Financeira',     icon: '💰' },
  { id: 'mkt',     name: 'Marketing e Vendas',  icon: '📢' },
  { id: 'gp',      name: 'Gestão de Pessoas',   icon: '👥' },
  { id: 'gq',      name: 'Gestão de Qualidade', icon: '✅' },
  { id: 'log',     name: 'Logística',           icon: '🚚' },
];

// ─── TÓPICOS DO CHECKLIST ───
const TOPICS = {
  arte: [
    'Vanguardas europeias',
    'Movimentos artísticos do século XX',
  ],
  bio: [
    'Material genético',
    'Sistema ABO',
    'Fator Rh',
  ],
  edf: [
    'Ginásticas de Conscientização Corporal',
    'Práticas Corporais de Aventura',
  ],
  fis: [
    'Eletrostática',
    'Carga elétrica e processos de eletrização',
    'Lei de Coulomb',
    'Campo elétrico',
  ],
  geo: [
    'Labirinto da globalização',
    'Modelos econômicos: liberalismo, keynesianismo e neoliberalismo',
    'Globalização e desigualdade',
    'Fluxo de rede global e informação',
    'O Estado e a gestão do território brasileiro no séc. XXI',
  ],
  hist: [
    'República Velha',
    'República da Espada e República Oligárquica',
    'Era Vargas',
    'Imperialismo',
    'Neocolonialismo',
  ],
  ing: [
    'Simple Present',
    'Simple Future',
    'Present Perfect',
    'Interpretação de texto',
  ],
  port: [
    'Conjunção',
    'Ideia principal e secundária',
    'Pontuação',
    'Acentuação',
    'Crase',
    'Semana de Arte Moderna',
    'Vanguardas europeias',
    'Interpretação textual',
    'Redação',
  ],
  mat: [
    'Juros simples',
    'Juros compostos',
    'Logaritmo (LOG)',
    'Lei dos senos e cossenos',
  ],
  quim: [
    'NOX',
    'Equilíbrio químico',
    'Fichas de revisão para prova',
  ],
  soc: [
    'Movimento negro e cidadania',
    'Constituição de 1988 e participação popular',
    'Primavera Árabe',
    'Língua, cultura e identidade',
  ],
  adm_fin: [],
  mkt:     [],
  gp:      [],
  gq: [
    'Conceitos Fundamentais de Qualidade',
    'Perspectiva Histórica da Gestão da Qualidade',
    'Princípios da Gestão da Qualidade',
    'Dimensões da Qualidade',
    'Eficiência, Eficácia e Competitividade',
    'TQC – Total Quality Control',
    'TQM – Total Quality Management',
    'Ferramentas da Qualidade',
    'Sistema de Gestão da Qualidade (SGQ)',
    'Mudança de Comportamento Social, Cultural e Ambiental',
  ],
  log: [
    'Tipos de modais (vantagens, desvantagens e combinações)',
    'Cubagem de cargas, distribuição e equilíbrio de cargas',
    'Lei da balança',
    'Lei do tacógrafo',
  ],
};

const TYPE_LABELS = {
  resumo:    { label: '📄 Resumo',    icon: '📄', cls: 'type-resumo' },
  video:     { label: '▶ Vídeo',      icon: '▶',  cls: 'type-video' },
  exercicio: { label: '✏ Exercício',  icon: '✏',  cls: 'type-exercicio' },
  drive:     { label: '📁 Drive/PDF', icon: '📁', cls: 'type-drive' },
};

// ─── FIREBASE AUTH ───
onAuthStateChanged(auth, async user => {
  if (!user) { window.location.href = "login.html"; return; }
  currentUser = user;

  const nome = user.email.split("@")[0];
  document.getElementById("user-badge").textContent = "👤 " + nome;

  await loadChecked();
  await loadMaterials();
  await loadSubjectMaterials();
  await loadRanking();

  renderSubjects();
  renderMaterials();
  renderRanking();
  populateSubjectSelect();
});

// ─── LOGOUT ───
document.getElementById("logout-btn").addEventListener("click", () => {
  signOut(auth).then(() => window.location.href = "login.html");
});

// ─── TEMA ───
const themeBtn = document.getElementById('theme-toggle');
if (themeBtn) {
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    themeBtn.textContent = '☀️';
  }
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const light = document.body.classList.contains('light-mode');
    themeBtn.textContent = light ? '☀️' : '🌙';
    localStorage.setItem('theme', light ? 'light' : 'dark');
  });
}

// ============================================================
// FIRESTORE — CHECKLIST
// ============================================================
async function loadChecked() {
  const snap = await getDoc(doc(db, "users", currentUser.uid));
  checked = snap.exists() ? (snap.data().checked || {}) : {};
}

async function saveChecked() {
  await setDoc(doc(db, "users", currentUser.uid),
    { checked, email: currentUser.email }, { merge: true });
  // Atualiza pontuação no ranking automaticamente
  const pts = Object.values(checked).filter(Boolean).length;
  await setDoc(doc(db, "ranking", currentUser.uid), {
    name:   currentUser.email.split("@")[0],
    email:  currentUser.email,
    pts,
    manual: false,
  }, { merge: true });
}

// ============================================================
// FIRESTORE — MATERIAIS GERAIS
// ============================================================
async function loadMaterials() {
  const snap = await getDocs(collection(db, "materials"));
  materials = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function saveMaterial(mat) {
  const ref = await addDoc(collection(db, "materials"), mat);
  materials.push({ id: ref.id, ...mat });
}

async function deleteMaterial(id) {
  await deleteDoc(doc(db, "materials", id));
  materials = materials.filter(m => m.id !== id);
}

// ============================================================
// FIRESTORE — MATERIAIS POR MATÉRIA
// ============================================================
async function loadSubjectMaterials() {
  subjectMats = {};
  for (const s of SUBJECTS) {
    const snap = await getDocs(collection(db, "subjectMats", s.id, "items"));
    subjectMats[s.id] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
}

async function addSubjectMaterial(subId, mat) {
  const ref = await addDoc(collection(db, "subjectMats", subId, "items"), mat);
  if (!subjectMats[subId]) subjectMats[subId] = [];
  subjectMats[subId].push({ id: ref.id, ...mat });
}

async function deleteSubjectMaterial(subId, matId) {
  await deleteDoc(doc(db, "subjectMats", subId, "items", matId));
  subjectMats[subId] = subjectMats[subId].filter(m => m.id !== matId);
}

// ============================================================
// FIRESTORE — RANKING
// ============================================================
async function loadRanking() {
  const snap = await getDocs(collection(db, "ranking"));
  ranking = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ============================================================
// NAVEGAÇÃO
// ============================================================
window.showTab = function(tab, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  if (btn) btn.classList.add('active');
  if (tab === 'checklist') renderChecklist();
  if (tab === 'materiais') renderMaterials();
  if (tab === 'ranking')   renderRanking();
};

// ============================================================
// MATÉRIAS — GRID
// ============================================================
function getProgress(subId) {
  const topics = TOPICS[subId] || [];
  if (!topics.length) return 0;
  const done = topics.filter((_, i) => checked[subId + '_' + i]).length;
  return Math.round((done / topics.length) * 100);
}

function renderSubjects() {
  const grid = document.getElementById('subject-grid');
  grid.innerHTML = SUBJECTS.map(s => {
    const pct   = getProgress(s.id);
    const total = (TOPICS[s.id] || []).length;
    const done  = (TOPICS[s.id] || []).filter((_, i) => checked[s.id + '_' + i]).length;
    const mats  = (subjectMats[s.id] || []).length;
    return `<div class="subject-card" onclick="openPanel('${s.id}')">
      <div class="subject-icon">${s.icon}</div>
      <div class="subject-name">${s.name}</div>
      <div class="subject-count">${done}/${total} tópicos · ${mats} arquivos</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
  updateBadges();
}

function updateBadges() {
  let done = 0;
  SUBJECTS.forEach(s => (TOPICS[s.id]||[]).forEach((_,i) => { if (checked[s.id+'_'+i]) done++; }));
  document.getElementById('checked-badge').textContent = done + ' estudados';
}

// ============================================================
// PAINEL DE MATÉRIA
// ============================================================
window.openPanel = function(subId) {
  currentPanelSub = subId;
  const sub = SUBJECTS.find(s => s.id === subId);
  document.getElementById('panel-icon').textContent = sub.icon;
  document.getElementById('panel-name').textContent = sub.name;
  document.getElementById('subject-panel').classList.remove('hidden');
  document.querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.ptab')[0].classList.add('active');
  currentPanelTab = 'resumos';
  renderPanelBody();
};

window.closePanel = function() {
  document.getElementById('subject-panel').classList.add('hidden');
  currentPanelSub = null;
};

window.switchPanelTab = function(tab, btn) {
  document.querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentPanelTab = tab;
  renderPanelBody();
};

function renderPanelBody() {
  const body  = document.getElementById('panel-body');
  const items = (subjectMats[currentPanelSub] || []).filter(m => m.type === currentPanelTab);
  if (!items.length) {
    body.innerHTML = '<div class="empty">Nenhum material ainda. Adicione abaixo! ⬇</div>';
    return;
  }
  body.innerHTML = items.map(m => {
    const t    = TYPE_LABELS[m.type] || TYPE_LABELS.resumo;
    const link = m.link
      ? `<a href="${m.link}" target="_blank"><button class="material-btn">Abrir 🔗</button></a>`
      : '';
    return `<div class="material-item">
      <div class="material-icon ${t.cls}">${t.icon}</div>
      <div class="material-info">
        <div class="material-title">${m.title}</div>
        <div class="material-sub">${m.link ? m.link.slice(0,45)+(m.link.length>45?'…':'') : 'Sem link'}</div>
      </div>
      ${link}
      <button class="material-btn danger" onclick="removePanelMaterial('${m.id}')">Remover</button>
    </div>`;
  }).join('');
}

window.addPanelMaterial = async function() {
  const title = document.getElementById('pm-title').value.trim();
  const type  = document.getElementById('pm-type').value;
  const link  = document.getElementById('pm-link').value.trim();
  if (!title || !currentPanelSub) return;
  const mat = { title, type, link, addedBy: currentUser.email, createdAt: Date.now() };
  await addSubjectMaterial(currentPanelSub, mat);
  document.getElementById('pm-title').value = '';
  document.getElementById('pm-link').value  = '';
  renderPanelBody();
  renderSubjects();
};

window.removePanelMaterial = async function(matId) {
  await deleteSubjectMaterial(currentPanelSub, matId);
  renderPanelBody();
  renderSubjects();
};

// ============================================================
// CHECKLIST
// ============================================================
function renderChecklist() {
  const filters = document.getElementById('checklist-filters');
  const list    = document.getElementById('checklist-list');
  const allSubs = [{ id: 'all', name: 'Todas', icon: '' }, ...SUBJECTS];

  filters.innerHTML = allSubs.map(s =>
    `<button class="filter-btn ${selectedFilter===s.id?'active':''}" onclick="setFilter('${s.id}')">${s.icon} ${s.name}</button>`
  ).join('');

  const toShow = selectedFilter === 'all' ? SUBJECTS : SUBJECTS.filter(s => s.id === selectedFilter);
  let html = '';
  toShow.forEach(s => {
    (TOPICS[s.id]||[]).forEach((t, i) => {
      const key    = s.id + '_' + i;
      const isDone = !!checked[key];
      html += `<div class="checklist-item">
        <input type="checkbox" id="${key}" ${isDone?'checked':''} onchange="toggleCheck('${key}')">
        <label for="${key}" class="${isDone?'done':''}">${t}</label>
        <span class="tag">${s.icon} ${s.name}</span>
      </div>`;
    });
  });
  list.innerHTML = html || '<div class="empty">Nenhum tópico encontrado</div>';

  let total = 0, done = 0;
  SUBJECTS.forEach(s => (TOPICS[s.id]||[]).forEach((_,i) => {
    total++;
    if (checked[s.id+'_'+i]) done++;
  }));
  document.getElementById('total-topics').textContent = total;
  document.getElementById('done-topics').textContent  = done;
  document.getElementById('pct-topics').textContent   = total ? Math.round(done/total*100)+'%' : '0%';
}

window.setFilter = function(id) { selectedFilter = id; renderChecklist(); };

window.toggleCheck = async function(key) {
  checked[key] = !checked[key];
  await saveChecked();
  renderSubjects();
  renderChecklist();
  updateBadges();
  await loadRanking();
  renderRanking();
};

// ============================================================
// MATERIAIS GERAIS
// ============================================================
function populateSubjectSelect() {
  const sel = document.getElementById('mat-subject');
  if (!sel) return;
  sel.innerHTML = SUBJECTS.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('');
}

function renderMaterials() {
  populateSubjectSelect();
  const list   = document.getElementById('materials-list');
  const toShow = matTypeFilter === 'all' ? materials : materials.filter(m => m.type === matTypeFilter);
  if (!toShow.length) {
    list.innerHTML = '<div class="empty">Nenhum material encontrado. Adicione acima!</div>';
    return;
  }
  list.innerHTML = toShow.map(m => {
    const sub  = SUBJECTS.find(s => s.id === m.subject);
    const t    = TYPE_LABELS[m.type] || TYPE_LABELS.resumo;
    const link = m.link
      ? `<a href="${m.link}" target="_blank"><button class="material-btn">Abrir 🔗</button></a>`
      : '';
    return `<div class="material-item">
      <div class="material-icon ${t.cls}">${t.icon}</div>
      <div class="material-info">
        <div class="material-title">${m.title}</div>
        <div class="material-sub">${sub ? sub.icon+' '+sub.name : ''} ${m.link ? '· '+m.link.slice(0,35)+'…' : ''}</div>
      </div>
      <span class="material-tag">${t.label}</span>
      ${link}
      <button class="material-btn danger" onclick="removeMaterial('${m.id}')">Remover</button>
    </div>`;
  }).join('');
}

window.setMatFilter = function(type, btn) {
  matTypeFilter = type;
  document.querySelectorAll('#mat-type-filters .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMaterials();
};

window.addMaterial = async function() {
  const title   = document.getElementById('mat-title').value.trim();
  const link    = document.getElementById('mat-link').value.trim();
  const type    = document.getElementById('mat-type').value;
  const subject = document.getElementById('mat-subject').value;
  if (!title) return;
  const mat = { title, link, type, subject, addedBy: currentUser.email, createdAt: Date.now() };
  await saveMaterial(mat);
  document.getElementById('mat-title').value = '';
  document.getElementById('mat-link').value  = '';
  renderMaterials();
};

window.removeMaterial = async function(id) {
  await deleteMaterial(id);
  renderMaterials();
};

// ============================================================
// RANKING
// ============================================================
function renderRanking() {
  const sorted  = [...ranking].sort((a, b) => b.pts - a.pts);
  const medals  = ['🥇','🥈','🥉'];
  const classes = ['gold','silver','bronze'];

  document.getElementById('ranking-list').innerHTML = sorted.length
    ? sorted.map((r, i) => {
        const initials = (r.name || r.email || '?').split(/[\s@]/)[0].slice(0,2).toUpperCase();
        return `<div class="rank-item">
          <div class="rank-num ${classes[i]||''}">${medals[i]||(i+1)}</div>
          <div class="rank-avatar">${initials}</div>
          <div class="rank-info">
            <div class="rank-name">${r.name || r.email}</div>
            <div class="rank-sub">${r.email || 'pontuação acumulada'}</div>
          </div>
          <div class="rank-score">${r.pts} pts</div>
        </div>`;
      }).join('')
    : '<div class="empty">Nenhum aluno no ranking ainda.</div>';
}

window.addRankEntry = async function() {
  const raw = document.getElementById('rank-name').value.trim();
  const pts = parseInt(document.getElementById('rank-score').value) || 0;
  if (!raw) return;
  const isEmail = /\S+@\S+\.\S+/.test(raw);
  const entry = {
    name:   isEmail ? raw.split('@')[0] : raw,
    email:  isEmail ? raw : '',
    pts,
    manual: true,
  };
  const ref = await addDoc(collection(db, "ranking"), entry);
  ranking.push({ id: ref.id, ...entry });
  document.getElementById('rank-name').value  = '';
  document.getElementById('rank-score').value = '';
  renderRanking();
};