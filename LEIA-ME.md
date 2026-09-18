# Coordenada: contas, perfis e campanhas

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
