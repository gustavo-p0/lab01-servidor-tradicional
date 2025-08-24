#!/bin/bash

echo "🚀 Instalando Testes de Estresse e Segurança"
echo "=============================================="

# Verifica se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js primeiro."
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verifica se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Instale o npm primeiro."
    exit 1
fi

echo "✅ npm encontrado: $(npm --version)"

# Instala dependências
echo "📦 Instalando dependências..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas com sucesso"
else
    echo "❌ Falha na instalação das dependências"
    exit 1
fi

# Verifica se o servidor está rodando
echo "🔍 Verificando se o servidor está rodando..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Servidor está rodando em http://localhost:3000"
else
    echo "⚠️  Servidor não está rodando em http://localhost:3000"
    echo "   Execute 'npm start' na pasta raiz para iniciar o servidor"
fi

# Cria diretório para relatórios
mkdir -p ../test-reports
echo "📁 Diretório de relatórios criado: ../test-reports/"

# Verifica permissões de execução
chmod +x *.js
chmod +x *.sh
echo "🔐 Permissões de execução configuradas"

echo ""
echo "🎉 Instalação concluída com sucesso!"
echo ""
echo "📚 Como usar (da pasta tests/):"
echo "   • Teste completo: npm test"
echo "   • Apenas estresse: npm run test:stress"
echo "   • Apenas segurança: npm run test:security"
echo "   • Teste rápido: npm run test:quick"
echo "   • Exemplos: npm run test:examples"
echo "   • Ajuda: npm run help"
echo ""
echo "📚 Como usar (comandos diretos):"
echo "   • Teste completo: node run-tests.js"
echo "   • Apenas estresse: node run-tests.js --stress-only"
echo "   • Apenas segurança: node run-tests.js --security-only"
echo "   • Exemplos: node example-usage.js"
echo "   • Interface principal: node index.js help"
echo ""
echo "⚠️  IMPORTANTE: Use apenas em ambientes de desenvolvimento/teste!"
echo "   NUNCA execute em servidores de produção sem autorização."
echo ""
echo "🔗 Documentação completa: README-TESTES.md"
