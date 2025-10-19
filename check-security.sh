#!/bin/bash

# Script de verificação de segurança
# Verifica se arquivos sensíveis foram commitados acidentalmente

echo "🔒 Verificando segurança do repositório..."
echo ""

FOUND_ISSUES=0

# Verificar se .env está no index
if git ls-files | grep -q "\.env$"; then
    echo "❌ ERRO: Arquivo .env está sendo rastreado pelo Git!"
    echo "   Execute: git rm --cached backend/.env"
    FOUND_ISSUES=1
fi

# Verificar se serviceAccountKey.json está no index
if git ls-files | grep -q "serviceAccountKey.json"; then
    echo "❌ ERRO: serviceAccountKey.json está sendo rastreado pelo Git!"
    echo "   Execute: git rm --cached backend/serviceAccountKey.json"
    FOUND_ISSUES=1
fi

# Verificar se há secrets no código
if git grep -i "sk_live_" -- "*.js" "*.json" 2>/dev/null | grep -v node_modules; then
    echo "⚠️  AVISO: Possível API key encontrada no código!"
    FOUND_ISSUES=1
fi

# Verificar se .gitignore existe
if [ ! -f .gitignore ]; then
    echo "❌ ERRO: .gitignore não encontrado!"
    FOUND_ISSUES=1
fi

# Verificar se .env.example existe
if [ ! -f backend/.env.example ]; then
    echo "⚠️  AVISO: backend/.env.example não encontrado!"
fi

if [ $FOUND_ISSUES -eq 0 ]; then
    echo "✅ Nenhum problema de segurança encontrado!"
    echo ""
    echo "Checklist final antes de tornar público:"
    echo "  [ ] Revisei todo o código"
    echo "  [ ] Regenerei todas as credenciais sensíveis"
    echo "  [ ] Configurei variáveis de ambiente no servidor de produção"
    echo "  [ ] Testei a aplicação com as novas credenciais"
else
    echo ""
    echo "❌ Encontrados $FOUND_ISSUES problema(s) de segurança!"
    echo "   Corrija antes de tornar o repositório público."
    exit 1
fi
