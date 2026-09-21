# Coordenada: contas, perfis e campanhas

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
