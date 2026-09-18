/* ============================================================
   DADOS — ATRIBUTOS, PERÍCIAS, ORIGENS, SUBCLASSES, PROGRESSÃO
   ============================================================ */
const ATTRIBUTES = {
  agi: { name: 'Agilidade', description: 'Destreza geral, esquivas, deslocamento, iniciativa.' },
  sta: { name: 'Estâmina', description: 'Vigor, resistência física, PDE.' },
  str: { name: 'Força', description: 'Potência física, dano corpo a corpo, inventário.' },
  int: { name: 'Intelecto', description: 'Inteligência, perícias, SAN.' },
  vit: { name: 'Vitalidade', description: 'Resistência, PDV, sobrevivência.' }
};

const ORIGIN_CHOICE_LABELS = {
  agi: 'Agilidade', sta: 'Estâmina', str: 'Força', int: 'Intelecto', vit: 'Vitalidade',
  mecanica: 'Mecânica', medicina: 'Medicina', pontaria: 'Pontaria', luta: 'Luta'
};
function formatOriginChoices(choices) {
  if (Array.isArray(choices)) return choices.map(c => ORIGIN_CHOICE_LABELS[c] || c).join(' ou ');
  if (choices === 'skills_4') return '4 perícias à sua escolha (+1 cada)';
  return choices;
}

const SKILLS_DATA = {
  'Carisma': { id: 'carisma', name: 'Carisma', attributes: ['int'], description: 'Influencia pessoas, negociação, persuasão.' },
  'Crime': { id: 'crime', name: 'Crime', attributes: ['int', 'agi'], description: 'Atividades criminosas, furtivas, abrir fechaduras.' },
  'Exploração': { id: 'exploracao', name: 'Exploração', attributes: ['int'], description: 'Percepção, investigação, busca.' },
  'Fortitude': { id: 'fortitude', name: 'Fortitude', attributes: ['vit', 'sta'], description: 'Resistência física, ferimentos, desgaste.' },
  'Furtividade': { id: 'furtividade', name: 'Furtividade', attributes: ['int', 'agi'], description: 'Esconder-se, mover-se silenciosamente.' },
  'História': { id: 'historia', name: 'História', attributes: ['int'], description: 'Eventos históricos, conhecimentos antigos.' },
  'Intimidação': { id: 'intimidacao', name: 'Intimidação', attributes: ['int', 'str'], description: 'Persuadir através do medo, ameaças.' },
  'Luta': { id: 'luta', name: 'Luta', attributes: ['str', 'agi'], description: 'Combates corpo a corpo, armas brancas.' },
  'Mecânica': { id: 'mecanica', name: 'Mecânica', attributes: ['int'], description: 'Criar, reparar e modificar equipamentos.' },
  'Medicina': { id: 'medicina', name: 'Medicina', attributes: ['int'], description: 'Curativos, diagnósticos, procedimentos médicos.' },
  'Natureza': { id: 'natureza', name: 'Natureza', attributes: ['int'], description: 'Animais, sobrevivência, elementos naturais.' },
  'Pontaria': { id: 'pontaria', name: 'Pontaria', attributes: ['agi'], description: 'Armas de longa distância, arremessos.' },
  'Tática': { id: 'tatica', name: 'Tática', attributes: ['int'], description: 'Planejamento, estratégias, análise.' },
  'Vontade': { id: 'vontade', name: 'Vontade', attributes: ['int'], description: 'Estado mental, determinação, resistência psicológica.' }
};

const ORIGINS = {
  'smiths_sangue_real': { id: 'smiths_sangue_real', name: 'Sangue Real', family: 'Fritz/Reiss',
    description: 'Sendo herdeiro do sangue real, a vida do seu personagem sempre foi escondida da sociedade.',
    initialStats: { pdv: 8, san: 8, pde: 4 },
    passive: { id: 'smiths_passiva', name: 'Sangue Real', description: 'Adicione +1 ao seu atributo de Intelecto.', effects: [{ type: 'attribute', attribute: 'int', value: 1 }] },
    originAbility: { id: 'smiths_vontade_do_rei', name: 'Vontade do Rei', description: 'Todas as recuperações de Sanidade feitas pelo personagem ou por seus aliados (se o personagem estiver por perto) passam a recuperar 1d8 ao invés de 1d4 como normalmente.', unlockLevel: 8, effects: [] } },
  'fazendeiro': { id: 'fazendeiro', name: 'Fazendeiro', family: 'Braus',
    description: 'Assim como a família Braus, seu personagem cresceu em uma área rural.',
    initialStats: { pdv: 10, san: 6, pde: 6 },
    passive: { id: 'fazendeiro_passiva', name: 'Instinto Rural', description: 'Sempre que realizar um teste de Natureza, adicione vantagem.', effects: [{ type: 'advantage', skill: 'Natureza' }] },
    originAbility: { id: 'fazendeiro_instinto_selvagem', name: 'Instinto Selvagem', description: 'Estando em áreas rurais, a margem de crítico dos testes do personagem é reduzida em -1.', unlockLevel: 8, effects: [] } },
  'cientista': { id: 'cientista', name: 'Cientista', family: 'Zoe',
    description: 'A ciência é uma área bem abrangente, mas o seu personagem conseguiu se aperfeiçoar.',
    initialStats: { pdv: 8, san: 8, pde: 6 },
    passive: { id: 'cientista_passiva', name: 'Mente Científica', description: 'Escolha entre: Sempre que realizar um teste de Mecânica OU Medicina, adicione vantagem.', effects: [], choices: ['mecanica', 'medicina'] },
    originAbility: { id: 'cientista_genio', name: 'Gênio', description: 'As habilidades exclusivas da subclasse do personagem têm seus custos de PDE reduzidos em -1.', unlockLevel: 8, effects: [] } },
  'aldeao': { id: 'aldeao', name: 'Aldeão', family: 'Springer',
    description: 'Seu personagem viveu uma vida tranquila e pôde se aprimorar em qualquer área.',
    initialStats: { pdv: 10, san: 6, pde: 4 },
    passive: { id: 'aldeao_passiva', name: 'Versátil', description: 'Escolha um atributo para receber +1.', effects: [], choices: ['agi', 'sta', 'str', 'int', 'vit'] },
    originAbility: { id: 'aldeao_faz_tudo', name: 'Faz Tudo', description: 'O personagem escolhe três perícias para receber +1.', unlockLevel: 8, effects: [] } },
  'cidadao': { id: 'cidadao', name: 'Cidadão', family: 'Foster/Kirstein',
    description: 'Seu personagem nasceu em um dos principais distritos das muralhas.',
    initialStats: { pdv: 8, san: 8, pde: 4 },
    passive: { id: 'cidadao_passiva', name: 'Urbano', description: 'Escolha 4 perícias para receber +1.', effects: [], choices: 'skills_4' },
    originAbility: { id: 'cidadao_versatilidade', name: 'Versatilidade', description: 'O personagem pode escolher uma habilidade geral adicional.', unlockLevel: 8, effects: [] } },
  'esquecido': { id: 'esquecido', name: 'Esquecido', family: '',
    description: 'A vida do seu personagem é um grande mistério.',
    initialStats: { pdv: 8, san: 6, pde: 6 },
    passive: { id: 'esquecido_passiva', name: 'Mente Vazia', description: 'Sempre que receber danos em sua Sanidade, reduza-os pela metade.', effects: [{ type: 'resistance', skill: 'sanidade', value: 0.5 }] },
    originAbility: { id: 'esquecido_lembranca', name: 'Lembrança', description: 'Após compreender seu passado, recebe 3 pontos de perícia e SAN máxima +6.', unlockLevel: 8, manualUnlock: true, effects: [{ type: 'skill_points', value: 3 }, { type: 'san_max', value: 6 }] } },
  'guerreiro': { id: 'guerreiro', name: 'Guerreiro', family: 'Braun/Leonhart/Galliard',
    description: 'Seu personagem seguiu uma carreira militar desde criança.',
    initialStats: { pdv: 12, san: 6, pde: 6 },
    passive: { id: 'guerreiro_passiva', name: 'Treinamento Militar', description: 'Escolha entre: +2 em Pontaria OU +2 em Luta.', effects: [], choices: ['pontaria', 'luta'] },
    originAbility: { id: 'guerreiro_corpo_resistente', name: 'Corpo Resistente', description: 'Todo dano recebido é reduzido em valor igual à perícia de Fortitude.', unlockLevel: 8, effects: [] } },
  'historiador': { id: 'historiador', name: 'Historiador', family: 'Arlert/Smith',
    description: 'Seu personagem sempre se interessou em entender os mistérios deste mundo.',
    initialStats: { pdv: 8, san: 8, pde: 6 },
    passive: { id: 'historiador_passiva', name: 'Erudito', description: 'Sempre que for realizar um teste de História, adicione vantagem.', effects: [{ type: 'advantage', skill: 'Historia' }] },
    originAbility: { id: 'historiador_ver_mundo', name: 'Ver o Mundo Lá Fora', description: 'Uma vez por dia, pode realizar teste adicional de morte com História.', unlockLevel: 8, effects: [] } },
  'revolucionario': { id: 'revolucionario', name: 'Revolucionário', family: 'Yeager/Kruger',
    description: 'Seu personagem nunca aceitou as regras convencionais.',
    initialStats: { pdv: 10, san: 8, pde: 6 },
    passive: { id: 'revolucionario_passiva', name: 'Determinação', description: 'Sempre que realizar um teste de Vontade, adicione vantagem.', effects: [{ type: 'advantage', skill: 'Vontade' }] },
    originAbility: { id: 'revolucionario_lute', name: 'Lute, Lute, Lute…', description: 'Uma vez ao dia, pode entrar em adrenalina com teste de Vontade.', unlockLevel: 8, effects: [] } },
  'ackerman': { id: 'ackerman', name: 'Ackerman', family: 'Ackerman',
    description: 'Habilidades físicas em níveis sobrenaturais.',
    initialStats: { pdv: 10, san: 6, pde: 8 },
    passive: { id: 'ackerman_passiva', name: 'Despertar do Poder', description: 'Uma vez na vida, perde 2 SAN permanentemente mas recebe +1 Força, +1 Agilidade e +1 em Testes de Acerto.', effects: [], manualUnlock: true },
    originAbility: { id: 'ackerman_potencial', name: 'Potencial Sobre-humano', description: 'Escolhe uma habilidade para receber +1 nível permanentemente.', unlockLevel: 8, manualUnlock: true, effects: [] } }
};

const SUBCLASSES = {
  'Linha de Frente': ['Soldado', 'Atirador'],
  'Suporte de Campo': ['Médico', 'Inventor'],
  'Especialista de Batalha': ['Capitão', 'Estrategista']
};

const CLASS_PASSIVES = {
  'Linha de Frente': [
    { min: 1, max: 7, text: 'Nível 1 a 7 — +1 em Testes de Acerto e +1d4 em seus danos.' },
    { min: 8, max: 15, text: 'Nível 8 a 15 — O bônus em Testes de Acerto aumenta para +2, e o bônus de dano aumenta para +1d6.' },
    { min: 16, max: 20, text: 'Nível 16+ — O bônus em Testes de Acerto aumenta para +3, e o bônus de dano aumenta para +1d8.' }
  ],
  'Suporte de Campo': [
    { min: 1, max: 7, text: 'Nível 1 a 7 — Equipamentos curativos recuperam +1d4 PDVs; testes para reparar equipamentos recebem +1.' },
    { min: 8, max: 15, text: 'Nível 8 a 15 — Equipamentos curativos passam a recuperar +1d6 PDVs; testes para reparar equipamentos recebem +2.' },
    { min: 16, max: 20, text: 'Nível 16 a 20 — Equipamentos curativos passam a recuperar +1d8 PDVs; testes para reparar equipamentos recebem +3.' }
  ],
  'Especialista de Batalha': [
    { min: 1, max: 7, text: 'Nível 1 a 7 — Em combate, pode escolher dois aliados (incluindo ele mesmo) para receberem +1 em Testes de Acerto enquanto ele estiver presente.' },
    { min: 8, max: 15, text: 'Nível 8 a 15 — Pode conceder o bônus de +1 em Testes de Acerto a qualquer número de aliados (incluindo ele mesmo), desde que esteja presente no combate.' },
    { min: 16, max: 20, text: 'Nível 16+ — Além do bônus de acerto, concede +1d4 de dano adicional para todos os aliados, incluindo ele mesmo.' }
  ]
};
function getClassPassiveTier(className, level) {
  const tiers = CLASS_PASSIVES[className]; if (!tiers) return null;
  return tiers.find(t => level >= t.min && level <= t.max) || null;
}

const SUBCLASS_BONUSES = {
  'Soldado': { skills: { 'Luta': 1 }, ignoreLimit: ['Luta'] },
  'Atirador': { skills: { 'Pontaria': 1 }, ignoreLimit: ['Pontaria'] },
  'Médico': { skills: { 'Medicina': 1 }, ignoreLimit: ['Medicina'] },
  'Inventor': { skills: { 'Mecânica': 1 }, ignoreLimit: ['Mecânica'] },
  'Capitão': { skills: { 'Carisma': 1, 'Tática': 1 }, ignoreLimit: ['Carisma', 'Tática'] },
  'Estrategista': { skills: { 'Exploração': 1, 'Tática': 1 }, ignoreLimit: ['Exploração', 'Tática'] }
};

const PROGRESSION = {
  0: ['origin', 'initial_attributes', 'initial_skills'], 1: ['class', 'ability'], 2: ['pdv', 'pde', 'ability', 'skill'],
  3: ['pdv', 'pde', 'subclass', 'attribute'], 4: ['pdv', 'pde', 'ability', 'skill', 'skill_limit'], 5: ['pdv', 'pde', 'ability_upgrade'],
  6: ['pdv', 'pde', 'ability', 'attribute'], 7: ['pdv', 'pde', 'ability', 'skill'], 8: ['pdv', 'pde', 'attribute', 'origin_ability'],
  9: ['pdv', 'pde', 'ability', 'skill', 'skill_limit'], 10: ['pdv', 'pde', 'ability_upgrade'], 11: ['pdv', 'pde', 'ability', 'attribute'],
  12: ['pdv', 'pde', 'new_ability'], 13: ['pdv', 'pde', 'ability', 'skill'], 14: ['pdv', 'pde', 'attribute'], 15: ['pdv', 'pde', 'ability_upgrade'],
  16: ['pdv', 'pde', 'skill', 'skill_limit'], 17: ['pdv', 'pde', 'ability'], 18: ['pdv', 'pde', 'ability', 'attribute'],
  19: ['pdv', 'pde', 'skill'], 20: ['pdv', 'pde', 'new_ability']
};

function getAbilityLevelForCharLevel(charLevel) {
  if (charLevel >= 15) return 4;
  if (charLevel >= 10) return 3;
  if (charLevel >= 5) return 2;
  if (charLevel >= 1) return 1;
  return 0;
}

const SUBCLASS_CATEGORY_KEY = { 'Soldado': 'soldier', 'Atirador': 'shooter', 'Médico': 'medic', 'Inventor': 'inventor', 'Capitão': 'captain', 'Estrategista': 'strategist' };

const ABILITIES_DB = [
  { id: 'nova_tentativa', name: 'Nova Tentativa', scope: 'general', subclasses: null, passive: false,
    description: 'Permite oferecer uma segunda chance a si mesmo ou a um aliado, revertendo uma rolagem falha ao permitir uma nova tentativa.',
    reminder: 'Só pode ser utilizada uma vez por sessão.',
    levels: ['Nível 1 - Permite ao personagem ou a um aliado re-rolar um dado falho em qualquer rolagem. Custo: 8 PDE e uma Ação Bônus.',
      'Nível 2 - Sem alterações.',
      'Nível 3 - Além de re-rolar o dado falho, o novo teste é realizado com vantagem. Custo: 10 PDE e uma Ação Bônus.',
      'Nível 4 - Sem alterações.'] },
  { id: 'concentracao_total', name: 'Concentração Total', scope: 'general', subclasses: null, passive: false,
    description: 'O personagem foca sua mente e corpo para maximizar seu desempenho em combate.',
    levels: ['Nível 1 - +2 em todos os Testes de Acerto por 2 rodadas. Custo: 4 PDE e uma Ação Bônus.',
      'Nível 2 - O bônus aumenta para +3, duração de 2 rodadas. Custo: 5 PDE e uma Ação Bônus.',
      'Nível 3 - Mantém +3, duração aumenta para 4 rodadas. Custo: 6 PDE e uma Ação Bônus.',
      'Nível 4 - O bônus aumenta para +4, duração de 4 rodadas. Custo: 8 PDE e uma Ação Bônus.'] },
  { id: 'esquiva_avancada', name: 'Esquiva Avançada', scope: 'general', subclasses: null, passive: false,
    description: 'Aprimora temporariamente a capacidade de esquiva do personagem.',
    reminder: 'Contra múltiplos ataques no mesmo turno, o custo é duplicado, independentemente da quantidade de ataques.',
    levels: ['Nível 1 - Vantagem no teste de esquiva. Custo: 3 PDE e uma Ação de Reação.',
      'Nível 2 - Vantagem + 2 na rolagem de esquiva. Custo: 3 PDE e uma Ação de Reação.',
      'Nível 3 - Vantagem + 3 na rolagem de esquiva. Custo: 3 PDE e uma Ação de Reação.',
      'Nível 4 - Vantagem, +3 na rolagem e adiciona o valor de Agilidade mais uma vez. Custo: 6 PDE e uma Ação de Reação.'] },
  { id: 'provocacao', name: 'Provocação', scope: 'general', subclasses: null, passive: false,
    description: 'Permite atrair um ataque inimigo para si para proteger um aliado. Só contra inimigos não controlados por jogadores; deve ser declarada antes da rolagem de acerto (após a rolagem, ainda pode ser usada, mas sem Teste de Defesa).',
    levels: ['Nível 1 - Transfere um ataque para si. Custo: 4 PDE e uma Ação de Reação.',
      'Nível 2 - Transfere o ataque e recebe +2 no Teste de Defesa. Custo: 5 PDE e uma Ação de Reação.',
      'Nível 3 - Transfere o ataque; se acertado, reduz o dano em valor igual à Fortitude. Custo: 5 PDE e uma Ação de Reação.',
      'Nível 4 - Transfere o ataque, +2 no Teste de Defesa, e reduz o dano em valor igual à Fortitude se acertado. Custo: 6 PDE e uma Ação de Reação.'] },
  { id: 'finta', name: 'Finta', scope: 'general', subclasses: null, passive: false,
    description: 'Engana o oponente com um ataque falso para abrir espaço a um golpe certeiro.',
    levels: ['Nível 1 - Teste de Agilidade (dificuldade 14); se bem-sucedido, vantagem no Teste de Acerto do ataque seguinte. Custo: 3 PDE e uma Ação Bônus.',
      'Nível 2 - Além da vantagem, +1d8 de dano adicional. Custo: 4 PDE e uma Ação Bônus.',
      'Nível 3 - O dano adicional aumenta para +1d12, mantendo a vantagem. Custo: 5 PDE e uma Ação Bônus.',
      'Nível 4 - Mantém os bônus anteriores e reduz a margem de crítico do Teste de Acerto em -2. Custo: 6 PDE e uma Ação Bônus.'] },
  { id: 'revigoracao', name: 'Revigoração', scope: 'general', subclasses: null, passive: false,
    description: 'Um breve momento de descanso em combate para restaurar PDE.',
    levels: ['Nível 1 - Recupera 2d4 + Estâmina em PDE. Custo: Um Turno Inteiro.',
      'Nível 2 - Recupera 2d6 + Estâmina em PDE. Custo: Um Turno Inteiro.',
      'Nível 3 - Recupera 3d6 + Estâmina em PDE. Custo: Um Turno Inteiro.',
      'Nível 4 - Recupera 4d6 + Estâmina em PDE. Custo: Um Turno Inteiro.'] },
  { id: 'ocultacao_treinada', name: 'Ocultação Treinada', scope: 'general', subclasses: null, passive: false,
    description: 'Torna o personagem mais furtivo em ambientes favoráveis.',
    reminder: 'Se o personagem acertar qualquer ataque, o efeito termina ao final daquele turno.',
    levels: ['Nível 1 - Em ambiente favorável, vantagem no teste de Furtividade para se esconder. Custo: 2 PDE e um Turno Inteiro.',
      'Nível 2 - Em ambiente favorável, entra automaticamente em estado furtivo por 3 rodadas, sem teste. Custo: 6 PDE e um Turno Inteiro.',
      'Nível 3 - Mesmas regras do Nível 2. Custo: 8 PDE e uma Ação Padrão.',
      'Nível 4 - A duração aumenta para 4 rodadas. Custo: 8 PDE e uma Ação Padrão.'] },
  { id: 'casca_grossa', name: 'Casca Grossa', scope: 'general', subclasses: null, passive: false,
    description: 'Concede bônus significativos na redução de dano e em bloqueios, inclusive contra Titãs.',
    levels: ['Nível 1 - Reduz o dano recebido em valor igual à Fortitude + Vitalidade. Custo: 3 PDE e uma Ação de Reação.',
      'Nível 2 - Mantém o Nível 1 e concede +2 no próximo Teste de Defesa com bloqueio. Custo: 3 PDE e uma Ação de Reação.',
      'Nível 3 - Teste de Força (dificuldade 16) para bloquear ataque de Titã; sucesso aplica o +2 do Nível 2; a redução de dano se aplica mesmo em falha. Custo: 5 PDE e uma Ação de Reação.',
      'Nível 4 - Pode bloquear ataques de Titãs sem o teste de Força, mantendo o +2 e a redução de dano. Custo: 6 PDE e uma Ação de Reação.'] },
  { id: 'golpe_de_sorte', name: 'Golpe de Sorte', scope: 'general', subclasses: null, passive: false,
    description: 'Reduz a margem de crítico do próximo teste do personagem.',
    levels: ['Nível 1 - Margem de crítico do próximo teste reduzida em -3. Custo: 3 PDE e uma Ação Bônus.',
      'Nível 2 - Redução de -4. Custo: 4 PDE e uma Ação Bônus.',
      'Nível 3 - Redução de -5. Custo: 5 PDE e uma Ação Bônus.',
      'Nível 4 - Redução de -6. Custo: 6 PDE e uma Ação Bônus.'] },
  { id: 'proficiencia_dmt', name: 'Proficiência com o DMT', scope: 'general', subclasses: null, passive: true,
    description: 'Habilidade passiva que aprimora progressivamente o uso do DMT.',
    reminder: 'Custo: 6 PDE permanentes, pagos apenas no desbloqueio.',
    levels: ['Nível 1 - Reduz o consumo de gás do DMT em 1 unidade ao usar a ação de movimento e concede +2 em Testes de Defesa com esquiva enquanto usa o DMT.',
      'Nível 2 - Mantém o Nível 1; redução de gás aumenta para 2 unidades; deslocamento com DMT +2 metros; vantagem em testes de fuga e de aumento de velocidade com o DMT.',
      'Nível 3 - Mantém os efeitos anteriores; deslocamento adicional aumenta para +4 metros; +1 em Testes de Acerto usando o DMT.',
      'Nível 4 - Mantém os efeitos anteriores; o bônus em Testes de Acerto usando o DMT passa a ser +2.'] },
  { id: 'melhoria_geral', name: 'Melhoria Geral', scope: 'general', subclasses: null, passive: true,
    description: 'Habilidade passiva e cumulativa: a cada nível, o personagem escolhe uma nova Perícia diferente para receber +1 permanente.',
    reminder: 'Não é permitido aplicar mais de um ponto em uma mesma Perícia. Se adquirida em nível superior, os bônus anteriores também são concedidos.',
    levels: ['Nível 1 - +1 permanente em uma Perícia à escolha. Custo: 2 PDE permanentes.',
      'Nível 2 - +1 permanente em outra Perícia diferente. Custo: 2 PDE permanentes.',
      'Nível 3 - +1 permanente em outra Perícia diferente. Custo: 2 PDE permanentes.',
      'Nível 4 - +1 permanente em outra Perícia diferente. Custo: 2 PDE permanentes.'],
    repeatableChoice: { type: 'skill', label: 'Escolha a Perícia que recebe +1 permanente' } },
  { id: 'instinto_sobrevivencia', name: 'Instinto de Sobrevivência', scope: 'general', subclasses: null, passive: false,
    description: 'Reflexos de preservação ativados quando a vida está baixa.',
    levels: ['Nível 1 - Com menos da metade dos PDV, vantagem em Testes de Defesa com Esquiva até o fim do próximo turno. Custo: 3 PDE e uma Ação de Reação.',
      'Nível 2 - Mantém o anterior; +3 nos próximos Testes de Acerto até o fim do próximo turno. Custo: 4 PDE e uma Ação de Reação.',
      'Nível 3 - Mantém os anteriores; o próximo ataque bem-sucedido causa +1d10 de dano extra. Custo: 4 PDE e uma Ação de Reação.',
      'Nível 4 - Mantém os anteriores; Vantagem no próximo Teste de Acerto. Custo: 5 PDE e uma Ação de Reação.'] },
  { id: 'impulso_aprimorado', name: 'Impulso Aprimorado', scope: 'general', subclasses: null, passive: false,
    description: 'Usa os propulsores do DMT para ataques mais poderosos, a um custo maior de gás.',
    reminder: 'Só pode ser usada se o personagem estiver equipado com lâminas no DMT.',
    levels: ['Nível 1 - Próximo ataque recebe +1d6 de dano adicional. Custo: 3 PDE, 4 Pontos de Gás e 4 Metros de Deslocamento.',
      'Nível 2 - Dano adicional passa a +1d8. Custo: 3 PDE, 4 Pontos de Gás e 4 Metros de Deslocamento.',
      'Nível 3 - Além do dano, vantagem no Teste de Acerto do próximo ataque. Custo: 4 PDE, 5 Pontos de Gás e 5 Metros de Deslocamento.',
      'Nível 4 - Dano adicional passa a +1d10. Custo: 4 PDE, 5 Pontos de Gás e 5 Metros de Deslocamento.'] },
  { id: 'critico_aprimorado', name: 'Crítico Aprimorado', scope: 'general', subclasses: null, passive: false,
    description: 'Permite re-rolar ou escolher diretamente efeitos de crítico positivo.',
    levels: ['Nível 1 - Pode re-rolar uma vez o dado de efeito crítico e escolher o melhor resultado. Custo: 3 PDE.',
      'Nível 2 - Sem alterações.',
      'Nível 3 - Pode escolher diretamente qualquer efeito de crítico positivo, sem rolagem. Custo: 4 PDE.',
      'Nível 4 - Sem alterações.'] },
  { id: 'segunda_chance', name: 'Segunda Chance', scope: 'general', subclasses: null, passive: false,
    description: 'Ao entrar na condição de Morrendo e falhar no teste para se estabilizar, sem ajuda de aliados, o personagem pode sair imediatamente da condição de Morrendo com 1 PDV, ficando com a condição de Ferido Permanente.',
    reminder: 'Só pode ser utilizada uma única vez na vida do personagem.',
    levels: [] },
  { id: 'reviravolta', name: 'Reviravolta', scope: 'general', subclasses: null, passive: false,
    description: 'Canaliza o dano recebido em força ofensiva para contra-atacar.',
    levels: ['Nível 1 - Se atacado na rodada anterior ou atual, +1d10 de dano no próximo ataque bem-sucedido. Custo: 5 PDE.',
      'Nível 2 - Se sofreu 15+ de dano, +2d6 de dano no próximo ataque. Custo: 5 PDE.',
      'Nível 3 - Se sofreu 20+ de dano, +3d6 de dano no próximo ataque. Custo: 6 PDE.',
      'Nível 4 - Se sofreu 30+ de dano, +3d8 de dano no próximo ataque. Custo: 6 PDE.'] },
  { id: 'explorar_ferimento', name: 'Explorar Ferimento', scope: 'general', subclasses: null, passive: false,
    description: 'Explora a perda de membros de um Titã para ataques mais letais.',
    levels: ['Nível 1 - Se o Titã tiver membro faltando, Vantagem no Teste de Acerto contra ele. Custo: 3 PDE e uma Ação Bônus.',
      'Nível 2 - Mantém a Vantagem; próximo ataque bem-sucedido causa +1d10 de dano adicional. Custo: 4 PDE e uma Ação Bônus.',
      'Nível 3 - Mantém os efeitos; dano adicional aumenta para +2d6. Custo: 5 PDE e uma Ação Bônus.',
      'Nível 4 - Mantém a Vantagem e o dano adicional; +2 no Teste de Acerto contra o Titã. Custo: 6 PDE e uma Ação Bônus.'] },
  { id: 'experiencia_campo', name: 'Experiência de Campo', scope: 'general', subclasses: null, passive: false,
    description: 'Acumula XP exclusivo com base em ataques bem-sucedidos contra Titãs; ao atingir 75 XP acumulados, esse total é adicionado à ficha e o contador zera.',
    reminder: 'Só se aplica em situações de ameaça (risco real de combate); cabe ao Narrador definir.',
    levels: ['Nível 1 - Acerto em Titã ameaçador: +10 XP na contagem; o ataque sofre -1d4 de dano. Custo: 2 PDE.',
      'Nível 2 - +15 XP na contagem; o ataque segue com -1d4 de dano. Custo: 2 PDE.',
      'Nível 3 - +20 XP na contagem; o ataque segue com -1d4 de dano. Custo: 2 PDE.',
      'Nível 4 - +25 XP na contagem; o ataque segue com -1d4 de dano. Custo: 2 PDE.'] },
  { id: 'resposta_imediata', name: 'Resposta Imediata', scope: 'general', subclasses: null, passive: false,
    description: 'Torna os contra-ataques mais eficientes.',
    levels: ['Nível 1 - Sucesso em Teste de Defesa (sem crítico positivo ou negativo) permite contra-atacar com ataque padrão da arma. Custo: 4 PDE e uma Ação de Reação.',
      'Nível 2 - Sem alterações.',
      'Nível 3 - Mesmo sem sucesso no Teste de Defesa, ainda pode contra-atacar. Custo: 4 PDE e uma Ação de Reação.',
      'Nível 4 - Sem alterações.'] },
  { id: 'sacrificio', name: 'Sacrifício', scope: 'general', subclasses: null, passive: false,
    description: 'Ao entrar na condição Morrendo, o personagem pode abdicar da própria vida para lutar com tudo por 2 rodadas antes de morrer.',
    reminder: 'A única forma de salvar quem usou esta habilidade é um médico com "Até o Último Homem" tentando Medicina dificuldade 20 (sem os bônus normais da habilidade do médico).',
    levels: ['Nível 1 - Ignora a condição Morrendo por 2 rodadas, imune a condições negativas e a dano; dobra o bônus em Testes de Acerto, +2d8 de dano, imune a falhas críticas, margem de crítico -4. Após 2 rodadas, morre. Custo: Todos os PDE restantes.',
      'Nível 2 - Mantém o Nível 1; dano extra +3d8; Vantagem em todos os Testes de Acerto durante as 2 rodadas. Custo: Todos os PDE restantes.',
      'Nível 3 - Mantém o Nível 2; dano extra +3d12; margem de crítico -6. Custo: Todos os PDE restantes.',
      'Nível 4 - Mantém tudo; recebe Dupla Vantagem em todos os Testes de Acerto nos últimos 2 turnos de vida. Custo: Todos os PDE restantes.'] },

  { id: 'investida_relampago', name: 'Investida Relâmpago', scope: 'exclusive', subclasses: ['Soldado'], passive: false,
    description: 'Canaliza a agilidade do personagem em uma ofensiva veloz e precisa.',
    reminder: 'Só pode ser usada se o personagem estiver usando Agilidade para o bônus no teste de Luta do ataque realizado no mesmo turno.',
    levels: ['Nível 1 - Aproxima-se de um alvo a até 20m e ataca com lâminas, dano -1d8 mas +5 no Teste de Acerto. Custo: 4 PDE e um Turno inteiro.',
      'Nível 2 - Alcance aumenta para 25m; vantagem no próximo Teste de Defesa com esquiva. Custo: 5 PDE e um Turno inteiro.',
      'Nível 3 - Mantém os bônus, sem a redução de dano. Custo: 5 PDE e um Turno inteiro.',
      'Nível 4 - Adiciona o valor de Agilidade x2 no dano do ataque. Custo: 7 PDE e um Turno inteiro.'] },
  { id: 'ataques_em_serie', name: 'Ataques em Série', scope: 'exclusive', subclasses: ['Soldado'], passive: false,
    description: 'Permite atacar o mesmo alvo mais de uma vez em um único turno.',
    levels: ['Nível 1 - 2 ataques contra o mesmo alvo, ambos com desvantagem; o conjunto de lâminas se quebra. Custo: 8 PDE, uma Ação Padrão.',
      'Nível 2 - -6 nos Testes de Acerto de ambos os ataques (em vez de desvantagem); lâminas se quebram. Custo: 10 PDE, uma Ação Padrão.',
      'Nível 3 - Penalidade reduzida para -5. Custo: 10 PDE, uma Ação Padrão.',
      'Nível 4 - Penalidade reduzida para -4. Custo: 10 PDE, uma Ação Padrão.'] },
  { id: 'ataque_giratorio', name: 'Ataque Giratório', scope: 'exclusive', subclasses: ['Soldado'], passive: false,
    description: 'Manobras com o DMT para atacar múltiplos pontos de um Titã.',
    reminder: 'Se o personagem for da origem Ackerman, cada ataque causa +1d8 de dano adicional.',
    levels: ['Nível 1 - Não é possível utilizar essa habilidade.',
      'Nível 2 - Ataca duas partes diferentes do Titã, um Teste de Acerto para cada, com uma única Ação Padrão; lâminas se quebram. Custo: 8 PDE e uma Ação Padrão.',
      'Nível 3 - Até três partes diferentes. Custo: 9 PDE e uma Ação Padrão.',
      'Nível 4 - Todas as partes do Titã; lâminas só quebram ao final da ação. Custo: 12 PDE e uma Ação Padrão.'] },
  { id: 'eficiencia_letal', name: 'Eficiência Letal', scope: 'exclusive', subclasses: ['Soldado'], passive: false,
    description: 'Técnicas para poupar lâminas e otimizar o uso do DMT.',
    levels: ['Nível 1 - Em ataques que não quebrem lâminas automaticamente, o par não é consumido. Custo: 2 PDE.',
      'Nível 2 - Mantém o Nível 1; +1d6 de dano adicional. Custo: 2 PDE.',
      'Nível 3 - Mantém os anteriores; gasto de gás reduzido em -1 unidade para esse ataque. Custo: 3 PDE.',
      'Nível 4 - Dano adicional passa a +1d10. Custo: 4 PDE.'] },
  { id: 'forca_bruta', name: 'Força Bruta', scope: 'exclusive', subclasses: ['Soldado'], passive: false,
    description: 'Abre mão da durabilidade das lâminas por um golpe brutal.',
    levels: ['Nível 1 - Teste de Força (dificuldade 14); sucesso aumenta o dano em Força x2; lâminas quebram após o golpe. Custo: 4 PDE e uma Ação Bônus.',
      'Nível 2 - Se acertar, alvo sofre -2 no próximo Teste de Acerto; dificuldade do teste de Força sobe para 15. Custo: 5 PDE e uma Ação Bônus.',
      'Nível 3 - Dano adicional passa a Força x3; dificuldade sobe para 16. Custo: 7 PDE e uma Ação Bônus.',
      'Nível 4 - Penalidade no próximo Teste de Acerto do alvo aumenta para -4. Custo: 8 PDE e uma Ação Bônus.'] },

  { id: 'olhos_de_aguia', name: 'Olhos de Águia', scope: 'exclusive', subclasses: ['Atirador'], passive: false,
    description: 'Foco extremo para identificar pontos fracos do alvo.',
    levels: ['Nível 1 - Teste de Exploração (dif. 16); sucesso: +1d10 de dano no próximo ataque; falha: +1d6. Custo: 4 PDE e uma Ação Bônus.',
      'Nível 2 - Dif. 16; sucesso: +2d8 de dano; falha: +1d10. Custo: 5 PDE e uma Ação Bônus.',
      'Nível 3 - Dif. 18; sucesso: +2d10 de dano; falha: +1d12. Custo: 6 PDE e uma Ação Bônus.',
      'Nível 4 - Dif. 18; sucesso: +2d12 de dano; falha: +2d8. Custo: 7 PDE e uma Ação Bônus.'] },
  { id: 'concentracao_mira', name: 'Concentração de Mira', scope: 'exclusive', subclasses: ['Atirador'], passive: false,
    description: 'Mira cuidadosa que garante maior precisão no próximo disparo.',
    levels: ['Nível 1 - Vantagem no Teste de Acerto do próximo ataque no turno seguinte. Custo: 2 PDE e um Turno Inteiro.',
      'Nível 2 - Além da vantagem, -3 na margem de crítico do próximo ataque. Custo: 5 PDE e um Turno Inteiro.',
      'Nível 3 - Mantém os anteriores; +3 no Teste de Acerto do próximo ataque. Custo: 5 PDE e um Turno Inteiro.',
      'Nível 4 - Margem de crítico reduzida em -5. Custo: 7 PDE e um Turno Inteiro.'] },
  { id: 'tiro_de_raspao', name: 'Tiro de Raspão', scope: 'exclusive', subclasses: ['Atirador'], passive: false,
    description: 'Transforma um disparo falho em um acerto parcial.',
    levels: ['Nível 1 - Ao falhar um disparo com arma de fogo, ainda acerta parcialmente, causando 1d8 de dano. Custo: 3 PDE.',
      'Nível 2 - Dano aumenta para 1d10. Custo: 4 PDE.',
      'Nível 3 - Adiciona o valor da perícia Pontaria ao dano do tiro de raspão. Custo: 5 PDE.',
      'Nível 4 - Dano base aumenta para 1d12. Custo: 6 PDE.'] },
  { id: 'tiro_de_auxilio', name: 'Tiro de Auxílio', scope: 'exclusive', subclasses: ['Atirador'], passive: false,
    description: 'Disparos rápidos e estratégicos fora do próprio turno.',
    levels: ['Nível 1 - Disparo como Ação de Reação, 1d8 de dano; se acertar, alvo sofre -2 no próximo Teste de Defesa. Custo: 4 PDE e uma Ação de Reação.',
      'Nível 2 - Penalidade no Teste de Defesa aumenta para -3. Custo: 4 PDE e uma Ação de Reação.',
      'Nível 3 - Próximo Teste de Acerto contra o alvo reduz a margem de crítico em -2. Custo: 5 PDE e uma Ação de Reação.',
      'Nível 4 - Dano base do disparo aumenta para 1d12. Custo: 5 PDE e uma Ação de Reação.'] },

  { id: 'ataque_fatal', name: 'Ataque Fatal', scope: 'exclusive', subclasses: ['Soldado', 'Atirador'], passive: false,
    description: 'Extrai o máximo potencial dos ataques.',
    levels: ['Nível 1 - Pode maximizar um dado de dano e rolar os demais normalmente. Custo: 2 PDE.',
      'Nível 2 - Em vez de maximizar, Vantagem na rolagem de dano (rola dois valores, escolhe o maior). Custo: 4 PDE.',
      'Nível 3 - Combina os efeitos: maximiza o primeiro dado e rola os demais com Vantagem. Custo: 6 PDE.',
      'Nível 4 - Mantém um dado maximizado e recebe dupla Vantagem na rolagem de dano (rola três, usa o maior). Custo: 8 PDE.'] },
  { id: 'ataques_multiplos', name: 'Ataques Múltiplos', scope: 'exclusive', subclasses: ['Soldado', 'Atirador'], passive: false,
    description: 'Permite atingir mais de um inimigo em um único turno.',
    levels: ['Nível 1 - 2 alvos, dano de cada ataque reduzido pela metade e -2 nos Testes de Acerto. Custo: 5 PDE e uma Ação Padrão.',
      'Nível 2 - Remove o -2 nos Testes de Acerto. Custo: 5 PDE e uma Ação Padrão.',
      'Nível 3 - Até 3 alvos, dano pela metade. Custo: 6 PDE, uma Ação Padrão.',
      'Nível 4 - Os ataques passam a causar o dano total. Custo: 9 PDE, uma Ação Padrão e uma Ação Bônus.'] },
  { id: 'tamanho_nao_e_documento', name: 'Tamanho Não é Documento', scope: 'exclusive', subclasses: ['Soldado', 'Atirador'], passive: false,
    description: 'Dano adicional contra Titãs de acordo com a altura.',
    levels: ['Nível 1 - +8m: +1d6; +12m: +1d8; +15m: +1d10 de dano. Custo: 5 PDE.',
      'Nível 2 - +8m: +1d8; +12m: +1d10; +15m: +1d12. Custo: 6 PDE.',
      'Nível 3 - +8m: +1d10; +12m: +1d12; +15m: +2d8. Custo: 7 PDE.',
      'Nível 4 - +8m: +1d12; +12m: +2d8; +15m: +2d10. Custo: 8 PDE.'] },
  { id: 'sob_pressao', name: 'Sob Pressão', scope: 'exclusive', subclasses: ['Soldado', 'Atirador'], passive: false,
    description: 'Transforma desvantagem numérica em vantagem tática quando há mais inimigos do que aliados na iniciativa.',
    levels: ['Nível 1 - Margem de crítico dos Testes de Acerto reduzida em -1. Custo: 2 PDE por turno ativo.',
      'Nível 2 - Mantém o Nível 1; +1d6 de dano adicional. Custo: 2 PDE por turno ativo.',
      'Nível 3 - Mantém os anteriores; +2 nos Testes de Acerto. Custo: 2 PDE por turno ativo.',
      'Nível 4 - Dano adicional aumenta para +1d8. Custo: 2 PDE por turno ativo.'] },
  { id: 'sede_de_sangue', name: 'Sede de Sangue', scope: 'exclusive', subclasses: ['Soldado', 'Atirador'], passive: false,
    description: 'Acumula bônus em "stacks" conforme o personagem acerta ataques em combate.',
    reminder: 'Se passar uma rodada inteira sem acertar nenhum ataque, os stacks acumulados zeram.',
    levels: ['Nível 1 - Cada acerto concede +1 cumulativo em todos os próximos Testes de Acerto enquanto ativa. Custo: 3 PDE por turno ativo.',
      'Nível 2 - Cada acerto concede +1 no Teste de Acerto e +1 de dano, cumulativos. Custo: 4 PDE por turno ativo.',
      'Nível 3 - Cada acerto concede +1 no Teste de Acerto e +2 de dano, cumulativos. Custo: 4 PDE por turno ativo.',
      'Nível 4 - Cada acerto concede +1 no Teste de Acerto e +1d4 de dano, cumulativos. Custo: 5 PDE por turno ativo.'] },

  { id: 'apoiar', name: 'Apoiar', scope: 'exclusive', subclasses: ['Médico'], passive: false,
    description: 'Orienta aliados no calor da batalha, mesmo fora do próprio turno.',
    levels: ['Nível 1 - Um aliado recebe +3 no próximo teste que realizar. Custo: 2 PDE e uma Ação de Reação.',
      'Nível 2 - O aliado recebe Vantagem no próximo teste, em vez de bônus fixo. Custo: 4 PDE e uma Ação de Reação.',
      'Nível 3 - Vantagem + valor da perícia Medicina do médico como bônus adicional. Custo: 5 PDE e uma Ação de Reação.',
      'Nível 4 - O aliado recebe Dupla Vantagem no próximo teste. Custo: 6 PDE e uma Ação de Reação.'] },
  { id: 'apoio_medicinal', name: 'Apoio Medicinal', scope: 'exclusive', subclasses: ['Médico'], passive: false,
    description: 'Curativos que concedem bônus úteis a quem é tratado.',
    levels: ['Nível 1 - Após curar qualquer PDV, o aliado recebe +2 no próximo Teste de Acerto. Custo: 1 PDE.',
      'Nível 2 - Bônus aumenta para +4. Custo: 2 PDE.',
      'Nível 3 - O aliado curado recebe +2 em todos os Testes de Acerto ou danos naquele combate (não cumulativo). Custo: 5 PDE.',
      'Nível 4 - O bônus aumenta para +3. Custo: 6 PDE.'] },
  { id: 'medicina_avancada', name: 'Medicina Avançada', scope: 'exclusive', subclasses: ['Médico'], passive: false,
    description: 'Amplia a recuperação física e energética de qualquer forma de tratamento.',
    levels: ['Nível 1 - +1d8 aos PDV restaurados por qualquer método de cura. Custo: 2 PDE.',
      'Nível 2 - Além do bônus de cura, o aliado recupera +1d4 PDE. Custo: 3 PDE.',
      'Nível 3 - Bônus de cura aumenta para +1d10; recuperação de PDE para +1d6. Custo: 4 PDE.',
      'Nível 4 - Bônus de cura aumenta para +1d12; recuperação de PDE para +1d8. Custo: 5 PDE.'] },
  { id: 'auxilio_duplo', name: 'Auxílio Duplo', scope: 'exclusive', subclasses: ['Médico'], passive: false,
    description: 'Após curar um aliado, ativa efeitos ofensivos no próximo ataque do médico.',
    levels: ['Nível 1 - Ao curar, se o próximo Teste de Acerto for bem-sucedido, +1d8 de dano adicional. Custo: 3 PDE.',
      'Nível 2 - Mantém o dano; +2 no próximo Teste de Acerto. Custo: 4 PDE.',
      'Nível 3 - O +2 é substituído por Vantagem no próximo Teste de Acerto. Custo: 6 PDE.',
      'Nível 4 - Mantém a Vantagem; dano adicional aumenta para +2d6. Custo: 6 PDE.'] },
  { id: 'ate_o_ultimo_homem', name: 'Até o Último Homem', scope: 'exclusive', subclasses: ['Médico'], passive: false,
    description: 'Amplia a chance de reverter a condição de Morrendo (e, em níveis altos, Enlouquecendo) de aliados.',
    levels: ['Nível 1 - Ao curar aliado com menos da metade dos PDV, adiciona +1d8 ao resultado da cura. Custo: 2 PDE e uma Ação Bônus.',
      'Nível 2 - Se um aliado estiver Morrendo, a dificuldade do teste para retirá-lo dessa condição é reduzida em -3. Custo: 4 PDE e uma Ação Bônus.',
      'Nível 3 - Mantém o Nível 2; Vantagem no teste para tirar um aliado da condição Morrendo. Custo: 6 PDE e uma Ação Bônus.',
      'Nível 4 - Pode também tentar retirar um aliado da condição Enlouquecendo, com os mesmos bônus. Custo: 6 PDE e uma Ação Bônus.'] },
  { id: 'ultimo_a_cair', name: 'Último a Cair', scope: 'exclusive', subclasses: ['Médico'], passive: false,
    description: 'Ativada quando um companheiro entra em Morrendo ou morre em combate, concedendo bônus até o fim do confronto.',
    levels: ['Nível 1 - Não é possível utilizar essa habilidade.',
      'Nível 2 - Se um companheiro entrou em Morrendo ou morreu no combate atual, todos os Testes de Acerto e Defesa do personagem recebem Vantagem durante o combate. Custo: 6 PDE e uma Ação Bônus para ativar.',
      'Nível 3 - Mantém o Nível 2; todos os ataques causam +1d10 de dano adicional durante o combate. Custo: 7 PDE e uma Ação Bônus para ativar.',
      'Nível 4 - Mantém os anteriores; margem de crítico de todos os Testes de Acerto reduzida em -3 durante o combate. Custo: 8 PDE e uma Ação Bônus para ativar.'] },

  { id: 'aumento_de_carga', name: 'Aumento de Carga', scope: 'exclusive', subclasses: ['Inventor'], passive: true,
    description: 'Expande permanentemente o espaço disponível no inventário.',
    reminder: 'Custo: 4 PDE permanentes, pagos apenas no desbloqueio.',
    levels: ['Nível 1 - +3 Espaços adicionais no inventário.',
      'Nível 2 - +4 Espaços adicionais no inventário.',
      'Nível 3 - +5 Espaços adicionais no inventário.',
      'Nível 4 - +6 Espaços adicionais no inventário.'] },
  { id: 'projeto_proprio', name: 'Projeto Próprio', scope: 'exclusive', subclasses: ['Inventor'], passive: false,
    description: 'Permite desenvolver, em conjunto com o narrador, o projeto de uma invenção exclusiva — total ou parcialmente construída, dependendo da fase da aventura. Substitui a aquisição de uma nova habilidade.',
    reminder: 'Não pode ser escolhida mais de uma vez.',
    levels: [] },
  { id: 'maos_de_ouro', name: 'Mãos de Ouro', scope: 'exclusive', subclasses: ['Inventor'], passive: false,
    description: 'Equipamentos que receberam influência do inventor recebem bônus específicos.',
    reminder: 'Os bônus da influência se esvaem ao fim da sessão; é preciso gastar o PDE novamente numa "revisão".',
    levels: ['Nível 1 - Equipamento com dano recebe +1d4 de dano. Custo: 3 PDE por equipamento.',
      'Nível 2 - Equipamento que exija teste (ex.: Teste de Acerto) recebe +1 nesse teste. Custo: 3 PDE por equipamento.',
      'Nível 3 - Se o equipamento tem teste de dificuldade para ser repelido (ex.: armadilha), a dificuldade aumenta em +2. Custo: 3 PDE por equipamento.',
      'Nível 4 - Escolhe um dos bônus anteriores, potencializado: dano +1d6, ou teste +2, ou dificuldade de ser repelido +2. Custo: 4 PDE por equipamento.'] },
  { id: 'obra_prima', name: 'Obra Prima', scope: 'exclusive', subclasses: ['Inventor'], passive: false,
    description: 'As invenções do personagem recebem bônus adicionais permanentes.',
    reminder: 'O PDE é pago apenas na criação/produção; o número de invenções aprimoráveis é limitado pelos PDE disponíveis na fabricação.',
    levels: ['Nível 1 - A invenção recebe +1 em Testes de Acerto durante o uso. Custo: 8 PDE por invenção.',
      'Nível 2 - Danos causados pela invenção aumentam em +1d4. Custo: 8 PDE por invenção.',
      'Nível 3 - A invenção recebe +2 em Testes de Acerto durante o uso. Custo: 9 PDE por invenção.',
      'Nível 4 - Combina +2 em Testes de Acerto e +1d4 de dano. Custo: 10 PDE por invenção.'] },
  { id: 'mestre_do_improviso', name: 'Mestre do Improviso', scope: 'exclusive', subclasses: ['Inventor'], passive: true,
    description: 'Permite transformar sucata em invenções úteis ou aprimoramentos, com aprovação do mestre, respeitando os limites da realidade e do bom senso.',
    reminder: 'Custo: 6 PDE permanentes.',
    levels: [] },
  { id: 'engenharia_especializada', name: 'Engenharia Especializada', scope: 'exclusive', subclasses: ['Inventor'], passive: false,
    description: 'Especialização em Equipamentos de Batalha (como o DMT) ou Equipamentos Fixos (como canhões e armadilhas), escolhida na aquisição.',
    reminder: 'Os bônus se esvaem ao fim da sessão; é preciso realizar uma "revisão" gastando PDE novamente.',
    levels: ['Nível 1 - Equip. de Batalha: +1 em Testes de Acerto. Equip. Fixos: +1 em qualquer teste de uso. Custo: 4 PDE por equipamento.',
      'Nível 2 - Equip. de Batalha: também +1d4 de dano. Equip. Fixos: alvo recebe -3 no próximo Teste de Acerto. Custo: 4 PDE por equipamento.',
      'Nível 3 - Equip. de Batalha: dano adicional passa a +1d6. Equip. Fixos: bônus em testes de uso passa a +2. Custo: 4 PDE por equipamento.',
      'Nível 4 - Ambos: margem de crítico reduzida em -1 em testes relacionados ao equipamento. Custo: 6 PDE por equipamento.'],
    requiresChoice: { type: 'select', label: 'Escolha a especialização', options: ['Equipamentos de Batalha', 'Equipamentos Fixos'] } },

  { id: 'golpe_baixo', name: 'Golpe Baixo', scope: 'exclusive', subclasses: ['Médico', 'Inventor'], passive: false,
    description: 'Ataca outras partes do corpo do Titã com maior eficácia, quando a nuca não é possível.',
    levels: ['Nível 1 - Ao atacar parte que não a nuca, +1d6 de dano e +2 no Teste de Acerto. Custo: 4 PDE e uma Ação Bônus.',
      'Nível 2 - Dano adicional +1d8; bônus no Teste de Acerto +3. Custo: 4 PDE e uma Ação Bônus.',
      'Nível 3 - Dano +1d10; Vantagem no Teste de Acerto em vez de bônus fixo. Custo: 5 PDE e uma Ação Bônus.',
      'Nível 4 - Dano +1d12; mantém Vantagem e ainda +2 adicionais no teste. Custo: 5 PDE e uma Ação Bônus.'] },
  { id: 'imobilizar', name: 'Imobilizar', scope: 'exclusive', subclasses: ['Médico', 'Inventor'], passive: false,
    description: 'Imobiliza um alvo, deixando-o indefeso por um curto período.',
    levels: ['Nível 1 - Não é possível utilizar essa habilidade.',
      'Nível 2 - Não é possível utilizar essa habilidade.',
      'Nível 3 - Teste de Acerto com Agilidade; sucesso imobiliza o alvo (condição Vulnerável até seu próximo turno, sem esquivas); perde o turno seguinte tentando se soltar. Custo: 8 PDE, uma Ação Padrão e uma Ação Bônus.',
      'Nível 4 - Para se libertar, o alvo faz Teste de Força -2 contra Teste Oposto de Força +2 do usuário; sucesso libera mas perde o turno; falha mantém Vulnerável por mais um turno. Custo: 10 PDE, uma Ação Padrão e uma Ação Bônus.'],
    reminder: 'Quem usa a habilidade também gasta o próximo turno mantendo a imobilização, se passar no teste de Força.' },
  { id: 'ataque_atordoante', name: 'Ataque Atordoante', scope: 'exclusive', subclasses: ['Médico', 'Inventor'], passive: false,
    description: 'Ataques bem-sucedidos comprometem a precisão do alvo por um período.',
    levels: ['Nível 1 - O próximo ataque acertado impõe -2 em todos os Testes de Acerto do alvo por 2 turnos. Custo: 2 PDE e uma Ação Bônus.',
      'Nível 2 - Penalidade aumenta para -3, por 3 turnos. Custo: 3 PDE e uma Ação Bônus.',
      'Nível 3 - Em vez de redutor fixo, o alvo sofre desvantagem em todos os Testes de Acerto por 2 turnos. Custo: 6 PDE e uma Ação Bônus.',
      'Nível 4 - Desvantagem + -2 adicional em cada rolagem, por 3 turnos. Custo: 6 PDE e uma Ação Bônus.'] },

  { id: 'coracao_valente', name: 'Coração Valente', scope: 'exclusive', subclasses: ['Capitão'], passive: false,
    description: 'Motiva aliados através de discursos e ações marcantes.',
    reminder: 'O Nível 4 é limitado a uma vez por sessão.',
    levels: ['Nível 1 - Discurso impactante + teste de Carisma (dif. 16); sucesso concede +1 em Testes de Acerto aos aliados inspirados até o fim da sessão. Custo: 6 PDE e uma Ação Bônus.',
      'Nível 2 - Mantém o Nível 1; aliados inspirados também recebem +2 em testes de Vontade na sessão. Custo: 6 PDE e uma Ação Bônus.',
      'Nível 3 - Aliados inspirados recebem +2 em Testes de Defesa (bloqueio ou esquiva); dificuldade do teste de Carisma sobe para 18. Custo: 7 PDE e uma Ação Bônus.',
      'Nível 4 - Cada aliado afetado faz teste de Vontade (dif. 14); sucesso recupera 1 ponto de Sanidade. Custo: 8 PDE e uma Ação Bônus.'] },
  { id: 'ordem_imediata', name: 'Ordem Imediata', scope: 'exclusive', subclasses: ['Capitão'], passive: false,
    description: 'Fornece ações extras a aliados no momento certo.',
    levels: ['Nível 1 - Concede uma Ação de Reação adicional a um aliado, na mesma rodada. Custo: 4 PDE e uma Ação de Reação.',
      'Nível 2 - Concede uma Ação Padrão a um aliado, usada imediatamente. Custo: 9 PDE e uma Ação de Reação.',
      'Nível 3 - O aliado adiciona metade da perícia Carisma do Capitão (arredondado para baixo) nos Testes de Acerto daquela ação. Custo: 10 PDE e uma Ação de Reação.',
      'Nível 4 - Pode conceder Ação Padrão ou de Reação a dois aliados, cada um recebendo o bônus de Carisma nos Testes de Acerto. Custo: 14 PDE e uma Ação de Reação.'] },
  { id: 'veterano_de_guerra', name: 'Veterano de Guerra', scope: 'exclusive', subclasses: ['Capitão'], passive: true,
    description: 'Cicatrizes de batalha que forjaram resistência física e mental.',
    reminder: 'Custo: 6 PDE permanentes, pagos apenas no desbloqueio.',
    levels: ['Nível 1 - Não é possível utilizar essa habilidade.',
      'Nível 2 - Não é possível utilizar essa habilidade.',
      'Nível 3 - Resistência a dano físico igual à Fortitude (subtraída de todo dano em PDV); dano de Sanidade reduzido em 1.',
      'Nível 4 - Resistência a dano em PDV passa a Fortitude + Vontade; dano de Sanidade reduzido em 2.'] },
  { id: 'de_pe_soldado', name: 'DE PÉ, SOLDADO!', scope: 'exclusive', subclasses: ['Capitão'], passive: false,
    description: 'Libera companheiros de condições debilitantes, ao custo da própria energia.',
    levels: ['Nível 1 - Não é possível utilizar essa habilidade.',
      'Nível 2 - Após um RP inspirador, um aliado ignora uma condição negativa à escolha do Capitão pelo resto do combate; ao encerrar, a condição retorna e testes posteriores para removê-la sofrem -4. Custo: 8 PDE e um Turno Completo.',
      'Nível 3 - Afeta todos os aliados em combate, cada um ignorando uma condição à escolha do Capitão. Custo: 10 PDE e um Turno Completo.',
      'Nível 4 - A penalidade nos testes pós-combate para remover as condições que retornaram cai para -2. Custo: 10 PDE e um Turno Completo.'] },

  { id: 'abrir_brechas', name: 'Abrir Brechas', scope: 'exclusive', subclasses: ['Estrategista'], passive: false,
    description: 'Localiza brechas e movimentos do inimigo, concedendo bônus de dano.',
    levels: ['Nível 1 - Teste de Exploração (dif. 14); sucesso: o personagem e aliados recebem +1d12 de dano adicional até o início do próximo turno do estrategista. Custo: 5 PDE e uma Ação Bônus.',
      'Nível 2 - Dificuldade 16; dano adicional 2d8. Custo: 6 PDE e uma Ação Bônus.',
      'Nível 3 - Dificuldade 18; dano adicional 2d12. Custo: 7 PDE e uma Ação Bônus.',
      'Nível 4 - Dificuldade 20; dano adicional 3d10. Custo: 8 PDE e uma Ação Bônus.'] },
  { id: 'coordenacao', name: 'Coordenação', scope: 'exclusive', subclasses: ['Estrategista'], passive: false,
    description: 'Reorganiza a ordem de iniciativa do combate livremente.',
    reminder: 'Se dois personagens tentarem usar esta habilidade no mesmo combate, ocorre um teste oposto de Tática vs Tática; quem vencer define a nova ordem.',
    levels: [], baseCost: 'Custo: 6 PDE.' },
  { id: 'analise_precisa', name: 'Análise Precisa', scope: 'exclusive', subclasses: ['Estrategista'], passive: false,
    description: 'Avalia o nível de ameaça e as limitações do inimigo enfrentado.',
    levels: ['Nível 1 - Teste de Tática vs Furtividade do alvo; sucesso revela o valor de dois atributos, à escolha do jogador. Custo: 4 PDE e uma Ação Bônus.',
      'Nível 2 - Sucesso revela os valores de todos os atributos do inimigo. Custo: 5 PDE e uma Ação Bônus.',
      'Nível 3 - Sucesso revela os PDV máximos do inimigo. Custo: 6 PDE e uma Ação Bônus.',
      'Nível 4 - Vantagem na rolagem; sucesso permite escolher entre revelar todos os atributos ou os PDV máximos. Custo: 6 PDE e uma Ação Bônus.'] },
  { id: 'planejamento', name: 'Planejamento', scope: 'exclusive', subclasses: ['Estrategista'], passive: false,
    description: 'Traça uma estratégia antes da batalha, recompensando aliados que a seguirem.',
    levels: ['Nível 1 - Aliados que seguirem o plano recebem +1d4 de dano adicional durante o combate. Custo: 4 PDE e uma Ação Bônus.',
      'Nível 2 - Também recebem +1 nos Testes de Acerto durante todo o combate. Custo: 5 PDE e uma Ação Bônus.',
      'Nível 3 - Também reduzem a margem de crítico em -1 nos Testes de Acerto. Custo: 6 PDE e uma Ação Bônus.',
      'Nível 4 - O dano bônus aumenta para +1d6. Custo: 6 PDE e uma Ação Bônus.'] },

  { id: 'ataque_coordenado', name: 'Ataque Coordenado', scope: 'exclusive', subclasses: ['Capitão', 'Estrategista'], passive: false,
    description: 'Lidera ações conjuntas entre aliados para ataques mais precisos e letais.',
    levels: ['Nível 1 - Dois aliados realizam um ataque padrão simultâneo; nenhum pode usar a Ação Bônus no próximo turno. Custo: 6 PDE e um Turno Inteiro.',
      'Nível 2 - O provedor também participa (três no total); só ele mantém a Ação Bônus. Custo: 8 PDE e um Turno Inteiro.',
      'Nível 3 - Pode escolher três aliados, incluindo ele mesmo. Custo: 8 PDE e um Turno Inteiro.',
      'Nível 4 - Todos os ataques do grupo recebem o valor da perícia Tática do provedor como bônus de dano. Custo: 9 PDE e um Turno Inteiro.'] },
  { id: 'senso_de_batalha', name: 'Senso de Batalha', scope: 'exclusive', subclasses: ['Capitão', 'Estrategista'], passive: false,
    description: 'Permite agir antes mesmo do teste de iniciativa.',
    reminder: 'Se mais de um personagem usar a habilidade, todos fazem um teste de Tática para definir a ordem dos turnos extras.',
    levels: ['Nível 1 - Realiza um turno completo antes da iniciativa, mas fica em último lugar na ordem. Custo: 6 PDE.',
      'Nível 2 - Testes de perícia no turno adicional recebem +1. Custo: 6 PDE.',
      'Nível 3 - O personagem faz o teste normalmente para sua posição na iniciativa. Custo: 7 PDE.',
      'Nível 4 - Testes de perícia no turno adicional recebem +2. Custo: 7 PDE.'] },
  { id: 'instinto_aguçado', name: 'Instinto Aguçado', scope: 'exclusive', subclasses: ['Capitão', 'Estrategista'], passive: false,
    description: 'Analisa rapidamente o terreno e identifica inimigos ocultos.',
    levels: ['Nível 1 - Vantagem em teste de Exploração vs Furtividade contra criaturas escondidas em até 100m; sucesso localiza os alvos. Custo: 2 PDE e uma Ação Bônus.',
      'Nível 2 - Também recebe +2 no teste de Exploração. Custo: 3 PDE e uma Ação Bônus.',
      'Nível 3 - Em Planície, Planície Arborizada, Bosque ou Distrito Pouco Povoado, detecta automaticamente inimigos ocultos em 100m, sem teste. Custo: 5 PDE e uma Ação Bônus.',
      'Nível 4 - Detecta automaticamente inimigos ocultos em 100m em qualquer ambiente. Custo: 6 PDE e uma Ação Bônus.'] },
];

function findAbility(id) { return ABILITIES_DB.find(a => a.id === id); }

const SKILL_LIST = [
  { name: 'Carisma', attr: 'int' }, { name: 'Crime', attr: 'int' }, { name: 'Exploração', attr: 'int' }, { name: 'Fortitude', attr: 'vit' },
  { name: 'Furtividade', attr: 'agi' }, { name: 'História', attr: 'int' }, { name: 'Intimidação', attr: 'int' }, { name: 'Luta', attr: 'str' },
  { name: 'Mecânica', attr: 'int' }, { name: 'Medicina', attr: 'int' }, { name: 'Natureza', attr: 'int' }, { name: 'Pontaria', attr: 'agi' },
  { name: 'Tática', attr: 'int' }, { name: 'Vontade', attr: 'int' },
];

/* ============================================================
   DADOS — TALENTOS E DEFEITOS
   ============================================================ */
const TALENTS_DB = [
  { id:'reflexos_acucados', name:'Reflexos Aguçados', cost:-4, category:'talent', description:'Adicione +1 nos Testes de Defesa com esquiva do personagem.', automatic:[{type:'derived', target:'defesaEsquiva', value:1}] },
  { id:'cacador', name:'Caçador', cost:-4, category:'talent', description:'Sempre que estiver em uma floresta, adicione +1 nos Testes de Acerto em ataques à longa distância.', automatic:[], contextual:true },
  { id:'robusto', name:'Robusto', cost:-6, category:'talent', description:'O personagem recebe +1 no atributo de Força do personagem.', automatic:[{type:'attribute', target:'str', value:1}] },
  { id:'sortudo', name:'Sortudo', cost:-8, category:'talent', description:'A margem de crítico do personagem é diminuída em -1.', automatic:[{type:'derived', target:'critMargin', value:-1}] },
  { id:'perito', name:'Perito', cost:-4, category:'talent', description:'O personagem recebe +1 ponto de perícia para distribuir na ficha do personagem.', automatic:[], requiresChoice:{type:'skill', label:'Escolha a perícia que recebe o ponto extra'}, choiceEffect:{type:'skill', value:1, ignoresCap:true} },
  { id:'sangue_frio', name:'Sangue Frio', cost:-4, category:'talent', description:'Sempre que o personagem receber um dano de sanidade, esse dano será reduzido em -1.', automatic:[{type:'derived', target:'sanDamageReduction', value:1}] },
  { id:'visao_acucada', name:'Visão Aguçada', cost:-2, category:'talent', description:'Testes de exploração relacionados à visão recebem +1 em seu bônus.', automatic:[{type:'skill', target:'Exploração', value:1}] },
  { id:'empatia_animal', name:'Empatia Animal', cost:-2, category:'talent', description:'Todo e qualquer teste relacionado a domesticação/guia de um animal recebe +3 em sua rolagem.', automatic:[{type:'skill', target:'Natureza', value:3}] },
  { id:'manipulador', name:'Manipulador', cost:-2, category:'talent', description:'Sempre que um teste de Carisma estiver relacionado a mudar um ideal ou pensamento de alguém, o personagem recebe +2 na rolagem.', automatic:[{type:'skill', target:'Carisma', value:2}] },
  { id:'resistencia_natural', name:'Resistência Natural', cost:-4, category:'talent', description:'O personagem reduz em 1d4 qualquer dano recebido diretamente em seu corpo.', automatic:[{type:'derived', target:'bodyDamageReduction', value:1}] },
  { id:'bom_apetite', name:'Bom Apetite', cost:-2, category:'talent', description:'O personagem é apaixonado por comida. Sempre que fizer uma boa refeição durante um Descanso Longo, recebe +2 em todos os Testes de Defesa do personagem até o fim do dia.', automatic:[], contextual:true },
  { id:'memoria_fotografica', name:'Memória Fotográfica', cost:-4, category:'talent', description:'O narrador tem o dever de fornecer todos os detalhes de uma cena que o personagem já tenha vivido, caso ele seja bem-sucedido em um teste de História com dificuldade 12.', automatic:[], contextual:true },
  { id:'guerreiro_experiente', name:'Guerreiro Experiente', cost:-2, category:'talent', description:'Pode adicionar +2 de dano em algum tipo de arma à escolha.', automatic:[], requiresChoice:{type:'text', label:'Escolha o tipo de arma que receberá +2 de dano'} },
  { id:'dom_artistico', name:'Dom Artístico', cost:-2, category:'talent', description:'O personagem possui um talento excepcional em alguma área da arte, seja música, pintura, poesia, escultura, escrita ou até culinária.', automatic:[], requiresChoice:{type:'select', label:'Escolha sua área artística', options:['Música','Pintura','Poesia','Escultura','Escrita','Culinária','Outra']} },
  { id:'contra_golpe', name:'Contra Golpe', cost:-4, category:'talent', description:'Os contra-ataques do personagem causam +1d10 de dano adicional.', automatic:[], contextual:true },
  { id:'folego_aprimorado', name:'Fôlego Aprimorado', cost:-2, category:'talent', description:'Pode segurar a respiração por longos períodos de tempo, como para ficar debaixo d\u2019água por um longo período de tempo ou para não inalar algum tipo de gás até que ele se disperse.', automatic:[], contextual:true },
  { id:'pressentimento', name:'Pressentimento', cost:-8, category:'talent', description:'Uma vez por sessão, pode pedir uma dica ao narrador sobre um perigo iminente.', automatic:[], sessionUse:{type:'max', max:1} },
  { id:'aliado_misterioso', name:'Aliado Misterioso', cost:-6, category:'talent', description:'O personagem possui um contato secreto que pode fornecer informações ou recursos. Sob critério do narrador.', automatic:[], requiresChoice:{type:'text', label:'Descreva o contato'} },
  { id:'aparencia_inofensiva', name:'Aparência Inofensiva', cost:-2, category:'talent', description:'Por possuir uma aparência não tão ameaçadora, recebe +2 em testes de Carisma contra inimigos.', automatic:[{type:'skill', target:'Carisma', value:2}] },
];

const DEFECTS_DB = [
  { id:'amedrontado', name:'Amedrontado', cost:4, category:'defect', description:'Quando os inimigos estão em maior número dentro de um combate, o personagem receberá -2 em seus Testes de Acerto.', automatic:[], contextual:true },
  { id:'barulhento', name:'Barulhento', cost:6, category:'defect', description:'O personagem tem extrema dificuldade em se manter em silêncio e agir furtivamente. Todos os seus testes de Furtividade são realizados com desvantagem.', automatic:[{type:'flag', target:'Furtividade', value:'disadvantage'}] },
  { id:'mal_encarado', name:'Mal Encarado', cost:2, category:'defect', description:'O personagem recebe -2 em testes da perícia de Carisma.', automatic:[{type:'skill', target:'Carisma', value:-2}] },
  { id:'trauma', name:'Trauma', cost:6, category:'defect', description:'Baseado no passado do personagem, o narrador cria um trauma para o personagem que estará ativo desde o início da campanha.', automatic:[], requiresChoice:{type:'text', label:'Registre o trauma'} },
  { id:'mau_nome', name:'Mau Nome', cost:2, category:'defect', description:'Seja pela sua classe social ou qualquer outro motivo, o personagem é mal visto na sociedade em que vive.', automatic:[], contextual:true },
  { id:'vicio', name:'Vício', cost:4, category:'defect', description:'O personagem é dependente de alguma substância, seja ela lícita ou ilícita. Caso não satisfaça seu vício durante toda uma sessão, sofrerá uma redução de -1 em seus Testes de Acerto. Esse penalizador é cumulativo a cada sessão consecutiva em que o vício não for saciado.', automatic:[], requiresChoice:{type:'text', label:'Registre o vício'}, sessionUse:{type:'counter'} },
  { id:'azarado', name:'Azarado', cost:6, category:'defect', description:'Uma vez por sessão, o narrador pode intervir e transformar um sucesso em um fracasso.', automatic:[], sessionUse:{type:'toggle'} },
  { id:'arrogante', name:'Arrogante', cost:4, category:'defect', description:'Sempre que o personagem estiver lutando contra alguém que possua um nível menor que o dele, receberá -2 em seus Testes de Defesa.', automatic:[], contextual:true },
  { id:'codigo_de_honra', name:'Código de Honra', cost:4, category:'defect', description:'O personagem segue um rígido código de conduta criado junto ao narrador.', automatic:[], requiresChoice:{type:'text', label:'Registre o código de honra'} },
  { id:'maos_tremulas', name:'Mãos Trêmulas', cost:4, category:'defect', description:'O personagem recebe -2 em Testes de Acerto em ataques à longa distância ou qualquer rolagem que esteja relacionada a algo que necessite de muita precisão.', automatic:[{type:'skill', target:'Pontaria', value:-2}] },
  { id:'obcecado', name:'Obcecado', cost:4, category:'defect', description:'Sempre que uma escolha desviar do objetivo principal do personagem, ele deverá realizar um teste de Vontade com dificuldade 16 para conseguir executá-la.', automatic:[], requiresChoice:{type:'text', label:'Registre o objetivo principal'} },
  { id:'fixacao_limpeza', name:'Fixação em Limpeza', cost:2, category:'defect', description:'O personagem possui uma necessidade obsessiva de manter tudo limpo. Sempre que estiver em um ambiente sujo, sofre -1 em todos os Testes de Defesa que realizar.', automatic:[], contextual:true },
  { id:'divida', name:'Dívida', cost:4, category:'defect', description:'O personagem possui uma dívida enorme com alguém que um dia irá cobrar. Essa dívida pode ser tanto de vida quanto de bens materiais, mas deve ser criada em conjunto com o narrador.', automatic:[], requiresChoice:{type:'text', label:'Registre a dívida'} },
  { id:'visao_fraca', name:'Visão Fraca', cost:4, category:'defect', description:'Testes de exploração relacionados à visão recebem -2 em seu bônus.', automatic:[{type:'skill', target:'Exploração', value:-2}] },
  { id:'ferida_antiga', name:'Ferida Antiga', cost:2, category:'defect', description:'O personagem sofre com uma antiga ferida e, por isso, recebe -1 em todas as rolagens de Vitalidade ou Fortitude.', automatic:[{type:'skill', target:'Fortitude', value:-1}] },
  { id:'apego_objeto', name:'Apego a um Objeto', cost:2, category:'defect', description:'O personagem está ligado a um objeto especial, como um amuleto, retrato, carta, entre outros. Enquanto estiver distante desse item, sofrerá uma penalidade de -1 em todos os seus Testes de Defesa até recuperá-lo. Se o item for destruído, o personagem sofrerá um dano de 1d6 de Sanidade.', automatic:[], requiresChoice:{type:'text', label:'Registre o objeto'} },
  { id:'medo_da_morte', name:'Medo da Morte', cost:4, category:'defect', description:'Sempre que o personagem estiver com 1/4 ou menos de seus Pontos de Vida, todos os seus Testes de Acerto sofrerão uma penalidade de -2.', automatic:[], contextual:true },
  { id:'dificuldade_aprendizado', name:'Dificuldade de Aprendizado', cost:6, category:'defect', description:'Ao final da contagem de XP no fim da sessão, reduza 50 pontos de Experiência dos ganhos totais do personagem. Caso o resultado final seja inferior a 0, considere o total como 0.', automatic:[], contextual:true },
];

function findTDDef(itemId) {
  return TALENTS_DB.find(t => t.id === itemId) || DEFECTS_DB.find(d => d.id === itemId);
}

/* ============================================================
   DADOS — TITÃS PRIMORDIAIS
   ============================================================ */
const TITAN_CONTROL_LEVELS = [
  { level: 1, name: 'Nível 1', description: 'O portador não controla o Titã nas primeiras transformações e só pode se transformar uma vez por dia. O narrador guia as ações do Titã com base em instinto primitivo, atacando qualquer coisa que considere ameaça, sem distinguir aliados de inimigos. Se plausível, o portador pode tentar um teste de Vontade (dificuldade 16) para assumir o controle de algumas ações.' },
  { level: 2, name: 'Nível 2', description: 'O portador passa a controlar livremente os movimentos do Titã, podendo usar suas habilidades características, ataques e capacidades passivas. Já é possível se transformar mais de uma vez ao dia.' },
  { level: 3, name: 'Nível 3', description: 'Controle pleno sobre o Titã. O jogador pode criar, em conjunto com o mestre, uma habilidade exclusiva que combine o estilo de combate humano com os poderes do Titã.' }
];

const TITAN_PRIMORDIAL_DB = [
  { id: 'ataque', name: 'Titã de Ataque', height: '15 metros',
    description: 'Aparência feroz e musculosa. Seu verdadeiro poder está em regras narrativas únicas, capazes de transformar o curso da história.',
    pdvNuca: 110, pdvBraco: 50, pdvPerna: 50,
    attrs: { agi: 8, sta: 6, str: 8, vit: 5 },
    ataque: { test: 'Força ou Agilidade', dano: '9d6 + Força do titã', desvantagem: false },
    deslocamentoBase: 8, pdeTransform: 8, pdeMaintain: 5, regen: '1d12 + Estâmina do portador',
    abilities: [
      { name: 'Viagem entre Memórias', description: 'Compartilha memórias do passado e do futuro dos antigos portadores, permitindo antever acontecimentos importantes (com aprovação do narrador).' },
      { name: 'Modo Berserk', description: 'Ativa ao perder um membro ou ficar com menos de 50 PDV na nuca. Escolhe um alvo; enquanto durar, só pode atacá-lo, com vantagem e +2d10 de dano adicional. Dura até o fim do combate; ao terminar, o personagem desmaia automaticamente.' }
    ] },
  { id: 'colossal', name: 'Titã Colossal', height: '60 metros',
    description: 'O maior dos Titãs Primordiais. Movimentos lentos e previsíveis, com grandes regiões do corpo sem pele.',
    pdvNuca: 120, pdvBraco: 60, pdvPerna: 90,
    attrs: { agi: 3, sta: 4, str: 9, vit: 8 },
    ataque: { test: 'Agilidade (com desvantagem)', dano: '10d6 + Força do titã', desvantagem: true },
    deslocamentoBase: 10, pdeTransform: 12, pdeMaintain: 6, regen: '1d8 + Estâmina do portador',
    abilities: [
      { name: 'Pisoteamento', description: 'Usa o deslocamento para pisotear um alvo; a vítima faz teste de Agilidade (dificuldade 18) ou tem o corpo esmagado — morte imediata para humano, ou desacordado e desmembrado para outro Titã.' },
      { name: 'Emissão de Vapor', description: 'Inimigos a até 8m sofrem 3d6 de dano; o vapor impede aproximação a menos de 5m. Custo: 10 PDV em todas as partes do corpo + um turno inteiro para manter; desativa a regeneração enquanto ativa.' },
      { name: 'Transformação Explosiva', description: 'Ao se transformar, pode optar por uma explosão devastadora que mata instantaneamente tudo ao redor (exceto o Titã Blindado). Custo: 8 PDE adicionais.' }
    ] },
  { id: 'bestial', name: 'Titã Bestial', height: '17 metros',
    description: 'Aparência de gorila gigante, mas pode assumir traços de outros animais.',
    pdvNuca: 105, pdvBraco: 50, pdvPerna: 50,
    attrs: { agi: 7, sta: 4, str: 7, vit: 6 },
    ataque: { test: 'Força ou Agilidade', dano: '4d12 + Intelecto do titã', desvantagem: false },
    deslocamentoBase: 6, pdeTransform: 10, pdeMaintain: 5, regen: '1d10 + Estâmina do portador',
    abilities: [
      { name: 'Controle Titânico', description: 'Se o portador tiver origem Sangue Real, pode transformar em Titãs Puros qualquer pessoa que tenha ingerido seu fluido espinhal, e comandá-los depois.' },
      { name: 'Habilidade Animal', description: 'Após definir o animal que o Titã assumiu, o jogador cria com o narrador uma habilidade temática relacionada à criatura.' }
    ] },
  { id: 'femea', name: 'Titã Fêmea', height: '14 metros',
    description: 'Ágil, versátil e altamente estratégica. Estrutura esguia e traços definidos.',
    pdvNuca: 95, pdvBraco: 50, pdvPerna: 50,
    attrs: { agi: 9, sta: 8, str: 7, vit: 4 },
    ataque: { test: 'Agilidade', dano: '5d10 + Agilidade do titã', desvantagem: false },
    deslocamentoBase: 10, pdeTransform: 8, pdeMaintain: 5, regen: '1d12 + Estâmina do portador',
    abilities: [
      { name: 'Assimilação', description: 'Pode assimilar habilidades de outros Titãs Primordiais de forma parcial, caso o fluido espinhal do Titã desejado seja inserido na portadora. Cada assimilação deve ser desenvolvida com o mestre.' }
    ] },
  { id: 'blindado', name: 'Titã Blindado', height: '15 metros',
    description: 'O mais resistente dos Titãs Primordiais, revestido por placas de endurecimento natural.',
    pdvNuca: 110, pdvBraco: 60, pdvPerna: 60,
    attrs: { agi: 4, sta: 6, str: 8, vit: 7 },
    ataque: { test: 'Agilidade', dano: '5d12 + Vitalidade do titã', desvantagem: false },
    deslocamentoBase: 6, pdeTransform: 10, pdeMaintain: 5, regen: '1d8 + Estâmina do portador',
    abilities: [
      { name: 'Couraça', description: 'Imune a lâminas e ataques convencionais, sofrendo dano apenas de explosivos ou força física intensa. Cada parte do corpo tem +40 PDV extras de armadura, destruídos antes dos PDV reais; regeneram como os membros titânicos.' }
    ] },
  { id: 'mandibula', name: 'Titã Mandíbula', height: '5 metros',
    description: 'Pequeno porte e extrema agilidade. Garras e mandíbulas capazes de romper quase qualquer material.',
    pdvNuca: 80, pdvBraco: 45, pdvPerna: 45,
    attrs: { agi: 9, sta: 8, str: 6, vit: 4 },
    ataque: { test: 'Força ou Agilidade (à escolha)', dano: '8d8 + Força do titã', desvantagem: false },
    deslocamentoBase: 10, pdeTransform: 8, pdeMaintain: 4, regen: '1d12 + Estâmina do portador',
    abilities: [
      { name: 'Presas Implacáveis', description: 'Seus ataques não podem ser bloqueados, ignoram resistências a dano, e destroem as placas do Titã Blindado, a armadura do Titã Martelo de Guerra e as Lanças Trovão, causando dano direto ao alvo.' }
    ] },
  { id: 'carroceiro', name: 'Titã Carroceiro', height: '4 metros',
    description: 'Postura quadrúpede, alta resistência e velocidade para correr; pode carregar cargas pesadas.',
    pdvNuca: 85, pdvBraco: 50, pdvPerna: 50,
    attrs: { agi: 8, sta: 14, str: 4, vit: 8 },
    ataque: { test: 'Força ou Agilidade', dano: '4d10 + Força do titã', desvantagem: false },
    deslocamentoBase: 16, pdeTransform: 8, pdeMaintain: 0, regen: '1d6 + Estâmina do portador',
    abilities: [
      { name: 'Resistência Prolongada', description: 'Pode permanecer transformado por tempo indefinido. Longos períodos podem causar efeitos colaterais físicos ao retornar à forma humana (fraqueza muscular, dificuldades motoras), a critério do mestre.' }
    ] },
  { id: 'martelo', name: 'Titã Martelo de Guerra', height: '15 metros',
    description: 'Cria armas e estruturas com carne endurecida, moldando o campo de batalha à vontade do portador.',
    pdvNuca: 100, pdvBraco: 50, pdvPerna: 50,
    attrs: { agi: 7, sta: 8, str: 6, vit: 8 },
    ataque: { test: 'Força ou Agilidade', dano: '6d8 + Força do titã', desvantagem: false },
    deslocamentoBase: 8, pdeTransform: 8, pdeMaintain: 5, regen: '1d10 + Estâmina do portador',
    abilities: [
      { name: 'Ponto Vital', description: 'O portador pode ficar fora do corpo do Titã, a até 30m, conectado por um cabo de carne endurecida (50 PDV). Se o cabo for destruído, a transformação se desfaz e o portador fica protegido num cristal, só quebrável pelas presas do Titã Mandíbula.' },
      { name: 'Arma de Impacto', description: 'Cria uma arma de carne endurecida (martelo, espada, arco, lança etc.) — 5d12 + Vitalidade do Titã de dano, 20 PDV. Custo: 6 PDE do portador + Ação Bônus do Titã.' },
      { name: 'Estacas Emergentes', description: 'Estacas perfuram e imobilizam o alvo — 2d12 + Vitalidade do Titã de dano; cada estaca tem 10 PDV. Custo: 6 PDE do portador + Ação Bônus do Titã.' },
      { name: 'Armadura Corporal', description: 'Concede +30 PDV extras a todas as partes do corpo, destruídos antes dos PDV reais. Custo: 6 PDE do portador adicionais durante a transformação.' },
      { name: 'Barreira de Proteção', description: 'Cria uma barreira de 25 PDV que intercepta ataques automaticamente; se o dano exceder 25, a barreira é destruída e o Titã ainda pode tentar um Teste de Defesa para o dano restante. Custo: 6 PDE do portador + Ação de Reação do Titã.' }
    ] },
  { id: 'fundador', name: 'Titã Fundador', height: 'Variável (13m a quase 1km)',
    description: 'Superior a todos os outros Titãs Primordiais; molda a realidade do povo Eldiano através dos Caminhos.',
    pdvNuca: 100, pdvBraco: 50, pdvPerna: 50,
    attrs: { agi: 8, sta: 6, str: 6, vit: 6 },
    ataque: { test: 'Força ou Agilidade', dano: '5d10 + Força do titã', desvantagem: false },
    deslocamentoBase: 8, pdeTransform: 8, pdeMaintain: 5, regen: '1d12 + Estâmina do portador',
    abilities: [
      { name: 'Condição de Uso', description: 'Requer sangue real na linhagem, ou contato direto com quem o possui. Sem essa condição, pode ser ativado fisicamente, mas os poderes especiais permanecem adormecidos.' },
      { name: 'Alteração Biológica', description: 'Modifica aspectos físicos dos Eldianos: cura doenças, modifica corpos, esteriliza, fortalece ou enfraquece características, individual ou globalmente.' },
      { name: 'Alteração de Memórias', description: 'Apaga, modifica ou insere memórias falsas em qualquer Eldiano, individual ou coletivamente.' },
      { name: 'Caminhos', description: 'Acesso e controle absoluto de uma dimensão que conecta todos os Eldianos; pode invocar qualquer um deles e influenciar sua biologia e memória.' },
      { name: 'Controle Titânico Aprimorado', description: 'Comanda qualquer Titã Puro em existência, sem necessidade de proximidade, comandos verbais ou limitação.' },
      { name: 'Endurecimento Parcial', description: 'Requer Nível 3 de Controle. Ofensivo: +2d10 de dano no ataque, dura o combate inteiro. Defensivo: placa protetora com as propriedades da couraça do Titã Blindado, dura 2 rodadas. Estrutural: cria uma estrutura fixa ao redor do corpo, mas o portador é expelido dele. Custo: 8 PDE + Ação Bônus. Uma vez por forma, por combate.' }
    ] }
];

function getAllTitans() {
  const merged = {};
  TITAN_PRIMORDIAL_DB.forEach(t => { merged[t.id] = t; });
  customTitans.forEach(t => { merged[t.id] = t; });
  return merged;
}
function getTitanById(id) { return getAllTitans()[id]; }

/* ============================================================
   DADOS — EQUIPAMENTOS DO SISTEMA
   ============================================================ */
const EQUIPMENT_DB = [
  { id: 'atadura', name: 'Atadura', category: 'consumivel', weight: 1,
    description: 'Teste de Medicina (dificuldade 10, Ação Bônus): restaura 2d4 + valor na perícia de Medicina em PDV de um alvo. Se falhar, o item se mantém.',
    dice: '2d4 + Medicina', properties: 'Uso único.' },
  { id: 'kit_primeiros_socorros', name: 'Kit de Primeiros Socorros', category: 'consumivel', weight: 3,
    description: 'Teste de Medicina (dificuldade 16, Ação Padrão): restaura 3d6 + valor na perícia de Medicina em PDV de um alvo. Se falhar, o item se mantém.',
    dice: '3d6 + Medicina', properties: '2 usos.' },
  { id: 'pilula_adrenalina', name: 'Pílula de Adrenalina', category: 'consumivel', weight: 1,
    description: 'Ao consumir, o personagem entra automaticamente na condição de Adrenalina.', properties: 'Uso único.' },
  { id: 'injecao_adrenalina', name: 'Injeção de Adrenalina', category: 'consumivel', weight: 2,
    description: 'Ao consumir, o personagem escolhe livremente o estágio de Adrenalina que deseja atingir. Ao término da condição, sofre 1 ponto adicional de Fadiga.', properties: 'Uso único.' },
  { id: 'sinalizador', name: 'Sinalizador', category: 'equipamento', weight: 2,
    description: 'Causa 1d4 de dano ao ser disparado diretamente contra um alvo, mas sua principal função é marcar ou sinalizar áreas. Disponível em verde, vermelho, roxo, preto e amarelo.',
    dice: '1d4' },
  { id: 'mochila_couro', name: 'Mochila de Couro', category: 'equipamento', weight: 0, capacityBonus: 3,
    description: 'Ao equipar, aumenta a capacidade de inventário em +3 espaços.', bonuses: '+3 espaços de inventário' },
  { id: 'mochila_exploracao', name: 'Mochila de Exploração', category: 'equipamento', weight: 0, capacityBonus: 5,
    description: 'Ao equipar, aumenta a capacidade de inventário em +5 espaços.', bonuses: '+5 espaços de inventário' },
  { id: 'binoculo_luneta', name: 'Binóculo/Luneta', category: 'equipamento', weight: 2,
    description: 'Permite observar longas distâncias com maior precisão.', bonuses: '+2 em testes de Exploração ao usá-lo' },
  { id: 'racao_militar', name: 'Ração Militar', category: 'consumivel', weight: 2,
    description: 'Kit de alimentos básicos que supre as necessidades nutricionais de um personagem por um dia de missão.' },
  { id: 'lamparina_lanterna', name: 'Lamparinas/Lanternas', category: 'equipamento', weight: 2,
    description: 'Emite luz suficiente para revelar objetos ou detalhes ocultos na escuridão. Carregada de forma exposta, causa desvantagem em testes de Furtividade.' },
  { id: 'explosivo_luminoso', name: 'Explosivo Luminoso', category: 'consumivel', weight: 2,
    description: 'Cega um alvo por 1 turno mediante um teste de Mecânica contra a Vitalidade do alvo. Sucesso: o alvo recebe a condição Vulnerável e não enxerga nada ao redor durante esse período.' },
  { id: 'explosivo_comum', name: 'Explosivo Comum', category: 'consumivel', weight: 2,
    description: 'Lançado contra alvos, causa 5d4 de dano a todos em um raio de 5 metros. Teste de Agilidade (dificuldade 16) reduz o dano pela metade.',
    dice: '5d4', range: '5m de raio' },
  { id: 'rifle', name: 'Rifle', category: 'arma', weight: 3,
    description: 'Rifle de uso padrão, alimentado por munições convencionais, amplamente utilizado pela Polícia Militar. A cada 6 disparos, requer recarga com uma Ação Bônus. A Resistência Titã se aplica a esse tipo de arma.',
    dice: '2d10', range: '30m', properties: 'Margem de crítico reduzida em -1 contra Titãs. Recarrega a cada 6 disparos (Ação Bônus).' },
  { id: 'caixa_municoes', name: 'Caixa de Munições Convencionais', category: 'consumivel', weight: 1,
    description: 'Contém 12 munições para rifles de uso padrão.' },
  { id: 'carga_gas', name: 'Carga de Gás', category: 'consumivel', weight: 3,
    description: 'Um cilindro adicional contendo 20 pontos de gás, usado para recarregar os cilindros principais do DMT.' },
  { id: 'carga_laminas', name: 'Carga de Lâminas', category: 'consumivel', weight: 2,
    description: 'Um conjunto de lâminas adicional para reposição, permitindo substituir conjuntos quebrados.' },
  { id: 'carga_municao_canhao', name: 'Carga de Munição (Canhões de Mão)', category: 'consumivel', weight: 1,
    description: 'Munição extra para os canhões de mão, contendo duas munições por carga.' },
  { id: 'rede_captura', name: 'Rede de Captura', category: 'arma', weight: 4,
    description: 'Equipamento portátil semelhante a um pequeno canhão com gatilho, carregado sobre o ombro. Teste de Acerto com Pontaria dispara uma rede com espinhos para imobilizar Titãs. O Titã precisa ter perdido ao menos três membros; se a condição for cumprida e o teste for bem-sucedido, o alvo fica preso e imóvel.',
    properties: 'Utiliza 4 Espaços.' }
];
function findEquipment(id) { return EQUIPMENT_DB.find(e => e.id === id); }

/* ============================================================
   DADOS — ESCUDO DO MESTRE (TITÃS PUROS, BIOMAS, REGRAS)
   ============================================================ */
const PURE_TITAN_CATEGORIES = [
  { id: '3-5', label: 'Titã de 3 a 5 Metros', pdvNuca: 40, pdvBraco: 20, pdvPerna: 20, attrs: { agi: 5, sta: 2, str: 4, int: 2, vit: 2 }, testeAcerto: '+5', dano: '3d6+4', deslocamento: 6, bloqueio: 14, bloqueioNuca: 17 },
  { id: '6-9', label: 'Titã de 6 a 9 Metros', pdvNuca: 50, pdvBraco: 25, pdvPerna: 25, attrs: { agi: 7, sta: 4, str: 5, int: 2, vit: 3 }, testeAcerto: '+7', dano: '4d6+6', deslocamento: 8, bloqueio: 15, bloqueioNuca: 18 },
  { id: '10-14', label: 'Titã de 10 a 14 Metros', pdvNuca: 60, pdvBraco: 30, pdvPerna: 30, attrs: { agi: 6, sta: 5, str: 6, int: 2, vit: 5 }, testeAcerto: '+6', dano: '5d6+8', deslocamento: 10, bloqueio: 16, bloqueioNuca: 19 },
  { id: '15', label: 'Titã de 15 Metros', pdvNuca: 70, pdvBraco: 35, pdvPerna: 35, attrs: { agi: 8, sta: 6, str: 8, int: 2, vit: 6 }, testeAcerto: '+8', dano: '6d6+10', deslocamento: 10, bloqueio: 17, bloqueioNuca: 20 }
];
function getPureTitanCategory(id) { return PURE_TITAN_CATEGORIES.find(c => c.id === id); }

const PURE_TITAN_VARIATIONS = [
  { id: 'nenhuma', label: 'Nenhuma', desc: 'Sem alterações.', pvBonusPerPart: 0 },
  { id: 'gordo', label: 'Titã Gordo', desc: '-2m deslocamento, -2 Teste de Acerto, +1d6 dano, +5 PDV em todas as partes.', pvBonusPerPart: 5 },
  { id: 'magro', label: 'Titã Magro', desc: '+2m deslocamento, +2 Teste de Acerto, -1d6 dano, -1 no bloqueio.', pvBonusPerPart: 0 },
  { id: 'atletico', label: 'Titã Atlético', desc: '+1 Teste de Acerto, +1d6 dano, +1m deslocamento.', pvBonusPerPart: 0 },
  { id: 'custom', label: 'Custom (editar manualmente)', desc: 'Personalize o PDV de cada parte e adicione notas ou habilidades próprias.', pvBonusPerPart: 0 }
];
function getPureTitanVariation(id) { return PURE_TITAN_VARIATIONS.find(v => v.id === id) || PURE_TITAN_VARIATIONS[0]; }

const TITAN_PART_LABELS = { nuca: 'Nuca', bracoD: 'Braço Direito', bracoE: 'Braço Esquerdo', pernaD: 'Perna Direita', pernaE: 'Perna Esquerda' };

const BIOMAS_DB = [
  { id: 'planicie', name: 'Planície', tipo: 'ambiente',
    bonus: '-1d4 em esquivas, Testes de Acerto, fugas e danos utilizando o DMT. +4 metros de deslocamento para todos os Titãs e montarias. Testes de Furtividade recebem desvantagem. Com canhões de mão no DMT, o personagem não recebe o -1d4 em Testes de Acerto, e ataques à longa distância recebem vantagem.' },
  { id: 'planicie_arborizada', name: 'Planície Arborizada', tipo: 'ambiente',
    bonus: '+2 em testes de Exploração para todos os personagens.' },
  { id: 'bosque', name: 'Bosque', tipo: 'ambiente',
    bonus: '+1 em Testes de Acerto e esquivas utilizando o DMT. +1 em testes de Furtividade para todos os personagens.' },
  { id: 'cidade', name: 'Cidade/Distrito', tipo: 'ambiente',
    bonus: '+1d4 de dano com o DMT.' },
  { id: 'subterraneo', name: 'Subterrâneo Cristalizado', tipo: 'ambiente',
    bonus: '+1 em Testes de Acerto e esquivas com o DMT. Personagens com a origem Sangue Real recebem +3 em Testes de Defesa neste local.' },
  { id: 'floresta_gigante', name: 'Floresta das Árvores Gigantes', tipo: 'ambiente',
    bonus: '+1d4 em esquivas, Testes de Acerto, fugas e danos utilizando o DMT. +1 em testes de Furtividade e Tática. O Titã Mandíbula recebe +2 no atributo de Agilidade e +4m em seu deslocamento.' },
  { id: 'calor', name: 'Calor Intenso', tipo: 'clima',
    bonus: 'Todos os personagens gastam 1 PDE adicional ao ativar qualquer habilidade.' },
  { id: 'neve', name: 'Neve', tipo: 'clima',
    bonus: 'Personagens, montarias e Titãs têm o deslocamento reduzido em -2 metros e -1 em testes de Agilidade.' },
  { id: 'nevoa', name: 'Névoa', tipo: 'clima',
    bonus: 'Testes de Exploração recebem desvantagem. Ataques à longa distância recebem -2 em seus Testes de Acerto.' },
  { id: 'chuva', name: 'Chuva', tipo: 'clima',
    bonus: 'O deslocamento das montarias é reduzido em -2 metros. Pode ocorrer junto de Névoa.' },
  { id: 'tempestade', name: 'Tempestade', tipo: 'clima',
    bonus: 'Todos os personagens recebem -1 no atributo de Agilidade e têm o deslocamento reduzido em -2 metros. Pode ocorrer junto de Névoa.' }
];
function getBioma(id) { return BIOMAS_DB.find(b => b.id === id); }

const RULES_REFERENCE = [
  { category: 'DMT', title: 'Combustível', text: 'Cada cilindro possui 20 pontos de gás (40 no total, em dois cilindros). Consumo: Movimentação — 1 gás a cada 5 metros. Ataque — 2 gás por ataque. Esquiva — 1 gás por Teste de Defesa com esquiva.' },
  { category: 'DMT', title: 'Movimentação', text: 'O deslocamento base é 5 + Agilidade. O DMT permite atingir esse deslocamento consumindo gás conforme a distância percorrida.' },
  { category: 'DMT', title: 'Esquiva', text: 'Teste de Agilidade; se o resultado superar o acerto do oponente, anula o dano e permite mover-se até 1m opcionalmente. Consome 1 gás quando realizada com o DMT.' },
  { category: 'DMT', title: 'Ataques', text: 'Lâminas: 2d10 + Força, perícia Luta, margem de crítico 20, alcance corpo-a-corpo, quebram a cada 3 ataques (3 conjuntos disponíveis). Canhão de Mão: 3d6, perícia Pontaria, margem de crítico 18, alcance 10m, 10 munições, recarga manual.' },
  { category: 'DMT', title: 'DMT Aprimorado (Proficiência com o DMT)', text: 'Habilidade geral passiva que reduz o consumo de gás em movimentação e concede bônus crescentes em Testes de Defesa com esquiva, deslocamento e Testes de Acerto usando o DMT, conforme o nível da habilidade.' },
  { category: 'Combate', title: 'Defesa', text: 'Contra ataques humanos, o personagem escolhe entre esquiva (teste de Agilidade) ou bloqueio (8 + Força + Luta investida). Contra Titãs, apenas esquiva é possível — bloqueios são inviáveis.' },
  { category: 'Combate', title: 'Bloqueio', text: 'Resultado fixo: 8 + Força + pontos investidos em Luta. Se superar o acerto do oponente, anula todo o dano.' },
  { category: 'Combate', title: 'Esquiva', text: 'Teste de Agilidade. Se o resultado superar o acerto do oponente, anula todo o dano e permite mover-se até 1m.' },
  { category: 'Combate', title: 'Ataques a Titãs (Membros)', text: 'Cada membro do Titã (nuca, braços, pernas) é um alvo com PDV próprio. Perder um braço: bloqueios -3 e ataques com desvantagem. Perder uma perna: deslocamento reduzido a 4m. Perder os dois braços: condição Vulnerável e dupla desvantagem para atacar (só morde). Perder as duas pernas: deslocamento anulado. Perder a nuca: o Titã evapora e desaparece.' },
  { category: 'Combate', title: 'Dano contra Titãs', text: 'Armas de fogo não explosivas ou de baixo impacto causam metade do dano contra Titãs (arredondado para cima).' },
  { category: 'Combate', title: 'Regeneração Titânica', text: 'Ao final de cada turno de combate (ou minuto fora dele), um teste de regeneração determina quantos PDV o Titã recupera em todos os membros. Um membro perdido só remove os debuffs quando totalmente regenerado.' },
  { category: 'Combate', title: 'Cegar um Titã', text: 'Ataque contra o mesmo valor de defesa exigido para acertar a nuca. Sucesso: o Titã fica cego, recebe Vulnerável e desvantagem em Testes de Acerto até seu próximo turno. Errar em combate corpo a corpo abre brecha para um Ataque de Oportunidade do Titã. Esse tipo de ataque nunca causa dano.' },
  { category: 'Combate', title: 'Ataque de Oportunidade', text: 'Ataque adicional fora do turno do personagem, usando uma Ação de Reação, quando um inimigo identifica uma brecha nas defesas de um alvo (por exemplo, curar um aliado perto de um inimigo, ou dar as costas e fugir dentro do alcance e visão dele). Pode ser concedido pelas regras do sistema ou pela interpretação do mestre. O atacante pode usar uma Ação de Movimento exclusivamente para se aproximar do alvo, se necessário. Não é possível utilizar habilidades em Ataques de Oportunidade.' },
  { category: 'Críticos', title: 'Crítico Positivo em Ataques', text: 'Role 1d4 para saber o bônus:', list: ['Se tirar 1 — Realiza um ataque padrão adicional que causa 50% de dano.', 'Se tirar 2 — O ataque causa 50% a mais de dano.', 'Se tirar 3 — Duplica apenas os dados de dano.', 'Se tirar 4 — O dano total do ataque é duplicado.'] },
  { category: 'Críticos', title: 'Crítico Positivo em Testes de Defesa', text: 'Role 1d4 para saber o bônus:', list: ['Se tirar 1 — Seu próximo Teste de Acerto recebe +4.', 'Se tirar 2 — Seu próximo Teste de Acerto recebe Vantagem.', 'Se tirar 3 — O inimigo recebe a condição Vulnerável contra você no próximo ataque.', 'Se tirar 4 — Pode realizar um Ataque de Oportunidade contra o inimigo.'] },
  { category: 'Críticos', title: 'Crítico Positivo em Outros Testes', text: 'Role 1d4 para saber o bônus:', list: ['Se tirar 1 — Seu próximo teste recebe +3.', 'Se tirar 2 — Seus próximos 2 testes recebem +2.', 'Se tirar 3 — Seu próximo teste recebe Vantagem.', 'Se tirar 4 — +2 em todos os Testes de Acerto durante aquele combate.'] },
  { category: 'Críticos', title: 'Falhas Críticas', text: 'Não exigem rolagem de 1d4 — o efeito depende apenas do tipo de teste que falhou criticamente:', list: ['Em Ataques — abre brecha para um Ataque de Oportunidade do inimigo, como um contra-ataque.', 'Em Testes de Defesa — recebe 50% a mais de dano naquele ataque.', 'Em qualquer outro teste — o próximo teste recebe desvantagem.'] },
  { category: 'Titãs Puros', title: 'Regeneração', text: 'Regeneram 1d6 PDV ao final de cada turno (ou minuto fora de combate), aplicado a todos os membros.' },
  { category: 'Titãs Puros', title: 'Testes de Perícia', text: 'Não possuem valores em perícia; use metade do atributo relacionado (arredondado para baixo) como bônus, quando necessário.' },
  { category: 'Titãs Puros', title: 'Ação Aleatória (1d6, opcional)', text: 'Role 1d6 no turno do Titã Puro:', list: ['Se tirar 1 — Ignora todos os humanos ao redor neste turno.', 'Se tirar 2 — Ataca um humano aleatório, com desvantagem no ataque.', 'Se tirar 3 ou 4 — Ataca um humano aleatório normalmente.', 'Se tirar 5 — Ataca um humano aleatório, com vantagem no ataque.', 'Se tirar 6 — Tenta agarrar um humano (Teste de Acerto); se agarrado, o humano é devorado a menos que se liberte (teste de Força contra o Titã, que tem vantagem) ou um aliado acerte o Titã antes do próximo turno dele.'] },
  { category: 'Titãs Puros', title: 'Testes de Defesa', text: 'Titãs Puros só bloqueiam, não esquivam (exceto Titãs Anômalos). Ataques à nuca recebem +3 no Teste de Defesa (bloqueio ou esquiva, se permitido).' },
  { category: 'Titãs Puros', title: 'Variações', text: 'Titã Gordo: -2m deslocamento, -2 Teste de Acerto, +1d6 dano, +5 PDV em todas as partes. Titã Magro: +2m deslocamento, +2 Teste de Acerto, -1d6 dano, -1 no bloqueio. Titã Atlético: +1 Teste de Acerto, +1d6 dano, +1m deslocamento. Titãs Anômalos: ficha livre para o narrador, podendo incluir esquivas e habilidades únicas.' },
  { category: 'Condições', title: 'Adrenalina', text: 'Ativada por pedido do mestre ou ao chegar a menos de 50% da vida. Ao entrar, faça um teste de Fortitude:', list: ['Resultado 1 a 9 — -1 em todos os Testes de Acerto até a condição passar.', 'Resultado 10 a 15 — +2 em todos os Testes de Acerto e +4m de deslocamento até a condição passar.', 'Resultado 16 ou mais — +4 em todos os Testes de Acerto e +4m de deslocamento até a condição passar.', 'Ao final (2 rodadas em combate ou 5 minutos fora dele) — aplica 2 pontos de Fadiga.'] },
  { category: 'Condições', title: 'Sangramento', text: 'Perde 1d8 de PDV a cada rodada (ou minuto fora de combate) até que um reparo médico obtenha 14+ em Medicina.' },
  { category: 'Condições', title: 'Morrendo', text: 'Ao chegar a 0 ou menos PDV. Teste de Fortitude (ou Medicina de aliado) ≥ dificuldade para estabilizar com 1 PDV. A dificuldade aumenta +1 a cada 5 de dano excedente.' },
  { category: 'Condições', title: 'Vulnerável', text: '-4 em Testes de Defesa; atacantes reduzem a margem de crítico contra o personagem em -2.' },
  { category: 'Condições', title: 'Enlouquecendo', text: 'Ao chegar a 0 de SAN. Teste de Vontade (ou Carisma de aliado) ≥ 18 para se recuperar com 1 SAN.' },
  { category: 'Condições', title: 'Fadiga', text: 'Pontos cumulativos de 1 a 8 — cada novo ponto soma seu efeito aos anteriores. Zera após um descanso curto:', list: ['1 Ponto — -1 nos Testes de Acerto.', '2 Pontos — -1 em todas as Perícias.', '3 Pontos — -1 no atributo de Agilidade.', '4 Pontos — Deslocamento reduzido pela metade.', '5 Pontos — -1 adicional nos Testes de Acerto.', '6 Pontos — Desvantagem nos testes de esquiva.', '7 Pontos — -1 em todos os atributos.', '8 Pontos — O personagem está desacordado.'] },
  { category: 'Condições', title: 'Traumatizado', text: 'Antes de testes em situações que lembrem o trauma, teste de Vontade; abaixo de 16, o teste pretendido é feito com desvantagem.' },
  { category: 'Condições', title: 'Perda de Membros', text: 'Perda de Perna: metade do deslocamento, ou rastejar (deslocamento = Força). Perda de Braço: desvantagem em Testes de Acerto (ou -3 com adaptação).' },
  { category: 'Condições', title: 'Ferido', text: 'Dano único acima de metade do PDV total: -2 em Testes de Acerto e -4m de Deslocamento até tratamento.' },
  { category: 'Condições', title: 'Descanso Curto', text: 'Um período curto (uma refeição, ou ao menos uma hora fora de combate) recupera metade dos PDE perdidos e 2d4 de PDV.' },
  { category: 'Condições', title: 'Descanso Longo', text: 'Uma boa noite de sono ou um dia inteiro de repouso recupera todos os PDE e 2d8 de PDV.' },
  { category: 'Montarias', title: 'Cavalo Comum', text: 'Inventário com 10 espaços, 15 Pontos de Vida, deslocamento de 12 + valor na perícia de Natureza do cavaleiro (em metros). Exige testes de Natureza para manter sob comando (dificuldade a critério do narrador). Ao ouvir ruídos altos ou perceber ameaças, foge instintivamente para o mais longe possível, sem atender chamados de retorno.' },
  { category: 'Montarias', title: 'Cavalo Treinado', text: 'Montaria especial de divisões militares: 20 Pontos de Vida, inventário com 15 espaços, deslocamento de 14 + valor na perícia de Natureza do cavaleiro. Responde a chamados (como assobios) a até 300 metros, indo imediatamente até o cavaleiro.' }
];

/* ============================================================
   ESTADO GERAL
   ============================================================ */
let characters = JSON.parse(localStorage.getItem('rpgChars') || '[]');
let customOrigins = JSON.parse(localStorage.getItem('rpgCustomOrigins') || '[]');
let customTitans = JSON.parse(localStorage.getItem('rpgCustomTitans') || '[]');
let currentCharId = null;
let creationState = null;
let currentSkillFilter = 'all';
let currentTDFilter = 'all';
let currentEquipmentFilter = 'all';
let equipmentPickerTargetType = 'personal';
let gmTitans = JSON.parse(localStorage.getItem('rpgGMTitans') || '[]');
let gmInitiative = JSON.parse(localStorage.getItem('rpgGMInitiative') || '[]');
let initiativeDragIndex = null;
let pendingInitiativeImage = null;
function saveGMInitiative() { localStorage.setItem('rpgGMInitiative', JSON.stringify(gmInitiative)); }
let gmActiveBiomaIds = JSON.parse(localStorage.getItem('rpgGMActiveBiomas') || '[]');
let gmPrimordialTitans = JSON.parse(localStorage.getItem('rpgGMPrimordialTitans') || '[]');
let pendingGMPrimordialImage = null;
function saveGMPrimordialTitans() { localStorage.setItem('rpgGMPrimordialTitans', JSON.stringify(gmPrimordialTitans)); }
let gmHiddenSoldiers = JSON.parse(localStorage.getItem('rpgGMHiddenSoldiers') || '[]');
let gmHiddenTitans = JSON.parse(localStorage.getItem('rpgGMHiddenTitans') || '[]');
function saveGMHidden() {
  localStorage.setItem('rpgGMHiddenSoldiers', JSON.stringify(gmHiddenSoldiers));
  localStorage.setItem('rpgGMHiddenTitans', JSON.stringify(gmHiddenTitans));
}
let pendingGMTitanDamageId = null;
function saveGMTitans() { localStorage.setItem('rpgGMTitans', JSON.stringify(gmTitans)); }
let expandedOriginId = null;
let currentSkillDetail = null;
let pendingTDSelection = null;
let originSelectionContext = 'wizard';

function saveChars() { localStorage.setItem('rpgChars', JSON.stringify(characters)); }
function saveCustomOrigins() { localStorage.setItem('rpgCustomOrigins', JSON.stringify(customOrigins)); }
function saveCustomTitans() { localStorage.setItem('rpgCustomTitans', JSON.stringify(customTitans)); }

function getAllOrigins() {
  const merged = { ...ORIGINS };
  customOrigins.forEach(o => { merged[o.id] = o; });
  return merged;
}
function getOriginById(id) { return getAllOrigins()[id]; }

function openFamilyCreatorModal(context) {
  originSelectionContext = context;
  document.getElementById('famName').value = '';
  document.getElementById('famLineage').value = '';
  document.getElementById('famDescription').value = '';
  document.getElementById('famPDV').value = 8;
  document.getElementById('famSAN').value = 6;
  document.getElementById('famPDE').value = 6;
  document.getElementById('famHasPassive').checked = false;
  document.getElementById('famPassiveName').value = '';
  document.getElementById('famPassiveDesc').value = '';
  document.getElementById('famHasAbility').checked = false;
  document.getElementById('famAbilityName').value = '';
  document.getElementById('famAbilityDesc').value = '';
  document.getElementById('familyCreatorModal').classList.remove('hidden');
}
function closeFamilyCreatorModal() { document.getElementById('familyCreatorModal').classList.add('hidden'); }

function saveCustomFamily() {
  const name = document.getElementById('famName').value.trim();
  if (!name) { showNotification('Nome da família é obrigatório.', '', true); return; }
  const id = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now().toString(36);
  const hasPassive = document.getElementById('famHasPassive').checked;
  const hasAbility = document.getElementById('famHasAbility').checked;
  const origin = {
    id, name, family: document.getElementById('famLineage').value.trim(),
    description: document.getElementById('famDescription').value.trim() || 'Família customizada.',
    custom: true,
    initialStats: {
      pdv: parseInt(document.getElementById('famPDV').value) || 0,
      san: parseInt(document.getElementById('famSAN').value) || 0,
      pde: parseInt(document.getElementById('famPDE').value) || 0
    },
    passive: hasPassive
      ? { id: id + '_passiva', name: document.getElementById('famPassiveName').value.trim() || 'Passiva', description: document.getElementById('famPassiveDesc').value.trim() || 'Sem descrição.', effects: [] }
      : { id: id + '_passiva', name: 'Nenhuma', description: 'Esta família não possui passiva.', effects: [] },
    originAbility: hasAbility
      ? { id: id + '_habilidade', name: document.getElementById('famAbilityName').value.trim() || 'Habilidade de Origem', description: document.getElementById('famAbilityDesc').value.trim() || 'Sem descrição.', unlockLevel: 8, effects: [] }
      : { id: id + '_habilidade', name: 'Nenhuma', description: 'Esta família não possui habilidade de origem.', unlockLevel: 8, effects: [] }
  };
  customOrigins.push(origin);
  saveCustomOrigins();
  closeFamilyCreatorModal();
  if (originSelectionContext === 'wizard') renderOriginSelection();
  else renderOriginSelectorList();
  showNotification('Família criada.', name);
}

function deleteCustomFamily(id, event) {
  if (event) event.stopPropagation();
  showConfirm('Excluir esta família customizada? Personagens que já a utilizam manterão os dados salvos, mas ela não aparecerá mais na lista.', () => {
    customOrigins = customOrigins.filter(o => o.id !== id);
    saveCustomOrigins();
    if (originSelectionContext === 'wizard') renderOriginSelection();
    else renderOriginSelectorList();
    showNotification('Família removida.', '');
  });
}

/* ============================================================
   TITÃ PRIMORDIAL — SHIFTER
   ============================================================ */
function toggleTitanRules() {
  const body = document.getElementById('titanRulesBody');
  const btn = document.getElementById('btnToggleTitanRules');
  const hidden = body.classList.toggle('hidden');
  btn.textContent = hidden ? 'Mostrar Regras' : 'Ocultar Regras';
}

function handleShifterImageUpload(event) {
  const ch = getCurrentChar(); if (!ch) return;
  const file = event.target.files[0]; event.target.value = '';
  if (!file) return;
  resizeImageToDataUrl(file, 500, 0.85, (dataUrl) => {
    ch.shifter.imageUrl = dataUrl;
    ch.updatedAt = new Date().toISOString(); saveChars();
    renderShifterTab();
  });
}

function toggleIsShifter(checked) {
  const ch = getCurrentChar(); if (!ch) return;
  ch.shifter.isShifter = checked;
  ch.updatedAt = new Date().toISOString(); saveChars(); renderShifterTab();
}

function setShifterTitan(titanId) {
  const ch = getCurrentChar(); if (!ch) return;
  ch.shifter.titanId = titanId || null;
  ch.updatedAt = new Date().toISOString();
  recomputeShifterParts(ch);
  saveChars(); renderShifterTab();
}

function setShifterControlLevel(level) {
  const ch = getCurrentChar(); if (!ch) return;
  ch.shifter.controlLevel = parseInt(level) || 1;
  ch.updatedAt = new Date().toISOString(); saveChars(); renderShifterTab();
}

function computeShifterAttrs(ch) {
  const titan = getTitanById(ch.shifter.titanId); if (!titan) return null;
  const portador = { agi: ch.attributes.agi + (ch.attributeBonuses.agi || 0), sta: ch.attributes.sta + (ch.attributeBonuses.sta || 0), str: ch.attributes.str + (ch.attributeBonuses.str || 0), int: ch.attributes.int + (ch.attributeBonuses.int || 0), vit: ch.attributes.vit + (ch.attributeBonuses.vit || 0) };
  return {
    agi: titan.attrs.agi + portador.agi, sta: titan.attrs.sta + portador.sta,
    str: titan.attrs.str + portador.str, int: portador.int, vit: titan.attrs.vit + portador.vit
  };
}

function recomputeShifterParts(ch) {
  const titan = getTitanById(ch.shifter.titanId);
  if (!titan) return;
  const portadorVit = ch.attributes.vit + (ch.attributeBonuses.vit || 0);
  const maxes = { nuca: titan.pdvNuca + (portadorVit * 2), cabeca: titan.pdvNuca, bracoD: titan.pdvBraco, bracoE: titan.pdvBraco, pernaD: titan.pdvPerna, pernaE: titan.pdvPerna };
  Object.keys(maxes).forEach(part => {
    if (!ch.shifter.parts[part]) ch.shifter.parts[part] = { cur: maxes[part], max: maxes[part] };
    else {
      ch.shifter.parts[part].max = maxes[part];
      if (ch.shifter.parts[part].cur > maxes[part]) ch.shifter.parts[part].cur = maxes[part];
    }
  });
}

function renderShifterTab() {
  const ch = getCurrentChar(); if (!ch) return;
  document.getElementById('shifterIsShifter').checked = ch.shifter.isShifter;
  document.getElementById('shifterContent').classList.toggle('hidden', !ch.shifter.isShifter);
  if (!ch.shifter.isShifter) return;

  const select = document.getElementById('shifterTitanSelect');
  const allTitans = getAllTitans();
  select.innerHTML = '<option value="">Selecione um Titã...</option>' + Object.values(allTitans).map(t => `<option value="${t.id}" ${ch.shifter.titanId === t.id ? 'selected' : ''}>${t.name}${t.custom ? ' (Custom)' : ''}</option>`).join('');
  document.getElementById('shifterControlLevel').value = ch.shifter.controlLevel;

  const controlInfo = TITAN_CONTROL_LEVELS.find(c => c.level === ch.shifter.controlLevel);
  document.getElementById('shifterControlDesc').innerHTML = controlInfo ? `<strong>${controlInfo.name}:</strong> ${controlInfo.description}` : '';

  const statsBlock = document.getElementById('shifterStatsBlock');
  const titan = getTitanById(ch.shifter.titanId);
  if (!titan) { statsBlock.innerHTML = '<p style="color:var(--text-dim);">Selecione um Titã para ver os atributos e status.</p>'; return; }

  recomputeShifterParts(ch);
  const attrs = computeShifterAttrs(ch);
  const esquivaTitan = 11 + attrs.agi;
  const bloqueioTitan = 11 + attrs.str;
  const deslocamentoTitan = titan.deslocamentoBase + attrs.agi;
  const abilitiesHtml = (titan.abilities || []).map(a => `<div class="ability-item"><h5>${a.name}</h5><p>${a.description}</p></div>`).join('');
  const customAbilitiesHtml = (ch.shifter.customAbilities || []).map((a, idx) => `<div class="ability-item"><h5>${a.name} <span class="tag class">Custom</span></h5><p>${a.description}</p><button class="small danger" style="margin-top:8px;" onclick="removeShifterCustomAbility(${idx})">Remover</button></div>`).join('');

  statsBlock.innerHTML = `
    <div class="card" style="background:var(--surface-2);">
      <div style="display:flex;gap:14px;align-items:flex-start;">
        <div class="char-thumbnail" onclick="document.getElementById('shifterImageInput').click()" title="Clique para definir a imagem do Titã">
          ${ch.shifter.imageUrl ? `<img src="${ch.shifter.imageUrl}" alt="" />` : '<span>Foto</span>'}
        </div>
        <div style="flex:1;">
          <h3>${titan.name} <span style="font-size:0.78rem;color:var(--text-dim);font-weight:400;">(${titan.height})</span></h3>
          <p style="color:var(--text-muted);font-size:0.85rem;margin-top:6px;">${titan.description}</p>
        </div>
      </div>
      <div class="grid grid-4" style="margin-top:14px;">
        <div class="attr-card"><div>Agilidade</div><div class="attr-value">${attrs.agi}</div></div>
        <div class="attr-card"><div>Estâmina</div><div class="attr-value">${attrs.sta}</div></div>
        <div class="attr-card"><div>Força</div><div class="attr-value">${attrs.str}</div></div>
        <div class="attr-card"><div>Vitalidade</div><div class="attr-value">${attrs.vit}</div></div>
      </div>
      <div class="derived-stat" style="margin-top:12px;"><span><strong>Ataque Padrão:</strong></span><span>${titan.ataque.dano} — Teste: ${titan.ataque.test}</span></div>
      <div class="derived-stat"><span><strong>Deslocamento:</strong></span><span>${deslocamentoTitan}m</span></div>
      <div class="derived-stat"><span><strong>Esquiva (fixa):</strong></span><span>${esquivaTitan}</span></div>
      <div class="derived-stat"><span><strong>Bloqueio (fixo):</strong></span><span>${bloqueioTitan}</span></div>
      <div class="derived-stat"><span><strong>Regeneração (por turno em combate / minuto fora):</strong></span><span>${titan.regen}</span></div>
      <div class="derived-stat"><span><strong>Custo de Transformação:</strong></span><span>${titan.pdeTransform} PDE (transformar) / ${titan.pdeMaintain} PDE (manter por rodada)</span></div>

      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;">
        ${ch.shifter.transformed
          ? `<button class="danger" onclick="detransformShifter()">Destransformar</button><button onclick="maintainShifter()">Manter Transformação (-${titan.pdeMaintain} PDE)</button>`
          : `<button class="primary" onclick="transformShifter()">Transformar (-${titan.pdeTransform} PDE)</button><button onclick="transformShifterAgain()" ${ch.shifter.controlLevel < 2 ? 'disabled title="Requer Nível 2 de Controle"' : ''}>2ª Transformação do Dia (-${titan.pdeTransform * 2} PDE)</button>`}
      </div>
    </div>

    <div class="grid grid-2" style="margin-top:16px;">
      ${buildShifterPartBar(ch, 'nuca', 'Nuca')}
      ${buildShifterPartBar(ch, 'bracoD', 'Braço Direito')}
      ${buildShifterPartBar(ch, 'bracoE', 'Braço Esquerdo')}
      ${buildShifterPartBar(ch, 'pernaD', 'Perna Direita')}
      ${buildShifterPartBar(ch, 'pernaE', 'Perna Esquerda')}
      ${buildShifterPartBar(ch, 'cabeca', 'Cabeça (6º membro)')}
    </div>
    <p style="color:var(--text-dim);font-size:0.78rem;margin-top:8px;">A Cabeça só aparece em combates com mais de um Titã. Só sofre dano de outros Titãs ou armamentos de grande impacto. Ao chegar a 0, o portador desmaia e o Titã fica atordoado e Vulnerável (qualquer ataque é acerto garantido e crítico, sem esquiva ou bloqueio) até metade da Cabeça regenerar.</p>

    <div style="margin-top:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <h4 style="color:var(--accent);margin:0;">Habilidades do Titã</h4>
        <button class="small" onclick="openShifterAbilityModal()">Adicionar Habilidade Customizada</button>
      </div>
      <div style="margin-top:10px;">
        ${abilitiesHtml || '<p class="empty-note">Este Titã não possui habilidades cadastradas.</p>'}
        ${customAbilitiesHtml}
      </div>
    </div>`;
}

function buildShifterPartBar(ch, part, label) {
  const p = ch.shifter.parts[part] || { cur: 0, max: 0 };
  const pct = p.max > 0 ? Math.min(100, (p.cur / p.max) * 100) : 0;
  const barClass = pct <= 25 ? ' crit' : pct <= 50 ? ' low' : '';
  return `<div class="mini-card">
    <h4 style="margin-bottom:8px;">${label}</h4>
    <div style="font-family:var(--mono);">${p.cur} / ${p.max}</div>
    <div class="resource-bar"><div class="resource-fill${barClass}" style="width:${pct}%;"></div></div>
    <div class="resource-controls">
      <button onclick="modShifterPart('${part}', -10)">-10</button>
      <button onclick="modShifterPart('${part}', -1)">-1</button>
      <button onclick="modShifterPart('${part}', 1)">+1</button>
      <button onclick="modShifterPart('${part}', 10)">+10</button>
    </div>
  </div>`;
}

function modShifterPart(part, delta) {
  const ch = getCurrentChar(); if (!ch) return;
  const p = ch.shifter.parts[part]; if (!p) return;
  p.cur = Math.max(0, Math.min(p.max, p.cur + delta));
  ch.updatedAt = new Date().toISOString(); saveChars(); renderShifterTab();
}

function transformShifter(chParam) {
  const ch = chParam || getCurrentChar(); if (!ch) return;
  const titan = getTitanById(ch.shifter.titanId); if (!titan) { showNotification('Selecione um Titã primeiro.', '', true); return; }
  if (ch.resources.sta.cur < titan.pdeTransform) { showNotification('PDE insuficiente para transformar.', '', true); return; }
  ch.resources.sta.cur -= titan.pdeTransform;
  ch.shifter.transformed = true;
  ch.updatedAt = new Date().toISOString(); saveChars();
  if (currentCharId === ch.id) { updateResourceUI(); renderShifterTab(); }
  refreshEncontroIfVisible();
  showNotification('Transformação ativada.', titan.name);
}

function transformShifterAgain(chParam) {
  const ch = chParam || getCurrentChar(); if (!ch) return;
  const titan = getTitanById(ch.shifter.titanId); if (!titan) { showNotification('Selecione um Titã primeiro.', '', true); return; }
  if (ch.shifter.controlLevel < 2) { showNotification('Requer Nível 2 de Controle ou superior.', '', true); return; }
  const cost = titan.pdeTransform * 2;
  if (ch.resources.sta.cur < cost) { showNotification('PDE insuficiente para a segunda transformação.', '', true); return; }
  ch.resources.sta.cur -= cost;
  ch.shifter.transformed = true;
  ch.updatedAt = new Date().toISOString(); saveChars();
  if (currentCharId === ch.id) { updateResourceUI(); renderShifterTab(); }
  refreshEncontroIfVisible();
  showNotification('Segunda transformação do dia ativada.', titan.name);
}

function maintainShifter(chParam) {
  const ch = chParam || getCurrentChar(); if (!ch) return;
  const titan = getTitanById(ch.shifter.titanId); if (!titan) return;
  if (ch.resources.sta.cur < titan.pdeMaintain) { showNotification('PDE insuficiente para manter a transformação.', '', true); return; }
  ch.resources.sta.cur -= titan.pdeMaintain;
  ch.updatedAt = new Date().toISOString(); saveChars();
  if (currentCharId === ch.id) { updateResourceUI(); renderShifterTab(); }
  refreshEncontroIfVisible();
}

function detransformShifter(chParam) {
  const ch = chParam || getCurrentChar(); if (!ch) return;
  ch.shifter.transformed = false;
  ch.updatedAt = new Date().toISOString(); saveChars();
  if (currentCharId === ch.id) renderShifterTab();
  refreshEncontroIfVisible();
}

function refreshEncontroIfVisible() {
  const escudo = document.getElementById('screenEscudo');
  if (escudo && !escudo.classList.contains('hidden')) renderEscudoEncontro();
}

function openShifterAbilityModal() {
  document.getElementById('shifterAbilityName').value = '';
  document.getElementById('shifterAbilityDesc').value = '';
  document.getElementById('shifterAbilityModal').classList.remove('hidden');
}
function closeShifterAbilityModal() { document.getElementById('shifterAbilityModal').classList.add('hidden'); }

function saveShifterCustomAbility() {
  const ch = getCurrentChar(); if (!ch) return;
  const name = document.getElementById('shifterAbilityName').value.trim();
  const description = document.getElementById('shifterAbilityDesc').value.trim();
  if (!name || !description) { showNotification('Preencha nome e descrição.', '', true); return; }
  if (!ch.shifter.customAbilities) ch.shifter.customAbilities = [];
  ch.shifter.customAbilities.push({ name, description });
  ch.updatedAt = new Date().toISOString(); saveChars();
  closeShifterAbilityModal(); renderShifterTab();
  showNotification('Habilidade adicionada ao Titã.', name);
}

function removeShifterCustomAbility(idx) {
  const ch = getCurrentChar(); if (!ch) return;
  ch.shifter.customAbilities.splice(idx, 1);
  ch.updatedAt = new Date().toISOString(); saveChars(); renderShifterTab();
}

function openTitanCreatorModal() {
  ['titNameCreate', 'titHeight', 'titDescription', 'titAtaqueTest', 'titAtaqueDano', 'titRegen', 'titAbilities'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('titPdvNuca').value = 90;
  document.getElementById('titPdvBraco').value = 50;
  document.getElementById('titPdvPerna').value = 50;
  document.getElementById('titAgi').value = 6; document.getElementById('titSta').value = 6;
  document.getElementById('titStr').value = 6; document.getElementById('titVit').value = 6;
  document.getElementById('titDeslocamento').value = 8;
  document.getElementById('titPdeTransform').value = 8;
  document.getElementById('titPdeMaintain').value = 5;
  document.getElementById('titanCreatorModal').classList.remove('hidden');
}
function closeTitanCreatorModal() { document.getElementById('titanCreatorModal').classList.add('hidden'); }

function saveCustomTitan() {
  const name = document.getElementById('titNameCreate').value.trim();
  if (!name) { showNotification('Nome do Titã é obrigatório.', '', true); return; }
  const id = 'custom_titan_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now().toString(36);
  const abilitiesText = document.getElementById('titAbilities').value.trim();
  const abilities = abilitiesText ? abilitiesText.split('\n').filter(l => l.trim()).map(line => {
    const idx = line.indexOf(':');
    return idx > -1 ? { name: line.slice(0, idx).trim(), description: line.slice(idx + 1).trim() } : { name: line.trim(), description: '' };
  }) : [];
  const titan = {
    id, name, custom: true,
    height: document.getElementById('titHeight').value.trim() || 'Não especificada',
    description: document.getElementById('titDescription').value.trim() || 'Titã customizado.',
    pdvNuca: parseInt(document.getElementById('titPdvNuca').value) || 0,
    pdvBraco: parseInt(document.getElementById('titPdvBraco').value) || 0,
    pdvPerna: parseInt(document.getElementById('titPdvPerna').value) || 0,
    attrs: {
      agi: parseInt(document.getElementById('titAgi').value) || 0,
      sta: parseInt(document.getElementById('titSta').value) || 0,
      str: parseInt(document.getElementById('titStr').value) || 0,
      vit: parseInt(document.getElementById('titVit').value) || 0
    },
    ataque: { test: document.getElementById('titAtaqueTest').value.trim() || 'Força', dano: document.getElementById('titAtaqueDano').value.trim() || 'Não definido', desvantagem: false },
    deslocamentoBase: parseInt(document.getElementById('titDeslocamento').value) || 0,
    pdeTransform: parseInt(document.getElementById('titPdeTransform').value) || 0,
    pdeMaintain: parseInt(document.getElementById('titPdeMaintain').value) || 0,
    regen: document.getElementById('titRegen').value.trim() || 'Não definida',
    abilities
  };
  customTitans.push(titan);
  saveCustomTitans();
  closeTitanCreatorModal();
  renderShifterTab();
  showNotification('Titã customizado criado.', name);
}

function genId() { return 'mod_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8); }

function ensureCharDefaults(ch) {
  if (!ch.talentsDefects) ch.talentsDefects = [];
  if (!ch.sessionState) ch.sessionState = { pressentimentoUsed: 0, azaradoUsed: false, vicioUnsatisfiedSessions: 0 };
  if (!ch.derivedModifiers) ch.derivedModifiers = { defesaEsquiva: 0, critMargin: 0, sanDamageReduction: 0, bodyDamageReduction: 0 };
  if (!ch.skillFlags) ch.skillFlags = {};
  if (!ch.originAbilityManualUnlock) ch.originAbilityManualUnlock = false;
  if (ch.originAbilityChoice === undefined) ch.originAbilityChoice = null;
  if (!ch.originChoices) ch.originChoices = {};
  if (!ch.customSkills) ch.customSkills = [];
  if (!ch.abilities) ch.abilities = [];
  if (ch.abilityLevel === undefined) ch.abilityLevel = 1;
  if (!ch.inventory) ch.inventory = { personal: { items: [], capacity: 20 }, mount: { items: [], capacity: 20 } };
  if (!ch.inventory.personal.capacityModifiers) ch.inventory.personal.capacityModifiers = [];
  ch.inventory.personal.capacityModifiers.forEach(m => { if (!m.id) m.id = genId(); });
  ch.skills.forEach(s => {
    if (!s.modifiers) s.modifiers = [];
    s.modifiers.forEach(m => { if (!m.id) m.id = genId(); });
  });
  if (!ch.resourceModifiers) ch.resourceModifiers = { hp: [], sta: [], san: [] };
  ['hp', 'sta', 'san'].forEach(k => {
    if (!ch.resourceModifiers[k]) ch.resourceModifiers[k] = [];
    ch.resourceModifiers[k].forEach(m => { if (!m.id) m.id = genId(); });
  });
  if (!ch.resources) ch.resources = {};
  if (!ch.dmt) ch.dmt = { type: 'Tradicional', cylinderCapacity: 20, cylinder1: 20, cylinder2: 20 };
  if (ch.dmt.cylinderCapacity === undefined) ch.dmt.cylinderCapacity = 20;
  if (ch.dmt.cylinder1 === undefined) ch.dmt.cylinder1 = ch.dmt.cylinderCapacity;
  if (ch.dmt.cylinder2 === undefined) ch.dmt.cylinder2 = ch.dmt.cylinderCapacity;
  if (ch.dmt.bladeAttacksUsed === undefined) ch.dmt.bladeAttacksUsed = 0;
  if (ch.dmt.bladeReserve === undefined) ch.dmt.bladeReserve = 2;
  if (ch.dmt.bladesEquipped === undefined) ch.dmt.bladesEquipped = true;
  if (!ch.dmt.weaponType) ch.dmt.weaponType = 'laminas';
  if (ch.dmt.cannonAmmo === undefined) ch.dmt.cannonAmmo = 10;
  if (ch.imageUrl === undefined) ch.imageUrl = null;
  if (!ch.shifter) ch.shifter = { isShifter: false, titanId: null, controlLevel: 1, transformed: false, parts: {}, customAbilities: [], imageUrl: null };
  if (!ch.shifter.parts) ch.shifter.parts = {};
  if (!ch.shifter.customAbilities) ch.shifter.customAbilities = [];
  if (ch.shifter.imageUrl === undefined) ch.shifter.imageUrl = null;
  if (!ch.quickAttacks) ch.quickAttacks = [];
  if (!ch.conditions) ch.conditions = {};
  if (!ch.conditions.adrenalina) ch.conditions.adrenalina = { active: false, tier: null };
  if (!ch.conditions.sangramento) ch.conditions.sangramento = { active: false };
  if (!ch.conditions.morrendo) ch.conditions.morrendo = { active: false, danoAdicional: 0 };
  if (!ch.conditions.vulneravel) ch.conditions.vulneravel = { active: false };
  if (!ch.conditions.enlouquecendo) ch.conditions.enlouquecendo = { active: false };
  if (!ch.conditions.fadiga) ch.conditions.fadiga = { points: 0 };
  if (!ch.conditions.traumatizado) ch.conditions.traumatizado = { active: false, desc: '' };
  if (!ch.conditions.perdaMembros) ch.conditions.perdaMembros = { perna: false, braco: false };
  if (!ch.conditions.ferido) ch.conditions.ferido = { active: false };
}

/* ============================================================
   RECÁLCULO CENTRAL — MODIFICADORES DE ORIGEM, TALENTOS, DEFEITOS
   ============================================================ */
function recalcAllModifiers(ch) {
  ensureCharDefaults(ch);
  ch.attributeBonuses = { agi: 0, sta: 0, str: 0, int: 0, vit: 0 };
  ch.derivedModifiers = { defesaEsquiva: 0, critMargin: 0, sanDamageReduction: 0, bodyDamageReduction: 0, testesAcerto: 0, movementFlat: 0 };
  ch.skillFlags = {};
  ch.skills.forEach(s => { s.modifiers = (s.modifiers || []).filter(m => m.sourceType === 'manual'); });

  const originData = getOriginById(ch.originId);
  if (originData && originData.passive && originData.passive.effects) {
    originData.passive.effects.forEach(e => {
      if (e.type === 'attribute') ch.attributeBonuses[e.attribute] = (ch.attributeBonuses[e.attribute] || 0) + e.value;
    });
  }

  (ch.talentsDefects || []).forEach(td => {
    const def = findTDDef(td.itemId);
    if (!def) return;
    (def.automatic || []).forEach(eff => {
      if (eff.type === 'attribute') {
        ch.attributeBonuses[eff.target] = (ch.attributeBonuses[eff.target] || 0) + eff.value;
      } else if (eff.type === 'skill') {
        const skill = ch.skills.find(s => s.name === eff.target);
        if (skill) skill.modifiers.push({ id: genId(), source: `${def.category === 'talent' ? 'Talento' : 'Defeito'}: ${def.name}`, sourceType: def.category, value: eff.value, ignoresCap: false });
      } else if (eff.type === 'derived') {
        ch.derivedModifiers[eff.target] = (ch.derivedModifiers[eff.target] || 0) + eff.value;
      } else if (eff.type === 'flag') {
        ch.skillFlags[eff.target] = eff.value;
      }
    });
    if (def.choiceEffect && td.choiceValue) {
      if (def.choiceEffect.type === 'skill') {
        const skill = ch.skills.find(s => s.name === td.choiceValue);
        if (skill) skill.modifiers.push({ id: genId(), source: `Talento: ${def.name}`, sourceType: def.category, value: def.choiceEffect.value, ignoresCap: !!def.choiceEffect.ignoresCap });
      }
    }
  });

  (ch.abilities || []).forEach(acquired => {
    const ability = findAbility(acquired.id);
    if (!ability) return;
    if (ability.repeatableChoice && acquired.repeatableChoices && acquired.repeatableChoices.length) {
      acquired.repeatableChoices.forEach(skillName => {
        const skill = ch.skills.find(s => s.name === skillName);
        if (skill) skill.modifiers.push({ id: genId(), source: `Habilidade: ${ability.name}`, sourceType: 'ability', value: 1, ignoresCap: false });
      });
    }
  });

  const fadigaPoints = ch.conditions.fadiga.points || 0;
  if (fadigaPoints >= 1) ch.derivedModifiers.testesAcerto -= 1;
  if (fadigaPoints >= 2) ch.skills.forEach(s => s.modifiers.push({ id: genId(), source: 'Fadiga (2+)', sourceType: 'condition', value: -1, ignoresCap: false }));
  if (fadigaPoints >= 3) ch.attributeBonuses.agi -= 1;
  if (fadigaPoints >= 5) ch.derivedModifiers.testesAcerto -= 1;
  if (fadigaPoints >= 7) { ch.attributeBonuses.agi -= 1; ch.attributeBonuses.sta -= 1; ch.attributeBonuses.str -= 1; ch.attributeBonuses.int -= 1; ch.attributeBonuses.vit -= 1; }

  if (ch.conditions.ferido.active) { ch.derivedModifiers.testesAcerto -= 2; ch.derivedModifiers.movementFlat -= 4; }

  recalculateResources(ch);
  if (ch.shifter && ch.shifter.isShifter && ch.shifter.titanId) recomputeShifterParts(ch);
}

/* ============================================================
   CRIAÇÃO DE PERSONAGEM (WIZARD)
   ============================================================ */
function initializeCreationState() {
  creationState = {
    currentStep: 1, name: '', player: '', campaign: '', alignment: '', originId: null,
    attributes: { agi: 0, sta: 0, str: 0, int: 0, vit: 0 },
    availableValues: [4, 3, 2, 2, 1], selectedValue: null, transferUsed: false, transferConfirmed: false, skills: {}
  };
  const statusEl = document.getElementById('transferStatus');
  if (statusEl) { statusEl.textContent = ''; statusEl.style.color = ''; statusEl.style.fontWeight = ''; }
}

function createNewCharacter() {
  initializeCreationState();
  document.getElementById('screenHome').classList.add('hidden');
  document.getElementById('screenWizard').classList.remove('hidden');
  document.getElementById('screenSheet').classList.add('hidden');
  document.getElementById('btnBackHeader').classList.remove('hidden');
  showWizardStep(1);
}

function saveWizardCharacter() {
  const originData = getOriginById(creationState.originId);
  const newChar = {
    id: Date.now().toString(), name: creationState.name, player: creationState.player,
    campaign: creationState.campaign, alignment: creationState.alignment, level: 0, exp: 0,
    originId: creationState.originId, originData: originData, class: '', subclass: null,
    attributes: { ...creationState.attributes }, attributeBonuses: { agi: 0, sta: 0, str: 0, int: 0, vit: 0 },
    skills: SKILL_LIST.map(s => ({ name: s.name, base: creationState.skills[s.name] || 0, bonus: 0, modifiers: [], selectedAttribute: SKILLS_DATA[s.name]?.attributes[0] || 'int' })),
    skillPointsGained: 6,
    resources: {
      hp: { cur: originData.initialStats.pdv, max: originData.initialStats.pdv },
      sta: { cur: originData.initialStats.pde, max: originData.initialStats.pde },
      san: { cur: originData.initialStats.san, max: originData.initialStats.san }
    },
    originPassive: { ...originData.passive, acquired: true },
    originAbility: null, originChoices: {}, originAbilityManualUnlock: false,
    abilities: [], abilityLevel: 1, customSkills: [],
    inventory: { personal: { items: [], capacity: 20 }, mount: { items: [], capacity: 20 } },
    talentsDefects: [], sessionState: { pressentimentoUsed: 0, azaradoUsed: false, vicioUnsatisfiedSessions: 0 },
    derivedModifiers: { defesaEsquiva: 0, critMargin: 0, sanDamageReduction: 0, bodyDamageReduction: 0 }, skillFlags: {},
    info: {}, history: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  characters.push(newChar);
  saveChars();
  creationState = null;
  renderCharList();
  openChar(newChar.id);
}

function duplicateChar(id) {
  const original = characters.find(c => c.id === id);
  if (!original) return;
  const copy = JSON.parse(JSON.stringify(original));
  copy.id = Date.now().toString();
  copy.name = original.name + ' (Cópia)';
  copy.createdAt = new Date().toISOString();
  copy.updatedAt = new Date().toISOString();
  characters.push(copy);
  saveChars();
  renderCharList();
}

function deleteChar(id) {
  showConfirm('Tem certeza que deseja excluir esta ficha?', () => {
    characters = characters.filter(c => c.id !== id);
    saveChars();
    renderCharList();
    showHome();
  });
}

function exportChar(id) {
  const ch = characters.find(c => c.id === id);
  if (!ch) return;
  const blob = new Blob([JSON.stringify(ch, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${ch.name.replace(/\s+/g, '_')}.json`; a.click();
  URL.revokeObjectURL(url);
}

function importChar(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      data.id = Date.now().toString();
      data.updatedAt = new Date().toISOString();
      ensureCharDefaults(data);
      recalcAllModifiers(data);
      characters.push(data);
      saveChars();
      renderCharList();
      showNotification('Ficha importada com sucesso.', '');
    } catch { showNotification('Erro ao importar ficha.', 'Verifique o arquivo JSON.', true); }
  };
  reader.readAsText(file);
}

function calculatePDVGain(originId, vitality) {
  const originData = getOriginById(originId); if (!originData) return 0;
  return Math.floor(originData.initialStats.pdv / 2) + vitality;
}
function calculatePDEGain(originId, stamina) {
  const originData = getOriginById(originId); if (!originData) return 0;
  return Math.floor(originData.initialStats.pde / 2) + stamina;
}
function countPDVGains(level) { let c = 0; for (let l = 2; l <= level; l++) if ((PROGRESSION[l] || []).includes('pdv')) c++; return c; }
function countPDEGains(level) { let c = 0; for (let l = 2; l <= level; l++) if ((PROGRESSION[l] || []).includes('pde')) c++; return c; }

function sumResourceModifiers(ch, key) {
  return ((ch.resourceModifiers && ch.resourceModifiers[key]) || []).reduce((sum, m) => sum + m.value, 0);
}

function recalculateResources(ch) {
  if (!ch.originId) return;
  ensureCharDefaults(ch);
  const originData = getOriginById(ch.originId);
  const vitality = ch.attributes.vit + (ch.attributeBonuses.vit || 0);
  const stamina = ch.attributes.sta + (ch.attributeBonuses.sta || 0);
  const int = ch.attributes.int + (ch.attributeBonuses.int || 0);
  const baseHP = originData.initialStats.pdv, baseSTA = originData.initialStats.pde, baseSAN = originData.initialStats.san;
  const pdvGains = countPDVGains(ch.level), pdeGains = countPDEGains(ch.level);
  const pdvGainPerLevel = calculatePDVGain(ch.originId, vitality);
  const pdeGainPerLevel = calculatePDEGain(ch.originId, stamina);
  const vitPDVBonus = vitality * 2, intSANBonus = int;
  const maxHP = baseHP + vitPDVBonus + (pdvGains * pdvGainPerLevel) + sumResourceModifiers(ch, 'hp');
  const maxSTA = baseSTA + stamina + (pdeGains * pdeGainPerLevel) + sumResourceModifiers(ch, 'sta');
  const maxSAN = baseSAN + intSANBonus + sumResourceModifiers(ch, 'san');
  ch.resources.hp.max = Math.max(0, maxHP);
  ch.resources.sta.max = Math.max(0, maxSTA);
  ch.resources.san.max = Math.max(0, maxSAN);
  ['hp', 'sta', 'san'].forEach(k => {
    if (ch.resources[k].cur > ch.resources[k].max) ch.resources[k].cur = ch.resources[k].max;
    if (ch.resources[k].cur < 0) ch.resources[k].cur = 0;
  });
}

function calculateSkill(skillId, ch) {
  const skill = ch.skills.find(s => SKILLS_DATA[s.name]?.id === skillId || s.name.toLowerCase() === skillId);
  if (!skill) return null;
  const skillData = SKILLS_DATA[skill.name];
  const selectedAttr = skill.selectedAttribute || skillData?.attributes[0] || 'int';
  const attrValue = ch.attributes[selectedAttr] + (ch.attributeBonuses[selectedAttr] || 0);
  const attrBonus = Math.floor(attrValue / 2);
  const investedPoints = skill.base;
  const modifiers = getSkillModifiers(ch, skill.name);
  const bonusTotal = modifiers.reduce((sum, mod) => sum + mod.value, 0);
  const total = attrBonus + investedPoints + bonusTotal;
  return { skillId: skillData?.id || skill.name.toLowerCase(), skillName: skill.name, selectedAttribute: selectedAttr, attributeValue: attrValue, attributeBonus: attrBonus, investedPoints, modifiers, bonusTotal, total };
}

function getSkillModifiers(ch, skillName) {
  const modifiers = [];
  if (ch.subclass && SUBCLASS_BONUSES[ch.subclass]) {
    const bonuses = SUBCLASS_BONUSES[ch.subclass];
    if (bonuses.skills && bonuses.skills[skillName]) {
      modifiers.push({ source: `Subclasse: ${ch.subclass}`, value: bonuses.skills[skillName], ignoresCap: bonuses.ignoreLimit && bonuses.ignoreLimit.includes(skillName) });
    }
  }
  ch.abilities.forEach(ability => {
    if (ability.skillModifiers) {
      const mod = ability.skillModifiers.find(m => m.skill === skillName);
      if (mod) modifiers.push({ source: `Habilidade: ${ability.name}`, value: mod.value, ignoresCap: mod.ignoresCap || false });
    }
  });
  const skill = ch.skills.find(s => s.name === skillName);
  if (skill && skill.modifiers) skill.modifiers.forEach(mod => modifiers.push(mod));
  return modifiers;
}

function getSkillLimit(ch) {
  const level = ch.level;
  if (level <= 3) return 3; if (level <= 8) return 5; if (level <= 15) return 10; return 15;
}
function canAddSkillPoint(ch, skillName) {
  const skill = ch.skills.find(s => s.name === skillName); if (!skill) return false;
  const limit = getSkillLimit(ch);
  const modifiers = getSkillModifiers(ch, skillName);
  const ignoresCap = modifiers.some(m => m.ignoresCap);
  if (ignoresCap) return true;
  return skill.base < limit;
}

function showNotification(title, message, isError) {
  const existing = document.querySelector('.notification'); if (existing) existing.remove();
  const n = document.createElement('div');
  n.className = 'notification' + (isError ? ' error' : '');
  n.innerHTML = `<h4>${title}</h4>${message ? `<p>${message}</p>` : ''}`;
  document.body.appendChild(n);
  setTimeout(() => { n.remove(); }, 4000);
}

let pendingConfirmCallback = null;
function showConfirm(message, onConfirm) {
  document.getElementById('confirmModalMessage').textContent = message;
  pendingConfirmCallback = onConfirm;
  document.getElementById('confirmModal').classList.remove('hidden');
}
function closeConfirmModal() { document.getElementById('confirmModal').classList.add('hidden'); pendingConfirmCallback = null; }
function confirmModalYes() {
  const cb = pendingConfirmCallback;
  closeConfirmModal();
  if (cb) cb();
}

function showAttrPopover(attrKey, event) {
  const ch = getCurrentChar(); if (!ch) return;
  const attr = ATTRIBUTES[attrKey];
  const value = ch.attributes[attrKey] + (ch.attributeBonuses[attrKey] || 0);
  const popover = document.getElementById('attrPopover');
  popover.innerHTML = `<h4>${attr.name}</h4><div class="value">${value}</div><p>${attr.description}</p>`;
  popover.classList.remove('hidden');
  popover.style.left = Math.min(event.pageX + 10, window.innerWidth - 380) + 'px';
  popover.style.top = Math.min(event.pageY + 10, window.innerHeight - 280) + 'px';
}

function showSkillPopover(skillName, event) {
  const ch = getCurrentChar(); if (!ch) return;
  const skillData = SKILLS_DATA[skillName]; if (!skillData) return;
  const result = calculateSkill(skillData.id, ch); if (!result) return;
  const popover = document.getElementById('skillPopover');
  popover.innerHTML = `<h4>${skillData.name}</h4><div class="value">${result.total}</div><p>${skillData.description}</p><p style="margin-top:8px;"><strong>Atributo:</strong> ${ATTRIBUTES[result.selectedAttribute].name} ${result.attributeValue} (metade: +${result.attributeBonus})</p><p><strong>Investido:</strong> +${result.investedPoints}</p>${result.bonusTotal ? `<p><strong>Bônus:</strong> +${result.bonusTotal}</p>` : ''}`;
  popover.classList.remove('hidden');
  popover.style.left = Math.min(event.pageX + 10, window.innerWidth - 380) + 'px';
  popover.style.top = Math.min(event.pageY + 10, window.innerHeight - 280) + 'px';
}

function hidePopovers() { document.getElementById('attrPopover').classList.add('hidden'); document.getElementById('skillPopover').classList.add('hidden'); }
document.addEventListener('click', (e) => { if (!e.target.closest('.attr-card') && !e.target.closest('.skill-name') && !e.target.closest('.popover')) hidePopovers(); });
document.addEventListener('click', (e) => {
  if (e.target.classList && (e.target.classList.contains('modal-overlay') || e.target.classList.contains('overlay-modal'))) {
    e.target.classList.add('hidden');
  }
});

function showWizardStep(step) {
  if (!creationState) initializeCreationState();
  creationState.currentStep = step;
  document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
  document.querySelector(`.wizard-step[data-step="${step}"]`).classList.add('active');
  window.scrollTo(0, 0);
  if (step === 1) {
    document.getElementById('wizardName').value = creationState.name;
    document.getElementById('wizardPlayer').value = creationState.player;
    document.getElementById('wizardCampaign').value = creationState.campaign;
    document.getElementById('wizardAlignment').value = creationState.alignment;
  }
  if (step === 2) renderOriginSelection();
  if (step === 3) renderAttributeDistribution();
  if (step === 4) renderWizardSkills();
}

function nextWizardStep(step) {
  if (step === 2) {
    creationState.name = document.getElementById('wizardName').value.trim();
    creationState.player = document.getElementById('wizardPlayer').value.trim();
    creationState.campaign = document.getElementById('wizardCampaign').value.trim();
    creationState.alignment = document.getElementById('wizardAlignment').value.trim();
    if (!creationState.name) { showNotification('Nome obrigatório', '', true); return; }
  }
  if (step === 3 && !creationState.originId) { showNotification('Escolha uma Origem', '', true); return; }
  if (step === 4) {
    const allAssigned = Object.values(creationState.attributes).every(v => v > 0);
    if (!allAssigned) { showNotification('Distribua todos os atributos', '', true); return; }
  }
  showWizardStep(step);
}
function prevWizardStep() { if (!creationState || creationState.currentStep <= 1) return; showWizardStep(creationState.currentStep - 1); }

function toggleOriginExpand(originId, event) {
  if (event) event.stopPropagation();
  expandedOriginId = expandedOriginId === originId ? null : originId;
  renderOriginSelection();
}

function renderOriginSelection() {
  const container = document.getElementById('originSelection');
  container.innerHTML = '';
  Object.values(getAllOrigins()).forEach(origin => {
    const div = document.createElement('div');
    div.className = 'origin-option' + (creationState.originId === origin.id ? ' selected' : '');
    div.onclick = () => { creationState.originId = origin.id; renderOriginSelection(); document.getElementById('btnStep2Next').disabled = !creationState.originId; };
    let expandedContent = '';
    if (expandedOriginId === origin.id) {
      const choicesText = formatOriginChoices(origin.passive.choices);
      expandedContent = `<div class="origin-expanded">
        <h5>Status Iniciais</h5>
        <div class="origin-stats"><span class="origin-stat pdv">${origin.initialStats.pdv} PDV</span><span class="origin-stat san">${origin.initialStats.san} SAN</span><span class="origin-stat pde">${origin.initialStats.pde} PDE</span></div>
        <h5>Passiva de Origem</h5>
        <p><strong>${origin.passive.name}:</strong> ${origin.passive.description}</p>
        ${origin.passive.choices ? `<p style="color:var(--warning);"><strong>Escolha necessária:</strong> ${choicesText}</p>` : ''}
        <h5>Habilidade de Origem — Nível ${origin.originAbility.unlockLevel}</h5>
        <p><strong>${origin.originAbility.name}:</strong> ${origin.originAbility.description}</p>
        ${origin.originAbility.manualUnlock ? `<p style="color:var(--info);">Desbloqueio manual/narrativo</p>` : ''}
      </div>`;
    }
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <h4>${origin.name}${origin.custom ? ' <span class="tag class">Custom</span>' : ''}</h4>
        <button class="small" onclick="toggleOriginExpand('${origin.id}', event)">${expandedOriginId === origin.id ? 'Ocultar' : 'Detalhes'}</button>
      </div>
      <p style="font-size:0.78rem;color:var(--text-dim);">${origin.family ? `Família: ${origin.family}` : ''}</p>
      <p>${origin.description.substring(0, 100)}...</p>
      <div class="origin-stats"><span class="origin-stat pdv">${origin.initialStats.pdv}</span><span class="origin-stat san">${origin.initialStats.san}</span><span class="origin-stat pde">${origin.initialStats.pde}</span></div>
      <div style="margin-top:10px;font-size:0.8rem;"><span class="tag passive">Passiva</span><span class="tag origin">Hab. N${origin.originAbility.unlockLevel}</span></div>
      ${origin.custom ? `<button class="small danger" style="margin-top:10px;" onclick="deleteCustomFamily('${origin.id}', event)">Excluir Família</button>` : ''}
      ${expandedContent}`;
    container.appendChild(div);
  });
  document.getElementById('btnStep2Next').disabled = !creationState.originId;
}

function renderAttributeDistribution() {
  const valuesContainer = document.getElementById('attributeValues');
  const distContainer = document.getElementById('attributeDistribution');
  valuesContainer.innerHTML = ''; distContainer.innerHTML = '';
  creationState.availableValues.forEach((val, idx) => {
    const div = document.createElement('div');
    div.className = 'attribute-value' + (creationState.selectedValue === idx ? ' selected' : '') + (val === null ? ' used' : '');
    div.textContent = val === null ? '\u2713' : val;
    div.onclick = () => { if (val !== null) { creationState.selectedValue = idx; renderAttributeDistribution(); } };
    valuesContainer.appendChild(div);
  });
  const attrs = [
    { key: 'agi', name: 'Agilidade', hint: v => `+${v}m de deslocamento` },
    { key: 'sta', name: 'Estâmina', hint: v => `+${v} PDE` },
    { key: 'str', name: 'Força', hint: v => `+${v} espaços de inventário` },
    { key: 'int', name: 'Intelecto', hint: v => `+${v} pontos de perícia, +${v} SAN` },
    { key: 'vit', name: 'Vitalidade', hint: v => `+${v * 2} PDV` }
  ];
  attrs.forEach(attr => {
    const div = document.createElement('div');
    div.className = 'attribute-dist-item';
    const val = creationState.attributes[attr.key];
    div.innerHTML = `<h4>${attr.name}</h4><div class="value">${val}</div>${val > 0 ? `<div style="font-size:0.72rem;color:var(--accent);margin-bottom:8px;">${attr.hint(val)}</div>` : ''}<button onclick="assignValueToAttribute('${attr.key}')" ${creationState.selectedValue === null || val > 0 ? 'disabled' : ''}>Atribuir</button>`;
    distContainer.appendChild(div);
  });
  const allAssigned = Object.values(creationState.attributes).every(v => v > 0);
  document.getElementById('btnStep3Next').disabled = !allAssigned;
  if (allAssigned && !creationState.transferConfirmed) { document.getElementById('transferSection').classList.remove('hidden'); setupTransferSelects(); }
  else if (creationState.transferConfirmed) { document.getElementById('transferSection').classList.add('hidden'); }
}

function assignValueToAttribute(attrKey) {
  if (creationState.selectedValue === null) return;
  if (creationState.attributes[attrKey] > 0) return;
  const value = creationState.availableValues[creationState.selectedValue];
  if (value === null) return;
  creationState.attributes[attrKey] = value;
  creationState.availableValues[creationState.selectedValue] = null;
  creationState.selectedValue = null;
  renderAttributeDistribution();
}

function resetAttributeDistribution() {
  creationState.attributes = { agi: 0, sta: 0, str: 0, int: 0, vit: 0 };
  creationState.availableValues = [4, 3, 2, 2, 1];
  creationState.selectedValue = null; creationState.transferUsed = false; creationState.transferConfirmed = false;
  const statusEl = document.getElementById('transferStatus');
  if (statusEl) { statusEl.textContent = ''; statusEl.style.color = ''; statusEl.style.fontWeight = ''; }
  renderAttributeDistribution();
}

function setupTransferSelects() {
  const fromSelect = document.getElementById('wizardTransferFrom'), toSelect = document.getElementById('wizardTransferTo');
  fromSelect.innerHTML = ''; toSelect.innerHTML = '';
  const attrs = [{ key: 'agi', name: 'Agilidade' }, { key: 'sta', name: 'Estâmina' }, { key: 'str', name: 'Força' }, { key: 'int', name: 'Intelecto' }, { key: 'vit', name: 'Vitalidade' }];
  attrs.forEach(attr => {
    const f = document.createElement('option'); f.value = attr.key; f.textContent = attr.name; fromSelect.appendChild(f);
    const t = document.createElement('option'); t.value = attr.key; t.textContent = attr.name; toSelect.appendChild(t);
  });
}

function applyAttributeTransfer() {
  if (creationState.transferUsed || creationState.transferConfirmed) return;
  const from = document.getElementById('wizardTransferFrom').value, to = document.getElementById('wizardTransferTo').value;
  if (!from || !to || from === to) { showNotification('Selecione atributos válidos', '', true); return; }
  if (creationState.attributes[from] < 2) { showNotification('Atributo de origem precisa ter valor 2 ou mais', '', true); return; }
  creationState.attributes[from]--; creationState.attributes[to]++;
  creationState.transferUsed = true; creationState.transferConfirmed = true;
  document.getElementById('transferStatus').textContent = 'Transferência realizada.';
  document.getElementById('transferStatus').style.color = 'var(--success)';
  document.getElementById('transferStatus').style.fontWeight = '600';
  renderAttributeDistribution();
}
function skipTransfer() {
  creationState.transferConfirmed = true;
  document.getElementById('transferStatus').textContent = '';
  document.getElementById('transferSection').classList.add('hidden');
}

function renderWizardSkills() {
  const container = document.getElementById('wizardSkillList'); container.innerHTML = '';
  const totalPoints = Object.values(creationState.skills).reduce((a, b) => a + b, 0);
  document.getElementById('wizardSkillPoints').textContent = 6 - totalPoints;
  SKILL_LIST.forEach((skill) => {
    const currentPoints = creationState.skills[skill.name] || 0;
    const div = document.createElement('div'); div.className = 'skill-input-row';
    div.innerHTML = `<div style="flex:1;"><strong>${skill.name}</strong> <span style="color:var(--text-dim);">(${skill.attr.toUpperCase()})</span></div><button onclick="modWizardSkill('${skill.name}', -1)" ${currentPoints === 0 ? 'disabled' : ''}>-</button><span style="font-family:var(--mono);font-weight:700;font-size:1.05rem;min-width:26px;text-align:center;">${currentPoints}</span><button onclick="modWizardSkill('${skill.name}', 1)" ${currentPoints >= 3 || totalPoints >= 6 ? 'disabled' : ''}>+</button>`;
    container.appendChild(div);
  });
  document.getElementById('btnStep4Next').disabled = totalPoints !== 6;
}

function modWizardSkill(name, delta) {
  const currentPoints = Object.values(creationState.skills).reduce((a, b) => a + b, 0);
  const current = creationState.skills[name] || 0;
  if (delta > 0 && (current >= 3 || currentPoints >= 6)) return;
  if (delta < 0 && current <= 0) return;
  creationState.skills[name] = (creationState.skills[name] || 0) + delta;
  if (creationState.skills[name] === 0) delete creationState.skills[name];
  renderWizardSkills();
}
function finishWizard() { saveWizardCharacter(); }

/* ============================================================
   BIBLIOTECA DE HABILIDADES
   ============================================================ */
function openSkillLibrary() {
  const ch = getCurrentChar(); if (!ch) return;
  document.getElementById('libraryCharLevel').textContent = ch.level;
  document.getElementById('libraryCharClass').textContent = ch.class || 'Sem classe';
  document.getElementById('libraryCharSubclass').textContent = ch.subclass || 'Sem subclasse';
  document.getElementById('skillLibrarySearch').value = '';
  currentSkillFilter = 'all';
  renderSkillLibrary();
  document.getElementById('skillLibraryOverlay').classList.remove('hidden');
}
function closeSkillLibrary() { document.getElementById('skillLibraryOverlay').classList.add('hidden'); }

function setSkillFilter(filter, event) {
  currentSkillFilter = filter;
  document.querySelectorAll('#skillLibraryOverlay .lib-filters button').forEach(btn => btn.classList.remove('primary'));
  if (event) event.target.classList.add('primary');
  renderSkillLibrary();
}

function abilityMatchesFilter(ability, filter) {
  if (filter === 'all') return true;
  if (filter === 'general') return ability.scope === 'general';
  const subclassName = Object.keys(SUBCLASS_CATEGORY_KEY).find(k => SUBCLASS_CATEGORY_KEY[k] === filter);
  return ability.subclasses && ability.subclasses.includes(subclassName);
}

function renderSkillLibrary() {
  const ch = getCurrentChar(); if (!ch) return;
  const container = document.getElementById('skillLibraryGrid'); container.innerHTML = '';
  const searchTerm = document.getElementById('skillLibrarySearch').value.toLowerCase();
  const unlockedLevel = getAbilityLevelForCharLevel(ch.level);
  ABILITIES_DB.forEach(ability => {
    if (!abilityMatchesFilter(ability, currentSkillFilter)) return;
    if (searchTerm && !ability.name.toLowerCase().includes(searchTerm) && !ability.description.toLowerCase().includes(searchTerm)) return;
    const acquired = ch.abilities.some(s => s.id === ability.id);
    const eligible = ability.scope === 'general' || (ch.subclass && ability.subclasses.includes(ch.subclass));
    const scopeTag = ability.scope === 'general' ? `<span class="tag class">Geral</span>` : (ability.subclasses || []).map(s => `<span class="tag subclass">${s}</span>`).join('');
    const card = document.createElement('div'); card.className = 'mini-card';
    const firstLevelText = ability.levels && ability.levels.length ? ability.levels[0] : (ability.baseCost || '');
    card.innerHTML = `<h4>${ability.name}</h4><p>${scopeTag}${ability.passive ? '<span class="tag origin">Passiva</span>' : ''}</p><p class="desc">${ability.description}</p>${firstLevelText ? `<p style="font-size:0.78rem;color:var(--text-dim);margin-top:6px;">${firstLevelText}</p>` : ''}<button ${acquired || !eligible ? 'disabled' : ''} onclick="handleAcquireAbility('${ability.id}')" style="margin-top:12px;width:100%;">${acquired ? 'Adquirida' : (eligible ? 'Adicionar' : 'Requer Subclasse')}</button>`;
    container.appendChild(card);
  });
}

function handleAcquireAbility(abilityId) {
  const ability = findAbility(abilityId); if (!ability) return;
  if (ability.requiresChoice) { openAbilityChoiceModal(ability); return; }
  acquireSkillFromLibrary(abilityId, null);
}

let pendingAbilityChoice = null;
function openAbilityChoiceModal(ability) {
  pendingAbilityChoice = ability;
  document.getElementById('tdChoiceTitle').textContent = ability.name;
  const body = document.getElementById('tdChoiceBody');
  if (ability.requiresChoice.type === 'select') {
    const opts = ability.requiresChoice.options.map(o => `<option value="${o}">${o}</option>`).join('');
    body.innerHTML = `<label>${ability.requiresChoice.label}</label><select id="tdChoiceInput">${opts}</select>`;
  } else {
    body.innerHTML = `<label>${ability.requiresChoice.label}</label><input id="tdChoiceInput" type="text" />`;
  }
  document.getElementById('tdChoiceModal').dataset.mode = 'ability';
  document.getElementById('tdChoiceModal').classList.remove('hidden');
}

function acquireSkillFromLibrary(abilityId, choiceValue) {
  const ch = getCurrentChar(); if (!ch) return;
  const ability = findAbility(abilityId); if (!ability) return;
  if (ch.abilities.some(s => s.id === abilityId)) { showNotification('Habilidade já adquirida', '', true); return; }
  const eligible = ability.scope === 'general' || (ch.subclass && ability.subclasses.includes(ch.subclass));
  if (!eligible) { showNotification('Sua Subclasse não permite esta habilidade.', '', true); return; }
  ch.abilities.push({ id: abilityId, choiceValue: choiceValue || null, repeatableChoices: [] });
  ch.updatedAt = new Date().toISOString();
  saveChars(); renderAbilities(); renderSkills(); renderSkillLibrary();
  showNotification('Habilidade adicionada.', ability.name);
}

document.getElementById('skillLibraryOverlay').addEventListener('click', (e) => { if (e.target.id === 'skillLibraryOverlay') closeSkillLibrary(); });

/* ============================================================
   TALENTOS E DEFEITOS — UI E LÓGICA
   ============================================================ */
function calculateAdvantagesDisadvantages(ch) {
  const initialPoints = 2;
  let talentCost = 0, defectPoints = 0;
  (ch.talentsDefects || []).forEach(td => {
    const def = findTDDef(td.itemId); if (!def) return;
    if (def.category === 'talent') talentCost += def.cost; else defectPoints += def.cost;
  });
  const balance = initialPoints + talentCost + defectPoints;
  return { initialPoints, talentCost, defectPoints, balance };
}

function renderTalentsDefectsSummary() {
  const ch = getCurrentChar(); if (!ch) return;
  const b = calculateAdvantagesDisadvantages(ch);
  document.getElementById('tdInitial').textContent = b.initialPoints;
  document.getElementById('tdTalentCost').textContent = b.talentCost;
  document.getElementById('tdDefectPoints').textContent = '+' + b.defectPoints;
  document.getElementById('tdBalance').textContent = b.balance;
  const box = document.getElementById('tdBalanceBox');
  box.className = 'balance-item ' + (b.balance >= 0 ? 'ok' : 'bad');

  const talentsDisplay = document.getElementById('talentsDisplay');
  const defectsDisplay = document.getElementById('defectsDisplay');
  talentsDisplay.innerHTML = ''; defectsDisplay.innerHTML = '';
  const talents = (ch.talentsDefects || []).filter(td => findTDDef(td.itemId)?.category === 'talent');
  const defects = (ch.talentsDefects || []).filter(td => findTDDef(td.itemId)?.category === 'defect');

  if (talents.length === 0) talentsDisplay.innerHTML = '<p style="color:var(--text-dim);font-size:0.85rem;font-style:italic;">Nenhum talento selecionado.</p>';
  talents.forEach(td => talentsDisplay.appendChild(buildTDCard(td)));
  if (defects.length === 0) defectsDisplay.innerHTML = '<p style="color:var(--text-dim);font-size:0.85rem;font-style:italic;">Nenhum defeito selecionado.</p>';
  defects.forEach(td => defectsDisplay.appendChild(buildTDCard(td)));

  renderSessionStateDisplay();
}

function buildTDCard(td) {
  const def = findTDDef(td.itemId);
  const div = document.createElement('div');
  div.className = 'talent-defect-card' + (def.category === 'defect' ? ' defect' : '');
  let choiceNote = '';
  if (def.requiresChoice && td.choiceValue) choiceNote = `<div class="choice-note"><strong>${def.requiresChoice.label}:</strong> ${td.choiceValue}</div>`;
  div.innerHTML = `<h5><span>${def.name}</span><span class="cost ${def.category}" style="font-family:var(--mono);border:1px solid var(--border);padding:2px 7px;border-radius:2px;">${def.cost > 0 ? '+' : ''}${def.cost} pontos</span></h5><p>${def.description}</p>${choiceNote}<div style="margin-top:10px;"><button class="small danger" onclick="removeTalentDefect('${td.uid}')">Remover</button></div>`;
  return div;
}

function renderSessionStateDisplay() {
  const ch = getCurrentChar(); if (!ch) return;
  const container = document.getElementById('sessionStateDisplay');
  container.innerHTML = '';
  const hasPressentimento = (ch.talentsDefects || []).some(td => td.itemId === 'pressentimento');
  const hasAzarado = (ch.talentsDefects || []).some(td => td.itemId === 'azarado');
  const hasVicio = (ch.talentsDefects || []).some(td => td.itemId === 'vicio');
  if (!hasPressentimento && !hasAzarado && !hasVicio) { container.innerHTML = '<p style="color:var(--text-dim);font-size:0.82rem;font-style:italic;margin-top:8px;">Nenhum efeito de sessão ativo.</p>'; return; }
  if (hasPressentimento) {
    const used = ch.sessionState.pressentimentoUsed || 0;
    const div = document.createElement('div'); div.className = 'session-track';
    div.innerHTML = `<span>Pressentimento — usos nesta sessão: ${used}/1</span><button class="small" ${used >= 1 ? 'disabled' : ''} onclick="usePressentimento()">Usar Pressentimento</button>`;
    container.appendChild(div);
  }
  if (hasAzarado) {
    const div = document.createElement('div'); div.className = 'session-track';
    div.innerHTML = `<label style="display:flex;align-items:center;gap:8px;text-transform:none;cursor:pointer;"><input type="checkbox" style="width:auto;" ${ch.sessionState.azaradoUsed ? 'checked' : ''} onchange="toggleAzarado(this.checked)" /> Azarado utilizado nesta sessão</label>`;
    container.appendChild(div);
  }
  if (hasVicio) {
    const div = document.createElement('div'); div.className = 'session-track';
    div.innerHTML = `<span>Sessões consecutivas sem saciar o Vício: ${ch.sessionState.vicioUnsatisfiedSessions || 0} (Testes de Acerto -${ch.sessionState.vicioUnsatisfiedSessions || 0})</span><button class="small" onclick="satisfyVicio()">Satisfazer Vício</button>`;
    container.appendChild(div);
  }
}

function usePressentimento() {
  const ch = getCurrentChar(); if (!ch) return;
  if ((ch.sessionState.pressentimentoUsed || 0) >= 1) return;
  ch.sessionState.pressentimentoUsed = 1; ch.updatedAt = new Date().toISOString(); saveChars(); renderSessionStateDisplay();
}
function toggleAzarado(checked) {
  const ch = getCurrentChar(); if (!ch) return;
  ch.sessionState.azaradoUsed = checked; ch.updatedAt = new Date().toISOString(); saveChars();
}
function satisfyVicio() {
  const ch = getCurrentChar(); if (!ch) return;
  ch.sessionState.vicioUnsatisfiedSessions = 0; ch.updatedAt = new Date().toISOString(); saveChars(); renderSessionStateDisplay();
}
function resetSessionState() {
  const ch = getCurrentChar(); if (!ch) return;
  ch.sessionState.pressentimentoUsed = 0;
  ch.sessionState.azaradoUsed = false;
  if ((ch.talentsDefects || []).some(td => td.itemId === 'vicio')) ch.sessionState.vicioUnsatisfiedSessions = (ch.sessionState.vicioUnsatisfiedSessions || 0) + 1;
  ch.updatedAt = new Date().toISOString(); saveChars(); renderSessionStateDisplay();
  showNotification('Sessão resetada.', '');
}

function openTalentDefectModal() {
  const ch = getCurrentChar(); if (!ch) return;
  document.getElementById('talentDefectSearch').value = '';
  currentTDFilter = 'all';
  const b = calculateAdvantagesDisadvantages(ch);
  document.getElementById('tdModalBalance').textContent = b.balance;
  renderTalentDefectLibrary();
  document.getElementById('talentDefectOverlay').classList.remove('hidden');
}
function closeTalentDefectModal() { document.getElementById('talentDefectOverlay').classList.add('hidden'); }
function setTDFilter(filter, event) {
  currentTDFilter = filter;
  document.querySelectorAll('#talentDefectOverlay .lib-filters button').forEach(b => b.classList.remove('primary'));
  if (event) event.target.classList.add('primary');
  renderTalentDefectLibrary();
}

function renderTalentDefectLibrary() {
  const ch = getCurrentChar(); if (!ch) return;
  const container = document.getElementById('talentDefectGrid'); container.innerHTML = '';
  const term = document.getElementById('talentDefectSearch').value.toLowerCase();
  const all = [...TALENTS_DB.map(t => t), ...DEFECTS_DB.map(d => d)];
  const b = calculateAdvantagesDisadvantages(ch);
  const modalBalanceEl = document.getElementById('tdModalBalance');
  if (modalBalanceEl) modalBalanceEl.textContent = b.balance;
  all.forEach(def => {
    if (currentTDFilter !== 'all' && def.category !== currentTDFilter) return;
    if (term && !def.name.toLowerCase().includes(term) && !def.description.toLowerCase().includes(term)) return;
    const already = (ch.talentsDefects || []).some(td => td.itemId === def.id);
    const wouldBreakBalance = def.category === 'talent' && (b.balance + def.cost) < 0;
    const card = document.createElement('div'); card.className = 'mini-card';
    card.innerHTML = `<h4>${def.name}</h4><p class="cost ${def.category}">${def.category === 'talent' ? 'Talento' : 'Defeito'} — ${def.cost > 0 ? '+' : ''}${def.cost} pontos</p><p class="desc">${def.description}</p><button ${already ? 'disabled' : (wouldBreakBalance ? 'disabled' : '')} onclick="handleSelectTalentDefect('${def.id}')" style="margin-top:10px;width:100%;">${already ? 'Selecionado' : (wouldBreakBalance ? 'Saldo insuficiente' : 'Adicionar')}</button>`;
    container.appendChild(card);
  });
}

function handleSelectTalentDefect(itemId) {
  const def = findTDDef(itemId); if (!def) return;
  if (def.requiresChoice) { openTDChoiceModal(def); return; }
  addTalentDefect(itemId, null);
}

function openTDChoiceModal(def) {
  pendingTDSelection = def;
  document.getElementById('tdChoiceModal').dataset.mode = 'td';
  document.getElementById('tdChoiceTitle').textContent = def.name;
  const body = document.getElementById('tdChoiceBody');
  const ch = getCurrentChar();
  if (def.requiresChoice.type === 'text') {
    body.innerHTML = `<label>${def.requiresChoice.label}</label><input id="tdChoiceInput" type="text" />`;
  } else if (def.requiresChoice.type === 'select') {
    const opts = def.requiresChoice.options.map(o => `<option value="${o}">${o}</option>`).join('');
    body.innerHTML = `<label>${def.requiresChoice.label}</label><select id="tdChoiceInput">${opts}</select>`;
  } else if (def.requiresChoice.type === 'skill') {
    const opts = SKILL_LIST.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    body.innerHTML = `<label>${def.requiresChoice.label}</label><select id="tdChoiceInput">${opts}</select>`;
  }
  document.getElementById('tdChoiceModal').classList.remove('hidden');
}
function closeTDChoiceModal() { document.getElementById('tdChoiceModal').classList.add('hidden'); pendingTDSelection = null; pendingAbilityChoice = null; }
function confirmTDChoice() {
  const mode = document.getElementById('tdChoiceModal').dataset.mode;
  const value = document.getElementById('tdChoiceInput').value.trim();
  if (!value) { showNotification('Preencha o campo antes de confirmar.', '', true); return; }
  if (mode === 'ability') {
    if (!pendingAbilityChoice) return;
    acquireSkillFromLibrary(pendingAbilityChoice.id, value);
  } else {
    if (!pendingTDSelection) return;
    addTalentDefect(pendingTDSelection.id, value);
  }
  closeTDChoiceModal();
}

function addTalentDefect(itemId, choiceValue) {
  const ch = getCurrentChar(); if (!ch) return;
  const def = findTDDef(itemId); if (!def) return;
  if ((ch.talentsDefects || []).some(td => td.itemId === itemId)) { showNotification('Este item já foi selecionado.', '', true); return; }
  const b = calculateAdvantagesDisadvantages(ch);
  if (def.category === 'talent' && (b.balance + def.cost) < 0) { showNotification('Saldo de pontos insuficiente.', '', true); return; }
  ch.talentsDefects.push({ uid: 'td_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), itemId, choiceValue: choiceValue || null });
  if (def.sessionUse && def.sessionUse.type === 'counter' && itemId === 'vicio' && !ch.sessionState.vicioUnsatisfiedSessions) ch.sessionState.vicioUnsatisfiedSessions = 0;
  ch.updatedAt = new Date().toISOString();
  recalcAllModifiers(ch);
  saveChars();
  renderTalentsDefectsSummary();
  renderTalentDefectLibrary();
  updateAttrUI(); updateResourceUI(); renderSkills(); renderModifierStats();
  showNotification('Adicionado.', def.name);
}

function removeTalentDefect(uid) {
  const ch = getCurrentChar(); if (!ch) return;
  ch.talentsDefects = (ch.talentsDefects || []).filter(td => td.uid !== uid);
  ch.updatedAt = new Date().toISOString();
  recalcAllModifiers(ch);
  saveChars();
  renderTalentsDefectsSummary();
  if (!document.getElementById('talentDefectOverlay').classList.contains('hidden')) renderTalentDefectLibrary();
  updateAttrUI(); updateResourceUI(); renderSkills(); renderModifierStats();
  showNotification('Removido.', '');
}

function renderModifierStats() {
  const ch = getCurrentChar(); if (!ch) return;
  const container = document.getElementById('modifierStatsContainer'); container.innerHTML = '';
  const m = ch.derivedModifiers || {};
  const rows = [];
  if (m.defesaEsquiva) rows.push(['Bônus de Defesa com Esquiva', (m.defesaEsquiva > 0 ? '+' : '') + m.defesaEsquiva]);
  if (m.critMargin) rows.push(['Margem de Crítico', (m.critMargin > 0 ? '+' : '') + m.critMargin]);
  if (m.sanDamageReduction) rows.push(['Redução de Dano de Sanidade', '-' + m.sanDamageReduction]);
  if (m.bodyDamageReduction) rows.push(['Redução de Dano Corporal', m.bodyDamageReduction + 'd4']);
  if (m.testesAcerto) rows.push(['Testes de Acerto (condições)', (m.testesAcerto > 0 ? '+' : '') + m.testesAcerto]);
  rows.forEach(([label, val]) => {
    const div = document.createElement('div'); div.className = 'derived-stat';
    div.innerHTML = `<span><strong>${label}:</strong></span><span>${val}</span>`;
    container.appendChild(div);
  });
}

/* ============================================================
   PERSONAGEM — TELAS
   ============================================================ */
function renderCharList() {
  const list = document.getElementById('charList'); list.innerHTML = '';
  if (characters.length === 0) { list.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:36px;">Nenhuma ficha encontrada. Crie uma nova.</p>'; return; }
  characters.forEach(ch => {
    const originData = getOriginById(ch.originId);
    const card = document.createElement('div'); card.className = 'card';
    const avatar = ch.imageUrl
      ? `<img src="${ch.imageUrl}" alt="" class="char-list-avatar" />`
      : `<div class="char-list-avatar char-list-avatar-empty">Sem foto</div>`;
    card.innerHTML = `<div style="display:flex;gap:14px;align-items:flex-start;">${avatar}<div style="flex:1;min-width:0;"><h3 style="overflow-wrap:break-word;">${ch.name}</h3><p style="color:var(--text-muted);font-size:0.85rem;">Nível ${ch.level} — ${originData ? originData.name : 'Sem origem'}</p></div></div><div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;"><button onclick="openChar('${ch.id}')">Abrir</button><button onclick="duplicateChar('${ch.id}')">Duplicar</button><button onclick="exportChar('${ch.id}')">Exportar</button><button class="danger" onclick="deleteChar('${ch.id}')">Excluir</button></div>`;
    list.appendChild(card);
  });
}

const ALL_TOP_SCREENS = ['screenMainMenu', 'screenCatalogPlaceholder', 'screenContatos', 'screenLiandry', 'screenEscudo', 'screenHome', 'screenWizard', 'screenSheet'];
function hideAllTopScreens() { ALL_TOP_SCREENS.forEach(id => document.getElementById(id).classList.add('hidden')); }

function goToMainMenu() {
  hideAllTopScreens();
  document.getElementById('screenMainMenu').classList.remove('hidden');
  document.getElementById('appHeaderActions').classList.add('hidden');
  currentCharId = null; creationState = null; hidePopovers();
  window.scrollTo(0, 0);
}

function enterCatalog(name) {
  hideAllTopScreens();
  if (name === 'soldados') {
    document.getElementById('appHeaderActions').classList.remove('hidden');
    showHome();
    return;
  }
  if (name === 'contatos') { document.getElementById('screenContatos').classList.remove('hidden'); window.scrollTo(0, 0); return; }
  if (name === 'liandry') { document.getElementById('screenLiandry').classList.remove('hidden'); window.scrollTo(0, 0); return; }
  if (name === 'escudo') { openEscudoDoMestre(); return; }
  const labels = { escudo: 'Escudo do Mestre', liandry: 'Liandry', contatos: 'Contatos' };
  document.getElementById('catalogPlaceholderTitle').textContent = labels[name] || 'Em breve';
  document.getElementById('screenCatalogPlaceholder').classList.remove('hidden');
  window.scrollTo(0, 0);
}

function showHome() {
  hideAllTopScreens();
  document.getElementById('screenHome').classList.remove('hidden');
  document.getElementById('appHeaderActions').classList.remove('hidden');
  document.getElementById('btnBackHeader').classList.add('hidden');
  currentCharId = null; creationState = null; hidePopovers();
  window.scrollTo(0, 0);
}

/* ============================================================
   ESCUDO DO MESTRE
   ============================================================ */
function openEscudoDoMestre() {
  hideAllTopScreens();
  document.getElementById('screenEscudo').classList.remove('hidden');
  document.getElementById('appHeaderActions').classList.add('hidden');
  document.querySelectorAll('#screenEscudo .escudo-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  document.querySelectorAll('#screenEscudo .escudo-section').forEach((s, i) => s.classList.toggle('active', i === 0));
  renderEscudoEncontro();
  renderInitiative();
  renderGMTitansList();
  renderGMPrimordialList();
  renderRulesReference();
  renderBiomas();
  window.scrollTo(0, 0);
}

function switchEscudoTab(tabId, btn) {
  document.querySelectorAll('#screenEscudo .escudo-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#screenEscudo .escudo-section').forEach(s => s.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(tabId).classList.add('active');
  if (tabId === 'escudoEncontro') renderEscudoEncontro();
  if (tabId === 'escudoIniciativa') renderInitiative();
  if (tabId === 'escudoTitans') { renderGMTitansList(); renderGMPrimordialList(); }
  if (tabId === 'escudoRegras') renderRulesReference();
  if (tabId === 'escudoBiomas') renderBiomas();
}

function renderEscudoEncontro() {
  const visibleSoldiers = characters.filter(c => !gmHiddenSoldiers.includes(c.id));
  const visibleTitans = gmTitans.filter(t => !gmHiddenTitans.includes(t.id));
  document.getElementById('encontroTitanCount').textContent = visibleTitans.length + ' / ' + gmTitans.length;
  document.getElementById('encontroSoldierCount').textContent = visibleSoldiers.length + ' / ' + characters.length;

  const soldiersList = document.getElementById('encontroSoldiersList');
  soldiersList.innerHTML = '';
  if (visibleSoldiers.length === 0) soldiersList.innerHTML = '<p class="empty-note">Nenhum soldado visível no encontro. Use "Adicionar ao Encontro" para trazer alguém.</p>';
  visibleSoldiers.forEach(ch => {
    ensureCharDefaults(ch);
    const sta = ch.resources && ch.resources.sta ? ch.resources.sta : { cur: 0, max: 0 };
    const isShifterReady = ch.shifter && ch.shifter.isShifter && ch.shifter.titanId;
    const titan = isShifterReady ? getTitanById(ch.shifter.titanId) : null;
    const isTransformed = isShifterReady && ch.shifter.transformed;
    const div = document.createElement('div'); div.className = 'mini-card'; div.style.marginBottom = '10px';
    let transformHtml = '';
    if (isShifterReady && titan) {
      transformHtml = isTransformed
        ? `<div class="resource-controls" style="margin-top:8px;"><button class="small danger" onclick='detransformShifter(getCharByIdGM("${ch.id}"))'>Destransformar (${titan.name})</button><button class="small" onclick='maintainShifter(getCharByIdGM("${ch.id}"))'>Manter (-${titan.pdeMaintain} PDE)</button></div>`
        : `<div class="resource-controls" style="margin-top:8px;"><button class="small primary" onclick='transformShifter(getCharByIdGM("${ch.id}"))'>Transformar em ${titan.name} (-${titan.pdeTransform} PDE)</button></div>`;
    }
    let pvBlockHtml;
    if (isTransformed) {
      const nuca = ch.shifter.parts.nuca || { cur: 0, max: 0 };
      pvBlockHtml = `<div class="derived-stat"><span>PDV (Nuca do Titã)</span><span style="font-family:var(--mono);">${nuca.cur} / ${nuca.max}</span></div><div class="resource-controls"><button onclick="modSoldierNucaHP('${ch.id}', -5)">-5</button><button onclick="modSoldierNucaHP('${ch.id}', -1)">-1</button><button onclick="modSoldierNucaHP('${ch.id}', 1)">+1</button><button onclick="modSoldierNucaHP('${ch.id}', 5)">+5</button></div>`;
    } else {
      const hp = ch.resources && ch.resources.hp ? ch.resources.hp : { cur: 0, max: 0 };
      pvBlockHtml = `<div class="derived-stat"><span>PDV</span><span style="font-family:var(--mono);">${hp.cur} / ${hp.max}</span></div><div class="resource-controls"><button onclick="modSoldierHP('${ch.id}', -5)">-5</button><button onclick="modSoldierHP('${ch.id}', -1)">-1</button><button onclick="modSoldierHP('${ch.id}', 1)">+1</button><button onclick="modSoldierHP('${ch.id}', 5)">+5</button></div>`;
    }
    div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;"><h4>${ch.name}${isTransformed ? ' <span class="tag origin">Transformado</span>' : ''}</h4><button class="small" onclick="hideSoldierFromEncounter('${ch.id}')" title="Ocultar do encontro">Ocultar</button></div>${pvBlockHtml}<div class="derived-stat" style="margin-top:6px;"><span>PDE</span><span style="font-family:var(--mono);">${sta.cur} / ${sta.max}</span></div><div class="resource-controls"><button onclick="modSoldierSTA('${ch.id}', -5)">-5</button><button onclick="modSoldierSTA('${ch.id}', -1)">-1</button><button onclick="modSoldierSTA('${ch.id}', 1)">+1</button><button onclick="modSoldierSTA('${ch.id}', 5)">+5</button></div>${transformHtml}`;
    soldiersList.appendChild(div);
  });

  const titansList = document.getElementById('encontroTitansList');
  titansList.innerHTML = '';
  if (visibleTitans.length === 0) titansList.innerHTML = '<p class="empty-note">Nenhum Titã visível no encontro. Use "Adicionar ao Encontro" ou cadastre um na aba Titãs.</p>';
  visibleTitans.forEach(t => {
    const card = buildGMTitanCard(t);
    const hideBtn = document.createElement('button');
    hideBtn.className = 'small'; hideBtn.style.marginTop = '8px'; hideBtn.textContent = 'Ocultar do Encontro';
    hideBtn.onclick = () => hideTitanFromEncounter(t.id);
    card.appendChild(hideBtn);
    titansList.appendChild(card);
  });
}

function getCharByIdGM(id) { return characters.find(c => c.id === id); }

function hideSoldierFromEncounter(id) { if (!gmHiddenSoldiers.includes(id)) gmHiddenSoldiers.push(id); saveGMHidden(); renderEscudoEncontro(); }
function hideTitanFromEncounter(id) { if (!gmHiddenTitans.includes(id)) gmHiddenTitans.push(id); saveGMHidden(); renderEscudoEncontro(); }
function unhideSoldier(id) { gmHiddenSoldiers = gmHiddenSoldiers.filter(x => x !== id); saveGMHidden(); renderEscudoEncontro(); renderEncounterAddMenu(); }
function unhideTitanFromEncounter(id) { gmHiddenTitans = gmHiddenTitans.filter(x => x !== id); saveGMHidden(); renderEscudoEncontro(); renderEncounterAddMenu(); }

function openEncounterAddModal() {
  renderEncounterAddMenu();
  document.getElementById('encounterAddModal').classList.remove('hidden');
}
function closeEncounterAddModal() { document.getElementById('encounterAddModal').classList.add('hidden'); }

function renderEncounterAddMenu() {
  const container = document.getElementById('encounterAddGrid'); container.innerHTML = '';
  const hiddenSoldiers = characters.filter(c => gmHiddenSoldiers.includes(c.id));
  const hiddenTitans = gmTitans.filter(t => gmHiddenTitans.includes(t.id));
  if (hiddenSoldiers.length === 0 && hiddenTitans.length === 0) { container.innerHTML = '<p class="empty-note">Todos os soldados e Titãs já estão visíveis no encontro.</p>'; return; }
  hiddenSoldiers.forEach(ch => {
    const div = document.createElement('div'); div.className = 'mini-card';
    div.innerHTML = `<h4>${ch.name}</h4><p class="desc">Soldado — Nível ${ch.level}</p><button class="primary" style="margin-top:10px;width:100%;" onclick="unhideSoldier('${ch.id}')">Adicionar ao Encontro</button>`;
    container.appendChild(div);
  });
  hiddenTitans.forEach(t => {
    const cat = getPureTitanCategory(t.categoryId);
    const div = document.createElement('div'); div.className = 'mini-card';
    div.innerHTML = `<h4>${t.name}</h4><p class="desc">Titã — ${cat ? cat.label : ''}</p><button class="primary" style="margin-top:10px;width:100%;" onclick="unhideTitanFromEncounter('${t.id}')">Adicionar ao Encontro</button>`;
    container.appendChild(div);
  });
}

function modSoldierHP(charId, delta) {
  const ch = characters.find(c => c.id === charId); if (!ch) return;
  if (!ch.resources || !ch.resources.hp) return;
  ch.resources.hp.cur = Math.max(0, Math.min(ch.resources.hp.max, ch.resources.hp.cur + delta));
  ch.updatedAt = new Date().toISOString();
  saveChars();
  renderEscudoEncontro();
}

function modSoldierSTA(charId, delta) {
  const ch = characters.find(c => c.id === charId); if (!ch) return;
  if (!ch.resources || !ch.resources.sta) return;
  ch.resources.sta.cur = Math.max(0, Math.min(ch.resources.sta.max, ch.resources.sta.cur + delta));
  ch.updatedAt = new Date().toISOString();
  saveChars();
  renderEscudoEncontro();
}

function modSoldierNucaHP(charId, delta) {
  const ch = characters.find(c => c.id === charId); if (!ch) return;
  if (!ch.shifter || !ch.shifter.parts || !ch.shifter.parts.nuca) return;
  const nuca = ch.shifter.parts.nuca;
  nuca.cur = Math.max(0, Math.min(nuca.max, nuca.cur + delta));
  ch.updatedAt = new Date().toISOString();
  saveChars();
  renderEscudoEncontro();
}

function computeGMTitanParts(categoryId, variationId, customParts) {
  if (variationId === 'custom' && customParts) {
    return { nuca: customParts.nuca, bracoD: customParts.bracoD, bracoE: customParts.bracoE, pernaD: customParts.pernaD, pernaE: customParts.pernaE };
  }
  const cat = getPureTitanCategory(categoryId);
  if (!cat) return { nuca: 1, bracoD: 1, bracoE: 1, pernaD: 1, pernaE: 1 };
  const variation = getPureTitanVariation(variationId);
  const bonus = variation.pvBonusPerPart || 0;
  return { nuca: cat.pdvNuca + bonus, bracoD: cat.pdvBraco + bonus, bracoE: cat.pdvBraco + bonus, pernaD: cat.pdvPerna + bonus, pernaE: cat.pdvPerna + bonus };
}

function ensureGMTitanParts(t) {
  if (t.parts) return;
  const maxes = computeGMTitanParts(t.categoryId, t.variationId, t.customParts);
  t.parts = {};
  Object.keys(maxes).forEach(k => { t.parts[k] = { cur: maxes[k], max: maxes[k] }; });
}

function getGMTitanTotals(t) {
  ensureGMTitanParts(t);
  let cur = 0, max = 0;
  Object.values(t.parts).forEach(p => { cur += p.cur; max += p.max; });
  return { cur, max };
}

function getGMTitanStatusEffects(t) {
  ensureGMTitanParts(t);
  const effects = [];
  const armsLost = (t.parts.bracoD.cur <= 0 ? 1 : 0) + (t.parts.bracoE.cur <= 0 ? 1 : 0);
  const legsLost = (t.parts.pernaD.cur <= 0 ? 1 : 0) + (t.parts.pernaE.cur <= 0 ? 1 : 0);
  if (t.parts.nuca.cur <= 0) effects.push('Nuca destruída — o Titã está evaporando e desaparecerá em pouco tempo.');
  if (armsLost === 2) effects.push('Os dois braços foram perdidos — condição Vulnerável e dupla desvantagem para atacar (só morde).');
  else if (armsLost === 1) effects.push('Um braço foi perdido — bloqueios -3 e ataques com desvantagem.');
  if (legsLost === 2) effects.push('As duas pernas foram perdidas — deslocamento anulado.');
  else if (legsLost === 1) effects.push('Uma perna foi perdida — deslocamento reduzido a 4m.');
  return effects;
}

function buildGMTitanCard(t) {
  ensureGMTitanParts(t);
  const cat = getPureTitanCategory(t.categoryId);
  const variation = getPureTitanVariation(t.variationId);
  const totals = getGMTitanTotals(t);
  const effects = getGMTitanStatusEffects(t);
  const div = document.createElement('div'); div.className = 'mini-card'; div.style.marginBottom = '12px';
  const partsHtml = Object.keys(TITAN_PART_LABELS).map(partKey => {
    const p = t.parts[partKey];
    const pct = p.max > 0 ? Math.min(100, (p.cur / p.max) * 100) : 0;
    const barClass = pct <= 25 ? ' crit' : pct <= 50 ? ' low' : '';
    return `<div style="margin-top:10px;">
      <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted);"><span>${TITAN_PART_LABELS[partKey]}</span><span style="font-family:var(--mono);">${p.cur}/${p.max}</span></div>
      <div class="resource-bar" style="height:5px;"><div class="resource-fill${barClass}" style="width:${pct}%;"></div></div>
      <div class="resource-controls" style="margin-top:4px;">
        <button class="small" onclick="modGMTitanPart('${t.id}','${partKey}',-5)">-5</button>
        <button class="small" onclick="modGMTitanPart('${t.id}','${partKey}',-1)">-1</button>
        <button class="small" onclick="modGMTitanPart('${t.id}','${partKey}',1)">+1</button>
        <button class="small" onclick="modGMTitanPart('${t.id}','${partKey}',5)">+5</button>
      </div>
    </div>`;
  }).join('');
  const avatar = t.imageUrl ? `<img src="${t.imageUrl}" alt="" class="initiative-avatar" style="width:64px;height:64px;" />` : '';
  const statsHtml = cat ? `<div class="derived-stat" style="margin-top:10px;"><span><strong>Ataque:</strong></span><span>1d20${cat.testeAcerto} — ${cat.dano}</span></div><div class="derived-stat"><span><strong>Deslocamento:</strong></span><span>${cat.deslocamento}m</span></div><div class="derived-stat"><span><strong>Bloqueio:</strong></span><span>${cat.bloqueio} (${cat.bloqueioNuca} na nuca)</span></div>` : '';
  div.innerHTML = `
    <div style="display:flex;gap:12px;align-items:flex-start;">
      ${avatar}
      <div style="flex:1;min-width:0;">
        <h4>${t.name}</h4>
        <p style="font-size:0.78rem;color:var(--text-dim);">${cat ? cat.label : 'Custom'}${variation && variation.id !== 'nenhuma' ? ` — ${variation.label}` : ''}</p>
      </div>
    </div>
    ${t.description ? `<p class="desc" style="margin-top:8px;">${t.description}</p>` : ''}
    <div style="font-family:var(--mono);margin-top:8px;">${totals.cur} / ${totals.max} PV total</div>
    ${statsHtml}
    ${partsHtml}
    ${effects.length ? `<div style="margin-top:10px;padding:8px 10px;background:var(--surface-3);border-left:3px solid var(--danger);font-size:0.78rem;color:var(--text-muted);">${effects.join('<br>')}</div>` : ''}
    ${t.customNotes ? `<div style="margin-top:10px;padding:8px 10px;background:var(--surface-3);border-left:3px solid var(--accent);font-size:0.78rem;color:var(--text-muted);"><strong style="color:var(--accent);">Notas:</strong> ${t.customNotes}</div>` : ''}
    <div class="grid grid-2" style="margin-top:12px;gap:8px;">
      <input type="number" id="healAmount_${t.id}" min="0" value="5" placeholder="Quantidade" />
      <button onclick="healAllGMTitanPartsBy('${t.id}')">Curar em Todas as Partes</button>
    </div>
    <div class="resource-controls" style="margin-top:8px;">
      <button onclick="openGMTitanDamageModal('${t.id}')">Aplicar Dano (parte específica)</button>
      <button onclick="healAllGMTitanParts('${t.id}')">Curar Tudo (Máximo)</button>
    </div>
    <div class="resource-controls" style="margin-top:6px;">
      <button onclick="openGMTitanModal('${t.id}')">Editar</button>
      <button onclick="duplicateGMTitan('${t.id}')">Duplicar</button>
      <button class="danger" onclick="deleteGMTitan('${t.id}')">Excluir</button>
    </div>`;
  return div;
}

function healAllGMTitanPartsBy(id) {
  const t = gmTitans.find(x => x.id === id); if (!t) return;
  ensureGMTitanParts(t);
  const amount = parseInt(document.getElementById('healAmount_' + id).value) || 0;
  Object.values(t.parts).forEach(p => { p.cur = Math.max(0, Math.min(p.max, p.cur + amount)); });
  saveGMTitans(); renderGMTitansList(); renderEscudoEncontro();
  showNotification('Cura aplicada em todas as partes.', `+${amount} PV`);
}

function renderGMTitansList() {
  const container = document.getElementById('gmTitansList'); container.innerHTML = '';
  if (gmTitans.length === 0) { container.innerHTML = '<p class="empty-note">Nenhum Titã cadastrado. Clique em "Criar Titã" para começar.</p>'; return; }
  gmTitans.forEach(t => container.appendChild(buildGMTitanCard(t)));
}

function toggleGMTitanCustomFields() {
  const varId = document.getElementById('gmTitanVariation').value;
  document.getElementById('gmTitanCustomFields').classList.toggle('hidden', varId !== 'custom');
}

let pendingGMTitanImage = null;
function openGMTitanModal(editId) {
  document.getElementById('gmTitanEditId').value = editId || '';
  pendingGMTitanImage = null;
  const thumbImg = document.getElementById('gmTitanThumbnailImg');
  const thumbPlaceholder = document.getElementById('gmTitanThumbnailPlaceholder');
  if (editId) {
    const t = gmTitans.find(x => x.id === editId);
    ensureGMTitanParts(t);
    document.getElementById('gmTitanModalTitle').textContent = 'Editar Titã';
    document.getElementById('gmTitanName').value = t.name;
    document.getElementById('gmTitanDescription').value = t.description || '';
    document.getElementById('gmTitanCategory').value = t.categoryId || '6-9';
    document.getElementById('gmTitanVariation').value = t.variationId;
    document.getElementById('gmTitanCustomNuca').value = t.parts.nuca.max;
    document.getElementById('gmTitanCustomBracoD').value = t.parts.bracoD.max;
    document.getElementById('gmTitanCustomBracoE').value = t.parts.bracoE.max;
    document.getElementById('gmTitanCustomPernaD').value = t.parts.pernaD.max;
    document.getElementById('gmTitanCustomPernaE').value = t.parts.pernaE.max;
    document.getElementById('gmTitanCustomNotes').value = t.customNotes || '';
    if (t.imageUrl) { thumbImg.src = t.imageUrl; thumbImg.classList.remove('hidden'); thumbPlaceholder.classList.add('hidden'); pendingGMTitanImage = t.imageUrl; }
    else { thumbImg.classList.add('hidden'); thumbPlaceholder.classList.remove('hidden'); }
  } else {
    document.getElementById('gmTitanModalTitle').textContent = 'Criar Titã';
    document.getElementById('gmTitanName').value = 'Titã Puro';
    document.getElementById('gmTitanDescription').value = '';
    document.getElementById('gmTitanCategory').value = '6-9';
    document.getElementById('gmTitanVariation').value = 'nenhuma';
    document.getElementById('gmTitanCustomNuca').value = 50;
    document.getElementById('gmTitanCustomBracoD').value = 25;
    document.getElementById('gmTitanCustomBracoE').value = 25;
    document.getElementById('gmTitanCustomPernaD').value = 25;
    document.getElementById('gmTitanCustomPernaE').value = 25;
    document.getElementById('gmTitanCustomNotes').value = '';
    thumbImg.classList.add('hidden'); thumbPlaceholder.classList.remove('hidden');
  }
  toggleGMTitanCustomFields();
  updateGMTitanPreview();
  document.getElementById('gmTitanModal').classList.remove('hidden');
}
function closeGMTitanModal() { document.getElementById('gmTitanModal').classList.add('hidden'); }

function resizeImageToDataUrl(file, maxDim, quality, callback) {
  if (!file.type.startsWith('image/')) { showNotification('Arquivo inválido.', 'Selecione uma imagem.', true); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) { if (w > h) { h = Math.round(h * (maxDim / w)); w = maxDim; } else { w = Math.round(w * (maxDim / h)); h = maxDim; } }
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleGMTitanImageUpload(event) {
  const file = event.target.files[0]; event.target.value = '';
  if (!file) return;
  resizeImageToDataUrl(file, 400, 0.85, (dataUrl) => {
    pendingGMTitanImage = dataUrl;
    const thumbImg = document.getElementById('gmTitanThumbnailImg');
    thumbImg.src = dataUrl; thumbImg.classList.remove('hidden');
    document.getElementById('gmTitanThumbnailPlaceholder').classList.add('hidden');
  });
}

function updateGMTitanPreview() {
  const catId = document.getElementById('gmTitanCategory').value;
  const varId = document.getElementById('gmTitanVariation').value;
  const cat = getPureTitanCategory(catId);
  const variation = getPureTitanVariation(varId);
  const preview = document.getElementById('gmTitanPreview');
  if (varId === 'custom') {
    const nuca = parseInt(document.getElementById('gmTitanCustomNuca').value) || 0;
    const bD = parseInt(document.getElementById('gmTitanCustomBracoD').value) || 0;
    const bE = parseInt(document.getElementById('gmTitanCustomBracoE').value) || 0;
    const pD = parseInt(document.getElementById('gmTitanCustomPernaD').value) || 0;
    const pE = parseInt(document.getElementById('gmTitanCustomPernaE').value) || 0;
    preview.innerHTML = `<p><strong>PV Total:</strong> ${nuca + bD + bE + pD + pE}</p><p style="color:var(--text-dim);font-size:0.78rem;">Ataque, deslocamento e bloqueio ficam a critério do mestre — use as notas para registrar.</p>`;
    return;
  }
  preview.innerHTML = `<p><strong>Teste de Acerto:</strong> 1d20${cat.testeAcerto}</p><p><strong>Dano:</strong> ${cat.dano}</p><p><strong>Deslocamento:</strong> ${cat.deslocamento}m</p><p><strong>Bloqueio:</strong> ${cat.bloqueio} (${cat.bloqueioNuca} na nuca)</p>${variation.id !== 'nenhuma' ? `<p style="margin-top:8px;color:var(--accent);">${variation.desc}</p>` : ''}`;
}
document.addEventListener('change', (e) => {
  const watched = ['gmTitanCategory', 'gmTitanVariation', 'gmTitanCustomNuca', 'gmTitanCustomBracoD', 'gmTitanCustomBracoE', 'gmTitanCustomPernaD', 'gmTitanCustomPernaE'];
  if (watched.includes(e.target.id)) {
    if (e.target.id === 'gmTitanVariation') toggleGMTitanCustomFields();
    updateGMTitanPreview();
  }
});

function saveGMTitan() {
  const editId = document.getElementById('gmTitanEditId').value;
  const name = document.getElementById('gmTitanName').value.trim() || 'Titã Puro';
  const description = document.getElementById('gmTitanDescription').value.trim();
  const categoryId = document.getElementById('gmTitanCategory').value;
  const variationId = document.getElementById('gmTitanVariation').value;
  let customParts = null;
  if (variationId === 'custom') {
    customParts = {
      nuca: parseInt(document.getElementById('gmTitanCustomNuca').value) || 1,
      bracoD: parseInt(document.getElementById('gmTitanCustomBracoD').value) || 1,
      bracoE: parseInt(document.getElementById('gmTitanCustomBracoE').value) || 1,
      pernaD: parseInt(document.getElementById('gmTitanCustomPernaD').value) || 1,
      pernaE: parseInt(document.getElementById('gmTitanCustomPernaE').value) || 1
    };
  }
  const customNotes = document.getElementById('gmTitanCustomNotes').value.trim();
  const maxes = computeGMTitanParts(categoryId, variationId, customParts);
  if (editId) {
    const t = gmTitans.find(x => x.id === editId);
    if (t) {
      ensureGMTitanParts(t);
      t.name = name; t.description = description; t.categoryId = categoryId; t.variationId = variationId; t.customParts = customParts; t.customNotes = customNotes; t.imageUrl = pendingGMTitanImage;
      Object.keys(maxes).forEach(k => {
        const ratio = t.parts[k].max > 0 ? t.parts[k].cur / t.parts[k].max : 1;
        t.parts[k].max = maxes[k];
        t.parts[k].cur = Math.round(maxes[k] * ratio);
      });
    }
    showNotification('Titã atualizado.', name);
  } else {
    const parts = {};
    Object.keys(maxes).forEach(k => { parts[k] = { cur: maxes[k], max: maxes[k] }; });
    gmTitans.push({ id: 'gmtitan_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, description, categoryId, variationId, customParts, customNotes, imageUrl: pendingGMTitanImage, parts });
    showNotification('Titã criado.', name);
  }
  saveGMTitans();
  closeGMTitanModal();
  renderGMTitansList();
  renderEscudoEncontro();
}

function duplicateGMTitan(id) {
  const t = gmTitans.find(x => x.id === id); if (!t) return;
  const copy = JSON.parse(JSON.stringify(t));
  copy.id = 'gmtitan_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  copy.name = t.name + ' (Cópia)';
  gmTitans.push(copy);
  saveGMTitans(); renderGMTitansList(); renderEscudoEncontro();
  showNotification('Titã duplicado.', copy.name);
}

function deleteGMTitan(id) {
  showConfirm('Excluir este Titã?', () => {
    gmTitans = gmTitans.filter(x => x.id !== id);
    saveGMTitans(); renderGMTitansList(); renderEscudoEncontro();
    showNotification('Titã excluído.', '');
  });
}

function modGMTitanPart(id, part, delta) {
  const t = gmTitans.find(x => x.id === id); if (!t) return;
  ensureGMTitanParts(t);
  const p = t.parts[part]; if (!p) return;
  p.cur = Math.max(0, Math.min(p.max, p.cur + delta));
  saveGMTitans(); renderGMTitansList(); renderEscudoEncontro();
}

function healAllGMTitanParts(id) {
  const t = gmTitans.find(x => x.id === id); if (!t) return;
  ensureGMTitanParts(t);
  Object.values(t.parts).forEach(p => { p.cur = p.max; });
  saveGMTitans(); renderGMTitansList(); renderEscudoEncontro();
  showNotification('Titã totalmente curado.', t.name);
}

function openGMTitanDamageModal(id) {
  pendingGMTitanDamageId = id;
  document.getElementById('gmTitanDamageInput').value = 0;
  document.getElementById('gmTitanDamagePart').value = 'nuca';
  document.getElementById('gmTitanDamageModal').classList.remove('hidden');
}
function closeGMTitanDamageModal() { document.getElementById('gmTitanDamageModal').classList.add('hidden'); pendingGMTitanDamageId = null; }
function confirmGMTitanDamage() {
  const dmg = parseInt(document.getElementById('gmTitanDamageInput').value) || 0;
  const part = document.getElementById('gmTitanDamagePart').value;
  if (pendingGMTitanDamageId) modGMTitanPart(pendingGMTitanDamageId, part, -dmg);
  closeGMTitanDamageModal();
}

/* ============================================================
   TITÃS SHIFTER (PRIMORDIAIS) DO MESTRE — NPCs INDEPENDENTES
   ============================================================ */
function applyGMPrimordialTemplateBlank() {
  document.getElementById('gmPrimordialNuca').value = 100;
  document.getElementById('gmPrimordialBracoD').value = 50;
  document.getElementById('gmPrimordialBracoE').value = 50;
  document.getElementById('gmPrimordialPernaD').value = 50;
  document.getElementById('gmPrimordialPernaE').value = 50;
  document.getElementById('gmPrimordialAgi').value = 6;
  document.getElementById('gmPrimordialSta').value = 6;
  document.getElementById('gmPrimordialStr').value = 6;
  document.getElementById('gmPrimordialVit').value = 6;
  document.getElementById('gmPrimordialAtaqueTest').value = 'Força ou Agilidade';
  document.getElementById('gmPrimordialAtaqueDano').value = '5d10 + Força do titã';
  document.getElementById('gmPrimordialDeslocamento').value = 8;
  document.getElementById('gmPrimordialRegen').value = '1d10 + Estâmina';
  document.getElementById('gmPrimordialPdeTransform').value = 8;
  document.getElementById('gmPrimordialPdeMaintain').value = 5;
}

function applyGMPrimordialTemplate(templateId) {
  if (!templateId) { applyGMPrimordialTemplateBlank(); return; }
  const t = getTitanById(templateId); if (!t) return;
  document.getElementById('gmPrimordialName').value = t.name;
  document.getElementById('gmPrimordialDescription').value = t.description || '';
  document.getElementById('gmPrimordialNuca').value = t.pdvNuca;
  document.getElementById('gmPrimordialBracoD').value = t.pdvBraco;
  document.getElementById('gmPrimordialBracoE').value = t.pdvBraco;
  document.getElementById('gmPrimordialPernaD').value = t.pdvPerna;
  document.getElementById('gmPrimordialPernaE').value = t.pdvPerna;
  document.getElementById('gmPrimordialAgi').value = t.attrs.agi;
  document.getElementById('gmPrimordialSta').value = t.attrs.sta;
  document.getElementById('gmPrimordialStr').value = t.attrs.str;
  document.getElementById('gmPrimordialVit').value = t.attrs.vit;
  document.getElementById('gmPrimordialAtaqueTest').value = t.ataque.test;
  document.getElementById('gmPrimordialAtaqueDano').value = t.ataque.dano;
  document.getElementById('gmPrimordialDeslocamento').value = t.deslocamentoBase;
  document.getElementById('gmPrimordialRegen').value = t.regen;
  document.getElementById('gmPrimordialPdeTransform').value = t.pdeTransform;
  document.getElementById('gmPrimordialPdeMaintain').value = t.pdeMaintain;
}
document.addEventListener('change', (e) => {
  if (e.target.id === 'gmPrimordialTemplate') applyGMPrimordialTemplate(e.target.value);
});

function openGMPrimordialModal(editId) {
  document.getElementById('gmPrimordialEditId').value = editId || '';
  pendingGMPrimordialImage = null;
  const thumbImg = document.getElementById('gmPrimordialThumbnailImg');
  const thumbPlaceholder = document.getElementById('gmPrimordialThumbnailPlaceholder');
  const select = document.getElementById('gmPrimordialTemplate');
  const allTitans = getAllTitans();
  select.innerHTML = '<option value="">Personalizado (em branco)</option>' + Object.values(allTitans).map(t => `<option value="${t.id}">${t.name}${t.custom ? ' (Custom)' : ''}</option>`).join('');
  select.value = '';
  if (editId) {
    const t = gmPrimordialTitans.find(x => x.id === editId);
    document.getElementById('gmPrimordialModalTitle').textContent = 'Editar Titã Shifter';
    document.getElementById('gmPrimordialName').value = t.name;
    document.getElementById('gmPrimordialDescription').value = t.description || '';
    document.getElementById('gmPrimordialNuca').value = t.parts.nuca.max;
    document.getElementById('gmPrimordialBracoD').value = t.parts.bracoD.max;
    document.getElementById('gmPrimordialBracoE').value = t.parts.bracoE.max;
    document.getElementById('gmPrimordialPernaD').value = t.parts.pernaD.max;
    document.getElementById('gmPrimordialPernaE').value = t.parts.pernaE.max;
    document.getElementById('gmPrimordialAgi').value = t.attrs.agi;
    document.getElementById('gmPrimordialSta').value = t.attrs.sta;
    document.getElementById('gmPrimordialStr').value = t.attrs.str;
    document.getElementById('gmPrimordialVit').value = t.attrs.vit;
    document.getElementById('gmPrimordialAtaqueTest').value = t.ataqueTest || '';
    document.getElementById('gmPrimordialAtaqueDano').value = t.ataqueDano || '';
    document.getElementById('gmPrimordialDeslocamento').value = t.deslocamento || 0;
    document.getElementById('gmPrimordialRegen').value = t.regen || '';
    document.getElementById('gmPrimordialPdeTransform').value = t.pdeTransform || 0;
    document.getElementById('gmPrimordialPdeMaintain').value = t.pdeMaintain || 0;
    if (t.imageUrl) { thumbImg.src = t.imageUrl; thumbImg.classList.remove('hidden'); thumbPlaceholder.classList.add('hidden'); pendingGMPrimordialImage = t.imageUrl; }
    else { thumbImg.classList.add('hidden'); thumbPlaceholder.classList.remove('hidden'); }
  } else {
    document.getElementById('gmPrimordialModalTitle').textContent = 'Criar Titã Shifter';
    document.getElementById('gmPrimordialName').value = 'Titã Primordial';
    document.getElementById('gmPrimordialDescription').value = '';
    applyGMPrimordialTemplateBlank();
    thumbImg.classList.add('hidden'); thumbPlaceholder.classList.remove('hidden');
  }
  document.getElementById('gmPrimordialModal').classList.remove('hidden');
}
function closeGMPrimordialModal() { document.getElementById('gmPrimordialModal').classList.add('hidden'); }

function handleGMPrimordialImageUpload(event) {
  const file = event.target.files[0]; event.target.value = '';
  if (!file) return;
  resizeImageToDataUrl(file, 400, 0.85, (dataUrl) => {
    pendingGMPrimordialImage = dataUrl;
    const thumbImg = document.getElementById('gmPrimordialThumbnailImg');
    thumbImg.src = dataUrl; thumbImg.classList.remove('hidden');
    document.getElementById('gmPrimordialThumbnailPlaceholder').classList.add('hidden');
  });
}

function saveGMPrimordial() {
  const editId = document.getElementById('gmPrimordialEditId').value;
  const name = document.getElementById('gmPrimordialName').value.trim() || 'Titã Primordial';
  const description = document.getElementById('gmPrimordialDescription').value.trim();
  const maxes = {
    nuca: parseInt(document.getElementById('gmPrimordialNuca').value) || 1,
    bracoD: parseInt(document.getElementById('gmPrimordialBracoD').value) || 1,
    bracoE: parseInt(document.getElementById('gmPrimordialBracoE').value) || 1,
    pernaD: parseInt(document.getElementById('gmPrimordialPernaD').value) || 1,
    pernaE: parseInt(document.getElementById('gmPrimordialPernaE').value) || 1
  };
  const attrs = {
    agi: parseInt(document.getElementById('gmPrimordialAgi').value) || 0,
    sta: parseInt(document.getElementById('gmPrimordialSta').value) || 0,
    str: parseInt(document.getElementById('gmPrimordialStr').value) || 0,
    vit: parseInt(document.getElementById('gmPrimordialVit').value) || 0
  };
  const ataqueTest = document.getElementById('gmPrimordialAtaqueTest').value.trim();
  const ataqueDano = document.getElementById('gmPrimordialAtaqueDano').value.trim();
  const deslocamento = parseInt(document.getElementById('gmPrimordialDeslocamento').value) || 0;
  const regen = document.getElementById('gmPrimordialRegen').value.trim();
  const pdeTransform = parseInt(document.getElementById('gmPrimordialPdeTransform').value) || 0;
  const pdeMaintain = parseInt(document.getElementById('gmPrimordialPdeMaintain').value) || 0;

  if (editId) {
    const t = gmPrimordialTitans.find(x => x.id === editId);
    if (t) {
      t.name = name; t.description = description; t.attrs = attrs; t.ataqueTest = ataqueTest; t.ataqueDano = ataqueDano;
      t.deslocamento = deslocamento; t.regen = regen; t.pdeTransform = pdeTransform; t.pdeMaintain = pdeMaintain; t.imageUrl = pendingGMPrimordialImage;
      Object.keys(maxes).forEach(k => {
        const ratio = t.parts[k].max > 0 ? t.parts[k].cur / t.parts[k].max : 1;
        t.parts[k].max = maxes[k];
        t.parts[k].cur = Math.round(maxes[k] * ratio);
      });
    }
    showNotification('Titã Shifter atualizado.', name);
  } else {
    const parts = {};
    Object.keys(maxes).forEach(k => { parts[k] = { cur: maxes[k], max: maxes[k] }; });
    gmPrimordialTitans.push({ id: 'gmprim_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, description, attrs, ataqueTest, ataqueDano, deslocamento, regen, pdeTransform, pdeMaintain, imageUrl: pendingGMPrimordialImage, parts });
    showNotification('Titã Shifter criado.', name);
  }
  saveGMPrimordialTitans();
  closeGMPrimordialModal();
  renderGMPrimordialList();
}

function buildGMPrimordialCard(t) {
  const esquiva = 11 + t.attrs.agi;
  const bloqueio = 11 + t.attrs.str;
  const div = document.createElement('div'); div.className = 'mini-card'; div.style.marginBottom = '12px';
  const avatar = t.imageUrl ? `<img src="${t.imageUrl}" alt="" class="initiative-avatar" style="width:64px;height:64px;" />` : '';
  const partsHtml = Object.keys(TITAN_PART_LABELS).map(partKey => {
    const p = t.parts[partKey];
    const pct = p.max > 0 ? Math.min(100, (p.cur / p.max) * 100) : 0;
    const barClass = pct <= 25 ? ' crit' : pct <= 50 ? ' low' : '';
    return `<div style="margin-top:10px;">
      <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted);"><span>${TITAN_PART_LABELS[partKey]}</span><span style="font-family:var(--mono);">${p.cur}/${p.max}</span></div>
      <div class="resource-bar" style="height:5px;"><div class="resource-fill${barClass}" style="width:${pct}%;"></div></div>
      <div class="resource-controls" style="margin-top:4px;">
        <button class="small" onclick="modGMPrimordialPart('${t.id}','${partKey}',-5)">-5</button>
        <button class="small" onclick="modGMPrimordialPart('${t.id}','${partKey}',-1)">-1</button>
        <button class="small" onclick="modGMPrimordialPart('${t.id}','${partKey}',1)">+1</button>
        <button class="small" onclick="modGMPrimordialPart('${t.id}','${partKey}',5)">+5</button>
      </div>
    </div>`;
  }).join('');
  let totalCur = 0, totalMax = 0;
  Object.values(t.parts).forEach(p => { totalCur += p.cur; totalMax += p.max; });
  div.innerHTML = `
    <div style="display:flex;gap:12px;align-items:flex-start;">
      ${avatar}
      <div style="flex:1;min-width:0;"><h4>${t.name} <span class="tag origin">Shifter</span></h4></div>
    </div>
    ${t.description ? `<p class="desc" style="margin-top:8px;">${t.description}</p>` : ''}
    <div class="grid grid-4" style="margin-top:10px;">
      <div class="attr-card"><div>Agilidade</div><div class="attr-value">${t.attrs.agi}</div></div>
      <div class="attr-card"><div>Estâmina</div><div class="attr-value">${t.attrs.sta}</div></div>
      <div class="attr-card"><div>Força</div><div class="attr-value">${t.attrs.str}</div></div>
      <div class="attr-card"><div>Vitalidade</div><div class="attr-value">${t.attrs.vit}</div></div>
    </div>
    <div class="derived-stat" style="margin-top:10px;"><span><strong>Ataque:</strong></span><span>${t.ataqueDano} — Teste: ${t.ataqueTest}</span></div>
    <div class="derived-stat"><span><strong>Deslocamento:</strong></span><span>${t.deslocamento}m</span></div>
    <div class="derived-stat"><span><strong>Esquiva (fixa):</strong></span><span>${esquiva}</span></div>
    <div class="derived-stat"><span><strong>Bloqueio (fixo):</strong></span><span>${bloqueio}</span></div>
    <div class="derived-stat"><span><strong>Regeneração:</strong></span><span>${t.regen}</span></div>
    <div style="font-family:var(--mono);margin-top:10px;">${totalCur} / ${totalMax} PV total</div>
    ${partsHtml}
    <div class="grid grid-2" style="margin-top:12px;gap:8px;">
      <input type="number" id="healPrimAmount_${t.id}" min="0" value="5" placeholder="Quantidade" />
      <button onclick="healAllGMPrimordialPartsBy('${t.id}')">Curar em Todas as Partes</button>
    </div>
    <div class="resource-controls" style="margin-top:8px;">
      <button onclick="healAllGMPrimordialParts('${t.id}')">Curar Tudo (Máximo)</button>
    </div>
    <div class="resource-controls" style="margin-top:6px;">
      <button onclick="openGMPrimordialModal('${t.id}')">Editar</button>
      <button onclick="duplicateGMPrimordial('${t.id}')">Duplicar</button>
      <button class="danger" onclick="deleteGMPrimordial('${t.id}')">Excluir</button>
    </div>`;
  return div;
}

function renderGMPrimordialList() {
  const container = document.getElementById('gmPrimordialList'); container.innerHTML = '';
  if (gmPrimordialTitans.length === 0) { container.innerHTML = '<p class="empty-note">Nenhum Titã Shifter cadastrado.</p>'; return; }
  gmPrimordialTitans.forEach(t => container.appendChild(buildGMPrimordialCard(t)));
}

function modGMPrimordialPart(id, part, delta) {
  const t = gmPrimordialTitans.find(x => x.id === id); if (!t) return;
  const p = t.parts[part]; if (!p) return;
  p.cur = Math.max(0, Math.min(p.max, p.cur + delta));
  saveGMPrimordialTitans(); renderGMPrimordialList();
}
function healAllGMPrimordialParts(id) {
  const t = gmPrimordialTitans.find(x => x.id === id); if (!t) return;
  Object.values(t.parts).forEach(p => { p.cur = p.max; });
  saveGMPrimordialTitans(); renderGMPrimordialList();
  showNotification('Titã Shifter totalmente curado.', t.name);
}
function healAllGMPrimordialPartsBy(id) {
  const t = gmPrimordialTitans.find(x => x.id === id); if (!t) return;
  const amount = parseInt(document.getElementById('healPrimAmount_' + id).value) || 0;
  Object.values(t.parts).forEach(p => { p.cur = Math.max(0, Math.min(p.max, p.cur + amount)); });
  saveGMPrimordialTitans(); renderGMPrimordialList();
  showNotification('Cura aplicada em todas as partes.', `+${amount} PV`);
}
function duplicateGMPrimordial(id) {
  const t = gmPrimordialTitans.find(x => x.id === id); if (!t) return;
  const copy = JSON.parse(JSON.stringify(t));
  copy.id = 'gmprim_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  copy.name = t.name + ' (Cópia)';
  gmPrimordialTitans.push(copy);
  saveGMPrimordialTitans(); renderGMPrimordialList();
  showNotification('Titã Shifter duplicado.', copy.name);
}
function deleteGMPrimordial(id) {
  showConfirm('Excluir este Titã Shifter?', () => {
    gmPrimordialTitans = gmPrimordialTitans.filter(x => x.id !== id);
    saveGMPrimordialTitans(); renderGMPrimordialList();
    showNotification('Titã Shifter excluído.', '');
  });
}

function renderRulesReference() {
  const container = document.getElementById('rulesGrid'); container.innerHTML = '';
  const term = document.getElementById('rulesSearch').value.toLowerCase();
  const categories = [...new Set(RULES_REFERENCE.map(r => r.category))];
  categories.forEach(cat => {
    const entries = RULES_REFERENCE.filter(r => r.category === cat && (!term || r.title.toLowerCase().includes(term) || r.text.toLowerCase().includes(term) || (r.list && r.list.some(li => li.toLowerCase().includes(term)))));
    if (entries.length === 0) return;
    const catDiv = document.createElement('div'); catDiv.className = 'ability-category';
    catDiv.innerHTML = `<h4>${cat}</h4>` + entries.map(e => {
      const listHtml = e.list ? `<ul style="margin:8px 0 0 18px;padding:0;">${e.list.map(li => `<li style="margin-top:4px;color:var(--text-muted);font-size:0.85rem;">${li}</li>`).join('')}</ul>` : '';
      return `<div class="ability-item"><h5>${e.title}</h5><p>${e.text}</p>${listHtml}</div>`;
    }).join('');
    container.appendChild(catDiv);
  });
  if (container.innerHTML === '') container.innerHTML = '<p class="empty-note">Nenhuma regra encontrada.</p>';
}

function renderBiomas() {
  const ambienteGrid = document.getElementById('biomasAmbienteGrid');
  const climaGrid = document.getElementById('biomasClimaGrid');
  ambienteGrid.innerHTML = ''; climaGrid.innerHTML = '';
  BIOMAS_DB.forEach(b => {
    const div = document.createElement('div'); div.className = 'mini-card';
    const isActive = gmActiveBiomaIds.includes(b.id);
    div.innerHTML = `<h4>${b.name}</h4><p class="desc">${b.bonus}</p><button class="${isActive ? 'primary' : ''}" style="margin-top:10px;width:100%;" onclick="${isActive ? `desativarBioma('${b.id}')` : `ativarBioma('${b.id}')`}">${isActive ? 'Ativo — Desativar' : 'Ativar Bioma'}</button>`;
    (b.tipo === 'clima' ? climaGrid : ambienteGrid).appendChild(div);
  });
  renderActiveBiomaBanner();
}

function renderActiveBiomaBanner() {
  const banner = document.getElementById('activeBiomaBanner');
  if (gmActiveBiomaIds.length === 0) { banner.innerHTML = '<p class="empty-note">Nenhum bioma ativo no momento. Ative um ambiente e/ou um clima abaixo — os efeitos se somam.</p>'; return; }
  banner.innerHTML = gmActiveBiomaIds.map(id => {
    const b = getBioma(id); if (!b) return '';
    return `<div class="ability-item" style="border-left:3px solid var(--accent);margin-bottom:8px;"><h5>${b.name}</h5><p>${b.bonus}</p></div>`;
  }).join('');
}

function ativarBioma(id) {
  if (!gmActiveBiomaIds.includes(id)) gmActiveBiomaIds.push(id);
  localStorage.setItem('rpgGMActiveBiomas', JSON.stringify(gmActiveBiomaIds));
  renderBiomas();
  showNotification('Bioma ativado.', getBioma(id) ? getBioma(id).name : '');
}
function desativarBioma(id) {
  gmActiveBiomaIds = gmActiveBiomaIds.filter(x => x !== id);
  localStorage.setItem('rpgGMActiveBiomas', JSON.stringify(gmActiveBiomaIds));
  renderBiomas();
  showNotification('Bioma desativado.', getBioma(id) ? getBioma(id).name : '');
}

/* ============================================================
   INICIATIVA (ARRASTÁVEL)
   ============================================================ */
function renderInitiative() {
  const list = document.getElementById('initiativeList'); list.innerHTML = '';
  if (gmInitiative.length === 0) { list.innerHTML = '<p class="empty-note">Nenhum participante adicionado ainda.</p>'; return; }
  gmInitiative.forEach((p, idx) => {
    const div = document.createElement('div');
    div.className = 'initiative-token';
    div.draggable = true;
    div.ondragstart = (e) => { initiativeDragIndex = idx; e.dataTransfer.effectAllowed = 'move'; div.classList.add('dragging'); };
    div.ondragend = () => { div.classList.remove('dragging'); };
    div.ondragover = (e) => { e.preventDefault(); div.classList.add('drag-over'); };
    div.ondragleave = () => { div.classList.remove('drag-over'); };
    div.ondrop = (e) => {
      e.preventDefault(); div.classList.remove('drag-over');
      if (initiativeDragIndex === null || initiativeDragIndex === idx) return;
      const [moved] = gmInitiative.splice(initiativeDragIndex, 1);
      gmInitiative.splice(idx, 0, moved);
      initiativeDragIndex = null;
      saveGMInitiative(); renderInitiative();
    };
    const pvPct = p.pvMax > 0 ? Math.min(100, (p.pvCur / p.pvMax) * 100) : 0;
    const pePct = p.peMax > 0 ? Math.min(100, (p.peCur / p.peMax) * 100) : 0;
    const pvLabel = p.isNucaOnly ? 'PDV (Nuca)' : 'PDV';
    const avatar = p.imageUrl ? `<img src="${p.imageUrl}" alt="" class="initiative-avatar" />` : `<div class="initiative-avatar initiative-avatar-empty">${(idx + 1)}</div>`;
    div.innerHTML = `
      <div class="initiative-drag-handle" title="Arraste para reordenar">
        <svg viewBox="0 0 24 24" width="16" height="16"><circle cx="8" cy="6" r="1.6" fill="currentColor"/><circle cx="16" cy="6" r="1.6" fill="currentColor"/><circle cx="8" cy="12" r="1.6" fill="currentColor"/><circle cx="16" cy="12" r="1.6" fill="currentColor"/><circle cx="8" cy="18" r="1.6" fill="currentColor"/><circle cx="16" cy="18" r="1.6" fill="currentColor"/></svg>
      </div>
      <span class="initiative-order">${idx + 1}</span>
      ${avatar}
      <div style="flex:1;min-width:160px;">
        <h4 style="margin-bottom:6px;">${p.name}</h4>
        <div style="font-size:0.75rem;color:var(--text-muted);">${pvLabel} <span style="font-family:var(--mono);">${p.pvCur}/${p.pvMax}</span></div>
        <div class="resource-bar" style="height:5px;"><div class="resource-fill${pvPct <= 25 ? ' crit' : pvPct <= 50 ? ' low' : ''}" style="width:${pvPct}%;"></div></div>
        ${p.peMax > 0 ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">PDE <span style="font-family:var(--mono);">${p.peCur}/${p.peMax}</span></div><div class="resource-bar" style="height:5px;"><div class="resource-fill${pePct <= 25 ? ' crit' : pePct <= 50 ? ' low' : ''}" style="width:${pePct}%;"></div></div>` : ''}
      </div>
      <div class="initiative-actions">
        <div class="resource-controls">
          <button class="small" onclick="modInitiativeStat('${p.id}','pvCur',-1)">-1 ${p.isNucaOnly ? 'Nuca' : 'PDV'}</button>
          <button class="small" onclick="modInitiativeStat('${p.id}','pvCur',1)">+1 ${p.isNucaOnly ? 'Nuca' : 'PDV'}</button>
        </div>
        ${p.peMax > 0 ? `<div class="resource-controls">
          <button class="small" onclick="modInitiativeStat('${p.id}','peCur',-1)">-1 PDE</button>
          <button class="small" onclick="modInitiativeStat('${p.id}','peCur',1)">+1 PDE</button>
        </div>` : ''}
        <div class="resource-controls">
          <button class="small" onclick="openInitiativeModal('${p.id}')">Editar</button>
          <button class="small danger" onclick="removeInitiativeParticipant('${p.id}')">Remover</button>
        </div>
      </div>`;
    list.appendChild(div);
  });
}

function modInitiativeStat(id, field, delta) {
  const p = gmInitiative.find(x => x.id === id); if (!p) return;
  const maxField = field === 'pvCur' ? 'pvMax' : 'peMax';
  p[field] = Math.max(0, Math.min(p[maxField], p[field] + delta));
  saveGMInitiative(); renderInitiative();
}

function openInitiativeModal(editId) {
  document.getElementById('initiativeEditId').value = editId || '';
  pendingInitiativeImage = null;
  const thumbImg = document.getElementById('initiativeThumbnailImg');
  const thumbPlaceholder = document.getElementById('initiativeThumbnailPlaceholder');
  if (editId) {
    const p = gmInitiative.find(x => x.id === editId);
    document.getElementById('initiativeModalTitle').textContent = 'Editar Participante';
    document.getElementById('initiativeName').value = p.name;
    document.getElementById('initiativePvCur').value = p.pvCur;
    document.getElementById('initiativePvMax').value = p.pvMax;
    document.getElementById('initiativePeCur').value = p.peCur;
    document.getElementById('initiativePeMax').value = p.peMax;
    if (p.imageUrl) { thumbImg.src = p.imageUrl; thumbImg.classList.remove('hidden'); thumbPlaceholder.classList.add('hidden'); pendingInitiativeImage = p.imageUrl; }
    else { thumbImg.classList.add('hidden'); thumbPlaceholder.classList.remove('hidden'); }
  } else {
    document.getElementById('initiativeModalTitle').textContent = 'Adicionar Participante';
    document.getElementById('initiativeName').value = '';
    document.getElementById('initiativePvCur').value = 10;
    document.getElementById('initiativePvMax').value = 10;
    document.getElementById('initiativePeCur').value = 10;
    document.getElementById('initiativePeMax').value = 10;
    thumbImg.classList.add('hidden'); thumbPlaceholder.classList.remove('hidden');
  }
  document.getElementById('initiativeModal').classList.remove('hidden');
}
function closeInitiativeModal() { document.getElementById('initiativeModal').classList.add('hidden'); pendingInitiativeImage = null; }

function handleInitiativeImageUpload(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) { showNotification('Arquivo inválido.', 'Selecione uma imagem.', true); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 300;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) { if (w > h) { h = Math.round(h * (maxDim / w)); w = maxDim; } else { w = Math.round(w * (maxDim / h)); h = maxDim; } }
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      pendingInitiativeImage = canvas.toDataURL('image/jpeg', 0.85);
      const thumbImg = document.getElementById('initiativeThumbnailImg');
      thumbImg.src = pendingInitiativeImage; thumbImg.classList.remove('hidden');
      document.getElementById('initiativeThumbnailPlaceholder').classList.add('hidden');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveInitiativeParticipant() {
  const editId = document.getElementById('initiativeEditId').value;
  const name = document.getElementById('initiativeName').value.trim();
  if (!name) { showNotification('Informe um nome.', '', true); return; }
  const data = {
    name,
    pvCur: parseInt(document.getElementById('initiativePvCur').value) || 0,
    pvMax: parseInt(document.getElementById('initiativePvMax').value) || 0,
    peCur: parseInt(document.getElementById('initiativePeCur').value) || 0,
    peMax: parseInt(document.getElementById('initiativePeMax').value) || 0,
    imageUrl: pendingInitiativeImage
  };
  if (editId) {
    const p = gmInitiative.find(x => x.id === editId);
    if (p) Object.assign(p, data);
    showNotification('Participante atualizado.', name);
  } else {
    gmInitiative.push({ id: 'init_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...data });
    showNotification('Participante adicionado.', name);
  }
  saveGMInitiative();
  closeInitiativeModal();
  renderInitiative();
}

function removeInitiativeParticipant(id) {
  showConfirm('Remover este participante da iniciativa?', () => {
    gmInitiative = gmInitiative.filter(x => x.id !== id);
    saveGMInitiative(); renderInitiative();
    showNotification('Participante removido.', '');
  });
}

function clearInitiative() {
  showConfirm('Limpar toda a ordem de iniciativa?', () => {
    gmInitiative = [];
    saveGMInitiative(); renderInitiative();
    showNotification('Iniciativa limpa.', '');
  });
}

let initiativePickerType = 'soldados';
function openInitiativePickerModal(type) {
  initiativePickerType = type;
  document.getElementById('initiativePickerTitle').textContent = type === 'soldados' ? 'Puxar Soldado para a Iniciativa' : 'Puxar Titã para a Iniciativa';
  renderInitiativePickerGrid();
  document.getElementById('initiativePickerModal').classList.remove('hidden');
}
function closeInitiativePickerModal() { document.getElementById('initiativePickerModal').classList.add('hidden'); }

function renderInitiativePickerGrid() {
  const container = document.getElementById('initiativePickerGrid'); container.innerHTML = '';
  if (initiativePickerType === 'soldados') {
    if (characters.length === 0) { container.innerHTML = '<p class="empty-note">Nenhuma ficha de personagem salva ainda.</p>'; return; }
    characters.forEach(ch => {
      const already = gmInitiative.some(p => p.sourceId === ch.id && p.sourceType === 'soldado');
      const div = document.createElement('div'); div.className = 'mini-card';
      div.innerHTML = `<h4>${ch.name}</h4><p class="desc">Nível ${ch.level}</p><button ${already ? 'disabled' : ''} class="primary" style="margin-top:10px;width:100%;" onclick="pullSoldierToInitiative('${ch.id}')">${already ? 'Já na Iniciativa' : 'Puxar'}</button>`;
      container.appendChild(div);
    });
  } else {
    if (gmTitans.length === 0) { container.innerHTML = '<p class="empty-note">Nenhum Titã cadastrado ainda. Vá até a aba Titãs.</p>'; return; }
    gmTitans.forEach(t => {
      const already = gmInitiative.some(p => p.sourceId === t.id && p.sourceType === 'titan');
      const cat = getPureTitanCategory(t.categoryId);
      const div = document.createElement('div'); div.className = 'mini-card';
      div.innerHTML = `<h4>${t.name}</h4><p class="desc">${cat ? cat.label : 'Custom'}</p><button ${already ? 'disabled' : ''} class="primary" style="margin-top:10px;width:100%;" onclick="pullTitanToInitiative('${t.id}')">${already ? 'Já na Iniciativa' : 'Puxar'}</button>`;
      container.appendChild(div);
    });
  }
}

function pullSoldierToInitiative(charId) {
  const ch = characters.find(c => c.id === charId); if (!ch) return;
  ensureCharDefaults(ch);
  const hp = ch.resources.hp, sta = ch.resources.sta;
  gmInitiative.push({
    id: 'init_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: ch.name, imageUrl: ch.imageUrl || null,
    pvCur: hp.cur, pvMax: hp.max, peCur: sta.cur, peMax: sta.max,
    sourceType: 'soldado', sourceId: ch.id
  });
  saveGMInitiative(); renderInitiative(); renderInitiativePickerGrid();
  showNotification('Soldado adicionado à iniciativa.', ch.name);
}

function pullTitanToInitiative(titanId) {
  const t = gmTitans.find(x => x.id === titanId); if (!t) return;
  ensureGMTitanParts(t);
  gmInitiative.push({
    id: 'init_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: t.name, imageUrl: t.imageUrl || null,
    pvCur: t.parts.nuca.cur, pvMax: t.parts.nuca.max, peCur: 0, peMax: 0,
    sourceType: 'titan', sourceId: t.id, isNucaOnly: true
  });
  saveGMInitiative(); renderInitiative(); renderInitiativePickerGrid();
  showNotification('Titã adicionado à iniciativa.', t.name);
}

function openChar(id) {
  currentCharId = id;
  const ch = characters.find(c => c.id === id); if (!ch) return;
  ensureCharDefaults(ch);
  recalcAllModifiers(ch);
  document.getElementById('screenHome').classList.add('hidden');
  document.getElementById('screenWizard').classList.add('hidden');
  document.getElementById('screenSheet').classList.remove('hidden');
  document.getElementById('btnBackHeader').classList.remove('hidden');
  window.scrollTo(0, 0);
  document.getElementById('charName').value = ch.name || '';
  document.getElementById('charPlayer').value = ch.player || '';
  document.getElementById('charLevel').value = ch.level || 0;
  document.getElementById('charExp').value = ch.exp || 0;
  document.getElementById('charOrigin').value = ch.originId ? (getOriginById(ch.originId)?.name || '') : '';
  document.getElementById('charClass').value = ch.class || '';
  document.getElementById('charAlignment').value = ch.alignment || '';
  document.getElementById('charCampaign').value = ch.campaign || '';
  updateClassSubclassOptions();
  updateAttrUI(); updateResourceUI(); renderSkills(); renderInventory(); renderProgression(); renderAvailableBenefits();
  document.getElementById('infoAppearance').value = ch.info?.appearance || '';
  document.getElementById('infoAge').value = ch.info?.age || '';
  document.getElementById('infoHeight').value = ch.info?.height || '';
  document.getElementById('infoWeight').value = ch.info?.weight || '';
  document.getElementById('infoGender').value = ch.info?.gender || '';
  document.getElementById('infoHair').value = ch.info?.hair || '';
  document.getElementById('infoEyes').value = ch.info?.eyes || '';
  document.getElementById('infoSkin').value = ch.info?.skin || '';
  document.getElementById('infoClothes').value = ch.info?.clothes || '';
  document.getElementById('infoSize').value = ch.info?.size || '';
  document.getElementById('infoMarks').value = ch.info?.marks || '';
  document.getElementById('infoTraits').value = ch.info?.traits || '';
  document.getElementById('infoIdeals').value = ch.info?.ideals || '';
  document.getElementById('infoBonds').value = ch.info?.bonds || '';
  document.getElementById('infoFlaws').value = ch.info?.flaws || '';
  document.getElementById('charHistory').value = ch.history || '';
  renderAbilities();
  renderTalentsDefectsSummary();
  renderModifierStats();
  renderDMT();
  renderConditions();
  renderShifterTab();
  renderCharImage();
  renderQuickAttacks();
  document.title = `Coordenada — ${ch.name}`;
}

function getCurrentChar() { return characters.find(c => c.id === currentCharId); }

function updateClassSubclassOptions() {
  const ch = getCurrentChar(); if (!ch) return;
  const classSelect = document.getElementById('charClass'), subclassSelect = document.getElementById('charSubclass');
  const currentClass = ch.class || classSelect.value;
  subclassSelect.innerHTML = '<option value="">Selecione...</option>';
  if (currentClass && SUBCLASSES[currentClass]) {
    SUBCLASSES[currentClass].forEach(sub => {
      const option = document.createElement('option'); option.value = sub; option.textContent = sub;
      if (ch.subclass === sub) option.selected = true;
      subclassSelect.appendChild(option);
    });
  }
}

function modAttr(attr, delta) {
  const ch = getCurrentChar(); if (!ch) return;
  const currentTotal = ch.attributes[attr] + (ch.attributeBonuses[attr] || 0);
  if (delta > 0 && currentTotal >= 20) return;
  if (delta < 0 && currentTotal <= 1) return;
  ch.attributes[attr] += delta;
  ch.updatedAt = new Date().toISOString();
  saveChars(); recalculateResources(ch);
  updateAttrUI(); updateResourceUI(); renderSkills(); renderInventory();
  if (ch.shifter && ch.shifter.isShifter) { recomputeShifterParts(ch); saveChars(); renderShifterTab(); }
}

function updateAttrUI() {
  const ch = getCurrentChar(); if (!ch) return;
  const agi = ch.attributes.agi + (ch.attributeBonuses.agi || 0), sta = ch.attributes.sta + (ch.attributeBonuses.sta || 0);
  const str = ch.attributes.str + (ch.attributeBonuses.str || 0), int = ch.attributes.int + (ch.attributeBonuses.int || 0);
  const vit = ch.attributes.vit + (ch.attributeBonuses.vit || 0);
  document.getElementById('attrAgi').textContent = agi; document.getElementById('attrSta').textContent = sta;
  document.getElementById('attrStr').textContent = str; document.getElementById('attrInt').textContent = int;
  document.getElementById('attrVit').textContent = vit;
  const overload = getOverloadPenalty(ch);
  let movement = 5 + agi - overload + (ch.derivedModifiers.movementFlat || 0);
  if ((ch.conditions.fadiga.points || 0) >= 4) movement = Math.floor(movement / 2);
  document.getElementById('movement').textContent = Math.max(0, movement);
  document.getElementById('staPDEBonus').textContent = sta;
  document.getElementById('strInvBonus').textContent = str;
  document.getElementById('intSkillBonus').textContent = int;
  document.getElementById('intSANBonus').textContent = int;
  document.getElementById('vitPDVBonus').textContent = vit * 2;
  document.getElementById('unarmedDamage').textContent = Math.ceil(str / 2);
}

function modResource(res, delta) {
  const ch = getCurrentChar(); if (!ch) return;
  const r = ch.resources[res];
  r.cur = Math.max(0, Math.min(r.max, r.cur + delta));
  ch.updatedAt = new Date().toISOString(); saveChars(); updateResourceUI();
}
let pendingSetResourceKey = null;
function setResource(res) {
  const ch = getCurrentChar(); if (!ch) return;
  pendingSetResourceKey = res;
  const labels = { hp: 'PDV', sta: 'PDE', san: 'Sanidade' };
  document.getElementById('setResourceTitle').textContent = `Definir ${labels[res] || res.toUpperCase()} Atual`;
  document.getElementById('setResourceInput').value = ch.resources[res].cur;
  document.getElementById('setResourceInput').max = ch.resources[res].max;
  document.getElementById('setResourceModal').classList.remove('hidden');
}
function closeSetResourceModal() { document.getElementById('setResourceModal').classList.add('hidden'); pendingSetResourceKey = null; }
function confirmSetResource() {
  const ch = getCurrentChar(); if (!ch || !pendingSetResourceKey) return;
  const num = parseInt(document.getElementById('setResourceInput').value, 10);
  if (isNaN(num)) { showNotification('Informe um número válido.', '', true); return; }
  ch.resources[pendingSetResourceKey].cur = Math.max(0, Math.min(ch.resources[pendingSetResourceKey].max, num));
  ch.updatedAt = new Date().toISOString(); saveChars(); updateResourceUI();
  closeSetResourceModal();
}

function renderResourceBar(key, curId, maxId, barId) {
  const ch = getCurrentChar(); if (!ch) return;
  const r = ch.resources[key];
  document.getElementById(curId).textContent = r.cur; document.getElementById(maxId).textContent = r.max;
  const pct = r.max > 0 ? (r.cur / r.max) * 100 : 0;
  const bar = document.getElementById(barId);
  bar.style.width = Math.min(100, pct) + '%';
  bar.className = 'resource-fill' + (pct <= 25 ? ' crit' : pct <= 50 ? ' low' : '');
}

function renderResourceModList(key, containerId) {
  const ch = getCurrentChar(); if (!ch) return;
  const container = document.getElementById(containerId); if (!container) return;
  container.innerHTML = '';
  const mods = (ch.resourceModifiers && ch.resourceModifiers[key]) || [];
  mods.forEach(m => {
    const div = document.createElement('div'); div.className = 'modifier-row';
    div.innerHTML = `<span>${m.name}</span><span><span class="mval ${m.value >= 0 ? 'pos' : 'neg'}">${m.value >= 0 ? '+' : ''}${m.value}</span><button class="small danger" style="margin-left:10px;" onclick="removeResourceModifier('${key}', '${m.id}')">Remover</button></span>`;
    container.appendChild(div);
  });
}

function updateResourceUI() {
  const ch = getCurrentChar(); if (!ch) return;
  renderResourceBar('hp', 'hpCurrent', 'hpMax', 'hpBar');
  renderResourceBar('sta', 'staCurrent', 'staMax', 'staBar');
  renderResourceBar('san', 'sanCurrent', 'sanMax', 'sanBar');
  renderResourceModList('hp', 'hpModList');
  renderResourceModList('sta', 'staModList');
  renderResourceModList('san', 'sanModList');
  renderCombatDefenses();
}

function renderCombatDefenses() {
  const ch = getCurrentChar(); if (!ch) return;
  const agi = ch.attributes.agi + (ch.attributeBonuses.agi || 0);
  const str = ch.attributes.str + (ch.attributeBonuses.str || 0);
  const lutaSkill = ch.skills.find(s => s.name === 'Luta');
  const lutaInvested = lutaSkill ? lutaSkill.base : 0;
  const talentBonus = ch.derivedModifiers.defesaEsquiva || 0;
  const vulneravelPenalty = ch.conditions.vulneravel.active ? -4 : 0;
  const esquivaTotal = agi + talentBonus + vulneravelPenalty;
  document.getElementById('esquivaTotal').textContent = (esquivaTotal >= 0 ? '+' : '') + esquivaTotal;
  document.getElementById('esquivaBreakdown').textContent = `Agilidade (+${agi})${talentBonus ? ` + talentos (${talentBonus >= 0 ? '+' : ''}${talentBonus})` : ''}${vulneravelPenalty ? ` + Vulnerável (${vulneravelPenalty})` : ''}`;
  const bloqueioTotal = 8 + str + lutaInvested + vulneravelPenalty;
  document.getElementById('bloqueioTotal').textContent = bloqueioTotal;
  document.getElementById('bloqueioBreakdown').textContent = `8 + Força (${str}) + Luta investida (${lutaInvested})${vulneravelPenalty ? ` + Vulnerável (${vulneravelPenalty})` : ''}`;
}

function openResourceBonusModal(key) {
  document.getElementById('resourceBonusTarget').value = key;
  const labels = { hp: 'PDV', sta: 'PDE', san: 'Sanidade', personalCapacity: 'Capacidade de Inventário' };
  document.getElementById('resourceBonusTitle').textContent = `Adicionar Bônus de ${labels[key] || key}`;
  document.getElementById('resourceBonusName').value = '';
  document.getElementById('resourceBonusValue').value = 1;
  document.getElementById('resourceBonusModal').classList.remove('hidden');
}
function closeResourceBonusModal() { document.getElementById('resourceBonusModal').classList.add('hidden'); }

function addResourceModifier() {
  const ch = getCurrentChar(); if (!ch) return;
  const key = document.getElementById('resourceBonusTarget').value;
  const name = document.getElementById('resourceBonusName').value.trim() || 'Bônus';
  const value = parseInt(document.getElementById('resourceBonusValue').value) || 0;
  if (!value) { showNotification('Informe um valor diferente de zero.', '', true); return; }
  if (key === 'personalCapacity') {
    if (!ch.inventory.personal.capacityModifiers) ch.inventory.personal.capacityModifiers = [];
    ch.inventory.personal.capacityModifiers.push({ id: genId(), name, value });
    ch.updatedAt = new Date().toISOString();
    saveChars();
    closeResourceBonusModal();
    renderInventory();
    showNotification('Bônus de capacidade adicionado.', name);
    return;
  }
  if (!ch.resourceModifiers) ch.resourceModifiers = { hp: [], sta: [], san: [] };
  if (!ch.resourceModifiers[key]) ch.resourceModifiers[key] = [];
  ch.resourceModifiers[key].push({ id: genId(), name, value, origem: 'Manual' });
  ch.updatedAt = new Date().toISOString();
  recalculateResources(ch);
  saveChars();
  closeResourceBonusModal();
  updateResourceUI();
  showNotification('Bônus de recurso adicionado.', name);
}

function removeResourceModifier(key, modId) {
  const ch = getCurrentChar(); if (!ch) return;
  ch.resourceModifiers[key] = (ch.resourceModifiers[key] || []).filter(m => m.id !== modId);
  ch.updatedAt = new Date().toISOString();
  recalculateResources(ch);
  saveChars();
  updateResourceUI();
  showNotification('Bônus removido.', '');
}

function renderSkills() {
  const ch = getCurrentChar(); if (!ch) return;
  const container = document.getElementById('skillList'); container.innerHTML = '';
  const limit = getSkillLimit(ch); document.getElementById('skillLimit').textContent = limit;
  ch.skills.forEach((skill) => {
    const result = calculateSkill(SKILLS_DATA[skill.name]?.id || skill.name.toLowerCase(), ch);
    if (!result) return;
    let bonusText = '';
    if (result.modifiers.length > 0) bonusText = result.modifiers.map(m => `${m.value > 0 ? '+' : ''}${m.value} ${m.source}`).join(', ');
    const flag = (ch.skillFlags || {})[skill.name];
    const row = document.createElement('div'); row.className = 'skill-row';
    row.innerHTML = `<div><span class="skill-name" onclick="openSkillDetailModal('${skill.name}')">${skill.name}</span>${bonusText ? `<span class="bonus-badge">${bonusText}</span>` : ''}${flag === 'disadvantage' ? '<span class="flag-badge">Desvantagem</span>' : ''}</div><div class="skill-row-info">${ATTRIBUTES[result.selectedAttribute].name} ${result.attributeValue} (metade +${result.attributeBonus})<br>Investido +${result.investedPoints}</div><div class="skill-row-total">${result.total}</div><div class="skill-row-controls"><button onclick="modSkill('${skill.name}', -1)" ${skill.base <= 0 ? 'disabled' : ''}>-</button><button onclick="modSkill('${skill.name}', 1)" ${!canAddSkillPoint(ch, skill.name) ? 'disabled' : ''}>+</button></div>`;
    container.appendChild(row);
  });
}

function modSkill(skillName, delta) {
  const ch = getCurrentChar(); if (!ch) return;
  const skill = ch.skills.find(s => s.name === skillName); if (!skill) return;
  if (delta > 0) { if (!canAddSkillPoint(ch, skillName)) return; skill.base++; }
  else { if (skill.base <= 0) return; skill.base--; }
  ch.updatedAt = new Date().toISOString(); saveChars(); renderSkills(); renderCombatDefenses();
}

function openSkillDetailModal(skillName) {
  const ch = getCurrentChar(); if (!ch) return;
  const skill = ch.skills.find(s => s.name === skillName); if (!skill) return;
  const skillData = SKILLS_DATA[skillName]; if (!skillData) return;
  const result = calculateSkill(skillData.id, ch); if (!result) return;
  currentSkillDetail = skillName;
  document.getElementById('skillDetailTitle').textContent = skillData.name;
  document.getElementById('skillDescription').textContent = skillData.description;
  const attrSelect = document.getElementById('skillAttributeSelect'); attrSelect.innerHTML = '';
  skillData.attributes.forEach(attr => {
    const option = document.createElement('option'); option.value = attr; option.textContent = ATTRIBUTES[attr].name;
    if (skill.selectedAttribute === attr) option.selected = true;
    attrSelect.appendChild(option);
  });
  updateSkillDetailValues();
  document.getElementById('skillDetailModal').classList.remove('hidden');
}
function closeSkillDetailModal() { document.getElementById('skillDetailModal').classList.add('hidden'); currentSkillDetail = null; }

function updateSkillDetailValues() {
  const ch = getCurrentChar(); if (!ch || !currentSkillDetail) return;
  const skill = ch.skills.find(s => s.name === currentSkillDetail); if (!skill) return;
  const result = calculateSkill(SKILLS_DATA[currentSkillDetail].id, ch); if (!result) return;
  document.getElementById('skillAttrValue').textContent = result.attributeBonus;
  document.getElementById('skillAttrRaw').textContent = result.attributeValue;
  document.getElementById('skillInvestedValue').textContent = result.investedPoints;
  document.getElementById('skillTotalValue').textContent = result.total;
  const bonusList = document.getElementById('skillBonusList'); bonusList.innerHTML = '';
  if (result.modifiers.length === 0) bonusList.innerHTML = '<p style="color:var(--text-dim);font-size:0.82rem;">Nenhum bônus aplicado</p>';
  else result.modifiers.forEach((mod) => {
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--surface-3);border-radius:2px;margin-top:6px;gap:8px;flex-wrap:wrap;';
    const removeBtn = (mod.sourceType === 'manual' && mod.id) ? `<button class="small danger" onclick="removeSkillModifier('${currentSkillDetail}', '${mod.id}')">Remover</button>` : `<span class="mtag">automático</span>`;
    div.innerHTML = `<span>${mod.source} ${mod.ignoresCap ? '<span class="tag" style="margin-left:8px;">Ignora limite</span>' : ''}</span><span style="display:flex;align-items:center;gap:10px;"><span style="font-family:var(--mono);font-weight:700;color:${mod.value >= 0 ? 'var(--success)' : 'var(--danger)'};">${mod.value > 0 ? '+' : ''}${mod.value}</span>${removeBtn}</span>`;
    bonusList.appendChild(div);
  });
}

function changeSkillAttribute() {
  const ch = getCurrentChar(); if (!ch || !currentSkillDetail) return;
  const skill = ch.skills.find(s => s.name === currentSkillDetail); if (!skill) return;
  skill.selectedAttribute = document.getElementById('skillAttributeSelect').value;
  ch.updatedAt = new Date().toISOString(); saveChars(); updateSkillDetailValues(); renderSkills();
}

function openSkillBonusModal() {
  document.getElementById('bonusSkillSource').value = ''; document.getElementById('bonusSkillValue').value = 1;
  document.getElementById('bonusSkillIgnoresCap').checked = false;
  document.getElementById('skillBonusModal').classList.remove('hidden');
}
function closeSkillBonusModal() { document.getElementById('skillBonusModal').classList.add('hidden'); }

function addManualSkillBonus() {
  const ch = getCurrentChar(); if (!ch || !currentSkillDetail) return;
  const skill = ch.skills.find(s => s.name === currentSkillDetail); if (!skill) return;
  const name = document.getElementById('bonusSkillSource').value.trim() || 'Modificador';
  const origem = document.getElementById('bonusSkillOrigin').value;
  const value = parseInt(document.getElementById('bonusSkillValue').value) || 0;
  const ignoresCap = document.getElementById('bonusSkillIgnoresCap').checked;
  if (!value) { showNotification('Informe um valor diferente de zero.', '', true); return; }
  if (!skill.modifiers) skill.modifiers = [];
  skill.modifiers.push({ id: genId(), source: `${origem}: ${name}`, sourceType: 'manual', origem, value, ignoresCap });
  ch.updatedAt = new Date().toISOString(); saveChars();
  closeSkillBonusModal(); updateSkillDetailValues(); renderSkills();
  showNotification('Modificador adicionado.', name);
}

function removeSkillModifier(skillName, modifierId) {
  const ch = getCurrentChar(); if (!ch) return;
  const skill = ch.skills.find(s => s.name === skillName); if (!skill) return;
  skill.modifiers = (skill.modifiers || []).filter(m => m.id !== modifierId);
  ch.updatedAt = new Date().toISOString();
  saveChars();
  if (currentSkillDetail === skillName) updateSkillDetailValues();
  renderSkills();
  showNotification('Modificador removido.', '');
}

const PROGRESSION_INFO = {
  origin: { title: 'Origem', desc: 'Escolha a Origem do personagem, definindo status iniciais, passiva e habilidade de origem.' },
  initial_attributes: { title: 'Atributos Iniciais', desc: 'Distribua os valores 4, 3, 2, 2, 1 entre os atributos.' },
  initial_skills: { title: 'Perícias Iniciais', desc: 'Distribua os pontos de perícia iniciais entre suas perícias.' },
  class: { title: 'Classe', desc: 'Escolha sua Classe: Linha de Frente, Suporte de Campo ou Especialista de Batalha.' },
  subclass: { title: 'Subclasse', desc: 'Escolha sua Subclasse com base na Classe selecionada.' },
  pdv: { title: 'Pontos de Vida', desc: '' },
  pde: { title: 'Pontos de Estamina', desc: '' },
  ability: { title: 'Habilidade', desc: 'Escolha uma habilidade geral ou uma habilidade exclusiva com base na subclasse.' },
  new_ability: { title: 'Nova Habilidade', desc: 'Em conjunto com o narrador da aventura, desenvolva uma habilidade exclusiva para o seu personagem, incorporando traços únicos da personalidade e estilo de combate do personagem.' },
  ability_upgrade: { title: 'Aumento de Habilidade', desc: 'Todas as habilidades do personagem evoluem para o próximo nível, aumentando sua eficiência. Mesmo que o personagem desbloqueie uma nova habilidade após subir de nível, ela será adquirida já no nível atual das demais. No entanto, assim como as outras habilidades, também poderá ser utilizada em níveis inferiores ao atual.' },
  attribute: { title: 'Atributo', desc: 'Distribua 1 ponto de Atributo na ficha do personagem como quiser.' },
  skill: { title: 'Perícia', desc: 'Distribua 2 pontos de perícia entre as suas perícias, seguindo as regras de limite.' },
  skill_limit: { title: 'Limite de Perícia', desc: 'O limite base de pontos por perícia é 3 pontos; no nível 4 passa a ser 5; no nível 9 passa a ser 10; e no nível 16, passa a ser 15.' },
  origin_ability: { title: 'Habilidade de Origem', desc: 'A habilidade de origem do personagem se torna disponível (respeitando exceções narrativas).' }
};

function renderProgression() {
  const ch = getCurrentChar(); if (!ch) return;
  const container = document.getElementById('progressionList'); container.innerHTML = '';
  for (let lvl = 0; lvl <= ch.level; lvl++) {
    const benefits = PROGRESSION[lvl] || [];
    const titles = benefits.map(b => (PROGRESSION_INFO[b] && PROGRESSION_INFO[b].title) || b);
    const div = document.createElement('div'); div.className = 'progress-item';
    div.innerHTML = `<span class="lvl-badge">Nível ${lvl}</span><div style="font-size:0.83rem;color:var(--text-muted);">${titles.join(' — ')}</div>`;
    container.appendChild(div);
  }
}

function renderAvailableBenefits() {
  const ch = getCurrentChar(); if (!ch) return;
  const container = document.getElementById('availableBenefits'); container.innerHTML = '';
  const currentBenefits = PROGRESSION[ch.level] || [];
  currentBenefits.forEach(benefit => {
    const info = PROGRESSION_INFO[benefit] || { title: benefit, desc: '' };
    const div = document.createElement('div'); div.className = 'progress-item'; div.style.flexDirection = 'column'; div.style.alignItems = 'flex-start'; div.style.gap = '4px';
    div.innerHTML = `<strong style="color:var(--accent);">${info.title}</strong>${info.desc ? `<span style="font-size:0.82rem;color:var(--text-muted);">${info.desc}</span>` : ''}`;
    container.appendChild(div);
  });
  if (currentBenefits.length === 0) container.innerHTML = '<p style="color:var(--text-dim);font-size:0.85rem;">Nenhum benefício disponível neste nível.</p>';
}

/* ============================================================
   INVENTÁRIO — PESSOAL E MONTARIA
   ============================================================ */
function getPersonalInventoryCapacity(ch) {
  const str = ch.attributes.str + (ch.attributeBonuses.str || 0);
  const manualBonus = ((ch.inventory.personal.capacityModifiers) || []).reduce((sum, m) => sum + m.value, 0);
  const itemBonus = (ch.inventory.personal.items || []).reduce((sum, item) => sum + (item.capacityBonus || 0), 0);
  return 5 + str + manualBonus + itemBonus;
}

function getOverloadPenalty(ch) {
  const used = ch.inventory.personal.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const capacity = getPersonalInventoryCapacity(ch);
  return Math.min(4, Math.max(0, used - capacity));
}

function renderInventory() {
  const ch = getCurrentChar(); if (!ch) return;
  const personalList = document.getElementById('personalInventoryList'); personalList.innerHTML = '';
  const personalWeight = ch.inventory.personal.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const personalCapacity = getPersonalInventoryCapacity(ch);
  document.getElementById('personalWeightUsed').textContent = personalWeight;
  document.getElementById('personalWeightMax').textContent = personalCapacity;
  const personalBar = document.getElementById('personalWeightBar');
  const personalPct = Math.min(100, (personalWeight / personalCapacity) * 100);
  personalBar.style.width = personalPct + '%';
  personalBar.className = 'resource-fill' + (personalWeight > personalCapacity ? ' crit' : personalWeight > personalCapacity * 0.8 ? ' low' : '');
  const overload = getOverloadPenalty(ch);
  document.getElementById('personalOverloadNote').textContent = overload > 0 ? `Sobrecarga: -${overload}m de Deslocamento` : '';
  const capModContainer = document.getElementById('personalCapacityModList'); capModContainer.innerHTML = '';
  ((ch.inventory.personal.capacityModifiers) || []).forEach(m => {
    const div = document.createElement('div'); div.className = 'modifier-row';
    div.innerHTML = `<span>${m.name}</span><span><span class="mval ${m.value >= 0 ? 'pos' : 'neg'}">${m.value >= 0 ? '+' : ''}${m.value}</span><button class="small danger" style="margin-left:10px;" onclick="removePersonalCapacityModifier('${m.id}')">Remover</button></span>`;
    capModContainer.appendChild(div);
  });
  if (ch.inventory.personal.items.length === 0) personalList.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:18px;">Inventário pessoal vazio.</p>';
  else ch.inventory.personal.items.forEach((item, idx) => personalList.appendChild(createItemCard(item, idx, 'personal')));
  updateAttrUI();

  const mountList = document.getElementById('mountInventoryList'); mountList.innerHTML = '';
  const mountWeight = ch.inventory.mount.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const mountCapacity = ch.inventory.mount.capacity;
  document.getElementById('mountWeightUsed').textContent = mountWeight;
  document.getElementById('mountWeightMax').textContent = mountCapacity;
  document.getElementById('mountCapacityInput').value = mountCapacity;
  const mountBar = document.getElementById('mountWeightBar');
  const mountPct = Math.min(100, (mountWeight / mountCapacity) * 100);
  mountBar.style.width = mountPct + '%';
  mountBar.className = 'resource-fill' + (mountWeight > mountCapacity ? ' crit' : mountWeight > mountCapacity * 0.8 ? ' low' : '');
  if (ch.inventory.mount.items.length === 0) mountList.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:18px;">Inventário da montaria vazio.</p>';
  else ch.inventory.mount.items.forEach((item, idx) => mountList.appendChild(createItemCard(item, idx, 'mount')));
}

function removePersonalCapacityModifier(modId) {
  const ch = getCurrentChar(); if (!ch) return;
  ch.inventory.personal.capacityModifiers = (ch.inventory.personal.capacityModifiers || []).filter(m => m.id !== modId);
  ch.updatedAt = new Date().toISOString(); saveChars(); renderInventory();
  showNotification('Bônus de capacidade removido.', '');
}

function createItemCard(item, idx, type) {
  const div = document.createElement('div'); div.className = 'item-card';
  const otherType = type === 'personal' ? 'mount' : 'personal';
  const otherLabel = type === 'personal' ? 'Mover para Montaria' : 'Mover para Pessoal';
  div.innerHTML = `
    <div class="item-header" onclick="toggleItem('${type}', ${idx})">
      <div><strong>${item.name}</strong> <span style="color:var(--text-muted);">x${item.quantity}</span></div>
      <div style="color:var(--text-muted);font-size:0.82rem;">${item.weight} peso</div>
    </div>
    <div class="item-content" id="${type}-item-${idx}">
      <div class="item-detail"><strong>Categoria:</strong> ${item.category}</div>
      <div class="item-detail"><strong>Peso Total:</strong> ${(item.weight * item.quantity).toFixed(1)}</div>
      ${item.dice ? `<div class="item-detail"><strong>Dado/Dano:</strong> ${item.dice}</div>` : ''}
      ${item.range ? `<div class="item-detail"><strong>Alcance:</strong> ${item.range}</div>` : ''}
      ${item.description ? `<div class="item-detail"><strong>Descrição:</strong><br>${item.description}</div>` : ''}
      ${item.properties ? `<div class="item-detail"><strong>Propriedades:</strong> ${item.properties}</div>` : ''}
      ${item.requirements ? `<div class="item-detail"><strong>Requisitos:</strong> ${item.requirements}</div>` : ''}
      ${item.bonuses ? `<div class="item-detail"><strong>Bônus:</strong> ${item.bonuses}</div>` : ''}
      ${item.notes ? `<div class="item-detail"><strong>Observações:</strong><br>${item.notes}</div>` : ''}
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
        <button onclick="editItem('${type}', ${idx})">Editar</button>
        <button onclick="moveItem('${type}', ${idx})">${otherLabel}</button>
        <button class="danger" onclick="deleteItem('${type}', ${idx})">Excluir</button>
      </div>
    </div>`;
  return div;
}

function toggleItem(type, idx) {
  const content = document.getElementById(`${type}-item-${idx}`);
  if (content) content.classList.toggle('expanded');
}

/* ============================================================
   SELETOR DE EQUIPAMENTOS DO SISTEMA
   ============================================================ */
function openEquipmentPicker(type) {
  equipmentPickerTargetType = type || 'personal';
  currentEquipmentFilter = 'all';
  document.getElementById('equipmentPickerSearch').value = '';
  document.querySelectorAll('#equipmentPickerModal .lib-filters button').forEach((b, i) => b.classList.toggle('primary', i === 0));
  renderEquipmentPicker();
  document.getElementById('equipmentPickerModal').classList.remove('hidden');
}
function closeEquipmentPicker() { document.getElementById('equipmentPickerModal').classList.add('hidden'); }

function setEquipmentFilter(filter, event) {
  currentEquipmentFilter = filter;
  document.querySelectorAll('#equipmentPickerModal .lib-filters button').forEach(b => b.classList.remove('primary'));
  if (event) event.target.classList.add('primary');
  renderEquipmentPicker();
}

function renderEquipmentPicker() {
  const container = document.getElementById('equipmentPickerGrid'); container.innerHTML = '';
  const term = document.getElementById('equipmentPickerSearch').value.toLowerCase();
  const categoryLabels = { arma: 'Arma', equipamento: 'Equipamento', consumivel: 'Consumível', outro: 'Outro' };
  EQUIPMENT_DB.forEach(eq => {
    if (currentEquipmentFilter !== 'all' && eq.category !== currentEquipmentFilter) return;
    if (term && !eq.name.toLowerCase().includes(term) && !eq.description.toLowerCase().includes(term)) return;
    const card = document.createElement('div'); card.className = 'mini-card';
    card.innerHTML = `<h4>${eq.name}</h4><p class="cost talent">${categoryLabels[eq.category] || eq.category} — ${eq.weight} espaço${eq.weight === 1 ? '' : 's'}</p><p class="desc">${eq.description}</p>${eq.dice ? `<p style="font-size:0.78rem;color:var(--text-dim);">Dano/Dado: ${eq.dice}</p>` : ''}${eq.bonuses ? `<p style="font-size:0.78rem;color:var(--text-dim);">Bônus: ${eq.bonuses}</p>` : ''}<button onclick="addEquipmentToInventory('${eq.id}')" style="margin-top:12px;width:100%;">Adicionar</button>`;
    container.appendChild(card);
  });
  if (!EQUIPMENT_DB.some(eq => (currentEquipmentFilter === 'all' || eq.category === currentEquipmentFilter) && (!term || eq.name.toLowerCase().includes(term) || eq.description.toLowerCase().includes(term)))) {
    container.innerHTML = '<p style="color:var(--text-dim);">Nenhum equipamento encontrado.</p>';
  }
}

function addEquipmentToInventory(equipmentId) {
  const ch = getCurrentChar(); if (!ch) return;
  const eq = findEquipment(equipmentId); if (!eq) return;
  const type = equipmentPickerTargetType;
  if (type === 'personal') {
    const currentUsed = ch.inventory.personal.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const capacity = getPersonalInventoryCapacity(ch);
    if (currentUsed + eq.weight > capacity + 4) {
      showNotification('Sobrecarga máxima excedida.', `O inventário pessoal permite no máximo ${capacity + 4} espaços (capacidade + 4 de sobrecarga).`, true);
      return;
    }
  }
  ch.inventory[type].items.push({
    id: 'item-' + Date.now(), name: eq.name, quantity: 1, weight: eq.weight, category: eq.category,
    dice: eq.dice || '', range: eq.range || '', description: eq.description, properties: eq.properties || '',
    requirements: eq.requirements || '', bonuses: eq.bonuses || '', notes: '', inventoryType: type,
    capacityBonus: eq.capacityBonus || 0
  });
  ch.updatedAt = new Date().toISOString(); saveChars(); renderInventory(); updateAttrUI();
  showNotification('Item adicionado.', eq.name);
}

function startCreateItemFromPicker() {
  const type = equipmentPickerTargetType;
  closeEquipmentPicker();
  openItemModal(null, type);
}

function openItemModal(editingItem, type, idx) {
  type = type || 'personal';
  document.getElementById('itemTargetType').value = type;
  document.getElementById('itemWeightLabel').textContent = type === 'personal' ? 'Espaços Ocupados' : 'Peso';
  document.getElementById('editingItemId').value = editingItem ? `${type}-${idx}` : '';
  document.getElementById('itemModalTitle').textContent = editingItem ? 'Editar Item' : 'Adicionar Item';
  if (editingItem) {
    document.getElementById('itemName').value = editingItem.name;
    document.getElementById('itemQuantity').value = editingItem.quantity;
    document.getElementById('itemWeight').value = editingItem.weight;
    document.getElementById('itemCategory').value = editingItem.category;
    document.getElementById('itemDice').value = editingItem.dice || '';
    document.getElementById('itemRange').value = editingItem.range || '';
    document.getElementById('itemDescription').value = editingItem.description || '';
    document.getElementById('itemProperties').value = editingItem.properties || '';
    document.getElementById('itemRequirements').value = editingItem.requirements || '';
    document.getElementById('itemBonuses').value = editingItem.bonuses || '';
    document.getElementById('itemCapacityBonus').value = editingItem.capacityBonus || 0;
    document.getElementById('itemNotes').value = editingItem.notes || '';
  } else {
    document.getElementById('itemName').value = ''; document.getElementById('itemQuantity').value = 1;
    document.getElementById('itemWeight').value = 0; document.getElementById('itemCategory').value = 'outro';
    document.getElementById('itemDice').value = ''; document.getElementById('itemRange').value = '';
    document.getElementById('itemDescription').value = ''; document.getElementById('itemProperties').value = '';
    document.getElementById('itemRequirements').value = ''; document.getElementById('itemBonuses').value = '';
    document.getElementById('itemCapacityBonus').value = 0;
    document.getElementById('itemNotes').value = '';
  }
  document.getElementById('itemModal').classList.remove('hidden');
}
function closeItemModal() { document.getElementById('itemModal').classList.add('hidden'); }

function saveItem() {
  const ch = getCurrentChar(); if (!ch) return;
  const editingId = document.getElementById('editingItemId').value;
  const targetType = document.getElementById('itemTargetType').value || 'personal';
  const newItem = {
    id: 'item-' + Date.now(),
    name: document.getElementById('itemName').value.trim() || 'Sem nome',
    quantity: parseInt(document.getElementById('itemQuantity').value) || 1,
    weight: parseFloat(document.getElementById('itemWeight').value) || 0,
    category: document.getElementById('itemCategory').value,
    dice: document.getElementById('itemDice').value.trim(),
    range: document.getElementById('itemRange').value.trim(),
    description: document.getElementById('itemDescription').value.trim(),
    properties: document.getElementById('itemProperties').value.trim(),
    requirements: document.getElementById('itemRequirements').value.trim(),
    bonuses: document.getElementById('itemBonuses').value.trim(),
    capacityBonus: parseInt(document.getElementById('itemCapacityBonus').value) || 0,
    notes: document.getElementById('itemNotes').value.trim(),
    inventoryType: targetType
  };
  if (targetType === 'personal') {
    const currentUsed = ch.inventory.personal.items.reduce((sum, item, i) => {
      if (editingId === `personal-${i}`) return sum;
      return sum + (item.weight * item.quantity);
    }, 0);
    const projected = currentUsed + (newItem.weight * newItem.quantity);
    const capacity = getPersonalInventoryCapacity(ch);
    if (projected > capacity + 4) {
      showNotification('Sobrecarga máxima excedida.', `O inventário pessoal permite no máximo ${capacity + 4} espaços (capacidade + 4 de sobrecarga).`, true);
      return;
    }
  }
  if (editingId) {
    const [type, idx] = editingId.split('-'); const actualIdx = parseInt(idx);
    if (type === 'personal' && ch.inventory.personal.items[actualIdx]) ch.inventory.personal.items[actualIdx] = { ...ch.inventory.personal.items[actualIdx], ...newItem, inventoryType: 'personal' };
    else if (type === 'mount' && ch.inventory.mount.items[actualIdx]) ch.inventory.mount.items[actualIdx] = { ...ch.inventory.mount.items[actualIdx], ...newItem, inventoryType: 'mount' };
    showNotification('Item atualizado.', newItem.name);
  } else {
    ch.inventory[targetType].items.push(newItem);
    showNotification('Item adicionado.', newItem.name);
  }
  ch.updatedAt = new Date().toISOString(); saveChars(); closeItemModal(); renderInventory();
}

function editItem(type, idx) {
  const ch = getCurrentChar(); if (!ch) return;
  const item = type === 'personal' ? ch.inventory.personal.items[idx] : ch.inventory.mount.items[idx];
  if (item) openItemModal(item, type, idx);
}

function deleteItem(type, idx) {
  showConfirm('Excluir este item?', () => {
    const ch = getCurrentChar(); if (!ch) return;
    if (type === 'personal') ch.inventory.personal.items.splice(idx, 1); else ch.inventory.mount.items.splice(idx, 1);
    ch.updatedAt = new Date().toISOString(); saveChars(); renderInventory();
    showNotification('Item excluído.', '');
  });
}

function moveItem(type, idx) {
  const ch = getCurrentChar(); if (!ch) return;
  const sourceArr = type === 'personal' ? ch.inventory.personal.items : ch.inventory.mount.items;
  const destArr = type === 'personal' ? ch.inventory.mount.items : ch.inventory.personal.items;
  const item = sourceArr[idx]; if (!item) return;
  sourceArr.splice(idx, 1);
  item.inventoryType = type === 'personal' ? 'mount' : 'personal';
  destArr.push(item);
  ch.updatedAt = new Date().toISOString(); saveChars(); renderInventory();
  showNotification('Item movido.', item.name);
}

function updateMountCapacity() {
  const ch = getCurrentChar(); if (!ch) return;
  ch.inventory.mount.capacity = parseInt(document.getElementById('mountCapacityInput').value) || 20;
  ch.updatedAt = new Date().toISOString(); saveChars(); renderInventory();
}

/* ============================================================
   IMAGEM DO PERSONAGEM
   ============================================================ */
function handleCharImageUpload(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) { showNotification('Arquivo inválido.', 'Selecione uma imagem.', true); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 700;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round(h * (maxDim / w)); w = maxDim; }
        else { w = Math.round(w * (maxDim / h)); h = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCharacterImage(dataUrl);
    };
    img.onerror = () => showNotification('Não foi possível carregar a imagem.', '', true);
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function setCharacterImage(dataUrl) {
  const ch = getCurrentChar(); if (!ch) return;
  try {
    ch.imageUrl = dataUrl;
    ch.updatedAt = new Date().toISOString();
    saveChars();
    renderCharImage();
    showNotification('Imagem atualizada.', '');
  } catch (e) {
    showNotification('Não foi possível salvar a imagem.', 'O armazenamento local pode estar cheio.', true);
  }
}

function removeCharImage() {
  const ch = getCurrentChar(); if (!ch) return;
  ch.imageUrl = null;
  ch.updatedAt = new Date().toISOString(); saveChars(); renderCharImage();
  showNotification('Imagem removida.', '');
}

function renderCharImage() {
  const ch = getCurrentChar(); if (!ch) return;
  const thumbImg = document.getElementById('charThumbnailImg');
  const thumbPlaceholder = document.getElementById('charThumbnailPlaceholder');
  const portraitImg = document.getElementById('charPortraitImg');
  const portraitPlaceholder = document.getElementById('charPortraitPlaceholder');
  if (ch.imageUrl) {
    thumbImg.src = ch.imageUrl; thumbImg.classList.remove('hidden'); thumbPlaceholder.classList.add('hidden');
    portraitImg.src = ch.imageUrl; portraitImg.classList.remove('hidden'); portraitPlaceholder.classList.add('hidden');
  } else {
    thumbImg.classList.add('hidden'); thumbPlaceholder.classList.remove('hidden');
    portraitImg.classList.add('hidden'); portraitPlaceholder.classList.remove('hidden');
  }
}

/* ============================================================
   ATAQUES RÁPIDOS
   ============================================================ */
let expandedQuickAttackId = null;
function renderQuickAttacks() {
  const ch = getCurrentChar(); if (!ch) return;
  const container = document.getElementById('quickAttacksList'); container.innerHTML = '';
  if (!ch.quickAttacks || ch.quickAttacks.length === 0) { container.innerHTML = '<p class="empty-note">Nenhum ataque cadastrado ainda.</p>'; return; }
  ch.quickAttacks.forEach(atk => {
    const expanded = expandedQuickAttackId === atk.id;
    const div = document.createElement('div'); div.className = 'item-card';
    div.innerHTML = `
      <div class="item-header" onclick="toggleQuickAttack('${atk.id}')">
        <div><strong>${atk.name}</strong></div>
        <div style="display:flex;gap:14px;color:var(--text-muted);font-size:0.82rem;">
          <span>Acerto: ${atk.acerto || '—'}</span>
          <span>Dano: ${atk.dano || '—'}</span>
        </div>
      </div>
      <div class="item-content${expanded ? ' expanded' : ''}">
        ${atk.bonus ? `<div class="item-detail"><strong>Bônus Adicional:</strong> ${atk.bonus}</div>` : ''}
        ${atk.desc ? `<div class="item-detail"><strong>Descrição:</strong><br>${atk.desc}</div>` : ''}
        ${atk.properties ? `<div class="item-detail"><strong>Propriedades:</strong><br>${atk.properties}</div>` : ''}
        <div style="margin-top:14px;display:flex;gap:8px;">
          <button onclick="openQuickAttackModal('${atk.id}')">Editar</button>
          <button class="danger" onclick="removeQuickAttack('${atk.id}')">Excluir</button>
        </div>
      </div>`;
    container.appendChild(div);
  });
}

function toggleQuickAttack(id) {
  expandedQuickAttackId = expandedQuickAttackId === id ? null : id;
  renderQuickAttacks();
}

function openQuickAttackModal(editId) {
  document.getElementById('quickAttackEditId').value = editId || '';
  if (editId) {
    const ch = getCurrentChar();
    const atk = ch.quickAttacks.find(a => a.id === editId);
    document.getElementById('quickAttackModalTitle').textContent = 'Editar Ataque';
    document.getElementById('quickAttackName').value = atk.name;
    document.getElementById('quickAttackAcerto').value = atk.acerto || '';
    document.getElementById('quickAttackBonus').value = atk.bonus || '';
    document.getElementById('quickAttackDano').value = atk.dano || '';
    document.getElementById('quickAttackDesc').value = atk.desc || '';
    document.getElementById('quickAttackProperties').value = atk.properties || '';
  } else {
    document.getElementById('quickAttackModalTitle').textContent = 'Adicionar Ataque';
    ['quickAttackName', 'quickAttackAcerto', 'quickAttackBonus', 'quickAttackDano', 'quickAttackDesc', 'quickAttackProperties'].forEach(id => document.getElementById(id).value = '');
  }
  document.getElementById('quickAttackModal').classList.remove('hidden');
}
function closeQuickAttackModal() { document.getElementById('quickAttackModal').classList.add('hidden'); }

function saveQuickAttack() {
  const ch = getCurrentChar(); if (!ch) return;
  const editId = document.getElementById('quickAttackEditId').value;
  const name = document.getElementById('quickAttackName').value.trim();
  if (!name) { showNotification('Informe um nome para o ataque.', '', true); return; }
  const data = {
    name,
    acerto: document.getElementById('quickAttackAcerto').value.trim(),
    bonus: document.getElementById('quickAttackBonus').value.trim(),
    dano: document.getElementById('quickAttackDano').value.trim(),
    desc: document.getElementById('quickAttackDesc').value.trim(),
    properties: document.getElementById('quickAttackProperties').value.trim()
  };
  if (editId) {
    const atk = ch.quickAttacks.find(a => a.id === editId);
    if (atk) Object.assign(atk, data);
    showNotification('Ataque atualizado.', name);
  } else {
    ch.quickAttacks.push({ id: 'atk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...data });
    showNotification('Ataque adicionado.', name);
  }
  ch.updatedAt = new Date().toISOString(); saveChars();
  closeQuickAttackModal(); renderQuickAttacks();
}

function removeQuickAttack(id) {
  showConfirm('Excluir este ataque?', () => {
    const ch = getCurrentChar(); if (!ch) return;
    ch.quickAttacks = ch.quickAttacks.filter(a => a.id !== id);
    ch.updatedAt = new Date().toISOString(); saveChars();
    renderQuickAttacks();
    showNotification('Ataque excluído.', '');
  });
}

/* ============================================================
   DMT — DISPOSITIVO DE MANOBRA TRIDIMENSIONAL
   ============================================================ */
function renderDMT() {
  const ch = getCurrentChar(); if (!ch) return;
  const dmt = ch.dmt;
  document.getElementById('dmtType').value = dmt.type;
  document.getElementById('dmtCylinderCapacity').value = dmt.cylinderCapacity;
  document.getElementById('dmtC1Current').textContent = dmt.cylinder1;
  document.getElementById('dmtC1Max').textContent = dmt.cylinderCapacity;
  document.getElementById('dmtC2Current').textContent = dmt.cylinder2;
  document.getElementById('dmtC2Max').textContent = dmt.cylinderCapacity;
  const c1Pct = dmt.cylinderCapacity > 0 ? (dmt.cylinder1 / dmt.cylinderCapacity) * 100 : 0;
  const c2Pct = dmt.cylinderCapacity > 0 ? (dmt.cylinder2 / dmt.cylinderCapacity) * 100 : 0;
  const c1Bar = document.getElementById('dmtC1Bar'); c1Bar.style.width = Math.min(100, c1Pct) + '%';
  c1Bar.className = 'resource-fill' + (c1Pct <= 25 ? ' crit' : c1Pct <= 50 ? ' low' : '');
  const c2Bar = document.getElementById('dmtC2Bar'); c2Bar.style.width = Math.min(100, c2Pct) + '%';
  c2Bar.className = 'resource-fill' + (c2Pct <= 25 ? ' crit' : c2Pct <= 50 ? ' low' : '');
  document.getElementById('dmtTotalCurrent').textContent = dmt.cylinder1 + dmt.cylinder2;
  document.getElementById('dmtTotalMax').textContent = dmt.cylinderCapacity * 2;
  document.getElementById('bladeAttacksUsed').textContent = dmt.bladeAttacksUsed;
  document.getElementById('bladeReserve').textContent = dmt.bladeReserve;
  const str = ch.attributes.str + (ch.attributeBonuses.str || 0);
  document.getElementById('bladeDamageAttr').textContent = str;
  document.getElementById('cannonAmmo').textContent = dmt.cannonAmmo;
  const fireBtn = document.getElementById('btnFireCannon');
  fireBtn.disabled = dmt.cannonAmmo <= 0;
  fireBtn.classList.toggle('danger', dmt.cannonAmmo <= 0);

  const attackBtn = document.getElementById('btnRegisterBladeAttack');
  attackBtn.disabled = !dmt.bladesEquipped;
  attackBtn.classList.toggle('danger', !dmt.bladesEquipped);
  document.getElementById('bladesDepletedWarning').classList.toggle('hidden', dmt.bladesEquipped);

  document.getElementById('bladesSection').classList.toggle('hidden', dmt.weaponType !== 'laminas');
  document.getElementById('cannonSection').classList.toggle('hidden', dmt.weaponType !== 'canhao');
  document.getElementById('btnWeaponBlades').classList.toggle('primary', dmt.weaponType === 'laminas');
  document.getElementById('btnWeaponCannon').classList.toggle('primary', dmt.weaponType === 'canhao');
}

function setDMTWeaponType(type) {
  const ch = getCurrentChar(); if (!ch) return;
  ch.dmt.weaponType = type;
  ch.updatedAt = new Date().toISOString(); saveChars(); renderDMT();
}

function fireCannon() {
  const ch = getCurrentChar(); if (!ch) return;
  if (ch.dmt.cannonAmmo <= 0) { showNotification('Sem munição.', 'Reponha a munição do Canhão de Mão.', true); return; }
  ch.dmt.cannonAmmo -= 1;
  ch.updatedAt = new Date().toISOString(); saveChars(); renderDMT();
}

function reloadCannon() {
  const ch = getCurrentChar(); if (!ch) return;
  ch.dmt.cannonAmmo = 10;
  ch.updatedAt = new Date().toISOString(); saveChars(); renderDMT();
  showNotification('Munição reposta.', '10/10');
}

function addThunderSpearItem() {
  const ch = getCurrentChar(); if (!ch) return;
  const currentUsed = ch.inventory.personal.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const capacity = getPersonalInventoryCapacity(ch);
  if (currentUsed + 3 > capacity + 4) {
    showNotification('Sobrecarga máxima excedida.', `Não há espaço para a Lança Trovão (3 espaços). Capacidade + sobrecarga: ${capacity + 4}.`, true);
    return;
  }
  ch.inventory.personal.items.push({
    id: 'item-' + Date.now(), name: 'Lança Trovão', quantity: 1, weight: 3, category: 'arma',
    dice: '5d10 (área, raio de 3m)', range: 'DMT', inventoryType: 'personal',
    description: 'Arma explosiva de Hange Zoe. Ao disparar, é gasta e causa 5d10 de dano em área a 3m. Teste de Acerto com Pontaria. Falha crítica: 2d12 de dano no usuário. Destrói placas do Titã Blindado / armadura do Titã Martelo de Guerra.',
    properties: 'Uso único. Lanças múltiplas: +2d10 por lança adicional disparada junto; se falhar, teste de esquiva dificuldade 18 ou sofre 1d12 por lança.',
    requirements: '', bonuses: '', notes: ''
  });
  ch.updatedAt = new Date().toISOString(); saveChars(); renderInventory();
  showNotification('Lança Trovão adicionada ao inventário.', '');
}

function modDMT(cylinder, delta) {
  const ch = getCurrentChar(); if (!ch) return;
  const key = cylinder === 1 ? 'cylinder1' : 'cylinder2';
  ch.dmt[key] = Math.max(0, Math.min(ch.dmt.cylinderCapacity, ch.dmt[key] + delta));
  ch.updatedAt = new Date().toISOString(); saveChars(); renderDMT();
}

function refillDMTCylinder(cylinder) {
  const ch = getCurrentChar(); if (!ch) return;
  const key = cylinder === 1 ? 'cylinder1' : 'cylinder2';
  ch.dmt[key] = ch.dmt.cylinderCapacity;
  ch.updatedAt = new Date().toISOString(); saveChars(); renderDMT();
  showNotification('Cilindro recarregado.', '');
}

function refillDMTBoth() {
  const ch = getCurrentChar(); if (!ch) return;
  ch.dmt.cylinder1 = ch.dmt.cylinderCapacity; ch.dmt.cylinder2 = ch.dmt.cylinderCapacity;
  ch.updatedAt = new Date().toISOString(); saveChars(); renderDMT();
  showNotification('DMT recarregado.', 'Ambos os cilindros no máximo.');
}

function updateDMTCapacity() {
  const ch = getCurrentChar(); if (!ch) return;
  const newCap = parseInt(document.getElementById('dmtCylinderCapacity').value) || 20;
  ch.dmt.cylinderCapacity = newCap;
  if (ch.dmt.cylinder1 > newCap) ch.dmt.cylinder1 = newCap;
  if (ch.dmt.cylinder2 > newCap) ch.dmt.cylinder2 = newCap;
  ch.updatedAt = new Date().toISOString(); saveChars(); renderDMT();
}

function updateDMTType() {
  const ch = getCurrentChar(); if (!ch) return;
  ch.dmt.type = document.getElementById('dmtType').value.trim() || 'Tradicional';
  ch.updatedAt = new Date().toISOString(); saveChars();
}

function consumeDMTGas(baseAmount, label) {
  const ch = getCurrentChar(); if (!ch) return;
  let amount = baseAmount;
  const prof = ch.abilities.find(a => a.id === 'proficiencia_dmt');
  if (prof && label.indexOf('Movimentação') === 0) {
    const lvl = getAbilityLevelForCharLevel(ch.level);
    if (lvl >= 2) amount = Math.max(0, amount - 2);
    else if (lvl >= 1) amount = Math.max(0, amount - 1);
  }
  const total = ch.dmt.cylinder1 + ch.dmt.cylinder2;
  if (total < amount) { showNotification('Gás insuficiente.', `${label} exige ${amount} pontos de gás.`, true); return; }
  let remaining = amount;
  const fromC1 = Math.min(ch.dmt.cylinder1, remaining);
  ch.dmt.cylinder1 -= fromC1; remaining -= fromC1;
  if (remaining > 0) { const fromC2 = Math.min(ch.dmt.cylinder2, remaining); ch.dmt.cylinder2 -= fromC2; remaining -= fromC2; }
  ch.updatedAt = new Date().toISOString(); saveChars(); renderDMT();
  showNotification(`Gás consumido: ${amount}`, label);
}

function registerBladeAttack() {
  const ch = getCurrentChar(); if (!ch) return;
  if (!ch.dmt.bladesEquipped) { showNotification('Sem lâminas disponíveis.', 'Troque o conjunto ou reabasteça antes de atacar.', true); return; }
  ch.dmt.bladeAttacksUsed = (ch.dmt.bladeAttacksUsed || 0) + 1;
  if (ch.dmt.bladeAttacksUsed >= 3) {
    ch.dmt.bladeAttacksUsed = 0;
    if (ch.dmt.bladeReserve > 0) {
      ch.dmt.bladeReserve -= 1;
      showNotification('Conjunto de lâminas quebrado.', 'Um conjunto de reserva foi equipado.');
    } else {
      ch.dmt.bladesEquipped = false;
      showNotification('Conjunto de lâminas quebrado.', 'Sem conjuntos de reserva — reabasteça antes de atacar novamente.', true);
    }
  }
  ch.updatedAt = new Date().toISOString(); saveChars(); renderDMT();
}

function swapBladeSet() {
  const ch = getCurrentChar(); if (!ch) return;
  if (ch.dmt.bladeReserve <= 0) { showNotification('Sem conjuntos de reserva.', '', true); return; }
  ch.dmt.bladeReserve -= 1; ch.dmt.bladeAttacksUsed = 0; ch.dmt.bladesEquipped = true;
  ch.updatedAt = new Date().toISOString(); saveChars(); renderDMT();
  showNotification('Conjunto de lâminas trocado.', '');
}

function resetBladeSets() {
  const ch = getCurrentChar(); if (!ch) return;
  ch.dmt.bladeAttacksUsed = 0; ch.dmt.bladeReserve = 2; ch.dmt.bladesEquipped = true;
  ch.updatedAt = new Date().toISOString(); saveChars(); renderDMT();
  showNotification('Lâminas reabastecidas.', '3 conjuntos disponíveis.');
}

/* ============================================================
   CONDIÇÕES
   ============================================================ */
function toggleCondition(condKey, field, value) {
  const ch = getCurrentChar(); if (!ch) return;
  ch.conditions[condKey][field] = value;
  ch.updatedAt = new Date().toISOString();
  recalcAllModifiers(ch);
  saveChars();
  renderConditions(); updateAttrUI(); updateResourceUI(); renderSkills(); renderModifierStats();
}

function setConditionValue(condKey, field, value) {
  const ch = getCurrentChar(); if (!ch) return;
  ch.conditions[condKey][field] = value;
  ch.conditions[condKey].active = true;
  ch.updatedAt = new Date().toISOString();
  saveChars();
  renderConditions();
}

function updateConditionText(condKey, field, value) {
  const ch = getCurrentChar(); if (!ch) return;
  ch.conditions[condKey][field] = value;
  ch.updatedAt = new Date().toISOString();
  saveChars();
}

function modFadiga(delta) {
  const ch = getCurrentChar(); if (!ch) return;
  ch.conditions.fadiga.points = Math.max(0, Math.min(8, (ch.conditions.fadiga.points || 0) + delta));
  ch.updatedAt = new Date().toISOString();
  recalcAllModifiers(ch);
  saveChars();
  renderConditions(); updateAttrUI(); updateResourceUI(); renderSkills(); renderModifierStats();
}

function restCurtoFadiga() {
  const ch = getCurrentChar(); if (!ch) return;
  ch.conditions.fadiga.points = 0;
  ch.updatedAt = new Date().toISOString();
  recalcAllModifiers(ch);
  saveChars();
  renderConditions(); updateAttrUI(); updateResourceUI(); renderSkills(); renderModifierStats();
  showNotification('Descanso curto realizado.', 'Fadiga zerada.');
}

function updateMorrendoDificuldade() {
  const ch = getCurrentChar(); if (!ch) return;
  const dano = parseInt(document.getElementById('condMorrendoDano').value) || 0;
  ch.conditions.morrendo.danoAdicional = dano;
  const dificuldade = 18 + Math.floor(dano / 5);
  document.getElementById('condMorrendoDificuldade').textContent = dificuldade;
  ch.updatedAt = new Date().toISOString(); saveChars();
}

const FADIGA_EFFECTS = [
  [1, '-1 nos Testes de Acerto'],
  [2, '-1 em todas as Perícias'],
  [3, '-1 no atributo de Agilidade'],
  [4, 'Deslocamento reduzido pela metade'],
  [5, '-1 adicional nos Testes de Acerto (total -2)'],
  [6, 'Desvantagem nos testes de esquiva'],
  [7, '-1 em todos os atributos (adicional)'],
  [8, 'O personagem está desacordado'],
];

function renderConditions() {
  const ch = getCurrentChar(); if (!ch) return;
  const c = ch.conditions;

  document.getElementById('condAdrenalinaActive').checked = c.adrenalina.active;
  ['baixo', 'medio', 'alto'].forEach(t => {
    const btn = document.getElementById('btnAdren' + (t === 'baixo' ? 'Baixo' : t === 'medio' ? 'Medio' : 'Alto'));
    if (btn) btn.classList.toggle('primary', c.adrenalina.tier === t);
  });

  document.getElementById('condSangramentoActive').checked = c.sangramento.active;

  document.getElementById('condMorrendoActive').checked = c.morrendo.active;
  document.getElementById('condMorrendoDano').value = c.morrendo.danoAdicional || 0;
  document.getElementById('condMorrendoDificuldade').textContent = 18 + Math.floor((c.morrendo.danoAdicional || 0) / 5);

  document.getElementById('condVulneravelActive').checked = c.vulneravel.active;
  document.getElementById('condEnlouquecendoActive').checked = c.enlouquecendo.active;

  document.getElementById('condFadigaPoints').textContent = c.fadiga.points || 0;
  const effContainer = document.getElementById('condFadigaEffects'); effContainer.innerHTML = '';
  const active = FADIGA_EFFECTS.filter(([pts]) => (c.fadiga.points || 0) >= pts);
  if (active.length === 0) effContainer.innerHTML = '<p style="color:var(--text-dim);font-size:0.82rem;font-style:italic;">Nenhum efeito ativo.</p>';
  else active.forEach(([pts, text]) => {
    const div = document.createElement('div'); div.className = 'derived-stat';
    div.innerHTML = `<span>${pts}+ pontos</span><span>${text}</span>`;
    effContainer.appendChild(div);
  });

  document.getElementById('condTraumatizadoActive').checked = c.traumatizado.active;
  document.getElementById('condTraumaDesc').value = c.traumatizado.desc || '';

  document.getElementById('condPernaActive').checked = c.perdaMembros.perna;
  document.getElementById('condBracoActive').checked = c.perdaMembros.braco;

  document.getElementById('condFeridoActive').checked = c.ferido.active;
}

/* ============================================================
   HABILIDADES — AGRUPADAS (ORIGEM, GERAIS, SUBCLASSE, EXCLUSIVAS)
   ============================================================ */
function getOriginAbilityStatus(ch) {
  const originData = getOriginById(ch.originId); if (!originData) return null;
  const ability = originData.originAbility;
  let unlocked = ability.manualUnlock ? !!ch.originAbilityManualUnlock : ch.level >= ability.unlockLevel;
  return { ...ability, unlocked };
}

function renderAbilities() {
  const ch = getCurrentChar(); if (!ch) return;

  const classPassiveContainer = document.getElementById('classPassiveDisplay');
  if (ch.class && CLASS_PASSIVES[ch.class]) {
    const tier = getClassPassiveTier(ch.class, ch.level);
    classPassiveContainer.innerHTML = `<div class="ability-item"><h5>Passiva de Classe <span class="tag class" style="margin-left:8px;">${ch.class}</span></h5><p>${tier ? tier.text : 'Sem efeito neste nível.'}</p></div>`;
  } else {
    classPassiveContainer.innerHTML = '<p class="empty-note">Nenhuma classe selecionada.</p>';
  }

  const passiveContainer = document.getElementById('originPassiveDisplay');
  const originData = getOriginById(ch.originId);
  if (originData) {
    passiveContainer.innerHTML = `<div class="ability-item"><h5>${originData.passive.name}<span class="tag origin" style="margin-left:8px;">${originData.name}</span></h5><p>${originData.passive.description}</p></div>`;
  } else {
    passiveContainer.innerHTML = '<p class="empty-note">Nenhuma origem selecionada.</p>';
  }

  const abilityContainer = document.getElementById('originAbilityDisplay');
  const abilityStatus = getOriginAbilityStatus(ch);
  if (abilityStatus) {
    let toggle = '';
    if (originData.originAbility.manualUnlock) {
      toggle = `<label style="display:flex;align-items:center;gap:8px;text-transform:none;cursor:pointer;margin-top:10px;"><input type="checkbox" style="width:auto;" ${ch.originAbilityManualUnlock ? 'checked' : ''} onchange="toggleOriginAbilityUnlock(this.checked)" /> Marcar como desbloqueada (desbloqueio narrativo/manual)</label>`;
    }
    let ackermanChoice = '';
    if (ch.originId === 'ackerman' && ch.originAbilityManualUnlock) {
      const options = ch.abilities.map(a => { const d = findAbility(a.id); return d ? `<option value="${a.id}" ${ch.originAbilityChoice === a.id ? 'selected' : ''}>${d.name}</option>` : ''; }).join('');
      ackermanChoice = `<div style="margin-top:12px;"><label>Habilidade escolhida para +1 nível permanente</label><select onchange="setAckermanAbilityChoice(this.value)"><option value="">Nenhuma</option>${options}</select></div>`;
    }
    abilityContainer.innerHTML = `<div class="ability-item"><h5>${abilityStatus.name} <span class="tag ${abilityStatus.unlocked ? 'origin' : 'locked'}" style="margin-left:8px;">${abilityStatus.unlocked ? 'Desbloqueada' : `Nível ${abilityStatus.unlockLevel}`}</span></h5><p>${abilityStatus.description}</p>${toggle}${ackermanChoice}</div>`;
  } else {
    abilityContainer.innerHTML = '<p class="empty-note">Nenhuma origem selecionada.</p>';
  }

  const generalContainer = document.getElementById('generalAbilitiesDisplay');
  const subclassContainer = document.getElementById('subclassAbilitiesDisplay');
  const exclusiveContainer = document.getElementById('exclusiveAbilitiesDisplay');
  generalContainer.innerHTML = ''; subclassContainer.innerHTML = ''; exclusiveContainer.innerHTML = '';

  const generalAbilities = ch.abilities.filter(a => { const d = findAbility(a.id); return d && d.scope === 'general'; });
  const subclassAbilities = ch.abilities.filter(a => { const d = findAbility(a.id); return d && d.scope === 'exclusive'; });

  if (generalAbilities.length === 0) generalContainer.innerHTML = '<p class="empty-note">Nenhuma habilidade geral adquirida.</p>';
  generalAbilities.forEach(sk => generalContainer.appendChild(buildAbilityCard(sk)));

  if (subclassAbilities.length === 0) subclassContainer.innerHTML = '<p class="empty-note">Nenhuma habilidade de classe/subclasse adquirida.</p>';
  subclassAbilities.forEach(sk => subclassContainer.appendChild(buildAbilityCard(sk)));

  if (ch.customSkills.length === 0) exclusiveContainer.innerHTML = '<p class="empty-note">Nenhuma habilidade personalizada criada.</p>';
  ch.customSkills.forEach(sk => exclusiveContainer.appendChild(buildCustomAbilityCard(sk)));
}

function buildAbilityCard(acquired) {
  const ch = getCurrentChar();
  const ability = findAbility(acquired.id);
  if (!ability) {
    const div = document.createElement('div'); div.className = 'ability-item';
    div.innerHTML = `<h5>${acquired.name || acquired.id} <span class="tag locked">Legado</span></h5><p>${acquired.desc || 'Habilidade de uma versão anterior da ficha.'}</p><button class="danger small" style="margin-top:10px;" onclick="removeSkill('${acquired.id}')">Remover</button>`;
    return div;
  }
  const div = document.createElement('div'); div.className = 'ability-item';
  let unlockedLevel = getAbilityLevelForCharLevel(ch.level);
  const ackermanBoosted = ch.originId === 'ackerman' && ch.originAbilityChoice === acquired.id;
  if (ackermanBoosted) unlockedLevel = Math.min(4, unlockedLevel + 1);
  let levelsHtml = '';
  if (ability.levels && ability.levels.length) {
    const shown = ability.levels.slice(0, Math.max(1, unlockedLevel));
    levelsHtml = shown.map(l => `<p style="margin-top:6px;">${l}</p>`).join('');
    if (unlockedLevel === 0) levelsHtml = `<p style="margin-top:6px;color:var(--text-dim);">Disponível a partir do Nível 1 de personagem.</p>`;
  }
  if (ackermanBoosted) levelsHtml += `<p style="margin-top:6px;color:var(--accent);font-style:italic;">Potencial Sobre-humano (Ackerman): +1 nível permanente aplicado.</p>`;
  const choiceNote = acquired.choiceValue ? `<div class="choice-note"><strong>${ability.requiresChoice ? ability.requiresChoice.label : 'Escolha'}:</strong> ${acquired.choiceValue}</div>` : '';
  const repeatableNote = (acquired.repeatableChoices && acquired.repeatableChoices.length) ? `<div class="choice-note"><strong>Perícias escolhidas:</strong> ${acquired.repeatableChoices.join(', ')}</div>` : '';
  let repeatableControl = '';
  if (ability.repeatableChoice) {
    const usedCount = (acquired.repeatableChoices || []).length;
    const canPick = usedCount < unlockedLevel && usedCount < 4;
    repeatableControl = `<div style="margin-top:10px;"><select id="repchoice_${ability.id}">${SKILL_LIST.filter(s => !(acquired.repeatableChoices || []).includes(s.name)).map(s => `<option value="${s.name}">${s.name}</option>`).join('')}</select><button class="small" style="margin-top:6px;" ${canPick ? '' : 'disabled'} onclick="addRepeatableAbilityChoice('${ability.id}')">Escolher Perícia (+1)</button></div>`;
  }
  div.innerHTML = `<h5>${ability.name} ${ability.passive ? '<span class="tag origin">Passiva</span>' : ''}</h5><p>${ability.description}</p>${ability.reminder ? `<p style="color:var(--text-dim);font-style:italic;margin-top:6px;">${ability.reminder}</p>` : ''}${levelsHtml}${choiceNote}${repeatableNote}${repeatableControl}<button class="danger small" style="margin-top:10px;" onclick="removeSkill('${ability.id}')">Remover</button>`;
  return div;
}

function addRepeatableAbilityChoice(abilityId) {
  const ch = getCurrentChar(); if (!ch) return;
  const acquired = ch.abilities.find(a => a.id === abilityId); if (!acquired) return;
  const select = document.getElementById('repchoice_' + abilityId);
  const skillName = select.value;
  if (!skillName) return;
  if (!acquired.repeatableChoices) acquired.repeatableChoices = [];
  if (acquired.repeatableChoices.includes(skillName)) return;
  acquired.repeatableChoices.push(skillName);
  ch.updatedAt = new Date().toISOString();
  recalcAllModifiers(ch);
  saveChars(); renderAbilities(); renderSkills();
  showNotification('Perícia escolhida.', skillName + ' +1');
}

function buildCustomAbilityCard(sk) {
  const div = document.createElement('div'); div.className = 'ability-item';
  div.innerHTML = `<h5>${sk.name} <span style="font-size:0.78rem;color:var(--text-dim);font-weight:400;">(Nível ${sk.level})</span></h5><p>${sk.desc}</p><div class="ability-meta">${sk.category ? `Categoria: ${sk.category}` : ''}${sk.cost ? ` — Custo: ${sk.cost}` : ''}</div><div style="margin-top:10px;display:flex;gap:8px;"><button class="small" onclick="openCustomSkillModal('${sk.id}')">Editar</button><button class="danger small" onclick="removeSkill('${sk.id}')">Remover</button></div>`;
  return div;
}

function toggleOriginAbilityUnlock(checked) {
  const ch = getCurrentChar(); if (!ch) return;
  ch.originAbilityManualUnlock = checked; ch.updatedAt = new Date().toISOString(); saveChars(); renderAbilities();
}

function setAckermanAbilityChoice(abilityId) {
  const ch = getCurrentChar(); if (!ch) return;
  ch.originAbilityChoice = abilityId || null;
  ch.updatedAt = new Date().toISOString(); saveChars(); renderAbilities();
}

function removeSkill(skillId) {
  const ch = getCurrentChar(); if (!ch) return;
  const abilityIdx = ch.abilities.findIndex(s => s.id === skillId);
  if (abilityIdx !== -1) {
    ch.abilities.splice(abilityIdx, 1);
    ch.updatedAt = new Date().toISOString();
    recalcAllModifiers(ch);
    saveChars(); renderAbilities(); renderSkills();
    showNotification('Habilidade removida.', '');
    return;
  }
  const customIdx = ch.customSkills.findIndex(s => s.id === skillId);
  if (customIdx !== -1) ch.customSkills.splice(customIdx, 1);
  ch.updatedAt = new Date().toISOString(); saveChars(); renderAbilities(); renderSkills();
  showNotification('Habilidade removida.', '');
}

let editingCustomSkillId = null;

function openCustomSkillModal(skillId) {
  const ch = getCurrentChar();
  editingCustomSkillId = skillId || null;
  if (editingCustomSkillId && ch) {
    const sk = ch.customSkills.find(s => s.id === editingCustomSkillId);
    if (sk) {
      document.getElementById('customSkillModalTitle').textContent = 'Editar Habilidade';
      document.getElementById('customSkillSaveBtn').textContent = 'Salvar Alterações';
      document.getElementById('customSkillName').value = sk.name;
      document.getElementById('customSkillLevel').value = sk.level;
      document.getElementById('customSkillDesc').value = sk.desc;
      document.getElementById('customSkillCost').value = sk.cost || '';
      document.getElementById('customSkillCategory').value = sk.category || 'general';
      document.getElementById('customSkillRequirements').value = sk.requirements || '';
      document.getElementById('customSkillModal').classList.remove('hidden');
      return;
    }
  }
  editingCustomSkillId = null;
  document.getElementById('customSkillModalTitle').textContent = 'Criar Nova Habilidade';
  document.getElementById('customSkillSaveBtn').textContent = 'Criar Habilidade';
  ['customSkillName', 'customSkillDesc', 'customSkillCost', 'customSkillRequirements'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('customSkillLevel').value = 1;
  document.getElementById('customSkillCategory').value = 'general';
  document.getElementById('customSkillModal').classList.remove('hidden');
}
function closeCustomSkillModal() { document.getElementById('customSkillModal').classList.add('hidden'); editingCustomSkillId = null; }

function addCustomSkill() {
  const ch = getCurrentChar(); if (!ch) return;
  const name = document.getElementById('customSkillName').value.trim();
  const level = parseInt(document.getElementById('customSkillLevel').value) || 1;
  const desc = document.getElementById('customSkillDesc').value.trim();
  const cost = document.getElementById('customSkillCost').value.trim();
  const category = document.getElementById('customSkillCategory').value;
  const requirements = document.getElementById('customSkillRequirements').value.trim();
  if (!name || !desc) { showNotification('Nome e descrição são obrigatórios', '', true); return; }
  if (editingCustomSkillId) {
    const sk = ch.customSkills.find(s => s.id === editingCustomSkillId);
    if (sk) { sk.name = name; sk.level = level; sk.desc = desc; sk.cost = cost; sk.category = category; sk.requirements = requirements; }
    showNotification('Habilidade atualizada.', name);
  } else {
    ch.customSkills.push({ id: 'custom_' + Date.now(), name, desc, level, cost, category, requirements, custom: true });
    showNotification('Habilidade criada.', name);
  }
  ch.updatedAt = new Date().toISOString(); saveChars(); closeCustomSkillModal(); renderAbilities();
}

/* ============================================================
   ORIGEM — ALTERAR
   ============================================================ */
function renderOriginSelectorList() {
  const ch = getCurrentChar(); if (!ch) return;
  const container = document.getElementById('originSelectorList'); container.innerHTML = '';
  Object.values(getAllOrigins()).forEach(origin => {
    const div = document.createElement('div'); div.className = 'origin-option' + (ch.originId === origin.id ? ' selected' : '');
    div.onclick = () => changeOrigin(origin.id);
    div.innerHTML = `<h4>${origin.name}${origin.custom ? ' <span class="tag class">Custom</span>' : ''}</h4><p style="font-size:0.78rem;color:var(--text-dim);">${origin.family ? `Família: ${origin.family}` : ''}</p><p>${origin.description.substring(0, 100)}...</p><div class="origin-stats"><span class="origin-stat pdv">${origin.initialStats.pdv} PDV</span><span class="origin-stat san">${origin.initialStats.san} SAN</span><span class="origin-stat pde">${origin.initialStats.pde} PDE</span></div>${origin.custom ? `<button class="small danger" style="margin-top:10px;" onclick="deleteCustomFamily('${origin.id}', event)">Excluir Família</button>` : ''}`;
    container.appendChild(div);
  });
}
function openOriginSelector() {
  originSelectionContext = 'selector';
  renderOriginSelectorList();
  document.getElementById('originSelectorModal').classList.remove('hidden');
}
function closeOriginSelector() { document.getElementById('originSelectorModal').classList.add('hidden'); }

function changeOrigin(newOriginId) {
  const ch = getCurrentChar(); if (!ch) return;
  const oldOriginId = ch.originId;
  ch.originId = newOriginId; ch.originData = getOriginById(newOriginId);
  ch.originPassive = { ...getOriginById(newOriginId).passive, acquired: true };
  ch.originAbilityManualUnlock = false;
  ch.updatedAt = new Date().toISOString();
  recalcAllModifiers(ch);
  saveChars();
  updateAttrUI(); updateResourceUI(); renderSkills(); renderAbilities();
  closeOriginSelector();
  document.getElementById('charOrigin').value = getOriginById(newOriginId).name;
  showNotification('Origem alterada.', `De ${getOriginById(oldOriginId).name} para ${getOriginById(newOriginId).name}`);
}

/* ============================================================
   EVENTOS GLOBAIS
   ============================================================ */
document.getElementById('btnNewChar').addEventListener('click', createNewCharacter);
document.getElementById('btnImport').addEventListener('click', () => document.getElementById('fileImport').click());
document.getElementById('fileImport').addEventListener('change', e => { const file = e.target.files[0]; if (file) importChar(file); e.target.value = ''; });
document.getElementById('btnAddAbility').addEventListener('click', openSkillLibrary);
document.getElementById('btnSave').addEventListener('click', () => {
  const ch = getCurrentChar(); if (!ch) return;
  ch.name = document.getElementById('charName').value.trim() || 'Sem nome';
  ch.player = document.getElementById('charPlayer').value.trim();
  ch.level = parseInt(document.getElementById('charLevel').value) || 0;
  ch.exp = parseInt(document.getElementById('charExp').value) || 0;
  ch.class = document.getElementById('charClass').value;
  ch.alignment = document.getElementById('charAlignment').value.trim();
  ch.campaign = document.getElementById('charCampaign').value.trim();
  const subclassValue = document.getElementById('charSubclass').value;
  ch.subclass = subclassValue || null;
  ch.info = { appearance: document.getElementById('infoAppearance').value.trim(), age: document.getElementById('infoAge').value.trim(), height: document.getElementById('infoHeight').value.trim(), weight: document.getElementById('infoWeight').value.trim(), gender: document.getElementById('infoGender').value.trim(), hair: document.getElementById('infoHair').value.trim(), eyes: document.getElementById('infoEyes').value.trim(), skin: document.getElementById('infoSkin').value.trim(), clothes: document.getElementById('infoClothes').value.trim(), size: document.getElementById('infoSize').value.trim(), marks: document.getElementById('infoMarks').value.trim(), traits: document.getElementById('infoTraits').value.trim(), ideals: document.getElementById('infoIdeals').value.trim(), bonds: document.getElementById('infoBonds').value.trim(), flaws: document.getElementById('infoFlaws').value.trim() };
  ch.history = document.getElementById('charHistory').value.trim();
  ch.updatedAt = new Date().toISOString();
  recalcAllModifiers(ch);
  saveChars();
  renderCharList(); updateAttrUI(); renderSkills(); renderProgression(); renderAvailableBenefits(); updateResourceUI(); renderInventory(); renderAbilities(); renderTalentsDefectsSummary(); renderModifierStats();
  showNotification('Ficha salva.', '');
});
document.getElementById('btnDuplicate').addEventListener('click', () => { if (currentCharId) duplicateChar(currentCharId); });
document.getElementById('btnExport').addEventListener('click', () => { if (currentCharId) exportChar(currentCharId); });
document.getElementById('btnDelete').addEventListener('click', () => { if (currentCharId) deleteChar(currentCharId); });
document.getElementById('btnBackHeader').addEventListener('click', showHome);
document.querySelectorAll('.tab').forEach(tab => { tab.addEventListener('click', () => { document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); document.querySelectorAll('.section').forEach(s => s.classList.remove('active')); tab.classList.add('active'); document.getElementById(tab.dataset.tab).classList.add('active'); }); });
document.getElementById('charClass').addEventListener('change', () => { const ch = getCurrentChar(); if (!ch) return; ch.class = document.getElementById('charClass').value; updateClassSubclassOptions(); });
document.getElementById('charSubclass').addEventListener('change', () => { const ch = getCurrentChar(); if (!ch) return; ch.subclass = document.getElementById('charSubclass').value; ch.updatedAt = new Date().toISOString(); saveChars(); renderSkills(); });
document.getElementById('charLevel').addEventListener('change', () => { const ch = getCurrentChar(); if (!ch) return; ch.level = parseInt(document.getElementById('charLevel').value) || 0; recalculateResources(ch); renderSkills(); renderProgression(); renderAvailableBenefits(); updateResourceUI(); renderAbilities(); ch.updatedAt = new Date().toISOString(); saveChars(); });
document.getElementById('charName').addEventListener('input', () => { const ch = getCurrentChar(); if (!ch) return; ch.name = document.getElementById('charName').value.trim(); document.title = `Coordenada — ${ch.name}`; });

renderCharList();
