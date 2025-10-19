# 🚀 Guia de Deploy - Problem Solver Foundation

## 📖 O que é Deploy / Hosting?

**Deploy** significa colocar sua aplicação na internet para que qualquer pessoa possa acessar 24/7.

### Como funciona neste projeto:

Este é um projeto **fullstack unificado** onde:
- ✅ O **backend** (Node.js/Express) serve as páginas HTML usando EJS (Server-Side Rendering)
- ✅ O **frontend** (HTML/CSS/JS) é renderizado pelo backend
- ✅ **Tudo roda junto** em um único servidor

**Render e Vercel** hospedam **toda a aplicação** (backend + frontend) e geram uma URL pública.

### Por que usar Render E Vercel?

Você pode fazer deploy nas **duas plataformas simultaneamente** para ter:
- 🔄 **Redundância** - Se uma cair, a outra continua funcionando
- 🌍 **Duas URLs diferentes** - Pode escolher qual usar
- 🧪 **Ambientes de teste** - Uma para produção, outra para testes

**Exemplo:**
- Render: `https://problemsolverfoundation.onrender.com` (produção)
- Vercel: `https://psf-web.vercel.app` (backup/teste)

---

## Opções de Hosting Gratuito

---

## Opção 1: Render (Recomendado)

✅ **Totalmente gratuito com repos privados**
✅ **Mais simples de configurar**
✅ **Backend + Frontend juntos**

### Passo a passo:

1. **Acesse** https://render.com
2. **Faça login** com sua conta GitHub
3. **New → Web Service**
4. **Conecte seu repositório** `psf-web`
5. **Configure:**
   - **Name:** `problemsolverfoundation`
   - **Environment:** Node
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Plan:** Free

6. **Adicione variáveis de ambiente** (Environment tab):
   ```
   NODE_ENV=production
   PORT=10000
   FIREBASE_PROJECT_ID=seu-projeto-firebase
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nSua chave aqui\n-----END PRIVATE KEY-----\n
   JWT_SECRET=string-aleatoria-super-segura
   SESSION_SECRET=outra-string-aleatoria-segura
   ```

7. **Deploy!**

**URL final:** `https://problemsolverfoundation.onrender.com`

---

## Opção 2: Vercel (Requer repo público OU plano pago)

⚠️ **Repositórios privados de organizações requerem plano Pro**
✅ **Gratuito se tornar o repo público**

### Passo a passo:

1. **Torne o repo público** (GitHub → Settings → Change visibility → Public)
2. **Acesse** https://vercel.com e faça login com GitHub
3. **Import Project** e selecione o repositório
4. **Configure:**
   - **Framework Preset:** Other
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Output Directory:** (deixe vazio)
   - **Install Command:** `npm install`

5. **Adicione variáveis de ambiente:**
   ```
   NODE_ENV=production
   PORT=3000
   FIREBASE_PROJECT_ID=problem-solver-foundation
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@problem-solver-foundation.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
[Cole a chave privada completa aqui, com quebras de linha literais]
-----END PRIVATE KEY-----
   JWT_SECRET=[gere com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]
   SESSION_SECRET=[gere outro secret]
   ```

6. **Deploy!**

**URL final:** `https://psf-web.vercel.app` ou `https://problemsolverfoundation.vercel.app`

---

## ⚙️ Arquivos de Configuração Incluídos

O repositório já inclui arquivos de configuração:

- ✅ `render.yaml` - Configuração do Render
- ✅ `vercel.json` - Configuração do Vercel

---

## 🔑 Gerando Secrets Seguros

Para gerar valores seguros para `JWT_SECRET` e `SESSION_SECRET`:

```bash
# Gera uma string aleatória segura (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Execute o comando duas vezes e use os resultados para cada variável.

---

## 🔐 Configurando Firebase

1. **Firebase Console:** https://console.firebase.google.com
2. **Project Settings → Service Accounts**
3. **Generate new private key**
4. **Copie as credenciais:**

   ```json
   {
     "project_id": "seu-projeto-id",
     "client_email": "firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   }
   ```

5. **No dashboard da plataforma de deploy:**
   - `FIREBASE_PROJECT_ID` = `project_id`
   - `FIREBASE_CLIENT_EMAIL` = `client_email`
   - `FIREBASE_PRIVATE_KEY` = `private_key` (com as quebras de linha `\n`)

---

## 📊 Comparação de Plataformas

| Plataforma | Repo Privado | Build Time | Cold Start | CDN | Preço |
|------------|--------------|------------|------------|-----|-------|
| **Render** | ✅ Grátis | ~2min | ~30s | ❌ | $0 |
| **Vercel** | ❌ Pago | ~1min | <100ms | ✅ | $0* |

\* Gratuito apenas para repositórios públicos

---

## 🎯 Recomendação Final

### Para repositório privado:
👉 **Use Render** - Mais simples e totalmente gratuito

### Para repositório público:
👉 **Use Vercel** - Melhor performance e developer experience

---

## 🆘 Troubleshooting

### Erro: "Build failed"
- Verifique se o comando de build está correto
- Confirme que `package.json` existe em `backend/`
- Verifique os logs de build

### Erro: "Application error"
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme que `FIREBASE_PRIVATE_KEY` tem as quebras de linha (`\n`)
- Verifique os logs da aplicação

### Erro: "Cannot connect to database"
- Verifique as credenciais do Firebase
- Confirme que o Firestore está habilitado no Firebase Console
- Verifique as regras de segurança do Firestore

---

## 📚 Links Úteis

- [Render Docs](https://render.com/docs)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Vercel Docs](https://vercel.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)

---

**🎉 Boa sorte com o deploy!**

Para dúvidas, consulte o [SECURITY.md](SECURITY.md) ou abra uma issue no repositório.
