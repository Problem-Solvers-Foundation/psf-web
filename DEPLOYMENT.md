# 🚀 Guia de Deploy - Problem Solver Foundation

## Opções de Hosting Gratuito (com repositório privado)

Este guia mostra como fazer deploy do projeto em plataformas gratuitas que aceitam repositórios privados.

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

## Opção 2: Cloudflare Pages

✅ **Gratuito com repos privados**
✅ **Performance excelente (CDN global)**
✅ **Builds ilimitados**

### Passo a passo:

1. **Acesse** https://pages.cloudflare.com
2. **Create a project → Connect to Git**
3. **Selecione** seu repositório `psf-web`
4. **Configure:**
   - **Framework preset:** None
   - **Build command:** `cd backend && npm install`
   - **Build output directory:** `backend`
   - **Root directory:** `/`

5. **Adicione variáveis de ambiente** (mesmo que no Render)

6. **Save and Deploy**

**URL final:** `https://problemsolverfoundation.pages.dev`

---

## Opção 3: Vercel (Requer repo público OU plano pago)

⚠️ **Repositórios privados de organizações requerem plano Pro**
✅ **Gratuito se tornar o repo público**

### Se tornar o repo público:

1. **No GitHub:** Settings → Change visibility → Public
2. **Acesse** https://vercel.com
3. **Import Project**
4. **Selecione** o repositório
5. **Configure** (o arquivo `vercel.json` já está configurado)
6. **Deploy**

**URL final:** `https://psf-web.vercel.app` ou `https://problemsolverfoundation.vercel.app`

---

## ⚙️ Arquivos de Configuração Incluídos

O repositório já inclui arquivos de configuração para todas as plataformas:

- ✅ `render.yaml` - Configuração do Render
- ✅ `vercel.json` - Configuração do Vercel
- ✅ `wrangler.toml` - Configuração do Cloudflare Pages
- ✅ `netlify.toml` - Configuração do Netlify (legado)

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
| **Cloudflare** | ✅ Grátis | ~1min | <100ms | ✅ | $0 |
| **Vercel** | ❌ Pago | ~1min | <100ms | ✅ | $0* |
| **Netlify** | ❌ Pago | ~1min | <100ms | ✅ | $0* |

\* Gratuito apenas para repositórios públicos ou contas pessoais

---

## 🎯 Recomendação Final

### Para repositório privado:
👉 **Use Render** - Mais simples e totalmente gratuito

### Para repositório público:
👉 **Use Vercel ou Cloudflare Pages** - Melhor performance

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
