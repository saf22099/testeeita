// ============================================================
// NUVEM — login com Google + salvamento no Firestore + mesas
// Carregado depois do script.js. Sem login, o site continua
// funcionando só com o armazenamento do navegador, como antes.
// ============================================================
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, collection,
  query, where, onSnapshot, writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const CONFIGURADO = firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).includes('COLE');

const STATE_KEYS = ['rpgCustomOrigins', 'rpgCustomTitans', 'rpgGMTitans', 'rpgGMInitiative',
  'rpgGMActiveBiomas', 'rpgGMPrimordialTitans', 'rpgGMHiddenSoldiers', 'rpgGMHiddenTitans'];
const CHARS_KEY = 'rpgChars';
const LS_UID = 'coordNuvemUid';
const LS_KNOWN = 'coordNuvemConhecidas';
const LS_PENDING = 'coordNuvemPendente';
const LS_MESA = 'coordNuvemMesaAtiva';
const CHUNK = 350000;          // tamanho de cada pedaço dos dados do escudo
const MAX_IMG = 150000;        // imagens maiores que isso são reduzidas antes de subir
const MAX_DOC = 1000000;       // limite do Firestore por documento (~1 MB)

let app, auth, db;
let user = null;
let ready = false;
let suppress = false;
const lastSynced = new Map();      // docId -> string JSON enviada/recebida por último
const stateChunkCount = {};
const dirtyState = new Set(JSON.parse(localStorage.getItem(LS_PENDING) || '[]'));
let stateTimer = null, charsTimer = null;
let charsDirty = false, pushingChars = false, pushAgain = false;
let unsubOwn = null, unsubMesa = null;
let minhasMesas = [];
let mesaAtiva = localStorage.getItem(LS_MESA) || '';
let pendingSheetRefresh = null;
let status = 'off';

// ------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------
const origSetItem = Storage.prototype.setItem;
function lsSet(k, v) { suppress = true; try { origSetItem.call(localStorage, k, v); } finally { suppress = false; } }
function ownChars() { return characters.filter(c => !c._remote); }
function cleanChar(ch) { const o = {}; for (const k in ch) if (!k.startsWith('_')) o[k] = ch[k]; return o; }
function ownDocId(ch) { return user.uid + '_' + ch.id; }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function avisar(t, m, erro) { if (typeof showNotification === 'function') showNotification(t, m || '', erro); }
function isVisible(id) { const el = document.getElementById(id); return el && !el.classList.contains('hidden'); }
function savePending() { lsSet(LS_PENDING, JSON.stringify([...dirtyState])); }
function setStatus(s) { status = s; renderConta(); }

// Reduz imagens base64 grandes (retratos etc.) pra caber no limite do Firestore
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
// Interceptar salvamentos do site
// ------------------------------------------------------------
Storage.prototype.setItem = function (k, v) {
  origSetItem.call(this, k, v);
  if (this === window.localStorage && !suppress && STATE_KEYS.includes(k) && user) {
    dirtyState.add(k); savePending();
    if (ready) { clearTimeout(stateTimer); stateTimer = setTimeout(pushState, 1500); setStatus('saving'); }
  }
};

window.saveChars = function () {
  try { lsSet(CHARS_KEY, JSON.stringify(ownChars())); }
  catch (e) { if (!user) throw e; /* logado: a nuvem guarda mesmo se o navegador encher */ }
  if (ready && user) {
    charsDirty = true; setStatus('saving');
    clearTimeout(charsTimer); charsTimer = setTimeout(pushChars, 1200);
  }
};

// Mestre não vê as fichas dos jogadores misturadas na lista "Soldados" dele
const origRenderCharList = window.renderCharList;
window.renderCharList = function () {
  const all = characters;
  characters = all.filter(c => !c._remote);
  try { origRenderCharList(); } finally { characters = all; }
};

const origOpenChar = window.openChar;
window.openChar = function (id) {
  origOpenChar(id);
  renderSheetMesa();
};

const origOpenEscudo = window.openEscudoDoMestre;
window.openEscudoDoMestre = function () {
  origOpenEscudo();
  renderEscudoMesa();
};

// Salva na hora quando a pessoa sai da aba
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && ready && user) {
    if (charsDirty) { clearTimeout(charsTimer); pushChars(); }
    if (dirtyState.size) { clearTimeout(stateTimer); pushState(); }
  }
});

// ------------------------------------------------------------
// Envio para a nuvem
// ------------------------------------------------------------
async function pushChars() {
  if (!user || !ready) return;
  if (pushingChars) { pushAgain = true; return; }
  pushingChars = true; charsDirty = false;
  let erro = false;
  try {
    const seen = new Set();
    for (const ch of [...characters]) {
      const id = ch._remote ? ch._docId : ownDocId(ch);
      seen.add(id);
      await compressImagesIn(ch);
      const data = JSON.stringify(cleanChar(ch));
      if (lastSynced.get(id) === data) continue;
      if (data.length > MAX_DOC) {
        erro = true;
        avisar('Ficha grande demais para a nuvem', `"${esc(ch.name)}" passou de 1 MB. Tente usar imagens menores.`, true);
        continue;
      }
      const prev = lastSynced.get(id);
      lastSynced.set(id, data);
      const payload = {
        owner: ch._remote ? ch._owner : user.uid,
        mesaId: ch.mesaCode || '', mesaGm: ch.mesaGm || '',
        name: ch.name || '', updatedAt: Date.now(), data
      };
      try { await setDoc(doc(db, 'chars', id), payload); }
      catch (e) {
        erro = true; console.error(e);
        if (prev === undefined) lastSynced.delete(id); else lastSynced.set(id, prev);
        avisar('Erro ao salvar na nuvem', esc(e.code || e.message), true);
      }
    }
    // Fichas apagadas
    for (const id of [...lastSynced.keys()]) {
      if (id.startsWith(user.uid + '_') && !seen.has(id)) {
        lastSynced.delete(id);
        try { await deleteDoc(doc(db, 'chars', id)); } catch (e) { console.error(e); }
      }
    }
    try { lsSet(CHARS_KEY, JSON.stringify(ownChars())); } catch (e) { }
    saveKnown();
  } finally {
    pushingChars = false;
    if (pushAgain) { pushAgain = false; pushChars(); }
    else setStatus(erro ? 'error' : (dirtyState.size ? 'saving' : 'ok'));
  }
}

function saveKnown() {
  const ids = ownChars().filter(c => lastSynced.has(ownDocId(c))).map(c => c.id);
  lsSet(LS_KNOWN, JSON.stringify(ids));
}

async function writeStateKey(key, raw) {
  const parts = [];
  for (let i = 0; i < raw.length; i += CHUNK) parts.push(raw.slice(i, i + CHUNK));
  if (!parts.length) parts.push('');
  const v = Date.now();
  const batch = writeBatch(db);
  parts.forEach((s, i) => batch.set(doc(db, 'users', user.uid, 'state', `${key}__${i}`), { key, i, n: parts.length, v, s }));
  const old = stateChunkCount[key] || 0;
  for (let i = parts.length; i < old; i++) batch.delete(doc(db, 'users', user.uid, 'state', `${key}__${i}`));
  await batch.commit();
  stateChunkCount[key] = parts.length;
}

async function pushState() {
  if (!user || !ready) return;
  let erro = false;
  for (const key of [...dirtyState]) {
    let raw = localStorage.getItem(key);
    if (raw == null) { dirtyState.delete(key); continue; }
    try { const obj = JSON.parse(raw); await compressImagesIn(obj); raw = JSON.stringify(obj); } catch (e) { }
    try { await writeStateKey(key, raw); dirtyState.delete(key); }
    catch (e) { erro = true; console.error(e); avisar('Erro ao salvar o escudo na nuvem', esc(e.code || e.message), true); }
  }
  savePending();
  setStatus(erro ? 'error' : (charsDirty ? 'saving' : 'ok'));
}

async function readCloudState() {
  const snap = await getDocs(collection(db, 'users', user.uid, 'state'));
  const byKey = {};
  snap.forEach(d => { const x = d.data(); (byKey[x.key] ||= []).push(x); });
  const out = {};
  for (const [key, arr] of Object.entries(byKey)) {
    stateChunkCount[key] = Math.max(...arr.map(a => a.i)) + 1;
    const head = arr.find(a => a.i === 0); if (!head) continue;
    const parts = arr.filter(a => a.v === head.v).sort((a, b) => a.i - b.i);
    if (parts.length !== head.n) continue;
    out[key] = parts.map(p => p.s).join('');
  }
  return out;
}

// Coloca um valor vindo da nuvem direto nas variáveis do script.js
function applyState(key, str) {
  lsSet(key, str);
  let val; try { val = JSON.parse(str); } catch (e) { return; }
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

// ------------------------------------------------------------
// Início de sessão: junta o que está no navegador com a nuvem
// ------------------------------------------------------------
async function startSession(u) {
  user = u; ready = false; setStatus('saving');
  const storedUid = localStorage.getItem(LS_UID);
  const outraConta = storedUid && storedUid !== u.uid;
  if (outraConta) { dirtyState.clear(); mesaAtiva = ''; }

  try {
    // Fichas
    const cloudSnap = await getDocs(query(collection(db, 'chars'), where('owner', '==', u.uid)));
    const cloud = new Map();
    cloudSnap.forEach(d => cloud.set(d.id, d.data().data));
    const known = new Set(storedUid === u.uid ? JSON.parse(localStorage.getItem(LS_KNOWN) || '[]') : []);
    const localList = outraConta ? [] : ownChars();
    const merged = [];
    const usados = new Set();
    for (const lc of localList) {
      const id = ownDocId(lc);
      if (cloud.has(id)) {
        const str = cloud.get(id);
        lastSynced.set(id, str);
        const cc = JSON.parse(str);
        const ls = JSON.stringify(cleanChar(lc));
        merged.push(ls !== str && (lc.updatedAt || '') < (cc.updatedAt || '') ? cc : lc);
        usados.add(id);
      } else if (!known.has(lc.id)) {
        merged.push(lc); // só existe aqui: vai subir
      } // senão: foi apagada em outro aparelho
    }
    for (const [id, str] of cloud) {
      if (usados.has(id)) continue;
      lastSynced.set(id, str);
      try { merged.push(JSON.parse(str)); } catch (e) { }
    }
    characters = merged;
    lsSet(CHARS_KEY, JSON.stringify(merged));

    // Escudo do mestre e conteúdo customizado
    const cloudState = await readCloudState();
    for (const key of STATE_KEYS) {
      const localVal = outraConta ? null : localStorage.getItem(key);
      if (dirtyState.has(key) && localVal != null) continue;           // mudança local ainda não enviada
      if (cloudState[key] != null) { if (localVal !== cloudState[key]) applyState(key, cloudState[key]); }
      else if (localVal != null) dirtyState.add(key);                  // primeira vez: sobe o que já existia
      else if (outraConta) applyState(key, '[]');
    }
    savePending();
    lsSet(LS_UID, u.uid);

    // Mesas que eu mestro
    const ms = await getDocs(query(collection(db, 'mesas'), where('gm', '==', u.uid)));
    minhasMesas = []; ms.forEach(d => minhasMesas.push({ id: d.id, ...d.data() }));
    minhasMesas.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    if (mesaAtiva && !minhasMesas.some(m => m.id === mesaAtiva)) mesaAtiva = '';
    if (!mesaAtiva && minhasMesas.length === 1) mesaAtiva = minhasMesas[0].id; // só tem uma: já abre ela
    lsSet(LS_MESA, mesaAtiva);

    ready = true;
    refreshAll();
    await pushChars();
    if (dirtyState.size) await pushState();
    listenOwn();
    listenMesa(mesaAtiva);
    setStatus('ok');
  } catch (e) {
    console.error(e);
    setStatus('error');
    avisar('Não consegui conectar à nuvem', 'Confira as regras do Firestore e o domínio autorizado. Detalhe: ' + esc(e.code || e.message), true);
  }
}

function refreshAll() {
  if (isVisible('screenHome')) renderCharList();
  refreshEncontroIfVisible();
  renderConta(); renderEscudoMesa(); renderSheetMesa();
}

// ------------------------------------------------------------
// Tempo real
// ------------------------------------------------------------
function listenOwn() {
  unsubOwn?.();
  unsubOwn = onSnapshot(query(collection(db, 'chars'), where('owner', '==', user.uid)), snap => {
    const touched = new Set(); let changed = false;
    snap.docChanges().forEach(c => {
      const id = c.doc.id; const x = c.doc.data();
      if (c.type === 'removed') {
        if (lastSynced.has(id)) {
          lastSynced.delete(id);
          const cid = id.slice(user.uid.length + 1);
          characters = characters.filter(ch => ch._remote || ch.id !== cid);
          changed = true;
        }
        return;
      }
      if (lastSynced.get(id) === x.data) return;
      if (temMudancaLocal(characters.find(ch => !ch._remote && ownDocId(ch) === id), id)) return;
      let obj; try { obj = JSON.parse(x.data); } catch (e) { return; }
      lastSynced.set(id, x.data);
      const i = characters.findIndex(ch => !ch._remote && ch.id === obj.id);
      if (i >= 0) characters[i] = obj; else characters.push(obj);
      touched.add(obj.id); changed = true;
    });
    if (changed) { try { lsSet(CHARS_KEY, JSON.stringify(ownChars())); } catch (e) { } afterRemoteChange(touched); }
  }, e => { console.error(e); setStatus('error'); });
}

// A ficha tem alteração feita aqui que ainda não subiu? Então não sobrescreve.
function temMudancaLocal(ch, id) {
  if (!ch || !lastSynced.has(id)) return false;
  return JSON.stringify(cleanChar(ch)) !== lastSynced.get(id);
}

function removeRemoteChars() {
  characters.filter(c => c._remote).forEach(c => lastSynced.delete(c._docId));
  characters = characters.filter(c => !c._remote);
}

function listenMesa(code) {
  unsubMesa?.(); unsubMesa = null;
  removeRemoteChars();
  afterRemoteChange(new Set());
  if (!code || !user) return;
  unsubMesa = onSnapshot(query(collection(db, 'chars'), where('mesaGm', '==', user.uid), where('mesaId', '==', code)), snap => {
    const touched = new Set(); let changed = false;
    snap.docChanges().forEach(c => {
      const id = c.doc.id; const x = c.doc.data();
      if (x.owner === user.uid) return; // ficha do próprio mestre já está na lista dele
      if (c.type === 'removed') {
        characters = characters.filter(ch => ch._docId !== id); lastSynced.delete(id); changed = true; return;
      }
      if (lastSynced.get(id) === x.data) return;
      if (temMudancaLocal(characters.find(ch => ch._docId === id), id)) return;
      let obj; try { obj = JSON.parse(x.data); } catch (e) { return; }
      Object.assign(obj, { _remote: true, _docId: id, _owner: x.owner });
      lastSynced.set(id, x.data);
      const i = characters.findIndex(ch => ch._docId === id);
      if (i >= 0) characters[i] = obj; else characters.push(obj);
      touched.add(obj.id); changed = true;
    });
    if (changed) afterRemoteChange(touched);
  }, e => { console.error(e); avisar('Erro ao ler a mesa', esc(e.code || e.message), true); });
}

function afterRemoteChange(touched) {
  if (isVisible('screenHome')) renderCharList();
  refreshEncontroIfVisible();
  renderEscudoMesa();
  if (currentCharId && touched.has(currentCharId)) refreshOpenSheet(currentCharId);
}

function refreshOpenSheet(id) {
  if (currentCharId !== id || !isVisible('screenSheet')) return;
  const a = document.activeElement;
  if (a && a.closest && a.closest('#screenSheet') && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) { pendingSheetRefresh = id; return; }
  const y = window.scrollY;
  const activeTab = document.querySelector('#screenSheet .tab.active');
  window.openChar(id);
  if (activeTab) activeTab.click();
  window.scrollTo(0, y);
}
document.addEventListener('focusout', () => setTimeout(() => {
  if (pendingSheetRefresh) { const id = pendingSheetRefresh; pendingSheetRefresh = null; refreshOpenSheet(id); }
}, 300));

// ------------------------------------------------------------
// Mesas
// ------------------------------------------------------------
function gerarCodigo() {
  const al = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = ''; const r = crypto.getRandomValues(new Uint32Array(6));
  for (const n of r) s += al[n % al.length];
  return s;
}

async function criarMesa() {
  if (!user) return;
  const nome = (prompt('Nome da mesa (ex.: Campanha Liandry):') || '').trim();
  if (!nome) return;
  for (let t = 0; t < 5; t++) {
    const code = gerarCodigo();
    const ref = doc(db, 'mesas', code);
    const ex = await getDoc(ref).catch(() => null);
    if (ex && ex.exists()) continue;
    try {
      const m = { gm: user.uid, name: nome, gmName: user.displayName || '', createdAt: Date.now() };
      await setDoc(ref, m);
      minhasMesas.push({ id: code, ...m });
      selecionarMesa(code);
      avisar('Mesa criada', `Passe o código ${code} para os jogadores.`);
      return;
    } catch (e) { avisar('Erro ao criar mesa', esc(e.code || e.message), true); return; }
  }
}

function selecionarMesa(code) {
  mesaAtiva = code || '';
  lsSet(LS_MESA, mesaAtiva);
  listenMesa(mesaAtiva);
  renderEscudoMesa();
}

function apagarMesa(code) {
  const m = minhasMesas.find(x => x.id === code); if (!m) return;
  showConfirm(`Apagar a mesa "${m.name}"? As fichas dos jogadores não são apagadas, só deixam de aparecer para você.`, async () => {
    try {
      await deleteDoc(doc(db, 'mesas', code));
      minhasMesas = minhasMesas.filter(x => x.id !== code);
      if (mesaAtiva === code) selecionarMesa('');
      renderEscudoMesa();
    } catch (e) { avisar('Erro ao apagar mesa', esc(e.code || e.message), true); }
  });
}

async function entrarNaMesa(charId, codeRaw) {
  const code = String(codeRaw || '').trim().toUpperCase();
  const ch = characters.find(c => c.id === charId && !c._remote);
  if (!ch || !code) return;
  try {
    const snap = await getDoc(doc(db, 'mesas', code));
    if (!snap.exists()) { avisar('Mesa não encontrada', 'Confira o código com o mestre.', true); return; }
    const m = snap.data();
    ch.mesaCode = code; ch.mesaGm = m.gm; ch.mesaNome = m.name || code; ch.mesaGmNome = m.gmName || '';
    ch.updatedAt = new Date().toISOString();
    window.saveChars();
    renderSheetMesa();
    avisar('Ficha enviada', `Agora o mestre da mesa "${esc(ch.mesaNome)}" vê esta ficha.`);
  } catch (e) { avisar('Erro ao entrar na mesa', esc(e.code || e.message), true); }
}

function sairDaMesa(charId) {
  const ch = characters.find(c => c.id === charId && !c._remote);
  if (!ch) return;
  showConfirm(`Tirar "${ch.name}" da mesa "${ch.mesaNome || ch.mesaCode}"? O mestre deixa de ver a ficha.`, () => {
    delete ch.mesaCode; delete ch.mesaGm; delete ch.mesaNome; delete ch.mesaGmNome;
    ch.updatedAt = new Date().toISOString();
    window.saveChars();
    renderSheetMesa();
  });
}

function verFichaJogador(id) {
  hideAllTopScreens();
  document.getElementById('appHeaderActions').classList.remove('hidden');
  window.openChar(id);
}

// ------------------------------------------------------------
// Interface
// ------------------------------------------------------------
function renderConta() {
  const el = document.getElementById('nuvemConta'); if (!el) return;
  if (!CONFIGURADO) { el.innerHTML = ''; return; }
  if (!user) {
    el.innerHTML = `<button class="ghost" onclick="nuvem.entrar()">Entrar com Google</button>`;
    return;
  }
  const txt = { ok: 'Salvo na nuvem', saving: 'Salvando…', error: 'Erro ao salvar', off: '' }[status] || '';
  const foto = user.photoURL ? `<img src="${esc(user.photoURL)}" alt="" referrerpolicy="no-referrer" class="nuvem-avatar" />` : '';
  const nome = esc((user.displayName || user.email || '').split(' ')[0]);
  el.innerHTML = `<span class="nuvem-user">${foto}<span><strong>${nome}</strong><small class="nuvem-status nuvem-${status}">${txt}</small></span></span>
    <button class="small" onclick="nuvem.sair()">Sair</button>`;
}

function renderSheetMesa() {
  const el = document.getElementById('nuvemSheetMesa'); if (!el) return;
  const ch = typeof getCurrentChar === 'function' ? getCurrentChar() : null;
  if (!CONFIGURADO || !ch) { el.innerHTML = ''; el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  if (!user) {
    el.innerHTML = `<p class="nuvem-note">Entre com Google (no topo da página) para salvar esta ficha na nuvem e enviá-la para um mestre.</p>`;
    return;
  }
  if (ch._remote) {
    el.innerHTML = `<p class="nuvem-note">Ficha de um jogador da sua mesa. Suas alterações são salvas na ficha dele.</p>`;
    return;
  }
  if (ch.mesaCode) {
    el.innerHTML = `<div class="nuvem-row"><p>Na mesa <strong>${esc(ch.mesaNome || ch.mesaCode)}</strong>${ch.mesaGmNome ? ` de ${esc(ch.mesaGmNome)}` : ''}. Só você e o mestre veem esta ficha.</p>
      <button class="small danger" onclick="nuvem.sairDaMesa('${esc(ch.id)}')">Sair da mesa</button></div>`;
    return;
  }
  el.innerHTML = `<div class="nuvem-row"><p>Enviar para o mestre:</p>
    <input id="nuvemCodigoMesa" placeholder="Código da mesa" maxlength="12" autocomplete="off" />
    <button class="small primary" onclick="nuvem.entrarNaMesa('${esc(ch.id)}', document.getElementById('nuvemCodigoMesa').value)">Entrar na mesa</button></div>`;
}

function renderEscudoMesa() {
  const el = document.getElementById('nuvemEscudoMesa'); if (!el) return;
  if (!CONFIGURADO) { el.innerHTML = ''; el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  if (!user) {
    el.innerHTML = `<p class="nuvem-note">Entre com Google (no topo da página) para criar uma mesa e receber as fichas dos jogadores aqui.</p>`;
    return;
  }
  const opts = minhasMesas.map(m => `<option value="${esc(m.id)}" ${m.id === mesaAtiva ? 'selected' : ''}>${esc(m.name)} (${esc(m.id)})</option>`).join('');
  let html = `<div class="nuvem-row">
    <label for="nuvemMesaSelect">Mesa</label>
    <select id="nuvemMesaSelect" onchange="nuvem.selecionarMesa(this.value)">
      <option value="">— nenhuma —</option>${opts}
    </select>
    <button class="small primary" onclick="nuvem.criarMesa()">Nova mesa</button>
    ${mesaAtiva ? `<button class="small danger" onclick="nuvem.apagarMesa('${esc(mesaAtiva)}')">Apagar mesa</button>` : ''}
  </div>`;
  if (mesaAtiva) {
    const remotos = characters.filter(c => c._remote);
    html += `<div class="nuvem-codigo">Código para os jogadores: <strong>${esc(mesaAtiva)}</strong>
      <button class="small" onclick="navigator.clipboard.writeText('${esc(mesaAtiva)}').then(()=>showNotification('Código copiado',''))">Copiar</button></div>`;
    html += remotos.length
      ? `<div class="nuvem-jogadores">${remotos.map(c => `<button class="small" onclick="nuvem.verFicha('${esc(c.id)}')">${esc(c.name)}${c.player ? ` <span>(${esc(c.player)})</span>` : ''}</button>`).join('')}</div>
         <p class="nuvem-note">As fichas também aparecem na aba Encontro. Clique num nome para abrir a ficha completa.</p>`
      : `<p class="nuvem-note">Nenhum jogador enviou ficha ainda. Eles abrem a ficha, digitam o código e clicam em "Entrar na mesa".</p>`;
  }
  el.innerHTML = html;
}

// ------------------------------------------------------------
// Ligação
// ------------------------------------------------------------
window.nuvem = {
  entrar: async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e) {
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
      avisar('Não foi possível entrar', e.code === 'auth/unauthorized-domain'
        ? 'Este domínio não está autorizado no Firebase (Authentication > Configurações > Domínios autorizados).'
        : esc(e.code || e.message), true);
    }
  },
  sair: () => showConfirm('Sair da conta? Suas fichas continuam salvas na nuvem e voltam quando você entrar de novo.', async () => {
    if (charsDirty) await pushChars();
    if (dirtyState.size) await pushState();
    unsubOwn?.(); unsubMesa?.();
    await signOut(auth);
    Object.keys(localStorage).filter(k => k.startsWith('rpg') || k.startsWith('coordNuvem')).forEach(k => localStorage.removeItem(k));
    location.reload();
  }),
  criarMesa, selecionarMesa, apagarMesa, entrarNaMesa, sairDaMesa,
  verFicha: verFichaJogador
};

if (CONFIGURADO) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  onAuthStateChanged(auth, u => {
    if (u) startSession(u);
    else { user = null; ready = false; setStatus('off'); renderEscudoMesa(); renderSheetMesa(); }
  });
} else {
  console.warn('[nuvem] firebase-config.js ainda não foi preenchido — site funcionando só no navegador.');
}
renderConta();
