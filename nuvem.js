// ============================================================
// NUVEM v2 — contas, perfil, campanhas e sincronização das fichas
// Carregado depois do script.js. Sem login o site continua
// funcionando só com o armazenamento do navegador.
// ============================================================
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut,
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query, where,
  onSnapshot, writeBatch, FieldPath, deleteField
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ------------------------------------------------------------
// Configuração
// ------------------------------------------------------------
const CONFIGURADO = !!(firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).includes('COLE'));
const LIMITE_FICHAS = 20;
const LIMITE_MESAS = 5;
const GLOBAL_KEYS = ['rpgCustomOrigins', 'rpgCustomTitans'];
const GM_KEYS = ['rpgGMTitans', 'rpgGMInitiative', 'rpgGMActiveBiomas', 'rpgGMPrimordialTitans', 'rpgGMHiddenSoldiers', 'rpgGMHiddenTitans'];
const LS = {
  uid: 'coordNuvemUid', known: 'coordNuvemConhecidas', pendState: 'coordNuvemPendente',
  pendChars: 'coordNuvemFichasPendentes', slot: 'coordNuvemSlot'
};
const CHUNK = 350000;
const MAX_IMG = 150000;
const MAX_DOC = 950000;
const AVATARES = ['⚔️', '🛡️', '🗡️', '🏹', '🐎', '🔥', '🌙', '⭐', '🦅', '🐺', '💀', '👁️', '🧭', '🎲', '🪖', '🌲'];

// ------------------------------------------------------------
// Estado
// ------------------------------------------------------------
let auth, db;
let user = null, perfil = null;
let ready = false, carregando = false, status = 'off', suppress = false;
const base = new Map();       // docId -> { chave: stringJSON }  (última versão conhecida do servidor)
const baseMeta = new Map();   // docId -> campos de topo (mesaId, mesaGm, ownerName, name)
const legacy = new Set();     // documentos ainda no formato antigo (v1)
let slot = localStorage.getItem(LS.slot) || '';   // campanha cujo escudo está carregado ('' = avulso)
const cloudState = new Map(); // nome (chave ou chave@campanha) -> string
const stateChunks = {};
const dirtyState = new Set(safeParse(localStorage.getItem(LS.pendState), []));
const pendingValues = new Map();
let stateTimer = null, charsTimer = null;
let charsDirty = localStorage.getItem(LS.pendChars) === '1';
let pushing = false, pushAgain = false;
let unsubOwn = null, unsubChars = null, unsubMembros = null;
let minhasMesas = [];
let participacoes = [];
let participacoesOk = false;
let campanhaAberta = null;    // { id, papel: 'gm' | 'jogador' }
let membros = new Map();
const pool = new Map();       // fichas dos jogadores da campanha aberta (visão do mestre)
let voltarPara = null;
let pendingSheetRefresh = null;
let criandoConta = false;
let saindo = false;

// ------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------
function safeParse(s, d) { try { return s == null ? d : JSON.parse(s); } catch (e) { return d; } }
const origSetItem = Storage.prototype.setItem;
function lsSet(k, v) { suppress = true; try { origSetItem.call(localStorage, k, v); } finally { suppress = false; } }
function ownChars() { return characters.filter(c => !c._remote); }
function docIdDe(ch) { return user.uid + '_' + ch.id; }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function avisar(t, m, erro) { if (typeof showNotification === 'function') showNotification(t, m || '', !!erro); }
function isVisible(id) { const el = document.getElementById(id); return !!el && !el.classList.contains('hidden'); }
function el(id) { return document.getElementById(id); }
function normCodigo(s) { return String(s || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function erroTexto(e) {
  const c = e && e.code || '';
  const mapa = {
    'permission-denied': 'Sem permissão. Confira se as regras do Firestore foram publicadas.',
    'unavailable': 'Sem conexão com o servidor. Tente de novo em instantes.',
    'resource-exhausted': 'A cota gratuita do dia acabou. Volta ao normal amanhã.',
    'auth/unauthorized-domain': 'Este domínio não está autorizado no Firebase (Authentication > Configurações > Domínios autorizados).',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/email-already-in-use': 'Já existe uma conta com esse e-mail. Use "Entrar" (ou "Entrar com Google", se ela foi criada assim).',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Espere um pouco e tente de novo.',
    'auth/operation-not-allowed': 'Login por e-mail ainda não foi ativado no Firebase (Authentication > Método de login > E-mail/senha).',
    'auth/network-request-failed': 'Sem conexão com a internet.',
    'auth/missing-password': 'Digite a senha.'
  };
  return mapa[c] || esc(e && (e.code || e.message) || 'Erro desconhecido');
}
function savePendState() { lsSet(LS.pendState, JSON.stringify([...dirtyState])); }
function setStatus(s) { status = s; renderConta(); }
function nomeEstado(key) { return GM_KEYS.includes(key) && slot ? `${key}@${slot}` : key; }

function avatarHtml(p, cls = '') {
  if (!p) return `<span class="nv-avatar ${cls}">?</span>`;
  if (p.avatar === 'foto' && p.foto) return `<img class="nv-avatar ${cls}" src="${esc(p.foto)}" alt="" referrerpolicy="no-referrer" />`;
  if (p.avatar && p.avatar !== 'foto') return `<span class="nv-avatar ${cls}">${esc(p.avatar)}</span>`;
  return `<span class="nv-avatar ${cls}">${esc((p.nome || '?').trim().charAt(0).toUpperCase())}</span>`;
}

// ------------------------------------------------------------
// Compressão de imagens (cabem no limite do Firestore e do navegador)
// ------------------------------------------------------------
const shrinkCache = new Map();
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
async function shrink(dataUrl) {
  if (shrinkCache.has(dataUrl)) return shrinkCache.get(dataUrl);
  let out = dataUrl;
  try {
    const img = await loadImg(dataUrl);
    const s = Math.min(1, 640 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    let r = c.toDataURL('image/webp', 0.8);
    if (!r.startsWith('data:image/webp')) r = c.toDataURL('image/jpeg', 0.82);
    if (r.length < dataUrl.length) out = r;
  } catch (e) { /* mantém a original */ }
  shrinkCache.set(dataUrl, out); shrinkCache.set(out, out);
  return out;
}
async function compressImagesIn(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 10) return;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'string') {
      if (v.length > MAX_IMG && v.startsWith('data:image/') && !v.startsWith('data:image/gif') && !v.startsWith('data:image/svg')) obj[k] = await shrink(v);
    } else if (v && typeof v === 'object') await compressImagesIn(v, depth + 1);
  }
}

// ------------------------------------------------------------
// Fichas: cada campo de primeiro nível é salvo separado, assim o
// mestre mexendo no PDV não apaga o que o jogador mudou no inventário.
// ------------------------------------------------------------
function toKeys(ch) {
  const o = {};
  for (const k of Object.keys(ch)) {
    if (k.startsWith('_')) continue;
    const v = ch[k];
    if (v === undefined || typeof v === 'function') continue;
    o[k] = JSON.stringify(v);
  }
  return o;
}
function fromKeys(R) { const o = {}; for (const k in R) { const v = safeParse(R[k], undefined); if (v !== undefined) o[k] = v; } return o; }
function readRemote(x) {
  if (x && x.d && typeof x.d === 'object') return { R: x.d, lg: false };
  if (x && typeof x.data === 'string') { const o = safeParse(x.data, null); if (o) return { R: toKeys(o), lg: true }; }
  return { R: {}, lg: !!(x && x.data) };
}
function metaDoc(x) { return { mesaId: x.mesaId || '', mesaGm: x.mesaGm || '', ownerName: x.ownerName || '', name: x.name || '' }; }
function sameKeys(a, b) {
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
}
function isObj(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
function merge3(b, l, r) {
  const sb = JSON.stringify(b), sl = JSON.stringify(l), sr = JSON.stringify(r);
  if (sr === sb) return l;
  if (sl === sb) return r;
  if (sl === sr) return l;
  if (isObj(b) && isObj(l) && isObj(r)) {
    const out = {};
    for (const k of new Set([...Object.keys(b), ...Object.keys(l), ...Object.keys(r)])) {
      const v = merge3(b[k], l[k], r[k]);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  return l; // conflito no mesmo valor: vale o que foi feito aqui
}
// Junta a versão do servidor (R) com a local, usando a base (B) como referência.
// Altera o objeto no lugar. Devolve true se ainda sobrou mudança local para enviar.
function aplicarRemoto(obj, R, B) {
  const L = toKeys(obj);
  let pendente = false;
  for (const k of new Set([...Object.keys(R), ...Object.keys(L), ...(B ? Object.keys(B) : [])])) {
    const r = R[k], l = L[k], b = B ? B[k] : undefined;
    let fim;
    if (!B) fim = r;
    else if (r === b) fim = l;
    else if (l === b) fim = r;
    else if (l === r) fim = l;
    else { const m = merge3(safeParse(b, undefined), safeParse(l, undefined), safeParse(r, undefined)); fim = m === undefined ? undefined : JSON.stringify(m); }
    if (fim !== l) { if (fim === undefined) delete obj[k]; else obj[k] = JSON.parse(fim); }
    if (fim !== r) pendente = true;
  }
  return pendente;
}

function salvarLocal() { try { lsSet('rpgChars', JSON.stringify(ownChars())); } catch (e) { /* navegador cheio: a nuvem guarda */ } }
function marcarFichasPendentes(v) { charsDirty = v; lsSet(LS.pendChars, v ? '1' : '0'); }
function agendarPush(ms = 1000) {
  if (!user || !ready) return;
  setStatus('saving');
  clearTimeout(charsTimer); charsTimer = setTimeout(pushChars, ms);
}
function saveKnown() { lsSet(LS.known, JSON.stringify(ownChars().filter(c => base.has(docIdDe(c))).map(c => c.id))); }

// Tira marcas de "ficha de outro jogador" de cópias (duplicar/importar)
function limparCopias() {
  for (const c of characters) {
    if (c._remote && pool.get(c._docId) !== c) {
      for (const k of Object.keys(c)) if (k.startsWith('_')) delete c[k];
      delete c.mesaCode; delete c.mesaGm; delete c.mesaNome; delete c.mesaGmNome;
    }
  }
}

// ------------------------------------------------------------
// Interceptar os salvamentos do site
// ------------------------------------------------------------
Storage.prototype.setItem = function (k, v) {
  origSetItem.call(this, k, v);
  if (this !== window.localStorage || suppress || !user) return;
  if (GLOBAL_KEYS.includes(k) || GM_KEYS.includes(k)) marcarEstado(nomeEstado(k), v, true);
};
function marcarEstado(nome, v, agendar) {
  dirtyState.add(nome); pendingValues.set(nome, v); savePendState();
  if (agendar && ready) { clearTimeout(stateTimer); stateTimer = setTimeout(pushState, 1500); setStatus('saving'); }
}

window.saveChars = function () {
  limparCopias();
  try { lsSet('rpgChars', JSON.stringify(ownChars())); }
  catch (e) {
    if (!user) { avisar('O navegador ficou sem espaço', 'Entre com uma conta para salvar na nuvem, ou use imagens menores.', true); throw e; }
  }
  if (user) { marcarFichasPendentes(true); agendarPush(); }
};

// Lista "Soldados": mostra só as suas fichas, com contador e aviso de carregamento
const origRenderCharList = window.renderCharList;
window.renderCharList = function () {
  const all = characters;
  characters = all.filter(c => !c._remote);
  try { origRenderCharList(); } finally { characters = all; }
  const n = all.filter(c => !c._remote).length;
  const badge = el('nuvemFichaCount');
  if (badge) { badge.textContent = `${n}/${LIMITE_FICHAS}`; badge.classList.toggle('cheio', n >= LIMITE_FICHAS); }
  if (carregando && n === 0) {
    const list = el('charList');
    if (list) list.innerHTML = '<p class="nv-carregando">Carregando suas fichas da nuvem…</p>';
  }
};

const origOpenChar = window.openChar;
window.openChar = function (id) { origOpenChar(id); renderSheetMesa(); };

const origGoToMainMenu = window.goToMainMenu;
window.goToMainMenu = function () { voltarPara = null; origGoToMainMenu(); };

const origOpenEscudo = window.openEscudoDoMestre;
window.openEscudoDoMestre = function () {
  origOpenEscudo();
  const tab = document.querySelector('[data-escudo-tab="escudoJogadores"]');
  if (campanhaAberta && campanhaAberta.papel === 'gm') {
    tab && tab.classList.remove('hidden');
    tab && switchEscudoTab('escudoJogadores', tab);
    renderJogadoresGM();
  } else {
    tab && tab.classList.add('hidden');
    const enc = document.querySelector('[data-escudo-tab="escudoEncontro"]');
    enc && switchEscudoTab('escudoEncontro', enc);
  }
  renderCabecalhoEscudo();
};

const origEnterCatalog = window.enterCatalog;
window.enterCatalog = function (nome) {
  if (nome === 'campanhas') { abrirCampanhas(); return; }
  if (nome === 'escudo') { campanhaAberta = null; }
  origEnterCatalog(nome);
};

// Limite de fichas
function podeCriarFicha() {
  if (ownChars().length >= LIMITE_FICHAS) {
    avisar('Limite de fichas atingido', `Cada conta pode ter até ${LIMITE_FICHAS} fichas. Exclua uma para criar outra.`, true);
    return false;
  }
  return true;
}
const btnNew = el('btnNewChar');
btnNew && btnNew.addEventListener('click', e => { if (!podeCriarFicha()) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
const btnImp = el('btnImport');
btnImp && btnImp.addEventListener('click', e => { if (!podeCriarFicha()) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
const origImport = window.importChar;
window.importChar = function (file) { if (!podeCriarFicha()) return; origImport(file); };
const origDuplicate = window.duplicateChar;
window.duplicateChar = function (id) {
  const orig = characters.find(c => c.id === id);
  if (orig && orig._remote) { avisar('Não dá para duplicar aqui', 'Esta ficha é de um jogador da sua campanha.', true); return; }
  if (!podeCriarFicha()) return;
  const antes = new Set(characters.map(c => c.id));
  origDuplicate(id);
  const nova = characters.find(c => !antes.has(c.id));
  if (nova && nova.mesaCode) { delete nova.mesaCode; delete nova.mesaGm; delete nova.mesaNome; delete nova.mesaGmNome; window.saveChars(); }
};
const btnDel = el('btnDelete');
btnDel && btnDel.addEventListener('click', e => {
  const ch = typeof getCurrentChar === 'function' ? getCurrentChar() : null;
  if (ch && ch._remote) { e.stopImmediatePropagation(); avisar('Só o dono pode excluir', 'Para tirar a ficha da campanha, use o botão na aba Jogadores.', true); }
}, true);
const btnDup = el('btnDuplicate');
btnDup && btnDup.addEventListener('click', e => {
  const ch = typeof getCurrentChar === 'function' ? getCurrentChar() : null;
  if (ch && ch._remote) { e.stopImmediatePropagation(); avisar('Não dá para duplicar aqui', 'Esta ficha é de um jogador da sua campanha.', true); }
}, true);

// Voltar da ficha para a campanha de onde ela foi aberta
const btnBack = el('btnBackHeader');
btnBack && btnBack.addEventListener('click', e => {
  if (!voltarPara || !isVisible('screenSheet')) return;
  e.stopImmediatePropagation();
  const destino = voltarPara; voltarPara = null;
  currentCharId = null;
  if (destino === 'gm' && campanhaAberta) window.openEscudoDoMestre();
  else if (destino === 'jogador' && campanhaAberta) abrirCampanhaJogador(campanhaAberta.id);
  else window.showHome();
}, true);

// Salva na hora quando a pessoa troca de aba ou fecha
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && ready && user) {
    if (charsDirty) { clearTimeout(charsTimer); pushChars(); }
    if (dirtyState.size) { clearTimeout(stateTimer); pushState(); }
  }
});
window.addEventListener('offline', () => { if (user) setStatus('offline'); });
window.addEventListener('online', () => { if (user) { setStatus('saving'); if (charsDirty) pushChars(); if (dirtyState.size) pushState(); else setStatus('ok'); } });
window.addEventListener('beforeunload', e => {
  if (user && ready && (charsDirty || dirtyState.size || pushing)) {
    if (charsDirty) pushChars();
    if (dirtyState.size) pushState();
    e.preventDefault(); e.returnValue = '';
  }
});

// ------------------------------------------------------------
// Envio das fichas
// ------------------------------------------------------------
function metaDe(ch) {
  if (ch._remote) return { mesaId: ch.mesaCode || '', mesaGm: ch.mesaGm || '' };
  return { mesaId: ch.mesaCode || '', mesaGm: ch.mesaGm || '', ownerName: (perfil && perfil.nome) || '', name: ch.name || '' };
}

async function pushChars() {
  if (!user || !ready) return;
  if (pushing) { pushAgain = true; return; }
  pushing = true;
  marcarFichasPendentes(false);
  let erro = false;
  try {
    // fichas de campanhas das quais o jogador saiu/foi removido
    if (participacoesOk) {
      const validas = new Set(participacoes.filter(p => !p.removida).map(p => p.id));
      for (const ch of ownChars()) if (ch.mesaCode && !validas.has(ch.mesaCode) && ch.mesaGm !== user.uid) {
        delete ch.mesaCode; delete ch.mesaGm; delete ch.mesaNome; delete ch.mesaGmNome;
      }
    }
    const vistos = new Set();
    for (const ch of [...characters]) {
      const remoto = !!ch._remote;
      const id = remoto ? ch._docId : docIdDe(ch);
      vistos.add(id);
      if (remoto && pool.get(id) !== ch) continue;
      await compressImagesIn(ch);
      const L = toKeys(ch);
      let tamanho = 0; for (const k in L) tamanho += L[k].length + k.length;
      if (tamanho > MAX_DOC) {
        erro = true;
        avisar('Ficha grande demais para a nuvem', `"${esc(ch.name)}" passou de 1 MB. Use menos imagens ou imagens menores.`, true);
        continue;
      }
      const B = base.get(id);
      const meta = metaDe(ch);
      const ref = doc(db, 'chars', id);

      if (!B || legacy.has(id)) {
        if (remoto && !B) continue;
        const velhaB = B, velhaM = baseMeta.get(id), eraLegacy = legacy.has(id);
        base.set(id, L); legacy.delete(id);
        const full = remoto
          ? { owner: ch._owner, ownerName: ch._ownerName || '', name: ch.name || '', ...meta }
          : { owner: user.uid, ...meta };
        baseMeta.set(id, metaDoc(full));
        try { await setDoc(ref, { ...full, v: 2, updatedAt: Date.now(), d: L }); }
        catch (e) {
          if (velhaB) base.set(id, velhaB); else base.delete(id);
          if (velhaM) baseMeta.set(id, velhaM); else baseMeta.delete(id);
          if (eraLegacy) legacy.add(id);
          erro = true; console.error(e); avisar('Erro ao salvar na nuvem', erroTexto(e), true);
        }
        continue;
      }

      const args = ['updatedAt', Date.now()];
      let mudou = false;
      for (const k in L) if (L[k] !== B[k]) { args.push(new FieldPath('d', k), L[k]); mudou = true; }
      for (const k in B) if (!(k in L)) { args.push(new FieldPath('d', k), deleteField()); mudou = true; }
      const velhaM = baseMeta.get(id) || {};
      const novaM = { ...velhaM };
      for (const [k, v] of Object.entries(meta)) if (velhaM[k] !== v) { args.push(k, v); novaM[k] = v; mudou = true; }
      if (!mudou) continue;
      base.set(id, L); baseMeta.set(id, novaM);
      try { await updateDoc(ref, ...args); }
      catch (e) {
        base.set(id, B); baseMeta.set(id, velhaM);
        if (e.code === 'not-found' && !remoto) { base.delete(id); pushAgain = true; }
        else if (e.code === 'not-found' && remoto) { pool.delete(id); sincronizarPool(); }
        else { erro = true; console.error(e); avisar('Erro ao salvar na nuvem', erroTexto(e), true); }
      }
    }
    // fichas excluídas
    for (const id of [...base.keys()]) {
      if (id.startsWith(user.uid + '_') && !vistos.has(id)) {
        const B = base.get(id); base.delete(id);
        try { await deleteDoc(doc(db, 'chars', id)); }
        catch (e) { base.set(id, B); erro = true; console.error(e); }
      }
    }
    salvarLocal();
    saveKnown();
  } finally {
    pushing = false;
    if (erro) marcarFichasPendentes(true);
    if (pushAgain) { pushAgain = false; pushChars(); }
    else setStatus(!navigator.onLine ? 'offline' : erro ? 'error' : (dirtyState.size || charsDirty) ? 'saving' : 'ok');
  }
}

// ------------------------------------------------------------
// Escudo do mestre / conteúdo customizado (dividido em pedaços)
// ------------------------------------------------------------
async function writeStateKey(nome, raw) {
  const parts = [];
  for (let i = 0; i < raw.length; i += CHUNK) parts.push(raw.slice(i, i + CHUNK));
  if (!parts.length) parts.push('');
  const v = Date.now();
  const batch = writeBatch(db);
  parts.forEach((s, i) => batch.set(doc(db, 'users', user.uid, 'state', `${nome}__${i}`), { key: nome, i, n: parts.length, v, s }));
  const old = stateChunks[nome] || 0;
  for (let i = parts.length; i < old; i++) batch.delete(doc(db, 'users', user.uid, 'state', `${nome}__${i}`));
  await batch.commit();
  stateChunks[nome] = parts.length;
}

async function pushState() {
  if (!user || !ready) return;
  let erro = false;
  for (const nome of [...dirtyState]) {
    const original = pendingValues.get(nome);
    if (original == null) { dirtyState.delete(nome); continue; }
    let raw = original;
    try { const o = JSON.parse(raw); await compressImagesIn(o); raw = JSON.stringify(o); } catch (e) { }
    try {
      await writeStateKey(nome, raw);
      cloudState.set(nome, raw);
      if (pendingValues.get(nome) === original) { dirtyState.delete(nome); pendingValues.delete(nome); }
    } catch (e) { erro = true; console.error(e); avisar('Erro ao salvar o escudo na nuvem', erroTexto(e), true); }
  }
  savePendState();
  setStatus(erro ? 'error' : (charsDirty || pushing) ? 'saving' : 'ok');
}

async function readCloudState() {
  const snap = await getDocs(collection(db, 'users', user.uid, 'state'));
  const byKey = {};
  snap.forEach(d => { const x = d.data(); if (x && x.key != null) (byKey[x.key] ||= []).push(x); });
  const out = {};
  for (const [key, arr] of Object.entries(byKey)) {
    stateChunks[key] = Math.max(...arr.map(a => a.i)) + 1;
    const head = arr.find(a => a.i === 0); if (!head) continue;
    const parts = arr.filter(a => a.v === head.v).sort((a, b) => a.i - b.i);
    if (parts.length !== head.n) continue;
    out[key] = parts.map(p => p.s).join('');
  }
  return out;
}

function applyState(key, str) {
  lsSet(key, str);
  const val = safeParse(str, []);
  switch (key) {
    case 'rpgCustomOrigins': customOrigins = val; break;
    case 'rpgCustomTitans': customTitans = val; break;
    case 'rpgGMTitans': gmTitans = val; break;
    case 'rpgGMInitiative': gmInitiative = val; break;
    case 'rpgGMActiveBiomas': gmActiveBiomaIds = val; break;
    case 'rpgGMPrimordialTitans': gmPrimordialTitans = val; break;
    case 'rpgGMHiddenSoldiers': gmHiddenSoldiers = val; break;
    case 'rpgGMHiddenTitans': gmHiddenTitans = val; break;
  }
}

// Cada campanha tem o próprio escudo (encontro, iniciativa, titãs…)
async function trocarSlot(novo) {
  novo = novo || '';
  if (!user || novo === slot) return;
  clearTimeout(stateTimer);
  await pushState();
  slot = novo;
  lsSet(LS.slot, slot);
  for (const key of GM_KEYS) applyState(key, cloudState.get(nomeEstado(key)) ?? '[]');
}

// ------------------------------------------------------------
// Início de sessão
// ------------------------------------------------------------
async function startSession(u) {
  user = u; ready = false; carregando = true;
  setStatus('loading');
  renderTudo();
  const storedUid = localStorage.getItem(LS.uid);
  const outraConta = !!storedUid && storedUid !== u.uid;
  const primeiraVez = !storedUid;
  if (outraConta) { dirtyState.clear(); pendingValues.clear(); marcarFichasPendentes(false); slot = ''; lsSet(LS.slot, ''); }

  try {
    // Perfil
    const ps = await getDoc(doc(db, 'perfis', u.uid));
    perfil = ps.exists() ? ps.data() : null;

    // Fichas
    const snap = await getDocs(query(collection(db, 'chars'), where('owner', '==', u.uid)));
    const nuvem = new Map();
    snap.forEach(d => {
      const x = d.data(); const { R, lg } = readRemote(x);
      nuvem.set(d.id, R); baseMeta.set(d.id, metaDoc(x));
      if (lg) legacy.add(d.id);
    });
    const conhecidas = new Set(storedUid === u.uid ? safeParse(localStorage.getItem(LS.known), []) : []);
    const locais = outraConta ? [] : ownChars();
    const confiarLocal = !outraConta && storedUid === u.uid && charsDirty;
    const resultado = [], usados = new Set();
    for (const lc of locais) {
      const id = docIdDe(lc);
      if (nuvem.has(id)) {
        const R = nuvem.get(id);
        base.set(id, R); usados.add(id);
        const nuvemMaisNova = String(safeParse(R.updatedAt, '') || '') > String(lc.updatedAt || '');
        if (confiarLocal || (primeiraVez && !nuvemMaisNova)) resultado.push(lc);
        else { const o = fromKeys(R); if (!o.id) o.id = lc.id; resultado.push(o); }
      } else if (!conhecidas.has(lc.id)) {
        resultado.push(lc); // só existe aqui: vai subir
      } // senão: foi excluída em outro aparelho
    }
    for (const [id, R] of nuvem) {
      if (usados.has(id)) continue;
      base.set(id, R);
      const o = fromKeys(R); if (!o.id) o.id = id.slice(u.uid.length + 1);
      resultado.push(o);
    }
    characters = resultado;
    salvarLocal();

    // Escudo e conteúdo customizado
    const cs = await readCloudState();
    cloudState.clear();
    for (const [k, v] of Object.entries(cs)) cloudState.set(k, v);
    for (const nome of [...dirtyState]) {
      if (pendingValues.has(nome)) continue;
      const [key, s = ''] = nome.split('@');
      const v = s === slot ? localStorage.getItem(key) : null;
      if (v != null && !outraConta) pendingValues.set(nome, v); else dirtyState.delete(nome);
    }
    for (const key of [...GLOBAL_KEYS, ...GM_KEYS]) {
      const nome = nomeEstado(key);
      const local = outraConta ? null : localStorage.getItem(key);
      if (dirtyState.has(nome)) continue;
      if (cloudState.has(nome)) { if (local !== cloudState.get(nome)) applyState(key, cloudState.get(nome)); }
      else if (local != null && local !== '[]') marcarEstado(nome, local, false);
      else if (local == null || outraConta) applyState(key, '[]');
    }
    savePendState();

    // Campanhas
    await carregarMinhasMesas();
    await carregarParticipacoes();
    if (slot && !minhasMesas.some(m => m.id === slot)) await trocarSlotSemEnviar('');

    lsSet(LS.uid, u.uid);
    ready = true; carregando = false;
    renderTudo();
    await pushChars();
    if (dirtyState.size) await pushState();
    ouvirMinhasFichas();
    setStatus(navigator.onLine ? 'ok' : 'offline');
    if (!perfil) abrirPerfil(true);
  } catch (e) {
    console.error(e);
    carregando = false;
    setStatus('error');
    renderTudo();
    avisar('Não consegui carregar sua conta', erroTexto(e) + ' Recarregue a página para tentar de novo.', true);
  }
}

async function trocarSlotSemEnviar(novo) {
  slot = novo; lsSet(LS.slot, slot);
  for (const key of GM_KEYS) applyState(key, cloudState.get(nomeEstado(key)) ?? '[]');
}

function renderTudo() {
  renderCharList();
  refreshEncontroIfVisible();
  renderConta();
  renderSheetMesa();
  renderCabecalhoEscudo();
  if (isVisible('screenCampanhas')) renderCampanhas();
  if (isVisible('screenCampanhaJogador') && campanhaAberta) renderCampanhaJogador();
  if (isVisible('screenEscudo')) renderJogadoresGM();
}

// ------------------------------------------------------------
// Tempo real
// ------------------------------------------------------------
function ouvirMinhasFichas() {
  unsubOwn && unsubOwn();
  unsubOwn = onSnapshot(query(collection(db, 'chars'), where('owner', '==', user.uid)), snap => {
    const tocados = new Set(); let mudou = false, reenviar = false;
    snap.docChanges().forEach(c => {
      const id = c.doc.id, x = c.doc.data();
      const cid = id.slice(user.uid.length + 1);
      if (c.type === 'removed') {
        if (base.has(id)) {
          base.delete(id); baseMeta.delete(id);
          characters = characters.filter(ch => ch._remote || ch.id !== cid);
          mudou = true;
        }
        return;
      }
      const { R, lg } = readRemote(x);
      if (lg) legacy.add(id); else legacy.delete(id);
      baseMeta.set(id, metaDoc(x));
      const B = base.get(id);
      if (B && sameKeys(R, B)) return;
      let obj = characters.find(ch => !ch._remote && ch.id === cid);
      if (!obj) {
        if (B) return; // excluída aqui, exclusão ainda sendo enviada
        obj = fromKeys(R); if (!obj.id) obj.id = cid;
        characters.push(obj); base.set(id, R);
        tocados.add(obj.id); mudou = true;
        return;
      }
      if (aplicarRemoto(obj, R, B)) reenviar = true;
      base.set(id, R);
      tocados.add(obj.id); mudou = true;
    });
    if (mudou) { salvarLocal(); saveKnown(); depoisDeMudancaRemota(tocados); }
    if (reenviar) { marcarFichasPendentes(true); agendarPush(600); }
  }, e => { console.error(e); setStatus('error'); });
}

function sincronizarPool() {
  const desejados = [...pool.values()].filter(o => membros.has(o._owner));
  characters = characters.filter(c => !c._remote).concat(desejados);
}

function pararCampanha() {
  unsubChars && unsubChars(); unsubMembros && unsubMembros();
  unsubChars = unsubMembros = null;
  for (const id of pool.keys()) { base.delete(id); baseMeta.delete(id); legacy.delete(id); }
  pool.clear(); membros = new Map();
  characters = characters.filter(c => !c._remote);
}

function ouvirCampanhaGM(code) {
  pararCampanha();
  unsubMembros = onSnapshot(collection(db, 'mesas', code, 'membros'), snap => {
    membros = new Map(); snap.forEach(d => membros.set(d.id, d.data()));
    const m = minhasMesas.find(x => x.id === code); if (m) m._n = membros.size;
    sincronizarPool();
    depoisDeMudancaRemota(new Set());
  }, e => { console.error(e); avisar('Erro ao ler os jogadores', erroTexto(e), true); });
  unsubChars = onSnapshot(query(collection(db, 'chars'), where('mesaGm', '==', user.uid), where('mesaId', '==', code)), snap => {
    const tocados = new Set(); let reenviar = false;
    snap.docChanges().forEach(c => {
      const id = c.doc.id, x = c.doc.data();
      if (x.owner === user.uid) return;
      if (c.type === 'removed') { pool.delete(id); base.delete(id); baseMeta.delete(id); return; }
      const { R, lg } = readRemote(x);
      if (lg) legacy.add(id); else legacy.delete(id);
      baseMeta.set(id, metaDoc(x));
      let obj = pool.get(id);
      const B = base.get(id);
      if (!obj) {
        obj = fromKeys(R);
        Object.assign(obj, { _remote: true, _docId: id, _owner: x.owner, _ownerName: x.ownerName || '' });
        pool.set(id, obj); base.set(id, R); tocados.add(obj.id);
        return;
      }
      obj._ownerName = x.ownerName || obj._ownerName;
      if (B && sameKeys(R, B)) return;
      if (aplicarRemoto(obj, R, B)) reenviar = true;
      base.set(id, R); tocados.add(obj.id);
    });
    sincronizarPool();
    depoisDeMudancaRemota(tocados);
    if (reenviar) agendarPush(600);
  }, e => { console.error(e); avisar('Erro ao ler as fichas da campanha', erroTexto(e), true); });
}

function ouvirCampanhaJogador(code) {
  pararCampanha();
  unsubMembros = onSnapshot(collection(db, 'mesas', code, 'membros'), snap => {
    membros = new Map(); snap.forEach(d => membros.set(d.id, d.data()));
    if (!membros.has(user.uid) && campanhaAberta && campanhaAberta.id === code) {
      marcarRemovida(code);
      return;
    }
    if (isVisible('screenCampanhaJogador')) renderCampanhaJogador();
  }, e => { console.error(e); avisar('Não consegui abrir a campanha', erroTexto(e), true); });
}

function depoisDeMudancaRemota(tocados) {
  renderCharList();
  refreshEncontroIfVisible();
  if (isVisible('screenEscudo')) renderJogadoresGM();
  if (isVisible('screenCampanhaJogador')) renderCampanhaJogador();
  if (isVisible('screenCampanhas')) renderCampanhas();
  if (currentCharId && tocados.has(currentCharId)) refreshOpenSheet(currentCharId);
}

function refreshOpenSheet(id) {
  if (currentCharId !== id || !isVisible('screenSheet')) return;
  const a = document.activeElement;
  if (a && a.closest && a.closest('#screenSheet') && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) { pendingSheetRefresh = id; return; }
  const modalAberto = [...document.querySelectorAll('.modal-overlay')].some(m => !m.classList.contains('hidden'));
  if (modalAberto) { pendingSheetRefresh = id; setTimeout(() => { if (pendingSheetRefresh === id) { pendingSheetRefresh = null; refreshOpenSheet(id); } }, 1500); return; }
  const y = window.scrollY;
  const activeTab = document.querySelector('#screenSheet .tab.active');
  const origem = voltarPara;
  window.openChar(id);
  voltarPara = origem;
  if (activeTab && activeTab.isConnected) activeTab.click();
  window.scrollTo(0, y);
}
document.addEventListener('focusout', () => setTimeout(() => {
  if (pendingSheetRefresh) { const id = pendingSheetRefresh; pendingSheetRefresh = null; refreshOpenSheet(id); }
}, 300));

// ------------------------------------------------------------
// Perfil
// ------------------------------------------------------------
function dadosMembro() { return { nome: perfil ? perfil.nome : '', avatar: perfil ? perfil.avatar || '' : '', foto: perfil ? perfil.foto || '' : '' }; }

async function salvarPerfil(nome, avatar) {
  nome = String(nome || '').trim().slice(0, 30);
  if (!nome) { avisar('Escolha um apelido', '', true); return false; }
  const novo = { nome, avatar: avatar || '', foto: user.photoURL || '', atualizadoEm: Date.now() };
  try {
    await setDoc(doc(db, 'perfis', user.uid), novo);
    const mudouNome = !perfil || perfil.nome !== nome;
    perfil = novo;
    // atualiza o nome nas campanhas
    const m = dadosMembro();
    await Promise.all([
      ...participacoes.filter(p => !p.removida).map(p => updateDoc(doc(db, 'mesas', p.id, 'membros', user.uid), m).catch(() => { })),
      ...minhasMesas.map(ms => updateDoc(doc(db, 'mesas', ms.id), { gmName: m.nome, gmAvatar: m.avatar, gmFoto: m.foto }).catch(() => { }))
    ]);
    if (mudouNome && ownChars().length) agendarPush(300);
    renderTudo();
    return true;
  } catch (e) { avisar('Erro ao salvar o perfil', erroTexto(e), true); return false; }
}

function abrirPerfil(obrigatorio) {
  if (!user) return;
  const p = perfil || { nome: (user.displayName || '').split(' ')[0] || '', avatar: user.photoURL ? 'foto' : AVATARES[0] };
  const opcoes = [];
  if (user.photoURL) opcoes.push({ v: 'foto', html: avatarHtml({ avatar: 'foto', foto: user.photoURL }, 'nv-avatar-lg') });
  AVATARES.forEach(a => opcoes.push({ v: a, html: `<span class="nv-avatar nv-avatar-lg">${a}</span>` }));
  el('nvPerfilTitulo').textContent = obrigatorio ? 'Crie seu perfil' : 'Seu perfil';
  el('nvPerfilSub').textContent = obrigatorio
    ? 'É assim que o mestre e os outros jogadores vão ver você nas campanhas.'
    : 'Seu apelido e avatar aparecem nas campanhas.';
  el('nvPerfilNome').value = p.nome || '';
  el('nvPerfilAvatares').innerHTML = opcoes.map(o =>
    `<button type="button" class="nv-avatar-opcao ${o.v === (p.avatar || '') ? 'ativo' : ''}" data-v="${esc(o.v)}">${o.html}</button>`).join('');
  el('nvPerfilAvatares').querySelectorAll('.nv-avatar-opcao').forEach(b => b.addEventListener('click', () => {
    el('nvPerfilAvatares').querySelectorAll('.nv-avatar-opcao').forEach(x => x.classList.remove('ativo'));
    b.classList.add('ativo');
  }));
  el('nvPerfilFechar').classList.toggle('hidden', !!obrigatorio);
  el('nvPerfilCancelar').classList.toggle('hidden', !!obrigatorio);
  el('nvPerfilModal').classList.remove('hidden');
  setTimeout(() => el('nvPerfilNome').focus(), 50);
}
async function confirmarPerfil() {
  const ativo = el('nvPerfilAvatares').querySelector('.nv-avatar-opcao.ativo');
  const btn = el('nvPerfilSalvar'); btn.disabled = true;
  const ok = await salvarPerfil(el('nvPerfilNome').value, ativo ? ativo.dataset.v : '');
  btn.disabled = false;
  if (ok) { el('nvPerfilModal').classList.add('hidden'); avisar('Perfil salvo', ''); }
}

// ------------------------------------------------------------
// Login / conta
// ------------------------------------------------------------
function abrirLogin(aba = 'entrar') {
  el('nvLoginModal').classList.remove('hidden');
  trocarAbaLogin(aba);
  el('nvLoginErro').textContent = '';
}
function fecharLogin() { el('nvLoginModal').classList.add('hidden'); }
function trocarAbaLogin(aba) {
  document.querySelectorAll('#nvLoginModal [data-aba]').forEach(b => b.classList.toggle('active', b.dataset.aba === aba));
  el('nvLoginApelidoWrap').classList.toggle('hidden', aba !== 'criar');
  el('nvLoginEnviar').textContent = aba === 'criar' ? 'Criar conta' : 'Entrar';
  el('nvLoginEsqueci').classList.toggle('hidden', aba !== 'entrar');
  el('nvLoginSenha').setAttribute('autocomplete', aba === 'criar' ? 'new-password' : 'current-password');
  el('nvLoginModal').dataset.aba = aba;
  el('nvLoginErro').textContent = '';
}
async function entrarGoogle() {
  const prov = new GoogleAuthProvider();
  prov.setCustomParameters({ prompt: 'select_account' });
  try { await signInWithPopup(auth, prov); fecharLogin(); }
  catch (e) {
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
      try { await signInWithRedirect(auth, prov); return; } catch (e2) { e = e2; }
    }
    el('nvLoginErro').textContent = erroTexto(e).replace(/&[a-z#0-9]+;/g, '');
  }
}
async function enviarLoginEmail(ev) {
  ev && ev.preventDefault();
  const aba = el('nvLoginModal').dataset.aba;
  const email = el('nvLoginEmail').value.trim(), senha = el('nvLoginSenha').value;
  const erroEl = el('nvLoginErro'); erroEl.textContent = '';
  if (!email) { erroEl.textContent = 'Digite seu e-mail.'; return; }
  if (senha.length < 6) { erroEl.textContent = aba === 'criar' ? 'A senha precisa ter pelo menos 6 caracteres.' : 'Digite sua senha.'; return; }
  const btn = el('nvLoginEnviar'); btn.disabled = true;
  try {
    if (aba === 'criar') {
      const apelido = el('nvLoginApelido').value.trim();
      if (!apelido) { erroEl.textContent = 'Escolha um apelido.'; return; }
      criandoConta = apelido;
      await createUserWithEmailAndPassword(auth, email, senha);
    } else {
      await signInWithEmailAndPassword(auth, email, senha);
    }
    fecharLogin();
    el('nvLoginSenha').value = '';
  } catch (e) {
    criandoConta = false;
    erroEl.textContent = erroTexto(e).replace(/&[a-z#0-9]+;/g, '');
  } finally { btn.disabled = false; }
}
async function esqueciSenha() {
  const email = el('nvLoginEmail').value.trim();
  const erroEl = el('nvLoginErro');
  if (!email) { erroEl.textContent = 'Digite seu e-mail acima e clique de novo.'; return; }
  try { await sendPasswordResetEmail(auth, email); erroEl.textContent = ''; avisar('E-mail enviado', 'Se existir uma conta com esse e-mail, chegará um link para criar uma nova senha. Confira o spam.'); }
  catch (e) { erroEl.textContent = erroTexto(e).replace(/&[a-z#0-9]+;/g, ''); }
}

async function sairDaConta(depois) {
  saindo = true;
  if (depois === 'trocar') sessionStorage.setItem('coordNuvemAbrirLogin', '1');
  if (charsDirty) await pushChars();
  if (dirtyState.size) await pushState();
  unsubOwn && unsubOwn(); pararCampanha();
  await signOut(auth);
  Object.keys(localStorage).filter(k => k.startsWith('rpg') || k.startsWith('coordNuvem')).forEach(k => localStorage.removeItem(k));
  location.reload();
}

function renderConta() {
  const box = el('nuvemConta'); if (!box) return;
  if (!CONFIGURADO) { box.innerHTML = ''; return; }
  if (!user) { box.innerHTML = `<button class="ghost nv-btn-entrar" onclick="nuvem.abrirLogin()">Entrar</button>`; return; }
  const txt = { ok: 'Salvo na nuvem', saving: 'Salvando…', error: 'Erro ao salvar', loading: 'Carregando…', offline: 'Sem internet', off: '' }[status] || '';
  const nome = esc(perfil ? perfil.nome : (user.displayName || user.email || '').split(/[ @]/)[0]);
  box.innerHTML = `
    <div class="nv-conta-wrap">
      <button class="nv-conta-btn" onclick="nuvem.menuConta(event)" title="Sua conta">
        ${avatarHtml(perfil || { nome })}
        <span class="nv-conta-txt"><strong>${nome}</strong><small class="nv-status nv-status-${status}"><i></i>${txt}</small></span>
      </button>
      <div id="nvMenuConta" class="nv-menu hidden">
        <div class="nv-menu-email">${esc(user.email || '')}</div>
        <button onclick="nuvem.abrirPerfil()">Editar perfil</button>
        <button onclick="nuvem.abrirCampanhas()">Minhas campanhas</button>
        <button onclick="nuvem.trocarConta()">Trocar de conta</button>
        <button class="nv-menu-sair" onclick="nuvem.sair()">Sair</button>
      </div>
    </div>`;
}
function menuConta(ev) {
  ev.stopPropagation();
  el('nvMenuConta') && el('nvMenuConta').classList.toggle('hidden');
}
document.addEventListener('click', e => {
  const m = el('nvMenuConta');
  if (m && !m.classList.contains('hidden') && !e.target.closest('.nv-conta-wrap')) m.classList.add('hidden');
});

// ------------------------------------------------------------
// Campanhas
// ------------------------------------------------------------
function gerarCodigo() {
  const al = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = ''; for (const n of crypto.getRandomValues(new Uint32Array(6))) s += al[n % al.length];
  return s;
}

async function carregarMinhasMesas() {
  const ms = await getDocs(query(collection(db, 'mesas'), where('gm', '==', user.uid)));
  const antigas = new Map(minhasMesas.map(m => [m.id, m]));
  minhasMesas = [];
  ms.forEach(d => minhasMesas.push({ id: d.id, ...d.data(), _n: antigas.get(d.id)?._n }));
  minhasMesas.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}
async function contarMembros() {
  await Promise.all(minhasMesas.map(async m => {
    try { const s = await getDocs(collection(db, 'mesas', m.id, 'membros')); m._n = s.size; } catch (e) { }
  }));
  if (isVisible('screenCampanhas')) renderCampanhas();
}

async function carregarParticipacoes() {
  const s = await getDoc(doc(db, 'users', user.uid, 'meta', 'campanhas'));
  const codigos = s.exists() ? (s.data().codigos || []) : [];
  const lista = await Promise.all(codigos.map(async code => {
    try {
      const [ms, mb] = await Promise.all([getDoc(doc(db, 'mesas', code)), getDoc(doc(db, 'mesas', code, 'membros', user.uid))]);
      if (!ms.exists()) return { id: code, removida: 'apagada' };
      if (!mb.exists()) return { id: code, ...ms.data(), removida: 'removido' };
      return { id: code, ...ms.data() };
    } catch (e) {
      console.error(e);
      return { id: code, erro: true }; // erro de rede/regras: não remove nada
    }
  }));
  participacoes = lista;
  participacoesOk = !lista.some(p => p.erro);
  const removidas = lista.filter(p => p.removida);
  if (removidas.length) {
    removidas.forEach(p => avisar('Campanha indisponível', p.removida === 'apagada'
      ? `A campanha ${esc(p.id)} foi apagada pelo mestre.` : `Você não faz mais parte da campanha "${esc(p.name || p.id)}".`, true));
    participacoes = lista.filter(p => !p.removida);
    await salvarParticipacoes();
    for (const ch of ownChars()) if (removidas.some(p => p.id === ch.mesaCode)) { delete ch.mesaCode; delete ch.mesaGm; delete ch.mesaNome; delete ch.mesaGmNome; }
    salvarLocal(); marcarFichasPendentes(true);
  }
}
async function salvarParticipacoes() {
  await setDoc(doc(db, 'users', user.uid, 'meta', 'campanhas'), { codigos: participacoes.filter(p => !p.removida).map(p => p.id) });
}
function marcarRemovida(code) {
  participacoes = participacoes.filter(p => p.id !== code);
  salvarParticipacoes().catch(() => { });
  for (const ch of ownChars()) if (ch.mesaCode === code) { delete ch.mesaCode; delete ch.mesaGm; delete ch.mesaNome; delete ch.mesaGmNome; }
  window.saveChars();
  avisar('Você saiu da campanha', 'O mestre removeu você ou apagou a campanha.', true);
  if (campanhaAberta && campanhaAberta.id === code) { campanhaAberta = null; pararCampanha(); abrirCampanhas(); }
}

async function criarCampanha() {
  if (!user) return abrirLogin();
  if (minhasMesas.length >= LIMITE_MESAS) { avisar('Limite de campanhas atingido', `Cada conta pode mestrar até ${LIMITE_MESAS} campanhas. Apague uma para criar outra.`, true); return; }
  const nome = (el('nvNovaCampanhaNome').value || '').trim().slice(0, 60);
  if (!nome) { avisar('Dê um nome para a campanha', '', true); el('nvNovaCampanhaNome').focus(); return; }
  for (let t = 0; t < 5; t++) {
    const code = gerarCodigo();
    const ref = doc(db, 'mesas', code);
    try {
      const ex = await getDoc(ref);
      if (ex.exists()) continue;
      const m = dadosMembro();
      const dados = { gm: user.uid, name: nome, gmName: m.nome, gmAvatar: m.avatar, gmFoto: m.foto, createdAt: Date.now() };
      await setDoc(ref, dados);
      minhasMesas.push({ id: code, ...dados, _n: 0 });
      el('nvNovaCampanhaNome').value = '';
      avisar('Campanha criada', `Passe o código ${code} para os jogadores.`);
      abrirCampanhaGM(code);
      return;
    } catch (e) { avisar('Erro ao criar campanha', erroTexto(e), true); return; }
  }
}

async function entrarComCodigo(raw, fichaId) {
  if (!user) { abrirLogin(); return null; }
  const code = normCodigo(raw);
  if (code.length < 4) { avisar('Código inválido', 'Confira o código com o mestre.', true); return null; }
  if (minhasMesas.some(m => m.id === code)) {
    if (fichaId) { avisar('Essa campanha é sua', 'Você é o mestre dela: as fichas dos jogadores já aparecem para você.', true); return null; }
    abrirCampanhaGM(code); return null;
  }
  let p = participacoes.find(x => x.id === code);
  if (!p) {
    try {
      const s = await getDoc(doc(db, 'mesas', code));
      if (!s.exists()) { avisar('Campanha não encontrada', 'Confira o código com o mestre.', true); return null; }
      await setDoc(doc(db, 'mesas', code, 'membros', user.uid), { ...dadosMembro(), entrouEm: Date.now() });
      p = { id: code, ...s.data() };
      participacoes.push(p);
      await salvarParticipacoes();
      avisar('Você entrou na campanha', `"${esc(p.name)}"${p.gmName ? ` de ${esc(p.gmName)}` : ''}.`);
    } catch (e) { avisar('Erro ao entrar na campanha', erroTexto(e), true); return null; }
  }
  if (fichaId) enviarFicha(fichaId, code);
  else abrirCampanhaJogador(code);
  return code;
}

function enviarFicha(fichaId, code) {
  const ch = characters.find(c => c.id === fichaId && !c._remote);
  const p = participacoes.find(x => x.id === code);
  if (!ch || !p) return;
  ch.mesaCode = code; ch.mesaGm = p.gm; ch.mesaNome = p.name || code; ch.mesaGmNome = p.gmName || '';
  ch.updatedAt = new Date().toISOString();
  window.saveChars();
  renderSheetMesa();
  if (isVisible('screenCampanhaJogador')) renderCampanhaJogador();
  avisar('Ficha enviada', `O mestre de "${esc(p.name)}" já pode ver ${esc(ch.name)}.`);
}

function tirarFicha(fichaId) {
  const ch = characters.find(c => c.id === fichaId && !c._remote);
  if (!ch) return;
  showConfirm(`Tirar "${ch.name}" da campanha "${ch.mesaNome || ch.mesaCode}"? O mestre deixa de ver esta ficha.`, () => {
    delete ch.mesaCode; delete ch.mesaGm; delete ch.mesaNome; delete ch.mesaGmNome;
    ch.updatedAt = new Date().toISOString();
    window.saveChars();
    renderSheetMesa();
    if (isVisible('screenCampanhaJogador')) renderCampanhaJogador();
  });
}

function sairDaCampanha(code) {
  const p = participacoes.find(x => x.id === code); if (!p) return;
  showConfirm(`Sair da campanha "${p.name || code}"? Suas fichas saem dela, mas continuam na sua conta.`, async () => {
    for (const ch of ownChars()) if (ch.mesaCode === code) { delete ch.mesaCode; delete ch.mesaGm; delete ch.mesaNome; delete ch.mesaGmNome; ch.updatedAt = new Date().toISOString(); }
    window.saveChars();
    await pushChars();
    try { await deleteDoc(doc(db, 'mesas', code, 'membros', user.uid)); } catch (e) { }
    participacoes = participacoes.filter(x => x.id !== code);
    await salvarParticipacoes().catch(() => { });
    campanhaAberta = null; pararCampanha();
    abrirCampanhas();
  });
}

async function abrirCampanhaGM(code) {
  if (!user) return;
  voltarPara = null;
  await trocarSlot(code);
  campanhaAberta = { id: code, papel: 'gm' };
  ouvirCampanhaGM(code);
  window.openEscudoDoMestre();
  window.scrollTo(0, 0);
}
async function abrirEscudoAvulso() {
  voltarPara = null;
  if (user) await trocarSlot('');
  campanhaAberta = null; pararCampanha();
  window.openEscudoDoMestre();
}

function abrirCampanhas() {
  if (!CONFIGURADO) { origEnterCatalog('escudo'); return; }
  voltarPara = null;
  if (campanhaAberta) { campanhaAberta = null; pararCampanha(); }
  hideAllTopScreens();
  el('appHeaderActions').classList.add('hidden');
  el('screenCampanhas').classList.remove('hidden');
  currentCharId = null;
  renderCampanhas();
  window.scrollTo(0, 0);
  if (user && ready) contarMembros();
}

function abrirCampanhaJogador(code) {
  const p = participacoes.find(x => x.id === code); if (!p) return;
  voltarPara = null;
  if (!campanhaAberta || campanhaAberta.id !== code || campanhaAberta.papel !== 'jogador') {
    campanhaAberta = { id: code, papel: 'jogador' };
    ouvirCampanhaJogador(code);
  }
  hideAllTopScreens();
  el('appHeaderActions').classList.add('hidden');
  el('screenCampanhaJogador').classList.remove('hidden');
  currentCharId = null;
  renderCampanhaJogador();
  window.scrollTo(0, 0);
}

function abrirFicha(id, origem) {
  hideAllTopScreens();
  el('appHeaderActions').classList.remove('hidden');
  window.openChar(id);
  voltarPara = origem;
}

async function renomearCampanha() {
  const m = campanhaAberta && minhasMesas.find(x => x.id === campanhaAberta.id); if (!m) return;
  const nome = (prompt('Novo nome da campanha:', m.name) || '').trim().slice(0, 60);
  if (!nome || nome === m.name) return;
  try { await updateDoc(doc(db, 'mesas', m.id), { name: nome }); m.name = nome; renderCabecalhoEscudo(); }
  catch (e) { avisar('Erro ao renomear', erroTexto(e), true); }
}

function apagarCampanha() {
  const m = campanhaAberta && minhasMesas.find(x => x.id === campanhaAberta.id); if (!m) return;
  showConfirm(`Apagar a campanha "${m.name}"? Os jogadores saem dela e o escudo desta campanha (encontro, iniciativa, titãs) é apagado. As fichas continuam com os jogadores.`, async () => {
    try {
      const batch = writeBatch(db);
      const mb = await getDocs(collection(db, 'mesas', m.id, 'membros'));
      mb.forEach(d => batch.delete(d.ref));
      for (const key of GM_KEYS) {
        const nome = `${key}@${m.id}`;
        for (let i = 0; i < (stateChunks[nome] || 0); i++) batch.delete(doc(db, 'users', user.uid, 'state', `${nome}__${i}`));
        cloudState.delete(nome); dirtyState.delete(nome); pendingValues.delete(nome);
      }
      batch.delete(doc(db, 'mesas', m.id));
      await batch.commit();
      minhasMesas = minhasMesas.filter(x => x.id !== m.id);
      campanhaAberta = null; pararCampanha();
      await trocarSlotSemEnviar('');
      savePendState();
      avisar('Campanha apagada', '');
      abrirCampanhas();
    } catch (e) { avisar('Erro ao apagar campanha', erroTexto(e), true); }
  });
}

function removerJogador(uid) {
  if (!campanhaAberta) return;
  const m = membros.get(uid); if (!m) return;
  showConfirm(`Remover ${m.nome || 'este jogador'} da campanha? As fichas dele deixam de aparecer para você.`, async () => {
    try { await deleteDoc(doc(db, 'mesas', campanhaAberta.id, 'membros', uid)); }
    catch (e) { avisar('Erro ao remover jogador', erroTexto(e), true); }
  });
}

function tirarFichaDoJogador(docId) {
  const obj = pool.get(docId); if (!obj) return;
  showConfirm(`Tirar "${obj.name}" desta campanha? A ficha continua com o jogador.`, async () => {
    delete obj.mesaCode; delete obj.mesaGm; delete obj.mesaNome; delete obj.mesaGmNome;
    await pushChars();
    pool.delete(docId); base.delete(docId); baseMeta.delete(docId);
    sincronizarPool();
    renderJogadoresGM(); refreshEncontroIfVisible();
  });
}

function copiarCodigo(code) {
  const ok = () => avisar('Código copiado', code);
  if (navigator.clipboard) navigator.clipboard.writeText(code).then(ok, () => prompt('Copie o código:', code));
  else prompt('Copie o código:', code);
}

// ------------------------------------------------------------
// Telas
// ------------------------------------------------------------
function barra(rotulo, r, cls) {
  const cur = Number(r && r.cur) || 0, max = Number(r && r.max) || 0;
  const pct = max > 0 ? Math.max(0, Math.min(100, cur / max * 100)) : 0;
  return `<div class="nv-barra ${cls}"><span class="nv-barra-rot">${rotulo}</span><div class="nv-barra-trilho"><div style="width:${pct}%"></div></div><span class="nv-barra-num">${cur}/${max}</span></div>`;
}
function imgFicha(ch) {
  const u = ch && ch.imageUrl;
  if (u && /^(data:image\/|https?:)/.test(u)) return `<img class="nv-ficha-img" src="${esc(u)}" alt="" />`;
  return `<div class="nv-ficha-img nv-ficha-img-vazia">${esc((ch.name || '?').charAt(0).toUpperCase())}</div>`;
}
function cardFicha(ch, botoes, dono) {
  const origem = typeof getOriginById === 'function' ? getOriginById(ch.originId) : null;
  const r = ch.resources || {};
  return `<div class="nv-ficha-card">
    <div class="nv-ficha-topo">${imgFicha(ch)}
      <div class="nv-ficha-info"><h4>${esc(ch.name || 'Sem nome')}</h4>
        <p>Nível ${esc(ch.level ?? 0)}${origem && origem.name ? ' · ' + esc(origem.name) : ''}</p>
        ${dono ? `<p class="nv-ficha-dono">${dono}</p>` : ''}
      </div>
    </div>
    ${barra('PDV', r.hp, 'hp')}${barra('PDE', r.sta, 'sta')}${barra('SAN', r.san, 'san')}
    <div class="nv-ficha-botoes">${botoes}</div>
  </div>`;
}

function renderCampanhas() {
  const box = el('nvCampanhasConteudo'); if (!box) return;
  if (!user) {
    box.innerHTML = `
      <div class="card nv-hero">
        <h2>Campanhas</h2>
        <p>Entre com uma conta para criar campanhas, receber as fichas dos jogadores em tempo real e entrar nas campanhas dos seus amigos.</p>
        <div class="nv-acoes"><button class="primary" onclick="nuvem.abrirLogin()">Entrar ou criar conta</button>
        <button class="ghost" onclick="nuvem.escudoAvulso()">Usar o escudo sem conta</button></div>
      </div>`;
    return;
  }
  if (carregando) { box.innerHTML = `<div class="card"><p class="nv-carregando">Carregando suas campanhas…</p></div>`; return; }
  const minhas = minhasMesas.map(m => `
    <div class="nv-camp-card" onclick="nuvem.abrirCampanhaGM('${esc(m.id)}')" role="button" tabindex="0">
      <div class="nv-camp-tag gm">Mestre</div>
      <h4>${esc(m.name)}</h4>
      <p>Código <span class="nv-codigo-mini">${esc(m.id)}</span></p>
      <p class="nv-camp-sub">${m._n == null ? '&nbsp;' : m._n === 1 ? '1 jogador' : `${m._n} jogadores`}</p>
    </div>`).join('');
  const cheia = minhasMesas.length >= LIMITE_MESAS;
  const jogando = participacoes.filter(p => !p.removida).map(p => {
    const n = ownChars().filter(c => c.mesaCode === p.id).length;
    return `<div class="nv-camp-card" onclick="nuvem.abrirCampanhaJogador('${esc(p.id)}')" role="button" tabindex="0">
      <div class="nv-camp-tag">Jogador</div>
      <h4>${esc(p.name || p.id)}</h4>
      <p class="nv-camp-mestre">${avatarHtml({ nome: p.gmName, avatar: p.gmAvatar, foto: p.gmFoto }, 'nv-avatar-sm')} ${esc(p.gmName || 'Mestre')}</p>
      <p class="nv-camp-sub">${n === 0 ? 'Nenhuma ficha enviada' : n === 1 ? '1 ficha sua' : `${n} fichas suas`}</p>
    </div>`;
  }).join('');
  box.innerHTML = `
    <div class="card">
      <div class="nv-titulo-linha"><h2>Campanhas que você mestra <span class="nv-contador ${cheia ? 'cheio' : ''}">${minhasMesas.length}/${LIMITE_MESAS}</span></h2>
        <button class="ghost small" onclick="nuvem.escudoAvulso()" title="Encontro, iniciativa e titãs sem ligar a uma campanha">Escudo avulso</button></div>
      <div class="nv-camp-grid">${minhas || ''}
        <div class="nv-camp-card nv-camp-nova ${cheia ? 'desativada' : ''}">
          <h4>Nova campanha</h4>
          <input id="nvNovaCampanhaNome" placeholder="Nome da campanha" maxlength="60" ${cheia ? 'disabled' : ''} onkeydown="if(event.key==='Enter')nuvem.criarCampanha()" />
          <button class="primary small" onclick="nuvem.criarCampanha()" ${cheia ? 'disabled' : ''}>Criar</button>
          ${cheia ? `<p class="nv-camp-sub">Limite de ${LIMITE_MESAS} atingido</p>` : ''}
        </div>
      </div>
    </div>
    <div class="card">
      <h2>Campanhas que você joga</h2>
      <div class="nv-camp-grid">${jogando}
        <div class="nv-camp-card nv-camp-nova">
          <h4>Entrar numa campanha</h4>
          <input id="nvCodigoEntrar" class="nv-input-codigo" placeholder="Código do mestre" maxlength="12" autocomplete="off" onkeydown="if(event.key==='Enter')nuvem.entrarComCodigo(this.value)" />
          <button class="primary small" onclick="nuvem.entrarComCodigo(document.getElementById('nvCodigoEntrar').value)">Entrar</button>
        </div>
      </div>
      ${!jogando ? '<p class="nv-nota">Peça o código de 6 letras para o mestre da sua campanha.</p>' : ''}
    </div>`;
}

function renderCabecalhoEscudo() {
  const box = el('nuvemEscudoMesa'); if (!box) return;
  if (!CONFIGURADO) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  const m = campanhaAberta && campanhaAberta.papel === 'gm' ? minhasMesas.find(x => x.id === campanhaAberta.id) : null;
  if (!m) {
    box.innerHTML = `<div class="nv-cab">
      <button class="ghost small" onclick="nuvem.abrirCampanhas()">&larr; Campanhas</button>
      <div class="nv-cab-titulo"><span class="nv-cab-rotulo">Escudo avulso</span>
      <p class="nv-nota">${user ? 'Não ligado a nenhuma campanha. Abra uma campanha para ver as fichas dos jogadores.' : 'Salvo só neste navegador. Entre com uma conta para usar campanhas.'}</p></div>
    </div>`;
    return;
  }
  box.innerHTML = `<div class="nv-cab">
    <button class="ghost small" onclick="nuvem.abrirCampanhas()">&larr; Campanhas</button>
    <div class="nv-cab-titulo"><span class="nv-cab-rotulo">Campanha</span><h3>${esc(m.name)}</h3></div>
    <div class="nv-cab-codigo"><span>Código</span><strong>${esc(m.id)}</strong>
      <button class="small" onclick="nuvem.copiarCodigo('${esc(m.id)}')">Copiar</button></div>
    <div class="nv-cab-acoes">
      <button class="small" onclick="nuvem.renomearCampanha()">Renomear</button>
      <button class="small danger" onclick="nuvem.apagarCampanha()">Apagar</button>
    </div>
  </div>`;
}

function renderJogadoresGM() {
  const box = el('nvJogadoresGM'); if (!box) return;
  if (!campanhaAberta || campanhaAberta.papel !== 'gm') { box.innerHTML = ''; return; }
  const code = campanhaAberta.id;
  const lista = [...membros.entries()];
  const chips = lista.map(([uid, m]) => {
    const n = [...pool.values()].filter(o => o._owner === uid).length;
    return `<div class="nv-membro">${avatarHtml(m)}<span><strong>${esc(m.nome || 'Jogador')}</strong><small>${n === 1 ? '1 ficha' : `${n} fichas`}</small></span>
      <button class="nv-membro-x" title="Remover da campanha" onclick="nuvem.removerJogador('${esc(uid)}')">&times;</button></div>`;
  }).join('');
  const fichas = characters.filter(c => c._remote).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const cards = fichas.map(ch => {
    const m = membros.get(ch._owner);
    const dono = m ? `${avatarHtml(m, 'nv-avatar-sm')} ${esc(m.nome)}` : esc(ch._ownerName || '');
    return cardFicha(ch, `
      <button class="small primary" onclick="nuvem.verFicha('${esc(ch.id)}','gm')">Abrir ficha</button>
      <button class="small ghost" onclick="nuvem.tirarFichaDoJogador('${esc(ch._docId)}')">Tirar da campanha</button>`, dono);
  }).join('');
  box.innerHTML = `
    <div class="card">
      <div class="nv-titulo-linha"><h2>Jogadores <span class="nv-contador">${lista.length}</span></h2><span class="nv-ao-vivo"><i></i>ao vivo</span></div>
      ${lista.length ? `<div class="nv-membros">${chips}</div>` : `<p class="nv-nota">Ninguém entrou ainda. Passe o código <strong class="nv-codigo-mini">${esc(code)}</strong> para os jogadores: eles clicam em Campanhas, colam o código e enviam a ficha.</p>`}
    </div>
    <div class="card">
      <h2>Fichas na campanha <span class="nv-contador">${fichas.length}</span></h2>
      ${fichas.length ? `<div class="nv-fichas-grid">${cards}</div>` : '<p class="nv-nota">Nenhuma ficha enviada ainda. As fichas também aparecem na aba Encontro.</p>'}
    </div>`;
}

function renderCampanhaJogador() {
  const box = el('nvCampanhaJogadorConteudo'); if (!box || !campanhaAberta) return;
  const p = participacoes.find(x => x.id === campanhaAberta.id);
  if (!p) { box.innerHTML = ''; return; }
  const minhas = ownChars().filter(c => c.mesaCode === p.id);
  const livres = ownChars().filter(c => !c.mesaCode);
  const outrosMembros = [...membros.entries()];
  const cards = minhas.map(ch => cardFicha(ch, `
      <button class="small primary" onclick="nuvem.verFicha('${esc(ch.id)}','jogador')">Abrir ficha</button>
      <button class="small ghost" onclick="nuvem.tirarFicha('${esc(ch.id)}')">Tirar da campanha</button>`)).join('');
  box.innerHTML = `
    <div class="card nv-cab">
      <button class="ghost small" onclick="nuvem.abrirCampanhas()">&larr; Campanhas</button>
      <div class="nv-cab-titulo"><span class="nv-cab-rotulo">Campanha</span><h3>${esc(p.name || p.id)}</h3>
        <p class="nv-camp-mestre">Mestre: ${avatarHtml({ nome: p.gmName, avatar: p.gmAvatar, foto: p.gmFoto }, 'nv-avatar-sm')} ${esc(p.gmName || '—')}</p></div>
      <div class="nv-cab-acoes"><button class="small danger" onclick="nuvem.sairDaCampanha('${esc(p.id)}')">Sair da campanha</button></div>
    </div>
    <div class="card">
      <h2>Suas fichas nesta campanha <span class="nv-contador">${minhas.length}</span></h2>
      <p class="nv-nota nv-nota-topo">Só você e o mestre veem estas fichas. O mestre pode aplicar dano e mudanças durante a sessão, e tudo aparece aqui em tempo real.</p>
      ${minhas.length ? `<div class="nv-fichas-grid">${cards}</div>` : '<p class="nv-nota">Você ainda não enviou nenhuma ficha.</p>'}
      <div class="nv-enviar-linha">
        ${livres.length ? `<select id="nvEnviarSelect">${livres.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select>
        <button class="primary small" onclick="nuvem.enviarFicha(document.getElementById('nvEnviarSelect').value,'${esc(p.id)}')">Enviar ficha</button>`
      : `<p class="nv-nota">${ownChars().length ? 'Todas as suas fichas já estão em alguma campanha.' : 'Crie uma ficha em Soldados para enviar aqui.'}</p>`}
      </div>
    </div>
    <div class="card">
      <h2>Participantes <span class="nv-contador">${outrosMembros.length}</span></h2>
      <div class="nv-membros">${outrosMembros.map(([uid, m]) => `<div class="nv-membro">${avatarHtml(m)}<span><strong>${esc(m.nome || 'Jogador')}${uid === user.uid ? ' (você)' : ''}</strong></span></div>`).join('')}</div>
    </div>`;
}

function renderSheetMesa() {
  const box = el('nuvemSheetMesa'); if (!box) return;
  const ch = typeof getCurrentChar === 'function' ? getCurrentChar() : null;
  if (!CONFIGURADO || !ch) { box.innerHTML = ''; box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  if (!user) {
    box.innerHTML = `<div class="nv-linha"><p class="nv-nota">Esta ficha está salva só neste navegador.</p><button class="small" onclick="nuvem.abrirLogin()">Entrar para salvar na nuvem</button></div>`;
    return;
  }
  if (ch._remote) {
    const m = membros.get(ch._owner);
    box.innerHTML = `<div class="nv-linha"><span class="nv-selo">Ficha de jogador</span><p>${m ? `${avatarHtml(m, 'nv-avatar-sm')} <strong>${esc(m.nome)}</strong> · ` : ''}suas alterações vão direto para a ficha dele, em tempo real.</p></div>`;
    return;
  }
  if (ch.mesaCode) {
    const p = participacoes.find(x => x.id === ch.mesaCode);
    box.innerHTML = `<div class="nv-linha"><span class="nv-selo">Campanha</span><p><strong>${esc((p && p.name) || ch.mesaNome || ch.mesaCode)}</strong>${(p && p.gmName) || ch.mesaGmNome ? ` · mestre ${esc((p && p.gmName) || ch.mesaGmNome)}` : ''}. Só você e o mestre veem esta ficha.</p>
      ${p ? `<button class="small" onclick="nuvem.abrirCampanhaJogador('${esc(p.id)}')">Ver campanha</button>` : ''}
      <button class="small ghost" onclick="nuvem.tirarFicha('${esc(ch.id)}')">Tirar da campanha</button></div>`;
    return;
  }
  const ativas = participacoes.filter(p => !p.removida);
  box.innerHTML = `<div class="nv-linha"><span class="nv-selo nv-selo-apagado">Sem campanha</span>
    ${ativas.length ? `<select id="nvFichaCampSelect">${ativas.map(p => `<option value="${esc(p.id)}">${esc(p.name || p.id)}</option>`).join('')}</select>
      <button class="small primary" onclick="nuvem.enviarFicha('${esc(ch.id)}', document.getElementById('nvFichaCampSelect').value)">Enviar para o mestre</button>
      <span class="nv-ou">ou</span>` : ''}
    <input id="nvFichaCodigo" class="nv-input-codigo" placeholder="Código da campanha" maxlength="12" autocomplete="off" />
    <button class="small ${ativas.length ? '' : 'primary'}" onclick="nuvem.entrarComCodigo(document.getElementById('nvFichaCodigo').value, '${esc(ch.id)}')">Entrar e enviar</button></div>`;
}

// ------------------------------------------------------------
// Modais (login e perfil)
// ------------------------------------------------------------
function montarModais() {
  const x = `<svg viewBox="0 0 24 24" width="14" height="14" style="display:block;"><line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
  <div id="nvLoginModal" class="modal-overlay hidden">
    <div class="modal nv-modal-login">
      <button class="modal-close" onclick="nuvem.fecharLogin()">${x}</button>
      <h2>Sua conta</h2>
      <p class="nv-nota nv-nota-topo">Com uma conta, suas fichas ficam salvas na nuvem e você pode entrar em campanhas.</p>
      <button class="nv-google" onclick="nuvem.entrarGoogle()">
        <svg viewBox="0 0 48 48" width="18" height="18"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        Continuar com Google</button>
      <div class="nv-divisor"><span>ou com e-mail</span></div>
      <div class="tabs nv-login-abas">
        <button class="tab active" data-aba="entrar" onclick="nuvem.trocarAbaLogin('entrar')">Entrar</button>
        <button class="tab" data-aba="criar" onclick="nuvem.trocarAbaLogin('criar')">Criar conta</button>
      </div>
      <form id="nvLoginForm" class="nv-form" novalidate onsubmit="nuvem.enviarLoginEmail(event)">
        <div id="nvLoginApelidoWrap" class="hidden"><label for="nvLoginApelido">Apelido</label><input id="nvLoginApelido" maxlength="30" autocomplete="nickname" /></div>
        <label for="nvLoginEmail">E-mail</label><input id="nvLoginEmail" type="email" autocomplete="email" required />
        <label for="nvLoginSenha">Senha</label><input id="nvLoginSenha" type="password" minlength="6" autocomplete="current-password" required />
        <p id="nvLoginErro" class="nv-erro" role="alert"></p>
        <div class="nv-form-acoes">
          <button type="button" id="nvLoginEsqueci" class="nv-link" onclick="nuvem.esqueciSenha()">Esqueci minha senha</button>
          <button type="submit" id="nvLoginEnviar" class="primary">Entrar</button>
        </div>
      </form>
    </div>
  </div>
  <div id="nvPerfilModal" class="modal-overlay hidden">
    <div class="modal nv-modal-perfil">
      <button id="nvPerfilFechar" class="modal-close" onclick="document.getElementById('nvPerfilModal').classList.add('hidden')">${x}</button>
      <h2 id="nvPerfilTitulo">Seu perfil</h2>
      <p id="nvPerfilSub" class="nv-nota nv-nota-topo"></p>
      <label for="nvPerfilNome">Apelido</label>
      <input id="nvPerfilNome" maxlength="30" autocomplete="nickname" onkeydown="if(event.key==='Enter')nuvem.confirmarPerfil()" />
      <label>Avatar</label>
      <div id="nvPerfilAvatares" class="nv-avatares"></div>
      <div class="modal-actions">
        <button id="nvPerfilCancelar" onclick="document.getElementById('nvPerfilModal').classList.add('hidden')">Cancelar</button>
        <button id="nvPerfilSalvar" class="primary" onclick="nuvem.confirmarPerfil()">Salvar</button>
      </div>
    </div>
  </div>`;
  while (wrap.firstElementChild) document.body.appendChild(wrap.firstElementChild);
}

// ------------------------------------------------------------
// Ligação
// ------------------------------------------------------------
['screenCampanhas', 'screenCampanhaJogador'].forEach(id => { if (!ALL_TOP_SCREENS.includes(id)) ALL_TOP_SCREENS.push(id); });
montarModais();

window.nuvem = {
  abrirLogin, fecharLogin, trocarAbaLogin, entrarGoogle, enviarLoginEmail, esqueciSenha,
  abrirPerfil: () => abrirPerfil(false), confirmarPerfil, menuConta,
  sair: () => showConfirm('Sair da conta? Suas fichas continuam salvas na nuvem e voltam quando você entrar de novo.', () => sairDaConta()),
  trocarConta: () => showConfirm('Trocar de conta? Você sai desta e escolhe outra em seguida. Nada é perdido.', () => sairDaConta('trocar')),
  abrirCampanhas, abrirCampanhaGM, abrirCampanhaJogador, escudoAvulso: abrirEscudoAvulso,
  criarCampanha, entrarComCodigo, enviarFicha, tirarFicha, sairDaCampanha,
  renomearCampanha, apagarCampanha, removerJogador, tirarFichaDoJogador, copiarCodigo,
  verFicha: abrirFicha, renderJogadores: renderJogadoresGM
};

if (CONFIGURADO) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  getRedirectResult(auth).catch(e => avisar('Não foi possível entrar', erroTexto(e), true));
  onAuthStateChanged(auth, async u => {
    if (saindo) return;
    if (u) {
      if (user && user.uid === u.uid) return;
      if (criandoConta && !perfil) {
        // conta nova por e-mail: já cria o perfil com o apelido digitado
        const apelido = criandoConta; criandoConta = false;
        user = u;
        try { await setDoc(doc(db, 'perfis', u.uid), { nome: apelido, avatar: AVATARES[0], foto: '', atualizadoEm: Date.now() }); } catch (e) { }
      }
      startSession(u);
    } else {
      user = null; perfil = null; ready = false; carregando = false;
      setStatus('off');
      renderTudo();
      if (sessionStorage.getItem('coordNuvemAbrirLogin')) { sessionStorage.removeItem('coordNuvemAbrirLogin'); abrirLogin(); }
    }
  });
} else {
  console.warn('[nuvem] firebase-config.js ainda não foi preenchido: site funcionando só no navegador.');
}
renderConta();
renderCharList();
