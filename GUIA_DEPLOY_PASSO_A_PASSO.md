# 🚀 GUIA COMPLETO DE DEPLOY - PSF WEB
### Passo a Passo Detalhado

> **Tempo estimado:** 45-60 minutos
> **Custo:** $0/mês (100% gratuito)

---

## 📋 CHECKLIST ANTES DE COMEÇAR

Certifique-se de ter:
- ✅ Conta Google (para Firebase)
- ✅ Conta GitHub (para Render e Netlify)
- ✅ Código do projeto commitado no GitHub
- ✅ Terminal/console aberto

---

## ETAPA 1: FIREBASE/FIRESTORE (Banco de Dados)

### 1.1 - Criar Projeto no Firebase

1. **Acesse:** https://console.firebase.google.com/
2. **Faça login** com sua conta Google
3. **Clique em:** "Adicionar projeto" ou "Create a project"
4. **Nome do projeto:** Digite `psf-web` (ou nome de sua escolha)
5. **Clique:** Continuar
6. **Google Analytics:**
   - Recomendo **desativar** (não necessário)
   - Ou ative se quiser métricas de uso
7. **Clique:** Criar projeto
8. **Aguarde:** ~30-60 segundos
9. **Clique:** Continuar quando pronto

✅ **Projeto Firebase criado!**

---

### 1.2 - Ativar Firestore Database

1. **No menu lateral esquerdo**, procure e clique em:
   - **"Firestore Database"**
   - Ou vá em **"Build" → "Firestore Database"**

2. **Clique em:** "Criar banco de dados" (Create database)

3. **Modo de segurança:**
   - Selecione: **"Iniciar no modo de produção"** (Start in production mode)
   - ⚠️ Não se preocupe, vamos configurar as regras depois
   - **Clique:** Próxima (Next)

4. **Localização do Firestore:**
   - Selecione: **`southamerica-east1` (São Paulo)** ← Melhor para Brasil
   - Ou escolha a região mais próxima de você
   - **Clique:** Ativar (Enable)

5. **Aguarde:** 1-2 minutos para o banco ser criado

✅ **Firestore Database ativo!**

---

### 1.3 - Configurar Regras de Segurança

1. **Ainda na tela do Firestore Database:**
   - Clique na aba **"Regras"** (Rules) no topo

2. **Você verá um editor de código**

3. **DELETE todo o conteúdo** e **COLE este código:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Projects: Qualquer um pode ler, só admin pode escrever
    match /projects/{projectId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Posts: Qualquer um pode ler posts publicados, só admin pode escrever
    match /posts/{postId} {
      allow read: if resource.data.isPublished == true || request.auth != null;
      allow write: if request.auth != null;
    }

    // Applications: Só admin pode acessar
    match /applications/{applicationId} {
      allow read, write: if request.auth != null;
    }

    // Users: Só admin pode acessar
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. **Clique em:** "Publicar" (Publish)

✅ **Regras de segurança configuradas!**

---

### 1.4 - Baixar Service Account Key (CRÍTICO!)

**⚠️ ATENÇÃO:** Este arquivo é SECRETO! Nunca compartilhe ou faça commit dele!

1. **Clique no ícone de engrenagem** ⚙️ (canto superior esquerdo, ao lado de "Visão geral do projeto")

2. **Selecione:** "Configurações do projeto" (Project settings)

3. **Clique na aba:** "Contas de serviço" (Service accounts)

4. **Você verá uma opção:** "Admin SDK configuration snippet"

5. **Clique em:** "Gerar nova chave privada" (Generate new private key)

6. **Confirme clicando:** "Gerar chave" (Generate key)

7. **Um arquivo JSON será baixado automaticamente**

8. **Renomeie o arquivo para:** `serviceAccountKey.json`

9. **Mova ele para a pasta do projeto:**
   ```bash
   mv ~/Downloads/psf-web-*-firebase-adminsdk-*.json \
      /home/vhrsm/Documentos/github/psf-web/backend/serviceAccountKey.json
   ```

10. **Verifique se está no lugar certo:**
    ```bash
    ls -la /home/vhrsm/Documentos/github/psf-web/backend/serviceAccountKey.json
    ```

✅ **Service Account Key baixada!**

**🔒 IMPORTANTE:**
- Este arquivo NÃO deve ser commitado no Git
- Ele já está no `.gitignore`
- Você vai copiar o conteúdo dele para o Render (próxima etapa)

---

### 1.5 - Criar Coleções Iniciais (Opcional mas Recomendado)

Vamos criar as 4 coleções que o sistema usa:

**Para cada coleção abaixo, repita estes passos:**

1. **No Firestore Database**, clique em: "Iniciar coleção" (Start collection)
2. **ID da coleção:** Digite o nome (veja lista abaixo)
3. **Clique:** Próximo (Next)
4. **ID do documento:** Clique em "Auto-ID"
5. **Adicione um campo temporário:**
   - **Campo:** `temp`
   - **Tipo:** `string`
   - **Valor:** `delete`
6. **Clique:** Salvar (Save)

**Crie estas 4 coleções:**
- ✅ `projects`
- ✅ `posts`
- ✅ `applications`
- ✅ `users`

Depois você pode deletar os documentos temporários.

✅ **Firebase completo! Próxima etapa: Render (Backend)**

---

## ETAPA 2: RENDER.COM (Backend/API)

### 2.1 - Preparar Código no GitHub

Antes de fazer deploy, seu código precisa estar no GitHub.

```bash
# Navegar para o projeto
cd /home/vhrsm/Documentos/github/psf-web

# Verificar status do Git
git status

# Se houver mudanças, commite:
git add .
git commit -m "Preparar para deploy em produção"

# Se ainda não tem repositório remoto no GitHub:
# 1. Crie um repositório novo no GitHub (vazio, sem README)
# 2. Copie a URL do repositório
# 3. Execute:
git remote add origin https://github.com/SEU-USUARIO/psf-web.git
git branch -M main
git push -u origin main

# Se já tem repositório, apenas:
git push
```

✅ **Código no GitHub!**

---

### 2.2 - Criar Conta no Render

1. **Acesse:** https://render.com/
2. **Clique em:** "Get Started" ou "Sign Up"
3. **Escolha:** "Sign up with GitHub" (RECOMENDADO)
4. **Autorize** o Render a acessar sua conta GitHub
5. **Complete seu perfil** se solicitado

✅ **Conta Render criada!**

---

### 2.3 - Criar Web Service

1. **No Dashboard do Render** (https://dashboard.render.com/)
2. **Clique em:** "New +" (botão azul, canto superior direito)
3. **Selecione:** "Web Service"

4. **Conectar repositório:**
   - Se aparecer lista: Encontre e selecione **`psf-web`**
   - Se não aparecer: Clique em "Configure account" → Autorize o acesso ao repositório

5. **Clique em:** "Connect" (ao lado do repositório `psf-web`)

---

### 2.4 - Configurar o Web Service

Preencha o formulário com estas informações:

| Campo | Valor | Explicação |
|-------|-------|------------|
| **Name** | `psf-backend` | Nome único do seu serviço |
| **Region** | `Oregon (US West)` | Região do servidor (pode escolher outra) |
| **Branch** | `main` | Branch do Git para deploy |
| **Root Directory** | `backend` | Pasta onde está o código backend |
| **Runtime** | `Node` | Detecta automaticamente |
| **Build Command** | `npm install` | Comando para instalar dependências |
| **Start Command** | `npm start` | Comando para iniciar servidor |

---

### 2.5 - Selecionar Plano Free

- **Instance Type:** Selecione **"Free"**
- **Free plan inclui:**
  - ✅ 512 MB RAM
  - ✅ 750 horas/mês (suficiente para 24/7)
  - ⚠️ Dorme após 15 min de inatividade

---

### 2.6 - Configurar Variáveis de Ambiente (CRÍTICO!)

**Role a página até:** "Environment Variables"

**Clique em:** "Add Environment Variable"

**Você vai adicionar 4 variáveis. Para cada uma:**

---

#### Variável 1: NODE_ENV

- **Key:** `NODE_ENV`
- **Value:** `production`
- Clique em "Add"

---

#### Variável 2: PORT

- **Key:** `PORT`
- **Value:** `10000`
- Clique em "Add"

---

#### Variável 3: SESSION_SECRET

- **Key:** `SESSION_SECRET`
- **Value:** ← Você precisa gerar!

**Como gerar SESSION_SECRET:**

```bash
# No terminal, execute:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copie o resultado** (uma string longa tipo `a3f8d9e2b7c1...`) e **cole no campo Value**

- Clique em "Add"

---

#### Variável 4: FIREBASE_SERVICE_ACCOUNT (MAIS IMPORTANTE!)

- **Key:** `FIREBASE_SERVICE_ACCOUNT`
- **Value:** ← Conteúdo do arquivo JSON

**Como obter o valor:**

```bash
# No terminal, vá até a pasta backend:
cd /home/vhrsm/Documentos/github/psf-web/backend

# Exiba o conteúdo do arquivo:
cat serviceAccountKey.json
```

**Você verá algo assim:**
```json
{
  "type": "service_account",
  "project_id": "psf-web-xxxxx",
  "private_key_id": "xxxxx...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  ...
}
```

**COPIE TUDO** (desde o `{` inicial até o `}` final)

**COLE no campo Value** do Render

⚠️ **DICA:** Pode copiar com quebras de linha, o Render aceita!

- Clique em "Add"

---

### 2.7 - Fazer o Deploy!

1. **Revise as configurações:**
   - ✅ Name: `psf-backend`
   - ✅ Root Directory: `backend`
   - ✅ Build: `npm install`
   - ✅ Start: `npm start`
   - ✅ 4 variáveis de ambiente adicionadas

2. **Clique em:** "Create Web Service" (botão azul no final)

3. **Aguarde o deploy** (3-5 minutos)

**O que está acontecendo:**
- Render está clonando seu repositório
- Instalando dependências (`npm install`)
- Iniciando o servidor

**Você verá os logs em tempo real:**
```
==> Cloning from https://github.com/...
==> Running build command 'npm install'...
==> npm install
==> added 150 packages
==> Build successful!
==> Starting server...
==> ✅ Servidor rodando na porta 10000
```

4. **Quando aparecer "Live"** (bolinha verde) → **Deploy concluído!**

---

### 2.8 - Obter URL do Backend

1. **No topo da página**, você verá uma URL tipo:
   ```
   https://psf-backend.onrender.com
   ```
   Ou
   ```
   https://psf-backend-xxxx.onrender.com
   ```

2. **COPIE esta URL** (você vai usar depois)

3. **Teste no navegador:**
   - Acesse: `https://psf-backend-xxxx.onrender.com`
   - Deve aparecer conteúdo do seu site ou API

4. **Teste o painel admin:**
   - Acesse: `https://psf-backend-xxxx.onrender.com/admin/login`
   - Deve aparecer a página de login do admin

✅ **Backend no ar!**

---

### 2.9 - Criar Usuário Admin (IMPORTANTE!)

Você precisa criar um usuário admin para acessar o painel.

**Opção 1: Via Shell do Render (Recomendado)**

1. **No Dashboard do Render**, acesse seu serviço `psf-backend`
2. **Clique na aba:** "Shell" (menu superior)
3. **Aguarde o terminal abrir** (~10 segundos)
4. **Execute:**

```bash
cd backend
ADMIN_EMAIL=seu@email.com ADMIN_PASSWORD=SuaSenhaSegura123! node create-admin.js
```

**Substitua:**
- `seu@email.com` → Seu email real
- `SuaSenhaSegura123!` → Uma senha forte (mínimo 8 caracteres)

5. **Aguarde a mensagem:**
   ```
   ✅ Admin user created successfully!
   📋 Admin Credentials:
   Email: seu@email.com
   Password: (the password you provided - keep it secure!)
   ```

6. **ANOTE SUAS CREDENCIAIS!**

**Opção 2: Criar localmente e fazer seed**

Se preferir, crie o admin localmente e o Firestore sincroniza automaticamente:

```bash
# No seu computador, na pasta backend:
cd /home/vhrsm/Documentos/github/psf-web/backend
ADMIN_EMAIL=seu@email.com ADMIN_PASSWORD=SuaSenhaSegura123! node create-admin.js
```

O usuário será criado no Firestore e estará disponível em produção!

✅ **Admin criado! Próxima etapa: Netlify (Frontend)**

---

## ETAPA 3: NETLIFY (Frontend) - OPCIONAL

### ⚠️ IMPORTANTE: Você precisa de Frontend separado?

**Verifique seu projeto:**

Se o seu projeto usa **Server-Side Rendering (SSR) com EJS**, o frontend já está sendo servido pelo backend do Render. Neste caso:

- ✅ Seu site completo já está em: `https://psf-backend-xxxx.onrender.com`
- ✅ **Pule esta etapa** e vá direto para **ETAPA 4**

**Quando usar Netlify:**
- Se você tem uma pasta `frontend/` com arquivos HTML/CSS/JS estáticos
- Se quer separar frontend do backend
- Se quer CDN global para assets

---

### 3.1 - Criar Conta no Netlify

1. **Acesse:** https://app.netlify.com/
2. **Clique em:** "Sign up"
3. **Escolha:** "Sign up with GitHub" (RECOMENDADO)
4. **Autorize** o acesso do Netlify ao GitHub

✅ **Conta Netlify criada!**

---

### 3.2 - Deploy via Drag & Drop (Método Simples)

**Melhor para:** Testes rápidos

1. **No Dashboard do Netlify:**
   - Clique em: **"Add new site"** → **"Deploy manually"**

2. **Abra o explorador de arquivos:**
   - Vá até: `/home/vhrsm/Documentos/github/psf-web/frontend/assets`

3. **Arraste a pasta `assets`** para a área de drop no Netlify

4. **Aguarde o upload** (10-30 segundos)

5. **Netlify gera uma URL aleatória:**
   ```
   https://random-name-12345.netlify.app
   ```

6. **Personalize o nome:**
   - Clique em: "Site settings"
   - Clique em: "Change site name"
   - Digite: `psf-frontend` (ou outro nome disponível)
   - Sua URL será: `https://psf-frontend.netlify.app`

✅ **Frontend no ar!**

---

### 3.3 - Deploy via Git (Método Automático)

**Melhor para:** Auto-deploy em cada commit

1. **No Dashboard do Netlify:**
   - Clique em: **"Add new site"** → **"Import an existing project"**

2. **Conectar Git Provider:**
   - Clique em: **"GitHub"**
   - Autorize (se necessário)

3. **Selecionar Repositório:**
   - Encontre e clique em: **`psf-web`**

4. **Configurações de Build:**

| Campo | Valor |
|-------|-------|
| **Branch to deploy** | `main` |
| **Base directory** | `frontend/assets` |
| **Build command** | (deixe vazio) |
| **Publish directory** | `.` |

5. **Clique em:** "Deploy site"

6. **Aguarde:** 1-2 minutos

7. **Obtenha a URL:** `https://seu-site.netlify.app`

✅ **Frontend com auto-deploy configurado!**

---

## ETAPA 4: CONFIGURAÇÃO FINAL

### 4.1 - Atualizar CORS no Backend

Agora que você tem as URLs finais, precisa configurar o CORS.

**Edite o arquivo:** `backend/src/server.js`

**Encontre esta linha:**
```javascript
app.use(cors());
```

**Substitua por:**
```javascript
app.use(cors({
  origin: [
    'https://psf-backend-xxxx.onrender.com',    // Sua URL do Render
    'https://psf-frontend.netlify.app',         // Sua URL do Netlify (se usar)
    'http://localhost:3000'                     // Para desenvolvimento local
  ],
  credentials: true
}));
```

**⚠️ Substitua as URLs pelas suas URLs reais!**

---

### 4.2 - Atualizar Configuração de Session

**No mesmo arquivo `backend/src/server.js`:**

**Encontre o bloco de session:**
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET || 'psf-blog-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));
```

**Substitua por:**
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET || 'psf-blog-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 dias
    httpOnly: true,
    secure: true,                      // HTTPS obrigatório
    sameSite: 'none'                   // Permite cross-origin
  }
}));
```

---

### 4.3 - Fazer Commit e Push

```bash
cd /home/vhrsm/Documentos/github/psf-web

# Adicionar mudanças
git add backend/src/server.js

# Commitar
git commit -m "Configure CORS and session for production"

# Push para GitHub
git push
```

**O Render vai detectar o push e fazer redeploy automaticamente!**

Aguarde 2-3 minutos e seu backend estará atualizado.

---

### 4.4 - Testar Tudo

#### Teste 1: Backend/API

Acesse: `https://psf-backend-xxxx.onrender.com`

✅ Deve carregar a página inicial

#### Teste 2: Admin Login

Acesse: `https://psf-backend-xxxx.onrender.com/admin/login`

- ✅ Deve aparecer a página de login
- ✅ Faça login com as credenciais que você criou
- ✅ Deve entrar no dashboard admin

#### Teste 3: Blog

Acesse: `https://psf-backend-xxxx.onrender.com/blog`

✅ Deve listar os posts (se houver)

#### Teste 4: Frontend (se usou Netlify)

Acesse: `https://psf-frontend.netlify.app`

✅ Deve carregar seus assets estáticos

---

## 🎉 PARABÉNS! DEPLOY COMPLETO!

### 📊 Resumo do que você fez:

- ✅ **Firebase/Firestore:** Banco de dados configurado
- ✅ **Render.com:** Backend/API no ar
- ✅ **Netlify:** Frontend estático (se aplicável)
- ✅ **Admin criado:** Acesso ao painel administrativo
- ✅ **CORS configurado:** Backend e frontend conectados
- ✅ **100% GRATUITO:** $0/mês

---

## 🔧 PRÓXIMOS PASSOS

### 1. Evitar que o Render durma (Opcional)

O plano free do Render dorme após 15 min de inatividade. Para manter sempre ativo:

**Use UptimeRobot (Gratuito):**

1. Acesse: https://uptimerobot.com/
2. Crie conta grátis
3. Adicione monitor:
   - **Type:** HTTP(s)
   - **URL:** `https://psf-backend-xxxx.onrender.com`
   - **Monitoring Interval:** 5 minutos
4. Salve

Agora seu backend será "pingado" a cada 5 minutos e nunca dormirá!

---

### 2. Configurar Domínio Próprio (Opcional)

**Para Backend (Render):**
1. Compre um domínio (ex: namecheap.com, registro.br)
2. No Render: Settings → Custom Domain → Add
3. Configure DNS conforme instruções

**Para Frontend (Netlify):**
1. No Netlify: Domain settings → Add custom domain
2. Configure DNS conforme instruções

---

### 3. Monitoramento e Logs

**Render Logs:**
- Dashboard → Seu serviço → Logs (aba)

**Netlify Logs:**
- Dashboard → Seu site → Deploys → Ver logs

**Firebase Usage:**
- Console Firebase → Usage and billing

---

### 4. Backup Regular

**Exportar dados do Firestore:**

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Exportar
firebase firestore:export backup-$(date +%Y%m%d)
```

---

## 🆘 TROUBLESHOOTING

### Problema: Backend não inicia no Render

**Solução:**
1. Verifique logs em: Render Dashboard → Logs
2. Confirme `FIREBASE_SERVICE_ACCOUNT` está correta
3. Verifique `package.json` tem script `start`

### Problema: Erro de CORS

**Solução:**
1. Confirme URLs corretas em `cors({ origin: [...] })`
2. Inclua `credentials: true`
3. Faça novo deploy

### Problema: Sessão não persiste

**Solução:**
1. Adicione `sameSite: 'none'` no cookie
2. Confirme `secure: true` em produção
3. Use HTTPS (nunca HTTP)

### Problema: Admin login não funciona

**Solução:**
1. Verifique se criou admin com `create-admin.js`
2. Confirme usuário existe no Firestore
3. Teste senha localmente primeiro

---

## 📚 RECURSOS ÚTEIS

- **Render Docs:** https://render.com/docs
- **Netlify Docs:** https://docs.netlify.com
- **Firebase Docs:** https://firebase.google.com/docs/firestore
- **Express.js:** https://expressjs.com/

---

## 🎯 CHECKLIST FINAL

- [ ] Firebase/Firestore ativo
- [ ] Service Account Key baixada
- [ ] Render backend deployado
- [ ] Variáveis de ambiente configuradas
- [ ] Admin user criado
- [ ] Login admin funcionando
- [ ] CORS configurado
- [ ] (Opcional) Netlify frontend deployado
- [ ] (Opcional) UptimeRobot configurado
- [ ] URLs de produção anotadas

---

**🚀 Seu sistema está no ar! Bom trabalho!**

**URLs Finais:**
- **Backend/Admin:** https://psf-backend-xxxx.onrender.com
- **Admin Login:** https://psf-backend-xxxx.onrender.com/admin/login
- **Frontend:** https://psf-frontend.netlify.app (se aplicável)

---

**Feito com ❤️ por Problem Solver Foundation**
