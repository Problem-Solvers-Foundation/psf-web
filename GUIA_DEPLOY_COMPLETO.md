# 🚀 Guia Completo de Deploy - Passo a Passo

Este é um guia **COMPLETO** para publicar seu sistema na internet **100% gratuito**.

**Tempo estimado:** 30-45 minutos
**Custo:** R$ 0,00
**Nível:** Iniciante a Intermediário

---

## 📋 Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Preparar o Projeto](#2-preparar-o-projeto)
3. [Deploy do Backend (Render.com)](#3-deploy-do-backend-rendercom)
4. [Deploy do Frontend (Netlify)](#4-deploy-do-frontend-netlify)
5. [Conectar Tudo](#5-conectar-tudo)
6. [Configurar Banco de Dados](#6-configurar-banco-de-dados)
7. [Criar Usuário Admin](#7-criar-usuário-admin)
8. [Testar o Sistema](#8-testar-o-sistema)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Pré-requisitos

### ✅ Checklist Inicial

Antes de começar, certifique-se de ter:

- [ ] Conta no GitHub (grátis)
- [ ] Projeto PSF no GitHub
- [ ] Node.js 18+ instalado
- [ ] Git instalado
- [ ] Projeto Firebase criado
- [ ] Service Account Key baixado

### 🔧 Instalar Ferramentas Necessárias

#### 1.1 Verificar Node.js e Git

```bash
# Verificar Node.js (deve ser 18+)
node --version

# Verificar Git
git --version

# Verificar npm
npm --version
```

Se não tiver instalado:
- **Node.js:** https://nodejs.org/ (baixe a versão LTS)
- **Git:** https://git-scm.com/downloads

#### 1.2 Instalar Netlify CLI

```bash
# Instalar globalmente
npm install -g netlify-cli

# Verificar instalação
netlify --version
```

---

## 2. Preparar o Projeto

### 2.1 Verificar Estrutura do Projeto

```bash
cd /home/vhrsm/Documentos/github/psf-web

# Verificar estrutura
ls -la
```

Você deve ver:
```
├── backend/
├── frontend/
├── render.yaml
├── netlify.toml
├── .gitignore
└── README.md
```

### 2.2 Verificar .gitignore

Certifique-se de que o `.gitignore` contém:

```bash
cat .gitignore
```

Deve ter pelo menos:
```
node_modules/
.env
backend/serviceAccountKey.json
*.log
.DS_Store
```

### 2.3 Verificar Firebase Service Account

```bash
# Verificar se o arquivo existe
ls backend/serviceAccountKey.json
```

**⚠️ IMPORTANTE:** Este arquivo NÃO deve estar no Git!

```bash
# Verificar se está ignorado
git status | grep serviceAccountKey.json
```

Se aparecer, adicione ao .gitignore IMEDIATAMENTE!

### 2.4 Fazer Commit Final

```bash
# Ver o que mudou
git status

# Adicionar tudo
git add .

# Commit
git commit -m "Preparar projeto para deploy - Render + Netlify"

# Push para GitHub
git push origin main
```

**✅ Checkpoint:** Seu código está no GitHub atualizado.

---

## 3. Deploy do Backend (Render.com)

### 3.1 Criar Conta no Render

1. Acesse: https://render.com/
2. Clique em **"Get Started for Free"**
3. Escolha **"Sign Up with GitHub"** (recomendado)
4. Autorize o Render a acessar seus repositórios

**✅ Checkpoint:** Você está logado no Render Dashboard.

---

### 3.2 Criar Web Service

1. No Dashboard do Render, clique em **"New +"** (canto superior direito)
2. Selecione **"Web Service"**
3. Conecte seu repositório:
   - Se não aparecer, clique em **"Configure account"**
   - Autorize acesso ao repositório `psf-web`
4. Selecione o repositório **`psf-web`**

**✅ Checkpoint:** Repositório conectado.

---

### 3.3 Configurar o Service

Preencha os campos:

| Campo | Valor |
|-------|-------|
| **Name** | `psf-backend` |
| **Region** | Oregon (US West) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

**Importante:** Não clique em "Create Web Service" ainda!

---

### 3.4 Adicionar Variáveis de Ambiente

Role a página até **"Environment Variables"** e adicione:

#### 3.4.1 Variáveis Básicas

Clique em **"Add Environment Variable"** e adicione uma por uma:

**Variável 1:**
```
Key: NODE_ENV
Value: production
```

**Variável 2:**
```
Key: PORT
Value: 10000
```

#### 3.4.2 Gerar SESSION_SECRET

No seu terminal local:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado (ex: `a1b2c3d4e5f6...`) e adicione:

**Variável 3:**
```
Key: SESSION_SECRET
Value: <cole-o-valor-gerado>
```

#### 3.4.3 Gerar JWT_SECRET

Gere outro valor:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Variável 4:**
```
Key: JWT_SECRET
Value: <cole-o-novo-valor-gerado>
```

#### 3.4.4 Adicionar FIREBASE_SERVICE_ACCOUNT

Esta é a parte mais importante!

1. Abra o arquivo `backend/serviceAccountKey.json` no seu editor
2. **Copie TODO o conteúdo do arquivo** (desde `{` até `}`)
3. Adicione a variável:

**Variável 5:**
```
Key: FIREBASE_SERVICE_ACCOUNT
Value: <cole-todo-o-json-aqui>
```

**⚠️ Atenção:** Cole o JSON inteiro, com todas as chaves e valores. Deve começar com `{` e terminar com `}`.

**Exemplo do conteúdo:**
```json
{
  "type": "service_account",
  "project_id": "seu-projeto",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

**✅ Checkpoint:** Você tem 5 variáveis de ambiente configuradas.

---

### 3.5 Iniciar Deploy

1. Role até o final da página
2. Clique em **"Create Web Service"**
3. Aguarde o deploy (5-10 minutos)

Você verá logs em tempo real:
```
==> Cloning from https://github.com/...
==> Running build command 'npm install'...
==> Starting service with 'npm start'...
==> Your service is live 🎉
```

**✅ Checkpoint:** Backend deployado com sucesso!

---

### 3.6 Copiar URL do Backend

No topo da página, você verá a URL:
```
https://psf-backend.onrender.com
```

**📋 Anote esta URL!** Você vai precisar dela.

---

### 3.7 Testar Backend

Abra no navegador:
```
https://psf-backend.onrender.com
```

Você deve ver a página inicial do seu site (index.html servido pelo Express).

**✅ Checkpoint:** Backend está online e acessível.

---

## 4. Deploy do Frontend (Netlify)

### 4.1 Fazer Login no Netlify

No terminal:

```bash
netlify login
```

Isso abrirá seu navegador. Autorize o acesso.

**✅ Checkpoint:** Logado no Netlify CLI.

---

### 4.2 Navegar até o Frontend

```bash
cd /home/vhrsm/Documentos/github/psf-web/frontend/public
```

---

### 4.3 Deploy

```bash
netlify deploy --prod
```

Responda às perguntas:

**1. "Create & configure a new site"**
```
Resposta: Pressione Enter (escolhe automaticamente)
```

**2. "Team:"**
```
Resposta: Escolha seu time (geralmente aparece apenas um)
Pressione Enter
```

**3. "Site name (leave blank for random name):"**
```
Resposta: psf-frontend
Pressione Enter
```

Se o nome já existir, ele sugerirá outro. Aceite ou digite um diferente.

**4. "Publish directory:"**
```
Resposta: . (ponto - diretório atual)
Pressione Enter
```

Aguarde o upload e processamento (1-2 minutos).

**✅ Checkpoint:** Frontend deployado!

---

### 4.4 Copiar URL do Frontend

No final, você verá:
```
✔ Deployed to production site
https://psf-frontend.netlify.app
```

**📋 Anote esta URL também!**

---

### 4.5 Testar Frontend

Abra no navegador:
```
https://psf-frontend.netlify.app
```

Você deve ver a homepage do site.

**⚠️ IMPORTANTE:** Por enquanto, o frontend ainda NÃO está conectado ao backend. Vamos fazer isso agora!

---

## 5. Conectar Tudo

Agora vamos conectar o frontend ao backend e configurar o CORS.

### 5.1 Atualizar CORS no Backend

1. Acesse o Render Dashboard: https://dashboard.render.com/
2. Clique no serviço **`psf-backend`**
3. Clique na aba **"Environment"**
4. Vamos adicionar uma nova variável para facilitar

**OU** edite o código diretamente:

```bash
cd /home/vhrsm/Documentos/github/psf-web
```

Abra `backend/src/server.js` e localize a configuração do CORS (por volta da linha 20-30):

**Antes:**
```javascript
app.use(cors());
```

**Depois:**
```javascript
const allowedOrigins = [
  'https://psf-frontend.netlify.app',  // Seu frontend Netlify
  'https://seu-site-customizado.netlify.app', // Se você escolheu outro nome
  'http://localhost:3000',  // Para desenvolvimento local
  'http://localhost:5173'   // Vite dev server (se usar)
];

app.use(cors({
  origin: function(origin, callback) {
    // Permitir requisições sem origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
```

**⚠️ Substitua** `https://psf-frontend.netlify.app` pela **sua URL real** do Netlify!

---

### 5.2 Configurar Cookies para Cross-Origin

No mesmo arquivo `backend/src/server.js`, localize a configuração de sessão (por volta da linha 40-50):

**Antes:**
```javascript
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);
```

**Depois:**
```javascript
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',  // true em produção
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // 'none' para cross-origin
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);
```

---

### 5.3 Fazer Commit e Push

```bash
git add backend/src/server.js
git commit -m "Configurar CORS e cookies para produção"
git push origin main
```

**✅ Checkpoint:** Código atualizado no GitHub.

O Render detectará automaticamente a mudança e fará redeploy (2-3 minutos).

---

### 5.4 Atualizar netlify.toml

Abra o arquivo `netlify.toml` na raiz do projeto e atualize com a URL real do Render:

```bash
cd /home/vhrsm/Documentos/github/psf-web
```

Edite `netlify.toml`:

```toml
[build]
  publish = "frontend/public"
  command = "echo 'No build needed'"

[[redirects]]
  from = "/api/*"
  to = "https://psf-backend.onrender.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/admin/*"
  to = "https://psf-backend.onrender.com/admin/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/blog/*"
  to = "https://psf-backend.onrender.com/blog/:splat"
  status = 200
  force = true

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

**⚠️ Substitua** `https://psf-backend.onrender.com` pela **sua URL real** do Render!

Commit e push:

```bash
git add netlify.toml
git commit -m "Configurar redirects do Netlify para backend"
git push origin main
```

---

### 5.5 Redeploy do Frontend

```bash
cd frontend/public
netlify deploy --prod
```

Responda:
- **Publish directory:** `.` (ponto)

Aguarde o deploy.

**✅ Checkpoint:** Frontend e backend conectados!

---

## 6. Configurar Banco de Dados

### 6.1 Acessar Firebase Console

1. Vá para: https://console.firebase.google.com/
2. Selecione seu projeto
3. No menu lateral, clique em **"Firestore Database"**

---

### 6.2 Verificar/Criar Database

Se ainda não criou:

1. Clique em **"Create database"**
2. Escolha **"Start in production mode"**
3. Selecione localização: **`southamerica-east1`** (São Paulo)
4. Clique em **"Enable"**

Aguarde 1-2 minutos.

**✅ Checkpoint:** Firestore ativo.

---

### 6.3 Configurar Regras de Segurança

1. Clique na aba **"Rules"** (Regras)
2. Cole o seguinte código:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Projects: Qualquer um pode ler, apenas admin pode escrever
    match /projects/{projectId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Posts: Todos podem ler posts publicados, admin pode fazer tudo
    match /posts/{postId} {
      allow read: if resource.data.isPublished == true || request.auth != null;
      allow write: if request.auth != null;
    }

    // Applications: Criar sem autenticação, ler/atualizar apenas admin
    match /applications/{applicationId} {
      allow create: if true;  // Permitir envio de applications
      allow read, update, delete: if request.auth != null;  // Apenas admin
    }

    // Users: Apenas admin pode acessar
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Clique em **"Publish"** (Publicar)

**✅ Checkpoint:** Regras de segurança configuradas.

---

## 7. Criar Usuário Admin

### 7.1 Gerar Hash da Senha

No seu terminal local:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('SuaSenhaSegura123', 10))"
```

**Troque** `SuaSenhaSegura123` pela senha que você quer usar.

**📋 Anote o hash gerado** (algo como: `$2a$10$abcd1234...`)

---

### 7.2 Criar Usuário no Firestore

1. No Firebase Console, vá em **"Firestore Database"**
2. Clique em **"Start collection"** (Iniciar coleção)

**Collection ID:**
```
users
```

3. Clique em **"Next"**

**Document ID:**
```
(auto-ID)
```

4. Adicione os campos:

| Field | Type | Value |
|-------|------|-------|
| `email` | string | `admin@problemsolver.org` |
| `password` | string | `$2a$10$...` (cole o hash) |
| `name` | string | `Admin` |
| `role` | string | `admin` |
| `createdAt` | timestamp | (clique no relógio, escolha "now") |

5. Clique em **"Save"**

**✅ Checkpoint:** Usuário admin criado!

---

## 8. Testar o Sistema

### 8.1 Testar Homepage

Acesse:
```
https://psf-frontend.netlify.app
```

Você deve ver a homepage carregando normalmente.

---

### 8.2 Testar Admin Login

1. Acesse:
```
https://psf-backend.onrender.com/admin
```

2. Faça login com:
   - **Email:** `admin@problemsolver.org`
   - **Senha:** (a senha que você usou para gerar o hash)

3. Se der erro de CORS ou sessão:
   - Verifique se o CORS está configurado com a URL correta
   - Limpe os cookies do navegador
   - Tente em uma aba anônima

**✅ Checkpoint:** Login funcionando!

---

### 8.3 Testar Admin Panel

Dentro do admin, teste:

- [ ] Dashboard carrega
- [ ] Posts → Criar novo post
- [ ] Projects → Criar novo projeto
- [ ] Applications → Visualizar (deve estar vazio)

---

### 8.4 Testar Blog Público

1. Crie um post no admin
2. Marque como **Published**
3. Acesse:
```
https://psf-backend.onrender.com/blog
```

Você deve ver o post listado.

---

### 8.5 Testar Formulário de Application

1. Acesse:
```
https://psf-backend.onrender.com/join
```

2. Preencha o formulário completo
3. Clique em **Submit**
4. Verifique no admin se a application apareceu

**✅ Checkpoint:** Sistema completo funcionando!

---

## 9. Troubleshooting

### 🔴 Problema: "Cannot POST /api/applications"

**Causa:** Frontend não está conectado ao backend corretamente.

**Solução:**
1. Verifique o `netlify.toml` com as URLs corretas
2. Redeploy o frontend: `netlify deploy --prod`

---

### 🔴 Problema: "CORS blocked"

**Causa:** URL do Netlify não está no whitelist do CORS.

**Solução:**
1. Abra `backend/src/server.js`
2. Adicione a URL do Netlify no array `allowedOrigins`
3. Commit e push
4. Aguarde redeploy do Render

---

### 🔴 Problema: "Session not persisting" (não consegue fazer login)

**Causa:** Cookies não estão configurados para cross-origin.

**Solução:**
1. Verifique `sameSite: 'none'` e `secure: true` na configuração de sessão
2. Certifique-se que ambos sites usam HTTPS
3. Limpe cookies do navegador

---

### 🔴 Problema: "Firebase connection failed"

**Causa:** `FIREBASE_SERVICE_ACCOUNT` não está correto.

**Solução:**
1. Vá no Render Dashboard → Environment
2. Verifique se o JSON está completo
3. Tente adicionar novamente (copie/cole do arquivo)
4. Redeploy manual: Dashboard → Manual Deploy → Deploy latest commit

---

### 🔴 Problema: Backend demorou muito (30s+)

**Causa:** Render Free tier dorme após 15 min de inatividade.

**Solução (opcional):**
1. Use UptimeRobot para fazer ping a cada 14 minutos
2. Acesse: https://uptimerobot.com/ (grátis)
3. Add New Monitor → HTTP(s)
4. URL: `https://psf-backend.onrender.com`
5. Monitoring Interval: 5 minutes

---

### 🔴 Problema: "Port already in use" localmente

**Solução:**
```bash
# Matar processo na porta 3000
lsof -ti:3000 | xargs kill -9

# Ou use outra porta
PORT=3001 npm start
```

---

## 🎉 Parabéns!

Seu sistema está 100% online e funcionando!

### 📋 URLs Finais:

- **Frontend:** https://psf-frontend.netlify.app
- **Backend/API:** https://psf-backend.onrender.com
- **Admin Panel:** https://psf-backend.onrender.com/admin
- **Blog:** https://psf-backend.onrender.com/blog

### ✅ Checklist Final:

- [x] Backend deployado no Render
- [x] Frontend deployado no Netlify
- [x] Banco de dados Firebase configurado
- [x] CORS configurado
- [x] Regras de segurança do Firestore
- [x] Usuário admin criado
- [x] Login funcionando
- [x] Sistema testado

---

## 🔄 Próximos Passos (Opcional):

1. **Domínio Personalizado**
   - Compre um domínio (.com, .org, .com.br)
   - Configure no Netlify e Render
   - Exemplo: `www.problemsolver.org`

2. **Monitoramento**
   - Configure UptimeRobot para manter backend ativo
   - Configure alertas de downtime

3. **Analytics**
   - Google Analytics no frontend
   - Monitore visitantes e tráfego

4. **Backup**
   - Configure backup automático do Firestore
   - Exporte dados regularmente

5. **SEO**
   - Adicione meta tags
   - Configure sitemap.xml
   - Submeta ao Google Search Console

---

## 📞 Precisa de Ajuda?

- **Render Docs:** https://render.com/docs
- **Netlify Docs:** https://docs.netlify.com/
- **Firebase Docs:** https://firebase.google.com/docs

---

**🚀 Seu site está no ar! Compartilhe com o mundo!** 🌍
