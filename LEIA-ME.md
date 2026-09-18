# Coordenada: login com Google e mesas

## Arquivos novos
- `nuvem.js`: login, salvamento na nuvem e sistema de mesas.
- `firebase-config.js`: aqui você cola a configuração do seu projeto Firebase.
- `firestore.rules`: regras de segurança. Você cola o conteúdo no Console do Firebase.
- `index.html` e `style.css` ganharam só alguns pontos de encaixe. O `script.js` NÃO foi alterado.

## Passo a passo

1. **Criar o projeto.** Acesse https://console.firebase.google.com e clique em "Criar projeto" (ou "Adicionar projeto"). Dê um nome, e pode desativar o Google Analytics. O plano é o Spark (gratuito) e não pede cartão.

2. **Registrar o app web.** Na página inicial do projeto, clique no ícone `</>` (Web). Dê um apelido e NÃO marque "Firebase Hosting". Ele mostra um bloco `const firebaseConfig = {...}`. Copie os valores para dentro de `firebase-config.js`, substituindo os `COLE_AQUI`.

3. **Ligar o login com Google.** No menu, vá em Criação/Build > Authentication > "Vamos começar". Na aba "Método de login", escolha Google, ative, escolha o e-mail de suporte e salve.

4. **Autorizar o domínio do Vercel.** Ainda em Authentication, abra a aba "Configurações" > "Domínios autorizados" > "Adicionar domínio". Coloque o endereço do seu site, sem https://, por exemplo `coordenada.vercel.app`. Se tiver domínio próprio, adicione ele também.

5. **Criar o banco de dados.** Vá em Build > Firestore Database > "Criar banco de dados". Se perguntar a edição, escolha Standard. Local: `southamerica-east1 (São Paulo)`, que não pode ser trocado depois. Modo: produção.

6. **Colar as regras de segurança.** No Firestore, abra a aba "Regras", apague tudo, cole o conteúdo de `firestore.rules` e clique em "Publicar".

7. **Subir no Vercel.** Substitua os arquivos do seu projeto por estes, incluindo os novos, e faça o deploy como sempre: push no GitHub ou arrastando a pasta.

8. **Testar.** Abra o site, clique em "Entrar com Google" no topo e confira se aparece "Salvo na nuvem".

## Como usar
- **Mestre:** Escudo do Mestre > "Nova mesa" > passe o código de 6 letras para os jogadores.
- **Jogador:** abra a ficha > digite o código > "Entrar na mesa".
- A ficha aparece para o mestre no painel do topo do Escudo e na aba Encontro, em tempo real. O mestre pode aplicar dano e abrir a ficha completa.
- **Quem vê a ficha:** só o dono e o mestre daquela mesa. Nenhum outro jogador vê.
- **"Sair da mesa"** na ficha faz o mestre deixar de ver.
- **Sem login**, o site funciona como antes, só no navegador. No primeiro login, as fichas que já existiam naquele navegador sobem para a conta.

## Problemas comuns
- **`auth/unauthorized-domain`:** falta o passo 4. Links de "preview" do Vercel, com hash no nome, têm outro domínio, então teste no domínio principal.
- **`permission-denied` / "Não consegui conectar":** as regras do passo 6 não foram publicadas.
- **O botão "Entrar com Google" não aparece:** o `firebase-config.js` ainda está com `COLE_AQUI`.
- **Abrir o index.html direto do computador (file://):** o login não funciona assim. Use o site no Vercel.
- **Duas pessoas editando a mesma ficha no mesmo segundo:** vale a última alteração salva.

## Gratuito
Tudo roda no plano Spark do Firebase, que é grátis e sem cartão, e no plano Hobby do Vercel. Imagens de ficha são reduzidas automaticamente e ficam dentro do próprio banco, então não é preciso o Firebase Storage, que exigiria o plano pago. Se algum dia passar da cota diária gratuita, o Firebase não cobra: só pausa até o dia seguinte.
