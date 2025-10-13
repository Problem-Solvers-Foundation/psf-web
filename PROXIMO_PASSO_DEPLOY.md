# 🎯 PRÓXIMOS PASSOS - DEPLOY PSF WEB

## ✅ O QUE JÁ FOI FEITO

1. ✅ Firebase/Firestore configurado e funcionando
2. ✅ Backend deployado no Render: https://psf-backend-r6ut.onrender.com
3. ✅ 3 usuários admin criados no banco
4. ✅ Código atualizado com configurações de produção (CORS e Session)
5. ✅ Push para GitHub realizado

---

## 📋 O QUE FAZER AGORA (EM ORDEM)

### PASSO 1: Aguardar Novo Deploy no Render

O Render detectou automaticamente o novo código e está fazendo redeploy.

**Como verificar:**

1. Acesse: https://dashboard.render.com/
2. Clique no seu serviço `psf-backend`
3. Na aba "Events" ou "Logs", veja se aparece:
   ```
   Deploying...
   Build successful
   Starting server...
   ```
4. Aguarde até o status ficar **"Live"** (bolinha verde)
5. **Tempo estimado:** 3-5 minutos

---

### PASSO 2: Testar o Backend

Quando o deploy terminar:

1. **Acesse no navegador:** https://psf-backend-r6ut.onrender.com

2. **Primeira vez pode demorar 30-60 segundos** (cold start do plano free)

3. **Você deve ver:** A homepage do PSF carregando

---

### PASSO 3: Testar Login do Admin

1. **Acesse:** https://psf-backend-r6ut.onrender.com/admin/login

2. **Faça login com:**
   - **Email:** `admin@psf.org`
   - **Senha:** `admin123`

3. **Se funcionar:** Você verá o dashboard admin! 🎉

4. **Se não funcionar:**
   - Verifique se está usando HTTPS (não HTTP)
   - Tente em modo anônimo do navegador
   - Limpe cookies do navegador
   - Verifique logs no Render

---

### PASSO 4: Deploy do Frontend no Netlify (OPCIONAL)

Como você quer frontend separado, vamos fazer deploy no Netlify.

#### Opção A: Deploy Manual (Mais Rápido)

1. **Acesse:** https://app.netlify.com/
2. **Login** com GitHub
3. **Clique em:** "Add new site" → "Deploy manually"
4. **Arraste a pasta:** `/home/vhrsm/Documentos/github/psf-web/frontend/assets`
5. **Aguarde o upload**
6. **Copie a URL** gerada (tipo: `https://seu-site.netlify.app`)

#### Opção B: Deploy via Git (Auto-Deploy)

1. **Acesse:** https://app.netlify.com/
2. **Clique em:** "Add new site" → "Import an existing project"
3. **Conectar com GitHub** → Selecione `psf-web`
4. **Configurações:**
   - **Branch:** `main`
   - **Base directory:** `frontend/assets`
   - **Build command:** (deixe vazio)
   - **Publish directory:** `.`
5. **Clique:** "Deploy site"
6. **Aguarde:** 1-2 minutos

---

### PASSO 5: Atualizar CORS com URL do Netlify

Quando tiver a URL do Netlify (ex: `https://psf-frontend.netlify.app`):

1. **Edite:** `backend/src/server.js`

2. **Adicione a URL do Netlify:**
   ```javascript
   const allowedOrigins = [
     'https://psf-backend-r6ut.onrender.com',
     'https://psf-frontend.netlify.app',  // ← ADICIONE ESTA LINHA com sua URL real
     'http://localhost:3000',
     'http://localhost:5173'
   ];
   ```

3. **Commit e Push:**
   ```bash
   git add backend/src/server.js
   git commit -m "add: Netlify URL to CORS"
   git push
   ```

4. **Aguarde:** Render fazer redeploy (2-3 minutos)

---

### PASSO 6: Evitar Cold Start (Recomendado)

O plano free do Render dorme após 15 minutos. Para mantê-lo sempre ativo:

**Use UptimeRobot (Gratuito):**

1. **Acesse:** https://uptimerobot.com/
2. **Crie conta grátis**
3. **Adicione monitor:**
   - **Monitor Type:** HTTP(s)
   - **URL:** `https://psf-backend-r6ut.onrender.com`
   - **Monitoring Interval:** 5 minutes
4. **Salve**

Pronto! Seu backend nunca mais vai dormir! 😴➡️😃

---

## 🎯 CHECKLIST FINAL

Use este checklist para conferir se tudo está OK:

- [ ] Backend no ar (https://psf-backend-r6ut.onrender.com)
- [ ] Homepage carrega corretamente
- [ ] Login admin funciona (https://psf-backend-r6ut.onrender.com/admin/login)
- [ ] Dashboard admin acessível
- [ ] (Opcional) Frontend no Netlify deployado
- [ ] (Opcional) URL do Netlify adicionada ao CORS
- [ ] (Opcional) UptimeRobot configurado

---

## 🔍 TROUBLESHOOTING

### Problema: Backend retorna erro 502

**Solução:** O serviço está iniciando (cold start). Aguarde 30-60 segundos e recarregue.

### Problema: Login não funciona (redirect infinito)

**Solução:**
1. Limpe cookies do navegador
2. Tente em modo anônimo
3. Verifique se está usando HTTPS (não HTTP)
4. Verifique logs no Render Dashboard

### Problema: "Invalid email or password"

**Solução:**
1. Confirme que está usando: `admin@psf.org` / `admin123`
2. Verifique se o usuário existe no Firestore:
   - Firebase Console → Firestore → Collection `users`
   - Deve ter documento com email `admin@psf.org`

### Problema: Render mostra "Build failed"

**Solução:**
1. Veja os logs no Render Dashboard
2. Verifique se todas as variáveis de ambiente estão corretas:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `SESSION_SECRET` (gerado)
   - `FIREBASE_SERVICE_ACCOUNT` (JSON completo)

---

## 📞 SUPORTE

Se precisar de ajuda:

1. **Render Docs:** https://render.com/docs
2. **Firebase Docs:** https://firebase.google.com/docs
3. **Netlify Docs:** https://docs.netlify.com

---

## 🎉 PARABÉNS!

Você chegou até aqui! Seu sistema está quase 100% funcional em produção.

**URLs Importantes:**
- **Backend/API:** https://psf-backend-r6ut.onrender.com
- **Admin Panel:** https://psf-backend-r6ut.onrender.com/admin/login
- **Frontend:** (após deploy no Netlify)

**Credenciais Admin:**
- **Email:** admin@psf.org
- **Senha:** admin123

**⚠️ IMPORTANTE:** Depois de testar, **mude a senha do admin** para uma senha segura!

---

**Próximo passo:** Aguarde o deploy no Render terminar e teste o login! 🚀
