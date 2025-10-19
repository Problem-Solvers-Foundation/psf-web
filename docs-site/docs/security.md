---
sidebar_position: 5
---

# 🔒 Guia de Segurança - Problem Solver Foundation

## ⚠️ NUNCA COMMITAR INFORMAÇÕES SENSÍVEIS

Este repositório é público. **NUNCA** commite os seguintes arquivos:

### Arquivos Proibidos:
- ❌ `backend/.env` (variáveis de ambiente reais)
- ❌ `backend/serviceAccountKey.json` (credenciais Firebase)
- ❌ Qualquer arquivo com tokens, senhas ou chaves de API

### Arquivos Permitidos:
- ✅ `backend/.env.example` (template sem dados reais)
- ✅ Configurações públicas
- ✅ Código-fonte

## 🛡️ Configuração Segura

### 1. Configurar variáveis de ambiente localmente:

```bash
# Copie o template
cp backend/.env.example backend/.env

# Edite com suas credenciais REAIS (NUNCA commitar este arquivo!)
nano backend/.env
```

### 2. Configurar no ambiente de produção:

Para deploy (Vercel, Render, etc.), adicione as variáveis de ambiente no dashboard da plataforma:

**Variáveis obrigatórias:**
- `NODE_ENV=production`
- `PORT=3000` (ou conforme a plataforma)
- `FIREBASE_PROJECT_ID=seu-projeto-id`
- `FIREBASE_CLIENT_EMAIL=seu-email@projeto.iam.gserviceaccount.com`
- `FIREBASE_PRIVATE_KEY=sua-chave-privada-completa`
- `JWT_SECRET=string-aleatoria-super-segura`
- `SESSION_SECRET=outra-string-aleatoria-segura`

### 3. Gerar secrets seguros:

```bash
# Para gerar JWT_SECRET e SESSION_SECRET seguros:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🚨 Se você commitou informações sensíveis acidentalmente:

1. **NUNCA** faça push para o GitHub
2. Remova do histórico:
   ```bash
   git rm --cached backend/.env
   git commit -m "security: remove sensitive file"
   ```
3. Se já fez push, **REGENERE TODAS AS CREDENCIAIS**:
   - Gere novas chaves no Firebase Console
   - Gere novos JWT_SECRET e SESSION_SECRET
   - Atualize em todos os ambientes

## 📋 Checklist antes de tornar o repo público:

- [ ] `.gitignore` está atualizado
- [ ] `backend/.env` NÃO está commitado
- [ ] `backend/serviceAccountKey.json` NÃO está commitado
- [ ] Todos os secrets estão em variáveis de ambiente
- [ ] `.env.example` tem apenas templates (sem dados reais)
- [ ] Histórico do Git está limpo (sem commits com dados sensíveis)

## 🔗 Links Úteis:

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/basics)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
