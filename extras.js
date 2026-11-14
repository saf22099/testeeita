/* ============================================================
   EXTRAS — rolagem de dados, DMT aprimorado, sistema de XP,
   configurações da ficha e fichas oficiais do livro.
   Carregado depois do script.js e antes do nuvem.js.
   ============================================================ */

/* ------------------------------------------------------------
   Utilidades
   ------------------------------------------------------------ */
const ATRIB_NOMES = { agi: 'Agilidade', sta: 'Estâmina', str: 'Força', int: 'Intelecto', vit: 'Vitalidade' };
const ATRIB_POR_NOME = {
  agilidade: 'agi', estamina: 'sta', estâmina: 'sta', forca: 'str', força: 'str',
  intelecto: 'int', vitalidade: 'vit'
};
function exEsc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function exFicha() { return typeof getCurrentChar === 'function' ? getCurrentChar() : null; }
function exAviso(t, m, erro) { if (typeof showNotification === 'function') showNotification(t, m || '', !!erro); }
function exSalvar() { const ch = exFicha(); if (ch) { ch.updatedAt = new Date().toISOString(); saveChars(); } }
function exSemAcento(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
function exValorAtributo(ch, k) { return (ch.attributes?.[k] || 0) + (ch.attributeBonuses?.[k] || 0); }
function exConfig(ch) { if (!ch.config) ch.config = {}; if (ch.config.compartilhar === undefined) ch.config.compartilhar = true; if (ch.config.xp === undefined) ch.config.xp = false; return ch.config; }

/* ============================================================
   1. ROLAGEM DE DADOS
   ============================================================ */
const REGEX_DADO = /(\d*)\s*d\s*(\d+)/i;
let dadosHistorico = [];

// Lê expressões como "2d10 + Força", "3d6+4", "1d20 - 2"
function exAnalisar(texto, ch) {
  const limpo = String(texto || '').replace(/[−–—]/g, '-');
  const partes = limpo.split(/(?=[+-])/).map(p => p.trim()).filter(Boolean);
  const itens = [];
  const ignorados = [];
  for (const parte of partes) {
    const negativo = parte.startsWith('-');
    const corpo = parte.replace(/^[+-]\s*/, '').trim();
    if (!corpo) continue;
    const dado = corpo.match(REGEX_DADO);
    if (dado) {
      const qtd = Math.min(50, Math.max(1, parseInt(dado[1] || '1', 10)));
      const faces = Math.min(1000, Math.max(2, parseInt(dado[2], 10)));
      itens.push({ tipo: 'dado', qtd, faces, negativo, texto: `${qtd}d${faces}` });
      continue;
    }
    if (/^\d+$/.test(corpo)) { itens.push({ tipo: 'numero', valor: parseInt(corpo, 10), negativo, texto: corpo }); continue; }
    let achou = false;
    if (ch) {
      for (const palavra of corpo.split(/[^A-Za-zÀ-ÿ]+/)) {
        const k = ATRIB_POR_NOME[exSemAcento(palavra)] || ATRIB_POR_NOME[palavra.toLowerCase()];
        if (k) { itens.push({ tipo: 'atributo', chave: k, valor: exValorAtributo(ch, k), negativo, texto: ATRIB_NOMES[k] }); achou = true; break; }
      }
    }
    if (!achou) ignorados.push(corpo);
  }
  return { itens, ignorados };
}

function exRolar(expressao, opcoes = {}) {
  const ch = opcoes.ch !== undefined ? opcoes.ch : exFicha();
  const { itens, ignorados } = exAnalisar(expressao, ch);
  if (!itens.length) { exAviso('Não entendi a rolagem', `Use algo como 2d6+3. Recebido: "${exEsc(expressao)}"`, true); return null; }
  const modo = opcoes.modo || '';   // 'vantagem' | 'desvantagem'
  let total = 0;
  const detalhes = [];
  let natural20 = false, natural1 = false, temD20 = false;
  for (const item of itens) {
    const sinal = item.negativo ? -1 : 1;
    if (item.tipo === 'dado') {
      let valores = [];
      let descartados = [];
      if (item.faces === 20 && item.qtd === 1 && modo) {
        const a = 1 + Math.floor(Math.random() * 20), b = 1 + Math.floor(Math.random() * 20);
        const escolhido = modo === 'vantagem' ? Math.max(a, b) : Math.min(a, b);
        valores = [escolhido];
        descartados = [a === escolhido ? b : a];
      } else {
        for (let i = 0; i < item.qtd; i++) valores.push(1 + Math.floor(Math.random() * item.faces));
      }
      const soma = valores.reduce((a, b) => a + b, 0);
      total += sinal * soma;
      if (item.faces === 20) {
        temD20 = true;
        // margem negativa = crítico mais fácil (−3 faz o crítico sair a partir de 17)
        const margem = (ch && ch.derivedModifiers && ch.derivedModifiers.critMargin) || 0;
        const limite = Math.max(2, Math.min(20, 20 + margem));
        if (valores.some(v => v >= limite)) natural20 = true;
        if (valores.some(v => v === 1)) natural1 = true;
      }
      detalhes.push({ rotulo: (item.negativo ? '−' : '') + item.texto, valores, descartados, soma: sinal * soma });
    } else {
      total += sinal * item.valor;
      detalhes.push({ rotulo: item.texto, valores: null, soma: sinal * item.valor });
    }
  }
  const rolagem = {
    titulo: opcoes.titulo || 'Rolagem',
    expressao: expressao,
    total, detalhes, natural20, natural1, temD20, ignorados, modo,
    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  };
  dadosHistorico.push(rolagem);              // mais novos ficam embaixo
  if (dadosHistorico.length > 30) dadosHistorico.shift();
  exRenderHistorico();
  exMostrarUltima(rolagem);
  if (exPrefs().enviarRolagens !== false && window.nuvem && typeof nuvem.enviarRolagem === 'function') {
    try { nuvem.enviarRolagem(rolagem); } catch (e) { console.error(e); }
  }
  return rolagem;
}

function rolarAtributo(chave) {
  const ch = exFicha(); if (!ch) return;
  const v = exValorAtributo(ch, chave);
  exRolar(`1d20 + ${v}`, { titulo: `Teste de ${ATRIB_NOMES[chave]}` });
}
function rolarPericia(nome) {
  const ch = exFicha(); if (!ch) return;
  const id = (typeof SKILLS_DATA !== 'undefined' && SKILLS_DATA[nome]) ? SKILLS_DATA[nome].id : exSemAcento(nome);
  const r = typeof calculateSkill === 'function' ? calculateSkill(id, ch) : null;
  const total = r ? r.total : 0;
  const attr = r ? ATRIB_NOMES[r.selectedAttribute] : '';
  exRolar(`1d20 ${total >= 0 ? '+' : '-'} ${Math.abs(total)}`, { titulo: `${nome}${attr ? ` (${attr})` : ''}` });
}
function rolarExpressao(expr, titulo, modo) { exRolar(expr, { titulo: titulo || 'Rolagem', modo: modo || '' }); }

/* ---- painel de rolagens ---- */
function exMontarPainelDados() {
  if (document.getElementById('dadosPainel')) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <button id="dadosBtn" type="button" onclick="dadosAlternar()" title="Histórico de rolagens" aria-label="Histórico de rolagens">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4 3.6 7v10L12 21.6 20.4 17V7L12 2.4Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M3.6 7 12 11.6 20.4 7M12 11.6v10" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
    </button>
    <div id="dadosUltima" class="hidden" aria-live="polite"></div>
    <section id="dadosPainel" class="hidden" aria-label="Histórico de rolagens">
      <header class="dados-cab">
        <strong>Rolagens</strong>
        <button type="button" class="dados-fechar" onclick="dadosFechar()" aria-label="Fechar">&times;</button>
      </header>
      <div class="tabs dados-abas">
        <button type="button" class="tab active" data-aba="minhas" onclick="dadosAba('minhas')">Minhas</button>
        <button type="button" class="tab hidden" data-aba="mesa" onclick="dadosAba('mesa')">Da mesa</button>
      </div>
      <div id="dadosHistorico" class="dados-historico"></div>
      <div id="dadosMesa" class="dados-historico hidden">
        <div id="rolagensLista" class="rolagens-lista"></div>
      </div>
      <div class="dados-rodape">
        <button type="button" class="nv-link" id="dadosLimparBtn" onclick="dadosLimparAtual()">Limpar</button>
      </div>
      <form class="dados-form" onsubmit="dadosManual(event)">
        <input id="dadosEntrada" placeholder="2d6+3, 1d20+Força…" autocomplete="off" aria-label="Rolagem manual" />
        <button type="submit" class="primary small">Rolar</button>
      </form>
    </section>`;
  while (wrap.firstElementChild) document.body.appendChild(wrap.firstElementChild);
  exRenderHistorico();
  exAtualizarDado();
}
function exPartesHtml(r) {
  return r.detalhes.map(d => d.valores
    ? `<span class="dados-grupo">${exEsc(d.rotulo)}: ${d.valores.map(v => `<b>${v}</b>`).join(' ')}${(d.descartados || []).map(v => `<s>${v}</s>`).join(' ')}</span>`
    : `<span class="dados-grupo">${exEsc(d.rotulo)}</span>`).join('');
}
function exResumoCurto(r) {
  const partes = r.detalhes.map(d => {
    if (d.valores) {
      const desc = (d.descartados || []).length ? ` <s>${d.descartados.join(', ')}</s>` : '';
      return `${d.soma < 0 ? '−' : ''}[${d.valores.join(', ')}${desc ? '' : ''}]${desc}`;
    }
    return `${d.soma >= 0 ? '+' : '−'}${Math.abs(d.soma)}`;
  });
  return partes.join('').replace(/^\+/, '');
}
function exSeloHtml(r) {
  const modo = r.modo ? `<span class="dados-selo modo">${r.modo === 'vantagem' ? 'Vantagem' : 'Desvantagem'}</span>` : '';
  const crit = r.natural20 ? '<span class="dados-selo crit">Crítico</span>' : r.natural1 ? '<span class="dados-selo falha">Falha crítica</span>' : '';
  return modo + crit;
}
function exRenderHistorico() {
  const box = document.getElementById('dadosHistorico'); if (!box) return;
  if (!dadosHistorico.length) { box.innerHTML = '<p class="dados-vazio">Role um atributo, uma perícia ou um dano e o resultado aparece aqui.</p>'; return; }
  box.innerHTML = dadosHistorico.map((r, i) => `<article class="dados-item ${i === dadosHistorico.length - 1 ? 'novo' : ''}">
      <div class="dados-topo"><strong>${exEsc(r.titulo)}</strong><span class="dados-hora">${r.hora}</span></div>
      <div class="dados-linha"><span class="dados-total">${r.total}</span><div class="dados-partes">${exPartesHtml(r)}${exSeloHtml(r)}</div></div>
      <div class="dados-expr">${exEsc(r.expressao)}${r.ignorados.length ? ` · ignorado: ${exEsc(r.ignorados.join(', '))}` : ''}</div>
    </article>`).join('');
  box.scrollTop = box.scrollHeight;
}
// ao rolar aparece só o resultado; a lista abre no botão
function exMostrarUltima(r) {
  const el = document.getElementById('dadosUltima'); if (!el) return;
  if (!exPodeRolar()) return;   // fora da ficha e das campanhas o cartão não aparece
  const painel = document.getElementById('dadosPainel');
  if (painel && !painel.classList.contains('hidden')) return;   // histórico aberto: a rolagem já aparece nele
  el.innerHTML = `
    <div class="dados-ultima-corpo">
      <span class="dados-ultima-icone" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M12 2.4 3.6 7v10L12 21.6 20.4 17V7L12 2.4Z" fill="currentColor" opacity="0.22"/><path d="M12 2.4 3.6 7v10L12 21.6 20.4 17V7L12 2.4Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
      </span>
      <span class="dados-ultima-texto">
        <strong>${exEsc(r.titulo)}</strong>
        <small>${exResumoCurto(r)}${r.ignorados.length ? ` <i>(ignorado: ${exEsc(r.ignorados.join(', '))})</i>` : ''}</small>
        ${exSeloHtml(r)}
      </span>
      <span class="dados-ultima-igual">=</span>
      <span class="dados-ultima-total">${r.total}</span>
    </div>
    <button type="button" class="dados-ultima-x" onclick="dadosFecharUltima()" aria-label="Fechar">&times;</button>`;
  el.classList.remove('hidden');
  el.classList.remove('novo'); void el.offsetWidth; el.classList.add('novo');
}
function dadosFecharUltima() { const el = document.getElementById('dadosUltima'); if (el) el.classList.add('hidden'); }
// as rolagens só valem na ficha e nas páginas de campanha; no resto do site o dado some
const TELAS_COM_DADO = ['screenSheet', 'screenEscudo', 'screenCampanhaJogador'];
function exPodeRolar() {
  return TELAS_COM_DADO.some(id => {
    const el = document.getElementById(id);
    return el && !el.classList.contains('hidden');
  });
}
function exAtualizarDado() {
  const pode = exPodeRolar();
  const btn = document.getElementById('dadosBtn');
  if (btn) btn.classList.toggle('hidden', !pode);
  if (!pode) { dadosFechar(); dadosFecharUltima(); }
  document.body.classList.toggle('sem-dado', !pode);
}
function exAbrirPainel(aba) {
  if (!exPodeRolar()) return;
  const p = document.getElementById('dadosPainel'); if (!p) return;
  p.classList.remove('hidden');
  exAtualizarAbasDados();
  if (aba) dadosAba(aba); else dadosAba(dadosAbaAtual);
  dadosFecharUltima();
  const box = document.getElementById('dadosHistorico'); if (box) box.scrollTop = box.scrollHeight;
}
let dadosAbaAtual = 'minhas';
function dadosAba(aba) {
  dadosAbaAtual = aba;
  document.querySelectorAll('#dadosPainel .dados-abas .tab').forEach(t => t.classList.toggle('active', t.dataset.aba === aba));
  document.getElementById('dadosHistorico').classList.toggle('hidden', aba !== 'minhas');
  document.getElementById('dadosMesa').classList.toggle('hidden', aba !== 'mesa');
  const limpar = document.getElementById('dadosLimparBtn');
  if (limpar) limpar.textContent = aba === 'mesa' ? 'Limpar o histórico da mesa' : 'Limpar as minhas';
  if (aba === 'mesa' && window.nuvem && nuvem.renderRolagens) nuvem.renderRolagens(true);
  else { const b = document.getElementById('dadosHistorico'); if (b) b.scrollTop = b.scrollHeight; }
}
function dadosLimparAtual() {
  if (dadosAbaAtual === 'mesa') { if (window.nuvem && nuvem.limparRolagens) nuvem.limparRolagens(); return; }
  dadosLimpar();
}
// a aba "Da mesa" só existe quando há campanha aberta; limpar o histórico dela é coisa de mestre
function exAtualizarAbasDados() {
  const tab = document.querySelector('#dadosPainel .dados-abas .tab[data-aba="mesa"]');
  if (!tab) return;
  const tem = !!(window.nuvem && nuvem.temCampanha && nuvem.temCampanha());
  tab.classList.toggle('hidden', !tem);
  if (!tem && dadosAbaAtual === 'mesa') dadosAba('minhas');
  const limpar = document.getElementById('dadosLimparBtn');
  if (limpar) limpar.classList.toggle('hidden', dadosAbaAtual === 'mesa' && !(window.nuvem && nuvem.ehMestreDaCampanha && nuvem.ehMestreDaCampanha()));
}
function dadosAlternar() {
  const p = document.getElementById('dadosPainel');
  if (!p) return;
  if (p.classList.contains('hidden')) exAbrirPainel(); else dadosFechar();
}
window.abrirRolagensDaMesa = function () { exAbrirPainel('mesa'); };
function dadosFechar() { const p = document.getElementById('dadosPainel'); if (p) p.classList.add('hidden'); }
function dadosLimpar() { dadosHistorico = []; exRenderHistorico(); }
function dadosManual(ev) {
  ev.preventDefault();
  const campo = document.getElementById('dadosEntrada');
  const v = campo.value.trim();
  if (!v) return;
  exRolar(v, { titulo: 'Rolagem manual' });
  campo.value = '';
  exAbrirPainel();
}

/* ---- botões de dado espalhados pela ficha ---- */
function exBotaoDado(acao, titulo, rotulo) {
  return `<button type="button" class="dado-btn" onclick="event.stopPropagation(); ${acao}" title="${titulo}" aria-label="${titulo}">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4 3.6 7v10L12 21.6 20.4 17V7L12 2.4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>${rotulo ? `<span>${rotulo}</span>` : ''}</button>`;
}
function exInjetarAtributos() {
  document.querySelectorAll('#tabGeneral .attr-card').forEach(card => {
    if (card.querySelector('.dado-btn')) return;
    const m = (card.getAttribute('onclick') || '').match(/showAttrPopover\('(\w+)'/);
    if (!m) return;
    const controles = card.querySelector('.attr-controls') || card;
    controles.insertAdjacentHTML('beforeend',
      `<button type="button" class="dado-btn" data-atributo="${m[1]}" title="Rolar 1d20 + ${ATRIB_NOMES[m[1]]}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4 3.6 7v10L12 21.6 20.4 17V7L12 2.4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg><span>d20</span></button>`);
  });
}
function exInjetarPericias() {
  document.querySelectorAll('#skillList .skill-row').forEach(row => {
    if (row.querySelector('.dado-btn')) return;
    const nome = row.querySelector('.skill-name');
    if (!nome) return;
    const alvo = row.querySelector('.skill-row-controls') || row;
    alvo.insertAdjacentHTML('afterbegin',
      `<button type="button" class="dado-btn" data-pericia="${exEsc(nome.textContent)}" title="Rolar 1d20 + total de ${exEsc(nome.textContent)}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4 3.6 7v10L12 21.6 20.4 17V7L12 2.4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg><span>d20</span></button>`);
  });
}
// Acha expressões de dado em qualquer texto e oferece um botão para cada uma
function exChipsDeTexto(elemento, titulo) {
  if (!elemento || elemento.querySelector('.dados-chips')) return;
  const texto = elemento.textContent || '';
  const achados = [...new Set((texto.match(/\d*\s*d\s*\d+(\s*[+-]\s*\d+)?/gi) || []).map(x => x.replace(/\s+/g, '')))].slice(0, 4);
  if (!achados.length) return;
  const html = achados.map(e => exChipDado(e, titulo, e)).join('');
  elemento.insertAdjacentHTML('beforeend', `<div class="dados-chips"><span>Rolar:</span>${html}</div>`);
}
function exInjetarAtaques() {
  const ch = exFicha(); if (!ch || !ch.quickAttacks) return;
  document.querySelectorAll('#quickAttacksList .item-card').forEach(card => {
    const nome = card.querySelector('.item-header strong');
    if (!nome) return;
    const atk = ch.quickAttacks.find(a => a.name === nome.textContent);
    const conteudo = card.querySelector('.item-content');
    if (!atk || !conteudo || conteudo.querySelector('.dados-chips')) return;
    const botoes = [];
    const acerto = String(atk.acerto || '').replace(/[^0-9+\-dD ]/g, '').trim();
    if (acerto) botoes.push(exChipDado(/d\d/i.test(acerto) ? acerto : `1d20+${acerto}`, `Acerto — ${atk.name}`, 'Acerto'));
    if (atk.dano) botoes.push(exChipDado(atk.dano, `Dano — ${atk.name}`, `Dano ${atk.dano}`, 'primario'));
    if (botoes.length) conteudo.insertAdjacentHTML('afterbegin', `<div class="dados-chips"><span>Rolar:</span>${botoes.join('')}</div>`);
  });
}
function exInjetarInventario() {
  document.querySelectorAll('#personalInventoryList .item-content, #mountInventoryList .item-content').forEach(c => {
    const card = c.closest('.item-card');
    const nome = card ? card.querySelector('.item-header strong') : null;
    exChipsDeTexto(c, nome ? nome.textContent : 'Item');
  });
}

/* ============================================================
   2. DMT: APRIMORAMENTOS
   ============================================================ */
const DMT_MELHORIAS = [
  { id: 'reducao', nome: 'Placas metálicas', desc: 'Reduz todo dano recebido em um valor igual à sua Vitalidade.', ef: { reducaoVit: true } },
  { id: 'desloc', nome: 'Propulsores otimizados', desc: 'O deslocamento adicional do DMT passa de +3m para +5m.', ef: { deslocamento: 2 } },
  { id: 'canhao', nome: 'Sistema híbrido', desc: 'Canhões de mão acoplados causam +1d10 de dano extra.', ef: { canhaoExtra: '1d10' } },
  { id: 'defesa', nome: 'Estabilizadores', desc: '+3 em todos os Testes de Defesa (bloqueio ou esquiva) usando o DMT.', ef: { defesa: 3 } },
  { id: 'gas', nome: 'Cilindros ampliados', desc: 'Até 80 pontos de gás, 40 em cada cilindro.', ef: { gasPorCilindro: 40 } },
  { id: 'laminas', nome: 'Lâminas reforçadas', desc: 'Cada conjunto de lâminas dura 4 ataques, em vez de 3.', ef: { ataquesLamina: 4 } }
];

function exDmt(ch) {
  if (!ch.dmt) ch.dmt = { type: 'Tradicional', cylinderCapacity: 20, cylinder1: 20, cylinder2: 20 };
  if (!Array.isArray(ch.dmt.melhorias)) ch.dmt.melhorias = [];
  if (!Array.isArray(ch.dmt.custom)) ch.dmt.custom = [];
  return ch.dmt;
}
function exEfeitosDmt(ch) {
  const dmt = exDmt(ch);
  const ef = { gasPorCilindro: 20, ataquesLamina: 3, deslocamento: 0, defesa: 0, reducaoVit: false, canhaoExtra: '' };
  const aplicar = e => {
    if (!e) return;
    if (e.gasPorCilindro) ef.gasPorCilindro = Math.max(ef.gasPorCilindro, e.gasPorCilindro);
    if (e.ataquesLamina) ef.ataquesLamina = Math.max(ef.ataquesLamina, e.ataquesLamina);
    if (e.deslocamento) ef.deslocamento += e.deslocamento;
    if (e.defesa) ef.defesa += e.defesa;
    if (e.reducaoVit) ef.reducaoVit = true;
    if (e.canhaoExtra) ef.canhaoExtra = ef.canhaoExtra ? `${ef.canhaoExtra} + ${e.canhaoExtra}` : e.canhaoExtra;
  };
  DMT_MELHORIAS.forEach(m => { if (dmt.melhorias.includes(m.id)) aplicar(m.ef); });
  dmt.custom.forEach(c => aplicar(c.ef));
  return ef;
}
function exLimiteLaminas(ch) { return exEfeitosDmt(ch).ataquesLamina; }
// esquiva, bloqueio e deslocamento mostrados na ficha precisam refletir o aprimoramento na hora
function exAtualizarDerivadosDmt() {
  if (typeof updateAttrUI === 'function') updateAttrUI();
  if (typeof updateResourceUI === 'function') updateResourceUI();
}
// o limite de ataques e o dano do canhão da aba DMT seguem os aprimoramentos
function exRenderAbaDmt() {
  const ch = exFicha(); if (!ch || !ch.dmt) return;
  const ef = exEfeitosDmt(ch);
  const lim = document.getElementById('bladeLimit'); if (lim) lim.textContent = ef.ataquesLamina;
  const can = document.getElementById('cannonDamage'); if (can) can.textContent = `3d6${ef.canhaoExtra ? ` + ${ef.canhaoExtra}` : ''}`;
}

// os aprimoramentos entram nos modificadores da ficha
const exRecalcOriginal = window.recalcAllModifiers;
window.recalcAllModifiers = function (ch) {
  exRecalcOriginal(ch);
  if (!ch || !ch.dmt) return;
  const ef = exEfeitosDmt(ch);
  // os aprimoramentos do DMT só valem com o DMT em uso, então vão para a linha própria
  ch.derivedModifiers.movimentoDmt = (ch.derivedModifiers.movimentoDmt || 0) + ef.deslocamento;
  ch.derivedModifiers.defesaEsquiva = (ch.derivedModifiers.defesaEsquiva || 0) + ef.defesa;
  ch.derivedModifiers.esquivaDmt = (ch.derivedModifiers.esquivaDmt || 0) + ef.defesa;
  ch.derivedModifiers.defesaBloqueio = (ch.derivedModifiers.defesaBloqueio || 0) + ef.defesa;
  ch.derivedModifiers.bloqueioDmt = (ch.derivedModifiers.bloqueioDmt || 0) + ef.defesa;
  ch.dmt.cylinderCapacity = ef.gasPorCilindro;
  ch.dmt.cylinder1 = Math.min(ch.dmt.cylinder1 ?? ef.gasPorCilindro, ef.gasPorCilindro);
  ch.dmt.cylinder2 = Math.min(ch.dmt.cylinder2 ?? ef.gasPorCilindro, ef.gasPorCilindro);
};

// lâminas quebram conforme o limite dos aprimoramentos
window.registerBladeAttack = function () {
  const ch = exFicha(); if (!ch) return;
  const dmt = exDmt(ch);   // ficha antiga pode não ter DMT ainda
  if (!dmt.bladesEquipped) { exAviso('Sem lâminas disponíveis', 'Troque o conjunto ou reabasteça antes de atacar.', true); return; }
  const limite = exLimiteLaminas(ch);
  dmt.bladeAttacksUsed = (dmt.bladeAttacksUsed || 0) + 1;
  if (dmt.bladeAttacksUsed >= limite) {
    dmt.bladeAttacksUsed = 0;
    if (dmt.bladeReserve > 0) { dmt.bladeReserve -= 1; exAviso('Conjunto de lâminas quebrado', 'Um conjunto de reserva foi equipado.'); }
    else { dmt.bladesEquipped = false; exAviso('Conjunto de lâminas quebrado', 'Sem reservas — reabasteça antes de atacar de novo.', true); }
  }
  exSalvar(); renderDMT();
};

function exPainelDmt() {
  const ch = exFicha(); if (!ch) return;
  const campo = document.getElementById('dmtType');
  const caixa = campo ? campo.closest('.card') : null;
  if (!caixa) return;
  let painel = document.getElementById('dmtMelhorias');
  if (!painel) {
    painel = document.createElement('div');
    painel.id = 'dmtMelhorias';
    caixa.appendChild(painel);
  }
  const dmt = exDmt(ch);
  const ef = exEfeitosDmt(ch);
  const oficiais = DMT_MELHORIAS.map(m => `
    <label class="dmt-melhoria ${dmt.melhorias.includes(m.id) ? 'ativa' : ''}">
      <input type="checkbox" ${dmt.melhorias.includes(m.id) ? 'checked' : ''} onchange="dmtAlternarMelhoria('${m.id}', this.checked)" />
      <span><strong>${m.nome}</strong><small>${m.desc}</small></span>
    </label>`).join('');
  const custom = dmt.custom.map(c => `
    <div class="dmt-custom">
      <div><strong>${exEsc(c.nome)}</strong>${c.desc ? `<small>${exEsc(c.desc)}</small>` : ''}${exResumoEfeito(c.ef)}</div>
      <button type="button" class="small danger" onclick="dmtRemoverCustom('${c.id}')">Remover</button>
    </div>`).join('');
  const todos = DMT_MELHORIAS.every(m => dmt.melhorias.includes(m.id));
  painel.innerHTML = `
    <h3>Aprimoramentos do DMT</h3>
    <div class="dmt-resumo">
      <span>Gás por cilindro: <strong>${ef.gasPorCilindro}</strong></span>
      <span>Lâminas duram <strong>${ef.ataquesLamina}</strong> ataques</span>
      ${ef.deslocamento ? `<span>Deslocamento <strong>+${ef.deslocamento}m</strong></span>` : ''}
      ${ef.defesa ? `<span>Testes de Defesa <strong>+${ef.defesa}</strong></span>` : ''}
      ${ef.reducaoVit ? `<span>Reduz dano em <strong>${exValorAtributo(ch, 'vit')}</strong> (Vitalidade)</span>` : ''}
      ${ef.canhaoExtra ? `<span>Canhão de mão <strong>+${exEsc(ef.canhaoExtra)}</strong></span>` : ''}
    </div>
    <button type="button" class="small ${todos ? '' : 'primary'}" onclick="dmtAplicarPacote(${todos ? 'false' : 'true'})">${todos ? 'Voltar ao DMT tradicional' : 'Ativar o DMT Aprimorado completo'}</button>
    <div class="dmt-lista">${oficiais}</div>
    <h4 class="dmt-sub">Aprimoramentos personalizados</h4>
    ${custom || '<p class="empty-note">Nenhum aprimoramento próprio.</p>'}
    <button type="button" class="small" onclick="dmtAbrirCustom()">+ Criar aprimoramento</button>`;
}
function exResumoEfeito(ef) {
  if (!ef) return '';
  const p = [];
  if (ef.gasPorCilindro) p.push(`${ef.gasPorCilindro} de gás por cilindro`);
  if (ef.ataquesLamina) p.push(`lâminas duram ${ef.ataquesLamina} ataques`);
  if (ef.deslocamento) p.push(`${ef.deslocamento > 0 ? '+' : ''}${ef.deslocamento}m de deslocamento`);
  if (ef.defesa) p.push(`${ef.defesa > 0 ? '+' : ''}${ef.defesa} em Testes de Defesa`);
  if (ef.reducaoVit) p.push('reduz dano igual à Vitalidade');
  if (ef.canhaoExtra) p.push(`canhão +${ef.canhaoExtra}`);
  return p.length ? `<small class="dmt-efeito">${exEsc(p.join(' · '))}</small>` : '';
}
function dmtAlternarMelhoria(id, ativo) {
  const ch = exFicha(); if (!ch) return;
  const dmt = exDmt(ch);
  dmt.melhorias = ativo ? [...new Set([...dmt.melhorias, id])] : dmt.melhorias.filter(x => x !== id);
  dmt.type = dmt.melhorias.length ? (DMT_MELHORIAS.every(m => dmt.melhorias.includes(m.id)) ? 'Aprimorado' : 'Modificado') : 'Tradicional';
  recalcAllModifiers(ch); exSalvar(); renderDMT(); exAtualizarDerivadosDmt();
}
function dmtAplicarPacote(ativar) {
  const ch = exFicha(); if (!ch) return;
  const dmt = exDmt(ch);
  dmt.melhorias = ativar ? DMT_MELHORIAS.map(m => m.id) : [];
  dmt.type = ativar ? 'Aprimorado' : 'Tradicional';
  // enche os cilindros com o que os aprimoramentos escolhidos realmente dão
  if (ativar) { const g = exEfeitosDmt(ch).gasPorCilindro; dmt.cylinder1 = g; dmt.cylinder2 = g; }
  recalcAllModifiers(ch); exSalvar(); renderDMT(); exAtualizarDerivadosDmt();
  exAviso(ativar ? 'DMT Aprimorado ativado' : 'DMT tradicional', ativar ? 'Os seis aprimoramentos do livro foram aplicados.' : 'Os aprimoramentos oficiais foram desligados.');
}
function dmtRemoverCustom(id) {
  const ch = exFicha(); if (!ch) return;
  const dmt = exDmt(ch);
  dmt.custom = dmt.custom.filter(c => c.id !== id);
  recalcAllModifiers(ch); exSalvar(); renderDMT(); exAtualizarDerivadosDmt();
}
function dmtAbrirCustom() {
  document.getElementById('dmtCustomNome').value = '';
  document.getElementById('dmtCustomDesc').value = '';
  ['Gas', 'Laminas', 'Desloc', 'Defesa', 'Canhao'].forEach(k => { document.getElementById('dmtCustom' + k).value = ''; });
  document.getElementById('dmtCustomReducao').checked = false;
  document.getElementById('dmtCustomModal').classList.remove('hidden');
}
function dmtSalvarCustom() {
  const ch = exFicha(); if (!ch) return;
  const nome = document.getElementById('dmtCustomNome').value.trim();
  if (!nome) { exAviso('Dê um nome ao aprimoramento', '', true); return; }
  const num = id => { const v = parseInt(document.getElementById(id).value, 10); return Number.isFinite(v) && v !== 0 ? v : 0; };
  const ef = {
    gasPorCilindro: num('dmtCustomGas'),
    ataquesLamina: num('dmtCustomLaminas'),
    deslocamento: num('dmtCustomDesloc'),
    defesa: num('dmtCustomDefesa'),
    reducaoVit: document.getElementById('dmtCustomReducao').checked,
    canhaoExtra: document.getElementById('dmtCustomCanhao').value.trim()
  };
  exDmt(ch).custom.push({ id: 'dmtc_' + Date.now(), nome, desc: document.getElementById('dmtCustomDesc').value.trim(), ef });
  recalcAllModifiers(ch); exSalvar();
  document.getElementById('dmtCustomModal').classList.add('hidden');
  renderDMT(); exAtualizarDerivadosDmt();
  exAviso('Aprimoramento criado', nome);
}

/* ============================================================
   3. SISTEMA DE XP (opcional, ligado nas configurações da ficha)
   ============================================================ */
const XP_METAS = { 1: 200, 2: 500, 3: 800, 4: 1500, 5: 2000, 6: 3000, 7: 3500, 8: 4000, 9: 4500, 10: 5000, 11: 6000, 12: 7000, 13: 8000, 14: 9000, 15: 10000, 16: 12000, 17: 14000, 18: 16000, 19: 18000, 20: 20000 };
const XP_CONQUISTAS = [
  { xp: 100, texto: 'Derrotou (ou ajudou a derrotar) um titã de 3 a 7 metros' },
  { xp: 150, texto: 'Derrotou (ou ajudou a derrotar) um titã de 8 a 11 metros' },
  { xp: 200, texto: 'Derrotou (ou ajudou a derrotar) um titã de 12 a 14 metros' },
  { xp: 250, texto: 'Derrotou (ou ajudou a derrotar) um titã de 15 metros' },
  { xp: 50, texto: 'Deu o golpe final em um titã' },
  { xp: 50, texto: 'Recuperou 50 PDV de aliados na sessão' },
  { xp: 50, texto: 'Criou um plano que fez a missão dar certo' },
  { xp: 50, texto: 'Descobriu uma área nova' },
  { xp: 50, texto: 'Descobriu algo relevante sobre o mundo' },
  { xp: 50, texto: 'Cumpriu um objetivo pessoal do personagem' }
];
function xpMeta(ch) { return XP_METAS[(ch.level || 0) + 1] || null; }
function exPainelXp() {
  const ch = exFicha(); if (!ch) return;
  const secao = document.getElementById('tabProgression'); if (!secao) return;
  let painel = document.getElementById('xpPainel');
  if (!exConfig(ch).xp) { if (painel) painel.remove(); return; }
  if (!painel) {
    painel = document.createElement('div');
    painel.id = 'xpPainel'; painel.className = 'card';
    secao.insertBefore(painel, secao.firstElementChild);
  }
  const meta = xpMeta(ch);
  const xp = ch.exp || 0;
  const pct = meta ? Math.min(100, (xp / meta) * 100) : 100;
  painel.innerHTML = `
    <div class="nv-titulo-linha"><h2>Experiência</h2><span class="nv-nota">${meta ? `Meta do nível ${ch.level + 1}` : 'Nível máximo'}</span></div>
    <div class="xp-numeros"><strong>${xp}</strong>${meta ? ` / ${meta} XP` : ' XP'}</div>
    <div class="resource-bar"><div class="resource-fill" style="width:${pct}%"></div></div>
    ${meta ? `<p class="nv-nota">${xp >= meta ? 'Meta alcançada. Ao subir de nível, o XP volta a zero.' : `Faltam ${meta - xp} XP para o nível ${ch.level + 1}.`}</p>` : ''}
    <div class="xp-acoes">
      <button type="button" class="small" onclick="xpSomar(-50)">−50</button>
      <button type="button" class="small" onclick="xpSomar(50)">+50</button>
      <button type="button" class="small" onclick="xpPerguntar()">Outro valor</button>
      ${meta && xp >= meta ? `<button type="button" class="small primary" onclick="xpSubirNivel()">Subir para o nível ${ch.level + 1}</button>` : ''}
    </div>
    <h3 class="dmt-sub">Conquistas</h3>
    <p class="nv-nota">Clique para somar. Repetir a mesma conquista na sessão vale metade.</p>
    <div class="xp-conquistas">
      ${XP_CONQUISTAS.map((c, i) => `<button type="button" class="xp-conquista" onclick="xpConquista(${i})"><span>${exEsc(c.texto)}</span><strong>+${c.xp}</strong></button>`).join('')}
    </div>`;
}
function xpSomar(v) {
  const ch = exFicha(); if (!ch) return;
  ch.exp = Math.max(0, (ch.exp || 0) + v);
  const campo = document.getElementById('charExp'); if (campo) campo.value = ch.exp;
  exSalvar(); exPainelXp();
}
function xpPerguntar() {
  const v = parseInt(prompt('Quantos pontos de XP? (use um número negativo para tirar)', '100'), 10);
  if (Number.isFinite(v)) xpSomar(v);
}
function xpConquista(i) {
  const c = XP_CONQUISTAS[i]; if (!c) return;
  xpSomar(c.xp);
  exAviso(`+${c.xp} XP`, c.texto);
}
function xpSubirNivel() {
  const ch = exFicha(); if (!ch) return;
  const meta = xpMeta(ch); if (!meta) return;
  showConfirm(`Subir ${ch.name} para o nível ${ch.level + 1}? O XP volta para zero, como manda o livro.`, () => {
    ch.level = (ch.level || 0) + 1;
    ch.exp = 0;
    const nivel = document.getElementById('charLevel'); if (nivel) nivel.value = ch.level;
    const campo = document.getElementById('charExp'); if (campo) campo.value = 0;
    recalcAllModifiers(ch); exSalvar();
    if (typeof openChar === 'function' && typeof currentCharId !== 'undefined') openChar(currentCharId);
    exAviso('Nível aumentado', `Agora no nível ${ch.level}. Confira os benefícios na aba Progressão.`);
  });
}

/* ============================================================
   4. CONFIGURAÇÕES DA FICHA
   ============================================================ */
function fichaCompartilhar(v) {
  const ch = exFicha(); if (!ch) return;
  exConfig(ch).compartilhar = !!v;
  exSalvar();
  if (window.nuvem && typeof nuvem.atualizarLeitores === 'function') nuvem.atualizarLeitores();
  exAviso(v ? 'Ficha visível para a campanha' : 'Ficha escondida dos outros jogadores', v ? '' : 'O mestre continua vendo.');
}
function fichaUsarXp(v) {
  const ch = exFicha(); if (!ch) return;
  exConfig(ch).xp = !!v;
  exSalvar(); exPainelXp();
}

/* ============================================================
   5. FICHAS OFICIAIS DO LIVRO
   ============================================================ */
const FICHAS_OFICIAIS = [
  {
    nome: 'Eren Yeager', nivel: 4, origem: 'Revolucionário', classe: 'Linha de Frente', subclasse: 'Soldado',
    pdv: 40, san: 10, pde: 23, attrs: { agi: 2, sta: 2, str: 4, int: 2, vit: 3 },
    pericias: { 'Carisma': 1, 'Fortitude': 3, 'História': 1, 'Luta': 4, 'Vontade': 4 },
    habilidades: ['Reviravolta', 'Força Bruta', 'Revigoração'],
    talentos: ['Sortudo', 'Obcecado', 'Apego a um Objeto'],
    anotacoes: 'Vantagem em testes de Vontade (Passiva de Origem)\n+1 em Testes de Acerto e +1d4 em danos (Passiva de Classe)\nEren é obcecado pela liberdade.',
    tita: { nome: 'Titã de Ataque', controle: 1 }
  },
  {
    nome: 'Mikasa Ackerman', nivel: 8, origem: 'Ackerman', classe: 'Linha de Frente', subclasse: 'Soldado',
    pdv: 54, san: 6, pde: 54, attrs: { agi: 7, sta: 3, str: 4, int: 2, vit: 1 },
    pericias: { 'Exploração': 1, 'Fortitude': 2, 'Furtividade': 3, 'Intimidação': 3, 'Luta': 6 },
    habilidades: ['Esquiva Avançada', 'Investida Relâmpago', 'Tamanho Não é Documento', 'Ataques em Série', 'Proficiência com o DMT'],
    talentos: ['Reflexos Aguçados', 'Guerreiro Experiente', 'Sangue Frio', 'Mau Nome', 'Trauma'],
    anotacoes: '+1 nos Atributos Força e Agilidade, +1 em Testes de Acerto e −2 em SAN permanentemente (Passiva de Origem)\n+1 em Testes de Acerto e +1d4 em danos (Passiva de Classe)\n+1 nível em Investida Relâmpago (Segunda Passiva de Origem)\nTrauma de perda: Mikasa teme perder de novo quem considera família.'
  },
  {
    nome: 'Armin Arlert', nivel: 3, origem: 'Historiador', classe: 'Especialista de Batalha', subclasse: 'Estrategista',
    pdv: 20, san: 14, pde: 18, attrs: { agi: 3, sta: 2, str: 1, int: 6, vit: 1 },
    pericias: { 'Carisma': 1, 'Exploração': 4, 'História': 3, 'Luta': 1, 'Natureza': 1, 'Tática': 4, 'Vontade': 2 },
    habilidades: ['Nova Tentativa', 'Planejamento'],
    talentos: ['Aparência Inofensiva', 'Pressentimento', 'Memória Fotográfica', 'Mãos Trêmulas', 'Dificuldade de Aprendizado', 'Amedrontado'],
    anotacoes: 'Vantagem em testes de História (Passiva de Origem)\n+1 nos Testes de Acerto de dois aliados (ou dele e um aliado) durante combates (Passiva de Classe)'
  },
  {
    nome: 'Levi Ackerman', nivel: 17, origem: 'Ackerman', classe: 'Linha de Frente', subclasse: 'Soldado',
    pdv: 126, san: 6, pde: 100, attrs: { agi: 8, sta: 2, str: 5, int: 2, vit: 2 },
    pericias: { 'Crime': 3, 'Exploração': 1, 'Fortitude': 2, 'Furtividade': 1, 'Intimidação': 1, 'Luta': 10, 'Tática': 3 },
    habilidades: ['Proficiência com o DMT', 'Esquiva Avançada', 'Ataques em Série', 'Ataque Giratório', 'Ataque Fatal', 'Tamanho Não é Documento', 'Sob Pressão', 'Ataques Múltiplos', 'Segunda Chance'],
    talentos: ['Reflexos Aguçados', 'Sangue Frio', 'Mau Nome', 'Mal Encarado', 'Fixação em Limpeza'],
    customizadas: [{
      nome: 'O Mais Forte da Humanidade', nivel: 3,
      desc: 'Nível 3 — Role 1d4+1: o resultado é a quantidade de ataques que pode fazer contra o mesmo alvo. No fim da sequência, as lâminas quebram. Custo: 12 PDE, uma Ação Padrão e uma Ação Bônus.\nNível 4 — A rolagem passa a ser 1d6+1. Custo: 15 PDE, uma Ação Padrão e uma Ação Bônus.',
      cost: '12 PDE'
    }],
    anotacoes: '+1 nos Atributos Força e Agilidade, +1 em Testes de Acerto e −2 em SAN permanentemente (Passiva de Origem)\n+3 em Testes de Acerto e +1d8 em danos (Passiva de Classe)\n+1 nível em Ataque Giratório (Segunda Passiva de Origem)'
  },
  {
    nome: 'Erwin Smith', nivel: 15, origem: 'Historiador', classe: 'Especialista de Batalha', subclasse: 'Capitão',
    pdv: 112, san: 15, pde: 70, attrs: { agi: 1, sta: 2, str: 5, int: 7, vit: 3 },
    pericias: { 'Carisma': 3, 'Exploração': 4, 'Fortitude': 2, 'História': 5, 'Luta': 4, 'Tática': 7, 'Vontade': 4 },
    habilidades: ['Casca Grossa', 'Melhoria Geral', 'Reviravolta', 'Sacrifício', 'Coração Valente', 'Veterano de Guerra', 'Senso de Batalha', 'Ataque Coordenado'],
    talentos: ['Robusto', 'Obcecado'],
    customizadas: [{
      nome: 'Ofereçam seus Corações', nivel: 3,
      desc: 'Nível 3 — Teste de Carisma ou Tática; com 16 ou mais, escolha 1 aliado para ter todas as habilidades aumentadas em 1 nível por 2 turnos. Custo: 7 PDE e uma Ação Padrão.\nNível 4 — Até 2 aliados, e a dificuldade do teste passa a ser 18. Custo: 9 PDE e uma Ação Padrão.',
      cost: '7 PDE'
    }],
    anotacoes: 'Vantagem em testes de História (Passiva de Origem)\n+1 nos Testes de Acerto de quantos aliados quiser (e dele mesmo) durante combates (Passiva de Classe)\nPode trocar um teste de morte por História uma vez ao dia (Segunda Passiva de Origem)\nErwin é obcecado por descobrir os mistérios do mundo.'
  },
  {
    nome: 'Hange Zoe', nivel: 14, origem: 'Cientista', classe: 'Suporte de Campo', subclasse: 'Inventor',
    pdv: 90, san: 14, pde: 81, attrs: { agi: 4, sta: 3, str: 2, int: 6, vit: 2 },
    pericias: { 'Carisma': 2, 'Exploração': 2, 'Fortitude': 2, 'História': 1, 'Intimidação': 2, 'Luta': 3, 'Mecânica': 7, 'Natureza': 2, 'Tática': 2 },
    habilidades: ['Provocação', 'Proficiência com o DMT', 'Explorar Ferimento', 'Imobilizar', 'Projeto Próprio', 'Obra Prima', 'Impulso Aprimorado', 'Sacrifício'],
    talentos: ['Memória Fotográfica', 'Visão Fraca'],
    customizadas: [{
      nome: 'Fascínio por Titãs', nivel: 3,
      desc: 'Nível 3 — Analisa um Titã Puro à escolha: o narrador revela os PDV restantes de cada parte, os atributos e, se for Anômalo, a peculiaridade mecânica. Custo: 5 PDE e uma Ação Bônus.\nNível 4 — Também funciona em Titãs Primordiais, revelando habilidades e propriedades exclusivas. Custo: 8 PDE e uma Ação Bônus.',
      cost: '5 PDE'
    }],
    anotacoes: 'Vantagem em testes de Mecânica (Passiva de Origem)\nEquipamentos curativos recuperam +1d6 PDV e reparos recebem +2 (Passiva de Classe)\nHabilidades da subclasse Inventor custam 1 PDE a menos (Segunda Passiva de Origem)'
  },
  {
    nome: 'Kenny Ackerman', nivel: 11, origem: 'Ackerman', classe: 'Linha de Frente', subclasse: 'Atirador',
    pdv: 84, san: 8, pde: 53, attrs: { agi: 8, sta: 1, str: 4, int: 4, vit: 2 },
    pericias: { 'Crime': 3, 'Exploração': 3, 'Furtividade': 3, 'Intimidação': 3, 'Luta': 2, 'Pontaria': 8 },
    habilidades: ['Ocultação Treinada', 'Resposta Imediata', 'Melhoria Geral', 'Tiro de Raspão', 'Tiro de Auxílio', 'Sede de Sangue', 'Olhos de Águia'],
    talentos: ['Visão Aguçada', 'Guerreiro Experiente', 'Robusto', 'Arrogante', 'Mal Encarado', 'Mau Nome'],
    anotacoes: '+1 nos Atributos Força e Agilidade, +1 em Testes de Acerto e −2 em SAN permanentemente (Passiva de Origem)\n+2 em Testes de Acerto e +1d6 em danos (Passiva de Classe)\n+1 nível em Sede de Sangue (Segunda Passiva de Origem)'
  },
  {
    nome: 'Petra Ral', nivel: 9, origem: 'Cidadão', classe: 'Suporte de Campo', subclasse: 'Médico',
    pdv: 50, san: 12, pde: 47, attrs: { agi: 5, sta: 3, str: 2, int: 4, vit: 1 },
    pericias: { 'Carisma': 3, 'Exploração': 3, 'Furtividade': 1, 'Luta': 5, 'Medicina': 7, 'Natureza': 1, 'Tática': 3 },
    habilidades: ['Finta', 'Impulso Aprimorado', 'Apoiar', 'Medicina Avançada', 'Golpe Baixo', 'Concentração Total', 'Ataque Atordoante'],
    talentos: ['Aparência Inofensiva', 'Guerreiro Experiente', 'Contra Golpe', 'Reflexos Aguçados', 'Azarado', 'Medo da Morte'],
    anotacoes: '4 perícias diferentes recebem +1 (Passiva de Origem)\nEquipamentos curativos recuperam +1d6 PDV e reparos recebem +2 (Passiva de Classe)\n1 habilidade geral adicional (Segunda Passiva de Origem)'
  },
  {
    nome: 'Sasha Braus', nivel: 10, origem: 'Fazendeiro', classe: 'Linha de Frente', subclasse: 'Atirador',
    pdv: 88, san: 7, pde: 63, attrs: { agi: 6, sta: 3, str: 2, int: 1, vit: 3 },
    pericias: { 'Carisma': 4, 'Exploração': 2, 'Fortitude': 1, 'Luta': 2, 'Natureza': 2, 'Pontaria': 5 },
    habilidades: ['Golpe de Sorte', 'Instinto de Sobrevivência', 'Crítico Aprimorado', 'Concentração de Mira', 'Ataque Fatal', 'Olhos de Águia'],
    talentos: ['Caçador', 'Bom Apetite', 'Aparência Inofensiva', 'Barulhento'],
    anotacoes: 'Vantagem em testes de Natureza (Passiva de Origem)\n+2 em Testes de Acerto e +1d6 em danos (Passiva de Classe)\n−1 na margem de crítico em ambientes rurais (Segunda Passiva de Origem)'
  }
];

function exAcharPorNome(lista, nome) {
  const alvo = exSemAcento(nome);
  return lista.find(x => exSemAcento(x.name) === alvo) ||
    lista.find(x => exSemAcento(x.name).startsWith(alvo.slice(0, 12)));
}
function abrirFichasOficiais() {
  const grade = document.getElementById('oficiaisGrid');
  grade.innerHTML = FICHAS_OFICIAIS.map((f, i) => `
    <article class="mini-card oficial-card">
      <h4>${exEsc(f.nome)}</h4>
      <p class="desc">Nível ${f.nivel} · ${exEsc(f.origem)} · ${exEsc(f.subclasse)}</p>
      <div class="oficial-stats">
        <span>PDV ${f.pdv}</span><span>PDE ${f.pde}</span><span>SAN ${f.san}</span>
      </div>
      <div class="oficial-attrs">${Object.entries(f.attrs).map(([k, v]) => `<span>${ATRIB_NOMES[k].slice(0, 3)} ${v}</span>`).join('')}</div>
      ${f.tita ? `<p class="desc">Portador do ${exEsc(f.tita.nome)}</p>` : ''}
      <button type="button" class="primary small" style="width:100%;margin-top:10px;" onclick="importarFichaOficial(${i})">Adicionar às minhas fichas</button>
    </article>`).join('');
  document.getElementById('oficiaisOverlay').classList.remove('hidden');
}
function fecharFichasOficiais() { document.getElementById('oficiaisOverlay').classList.add('hidden'); }

function importarFichaOficial(indice) {
  const f = FICHAS_OFICIAIS[indice]; if (!f) return;
  if (window.nuvem && typeof nuvem.podeCriarFicha === 'function' && !nuvem.podeCriarFicha()) return;
  const origem = Object.values(ORIGINS).find(o => exSemAcento(o.name) === exSemAcento(f.origem));
  if (!origem) { exAviso('Não achei a origem', f.origem, true); return; }
  const ch = {
    id: Date.now().toString(), name: f.nome, player: '', campaign: '', alignment: '',
    level: f.nivel, exp: 0, originId: origem.id, originData: origem,
    class: f.classe, subclass: f.subclasse,
    attributes: { ...f.attrs }, attributeBonuses: { agi: 0, sta: 0, str: 0, int: 0, vit: 0 },
    skills: SKILL_LIST.map(s => ({
      name: s.name, base: f.pericias[s.name] || 0, bonus: 0, modifiers: [],
      selectedAttribute: SKILLS_DATA[s.name]?.attributes[0] || 'int'
    })),
    skillPointsGained: 6,
    resources: { hp: { cur: f.pdv, max: f.pdv }, sta: { cur: f.pde, max: f.pde }, san: { cur: f.san, max: f.san } },
    originPassive: { ...origem.passive, acquired: true },
    originAbility: null, originChoices: {}, originAbilityManualUnlock: true,
    abilities: [], abilityLevel: 1, customSkills: [],
    inventory: { personal: { items: [], capacity: 20 }, mount: { items: [], capacity: 20 } },
    talentsDefects: [], sessionState: { pressentimentoUsed: 0, azaradoUsed: false, vicioUnsatisfiedSessions: 0 },
    derivedModifiers: { defesaEsquiva: 0, critMargin: 0, sanDamageReduction: 0, bodyDamageReduction: 0 }, skillFlags: {},
    info: {}, history: (f.anotacoes || '') + '\n\n(Ficha oficial do livro Coordenada RPG.)',
    config: { compartilhar: true, xp: false },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  const faltando = [];
  (f.habilidades || []).forEach(nome => {
    const hab = exAcharPorNome(ABILITIES_DB, nome);
    if (hab) ch.abilities.push({ id: hab.id, choiceValue: null, repeatableChoices: [] });
    else faltando.push(nome);
  });
  (f.talentos || []).forEach(nome => {
    const td = exAcharPorNome([...TALENTS_DB, ...DEFECTS_DB], nome);
    if (td) ch.talentsDefects.push({ uid: 'td_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), itemId: td.id, choiceValue: null });
    else faltando.push(nome);
  });
  (f.customizadas || []).forEach(c => {
    ch.customSkills.push({ id: 'custom_' + Date.now() + Math.random().toString(36).slice(2, 5), name: c.nome, desc: c.desc, level: c.nivel || 3, cost: c.cost || '', category: 'exclusiva', requirements: '', custom: true });
  });
  if (f.tita) {
    const titan = TITAN_PRIMORDIAL_DB.find(t => exSemAcento(t.name) === exSemAcento(f.tita.nome));
    if (titan) ch.shifter = { isShifter: true, titanId: titan.id, controlLevel: f.tita.controle || 1, transformed: false, parts: {}, customAbilities: [], imageUrl: null };
  }
  characters.push(ch);
  recalcAllModifiers(ch);
  if (typeof recalculateResources === 'function') recalculateResources(ch);
  // O sistema recalcula PDV/PDE/SAN pelas regras. Se o livro traz outro número
  // (bônus de níveis antigos, escolhas do personagem), entra um ajuste visível.
  ch.resourceModifiers = ch.resourceModifiers || { hp: [], sta: [], san: [] };
  [['hp', f.pdv], ['sta', f.pde], ['san', f.san]].forEach(([k, alvo]) => {
    const dif = alvo - ch.resources[k].max;
    if (dif) {
      ch.resourceModifiers[k].push({ id: 'oficial_' + k + '_' + Date.now(), name: 'Ajuste da ficha oficial', value: dif });
      ch.resources[k].max = alvo;
    }
    ch.resources[k].cur = alvo;
  });
  saveChars(); renderCharList();
  fecharFichasOficiais();
  exAviso('Ficha adicionada', faltando.length ? `${f.nome}. Confira: não achei ${faltando.join(', ')}.` : `${f.nome} entrou nas suas fichas.`);
  openChar(ch.id);
}

/* botão na tela Soldados */
function exBotaoOficiais() {
  const home = document.getElementById('screenHome'); if (!home) return;
  const titulo = home.querySelector('h2'); if (!titulo || document.getElementById('btnFichasOficiais')) return;
  titulo.insertAdjacentHTML('afterend', `<button type="button" id="btnFichasOficiais" class="ghost small" onclick="abrirFichasOficiais()">Fichas oficiais do livro</button>`);
}

/* ============================================================
   6. BIBLIOTECA DE HABILIDADES: "só as que posso pegar"
   ============================================================ */
const exFiltroOriginal = window.abilityMatchesFilter;
window.abilityMatchesFilter = function (ability, filter) {
  if (filter === 'elegivel') {
    const ch = exFicha(); if (!ch) return true;
    return ability.scope === 'general' || (ch.subclass && (ability.subclasses || []).includes(ch.subclass));
  }
  return exFiltroOriginal(ability, filter);
};
function exMarcarNaoElegiveis() {
  const ch = exFicha(); if (!ch) return;
  document.querySelectorAll('#skillLibraryGrid .mini-card').forEach(card => {
    const h4 = card.querySelector('h4'); if (!h4) return;
    const hab = exAcharPorNome(ABILITIES_DB, h4.textContent);
    if (!hab) return;
    const elegivel = hab.scope === 'general' || (ch.subclass && (hab.subclasses || []).includes(ch.subclass));
    card.classList.toggle('nao-elegivel', !elegivel);
    if (!elegivel && !card.querySelector('.tag.locked')) {
      h4.insertAdjacentHTML('afterend', `<p><span class="tag locked">Fora da sua subclasse</span></p>`);
    }
  });
}
function exBotaoFiltroElegivel() {
  const filtros = document.querySelector('#skillLibraryOverlay .lib-filters');
  if (!filtros || document.getElementById('btnFiltroElegivel')) return;
  filtros.insertAdjacentHTML('afterbegin', `<button type="button" id="btnFiltroElegivel" onclick="setSkillFilter('elegivel', event)">Posso pegar</button>`);
}


/* ============================================================
   8. DADOS NOS TITÃS (escudo do mestre e aba Titã) E NOS SOLDADOS
   ============================================================ */
function exIdDoCard(card, funcao) {
  const el = [...card.querySelectorAll('[onclick]')].find(b => (b.getAttribute('onclick') || '').includes(funcao + '('));
  if (!el) return null;
  const m = el.getAttribute('onclick').match(new RegExp(funcao + "\\('([^']+)'"));
  return m ? m[1] : null;
}
// troca "Força do titã" pelo número, e "Estâmina do portador" pelo atributo de quem carrega
function exResolverTita(texto, attrs, portador) {
  let t = String(texto || '')
    .replace(/(Força|Forca|Agilidade|Intelecto|Vitalidade|Estâmina|Estamina)\s+do\s+titã/gi,
      (_, a) => (attrs && attrs[ATRIB_POR_NOME[exSemAcento(a)]]) ?? 0);
  if (portador) {
    t = t.replace(/(Força|Forca|Agilidade|Intelecto|Vitalidade|Estâmina|Estamina)\s+do\s+portador/gi,
      (_, a) => exValorAtributo(portador, ATRIB_POR_NOME[exSemAcento(a)]));
  }
  return t;
}
// variações de Titã Puro mudam acerto e dano (pág. 86 do livro)
const VARIACOES_TITA = {
  gordo: { acerto: -2, dano: '+1d6', nome: 'Titã Gordo' },
  magro: { acerto: 2, dano: '-1d6', nome: 'Titã Magro' },
  atletico: { acerto: 1, dano: '+1d6', nome: 'Titã Atlético' }
};
function exAtaqueTitaPuro(t) {
  const cat = typeof getPureTitanCategory === 'function' ? getPureTitanCategory(t.categoryId) : null;
  if (!cat) return null;
  const v = VARIACOES_TITA[t.variationId] || null;
  // os valores da ficha do Titã mandam: o mestre pode ter editado acerto e dano
  if (typeof getGMTitanFicha === 'function') {
    const f = getGMTitanFicha(t);
    return { acerto: Number(f.acerto) || 0, dano: f.dano, variacao: v ? v.nome : '' };
  }
  const base = parseInt(String(cat.testeAcerto).replace(/[^0-9+-]/g, ''), 10) || 0;
  return { acerto: base + (v ? v.acerto : 0), dano: cat.dano + (v ? ' ' + v.dano : ''), variacao: v ? v.nome : '' };
}
// O texto vai em atributos, nunca dentro do onclick: assim um apóstrofo
// no nome do ataque ("Golpe d'Asa") não quebra o botão.
function exChipDado(expr, titulo, rotulo, classe, modo) {
  return `<button type="button" class="dado-chip ${classe || ''}" data-rolar="${exEsc(expr)}" data-titulo="${exEsc(titulo)}"${modo ? ` data-modo="${exEsc(modo)}"` : ''}>${exEsc(rotulo)}</button>`;
}
// um só ouvinte para todos os botões de dado da página.
// Na fase de captura: o dado dentro de um cartão que abre/fecha não dispara o cartão junto.
document.addEventListener('click', ev => {
  const alvo = ev.target.closest && ev.target.closest('[data-atributo],[data-pericia],[data-rolar]');
  if (!alvo) return;
  ev.preventDefault(); ev.stopPropagation();
  if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
  if (alvo.dataset.atributo) rolarAtributo(alvo.dataset.atributo);
  else if (alvo.dataset.pericia) rolarPericia(alvo.dataset.pericia);
  else rolarExpressao(alvo.dataset.rolar, alvo.dataset.titulo || 'Rolagem', alvo.dataset.modo || '');
}, true);
// copiar usuário do Discord (e qualquer outro texto marcado com data-copiar)
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-copiar]');
  if (!b) return;
  ev.preventDefault();
  const txt = b.dataset.copiar || '';
  const marcar = () => {
    b.classList.add('copiado');
    const acao = b.querySelector('.rede-acao');
    if (acao && !acao.dataset.antes) { acao.dataset.antes = acao.textContent; acao.textContent = 'Copiado'; }
    setTimeout(() => {
      b.classList.remove('copiado');
      if (acao && acao.dataset.antes) { acao.textContent = acao.dataset.antes; delete acao.dataset.antes; }
    }, 1800);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(marcar, () => exAviso('Copie manualmente', txt));
  } else {
    exAviso('Copie manualmente', txt);
  }
});

function exChipsAcerto(teste, attrs, nome, desvantagem) {
  const chaves = [...new Set((String(teste || '').match(/Força|Forca|Agilidade|Intelecto|Vitalidade|Estâmina|Estamina/gi) || [])
    .map(p => ATRIB_POR_NOME[exSemAcento(p)]))];
  if (!chaves.length) return '';
  return chaves.map(k => {
    const v = (attrs && attrs[k]) || 0;
    return exChipDado(`1d20 + ${v}`, `Acerto (${ATRIB_NOMES[k]}) — ${nome}`,
      `Acerto ${ATRIB_NOMES[k].slice(0, 3)} 1d20+${v}`, '', desvantagem ? 'desvantagem' : '');
  }).join('');
}
// coloca os botões logo abaixo da linha "Ataque:" do cartão, e nunca duas vezes
function exChipsNoCard(card, html, chave) {
  if (!card || !html) return;
  const existente = card.querySelector(':scope > .dados-chips, :scope .dados-chips');
  if (existente) {
    if (existente.dataset.chave === chave) return;
    existente.remove();
  }
  const bloco = `<div class="dados-chips" data-chave="${exEsc(chave)}"><span>Rolar:</span>${html}</div>`;
  const linha = [...card.querySelectorAll('.derived-stat')].find(d => /^\s*Ataque/i.test(d.textContent));
  if (linha) linha.insertAdjacentHTML('afterend', bloco);
  else card.insertAdjacentHTML('beforeend', bloco);
}
function exInjetarEscudo() {
  document.querySelectorAll('#encontroSoldiersList .mini-card').forEach(card => {
    const id = exIdDoCard(card, 'modSoldierHP'); if (!id) return;
    const ch = typeof getCharByIdGM === 'function' ? getCharByIdGM(id) : null; if (!ch) return;
    const forca = exValorAtributo(ch, 'str');
    const luta = typeof calculateSkill === 'function' ? (calculateSkill('luta', ch) || {}).total || 0 : 0;
    let html = exChipDado(`1d20 + ${luta}`, `Luta — ${ch.name}`, `Luta 1d20+${luta}`) +
      exChipDado(`2d10 + ${forca}`, `Lâminas — ${ch.name}`, `Lâminas 2d10+${forca}`, 'primario');
    let chave = `sold:${luta}:${forca}`;
    if (ch.shifter && ch.shifter.transformed && ch.shifter.titanId && typeof getTitanById === 'function') {
      const titan = getTitanById(ch.shifter.titanId);
      const attrs = typeof computeShifterAttrs === 'function' ? computeShifterAttrs(ch) : null;
      if (titan && titan.ataque) {
        const dano = exResolverTita(titan.ataque.dano, attrs, ch);
        html += exChipsAcerto(titan.ataque.test, attrs, titan.name, titan.ataque.desvantagem) +
          exChipDado(dano, `Dano do ${titan.name}`, `Titã ${dano}`, 'primario');
        chave += `:tita:${titan.id}:${dano}`;
      }
    }
    exChipsNoCard(card, html, chave);
  });
  document.querySelectorAll('.mini-card').forEach(card => {
    const id = exIdDoCard(card, 'modGMTitanPart'); if (!id) return;
    const t = (typeof gmTitans !== 'undefined' ? gmTitans : []).find(x => x.id === id); if (!t) return;
    const at = exAtaqueTitaPuro(t); if (!at) return;
    const sinal = at.acerto >= 0 ? '+' : '';
    // a linha "Ataque:" do site mostra a categoria pura: aqui ela passa a mostrar também a variação
    const linha = [...card.querySelectorAll('.derived-stat')].find(d => /^\s*Ataque/i.test(d.textContent));
    if (linha && at.variacao) {
      const valor = linha.querySelector('span:last-child');
      if (valor) valor.textContent = `1d20${sinal}${at.acerto} — ${at.dano} (${at.variacao})`;
    }
    exChipsNoCard(card, exChipDado(`1d20 ${sinal}${at.acerto}`, `Acerto — ${t.name}`, `Acerto 1d20${sinal}${at.acerto}`) +
      exChipDado(at.dano, `Dano — ${t.name}`, `Dano ${at.dano}`, 'primario'),
      `puro:${at.acerto}:${at.dano}`);
  });
  document.querySelectorAll('.mini-card').forEach(card => {
    const id = exIdDoCard(card, 'modGMPrimordialPart'); if (!id) return;
    const t = (typeof gmPrimordialTitans !== 'undefined' ? gmPrimordialTitans : []).find(x => x.id === id); if (!t) return;
    const desv = /desvantagem/i.test(String(t.ataqueTest || ''));
    const dano = exResolverTita(t.ataqueDano, t.attrs, null);
    const regen = exResolverTita(t.regen, t.attrs, null);
    let html = exChipsAcerto(t.ataqueTest, t.attrs, t.name, desv) +
      (dano ? exChipDado(dano, `Dano — ${t.name}`, `Dano ${dano}`, 'primario') : '');
    if (regen && REGEX_DADO.test(regen)) {
      const dependePortador = /portador/i.test(regen);
      html += exChipDado(regen, `Regeneração — ${t.name}`, `Regenerar ${regen}${dependePortador ? ' (+ atributo do portador)' : ''}`);
    }
    exChipsNoCard(card, html, `prim:${dano}:${regen}:${desv}`);
  });
}
// aba Titã da ficha do jogador: usa os atributos do titã já somados ao portador
function exInjetarTitaDaFicha() {
  const ch = exFicha(); if (!ch || !ch.shifter || !ch.shifter.titanId) return;
  const bloco = document.getElementById('shifterStatsBlock'); if (!bloco) return;
  const titan = typeof getTitanById === 'function' ? getTitanById(ch.shifter.titanId) : null; if (!titan) return;
  const attrs = typeof computeShifterAttrs === 'function' ? computeShifterAttrs(ch) : null;
  const dano = exResolverTita(titan.ataque && titan.ataque.dano, attrs, ch);
  const regen = exResolverTita(titan.regen, attrs, ch);
  const desv = !!(titan.ataque && titan.ataque.desvantagem) || /desvantagem/i.test(String(titan.ataque && titan.ataque.test));
  const html = exChipsAcerto(titan.ataque && titan.ataque.test, attrs, titan.name, desv) +
    (dano ? exChipDado(dano, `Dano do ${titan.name}`, `Dano ${dano}`, 'primario') : '') +
    (regen && REGEX_DADO.test(regen) ? exChipDado(regen, `Regeneração do ${titan.name}`, `Regenerar ${regen}`) : '');
  const cartao = bloco.querySelector('.card') || bloco;
  exChipsNoCard(cartao, html, `ficha:${titan.id}:${dano}:${regen}:${desv}`);
}

/* ============================================================
   9. BOTÃO DE ENGRENAGEM: CONFIGURAÇÕES
   ============================================================ */
const PREFS_CHAVE = 'coordPrefs';
function exPrefs() {
  let p = {};
  try { p = JSON.parse(localStorage.getItem(PREFS_CHAVE) || '{}'); } catch (e) { }
  if (p.abrirDados === undefined) p.abrirDados = false;
  if (p.enviarRolagens === undefined) p.enviarRolagens = true;
  if (!p.tema) p.tema = 'escuro';
  if (!p.cor) p.cor = 'aco';
  if (p.corClasse === undefined) p.corClasse = false;
  return p;
}
function exSalvarPrefs(p) { try { localStorage.setItem(PREFS_CHAVE, JSON.stringify(p)); } catch (e) { } }
// ------------------------------------------------------------
// TABELA DE CORES
// Regra: cada paleta é só um matiz (h). Todo o resto sai de uma
// escala fixa, igual para todas, então nenhuma cor fica mais
// clara, mais escura ou mais berrante que a outra.
//   · fundos e superfícies: saturação baixa (sempre o mesmo passo)
//   · texto: claro no tema escuro, escuro no claro, com contraste
//   · destaque: um tom acima das superfícies, legível sobre elas
//   · avisos (erro, acerto, atenção) têm matiz próprio, mas usam
//     a mesma saturação e luminosidade da escala, para combinar
// ------------------------------------------------------------
const CORES_TEMA = {
  aco: { nome: 'Aço', h: 216 },
  sangue: { nome: 'Sangue', h: 6 },
  musgo: { nome: 'Musgo', h: 112 },
  ambar: { nome: 'Âmbar', h: 40 },
  violeta: { nome: 'Violeta', h: 265 },
  turquesa: { nome: 'Turquesa', h: 176 }
};
// escala: [saturação, luminosidade] no escuro e no claro
const ESCALA = {
  escuro: {
    bg: [26, 10], 'bg-2': [24, 12], surface: [22, 15], 'surface-2': [20, 19], 'surface-3': [18, 24],
    border: [17, 25], 'border-light': [15, 35], text: [24, 93], 'text-muted': [12, 70], 'text-dim': [9, 50],
    accent: [40, 72], 'accent-2': [46, 81], 'accent-dim': [30, 35], hover: [18, 28], ink: [30, 9],
    aviso: [46, 66], aviso2: [40, 40]
  },
  claro: {
    bg: [22, 92], 'bg-2': [20, 88], surface: [26, 97], 'surface-2': [22, 93], 'surface-3': [20, 88],
    border: [18, 81], 'border-light': [16, 71], text: [28, 14], 'text-muted': [14, 35], 'text-dim': [10, 52],
    accent: [42, 35], 'accent-2': [48, 27], 'accent-dim': [28, 80], hover: [22, 85], ink: [26, 98],
    aviso: [50, 34], aviso2: [46, 26]
  }
};
// matiz de cada aviso; se a paleta tiver quase o mesmo matiz, o aviso é empurrado
// para o lado, senão "erro" sumiria dentro de um tema vermelho, por exemplo.
const AVISOS = { danger: 10, success: 135, warning: 42, info: 205 };
function exAfasta(hAviso, hTema) {
  // menor distância entre dois matizes na roda de cores (0 a 180)
  const d = Math.abs((((hAviso - hTema + 180) % 360) + 360) % 360 - 180);
  if (d >= 28) return hAviso;
  const sentido = ((hAviso - hTema + 360) % 360) < 180 ? 1 : -1;
  return (hTema + sentido * 26 + 360) % 360;
}
function exHsl(h, s, l) { return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`; }
function exPaleta(corId, claro) {
  const c = CORES_TEMA[corId] || CORES_TEMA.aco;
  const h = c.h;
  const e = claro ? ESCALA.claro : ESCALA.escuro;
  const pal = {};
  for (const [nome, [sat, luz]] of Object.entries(e)) {
    if (nome === 'aviso' || nome === 'aviso2') continue;
    pal[nome] = exHsl(h, sat, luz);
  }
  const [sA, lA] = e.accent;
  pal.suave = `hsl(${h} ${sA}% ${lA}% / 0.12)`;
  pal.fraco = `hsl(${h} ${sA}% ${lA}% / 0.08)`;
  pal.forte = `hsl(${h} ${sA}% ${lA}% / 0.3)`;
  // avisos na mesma escala
  const [sAv, lAv] = e.aviso, [sAv2, lAv2] = e.aviso2;
  for (const [nome, matiz] of Object.entries(AVISOS)) {
    const hh = exAfasta(matiz, h);
    pal[nome] = exHsl(hh, sAv, lAv);
    if (nome === 'danger' || nome === 'success') pal[nome + '-2'] = exHsl(hh, sAv2, lAv2);
  }
  return pal;
}
const TOKENS_COR = ['bg', 'bg-2', 'surface', 'surface-2', 'surface-3', 'border', 'border-light',
  'text', 'text-muted', 'text-dim', 'accent', 'accent-2', 'accent-dim', 'hover', 'ink',
  'danger', 'danger-2', 'success', 'success-2', 'warning', 'info'];

// cor conforme a classe do personagem
const COR_POR_CLASSE = {
  'linha de frente': 'sangue',
  'suporte de campo': 'musgo',
  'especialista de batalha': 'ambar',
  estrategista: 'ambar', capitao: 'ambar'
};
function exCorDaClasse() {
  // A cor da classe só pertence à ficha visível, nunca às outras telas.
  const tela = document.getElementById('screenSheet');
  if (!tela || tela.classList.contains('hidden')) return null;
  const ch = exFicha();
  if (!ch) return null;
  const classe = document.getElementById('charClass') && exFicha() === ch ? (document.getElementById('charClass').value || ch.class) : ch.class;
  return COR_POR_CLASSE[exSemAcento(classe || '')] || COR_POR_CLASSE[exSemAcento(ch.subclass || '')] || null;
}
function exCorAtual() {
  const p = exPrefs();
  if (p.corClasse) return exCorDaClasse() || 'aco';
  return CORES_TEMA[p.cor] ? p.cor : 'aco';
}
function exAplicarTema() {
  const p = exPrefs();
  const claro = p.tema === 'claro';
  if (claro) document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
  const pal = exPaleta(exCorAtual(), claro);
  const raiz = document.documentElement.style;
  TOKENS_COR.forEach(k => raiz.setProperty('--' + k, pal[k]));
  raiz.setProperty('--accent-suave', pal.suave);
  raiz.setProperty('--accent-fraco', pal.fraco);
  raiz.setProperty('--accent-forte', pal.forte);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', pal.bg);
  exAplicarMolduras();
}
function definirTema(tema) { const p = exPrefs(); p.tema = tema; exSalvarPrefs(p); exAplicarTema(); abrirConfiguracoes(); }
function definirCor(cor) {
  const p = exPrefs();
  if (cor === 'classe') { p.corClasse = true; } else { p.corClasse = false; p.cor = cor; }
  exSalvarPrefs(p); exAplicarTema(); abrirConfiguracoes();
}
function exAplicarMolduras() { document.documentElement.classList.toggle('sem-molduras', exPrefs().molduras === false); }
function definirMolduras(v) { const p = exPrefs(); p.molduras = !!v; exSalvarPrefs(p); exAplicarMolduras(); }
function definirAbrirDados(v) { const p = exPrefs(); p.abrirDados = !!v; exSalvarPrefs(p); }
function definirEnviarRolagens(v) { const p = exPrefs(); p.enviarRolagens = !!v; exSalvarPrefs(p); }

function abrirConfiguracoes() {
  const corpo = document.getElementById('configCorpo'); if (!corpo) return;
  const p = exPrefs();
  const ch = exFicha();
  const aberta = ch && !document.getElementById('screenSheet').classList.contains('hidden');
  const logado = !!(window.nuvem && document.querySelector('#nuvemConta .nv-conta-btn'));
  const cfg = ch ? exConfig(ch) : null;
  corpo.innerHTML = `
    <h3>Aparência</h3>
    <div class="config-tema">
      <button type="button" class="${p.tema !== 'claro' ? 'primary' : ''}" onclick="definirTema('escuro')">Escuro</button>
      <button type="button" class="${p.tema === 'claro' ? 'primary' : ''}" onclick="definirTema('claro')">Claro</button>
    </div>
    <label class="config-rotulo">Cor <span class="wizard-dica">o site inteiro segue a cor escolhida</span></label>
    <div class="config-cores">
      ${Object.entries(CORES_TEMA).map(([id, c]) => {
        const pal = exPaleta(id, p.tema === 'claro');
        const ativa = !p.corClasse && exCorAtual() === id;
        return `<button type="button" class="config-cor ${ativa ? 'ativa' : ''}" onclick="definirCor('${id}')" title="${c.nome}"
          style="--p-bg:${pal.bg};--p-surface:${pal['surface-2']};--p-accent:${pal.accent};--p-text:${pal.text};--p-borda:${pal['border-light']}">
          <span class="config-cor-amostra" aria-hidden="true"><i class="a"></i><i class="b"></i><i class="c"></i></span>
          <span class="config-cor-nome">${c.nome}</span></button>`;
      }).join('')}
    </div>
    <label class="nv-opcao"><input type="checkbox" ${p.corClasse ? 'checked' : ''} onchange="definirCor(this.checked ? 'classe' : '${p.cor || 'aco'}')" />
      <span><strong>Usar a cor da classe do personagem</strong>
      <small>Linha de Frente fica vermelho, Suporte de Campo verde e Especialista de Batalha amarelo. A cor muda conforme a ficha aberta${p.corClasse ? ` (agora: ${(CORES_TEMA[exCorAtual()] || {}).nome})` : ''}.</small></span></label>

    <h3>Molduras</h3>
    <label class="nv-opcao"><input type="checkbox" ${p.molduras !== false ? 'checked' : ''} onchange="definirMolduras(this.checked)" />
      <span><strong>Molduras temáticas</strong><small>Cantoneiras de mapa nos cantos dos cartões. Desligado, ficam só as bordas simples.</small></span></label>

    <h3>Rolagens</h3>
    <label class="nv-opcao"><input type="checkbox" ${p.enviarRolagens !== false ? 'checked' : ''} onchange="definirEnviarRolagens(this.checked)" />
      <span><strong>Enviar minhas rolagens para a campanha</strong><small>O mestre e os jogadores da campanha veem o que você rolou. Desligado, a rolagem fica só para você.</small></span></label>

    ${aberta ? `
    <h3>Ficha aberta — ${exEsc(ch.name || 'sem nome')}</h3>
    <label class="nv-opcao"><input type="checkbox" ${cfg.compartilhar ? 'checked' : ''} onchange="fichaCompartilhar(this.checked); abrirConfiguracoes()" />
      <span><strong>Mostrar esta ficha para os outros jogadores da campanha</strong>
      <small>${ch._remote ? 'Você é o mestre: pode desligar para a ficha deste jogador.' : 'Só vale quando o mestre libera as fichas na campanha. O mestre sempre vê a sua, e também pode desligar isso.'}</small></span></label>
    <label class="nv-opcao"><input type="checkbox" ${cfg.xp ? 'checked' : ''} onchange="fichaUsarXp(this.checked)" />
      <span><strong>Usar o sistema de XP</strong><small>Mostra a meta do próximo nível e as conquistas na aba Progressão.</small></span></label>
    ` : '<h3>Ficha</h3><p class="nv-nota">Abra uma ficha para ver as opções dela aqui.</p>'}

    ${logado ? `
    <h3>Conta</h3>
    <div class="config-acoes">
      <button type="button" onclick="fecharConfiguracoes(); nuvem.abrirPerfil()">Editar perfil</button>
      <button type="button" onclick="fecharConfiguracoes(); nuvem.abrirCampanhas()">Minhas campanhas</button>
      <button type="button" class="danger" onclick="fecharConfiguracoes(); nuvem.sair()">Sair da conta</button>
    </div>` : ''}`;
  document.getElementById('configModal').classList.remove('hidden');
}
function fecharConfiguracoes() { document.getElementById('configModal').classList.add('hidden'); }


/* ============================================================
   10. TÍTULO DA ABA DO NAVEGADOR
   Segue a tela aberta: ficha, campanha, escudo, Liandry...
   ============================================================ */
const TITULOS_TELA = {
  screenMainMenu: () => 'Coordenada — RPG de mesa',
  screenHome: () => 'Soldados',
  screenWizard: () => 'Nova ficha',
  screenCampanhas: () => 'Campanhas',
  screenLiandry: () => 'Liandry',
  screenContatos: () => 'Contatos',
  screenConvite: () => 'Convite para uma campanha',
  screenSheet: () => { const ch = exFicha(); return ch ? (ch.name || 'Ficha sem nome') : 'Ficha'; },
  screenEscudo: () => {
    const code = window.nuvem && typeof nuvem.campanhaGM === 'function' ? nuvem.campanhaGM() : null;
    const nome = code && window.nuvem && typeof nuvem.nomeDaCampanha === 'function' ? nuvem.nomeDaCampanha(code) : '';
    return nome ? `${nome} — Escudo do Mestre` : 'Escudo do Mestre';
  },
  screenCampanhaJogador: () => {
    const nome = window.nuvem && typeof nuvem.nomeDaCampanhaAberta === 'function' ? nuvem.nomeDaCampanhaAberta() : '';
    return nome || 'Campanha';
  }
};
function exAtualizarTitulo() {
  const visivel = Object.keys(TITULOS_TELA).find(id => {
    const el = document.getElementById(id);
    return el && !el.classList.contains('hidden');
  });
  let texto = 'Coordenada';
  if (visivel) {
    try { texto = TITULOS_TELA[visivel](); } catch (e) { }
    if (visivel !== 'screenMainMenu') texto = `${texto} — Coordenada`;
  }
  if (document.title !== texto) document.title = texto;
}
function exObservarClasse() {
  ['charClass', 'charSubclass'].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.dataset.nvCor) { el.dataset.nvCor = '1'; el.addEventListener('change', () => { if (exPrefs().corClasse) setTimeout(exAplicarTema, 0); }); }
  });
}
function exObservarTelas() {
  exObservarClasse();
  const alvos = Object.keys(TITULOS_TELA).map(id => document.getElementById(id)).filter(Boolean);
  if (!alvos.length) return;
  const obs = new MutationObserver(() => { exAtualizarTitulo(); exAtualizarDado(); if (exPrefs().corClasse) exAplicarTema(); });
  alvos.forEach(el => obs.observe(el, { attributes: true, attributeFilter: ['class'] }));
  const nome = document.getElementById('charName');
  if (nome) nome.addEventListener('input', exAtualizarTitulo);
  exAtualizarTitulo(); exAtualizarDado();
}

/* ============================================================
   7. LIGAÇÃO COM O RESTO DO SITE
   ============================================================ */
function exAtualizarFicha() {
  if (!exFicha()) return;
  exAtualizarTitulo(); if (exPrefs().corClasse) exAplicarTema(); exPainelXp(); exInjetarAtributos(); exInjetarPericias(); exInjetarDerivados(); exInjetarTitaDaFicha();
}
// dados soltos pela ficha: ataque desarmado, equipamentos do DMT, etc.
function exInjetarDerivados() {
  document.querySelectorAll('.unarmed-damage').forEach(el => {
    if (el.dataset.nvDado) return;
    const expr = (el.textContent || '').match(/\d*d\d+(\s*[+-]\s*\d+)?/i);
    if (!expr) return;
    el.dataset.nvDado = '1';
    const chip = exChipDado(expr[0].replace(/\s+/g, ''), 'Ataque desarmado', 'Rolar', 'primario');
    // o dado fica na mesma linha do valor, não numa linha solta embaixo
    (el.lastElementChild || el).insertAdjacentHTML('beforeend', ' ' + chip);
  });
  document.querySelectorAll('#tabInventory .item-detail, #tabInventory .card > p').forEach(el => exChipsDeTexto(el, 'Equipamento'));
}
function exEnvolver(nome, depois) {
  const original = window[nome];
  if (typeof original !== 'function') return;
  window[nome] = function (...args) {
    const r = original.apply(this, args);
    try { depois(...args); } catch (e) { console.error(e); }
    return r;
  };
}
exEnvolver('renderSkills', exInjetarPericias);
exEnvolver('renderQuickAttacks', exInjetarAtaques);
exEnvolver('renderInventory', exInjetarInventario);
exEnvolver('renderDMT', () => { exPainelDmt(); exInjetarDmt(); exInjetarDerivados(); });
exEnvolver('renderCharList', exBotaoOficiais);
exEnvolver('renderEscudoEncontro', exInjetarEscudo);
exEnvolver('renderGMTitansList', exInjetarEscudo);
exEnvolver('renderGMPrimordialList', exInjetarEscudo);
exEnvolver('renderShifterTab', exInjetarTitaDaFicha);
exEnvolver('openChar', exAtualizarFicha);
exEnvolver('renderSkillLibrary', () => { exBotaoFiltroElegivel(); exMarcarNaoElegiveis(); });
exEnvolver('openSkillLibrary', () => { exBotaoFiltroElegivel(); exMarcarNaoElegiveis(); });

function exInjetarDmt() {
  const ch = exFicha(); if (!ch) return;
  const alvo = document.getElementById('dmtMelhorias'); if (!alvo || alvo.querySelector('.dados-chips')) return;
  const ef = exEfeitosDmt(ch);
  const forca = exValorAtributo(ch, 'str');
  const canhao = `3d6${ef.canhaoExtra ? ` + ${ef.canhaoExtra}` : ''}`;
  alvo.insertAdjacentHTML('afterbegin', `<div class="dados-chips"><span>Rolar:</span>
    ${exChipDado(`2d10 + ${forca}`, 'Dano das lâminas', `Lâminas 2d10+${forca}`, 'primario')}
    ${exChipDado(canhao, 'Dano do canhão de mão', `Canhão ${canhao}`)}</div>`);
}

document.addEventListener('DOMContentLoaded', () => {
  exAplicarTema();
  exObservarTelas();
  exMontarPainelDados();
  exInjetarAtributos();
  exBotaoOficiais();
});
exAplicarTema();
if (document.readyState !== 'loading') { exObservarTelas(); exMontarPainelDados(); exInjetarAtributos(); exBotaoOficiais(); }

/* ============================================================
   8. HABILIDADES AUTOMATIZADAS
   Cada habilidade abaixo descreve o que a ficha consegue aplicar
   sozinha. O resto (narrativa, alvos, efeitos no inimigo) continua
   sendo coisa de mesa e fica só no texto do cartão.

   Chaves de efeito aceitas em "sempre" e "ativo" (uma por nível):
     acerto        +N em Testes de Acerto
     esquiva       +N em Testes de Defesa com esquiva
     bloqueio      +N em Testes de Defesa com bloqueio
     critico       −N na margem de crítico
     reducaoDano   N fixo subtraído do dano em PDV
     reducaoPor    ['Fortitude','Vitalidade'] — soma essas perícias na redução
     reducaoSan    N subtraído do dano em Sanidade
     movDmt        +N metros de deslocamento, só com o DMT
     gasMov        −N de gás por ação de movimento
     inventario    +N espaços no inventário
     pericias      +N em todas as perícias
     pericia       { nome, valor }
     esquivaAgi    soma a Agilidade mais uma vez na esquiva
   Chaves do bloco:
     permPde   PDE permanente pago no desbloqueio
     permPorEscolha  PDE permanente por escolha feita (Melhoria Geral)
     dmt       os bônus só valem usando o DMT
     dano      dado de dano extra por nível (vira botão de rolagem)
     pilha     { rotulo, max } — bônus que acumula por acerto
     nota      aviso curto no cartão
   ============================================================ */
const HAB_AUTO = {
  /* ---- passivas permanentes ---- */
  proficiencia_dmt: {
    permPde: 7, dmt: true,
    sempre: [
      { esquiva: 1, gasMov: 1 },
      { esquiva: 1, gasMov: 1, movDmt: 2 },
      { esquiva: 1, gasMov: 1, movDmt: 4, acerto: 1 },
      { esquiva: 1, gasMov: 1, movDmt: 4, acerto: 1 }
    ],
    notasNivel: [
      { de: 2, texto: 'Pode trocar lâminas, repor munição ou trocar cilindros no ar sem provocar ataque de oportunidade, mesmo a até 5m de um inimigo.' },
      { de: 4, texto: 'Vantagem em testes de fuga e em testes de aumento de velocidade usando o DMT.' }
    ]
  },
  melhoria_geral: { permPorEscolha: 2, nota: 'O +1 de cada perícia escolhida já entra na lista de Perícias.' },
  aumento_de_carga: {
    permPde: 4,
    sempre: [{ inventario: 3 }, { inventario: 4 }, { inventario: 5 }, { inventario: 6 }]
  },
  mestre_do_improviso: { permPde: 6 },
  veterano_de_guerra: {
    permPde: 6,
    sempre: [null, null,
      { reducaoPor: ['Fortitude'], reducaoSan: 1 },
      { reducaoPor: ['Fortitude', 'Vontade'], reducaoSan: 2 }]
  },

  /* ---- ativáveis em combate ---- */
  concentracao_total: { ativo: [{ acerto: 2 }, { acerto: 3 }, { acerto: 3 }, { acerto: 4 }] },
  golpe_de_sorte: { ativo: [{ critico: 3 }, { critico: 4 }, { critico: 5 }, { critico: 6 }], nota: 'Vale para o próximo teste.' },
  esquiva_avancada: {
    ativo: [null, { esquiva: 2 }, { esquiva: 3 }, { esquiva: 3, esquivaAgi: true }],
    nota: 'A vantagem no teste de esquiva é manual; o bônus numérico entra sozinho.'
  },
  casca_grossa: {
    ativo: [{ reducaoPor: ['Fortitude'], reducaoPorAtributo: ['vit'] },
      { reducaoPor: ['Fortitude'], reducaoPorAtributo: ['vit'], bloqueio: 2 },
      { reducaoPor: ['Fortitude'], reducaoPorAtributo: ['vit'], bloqueio: 2 },
      { reducaoPor: ['Fortitude'], reducaoPorAtributo: ['vit'], bloqueio: 2 }]
  },
  provocacao: { ativo: [null, { esquiva: 2, bloqueio: 2 }, null, { esquiva: 2, bloqueio: 2 }] },
  instinto_sobrevivencia: { ativo: [null, { acerto: 3 }, { acerto: 3 }, { acerto: 3 }], dano: [null, null, '1d10', '1d10'] },
  sob_pressao: { ativo: [{ critico: 1 }, { critico: 1 }, { critico: 1, acerto: 2 }, { critico: 1, acerto: 2 }], dano: [null, '1d6', '1d6', '1d8'] },
  sede_de_sangue: {
    pilha: { rotulo: 'Acertos acumulados', max: 15 },
    ativo: [{ acertoPorPilha: 1 }, { acertoPorPilha: 1 }, { acertoPorPilha: 1 }, { acertoPorPilha: 1 }],
    nota: 'Uma rodada inteira sem acertar zera a contagem.'
  },
  sacrificio: { ativo: [{ critico: 4 }, { critico: 4 }, { critico: 6 }, { critico: 6 }], dano: ['2d8', '3d8', '3d12', '3d12'] },
  reviravolta: { dano: ['1d10', '2d6', '3d6', '3d8'] },
  explorar_ferimento: { ativo: [null, null, null, { acerto: 2 }], dano: [null, '1d10', '2d6', '2d6'] },
  finta: { ativo: [null, null, null, { critico: 2 }], dano: [null, '1d8', '1d12', '1d12'] },
  impulso_aprimorado: { dano: ['1d6', '1d8', '1d8', '1d10'] },
  revigoracao: { cura: ['2d4 + Estâmina', '2d6 + Estâmina', '3d6 + Estâmina', '4d6 + Estâmina'] },

  /* ---- exclusivas ---- */
  investida_relampago: { ativo: [{ acerto: 5 }, { acerto: 5 }, { acerto: 5 }, { acerto: 5 }] },
  ataques_em_serie: { ativo: [null, { acerto: -6 }, { acerto: -5 }, { acerto: -4 }] },
  eficiencia_letal: { ativo: [null, null, { gasMov: 1 }, { gasMov: 1 }], dano: [null, '1d6', '1d6', '1d10'] },
  forca_bruta: { nota: 'O dano extra é Força ×2 (N3: ×3); role o ataque e some.' },
  olhos_de_aguia: { dano: ['1d10', '2d8', '2d10', '2d12'] },
  concentracao_mira: { ativo: [null, { critico: 3 }, { critico: 3, acerto: 3 }, { critico: 5, acerto: 3 }] },
  tiro_de_raspao: { dano: ['1d8', '1d10', '1d10', '1d12'] },
  tiro_de_auxilio: { dano: ['1d8', '1d8', '1d8', '1d12'] },
  tamanho_nao_e_documento: { nota: 'Dano extra pelo tamanho do Titã: role conforme o nível desbloqueado.' },
  apoio_medicinal: { nota: 'O bônus vai para quem foi curado, não para a sua ficha.' },
  medicina_avancada: { cura: ['+1d8 PDV', '+1d8 PDV e +1d4 PDE', '+1d10 PDV e +1d6 PDE', '+1d12 PDV e +1d8 PDE'] },
  auxilio_duplo: { ativo: [null, { acerto: 2 }, null, null], dano: ['1d8', '1d8', '1d8', '2d6'] },
  ate_o_ultimo_homem: { cura: ['+1d8 na cura de aliado abaixo da metade', '+1d8', '+1d8', '+1d8'] },
  ultimo_a_cair: { ativo: [null, null, null, { critico: 3 }], dano: [null, null, '1d10', '1d10'] },
  maos_de_ouro: { dano: ['1d4', '1d4', '1d4', '1d6'], nota: 'Vale por equipamento influenciado; some ao dano daquele item.' },
  obra_prima: { dano: [null, '1d4', null, '1d4'], nota: 'Bônus da invenção, não da ficha.' },
  engenharia_especializada: { dano: [null, '1d4', '1d6', '1d6'], nota: 'Bônus do equipamento preparado, não da ficha.' },
  golpe_baixo: { ativo: [{ acerto: 2 }, { acerto: 3 }, null, { acerto: 2 }], dano: ['1d6', '1d8', '1d10', '1d12'] },
  coracao_valente: { nota: 'Os bônus vão para os aliados inspirados.' },
  abrir_brechas: { dano: ['1d12', '2d8', '2d12', '3d10'], nota: 'O dano extra vale para você e para os aliados.' },
  planejamento: { ativo: [null, { acerto: 1 }, { acerto: 1, critico: 1 }, { acerto: 1, critico: 1 }], dano: ['1d4', '1d4', '1d4', '1d6'], nota: 'Ligue enquanto estiver seguindo o plano.' },
  ataque_coordenado: { nota: 'No N4, some a sua Tática ao dano de todos do grupo.' },
  senso_de_batalha: { ativo: [null, { pericias: 1 }, { pericias: 1 }, { pericias: 2 }], nota: 'Vale só no turno extra, antes da iniciativa.' },
  'instinto_aguçado': { ativo: [null, { pericia: { nome: 'Exploração', valor: 2 } }, { pericia: { nome: 'Exploração', valor: 2 } }, { pericia: { nome: 'Exploração', valor: 2 } }] }
};

// custo de PDE por uso, lido do próprio texto do livro ("Custo: 6 PDE e ...")
function habCustoPde(ability) {
  if (!ability || !ability.levels) return [];
  let ultimo = 0;
  return ability.levels.map(l => {
    if (/Sem altera/i.test(l)) return ultimo;
    const m = l.match(/Custo:\s*(\d+)\s*PDE/i);
    ultimo = m ? parseInt(m[1], 10) : 0;
    return ultimo;
  });
}
// nível desbloqueado de uma habilidade, já contando o bônus Ackerman
function habNivel(ch, acquired) {
  if (!ch || !acquired) return 0;
  let n = typeof getAbilityLevelForCharLevel === 'function' ? getAbilityLevelForCharLevel(ch.level) : 0;
  if (ch.originId === 'ackerman' && ch.originAbilityChoice === acquired.id) n = Math.min(4, n + 1);
  return n;
}
// o bloco de efeitos de um nível (cai para o nível anterior quando aquele não muda nada)
function habEfeito(lista, nivel) {
  if (!Array.isArray(lista) || nivel < 1) return null;
  return lista[Math.min(nivel, lista.length) - 1] || null;
}
function habPericia(ch, nome) {
  if (typeof calculateSkill !== 'function') return 0;
  const chave = exSemAcento(nome).replace(/\s+/g, '');
  const s = (ch.skills || []).find(x => exSemAcento(x.name).replace(/\s+/g, '') === chave);
  if (!s) return 0;
  const calc = calculateSkill(typeof SKILLS_DATA === 'object' && SKILLS_DATA[s.name] ? SKILLS_DATA[s.name].id : s.name.toLowerCase(), ch);
  return calc ? calc.total : 0;
}

// soma tudo o que as habilidades adquiridas aplicam sozinhas
function habResumo(ch) {
  const z = {
    permPde: 0, inventario: 0, acerto: 0, esquiva: 0, bloqueio: 0, critico: 0,
    reducaoDano: 0, reducaoSan: 0, movDmt: 0, gasMov: 0, esquivaAgi: false,
    pericias: 0, periciaExtra: [], dmt: { acerto: 0, esquiva: 0 }, linhas: []
  };
  if (!ch || !Array.isArray(ch.abilities)) return z;
  for (const adq of ch.abilities) {
    const auto = HAB_AUTO[adq.id]; if (!auto) continue;
    const ability = typeof findAbility === 'function' ? findAbility(adq.id) : null;
    const nivel = habNivel(ch, adq);
    // nível 0 = habilidade ainda não desbloqueada: não cobra nem concede nada
    if (nivel < 1) continue;
    if (auto.permPde) z.permPde += auto.permPde;
    if (auto.permPorEscolha) z.permPde += auto.permPorEscolha * ((adq.repeatableChoices || []).length);
    const blocos = [];
    const sempre = habEfeito(auto.sempre, nivel); if (sempre) blocos.push(sempre);
    if (adq.ativo) { const at = habEfeito(auto.ativo, nivel); if (at) blocos.push(at); }
    for (const e of blocos) {
      const pilhas = auto.pilha ? Math.max(0, Math.min(auto.pilha.max, adq.pilhas || 0)) : 0;
      const acerto = (e.acerto || 0) + (e.acertoPorPilha ? e.acertoPorPilha * pilhas : 0);
      if (acerto) { z.acerto += acerto; if (auto.dmt) z.dmt.acerto += acerto; }
      if (e.esquiva) { z.esquiva += e.esquiva; if (auto.dmt) z.dmt.esquiva += e.esquiva; }
      if (e.bloqueio) z.bloqueio += e.bloqueio;
      if (e.critico) z.critico += e.critico;
      if (e.reducaoDano) z.reducaoDano += e.reducaoDano;
      if (e.reducaoSan) z.reducaoSan += e.reducaoSan;
      if (e.movDmt) z.movDmt += e.movDmt;
      if (e.gasMov) z.gasMov += e.gasMov;
      if (e.inventario) z.inventario += e.inventario;
      if (e.pericias) z.pericias += e.pericias;
      if (e.pericia) z.periciaExtra.push({ ...e.pericia, fonte: ability ? ability.name : adq.id });
      if (e.esquivaAgi) z.esquivaAgi = true;
      (e.reducaoPor || []).forEach(p => { z.reducaoDano += habPericia(ch, p); });
      (e.reducaoPorAtributo || []).forEach(a => { z.reducaoDano += exValorAtributo(ch, a); });
    }
    if (blocos.length && ability) z.linhas.push({ nome: ability.name, dmt: !!auto.dmt, efeitos: blocos });
  }
  if (z.esquivaAgi) z.esquiva += exValorAtributo(ch, 'agi');
  return z;
}

/* ---- ligação com o motor da ficha ---- */
// O PDE permanente sai do máximo; os espaços extras entram na capacidade.
const exSomaRecOriginal = window.sumResourceModifiers;
window.sumResourceModifiers = function (ch, key) {
  let v = exSomaRecOriginal(ch, key);
  if (key === 'sta') v -= habResumo(ch).permPde;
  return v;
};
const exCapOriginal = window.getPersonalInventoryCapacity;
window.getPersonalInventoryCapacity = function (ch) {
  return exCapOriginal(ch) + habResumo(ch).inventario;
};

// Os bônus de combate entram nos modificadores derivados.
const exRecalcHab = window.recalcAllModifiers;
window.recalcAllModifiers = function (ch) {
  exRecalcHab(ch);
  if (!ch) return;
  const h = habResumo(ch);
  const d = ch.derivedModifiers;
  d.testesAcerto = (d.testesAcerto || 0) + h.acerto;
  d.defesaEsquiva = (d.defesaEsquiva || 0) + h.esquiva;
  d.defesaBloqueio = (d.defesaBloqueio || 0) + h.bloqueio;
  d.critMargin = (d.critMargin || 0) - h.critico;      // margem menor = crítico mais fácil
  d.sanDamageReduction = (d.sanDamageReduction || 0) + h.reducaoSan;
  d.reducaoDano = (d.reducaoDano || 0) + h.reducaoDano;
  d.movimentoDmt = (d.movimentoDmt || 0) + h.movDmt;
  d.gasMovimento = (d.gasMovimento || 0) + h.gasMov;
  d.esquivaDmt = (d.esquivaDmt || 0) + h.dmt.esquiva;
  d.acertoDmt = (d.acertoDmt || 0) + h.dmt.acerto;
  if (h.pericias || h.periciaExtra.length) {
    ch.skills.forEach(s => {
      if (h.pericias) s.modifiers.push({ id: genId(), source: 'Habilidade ativa', sourceType: 'ability', value: h.pericias, ignoresCap: true });
    });
    h.periciaExtra.forEach(p => {
      const chave = exSemAcento(p.nome).replace(/\s+/g, '');
      const s = ch.skills.find(x => exSemAcento(x.name).replace(/\s+/g, '') === chave);
      if (s) s.modifiers.push({ id: genId(), source: `Habilidade: ${p.fonte}`, sourceType: 'ability', value: p.valor, ignoresCap: true });
    });
  }
  // o máximo de PDE depende do custo permanente, então recalcula depois de somar
  if (typeof recalculateResources === 'function') recalculateResources(ch);
};

/* ---- painel de automação dentro do cartão da habilidade ---- */
const HAB_ROTULOS = {
  acerto: v => `${v >= 0 ? '+' : ''}${v} em Testes de Acerto`,
  esquiva: v => `+${v} em Testes de Defesa com esquiva`,
  bloqueio: v => `+${v} em Testes de Defesa com bloqueio`,
  critico: v => `−${v} na margem de crítico`,
  reducaoDano: v => `−${v} no dano recebido`,
  reducaoSan: v => `−${v} no dano de Sanidade`,
  movDmt: v => `+${v}m de deslocamento com o DMT`,
  gasMov: v => `−${v} de gás por ação de movimento`,
  inventario: v => `+${v} espaços no inventário`,
  pericias: v => `+${v} em todas as perícias`,
  esquivaAgi: () => 'soma a Agilidade de novo na esquiva',
  acertoPorPilha: v => `+${v} em Testes de Acerto por acerto acumulado`
};
function habTextoEfeito(e) {
  if (!e) return '';
  const partes = [];
  for (const [k, v] of Object.entries(e)) {
    if (k === 'reducaoPor') { partes.push(`−${v.join(' e ')} no dano recebido`); continue; }
    if (k === 'reducaoPorAtributo') { partes.push(`−${v.map(a => ATRIB_NOMES[a] || a).join(' e ')} no dano recebido`); continue; }
    if (k === 'pericia') { partes.push(`+${v.valor} em ${v.nome}`); continue; }
    const f = HAB_ROTULOS[k];
    if (f) partes.push(f(v));
  }
  return partes.join(' · ');
}
function habPainel(acquired) {
  const ch = exFicha(); if (!ch) return '';
  // sem entrada na tabela, a habilidade ainda ganha o botão de gastar PDE
  const auto = HAB_AUTO[acquired.id] || {};
  const ability = findAbility(acquired.id); if (!ability) return '';
  const nivel = habNivel(ch, acquired);
  const custos = habCustoPde(ability);
  const custo = nivel >= 1 ? (custos[Math.min(nivel, custos.length) - 1] || 0) : 0;
  const sempre = habEfeito(auto.sempre, nivel);
  const ativo = habEfeito(auto.ativo, nivel);
  const dano = habEfeito(auto.dano, nivel);
  const cura = habEfeito(auto.cura, nivel);
  const linhas = [];
  if (nivel < 1) {
    return `<div class="hab-auto"><ul class="hab-auto-lista"><li>Esta habilidade só passa a valer no <strong>nível 1</strong> do personagem. Suba o nível na ficha para a automação entrar.</li></ul></div>`;
  }
  if (auto.permPde) linhas.push(`<li>Custo permanente: <strong>−${auto.permPde} PDE</strong> no máximo, já descontado.</li>`);
  if (auto.permPorEscolha) {
    const n = (acquired.repeatableChoices || []).length;
    linhas.push(`<li>Custo permanente: <strong>−${auto.permPorEscolha * n} PDE</strong> (${auto.permPorEscolha} por perícia escolhida), já descontado.</li>`);
  }
  if (sempre) linhas.push(`<li>Sempre ativo: <strong>${exEsc(habTextoEfeito(sempre))}</strong>${auto.dmt ? ' <em>(enquanto usa o DMT)</em>' : ''}.</li>`);
  if (auto.nota) linhas.push(`<li>${exEsc(auto.nota)}</li>`);
  (auto.notasNivel || []).filter(n => nivel >= n.de).forEach(n => linhas.push(`<li>${exEsc(n.texto)}</li>`));
  let controle = '';
  if (ativo) {
    const marcado = acquired.ativo ? 'checked' : '';
    controle += `<label class="hab-switch"><input type="checkbox" ${marcado} data-hab-ativa="${exEsc(acquired.id)}" />
      <span>Ativa agora — ${exEsc(habTextoEfeito(ativo))}${auto.dmt ? ' (com o DMT)' : ''}</span></label>`;
  }
  if (auto.pilha) {
    const n = Math.max(0, Math.min(auto.pilha.max, acquired.pilhas || 0));
    controle += `<div class="hab-pilha"><span>${exEsc(auto.pilha.rotulo)}</span>
      <button type="button" class="small" data-hab-pilha="${exEsc(acquired.id)}" data-delta="-1">−</button>
      <strong>${n}</strong>
      <button type="button" class="small" data-hab-pilha="${exEsc(acquired.id)}" data-delta="1">+</button>
      <button type="button" class="small" data-hab-pilha="${exEsc(acquired.id)}" data-delta="0">zerar</button></div>`;
  }
  const botoes = [];
  if (custo > 0) botoes.push(`<button type="button" class="small primary" data-hab-pde="${exEsc(acquired.id)}" data-custo="${custo}">Usar (−${custo} PDE)</button>`);
  if (dano) botoes.push(exChipDado(dano, `Dano extra — ${ability.name}`, `Dano extra ${dano}`, 'primario'));
  if (cura) linhas.push(`<li>Recupera: <strong>${exEsc(cura)}</strong>.</li>`);
  if (!linhas.length && !controle && !botoes.length) return '';
  return `<div class="hab-auto">
    ${linhas.length ? `<ul class="hab-auto-lista">${linhas.join('')}</ul>` : ''}
    ${controle}
    ${botoes.length ? `<div class="hab-auto-botoes">${botoes.join('')}</div>` : ''}
  </div>`;
}
function habSalvarERedesenhar() {
  const ch = exFicha(); if (!ch) return;
  recalcAllModifiers(ch);
  exSalvar();
  renderAbilities(); updateAttrUI(); updateResourceUI(); renderSkills(); renderModifierStats();
  if (typeof renderInventory === 'function') renderInventory();
}
document.addEventListener('change', ev => {
  const alvo = ev.target.closest && ev.target.closest('[data-hab-ativa]');
  if (!alvo) return;
  const ch = exFicha(); if (!ch) return;
  const adq = (ch.abilities || []).find(a => a.id === alvo.dataset.habAtiva); if (!adq) return;
  adq.ativo = alvo.checked;
  habSalvarERedesenhar();
});
document.addEventListener('click', ev => {
  const pilha = ev.target.closest && ev.target.closest('[data-hab-pilha]');
  if (pilha) {
    const ch = exFicha(); if (!ch) return;
    const adq = (ch.abilities || []).find(a => a.id === pilha.dataset.habPilha); if (!adq) return;
    const auto = HAB_AUTO[adq.id];
    const d = parseInt(pilha.dataset.delta, 10);
    adq.pilhas = d === 0 ? 0 : Math.max(0, Math.min(auto.pilha.max, (adq.pilhas || 0) + d));
    habSalvarERedesenhar();
    return;
  }
  const pde = ev.target.closest && ev.target.closest('[data-hab-pde]');
  if (pde) {
    const ch = exFicha(); if (!ch) return;
    const custo = parseInt(pde.dataset.custo, 10) || 0;
    const ability = findAbility(pde.dataset.habPde);
    if (ch.resources.sta.cur < custo) { exAviso('PDE insuficiente', `Faltam ${custo - ch.resources.sta.cur} PDE para usar ${ability ? ability.name : 'esta habilidade'}.`, true); return; }
    ch.resources.sta.cur -= custo;
    const adq = (ch.abilities || []).find(a => a.id === pde.dataset.habPde);
    if (adq && HAB_AUTO[adq.id] && HAB_AUTO[adq.id].ativo) adq.ativo = true;
    habSalvarERedesenhar();
    exAviso(ability ? ability.name : 'Habilidade usada', `−${custo} PDE. Restam ${ch.resources.sta.cur}.`);
  }
});
// cada cartão passa a carregar o id da habilidade, para o painel achar o dono certo
const exCartaoOriginal = window.buildAbilityCard;
window.buildAbilityCard = function (acquired) {
  const card = exCartaoOriginal.call(this, acquired);
  if (card && acquired && acquired.id) card.dataset.habId = acquired.id;
  return card;
};
// encaixa o painel em cada cartão, sem mexer no renderAbilities original
function habInjetarCartoes() {
  const ch = exFicha(); if (!ch) return;
  document.querySelectorAll('.ability-item[data-hab-id]').forEach(card => {
    if (card.querySelector('.hab-auto')) return;
    const adq = (ch.abilities || []).find(a => a.id === card.dataset.habId);
    if (!adq) return;
    const html = habPainel(adq);
    if (!html) return;
    const botao = card.querySelector('button.danger');
    if (botao) botao.insertAdjacentHTML('beforebegin', html); else card.insertAdjacentHTML('beforeend', html);
  });
}
exEnvolver('renderAbilities', habInjetarCartoes);
// avisa quando o custo permanente derruba o PDE a zero, para ninguém achar que é bug
exEnvolver('acquireSkillFromLibrary', abilityId => {
  const ch = exFicha(); if (!ch) return;
  const auto = HAB_AUTO[abilityId]; if (!auto || !auto.permPde) return;
  if (habNivel(ch, { id: abilityId }) < 1) return;
  if (ch.resources.sta.max <= 0) {
    const ability = findAbility(abilityId);
    exAviso('PDE máximo zerado', `${ability ? ability.name : 'Esta habilidade'} custa ${auto.permPde} PDE permanentes, e o personagem não tinha tanto assim. Suba o nível ou a Estâmina antes de usá-la.`, true);
  }
});

/* ============================================================
   10. BÔNUS MANUAIS DE DESLOCAMENTO (v25)
   Usa a mesma janela dos recursos, sem alterar o núcleo. O bônus
   entra antes da fadiga, junto aos demais ajustes a pé; o DMT
   continua recebendo somente os seus extras na linha separada.
   ============================================================ */
function exBonusDeslocamento(ch) {
  if (!Array.isArray(ch.movementModifiers)) return [];
  return ch.movementModifiers.filter(m => m && typeof m.id === 'string' &&
    Number.isSafeInteger(m.value));
}
const exRecalcDeslocamento = window.recalcAllModifiers;
window.recalcAllModifiers = function (ch) {
  exRecalcDeslocamento(ch);
  if (!ch) return;
  ch.derivedModifiers.movementFlat += exBonusDeslocamento(ch).reduce((s, m) => s + m.value, 0);
};

function exRenderBonusDeslocamento() {
  const ch = exFicha(), alvo = document.getElementById('movementModList');
  if (!ch || !alvo) return;
  alvo.innerHTML = '';
  exBonusDeslocamento(ch).forEach(m => {
    const linha = document.createElement('div');
    linha.className = 'modifier-row';
    linha.innerHTML = `<span>${exEsc(m.name)}</span><span><span class="mval ${m.value >= 0 ? 'pos' : 'neg'}">${m.value >= 0 ? '+' : ''}${m.value}m</span> <button type="button" class="small danger" data-remover-deslocamento="${exEsc(m.id)}" ${ch._ro ? 'disabled' : ''}>Remover</button></span>`;
    alvo.appendChild(linha);
  });
  const botao = document.querySelector('[data-bonus-deslocamento]');
  if (botao) botao.disabled = !!ch._ro;
}
exEnvolver('updateAttrUI', exRenderBonusDeslocamento);

const exAbrirBonusRecurso = window.openResourceBonusModal;
window.openResourceBonusModal = function (key) {
  if (key === 'movement' && (!exFicha() || exFicha()._ro)) return;
  exAbrirBonusRecurso(key);
  if (key === 'movement') document.getElementById('resourceBonusTitle').textContent = 'Adicionar Bônus de Deslocamento (m)';
};
const exAdicionarBonusRecurso = window.addResourceModifier;
window.addResourceModifier = function () {
  if (document.getElementById('resourceBonusTarget').value !== 'movement') return exAdicionarBonusRecurso();
  const ch = exFicha();
  if (!ch || ch._ro) return;
  const entrada = document.getElementById('resourceBonusValue').value.trim();
  const value = Number(entrada);
  if (!entrada || !Number.isSafeInteger(value) || !value) {
    exAviso('Informe um valor inteiro diferente de zero.', '', true);
    return;
  }
  const name = document.getElementById('resourceBonusName').value.trim() || 'Bônus';
  if (!Array.isArray(ch.movementModifiers)) ch.movementModifiers = [];
  ch.movementModifiers.push({ id: genId(), name, value, origem: 'Manual' });
  recalcAllModifiers(ch);
  exSalvar();
  closeResourceBonusModal();
  updateAttrUI();
};
document.addEventListener('click', event => {
  const botao = event.target.closest('[data-bonus-deslocamento], [data-remover-deslocamento]');
  if (!botao) return;
  const ch = exFicha();
  if (!ch || ch._ro) return;
  if (botao.hasAttribute('data-bonus-deslocamento')) {
    openResourceBonusModal('movement');
    return;
  }
  ch.movementModifiers = exBonusDeslocamento(ch).filter(m => m.id !== botao.dataset.removerDeslocamento);
  recalcAllModifiers(ch);
  exSalvar();
  updateAttrUI();
});


/* ============================================================
   11. BÔNUS MANUAIS DE ESQUIVA E BLOQUEIO (v26)
   Mesma janela e mesmo padrão do bônus de Deslocamento. Cada bônus
   tem nome (o motivo) e aparece na conta da defesa, como os demais.
   Fórmulas do livro inalteradas: os valores só entram como
   modificadores de defesa, antes da penalidade de Vulnerável.
   ============================================================ */
const EX_DEFESA = {
  esquiva: { campo: 'dodgeModifiers', alvo: 'esquiva', rotulo: 'Esquiva', chaveDerivada: 'defesaEsquiva', lista: 'esquivaModList' },
  bloqueio: { campo: 'blockModifiers', alvo: 'bloqueio', rotulo: 'Bloqueio', chaveDerivada: 'defesaBloqueio', lista: 'bloqueioModList' }
};
function exBonusDefesa(ch, tipo) {
  const lista = ch && ch[EX_DEFESA[tipo].campo];
  if (!Array.isArray(lista)) return [];
  return lista.filter(m => m && typeof m.id === 'string' && Number.isSafeInteger(m.value));
}
function exSomaDefesa(ch, tipo) { return exBonusDefesa(ch, tipo).reduce((s, m) => s + m.value, 0); }

const exRecalcDefesas = window.recalcAllModifiers;
window.recalcAllModifiers = function (ch) {
  exRecalcDefesas(ch);
  if (!ch) return;
  ch.derivedModifiers.defesaEsquiva = (ch.derivedModifiers.defesaEsquiva || 0) + exSomaDefesa(ch, 'esquiva');
  ch.derivedModifiers.defesaBloqueio = (ch.derivedModifiers.defesaBloqueio || 0) + exSomaDefesa(ch, 'bloqueio');
};

function exSinal(n) { return (n >= 0 ? '+' : '') + n; }

function exRenderBonusDefesa() {
  const ch = exFicha(); if (!ch) return;
  Object.keys(EX_DEFESA).forEach(tipo => {
    const cfg = EX_DEFESA[tipo];
    const alvo = document.getElementById(cfg.lista);
    if (alvo) {
      alvo.innerHTML = '';
      exBonusDefesa(ch, tipo).forEach(m => {
        const linha = document.createElement('div');
        linha.className = 'modifier-row';
        linha.innerHTML = `<span>${exEsc(m.name)}</span><span><span class="mval ${m.value >= 0 ? 'pos' : 'neg'}">${exSinal(m.value)}</span> <button type="button" class="small danger" data-remover-defesa="${exEsc(m.id)}" data-tipo-defesa="${tipo}" ${ch._ro ? 'disabled' : ''}>Remover</button></span>`;
        alvo.appendChild(linha);
      });
    }
    const botao = document.querySelector(`[data-bonus-defesa="${tipo}"]`);
    if (botao) botao.disabled = !!ch._ro;
  });
  // a conta passa a mostrar cada bônus manual com o seu motivo
  const agi = (ch.attributes.agi || 0) + ((ch.attributeBonuses && ch.attributeBonuses.agi) || 0);
  const forca = (ch.attributes.str || 0) + ((ch.attributeBonuses && ch.attributeBonuses.str) || 0);
  const luta = (ch.skills || []).find(s => s.name === 'Luta');
  const lutaInvestida = luta ? luta.base : 0;
  const vulneravel = ch.conditions && ch.conditions.vulneravel && ch.conditions.vulneravel.active ? -4 : 0;
  const manualEsq = exBonusDefesa(ch, 'esquiva'), manualBlo = exBonusDefesa(ch, 'bloqueio');
  const dEsq = ch.derivedModifiers.defesaEsquiva || 0, dmt = ch.derivedModifiers.esquivaDmt || 0;
  const outrosEsq = dEsq - dmt - exSomaDefesa(ch, 'esquiva');
  const pEsq = [`Agilidade (+${agi})`];
  if (outrosEsq) pEsq.push(`talentos (${exSinal(outrosEsq)})`);
  manualEsq.forEach(m => pEsq.push(`${m.name} (${exSinal(m.value)})`));
  if (dmt) pEsq.push(`DMT (+${dmt})`);
  if (vulneravel) pEsq.push(`Vulnerável (${vulneravel})`);
  const elEsq = document.getElementById('esquivaBreakdown');
  if (elEsq) elEsq.textContent = pEsq.join(' + ');
  const dBlo = ch.derivedModifiers.defesaBloqueio || 0;
  const bloqDmt = ch.derivedModifiers.bloqueioDmt || 0;
  const outrosBlo = dBlo - exSomaDefesa(ch, 'bloqueio') - bloqDmt;
  const pBlo = [`8 + Força (${forca})`, `Luta investida (${lutaInvestida})`];
  if (outrosBlo) pBlo.push(`habilidades (${exSinal(outrosBlo)})`);
  manualBlo.forEach(m => pBlo.push(`${m.name} (${exSinal(m.value)})`));
  if (bloqDmt) pBlo.push(`DMT (+${bloqDmt})`);
  if (vulneravel) pBlo.push(`Vulnerável (${vulneravel})`);
  const elBlo = document.getElementById('bloqueioBreakdown');
  if (elBlo) elBlo.textContent = pBlo.join(' + ');
  const nota = document.getElementById('notaDefesaDmt');
  if (nota && (dmt || bloqDmt)) {
    const acertoDmt = ch.derivedModifiers.acertoDmt || 0;
    const totEsq = agi + dEsq + vulneravel, totBlo = 8 + forca + lutaInvestida + dBlo + vulneravel;
    const ganhos = [];
    if (dmt) ganhos.push(`+${dmt} em Testes de Defesa com esquiva`);
    if (bloqDmt) ganhos.push(`+${bloqDmt} com bloqueio`);
    if (acertoDmt) ganhos.push(`+${acertoDmt} em Testes de Acerto`);
    nota.textContent = `Enquanto usa o DMT: ${ganhos.join(' e ')}. Sem o DMT, a esquiva é ${exSinal(totEsq - dmt)}${bloqDmt ? ` e o bloqueio é ${totBlo - bloqDmt}` : ''}.`;
  }
}
exEnvolver('renderCombatDefenses', exRenderBonusDefesa);

const exAbrirBonusRecurso2 = window.openResourceBonusModal;
window.openResourceBonusModal = function (key) {
  if ((key === 'esquiva' || key === 'bloqueio') && (!exFicha() || exFicha()._ro)) return;
  exAbrirBonusRecurso2(key);
  if (key === 'esquiva' || key === 'bloqueio') {
    document.getElementById('resourceBonusTitle').textContent = `Adicionar Bônus de ${EX_DEFESA[key].rotulo}`;
    document.getElementById('resourceBonusName').placeholder = 'Motivo. Ex: Habilidade, Equipamento';
  }
};
const exAdicionarBonusRecurso2 = window.addResourceModifier;
window.addResourceModifier = function () {
  const alvo = document.getElementById('resourceBonusTarget').value;
  if (alvo !== 'esquiva' && alvo !== 'bloqueio') return exAdicionarBonusRecurso2();
  const ch = exFicha();
  if (!ch || ch._ro) return;
  const entrada = document.getElementById('resourceBonusValue').value.trim();
  const value = Number(entrada);
  if (!entrada || !Number.isSafeInteger(value) || !value) {
    exAviso('Informe um valor inteiro diferente de zero.', '', true);
    return;
  }
  const name = document.getElementById('resourceBonusName').value.trim() || 'Bônus';
  const campo = EX_DEFESA[alvo].campo;
  if (!Array.isArray(ch[campo])) ch[campo] = [];
  ch[campo].push({ id: genId(), name, value, origem: 'Manual' });
  recalcAllModifiers(ch);
  exSalvar();
  closeResourceBonusModal();
  renderCombatDefenses();
};
document.addEventListener('click', event => {
  const botao = event.target.closest('[data-bonus-defesa], [data-remover-defesa]');
  if (!botao) return;
  const ch = exFicha();
  if (!ch || ch._ro) return;
  if (botao.hasAttribute('data-bonus-defesa')) {
    openResourceBonusModal(botao.dataset.bonusDefesa);
    return;
  }
  const tipo = botao.dataset.tipoDefesa;
  if (!EX_DEFESA[tipo]) return;
  ch[EX_DEFESA[tipo].campo] = exBonusDefesa(ch, tipo).filter(m => m.id !== botao.dataset.removerDefesa);
  recalcAllModifiers(ch);
  exSalvar();
  renderCombatDefenses();
});

/* ============================================================
   12. ADICIONAR LÂMINAS OU CONJUNTOS À RESERVA (v26)
   O livro trata o conjunto como um par de lâminas ("o par não é
   consumido"). Adicionar conjuntos soma direto na reserva. Lâminas
   avulsas ficam guardadas em bladeLoose; cada duas completam um
   conjunto. As regras de quebra e de troca não mudam.
   ============================================================ */
function exLaminasSoltas(dmt) { const n = Number(dmt.bladeLoose); return Number.isSafeInteger(n) && n > 0 ? n : 0; }

function exAdicionarLaminas() {
  const ch = exFicha(); if (!ch || ch._ro) return;
  const dmt = exDmt(ch);
  const campo = document.getElementById('bladeAddQty');
  const unidade = document.getElementById('bladeAddUnit').value;
  const qtd = Number(campo.value);
  if (!Number.isSafeInteger(qtd) || qtd < 1 || qtd > 99) {
    exAviso('Quantidade inválida', 'Informe um número inteiro de 1 a 99.', true);
    return;
  }
  const lim = exLimiteLaminas(ch);   // ataques que um conjunto aguenta
  let reserva = dmt.bladeReserve || 0, soltas = exLaminasSoltas(dmt);
  let msg;
  if (unidade === 'conjunto') {
    reserva += qtd;
    msg = `${qtd} ${qtd === 1 ? 'conjunto adicionado' : 'conjuntos adicionados'}.`;
    if (!dmt.bladesEquipped && reserva > 0) {
      reserva -= 1; dmt.bladesEquipped = true; dmt.bladeAttacksUsed = 0;
      msg += ' Um conjunto já está equipado.';
    }
  } else {
    // cada lâmina devolve 1 ataque ao conjunto atual; sem conjunto, volta o último com 1 ataque a menos gasto
    if (!dmt.bladesEquipped) {
      if (reserva > 0) { reserva -= 1; dmt.bladeAttacksUsed = 0; }
      else dmt.bladeAttacksUsed = lim;
      dmt.bladesEquipped = true;
    }
    const usados = dmt.bladeAttacksUsed || 0;
    const devolvidas = Math.min(qtd, usados);
    dmt.bladeAttacksUsed = usados - devolvidas;
    const sobra = qtd - devolvidas + soltas;
    reserva += Math.floor(sobra / lim);
    soltas = sobra % lim;
    msg = `${qtd} ${qtd === 1 ? 'lâmina adicionada' : 'lâminas adicionadas'}. Conjunto atual: ${dmt.bladeAttacksUsed}/${lim} ataques usados.`;
    if (soltas) msg += ` ${soltas} ${soltas === 1 ? 'lâmina guardada' : 'lâminas guardadas'} na reserva.`;
  }
  dmt.bladeReserve = reserva; dmt.bladeLoose = soltas;
  campo.value = 1;
  exSalvar(); renderDMT();
  exAviso('Lâminas atualizadas', msg);
}
window.adicionarLaminas = exAdicionarLaminas;

const exResetLaminas = window.resetBladeSets;
window.resetBladeSets = function () {
  const ch = exFicha();
  if (ch && ch.dmt) ch.dmt.bladeLoose = 0;
  exResetLaminas();
};

function exRenderLaminasSoltas() {
  const ch = exFicha(); if (!ch || !ch.dmt) return;
  const reserva = document.getElementById('bladeReserve');
  const soltas = exLaminasSoltas(ch.dmt);
  if (reserva) reserva.textContent = (ch.dmt.bladeReserve || 0) + (soltas ? ` + ${soltas} ${soltas === 1 ? 'lâmina' : 'lâminas'}` : '');
  ['bladeAddQty', 'bladeAddUnit', 'btnBladeAdd'].forEach(id => { const e = document.getElementById(id); if (e) e.disabled = !!ch._ro; });
}
exEnvolver('renderDMT', exRenderLaminasSoltas);
exEnvolver('renderDMT', exRenderAbaDmt);
const exAtaqueLaminas = window.registerBladeAttack;
window.registerBladeAttack = function () {
  exAtaqueLaminas.apply(this, arguments);
  const ch = exFicha(); if (!ch || !ch.dmt) return;
  const d = ch.dmt, soltas = exLaminasSoltas(d);
  if (!d.bladesEquipped && !(d.bladeReserve > 0) && soltas > 0) {
    const lim = exLimiteLaminas(ch);
    d.bladesEquipped = true; d.bladeAttacksUsed = Math.max(0, lim - soltas); d.bladeLoose = 0;
    exSalvar(); renderDMT();
  }
};

/* ============================================================
   13. RECORTE E ZOOM DE IMAGEM (v26)
   Intercepta a escolha de arquivo nos campos de imagem, abre uma
   janela para arrastar, dar zoom e ver a prévia, e entrega o recorte
   ao tratador original como se fosse o arquivo escolhido. Nenhum
   tratador existente foi alterado.
   ============================================================ */
const EX_CORTE_CAMPOS = {
  charImageInput: { titulo: 'Foto do personagem', razoes: ['1:1', '4:5', '16:9'], padrao: '1:1' },
  shifterImageInput: { titulo: 'Imagem do Titã', razoes: ['1:1', '4:5', '16:9'], padrao: '1:1' },
  gmTitanImageInput: { titulo: 'Imagem do Titã', razoes: ['1:1', '4:5', '16:9'], padrao: '1:1' },
  gmPrimordialImageInput: { titulo: 'Imagem do Titã primordial', razoes: ['1:1', '4:5', '16:9'], padrao: '1:1' },
  initiativeImageInput: { titulo: 'Foto na iniciativa', razoes: ['1:1', '4:5', '16:9'], padrao: '1:1' },
  nvPerfilArquivo: { titulo: 'Foto de perfil', razoes: ['1:1'], padrao: '1:1', circulo: true },
  nvCfgArquivo: { titulo: 'Capa da campanha', razoes: ['16:9'], padrao: '16:9' }
};
const EX_CORTE_ROTULO = { '1:1': 'Quadrado', '4:5': 'Retrato', '16:9': 'Paisagem' };
const EX_CORTE_MAX_SAIDA = 1400;
const EX_CORTE_ZOOM_MAX = 6;
let exCorteAberto = false;

function exRazao(txt) { const [a, b] = txt.split(':').map(Number); return a / b; }

function exAbrirCorte(arquivo, cfg) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ original: true }); };
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) { URL.revokeObjectURL(url); resolve({ original: true }); return; }

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay corte-overlay';
      overlay.innerHTML = `
        <div class="modal corte-modal" role="dialog" aria-modal="true" aria-label="Ajustar imagem">
          <h2>${exEsc(cfg.titulo)}</h2>
          <p class="corte-dica">Arraste a imagem para posicionar e use o zoom para aproximar.</p>
          <div class="corte-razoes" ${cfg.razoes.length < 2 ? 'hidden' : ''}></div>
          <div class="corte-palco-externo"><div class="corte-palco" tabindex="0" aria-label="Área de recorte"></div></div>
          <div class="corte-zoom">
            <button type="button" class="small" data-corte="menos" aria-label="Diminuir zoom">-</button>
            <input type="range" min="0" max="100" value="0" step="1" aria-label="Zoom" />
            <button type="button" class="small" data-corte="mais" aria-label="Aumentar zoom">+</button>
          </div>
          <div class="corte-previa-linha"><span>Prévia</span><canvas class="corte-previa"></canvas></div>
          <div class="modal-actions">
            <button type="button" data-corte="cancelar">Cancelar</button>
            <button type="button" data-corte="original">Usar imagem inteira</button>
            <button type="button" class="primary" data-corte="aplicar">Aplicar</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      const palco = overlay.querySelector('.corte-palco');
      const slider = overlay.querySelector('input[type=range]');
      const previa = overlay.querySelector('.corte-previa');
      const boxRazoes = overlay.querySelector('.corte-razoes');
      const imgEl = document.createElement('img');
      imgEl.src = url; imgEl.alt = ''; imgEl.draggable = false; imgEl.className = 'corte-img';
      palco.appendChild(imgEl);
      if (cfg.circulo) {
        const m = document.createElement('div'); m.className = 'corte-mascara-circulo'; palco.appendChild(m);
      } else {
        const g = document.createElement('div'); g.className = 'corte-grade'; palco.appendChild(g);
      }

      let razaoTxt = cfg.padrao, razao = exRazao(razaoTxt);
      let fw = 0, fh = 0, esc = 1, minEsc = 1, tx = 0, ty = 0, raf = 0;

      function limitar() {
        const iw = w * esc, ih = h * esc;
        tx = Math.min(0, Math.max(fw - iw, tx));
        ty = Math.min(0, Math.max(fh - ih, ty));
      }
      function desenhar() {
        imgEl.style.width = (w * esc) + 'px';
        imgEl.style.height = (h * esc) + 'px';
        imgEl.style.transform = `translate(${tx}px, ${ty}px)`;
        slider.value = String(Math.round(Math.log(esc / minEsc) / Math.log(EX_CORTE_ZOOM_MAX) * 100));
        if (!raf) raf = requestAnimationFrame(() => { raf = 0; desenharPrevia(); });
      }
      function desenharPrevia() {
        const ctx = previa.getContext('2d');
        ctx.clearRect(0, 0, previa.width, previa.height);
        ctx.fillStyle = '#16213a'; ctx.fillRect(0, 0, previa.width, previa.height);
        ctx.drawImage(img, -tx / esc, -ty / esc, fw / esc, fh / esc, 0, 0, previa.width, previa.height);
      }
      function configurarPrevia() {
        let pw = 96, ph = 96;
        if (razaoTxt === '16:9') { pw = 160; ph = 90; }
        else if (razaoTxt === '4:5') { pw = 80; ph = 100; }
        if (cfg.circulo) { pw = ph = 72; }
        previa.width = pw * 2; previa.height = ph * 2;
        previa.style.width = pw + 'px'; previa.style.height = ph + 'px';
        previa.classList.toggle('corte-previa-circulo', !!cfg.circulo);
      }
      function layout(manterZoom) {
        const maxW = Math.min(440, Math.floor(window.innerWidth * 0.8));
        const maxH = Math.max(140, Math.floor(window.innerHeight * (window.innerHeight < 800 ? 0.34 : 0.42)));
        fw = maxW; fh = Math.round(fw / razao);
        if (fh > maxH) { fh = maxH; fw = Math.round(fh * razao); }
        palco.style.width = fw + 'px'; palco.style.height = fh + 'px';
        const novoMin = Math.max(fw / w, fh / h);
        const proporcao = manterZoom ? esc / minEsc : 1;
        minEsc = novoMin;
        esc = Math.min(minEsc * EX_CORTE_ZOOM_MAX, minEsc * proporcao);
        tx = (fw - w * esc) / 2; ty = (fh - h * esc) / 2;
        limitar(); configurarPrevia(); desenhar();
      }
      function zoomPara(novaEsc, cx, cy) {
        novaEsc = Math.max(minEsc, Math.min(minEsc * EX_CORTE_ZOOM_MAX, novaEsc));
        const ix = (cx - tx) / esc, iy = (cy - ty) / esc;
        esc = novaEsc; tx = cx - ix * esc; ty = cy - iy * esc;
        limitar(); desenhar();
      }

      cfg.razoes.forEach(r => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = EX_CORTE_ROTULO[r]; b.title = r; b.dataset.razao = r;
        b.className = 'small' + (r === razaoTxt ? ' primary' : '');
        boxRazoes.appendChild(b);
      });
      boxRazoes.addEventListener('click', e => {
        const b = e.target.closest('[data-razao]'); if (!b) return;
        razaoTxt = b.dataset.razao; razao = exRazao(razaoTxt);
        boxRazoes.querySelectorAll('button').forEach(x => x.classList.toggle('primary', x === b));
        layout(false);
      });

      // arrastar e pinça
      const ponteiros = new Map();
      let distPinca = 0;
      palco.addEventListener('pointerdown', e => {
        palco.setPointerCapture(e.pointerId);
        ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
        palco.classList.add('arrastando');
        if (ponteiros.size === 2) { const [a, b] = [...ponteiros.values()]; distPinca = Math.hypot(a.x - b.x, a.y - b.y); }
      });
      palco.addEventListener('pointermove', e => {
        const p = ponteiros.get(e.pointerId); if (!p) return;
        if (ponteiros.size === 2) {
          p.x = e.clientX; p.y = e.clientY;
          const [a, b] = [...ponteiros.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          const r = palco.getBoundingClientRect();
          if (distPinca > 0) zoomPara(esc * d / distPinca, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
          distPinca = d;
          return;
        }
        tx += e.clientX - p.x; ty += e.clientY - p.y;
        p.x = e.clientX; p.y = e.clientY;
        limitar(); desenhar();
      });
      const soltar = e => { ponteiros.delete(e.pointerId); distPinca = 0; if (!ponteiros.size) palco.classList.remove('arrastando'); };
      palco.addEventListener('pointerup', soltar);
      palco.addEventListener('pointercancel', soltar);
      palco.addEventListener('wheel', e => {
        e.preventDefault();
        const r = palco.getBoundingClientRect();
        zoomPara(esc * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
      }, { passive: false });
      palco.addEventListener('keydown', e => {
        const passo = e.shiftKey ? 30 : 10;
        const mov = { ArrowLeft: [passo, 0], ArrowRight: [-passo, 0], ArrowUp: [0, passo], ArrowDown: [0, -passo] }[e.key];
        if (mov) { e.preventDefault(); tx += mov[0]; ty += mov[1]; limitar(); desenhar(); }
        else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomPara(esc * 1.1, fw / 2, fh / 2); }
        else if (e.key === '-') { e.preventDefault(); zoomPara(esc / 1.1, fw / 2, fh / 2); }
      });
      slider.addEventListener('input', () => {
        zoomPara(minEsc * Math.pow(EX_CORTE_ZOOM_MAX, Number(slider.value) / 100), fw / 2, fh / 2);
      });

      function fechar(resultado) {
        document.removeEventListener('keydown', teclaGlobal, true);
        window.removeEventListener('resize', aoRedimensionar);
        if (raf) cancelAnimationFrame(raf);
        overlay.remove();
        URL.revokeObjectURL(url);
        exCorteAberto = false;
        resolve(resultado);
      }
      function aplicar() {
        const sw = fw / esc, sh = fh / esc;
        const outW = Math.max(1, Math.min(EX_CORTE_MAX_SAIDA, Math.round(sw)));
        const outH = Math.max(1, Math.round(outW / razao));
        const c = document.createElement('canvas'); c.width = outW; c.height = outH;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#16213a'; ctx.fillRect(0, 0, outW, outH);
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, -tx / esc, -ty / esc, sw, sh, 0, 0, outW, outH);
        c.toBlob(blob => {
          if (!blob) { fechar({ original: true }); return; }
          fechar({ arquivo: new File([blob], 'recorte.jpg', { type: 'image/jpeg' }) });
        }, 'image/jpeg', 0.92);
      }
      overlay.addEventListener('click', e => {
        const b = e.target.closest('[data-corte]'); if (!b) return;
        const acao = b.dataset.corte;
        if (acao === 'cancelar') fechar(null);
        else if (acao === 'original') fechar({ original: true });
        else if (acao === 'aplicar') aplicar();
        else if (acao === 'mais') zoomPara(esc * 1.15, fw / 2, fh / 2);
        else if (acao === 'menos') zoomPara(esc / 1.15, fw / 2, fh / 2);
      });
      function teclaGlobal(e) {
        if (e.key === 'Escape') { e.stopPropagation(); fechar(null); }
        else if (e.key === 'Tab') {
          const foco = [...overlay.querySelectorAll('button:not([hidden]), input, [tabindex="0"]')].filter(x => !x.disabled && x.offsetParent !== null);
          if (!foco.length) return;
          const i = foco.indexOf(document.activeElement);
          if (e.shiftKey && i <= 0) { e.preventDefault(); foco[foco.length - 1].focus(); }
          else if (!e.shiftKey && i === foco.length - 1) { e.preventDefault(); foco[0].focus(); }
        }
      }
      function aoRedimensionar() { layout(true); }
      document.addEventListener('keydown', teclaGlobal, true);
      window.addEventListener('resize', aoRedimensionar);
      layout(false);
      palco.focus();
    };
    img.src = url;
  });
}

document.addEventListener('change', async event => {
  const input = event.target;
  if (!input || input.type !== 'file' || !EX_CORTE_CAMPOS[input.id]) return;
  if (input.dataset.corteLiberado === '1') { delete input.dataset.corteLiberado; return; }
  const arquivo = input.files && input.files[0];
  if (!arquivo || !arquivo.type.startsWith('image/')) return;   // deixa o tratador original avisar
  event.stopImmediatePropagation();
  if (exCorteAberto) { input.value = ''; return; }
  exCorteAberto = true;
  const r = await exAbrirCorte(arquivo, EX_CORTE_CAMPOS[input.id]);
  if (!r) { input.value = ''; return; }
  const entrega = r.arquivo || arquivo;
  try {
    const dt = new DataTransfer(); dt.items.add(entrega);
    input.files = dt.files;
  } catch (e) { /* sem DataTransfer, segue com o arquivo original */ }
  input.dataset.corteLiberado = '1';
  input.dispatchEvent(new Event('change', { bubbles: true }));
}, true);

/* ============================================================
   14. TITÃ CEGO NA MESA DO MESTRE (v27)
   Marcador da regra "Cegar um Titã": o Titã fica cego, recebe
   Vulnerável e desvantagem em Testes de Acerto até o próximo turno
   dele. É só um marcador visual, o mestre aplica o efeito na mesa.
   ============================================================ */
const exCardTita = window.buildGMTitanCard;
window.buildGMTitanCard = function (t) {
  const card = exCardTita.apply(this, arguments);
  try {
    const titulo = card.querySelector('h4');
    if (t.cego && titulo) titulo.insertAdjacentHTML('beforeend', ' <span class="tag cego">Cego</span>');
    const caixa = document.createElement('div');
    caixa.className = 'titan-cego' + (t.cego ? ' ativo' : '');
    caixa.innerHTML = t.cego
      ? `<p>Cego: recebe Vulnerável e desvantagem em Testes de Acerto até o próximo turno dele.</p><button type="button" class="small" data-cego-titan="${exEsc(t.id)}">Remover cegueira</button>`
      : `<button type="button" class="small" data-cego-titan="${exEsc(t.id)}">Deixar cego</button>`;
    if (card.firstElementChild) card.firstElementChild.after(caixa); else card.appendChild(caixa);
  } catch (e) { console.error('Titã cego:', e); }
  return card;
};
exEnvolver('renderInitiative', function () {
  const fichas = document.querySelectorAll('#initiativeList .initiative-token');
  fichas.forEach((el, i) => {
    const p = gmInitiative[i];
    if (!p || !p.isNucaOnly) return;
    const titulo = el.querySelector('h4');
    if (p.cego && titulo) titulo.insertAdjacentHTML('beforeend', ' <span class="tag cego">Cego</span>');
    const acoes = el.querySelector('.initiative-actions');
    if (!acoes) return;
    const linha = document.createElement('div');
    linha.className = 'resource-controls';
    linha.innerHTML = `<button type="button" class="small" data-cego-iniciativa="${exEsc(p.id)}" title="Cegar um Titã: Vulnerável e desvantagem em Testes de Acerto até o próximo turno dele">${p.cego ? 'Remover cegueira' : 'Deixar cego'}</button>`;
    acoes.appendChild(linha);
  });
});
document.addEventListener('click', event => {
  const bt = event.target.closest('[data-cego-titan], [data-cego-iniciativa]');
  if (!bt) return;
  if (bt.hasAttribute('data-cego-titan')) {
    const t = gmTitans.find(x => x.id === bt.dataset.cegoTitan);
    if (!t) return;
    t.cego = !t.cego;
    saveGMTitans(); renderGMTitansList(); renderEscudoEncontro();
    showNotification(t.cego ? 'Titã cego' : 'Cegueira removida', t.name);
  } else {
    const p = gmInitiative.find(x => x.id === bt.dataset.cegoIniciativa);
    if (!p) return;
    p.cego = !p.cego;
    saveGMInitiative(); renderInitiative();
  }
});

/* ============================================================
   15. CADERNO DE ANOTAÇÕES (v27)
   Gaveta lateral aberta pelo botão do cabeçalho. Duas estantes:
   Geral (fica neste navegador, serve ao mestre e ao jogador) e
   Esta ficha (guardada dentro da ficha, vai na exportação e na
   nuvem). Cada estante tem várias folhas com título e texto.
   ============================================================ */
const CAD_CHAVE = 'coordenadaCaderno';
const CAD_MAX_FOLHAS = 40, CAD_MAX_TEXTO = 10000;
let cadEscopo = 'geral', cadFolhaId = { geral: null, ficha: null }, cadGeral = [], cadTimer = 0, cadExcluir = false, cadCriado = false;

function cadLerGeral() {
  try {
    const v = JSON.parse(localStorage.getItem(CAD_CHAVE) || '[]');
    return Array.isArray(v) ? v.filter(f => f && typeof f.id === 'string') : [];
  } catch (e) { return []; }
}
function cadFichaAberta() {
  const tela = document.getElementById('screenSheet');
  return !!(exFicha() && tela && !tela.classList.contains('hidden'));
}
function cadLista() {
  if (cadEscopo === 'ficha') {
    const ch = exFicha();
    if (!ch) return [];
    if (!Array.isArray(ch.caderno)) ch.caderno = [];
    return ch.caderno;
  }
  return cadGeral;
}
function cadSomenteLeitura() { const ch = exFicha(); return cadEscopo === 'ficha' && !!(ch && ch._ro); }
function cadPersistir() {
  clearTimeout(cadTimer); cadTimer = 0;
  if (cadEscopo === 'ficha') exSalvar();
  else {
    try { localStorage.setItem(CAD_CHAVE, JSON.stringify(cadGeral)); }
    catch (e) { exAviso('Não foi possível salvar o caderno', 'O armazenamento do navegador está cheio.', true); return; }
  }
  const estado = document.querySelector('#caderno .caderno-estado');
  if (estado) estado.textContent = 'Salvo';
}
function cadAgendar() {
  const estado = document.querySelector('#caderno .caderno-estado');
  if (estado) estado.textContent = 'Salvando...';
  clearTimeout(cadTimer);
  cadTimer = setTimeout(cadPersistir, 500);
}
function cadFolhaAtual() {
  const l = cadLista();
  return l.find(f => f.id === cadFolhaId[cadEscopo]) || null;
}

function cadCriar() {
  if (cadCriado) return;
  cadCriado = true;
  const el = document.createElement('aside');
  el.id = 'caderno'; el.className = 'caderno';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Caderno de anotações');
  el.innerHTML = `
    <div class="caderno-cab">
      <h2>Caderno</h2>
      <button type="button" class="caderno-fechar" data-cad="fechar" aria-label="Fechar caderno">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="caderno-escopos" role="tablist">
      <button type="button" role="tab" data-escopo="geral">Geral</button>
      <button type="button" role="tab" data-escopo="ficha">Esta ficha</button>
    </div>
    <p class="caderno-dica"></p>
    <div class="caderno-folhas" role="tablist" aria-label="Folhas"></div>
    <div class="caderno-folha">
      <input type="text" class="caderno-titulo" maxlength="80" placeholder="Título da folha" aria-label="Título da folha" />
      <div class="caderno-papel">
        <div class="caderno-conteudo">
          <div class="cad-camada cad-atras"></div>
          <div class="cad-flut"></div>
          <div class="caderno-texto" contenteditable="plaintext-only" role="textbox" aria-multiline="true" aria-label="Texto da folha" data-placeholder="Escreva aqui. Salva sozinho." spellcheck="true"></div>
          <div class="cad-camada cad-frente"></div>
          <div class="cad-selecao hidden" tabindex="0" aria-label="Imagem selecionada. Setas movem, Delete remove.">
            <i data-alca="nw"></i><i data-alca="ne"></i><i data-alca="sw"></i><i data-alca="se"></i>
          </div>
        </div>
      </div>
      <div class="cad-ferramentas">
        <div class="cad-linha">
          <button type="button" class="small" data-cadimg="nova">Adicionar imagem</button>
          <div class="cad-miniaturas"></div>
        </div>
        <div class="cad-linha cad-opcoes hidden">
          <div class="cad-camadas" role="group" aria-label="Posição da imagem">
            <button type="button" class="small" data-cadimg="atras">Atrás do texto</button>
            <button type="button" class="small" data-cadimg="frente">Na frente do texto</button>
            <button type="button" class="small" data-cadimg="quebra">Quebrar texto</button>
          </div>
          <label class="cad-opac">Opacidade <input type="range" min="20" max="100" step="5" value="100" aria-label="Opacidade da imagem" /></label>
          <button type="button" class="small danger" data-cadimg="remover">Remover imagem</button>
        </div>
        <input type="file" accept="image/*" class="hidden" id="cadInputImagem" />
      </div>
    </div>
    <div class="caderno-vazio"><p>Nenhuma folha ainda.</p><button type="button" class="primary" data-cad="nova">Criar primeira folha</button></div>
    <div class="caderno-rodape">
      <span class="caderno-estado" aria-live="polite">Salvo</span>
      <span class="caderno-contagem"></span>
      <button type="button" class="small danger" data-cad="excluir">Excluir folha</button>
    </div>`;
  document.body.appendChild(el);

  el.addEventListener('click', e => {
    const esc = e.target.closest('[data-escopo]');
    if (esc) { if (!esc.disabled) cadTrocarEscopo(esc.dataset.escopo); return; }
    const folha = e.target.closest('[data-folha]');
    if (folha) { cadPersistir(); cadFolhaId[cadEscopo] = folha.dataset.folha; cadExcluir = false; cadRender(); return; }
    const acao = e.target.closest('[data-cad]');
    if (!acao) return;
    const a = acao.dataset.cad;
    if (a === 'fechar') fecharCaderno();
    else if (a === 'nova') cadNovaFolha();
    else if (a === 'excluir') cadExcluirFolha();
  });
  el.querySelector('.caderno-titulo').addEventListener('input', e => {
    const f = cadFolhaAtual(); if (!f || cadSomenteLeitura()) return;
    f.titulo = e.target.value; f.atualizado = new Date().toISOString();
    cadRenderFolhas(); cadAgendar();
  });
  el.querySelector('.caderno-texto').addEventListener('input', e => {
    const f = cadFolhaAtual(); if (!f || cadSomenteLeitura()) return;
    if (!e.target.textContent) e.target.innerHTML = '';
    f.texto = cadLerTexto(e.target); f.atualizado = new Date().toISOString();
    el.querySelector('.caderno-contagem').textContent = `${f.texto.length}/${CAD_MAX_TEXTO}`;
    cadAgendar();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && el.classList.contains('aberto')) { e.stopPropagation(); fecharCaderno(); }
  });
  window.addEventListener('pagehide', () => { if (cadTimer) cadPersistir(); });
  const tela = document.getElementById('screenSheet');
  if (tela) new MutationObserver(() => { if (el.classList.contains('aberto')) cadRender(); }).observe(tela, { attributes: true, attributeFilter: ['class'] });
}

function cadTrocarEscopo(novo) {
  cadPersistir();
  cadEscopo = novo; cadExcluir = false;
  cadRender();
}
function cadNovaFolha() {
  if (cadSomenteLeitura()) return;
  const l = cadLista();
  if (l.length >= CAD_MAX_FOLHAS) { exAviso('Limite de folhas', `O máximo é ${CAD_MAX_FOLHAS} folhas por estante.`, true); return; }
  const f = { id: genId(), titulo: '', texto: '', atualizado: new Date().toISOString() };
  l.push(f); cadFolhaId[cadEscopo] = f.id; cadExcluir = false;
  cadPersistir(); cadRender();
  const t = document.querySelector('#caderno .caderno-titulo'); if (t) t.focus();
}
function cadExcluirFolha() {
  const f = cadFolhaAtual(); if (!f || cadSomenteLeitura()) return;
  if (!cadExcluir) {
    cadExcluir = true;
    const b = document.querySelector('#caderno [data-cad="excluir"]'); if (b) b.textContent = 'Confirmar exclusão';
    return;
  }
  const l = cadLista(); const i = l.findIndex(x => x.id === f.id);
  if (i >= 0) l.splice(i, 1);
  cadFolhaId[cadEscopo] = l.length ? l[Math.min(i, l.length - 1)].id : null;
  cadExcluir = false; cadPersistir(); cadRender();
}

function cadRenderFolhas() {
  const caixa = document.querySelector('#caderno .caderno-folhas'); if (!caixa) return;
  const l = cadLista(), atual = cadFolhaId[cadEscopo], ro = cadSomenteLeitura();
  caixa.innerHTML = '';
  l.forEach(f => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.folha = f.id;
    b.className = 'caderno-aba' + (f.id === atual ? ' ativa' : '');
    b.setAttribute('aria-selected', f.id === atual ? 'true' : 'false');
    b.textContent = (f.titulo || '').trim() || 'Sem título';
    caixa.appendChild(b);
  });
  const mais = document.createElement('button');
  mais.type = 'button'; mais.className = 'caderno-aba caderno-aba-nova'; mais.dataset.cad = 'nova';
  mais.textContent = '+ Folha'; mais.disabled = ro || l.length >= CAD_MAX_FOLHAS;
  caixa.appendChild(mais);
}
function cadRender() {
  const el = document.getElementById('caderno'); if (!el) return;
  if (cadEscopo === 'ficha' && !cadFichaAberta()) cadEscopo = 'geral';
  el.querySelectorAll('[data-escopo]').forEach(b => {
    const f = b.dataset.escopo === 'ficha';
    b.disabled = f && !cadFichaAberta();
    b.classList.toggle('ativo', b.dataset.escopo === cadEscopo);
    b.setAttribute('aria-selected', b.dataset.escopo === cadEscopo ? 'true' : 'false');
  });
  const ch = exFicha();
  el.querySelector('.caderno-dica').textContent = cadEscopo === 'ficha'
    ? (ch && ch._ro ? 'Ficha só para leitura: as anotações não podem ser editadas.' : 'Fica dentro desta ficha: vai na exportação e na nuvem.')
    : 'Fica neste navegador, para qualquer ficha ou mesa.';
  const l = cadLista();
  if (!l.some(f => f.id === cadFolhaId[cadEscopo])) cadFolhaId[cadEscopo] = l.length ? l[0].id : null;
  cadRenderFolhas();
  const f = cadFolhaAtual(), ro = cadSomenteLeitura();
  el.querySelector('.caderno-folha').classList.toggle('hidden', !f);
  el.querySelector('.caderno-rodape').classList.toggle('hidden', !f);
  el.querySelector('.caderno-vazio').classList.toggle('hidden', !!f);
  el.querySelector('.caderno-vazio button').disabled = ro;
  if (f) {
    const t = el.querySelector('.caderno-titulo'), x = el.querySelector('.caderno-texto');
    t.value = f.titulo || ''; cadEscreverTexto(x, f.texto || '');
    t.readOnly = ro; cadEditavel(x, !ro);
    el.querySelector('.caderno-contagem').textContent = `${(f.texto || '').length}/${CAD_MAX_TEXTO}`;
    const b = el.querySelector('[data-cad="excluir"]');
    b.textContent = cadExcluir ? 'Confirmar exclusão' : 'Excluir folha'; b.disabled = ro;
  }
}

window.abrirCaderno = function () {
  cadCriar();
  const el = document.getElementById('caderno');
  if (el.classList.contains('aberto')) { fecharCaderno(); return; }
  cadGeral = cadLerGeral();
  if (cadEscopo === 'geral' && cadFichaAberta() && !cadGeral.length && (exFicha().caderno || []).length) cadEscopo = 'ficha';
  cadExcluir = false;
  cadRender();
  el.classList.add('aberto');
  document.getElementById('btnCaderno').setAttribute('aria-expanded', 'true');
  const foco = el.querySelector('.caderno-texto:not(.hidden)'); 
  setTimeout(() => { const t = el.querySelector('.caderno-folha:not(.hidden) .caderno-texto'); (t || el.querySelector('.caderno-fechar')).focus(); }, 60);
};
window.fecharCaderno = function () {
  const el = document.getElementById('caderno'); if (!el) return;
  if (cadTimer) cadPersistir();
  el.classList.remove('aberto');
  const b = document.getElementById('btnCaderno');
  if (b) { b.setAttribute('aria-expanded', 'false'); b.focus(); }
};


/* ------------------------------------------------------------
   15b. IMAGENS NO CADERNO (v31)
   Cada folha pode ter imagens livres: arrastar, redimensionar pelos
   cantos, opacidade e posição atrás ou na frente do texto, como no
   Google Docs. As imagens são reduzidas antes de salvar. Posição e
   tamanho são guardados em frações da largura da folha, então a
   gaveta pode mudar de largura sem desalinhar nada.
   ------------------------------------------------------------ */
const CAD_IMG = { geral: { max: 10, lado: 900, bytes: 220000, total: 3500000 }, ficha: { max: 4, lado: 640, bytes: 120000, total: 450000 } };
let cadImgSel = null, cadImgIniciado = false, cadImgRO = null;

function cadImagensDa(f) { if (!f) return []; if (!Array.isArray(f.imagens)) f.imagens = []; return f.imagens; }
function cadPapelLargura() { const c = document.querySelector('#caderno .caderno-conteudo'); return c ? c.clientWidth : 0; }
function cadImgPorId(id) { const f = cadFolhaAtual(); return cadImagensDa(f).find(i => i.id === id) || null; }

function cadAjustarAltura() {
  const papel = document.querySelector('#caderno .caderno-papel'), ta = document.querySelector('#caderno .caderno-texto');
  if (!papel || !ta) return;
  const W = cadPapelLargura() || 1;
  let fundo = 0;
  cadImagensDa(cadFolhaAtual()).forEach(i => { fundo = Math.max(fundo, (i.y + i.w * i.ar) * W); });
  ta.style.minHeight = Math.max(papel.clientHeight - 2, fundo + 28) + 'px';
}

// campo de texto editável (aceita imagens flutuando ao redor)
const CAD_PLANO = (() => { const d = document.createElement('div'); d.contentEditable = 'plaintext-only'; return d.contentEditable === 'plaintext-only'; })();
function cadEditavel(el, on) { el.contentEditable = on ? (CAD_PLANO ? 'plaintext-only' : 'true') : 'false'; }
function cadLerTexto(el) {
  let out = '';
  const andar = n => n.childNodes.forEach(c => {
    if (c.nodeType === 3) out += c.nodeValue;
    else if (c.nodeName === 'BR') out += '\n';
    else { if (/^(DIV|P)$/.test(c.nodeName) && out && !out.endsWith('\n')) out += '\n'; andar(c); }
  });
  andar(el);
  out = out.replace(/\r/g, '');
  return out.endsWith('\n') ? out.slice(0, -1) : out;   // o navegador acrescenta um \n final para mostrar a última linha vazia
}
function cadEscreverTexto(el, t) { el.textContent = t.endsWith('\n') ? t + '\n' : t; }

function cadFlutEstilo(d, i) {
  const W = cadPapelLargura() || 1, dir = i.lado === 'dir';
  d.className = 'cad-flut-item ' + (dir ? 'dir' : 'esq');
  d.style.width = (i.w * W) + 'px'; d.style.height = (i.w * i.ar * W) + 'px'; d.style.marginTop = (i.y * W) + 'px';
  d.style.marginLeft = dir ? '0' : (i.x * W) + 'px';
  d.style.marginRight = dir ? Math.max(0, (1 - i.x - i.w) * W) + 'px' : '0';
  d.style.opacity = String(i.op || 1);
}
function cadRenderFlut() {
  const flut = document.querySelector('#caderno .cad-flut'); if (!flut) return;
  flut.innerHTML = '';
  cadImagensDa(cadFolhaAtual()).filter(i => i.camada === 'quebra').sort((a, b) => a.y - b.y).forEach(i => {
    const d = document.createElement('div'); d.dataset.img = i.id; cadFlutEstilo(d, i);
    const g = document.createElement('img'); g.src = i.src; g.alt = ''; g.draggable = false; g.dataset.img = i.id;
    d.appendChild(g); flut.appendChild(d);
  });
}

function cadImgEstilo(el, i) {
  const W = cadPapelLargura();
  if (el.classList && el.classList.contains('cad-selecao') && i.camada === 'quebra') {
    const g = document.querySelector(`#caderno .cad-flut-item[data-img="${i.id}"] img`);
    if (g) {
      const c = document.querySelector('#caderno .caderno-conteudo').getBoundingClientRect(), r = g.getBoundingClientRect();
      el.style.left = (r.left - c.left) + 'px'; el.style.top = (r.top - c.top) + 'px'; el.style.width = r.width + 'px'; el.style.height = r.height + 'px'; return;
    }
  }
  el.style.left = (i.x * W) + 'px'; el.style.top = (i.y * W) + 'px';
  el.style.width = (i.w * W) + 'px'; el.style.height = (i.w * i.ar * W) + 'px';
}
function cadRenderSelecao() {
  const sel = document.querySelector('#caderno .cad-selecao'); if (!sel) return;
  const i = cadImgSel ? cadImgPorId(cadImgSel) : null;
  if (!i) { cadImgSel = null; sel.classList.add('hidden'); } else { sel.classList.remove('hidden'); cadImgEstilo(sel, i); }
  const ro = cadSomenteLeitura();
  sel.classList.toggle('somente-leitura', ro);
  const op = document.querySelector('#caderno .cad-opcoes');
  if (op) {
    op.classList.toggle('hidden', !i);
    if (i) {
      op.querySelector('[data-cadimg="atras"]').classList.toggle('ativo', i.camada === 'atras');
      op.querySelector('[data-cadimg="frente"]').classList.toggle('ativo', i.camada !== 'atras' && i.camada !== 'quebra');
      op.querySelector('[data-cadimg="quebra"]').classList.toggle('ativo', i.camada === 'quebra');
      op.querySelector('input[type=range]').value = Math.round((i.op || 1) * 100);
      op.querySelectorAll('button,input').forEach(e => { e.disabled = ro; });
    }
  }
  document.querySelectorAll('#caderno .cad-miniatura').forEach(b => b.classList.toggle('ativa', b.dataset.img === cadImgSel));
}
function cadRenderImagens() {
  const el = document.getElementById('caderno'); if (!el) return;
  const atras = el.querySelector('.cad-atras'), frente = el.querySelector('.cad-frente'), minis = el.querySelector('.cad-miniaturas');
  if (!atras) return;
  atras.innerHTML = ''; frente.innerHTML = ''; minis.innerHTML = '';
  const f = cadFolhaAtual(), lista = cadImagensDa(f), ro = cadSomenteLeitura();
  if (cadImgSel && !lista.some(i => i.id === cadImgSel)) cadImgSel = null;
  lista.forEach((i, n) => {
    if (i.camada !== 'quebra') {
      const img = document.createElement('img');
      img.src = i.src; img.alt = ''; img.draggable = false; img.dataset.img = i.id;
      img.style.opacity = String(i.op || 1);
      cadImgEstilo(img, i);
      (i.camada === 'atras' ? atras : frente).appendChild(img);
    }
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'cad-miniatura'; b.dataset.img = i.id; b.title = `Imagem ${n + 1}`;
    b.setAttribute('aria-label', `Selecionar imagem ${n + 1}`);
    const t = document.createElement('img'); t.src = i.src; t.alt = ''; b.appendChild(t);
    minis.appendChild(b);
  });
  const novo = el.querySelector('[data-cadimg="nova"]');
  if (novo) novo.disabled = ro || lista.length >= CAD_IMG[cadEscopo].max;
  cadRenderFlut(); cadRenderSelecao(); cadAjustarAltura();
}

function cadReduzirImagem(arquivo, cfg) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo), im = new Image();
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('imagem')); };
    im.onload = () => {
      URL.revokeObjectURL(url);
      const w0 = im.naturalWidth, h0 = im.naturalHeight;
      if (!w0 || !h0) { reject(new Error('imagem')); return; }
      let lado = cfg.lado, q = 0.82, saida = '';
      for (let t = 0; t < 7; t++) {
        const k = Math.min(1, lado / Math.max(w0, h0));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w0 * k)); c.height = Math.max(1, Math.round(h0 * k));
        const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(im, 0, 0, c.width, c.height);
        saida = c.toDataURL('image/webp', q);
        if (!saida.startsWith('data:image/webp')) saida = c.toDataURL('image/jpeg', q);
        if (saida.length <= cfg.bytes) { resolve({ src: saida, ar: c.height / c.width }); return; }
        lado = Math.round(lado * 0.82); q = Math.max(0.5, q - 0.06);
      }
      reject(new Error('grande'));
    };
    im.src = url;
  });
}

async function cadAdicionarImagem(arquivo) {
  const f = cadFolhaAtual(); if (!f || cadSomenteLeitura() || !arquivo || !arquivo.type.startsWith('image/')) return;
  const cfg = CAD_IMG[cadEscopo], lista = cadImagensDa(f);
  if (lista.length >= cfg.max) { exAviso('Limite de imagens', `Cada folha desta estante aceita até ${cfg.max} imagens.`, true); return; }
  let r;
  try { r = await cadReduzirImagem(arquivo, cfg); }
  catch (e) { exAviso('Não foi possível usar a imagem', e.message === 'grande' ? 'Ela continua grande demais depois de reduzida. Tente uma menor.' : 'O arquivo não pôde ser lido como imagem.', true); return; }
  const W = cadPapelLargura() || 340, papel = document.querySelector('#caderno .caderno-papel');
  const w = 0.5, y = Math.max(0, ((papel ? papel.scrollTop : 0) / W) + 0.04);
  const novo = { id: genId(), src: r.src, ar: r.ar, x: 0.25, y, w, camada: 'frente', op: 1 };
  lista.push(novo);
  if (JSON.stringify(cadLista()).length > cfg.total) {
    lista.pop();
    exAviso('Espaço do caderno cheio', cadEscopo === 'ficha' ? 'A ficha não comporta mais imagens nas anotações. Use a estante Geral ou remova alguma.' : 'O armazenamento do navegador não comporta mais imagens.', true);
    return;
  }
  cadImgSel = novo.id; cadPersistir(); cadRenderImagens();
}

function cadImgSelecionar(id) { cadImgSel = id; cadRenderSelecao(); const sel = document.querySelector('#caderno .cad-selecao'); if (sel && id) sel.focus({ preventScroll: true }); }

// imagem com texto ao redor encosta na lateral do lado escolhido, para o texto não sobrar em fatias estreitas
function cadEncostarQuebra(i) { i.x = i.lado === 'dir' ? Math.max(0, 1 - i.w) : 0; }

function cadAtualizarImg(i) {
  const sel = document.querySelector('#caderno .cad-selecao');
  if (i.camada === 'quebra') {
    i.lado = (i.x + i.w / 2) < 0.5 ? 'esq' : 'dir';
    const d = document.querySelector(`#caderno .cad-flut-item[data-img="${i.id}"]`);
    if (d) cadFlutEstilo(d, i);
  } else {
    document.querySelectorAll(`#caderno .cad-camada img[data-img="${i.id}"]`).forEach(g => cadImgEstilo(g, i));
  }
  if (sel) cadImgEstilo(sel, i);
  cadAjustarAltura();
}

function cadImgArrastar(e, modo, alca) {
  const i = cadImgSel ? cadImgPorId(cadImgSel) : null; if (!i || cadSomenteLeitura()) return;
  e.preventDefault();
  const W = cadPapelLargura(), ini = { px: e.clientX, py: e.clientY, x: i.x, y: i.y, w: i.w };
  const el = e.currentTarget; try { el.setPointerCapture(e.pointerId); } catch (x) {}
  const mover = ev => {
    const dx = (ev.clientX - ini.px) / W, dy = (ev.clientY - ini.py) / W;
    if (modo === 'mover') {
      i.x = Math.min(Math.max(0, ini.x + dx), Math.max(0, 1 - i.w)); i.y = Math.max(0, ini.y + dy);
    } else {
      const dir = alca.includes('e') ? 1 : -1;
      let w = Math.min(1, Math.max(0.08, ini.w + dir * dx));
      const dir2 = alca.includes('s') ? 1 : -1;
      if (Math.abs(dy) > Math.abs(dx) * i.ar) w = Math.min(1, Math.max(0.08, ini.w + dir2 * dy / i.ar));
      const ancX = alca.includes('e') ? ini.x : ini.x + ini.w, ancY = alca.includes('s') ? ini.y : ini.y + ini.w * i.ar;
      i.w = w; i.x = alca.includes('e') ? ancX : ancX - w; i.y = alca.includes('s') ? ancY : Math.max(0, ancY - w * i.ar);
      if (i.x < 0) i.x = 0; if (i.x + i.w > 1) i.x = 1 - i.w;
    }
    cadAtualizarImg(i);
  };
  const fim = () => {
    el.removeEventListener('pointermove', mover); el.removeEventListener('pointerup', fim); el.removeEventListener('pointercancel', fim);
    if (i.camada === 'quebra') { cadEncostarQuebra(i); cadRenderFlut(); }
    cadAgendar(); cadRenderSelecao();
  };
  el.addEventListener('pointermove', mover); el.addEventListener('pointerup', fim); el.addEventListener('pointercancel', fim);
}

function cadImgIniciar() {
  if (cadImgIniciado) return;
  const el = document.getElementById('caderno'); if (!el) return;
  cadImgIniciado = true;
  const sel = el.querySelector('.cad-selecao'), papel = el.querySelector('.caderno-papel'), ta = el.querySelector('.caderno-texto');
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-cadimg]'); if (b) {
      const a = b.dataset.cadimg, i = cadImgSel ? cadImgPorId(cadImgSel) : null;
      if (a === 'nova') { el.querySelector('#cadInputImagem').click(); return; }
      if (!i || cadSomenteLeitura()) return;
      if (a === 'atras' || a === 'frente' || a === 'quebra') { i.camada = a; if (a === 'quebra') { i.lado = (i.x + i.w / 2) < 0.5 ? 'esq' : 'dir'; cadEncostarQuebra(i); } cadPersistir(); cadRenderImagens(); }
      else if (a === 'remover') { const l = cadImagensDa(cadFolhaAtual()); l.splice(l.indexOf(i), 1); cadImgSel = null; cadPersistir(); cadRenderImagens(); }
      return;
    }
    const m = e.target.closest('.cad-miniatura'); if (m) cadImgSelecionar(m.dataset.img);
  });
  el.querySelector('#cadInputImagem').addEventListener('change', async ev => {
    const arq = ev.target.files && ev.target.files[0]; ev.target.value = '';
    if (arq) await cadAdicionarImagem(arq);
  });
  el.querySelector('.cad-opcoes input[type=range]').addEventListener('input', ev => {
    const i = cadImgSel ? cadImgPorId(cadImgSel) : null; if (!i || cadSomenteLeitura()) return;
    i.op = Number(ev.target.value) / 100;
    document.querySelectorAll(`#caderno .cad-camada img[data-img="${i.id}"], #caderno .cad-flut-item[data-img="${i.id}"]`).forEach(g => { g.style.opacity = String(i.op); });
    cadAgendar();
  });
  // selecionar pelo clique em imagem que está na frente do texto
  el.querySelector('.cad-frente').addEventListener('pointerdown', e => {
    const g = e.target.closest('img[data-img]'); if (!g) return;
    cadImgSelecionar(g.dataset.img);
    cadImgArrastar({ clientX: e.clientX, clientY: e.clientY, pointerId: e.pointerId, preventDefault() { e.preventDefault(); }, currentTarget: sel }, 'mover');
  });
  sel.addEventListener('pointerdown', e => {
    const alca = e.target.closest('[data-alca]');
    cadImgArrastar(e, alca ? 'alca' : 'mover', alca ? alca.dataset.alca : null);
  });
  sel.addEventListener('keydown', e => {
    const i = cadImgSel ? cadImgPorId(cadImgSel) : null; if (!i || cadSomenteLeitura()) return;
    const p = e.shiftKey ? 0.05 : 0.01;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); const l = cadImagensDa(cadFolhaAtual()); l.splice(l.indexOf(i), 1); cadImgSel = null; cadPersistir(); cadRenderImagens(); el.querySelector('.caderno-texto').focus(); return; }
    const mov = { ArrowLeft: [-p, 0], ArrowRight: [p, 0], ArrowUp: [0, -p], ArrowDown: [0, p] }[e.key];
    if (mov) { e.preventDefault(); i.x = Math.min(Math.max(0, i.x + mov[0]), Math.max(0, 1 - i.w)); i.y = Math.max(0, i.y + mov[1]); cadAgendar(); cadRenderImagens(); sel.focus({ preventScroll: true }); }
    else if (e.key === 'Escape') { e.stopPropagation(); cadImgSel = null; cadRenderSelecao(); ta.focus(); }
  });
  ta.addEventListener('pointerdown', () => { if (cadImgSel) { cadImgSel = null; cadRenderSelecao(); } });
  // dois cliques sobre a imagem (atrás do texto ou com texto ao redor) a seleciona; a área é exatamente a da imagem
  ta.addEventListener('dblclick', e => {
    const alvos = [...el.querySelectorAll('.cad-flut-item img'), ...el.querySelectorAll('.cad-atras img')];
    const hit = alvos.find(g => { const r = g.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; });
    if (!hit) return;
    e.preventDefault();
    const sl = window.getSelection(); if (sl) sl.removeAllRanges();
    cadImgSelecionar(hit.dataset.img);
  });
  ta.addEventListener('input', cadAjustarAltura);
  ta.addEventListener('paste', ev => {
    const cd = ev.clipboardData; if (!cd) return;
    ev.preventDefault();
    const it = [...cd.items].find(x => x.kind === 'file' && x.type.startsWith('image/'));
    if (it) { cadAdicionarImagem(it.getAsFile()); return; }
    const livre = Math.max(0, CAD_MAX_TEXTO - cadLerTexto(ta).length);
    const txt = (cd.getData('text/plain') || '').slice(0, livre);
    if (txt) document.execCommand('insertText', false, txt);
  });
  ta.addEventListener('beforeinput', ev => {
    if (!ev.inputType || !ev.inputType.startsWith('insert') || ev.inputType === 'insertFromPaste') return;
    const add = ev.data || '';
    if (cadLerTexto(ta).length + Math.max(add.length, 1) > CAD_MAX_TEXTO) ev.preventDefault();
  });
  papel.addEventListener('dragover', ev => { if ([...(ev.dataTransfer ? ev.dataTransfer.types : [])].includes('Files')) ev.preventDefault(); });
  papel.addEventListener('drop', ev => {
    const arq = ev.dataTransfer && [...ev.dataTransfer.files].find(x => x.type.startsWith('image/'));
    if (!arq) return;
    ev.preventDefault(); cadAdicionarImagem(arq);
  });
  if (window.ResizeObserver) { cadImgRO = new ResizeObserver(() => { if (el.classList.contains('aberto')) cadRenderImagens(); }); cadImgRO.observe(el.querySelector('.caderno-conteudo')); }
}
exEnvolver('cadCriar', cadImgIniciar);
exEnvolver('cadRender', cadRenderImagens);


/* ============================================================
   16. CONDIÇÕES NA FICHA (v33)
   Faixa no alto da aba Ficha com as condições ativas. Clicar abre o
   que a condição faz, com o texto das regras que já está na aba
   Condições, e dá para ligar, desligar ou ajustar dali.
   ============================================================ */
const COND_CHAVES = {
  condCardAdrenalina: ['adrenalina', 'active'], condCardSangramento: ['sangramento', 'active'], condCardMorrendo: ['morrendo', 'active'],
  condCardVulneravel: ['vulneravel', 'active'], condCardEnlouquecendo: ['enlouquecendo', 'active'], condCardFerido: ['ferido', 'active'],
  condCardTraumatizado: ['traumatizado', 'active']
};
let condModoLista = false, condAtual = null;

function condTexto(card, sel) { const e = card && card.querySelector(sel); return e ? e.textContent.trim() : ''; }

function exRenderFaixaCond() {
  const ch = exFicha(), lista = document.getElementById('condFaixaLista'); if (!ch || !lista || !ch.conditions) return;
  const c = ch.conditions, ativos = CONDICOES_CARTOES.filter(d => d.ativo(c));
  document.getElementById('condFaixaN').textContent = ativos.length ? `${ativos.length} ativa${ativos.length > 1 ? 's' : ''}` : '';
  lista.innerHTML = '';
  if (!ativos.length) { const p = document.createElement('p'); p.className = 'cond-nada'; p.textContent = 'Nenhuma condição ativa. O personagem está bem.'; lista.appendChild(p); }
  ativos.forEach(d => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'cond-chip' + (d.grave ? ' grave' : ''); b.dataset.cond = d.card;
    b.setAttribute('aria-label', `${d.nome}: ver o que faz`);
    b.textContent = d.nome;
    const det = d.extra ? d.extra(c) : '';
    if (det) { const sm = document.createElement('small'); sm.textContent = det; b.appendChild(sm); }
    lista.appendChild(b);
  });
  if (document.getElementById('condModal') && !document.getElementById('condModal').classList.contains('hidden')) condRenderModal();
}
exEnvolver('renderConditions', exRenderFaixaCond);

function condCriarModal() {
  if (document.getElementById('condModal')) return;
  const m = document.createElement('div');
  m.id = 'condModal'; m.className = 'modal-overlay hidden';
  m.innerHTML = '<div class="modal cond-modal" role="dialog" aria-modal="true" aria-labelledby="condModalTitulo"><div class="cond-modal-corpo"></div></div>';
  document.body.appendChild(m);
  m.addEventListener('click', e => {
    if (e.target === m) { condFechar(); return; }
    const a = e.target.closest('[data-condacao]'); if (!a) return;
    const ch = exFicha(), acao = a.dataset.condacao;
    if (acao === 'fechar') condFechar();
    else if (acao === 'voltar') { condModoLista = true; condRenderModal(); }
    else if (acao === 'abrir') { condAtual = a.dataset.card; condModoLista = false; condRenderModal(); }
    else if (acao === 'aba') { const card = condAtual; condFechar(); condIrParaAba(card); }
    else if (ch && !ch._ro) {
      if (acao === 'alternar') { const [k, f] = COND_CHAVES[condAtual]; toggleCondition(k, f, a.dataset.valor === '1'); }
      else if (acao === 'membro') toggleCondition('perdaMembros', a.dataset.membro, a.dataset.valor === '1');
      else if (acao === 'fadiga') modFadiga(Number(a.dataset.delta));
      condRenderModal();
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !m.classList.contains('hidden')) { e.stopPropagation(); condFechar(); } }, true);
}
function condFechar() { const m = document.getElementById('condModal'); if (m) m.classList.add('hidden'); }
function condAbrirLista() { condCriarModal(); condModoLista = true; condRenderModal(); document.getElementById('condModal').classList.remove('hidden'); }
function condAbrirDetalhe(card) { condCriarModal(); condAtual = card; condModoLista = false; condRenderModal(); document.getElementById('condModal').classList.remove('hidden'); }
function condIrParaAba(card) {
  const tab = document.querySelector('.tab[data-tab="tabConditions"]'); if (tab) tab.click();
  if (card) setTimeout(() => { const el = document.getElementById(card); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60);
}
window.condAbrirLista = condAbrirLista; window.condIrParaAba = condIrParaAba;

function condRenderModal() {
  const ch = exFicha(), corpo = document.querySelector('#condModal .cond-modal-corpo'); if (!ch || !corpo) return;
  const c = ch.conditions, ro = !!ch._ro;
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const btn = (txt, acao, extra = {}, cls = 'small') => { const b = el('button', cls, txt); b.type = 'button'; b.dataset.condacao = acao; Object.assign(b.dataset, extra); if (ro && ['alternar', 'membro', 'fadiga'].includes(acao)) b.disabled = true; return b; };
  corpo.innerHTML = '';
  if (condModoLista) {
    const h = el('h2', '', 'Condições'); h.id = 'condModalTitulo'; corpo.appendChild(h);
    corpo.appendChild(el('p', 'cond-modal-dica', 'Toque em uma condição para ver o que ela faz e ligar ou desligar.'));
    const g = el('div', 'cond-modal-lista');
    CONDICOES_CARTOES.forEach(d => {
      const on = !!d.ativo(c), card = document.getElementById(d.card);
      const b = el('button', 'cond-modal-item' + (on ? ' ativa' : '') + (d.grave ? ' grave' : ''));
      b.type = 'button'; b.dataset.condacao = 'abrir'; b.dataset.card = d.card;
      b.appendChild(el('strong', '', d.nome));
      b.appendChild(el('span', '', on ? 'Ativa' : condTexto(card, '.cond-quando')));
      g.appendChild(b);
    });
    corpo.appendChild(g);
    const ac = el('div', 'modal-actions'); ac.appendChild(btn('Fechar', 'fechar', {}, '')); corpo.appendChild(ac);
    return;
  }
  const def = CONDICOES_CARTOES.find(d => d.card === condAtual); if (!def) { condModoLista = true; return condRenderModal(); }
  const card = document.getElementById(def.card), on = !!def.ativo(c);
  const cab = el('div', 'cond-modal-cab');
  const h = el('h2', '', def.nome); h.id = 'condModalTitulo'; cab.appendChild(h);
  cab.appendChild(el('span', 'cond-modal-estado' + (on ? ' on' : ''), on ? 'Ativa' : 'Inativa'));
  corpo.appendChild(cab);
  const quando = condTexto(card, '.cond-quando'); if (quando) corpo.appendChild(el('p', 'cond-modal-quando', quando));
  const desc = condTexto(card, '.cond-desc'); if (desc) corpo.appendChild(el('p', 'cond-modal-desc', desc));
  if (def.card === 'condCardAdrenalina') {
    const f = el('div', 'cond-modal-faixas');
    card.querySelectorAll('.cond-faixas button').forEach(b => {
      const t = b.querySelector('strong').textContent, e = b.querySelector('span').textContent;
      const x = el('div', 'cond-modal-faixa' + (b.classList.contains('ativa') ? ' ativa' : '')); x.appendChild(el('strong', '', t)); x.appendChild(el('span', '', e)); f.appendChild(x);
    });
    corpo.appendChild(f);
  }
  if (def.card === 'condCardMorrendo') corpo.appendChild(el('p', 'cond-modal-desc', `Dificuldade atual do teste: ${18 + Math.floor((c.morrendo.danoAdicional || 0) / 5)}.`));
  if (def.card === 'condCardTraumatizado' && c.traumatizado.desc) corpo.appendChild(el('p', 'cond-modal-desc', `Trauma: ${c.traumatizado.desc}`));
  const nota = condTexto(card, '.cond-nota'); if (nota) corpo.appendChild(el('p', 'cond-modal-nota', nota));
  if (def.card === 'condCardMembros') {
    [['perna', 'Perna'], ['braco', 'Braço']].forEach(([k, nome]) => {
      const caixa = card.querySelector(k === 'perna' ? '#condMembroPerna p' : '#condMembroBraco p');
      const linha = el('div', 'cond-modal-membro'); const t = el('div'); t.appendChild(el('strong', '', nome)); t.appendChild(el('p', '', caixa ? caixa.textContent.trim() : ''));
      linha.appendChild(t); linha.appendChild(btn(c.perdaMembros[k] ? 'Desativar' : 'Ativar', 'membro', { membro: k, valor: c.perdaMembros[k] ? '0' : '1' }));
      corpo.appendChild(linha);
    });
  }
  if (def.card === 'condCardFadiga') {
    const pts = c.fadiga.points || 0;
    corpo.appendChild(el('p', 'cond-modal-desc', `Pontos de Fadiga: ${pts} de 8.`));
    const l = el('div', 'cond-fadiga-lista');
    FADIGA_EFFECTS.forEach(([n, t]) => { const i = el('div', 'cond-fadiga-item' + (pts >= n ? ' ativo' : '')); i.appendChild(el('span', '', String(n))); i.appendChild(el('p', '', t)); l.appendChild(i); });
    corpo.appendChild(l);
  }
  const ac = el('div', 'modal-actions');
  ac.appendChild(btn('Todas as condições', 'voltar', {}, ''));
  if (def.card === 'condCardFadiga') { ac.appendChild(btn('-1', 'fadiga', { delta: '-1' }, '')); ac.appendChild(btn('+1', 'fadiga', { delta: '1' }, '')); }
  else if (COND_CHAVES[def.card]) ac.appendChild(btn(on ? 'Desativar' : 'Ativar', 'alternar', { valor: on ? '0' : '1' }, on ? 'danger' : 'primary'));
  if (['condCardAdrenalina', 'condCardMorrendo', 'condCardTraumatizado', 'condCardMembros', 'condCardFadiga'].includes(def.card)) ac.appendChild(btn('Abrir na aba Condições', 'aba', {}, ''));
  ac.appendChild(btn('Fechar', 'fechar', {}, ''));
  corpo.appendChild(ac);
}
document.addEventListener('click', e => {
  const c = e.target.closest('#condFaixaLista [data-cond]'); if (c) condAbrirDetalhe(c.dataset.cond);
});
exAplicarMolduras();


/* ============================================================
   17. AVISO SOBRE PERÍCIAS (v34)
   Aberto, minimizado ou fechado. A escolha fica salva nas preferências.
   ============================================================ */
function exAplicarAvisoPericias() {
  const av = document.getElementById('avisoPericias'), bt = document.getElementById('avisoPericiasReabrir'); if (!av || !bt) return;
  const est = ['aberto', 'min', 'fechado'].includes(exPrefs().avisoPericias) ? exPrefs().avisoPericias : 'aberto';
  av.dataset.estado = est;
  av.classList.toggle('hidden', est === 'fechado');
  bt.classList.toggle('hidden', est !== 'fechado');
  const mn = av.querySelector('[data-aviso="minimizar"]');
  if (mn) { mn.textContent = est === 'min' ? 'Expandir' : 'Minimizar'; mn.setAttribute('aria-expanded', est === 'min' ? 'false' : 'true'); }
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-aviso]'); if (!b) return;
  const p = exPrefs(), atual = p.avisoPericias || 'aberto', a = b.dataset.aviso;
  p.avisoPericias = a === 'fechar' ? 'fechado' : a === 'abrir' ? 'aberto' : (atual === 'min' ? 'aberto' : 'min');
  exSalvarPrefs(p); exAplicarAvisoPericias();
});
exAplicarAvisoPericias();


/* cartões do catálogo de habilidades: textos longos recolhidos, com "Ver mais" */
document.addEventListener('click', ev => {
  const b = ev.target.closest('.hab-vermais'); if (!b) return;
  const card = b.closest('.hab-escolha'); if (!card) return;
  const aberto = card.classList.toggle('expandido');
  b.textContent = aberto ? 'Ver menos' : 'Ver mais';
  b.setAttribute('aria-expanded', aberto ? 'true' : 'false');
});
