# 📋 Variáveis de Ambiente - Referência Completa

Este documento lista **TODAS** as variáveis de ambiente necessárias para o projeto.

---

## 🔧 Variáveis Obrigatórias

### 1. Servidor
```bash
NODE_ENV=production          # Ambiente (development/production)
PORT=3000                    # Porta do servidor (Render usa 10000)
```

### 2. Firebase (3 opções - escolha UMA)

#### Opção A: Variáveis Individuais (RECOMENDADO)
```bash
FIREBASE_PROJECT_ID=problem-solver-foundation
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@problem-solver-foundation.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAo...
-----END PRIVATE KEY-----
"
```

#### Opção B: JSON Completo
```bash
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

#### Opção C: Arquivo local (apenas desenvolvimento)
Crie o arquivo: `backend/serviceAccountKey.json`

### 3. Autenticação
```bash
JWT_SECRET=string_aleatoria_super_segura_64_caracteres_minimo
SESSION_SECRET=outra_string_aleatoria_super_segura_diferente
```

**Gerar secrets seguros:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📍 Onde configurar cada plataforma

### Desenvolvimento Local
Arquivo: `backend/.env`
```bash
PORT=3000
NODE_ENV=development
FIREBASE_PROJECT_ID=problem-solver-foundation
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@problem-solver-foundation.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
JWT_SECRET=mude_isso_para_algo_super_secreto_123!@#
SESSION_SECRET=mude_isso_para_algo_super_secreto_123!@#
FRONTEND_URL=http://localhost:5173
```

### Render.com
Dashboard → Environment → Environment Variables

```
NODE_ENV = production
PORT = 10000
FIREBASE_PROJECT_ID = problem-solver-foundation
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-fbsvc@problem-solver-foundation.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----
[Cole toda a chave aqui, com quebras de linha literais]
-----END PRIVATE KEY-----
JWT_SECRET = [gere um novo]
SESSION_SECRET = [gere um novo]
```

### Vercel
Dashboard → Settings → Environment Variables

⚠️ **IMPORTANTE:** No Vercel, a private key deve ter `\n` como texto literal:

```
NODE_ENV = production
PORT = 3000
FIREBASE_PROJECT_ID = problem-solver-foundation
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-fbsvc@problem-solver-foundation.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\nMIIEvAIBAD...\n-----END PRIVATE KEY-----\n
JWT_SECRET = [gere um novo]
SESSION_SECRET = [gere um novo]
```

---

## ✅ Checklist de Validação

Antes de fazer deploy, verifique:

- [ ] Todas as variáveis estão configuradas
- [ ] `FIREBASE_PRIVATE_KEY` tem o formato correto (com quebras de linha)
- [ ] `JWT_SECRET` e `SESSION_SECRET` são diferentes
- [ ] `JWT_SECRET` e `SESSION_SECRET` tem pelo menos 32 caracteres
- [ ] `NODE_ENV=production` em produção
- [ ] `PORT` está correto para a plataforma (Render=10000, Vercel=3000)

---

## 🔍 Como verificar se está funcionando

Após o deploy, verifique os logs:

✅ Sucesso:
```
🔧 Modo: PRODUÇÃO (usando variáveis de ambiente individuais)
🔥 Firebase conectado com sucesso!
```

❌ Erro comum:
```
❌ Erro ao conectar Firebase: Cannot parse private key
```
**Solução:** Verifique o formato da `FIREBASE_PRIVATE_KEY`

---

## 📚 Arquivos de referência

- `backend/.env.example` - Template com placeholders
- `backend/.env` - Suas credenciais reais (NUNCA commitar!)
- `SECURITY.md` - Guia de segurança
- `DEPLOYMENT.md` - Guia de deploy
