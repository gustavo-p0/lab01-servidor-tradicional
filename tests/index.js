#!/usr/bin/env node

/**
 * Ponto de Entrada Principal para Testes
 * 
 * Este arquivo facilita a execução dos testes e serve como
 * interface principal para toda a suite de testes
 */

const StressTester = require('./stress-test');
const SecurityTester = require('./security-test');
const TestRunner = require('./run-tests');
const { getConfig, validateConfig } = require('./test-config');

// Re-exporta as classes principais
module.exports = {
    StressTester,
    SecurityTester,
    TestRunner,
    getConfig,
    validateConfig
};

// Função para execução rápida
async function quickTest() {
    console.log('🚀 Teste Rápido - Verificando Funcionamento Básico');
    console.log('='.repeat(50));
    
    try {
        // Teste básico de conectividade
        const tester = new StressTester();
        const result = await tester.makeRequest('/health');
        
        if (result.success) {
            console.log('✅ Servidor respondendo corretamente');
            console.log(`   Status: ${result.status}`);
            console.log(`   Tempo: ${result.responseTime.toFixed(2)}ms`);
        } else {
            console.log('❌ Problema de conectividade');
            console.log(`   Status: ${result.status}`);
            console.log(`   Erro: ${result.error}`);
        }
        
    } catch (error) {
        console.error('❌ Erro durante teste:', error.message);
    }
}

// Função para mostrar ajuda
function showHelp() {
    console.log(`
🚀 Suite de Testes de Estresse e Segurança

📁 Arquivos disponíveis:
   • stress-test.js      - Teste de estresse e performance
   • security-test.js    - Teste de segurança e vulnerabilidades
   • run-tests.js        - Script principal completo
   • example-usage.js    - Exemplos práticos
   • test-config.js      - Configurações

🚀 Como usar:
   • Teste completo:     node tests/run-tests.js
   • Apenas estresse:    node tests/run-tests.js --stress-only
   • Apenas segurança:   node tests/run-tests.js --security-only
   • Exemplos:           node tests/example-usage.js
   • Teste rápido:       node tests/index.js quick
   • Ajuda:              node tests/index.js help

📚 Documentação:
   • README-TESTES.md    - Guia completo
   • RESUMO-IMPLEMENTACAO.md - Resumo técnico

⚠️  IMPORTANTE: Use apenas em ambientes de desenvolvimento/teste!
    `);
}

// Função principal
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        showHelp();
        return;
    }
    
    const command = args[0];
    
    switch (command) {
        case 'quick':
            await quickTest();
            break;
            
        case 'help':
        case '--help':
        case '-h':
            showHelp();
            break;
            
        case 'stress':
            console.log('📊 Executando teste de estresse...');
            const stressTester = new StressTester();
            await stressTester.runFullTest();
            break;
            
        case 'security':
            console.log('🛡️ Executando teste de segurança...');
            const securityTester = new SecurityTester();
            await securityTester.runSecurityTest();
            break;
            
        case 'full':
            console.log('🚀 Executando suite completa...');
            const runner = new TestRunner();
            await runner.runAllTests();
            break;
            
        default:
            console.log(`❌ Comando desconhecido: ${command}`);
            console.log('💡 Use "help" para ver comandos disponíveis');
            break;
    }
}

// Executa se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}
