# Coordenada: contas, perfis e campanhas

## Novidades da versão 23 — correção da automação das habilidades

A automação da v22 não aparecia no caminho normal de uso. **Fichas criadas pelo assistente nascem no nível 0**, e as habilidades do livro só valem a partir do nível 1 — então quem criava a ficha, escolhia as habilidades e olhava a tela não via interruptor nenhum, nem bônus nenhum. Pior: o **custo permanente de PDE era cobrado mesmo no nível 0**, quando nenhum benefício estava valendo, e isso zerava o PDE máximo de ficha recém-criada.

- No **nível 0** a ficha agora não cobra nem concede nada, e o cartão da habilidade diz em uma linha: *"Esta habilidade só passa a valer no nível 1 do personagem. Suba o nível na ficha para a automação entrar."*
- A partir do **nível 1** tudo entra normalmente: custo permanente, bônus passivos, interruptor "Ativa agora" e botão "Usar (−X PDE)".
- Se o custo permanente zerar o PDE máximo (personagem de Estâmina muito baixa pegando uma habilidade de 6 PDE permanentes), agora aparece um aviso explicando o porquê, em vez de o número simplesmente ir a zero.

Os testes anteriores usavam fichas de nível 9 e 15, por isso passaram sem pegar o problema. Agora existe uma suíte que percorre o caminho real: criar ficha pelo assistente, abrir a biblioteca, clicar na habilidade, fechar, conferir o cartão, subir o nível, recarregar a página e conferir de novo.

## Novidades da versão 22 — habilidades automatizadas

A ficha passou a aplicar sozinha o que dá para calcular nas 60 habilidades do livro. O que depende de narrativa, de alvo ou da decisão do mestre continua só no texto do cartão.

### O que entra sozinho
- **Custo de PDE permanente** sai do máximo na hora: Proficiência com o DMT (−6), Mestre do Improviso (−6), Veterano de Guerra (−6), Aumento de Carga (−4) e Melhoria Geral (−2 por perícia escolhida).
- **Proficiência com o DMT** dá +2 em Testes de Defesa com esquiva, −1/−2 de gás por ação de movimento, +2/+4m de deslocamento e +1/+2 em Testes de Acerto, conforme o nível. Esses bônus aparecem marcados como **DMT** na seção Esquiva e Bloqueio, com a frase dizendo que só valem enquanto o personagem está usando o equipamento — e quanto fica a esquiva sem ele.
- **Aumento de Carga** soma +3 a +6 espaços na capacidade do inventário.
- **Veterano de Guerra** desconta o dano em PDV pela Fortitude (nível 4: Fortitude + Vontade) e reduz o dano de Sanidade em 1 ou 2.
- **Melhoria Geral** já somava o +1 de cada perícia; agora também cobra os PDE permanentes.

### Habilidades que você liga e desliga
Cartões como Concentração Total, Golpe de Sorte, Esquiva Avançada, Casca Grossa, Provocação, Instinto de Sobrevivência, Sob Pressão, Concentração de Mira, Investida Relâmpago, Golpe Baixo, Planejamento e Senso de Batalha ganharam um interruptor **"Ativa agora"**. Ligado, o bônus entra nos Testes de Acerto, na esquiva, no bloqueio, na margem de crítico ou nas perícias; desligado, sai. **Sede de Sangue** tem um contador de acertos acumulados com + / − / zerar.

### Botões novos no cartão
- **Usar (−X PDE)** desconta o custo do nível desbloqueado, lido do próprio texto do livro, e já liga a habilidade quando ela tem interruptor. Se faltar PDE, avisa e não desconta nada.
- **Dano extra** vira botão de rolagem (Reviravolta 3d8, Olhos de Águia 2d12, Finta 1d12, e assim por diante), com o resultado caindo no histórico como qualquer outra rolagem.

### Onde ver os números
A lista de valores derivados ganhou linhas para **Bônus de Defesa com Bloqueio**, **Redução de Dano em PDV**, **Deslocamento com o DMT** e **Gás por ação de movimento**, e a **Margem de Crítico** agora diz a partir de quanto o crítico sai (ex.: "−6 (crítico a partir de 14)").

### Correções que vieram junto
- **A margem de crítico estava invertida.** O talento Sortudo guardava −1, mas o rolador fazia `20 − margem`, ou seja, exigia 21 para crítico — nunca saía. Agora margem negativa deixa o crítico mais fácil, como o livro manda.
- **Adquirir ou remover habilidade não atualizava a tela.** Os PDE, as defesas e os derivados só mudavam depois de trocar de aba. Agora atualizam na hora.
- **Os bônus de deslocamento dos aprimoramentos do DMT** estavam somando no deslocamento a pé. Foram para a linha "Deslocamento com o DMT", junto com os da Proficiência.

### O que continua manual
17 habilidades não têm número para a ficha aplicar — re-rolagens, ações extras para aliados, efeitos no inimigo, revelar atributos, ataques múltiplos. Elas seguem com o texto completo e com o botão de gastar PDE.

## Novidades da versão 21

- **Correção: o site estava esticado em telas largas.** Numa correção anterior (a de nomes compridos que estouravam a página) entrou uma regra `max-width:100%` que, sem querer, anulou a largura máxima do site e das janelas. O conteúdo passou a ocupar o monitor inteiro de ponta a ponta. Agora volta ao normal: o site fica com no máximo 1180px, centralizado; as janelas voltam aos 640px (as simples) e 980px (o catálogo de fichas e a biblioteca). Nomes compridos continuam quebrando em vez de esticar a página — isso não foi desfeito.
- **Cartões de atributo alinhados:** quando a legenda ocupa duas linhas ("Deslocamento, Iniciativa" em tela mais estreita), os botões −/+/d20 ficavam mais embaixo que os dos outros atributos. Agora todos ficam na mesma altura.

## Novidades da versão 20

- **Contatos refeito com as redes de cada um:**
  - **Passoka** — Discord `passoka` (botão que copia o usuário), YouTube `@passoka`, Instagram `@pedro.passoka`.
  - **Safizitos** — Discord `safizitos` (botão que copia), X (Twitter) `@safizitos`.
  - **Comunidade** — servidor oficial do Discord e a playlist da campanha Liandry no YouTube.
  - Cada rede tem ícone próprio, e o Discord copia o usuário com um clique (o botão confirma "Copiado").
- **Rolagem só onde faz sentido:** o dado flutuante e o painel de rolagens aparecem apenas **na ficha**, **no escudo do mestre** e **na página da campanha do jogador**. No menu inicial, na lista de fichas, em Liandry e em Contatos o botão some, o painel não abre e o cartão de resultado não aparece. Sair da ficha fecha tudo, e o espaço que o botão ocupava no fim da página volta para o conteúdo.

## Novidades da versão 19

### Bugs corrigidos
- **Dado dentro de um cartão abria o cartão junto.** Clicar no dado de uma arma do inventário (ou de qualquer bloco que abre e fecha) rolava o dado *e* abria/fechava o cartão. Agora o clique no dado vale só para o dado.
- **Dado do Ataque Desarmado ficava numa linha solta** embaixo da linha do valor. Agora fica ao lado do `1d4`, na mesma linha.
- **Ficha antiga sem DMT quebrava** ao registrar um ataque de lâmina. O DMT passa a ser criado na hora, com os valores padrão.
- **Barra de PDV/PDE/SAN com valor negativo** deixava de ser desenhada (a largura ficava negativa e o navegador ignorava). Agora trava em 0.
- **Barra de espaços do inventário perdeu as cores de aviso** quando as barras ganharam cor própria. Voltou: amarelo perto do limite, vermelho na sobrecarga.
- **"Ativar o DMT Aprimorado completo" enchia os cilindros com 40 fixo**, mesmo quando os aprimoramentos davam outro valor. Agora usa o valor que os aprimoramentos realmente dão.
- **Trocar de origem com um id inválido quebrava a ficha.** Agora só avisa.
- **Nome de origem personalizada, descrição de equipamento e apelido de perfil** podiam entrar como HTML no aviso e no topo do site. Passam por escape.
- **Os quatro botões do cartão da ficha** (Abrir, Duplicar, Exportar, Excluir) quebravam a linha e deixavam "Excluir" sozinho embaixo. Viraram uma grade 2×2 alinhada.
- **O botão de dado flutuante cobria o botão do Discord** no rodapé.

### CSS
- **Barras de recurso com cor própria:** PDV em vermelho, PDE em verde, SAN em azul. Abaixo de 25% a barra pulsa devagar (desligado para quem pede menos animação no sistema).
- **Botão de dado das perícias com o rótulo `d20`**, igual ao dos atributos.
- **Barras de rolagem** no tom do tema, finas e arredondadas.
- **Foco visível pelo teclado** em tudo (botão, link, campo), sem aparecer no clique do mouse.
- **Texto selecionado** segue a cor do tema.
- **Linhas de valores derivados** acendem de leve ao passar o mouse; linhas de perícia também.
- **Estados vazios** ("inventário vazio", "nenhum aprimoramento") viraram caixas pontilhadas em vez de texto solto.
- **Modais** com desfoque leve no fundo, e o botão de dado flutuante sobe um pouco ao passar o mouse.
- **Espaço no fim da página** para o dado flutuante não ficar por cima do conteúdo.

## Novidades da versão 13
- **Tabela de cores com regras**: cada paleta é só um matiz; fundos, bordas, textos e destaque saem de uma escala fixa, igual para todas. Nenhuma cor fica mais clara, mais escura ou mais berrante que a outra, e o contraste texto/fundo é garantido nos dois temas.
- **Cores de aviso harmonizadas**: erro, acerto, atenção e informação passaram a usar a mesma escala da paleta. Se o matiz do aviso for parecido demais com o da paleta (erro vermelho num tema vermelho, por exemplo), ele é afastado automaticamente para continuar distinguível.
- **Escolher a cor ficou visual**: cada opção mostra uma amostra da paleta de verdade (fundo, destaque e texto), com marca na que está em uso.
- **Harmonia geral do CSS**: uma escala só de espaçamento, cantos e tamanhos de texto; botões em duas alturas; campos na mesma altura dos botões; etiquetas, selos e contadores no mesmo molde; foco visível igual em tudo.
- **Correção**: tons fixos que não acompanhavam a paleta (condições graves, selos de crítico e falha, rio do mapa, botões de excluir).

## Novidades da versão 12
- **Correção**: na criação de ficha, os botões "+" das perícias travavam no 6º ponto, mesmo quando o Intelecto dava mais pontos, e o botão de finalizar nunca liberava.
- **Histórico de rolagens unificado**: o painel do canto agora tem duas abas, **Minhas** e **Da mesa**. O mestre acompanha as rolagens de todo mundo com o painel aberto do lado, sem janela por cima da tela e sem ficar abrindo e fechando. O botão "Rolagens da mesa" abre o painel já na aba certa. O botão de limpar aparece só para o mestre, e a aba "Da mesa" só quando há campanha aberta.

## Novidades da versão 11
- **Criação de ficha mais clara**: o passo dos atributos explica em três linhas o que fazer, mostra avisos ("clique num dos números", "clique no atributo que recebe o 4"), destaca o número escolhido e acende os atributos que podem recebê-lo.
- **Pontos de perícia com o Intelecto**: o passo das perícias já soma os pontos que o Intelecto dá (ex.: Intelecto 4 → 6 + 4 = 10 pontos), com a conta escrita na tela. Se você voltar e mudar o Intelecto, a distribuição é recalculada.
- **Correções**:
  - As rolagens pessoais do mestre não vão mais para o histórico da campanha; só as feitas no escudo, na tela da campanha ou em fichas da campanha.
  - O "Exportar JSON" não leva mais campos internos de sincronização.
  - Estilo do topo do site não vaza mais para cabeçalhos internos (afetava o painel de rolagens e os cartões de condição).
- **CSS**: instruções do assistente, destaque dos valores e atributos, contador de pontos, e refinos gerais.

## Novidades da versão 10
- **Aba Condições refeita**: cada condição é um cartão com interruptor; o cartão ativo fica destacado (as graves, Morrendo e Enlouquecendo, em vermelho). No topo, um resumo com todas as condições ativas. A Fadiga ganhou uma barra de 8 marcadores e a lista completa de efeitos, com os que já valem acesos.
- **Bug da adrenalina corrigido**: desligar a condição limpava o estado, mas a faixa escolhida continuava acesa. Agora desligar limpa a faixa, e clicar de novo na faixa escolhida a desmarca.
- **Efeitos que eram só texto agora valem**: a Adrenalina aplica o bônus de Acerto e Deslocamento da faixa, e Vulnerável aplica −4 nos Testes de Defesa.
- **Controles do navegador no estilo do site**: caixinhas, bolinhas de escolha, listas de escolha (com seta própria e opções escuras), campos de número sem as setinhas brancas, botão de enviar arquivo, preenchimento automático sem fundo amarelo e barras de rolagem finas.
- **Refinos**: abas com sublinhado animado, botões com transição suave e leve afundada ao clicar, botões desativados com cursor e opacidade corretos.

## Novidades da versão 9
- **A cor muda o site inteiro**: fundo, cartões, bordas, textos, o mapa do Hub e os destaques passam a ter o tom escolhido (antes só os botões mudavam).
- **Cor pela classe corrigida**: muda na hora em que você troca a classe no seletor da ficha, e continua valendo nas outras telas com a cor da última ficha aberta.
- **Rolagem**: aparece só o cartão com a rolagem que acabou de ser feita; rolar outra coisa troca o conteúdo do cartão; o histórico abre **somente** pelo botão do dado no canto. A opção antiga "abrir o histórico a cada rolagem" foi removida.

## Novidades da versão 8
- **Cor do tema** na engrenagem: seis paletas (Aço, Sangue, Musgo, Âmbar, Violeta e Turquesa), cada uma com uma versão para o tema escuro e outra, mais escura, para o tema claro.
- **Cor pela classe**: ligando a opção, a cor do site acompanha a ficha aberta — Linha de Frente fica vermelho, Suporte de Campo verde e Especialista de Batalha (Estrategista e Capitão) amarelo.
- O cartão da rolagem ganhou o **X para fechar** e mostra os dados no formato `[7]+13 = 20`.

## Novidades da versão 7
- **Histórico de rolagens da campanha**: tudo que o mestre e os jogadores rolam aparece em tempo real no botão **"Rolagens da mesa"** (no topo do escudo, para o mestre, e na tela da campanha, para o jogador). Mostra quem rolou, com qual ficha, o resultado e os dados. O mestre pode limpar o histórico para todos.
  - Na engrenagem dá para desligar "Enviar minhas rolagens para a campanha" e rolar em segredo.
  - **Publique de novo o `firestore.rules`**, senão as rolagens dão erro de permissão.
- **O resultado da rolagem fica na tela** até você rolar de novo, quando ele troca pelo novo. O histórico completo continua abrindo no dado do canto.
- **Título da aba** acompanha a tela aberta: "Soldados", "Campanhas", "Liandry", o nome da ficha, o nome da campanha no escudo. Antes só mudava ao abrir uma ficha e ficava travado nela.

## Novidades da versão 6
- **Vantagem e desvantagem**: o Titã Colossal (e qualquer titã cujo teste diga "com desvantagem") rola 2d20 e fica com o menor. O painel mostra o dado descartado riscado e o selo "Desvantagem".
- **Variações do Titã Puro** entram na conta: Gordo (−2 no acerto, +1d6 no dano), Magro (+2 e −1d6) e Atlético (+1 e +1d6). A linha "Ataque:" do cartão passou a mostrar os valores já com a variação.
- **Botões de dado no lugar certo**: agora aparecem logo abaixo da linha "Ataque:" de cada titã, em vez de no fim do cartão, e não se repetem mais quando a tela é redesenhada.
- **Rolagem mostra só o resultado**: ao rolar, aparece um cartãozinho com o valor. A lista completa abre clicando no dado do canto, com as rolagens mais recentes embaixo. Quem preferir o comportamento antigo liga na engrenagem.

## Novidades da versão 5
- **Dados nos titãs e nos soldados**: no escudo, cada Titã Puro tem botão de acerto e dano da categoria; cada Titã Primordial tem acerto, dano e regeneração, já com os atributos substituídos (ex.: "9d6 + 8"); cada soldado ou NPC do encontro tem Luta e dano de lâminas, e o dano do Titã quando está transformado. Na ficha do jogador, a aba Titã ganhou os mesmos botões.
- **Botão de engrenagem** no topo, com todas as configurações num lugar só: tema claro ou escuro, se o painel de rolagens abre sozinho, as opções da ficha aberta (compartilhar com os outros jogadores e ligar o sistema de XP) e atalhos da conta. O cartão "Configurações da ficha" saiu da ficha, porque virou parte da engrenagem.
- **Tema claro** guardado no navegador.

## Novidades da versão 4
- **Rolagem de dados**: botão de d20 em cada atributo e em cada perícia (usando o total já calculado), botões de dano nos ataques rápidos, nos itens do inventário, no ataque desarmado e no DMT. Um painel no canto guarda as últimas 30 rolagens, mostra cada dado individual e marca crítico e falha crítica. Também aceita rolagem escrita à mão, no formato `2d4`, `3d6+4` ou `1d20 + Força`.
- **DMT Aprimorado**: os 6 aprimoramentos do livro entram por caixinhas (ou de uma vez, no botão), e valem de verdade na ficha (gás por cilindro, durabilidade das lâminas, deslocamento, testes de defesa, redução de dano e dano do canhão). Dá para criar aprimoramentos próprios com os mesmos efeitos.
- **Configurações da ficha**: ligar/desligar o sistema de XP e escolher se a ficha aparece para os outros jogadores da campanha. O mestre também pode desligar isso na ficha de um jogador.
- **Sistema de XP (opcional)**: meta de XP de cada nível, barra de progresso, tabela de conquistas do livro e botão para subir de nível zerando o XP.
- **Fichas oficiais do livro**: os 9 personagens prontos (Eren, Mikasa, Armin, Levi, Erwin, Hange, Kenny, Petra e Sasha), com atributos, perícias, habilidades, talentos, defeitos, anotações, as habilidades exclusivas de nível 12 e o Titã de Ataque do Eren. Botão "Fichas oficiais do livro" na tela Soldados.
- **Biblioteca de habilidades**: filtro "Posso pegar" e marcação nas que estão fora da sua subclasse.

## Novidades da versão 3
- **Configurar campanha** (botão no topo do escudo):
  - Foto de capa e descrição.
  - Quem pode entrar: qualquer pessoa com o código/link, ou só quem o mestre aprovar.
  - Opção de os jogadores verem as fichas uns dos outros, só para olhar.
- **Link de convite:** abre uma página com a capa, a descrição e o botão "Entrar" (ou "Pedir para entrar").
- **Pedidos para entrar:** aparecem na aba Jogadores, com Aceitar/Recusar. O jogador é avisado na hora.
- **Aba NPCs:** crie NPCs pelo assistente de criação ou transforme uma ficha sua em NPC.
  - Os NPCs não aparecem em Soldados e têm limite próprio: 30 por conta.
- **Encontro e Iniciativa:**
  - O "Adicionar" tem abas Jogadores / NPCs / Suas fichas / Titãs, com busca.
  - O Encontro separa os soldados em grupos que dá para recolher.
  - Dentro de uma campanha, suas fichas e NPCs só entram no encontro quando você adiciona.
- **Segurança:** textos que vêm de outros jogadores são tratados antes de aparecer na tela, para ninguém conseguir injetar código pelo nome da ficha.
  - As aspas e os sinais < > nesses textos aparecem como “ ’ ‹ ›.

**IMPORTANTE:** publique de novo o `firestore.rules`. Sem isso, pedidos, fichas compartilhadas e as configurações da campanha dão erro de permissão.

## O que mudou nesta versão
- **Campanhas** substitui o card "Escudo do Mestre" no Hub:
  - O **mestre** cria a campanha e recebe um código de 6 letras.
  - O **jogador** cola o código e envia a ficha.
- Cada campanha tem o **próprio escudo** (encontro, iniciativa, titãs, biomas) e uma aba nova, **Jogadores**, com as fichas e os participantes em tempo real.
- O **jogador** vê as campanhas em que está, as fichas que enviou e os participantes.
- **Perfil:** apelido e avatar, pedidos no primeiro login.
- **Login por e-mail e senha**, além do Google, e opção de **trocar de conta**.
- **Limites:** 20 fichas por conta e 5 campanhas por mestre.
- **Bugs corrigidos:**
  - As fichas não apareciam em outro PC sem F5.
  - A ficha parava de atualizar em tempo real.
  - O mestre podia sobrescrever a ficha do jogador com uma cópia velha.
- **Edição simultânea:** se o mestre muda o PDV enquanto o jogador mexe no inventário, as duas mudanças são mantidas.

## O que você precisa fazer no Firebase

### 1. Publicar as regras novas (obrigatório)
Abra o Firestore > aba **Regras**, apague tudo, cole o conteúdo do `firestore.rules` e clique em **Publicar**.
Sem isso, as campanhas dão erro de permissão.

### 2. Ativar login por e-mail (opcional)
Abra **Authentication > Método de login > Adicionar novo provedor > E-mail/senha**, ative a primeira chave e salve.
Se você não ativar, o botão do Google continua funcionando normalmente.

### 3. Subir os arquivos
Substitua os arquivos no seu projeto e faça commit + push, como antes.
**Mantenha o seu `firebase-config.js`**, que já tem os seus dados. Os outros arquivos podem ser trocados.

## Como usar
- **Mestre:** Hub > Campanhas > "Nova campanha" > passe o código.
- **Jogador:** Hub > Campanhas > cole o código em "Entrar numa campanha" > "Enviar ficha".
  - Também dá para enviar direto de dentro da ficha, no painel do topo.
- **Remover jogador:** o mestre clica no × ao lado do nome dele, na aba Jogadores.
- **Escudo avulso:** é o escudo sem campanha, para usar sem precisar criar uma.
  - Os dados do escudo antigo continuam nele.

## Quem vê o quê
- **Fichas:** só o dono e o mestre da campanha em que a ficha está.
- **Lista de participantes:** o mestre e os participantes daquela campanha veem os apelidos, mas não as fichas uns dos outros.
- **Edição:** o mestre pode editar as fichas da campanha (dano, PE, condições), mas não pode excluí-las.

## Problemas comuns
- **"Sem permissão":** as regras novas não foram publicadas (passo 1).
- **`auth/unauthorized-domain`:** falta adicionar o domínio do Vercel em Authentication > Configurações > Domínios autorizados.
- **"Login por e-mail ainda não foi ativado":** falta o passo 2.
- **Status "Erro ao salvar" no topo:** passe o mouse ou clique no seu nome. Na maioria das vezes é falta de internet, e o site tenta de novo sozinho quando a conexão volta.
