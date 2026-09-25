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
        const margem = (ch && ch.derivedModifiers && ch.derivedModifiers.critMargin) || 0;
        if (valores.some(v => v >= 20 - margem)) natural20 = true;
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
function exAbrirPainel(aba) {
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
    controles.insertAdjacentHTML('beforeend', exBotaoDado(`rolarAtributo('${m[1]}')`, `Rolar 1d20 + ${ATRIB_NOMES[m[1]]}`, 'd20'));
  });
}
function exInjetarPericias() {
  document.querySelectorAll('#skillList .skill-row').forEach(row => {
    if (row.querySelector('.dado-btn')) return;
    const nome = row.querySelector('.skill-name');
    if (!nome) return;
    const alvo = row.querySelector('.skill-row-controls') || row;
    alvo.insertAdjacentHTML('afterbegin', exBotaoDado(`rolarPericia('${exEsc(nome.textContent).replace(/'/g, "\\'")}')`, `Rolar 1d20 + total de ${exEsc(nome.textContent)}`, ''));
  });
}
// Acha expressões de dado em qualquer texto e oferece um botão para cada uma
function exChipsDeTexto(elemento, titulo) {
  if (!elemento || elemento.querySelector('.dados-chips')) return;
  const texto = elemento.textContent || '';
  const achados = [...new Set((texto.match(/\d*\s*d\s*\d+(\s*[+-]\s*\d+)?/gi) || []).map(x => x.replace(/\s+/g, '')))].slice(0, 4);
  if (!achados.length) return;
  const html = achados.map(e => `<button type="button" class="dado-chip" onclick="rolarExpressao('${e}', '${exEsc(titulo).replace(/'/g, "\\'")}')">${exEsc(e)}</button>`).join('');
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
    if (atk.acerto) botoes.push(`<button type="button" class="dado-chip" onclick="rolarExpressao('1d20+${exEsc(String(atk.acerto).replace(/[^0-9+\-dD ]/g, ''))}','Acerto — ${exEsc(atk.name)}')">Acerto</button>`);
    if (atk.dano) botoes.push(`<button type="button" class="dado-chip primario" onclick="rolarExpressao('${exEsc(atk.dano).replace(/'/g, "")}','Dano — ${exEsc(atk.name)}')">Dano ${exEsc(atk.dano)}</button>`);
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

// os aprimoramentos entram nos modificadores da ficha
const exRecalcOriginal = window.recalcAllModifiers;
window.recalcAllModifiers = function (ch) {
  exRecalcOriginal(ch);
  if (!ch || !ch.dmt) return;
  const ef = exEfeitosDmt(ch);
  ch.derivedModifiers.movementFlat = (ch.derivedModifiers.movementFlat || 0) + ef.deslocamento;
  ch.derivedModifiers.defesaEsquiva = (ch.derivedModifiers.defesaEsquiva || 0) + ef.defesa;
  ch.dmt.cylinderCapacity = ef.gasPorCilindro;
  ch.dmt.cylinder1 = Math.min(ch.dmt.cylinder1 ?? ef.gasPorCilindro, ef.gasPorCilindro);
  ch.dmt.cylinder2 = Math.min(ch.dmt.cylinder2 ?? ef.gasPorCilindro, ef.gasPorCilindro);
};

// lâminas quebram conforme o limite dos aprimoramentos
window.registerBladeAttack = function () {
  const ch = exFicha(); if (!ch) return;
  if (!ch.dmt.bladesEquipped) { exAviso('Sem lâminas disponíveis', 'Troque o conjunto ou reabasteça antes de atacar.', true); return; }
  const limite = exLimiteLaminas(ch);
  ch.dmt.bladeAttacksUsed = (ch.dmt.bladeAttacksUsed || 0) + 1;
  if (ch.dmt.bladeAttacksUsed >= limite) {
    ch.dmt.bladeAttacksUsed = 0;
    if (ch.dmt.bladeReserve > 0) { ch.dmt.bladeReserve -= 1; exAviso('Conjunto de lâminas quebrado', 'Um conjunto de reserva foi equipado.'); }
    else { ch.dmt.bladesEquipped = false; exAviso('Conjunto de lâminas quebrado', 'Sem reservas — reabasteça antes de atacar de novo.', true); }
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
  recalcAllModifiers(ch); exSalvar(); renderDMT();
}
function dmtAplicarPacote(ativar) {
  const ch = exFicha(); if (!ch) return;
  const dmt = exDmt(ch);
  dmt.melhorias = ativar ? DMT_MELHORIAS.map(m => m.id) : [];
  dmt.type = ativar ? 'Aprimorado' : 'Tradicional';
  if (ativar) { dmt.cylinder1 = 40; dmt.cylinder2 = 40; }
  recalcAllModifiers(ch); exSalvar(); renderDMT();
  exAviso(ativar ? 'DMT Aprimorado ativado' : 'DMT tradicional', ativar ? 'Os seis aprimoramentos do livro foram aplicados.' : 'Os aprimoramentos oficiais foram desligados.');
}
function dmtRemoverCustom(id) {
  const ch = exFicha(); if (!ch) return;
  const dmt = exDmt(ch);
  dmt.custom = dmt.custom.filter(c => c.id !== id);
  recalcAllModifiers(ch); exSalvar(); renderDMT();
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
  renderDMT();
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
    anotacoes: '+1 nos Atributos Força e Agilidade, +1 em Testes de Acerto e −2 em SAN permanentemente (Passiva de Origem)\n+1 em Testes de Acerto e +1d4 em danos (Passiva de Classe)\n+1 nível em Investida Relâmpago (Habilidade de Origem)\nTrauma de perda: Mikasa teme perder de novo quem considera família.'
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
    anotacoes: '+1 nos Atributos Força e Agilidade, +1 em Testes de Acerto e −2 em SAN permanentemente (Passiva de Origem)\n+3 em Testes de Acerto e +1d8 em danos (Passiva de Classe)\n+1 nível em Ataque Giratório (Habilidade de Origem)'
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
    anotacoes: 'Vantagem em testes de História (Passiva de Origem)\n+1 nos Testes de Acerto de quantos aliados quiser (e dele mesmo) durante combates (Passiva de Classe)\nPode trocar um teste de morte por História uma vez ao dia (Habilidade de Origem)\nErwin é obcecado por descobrir os mistérios do mundo.'
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
    anotacoes: 'Vantagem em testes de Mecânica (Passiva de Origem)\nEquipamentos curativos recuperam +1d6 PDV e reparos recebem +2 (Passiva de Classe)\nHabilidades da subclasse Inventor custam 1 PDE a menos (Habilidade de Origem)'
  },
  {
    nome: 'Kenny Ackerman', nivel: 11, origem: 'Ackerman', classe: 'Linha de Frente', subclasse: 'Atirador',
    pdv: 84, san: 8, pde: 53, attrs: { agi: 8, sta: 1, str: 4, int: 4, vit: 2 },
    pericias: { 'Crime': 3, 'Exploração': 3, 'Furtividade': 3, 'Intimidação': 3, 'Luta': 2, 'Pontaria': 8 },
    habilidades: ['Ocultação Treinada', 'Resposta Imediata', 'Melhoria Geral', 'Tiro de Raspão', 'Tiro de Auxílio', 'Sede de Sangue', 'Olhos de Águia'],
    talentos: ['Visão Aguçada', 'Guerreiro Experiente', 'Robusto', 'Arrogante', 'Mal Encarado', 'Mau Nome'],
    anotacoes: '+1 nos Atributos Força e Agilidade, +1 em Testes de Acerto e −2 em SAN permanentemente (Passiva de Origem)\n+2 em Testes de Acerto e +1d6 em danos (Passiva de Classe)\n+1 nível em Sede de Sangue (Habilidade de Origem)'
  },
  {
    nome: 'Petra Ral', nivel: 9, origem: 'Cidadão', classe: 'Suporte de Campo', subclasse: 'Médico',
    pdv: 50, san: 12, pde: 47, attrs: { agi: 5, sta: 3, str: 2, int: 4, vit: 1 },
    pericias: { 'Carisma': 3, 'Exploração': 3, 'Furtividade': 1, 'Luta': 5, 'Medicina': 7, 'Natureza': 1, 'Tática': 3 },
    habilidades: ['Finta', 'Impulso Aprimorado', 'Apoiar', 'Medicina Avançada', 'Golpe Baixo', 'Concentração Total', 'Ataque Atordoante'],
    talentos: ['Aparência Inofensiva', 'Guerreiro Experiente', 'Contra Golpe', 'Reflexos Aguçados', 'Azarado', 'Medo da Morte'],
    anotacoes: '4 perícias diferentes recebem +1 (Passiva de Origem)\nEquipamentos curativos recuperam +1d6 PDV e reparos recebem +2 (Passiva de Classe)\n1 habilidade geral adicional (Habilidade de Origem)'
  },
  {
    nome: 'Sasha Braus', nivel: 10, origem: 'Fazendeiro', classe: 'Linha de Frente', subclasse: 'Atirador',
    pdv: 88, san: 7, pde: 63, attrs: { agi: 6, sta: 3, str: 2, int: 1, vit: 3 },
    pericias: { 'Carisma': 4, 'Exploração': 2, 'Fortitude': 1, 'Luta': 2, 'Natureza': 2, 'Pontaria': 5 },
    habilidades: ['Golpe de Sorte', 'Instinto de Sobrevivência', 'Crítico Aprimorado', 'Concentração de Mira', 'Ataque Fatal', 'Olhos de Águia'],
    talentos: ['Caçador', 'Bom Apetite', 'Aparência Inofensiva', 'Barulhento'],
    anotacoes: 'Vantagem em testes de Natureza (Passiva de Origem)\n+2 em Testes de Acerto e +1d6 em danos (Passiva de Classe)\n−1 na margem de crítico em ambientes rurais (Habilidade de Origem)'
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
  const base = parseInt(String(cat.testeAcerto).replace(/[^0-9+-]/g, ''), 10) || 0;
  const acerto = base + (v ? v.acerto : 0);
  const dano = cat.dano + (v ? ' ' + v.dano : '');
  return { acerto, dano, variacao: v ? v.nome : '' };
}
function exChipDado(expr, titulo, rotulo, classe, modo) {
  return `<button type="button" class="dado-chip ${classe || ''}" onclick="rolarExpressao('${exEsc(expr).replace(/'/g, '')}','${exEsc(titulo).replace(/'/g, '')}'${modo ? `,'${modo}'` : ''})">${exEsc(rotulo)}</button>`;
}
function exChipsAcerto(teste, attrs, nome, desvantagem) {
  const chaves = [...new Set((String(teste || '').match(/Força|Forca|Agilidade|Intelecto|Vitalidade|Estâmina|Estamina/gi) || [])
    .map(p => ATRIB_POR_NOME[exSemAcento(p)]))];
  if (!chaves.length) return '';
  return chaves.map(k => {
    const v = (attrs && attrs[k]) || 0;
    return exChipDado(`1d20 + ${v}`, `Acerto (${ATRIB_NOMES[k]}) — ${nome}`,
      `Acerto ${ATRIB_NOMES[k].slice(0, 3)} 1d20+${v}${desvantagem ? ' ↓' : ''}`, '', desvantagem ? 'desvantagem' : '');
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
let exUltimaFichaCor = null;
function exCorDaClasse() {
  // a ficha aberta manda; sem ficha aberta, vale a última que foi aberta
  const ch = exFicha() || (exUltimaFichaCor && characters.find(c => c.id === exUltimaFichaCor)) || null;
  if (!ch) return null;
  exUltimaFichaCor = ch.id;
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
}
function definirTema(tema) { const p = exPrefs(); p.tema = tema; exSalvarPrefs(p); exAplicarTema(); abrirConfiguracoes(); }
function definirCor(cor) {
  const p = exPrefs();
  if (cor === 'classe') { p.corClasse = true; } else { p.corClasse = false; p.cor = cor; }
  exSalvarPrefs(p); exAplicarTema(); abrirConfiguracoes();
}
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
          <span class="config-cor-nome">${c.nome}</span>${ativa ? '<span class="config-cor-ok" aria-hidden="true">✓</span>' : ''}</button>`;
      }).join('')}
    </div>
    <label class="nv-opcao"><input type="checkbox" ${p.corClasse ? 'checked' : ''} onchange="definirCor(this.checked ? 'classe' : '${p.cor || 'aco'}')" />
      <span><strong>Usar a cor da classe do personagem</strong>
      <small>Linha de Frente fica vermelho, Suporte de Campo verde e Especialista de Batalha amarelo. A cor muda conforme a ficha aberta${p.corClasse ? ` (agora: ${(CORES_TEMA[exCorAtual()] || {}).nome})` : ''}.</small></span></label>

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
  const obs = new MutationObserver(() => { exAtualizarTitulo(); if (exPrefs().corClasse) exAplicarTema(); });
  alvos.forEach(el => obs.observe(el, { attributes: true, attributeFilter: ['class'] }));
  const nome = document.getElementById('charName');
  if (nome) nome.addEventListener('input', exAtualizarTitulo);
  exAtualizarTitulo();
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
    el.insertAdjacentHTML('afterend', `<button type="button" class="dado-chip" style="margin-left:8px;" onclick="rolarExpressao('${expr[0].replace(/\s+/g, '')}','Ataque desarmado')">Rolar</button>`);
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
    <button type="button" class="dado-chip primario" onclick="rolarExpressao('2d10 + ${forca}', 'Dano das lâminas')">Lâminas 2d10+${forca}</button>
    <button type="button" class="dado-chip" onclick="rolarExpressao('${canhao}', 'Dano do canhão de mão')">Canhão ${canhao}</button></div>`);
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
