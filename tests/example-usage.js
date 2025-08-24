#!/usr/bin/env node

/**
 * Exemplos de Uso dos Testes de Estresse e Segurança
 * 
 * Demonstra diferentes formas de executar e personalizar os testes
 */

const StressTester = require('./stress-test');
const SecurityTester = require('./security-test');

// Exemplo 1: Teste básico de estresse
async function exemploTesteEstresse() {
    console.log('📊 Exemplo 1: Teste Básico de Estresse');
    console.log('='.repeat(50));
    
    const tester = new StressTester('http://localhost:3000');
    
    // Testa apenas rate limiting
    await tester.testRateLimiting();
    
    console.log('\n✅ Teste de estresse concluído!');
}

// Exemplo 2: Teste de segurança personalizado
async function exemploTesteSeguranca() {
    console.log('\n🛡️ Exemplo 2: Teste de Segurança Personalizado');
    console.log('='.repeat(50));
    
    const tester = new SecurityTester('http://localhost:3000');
    
    // Testa apenas força bruta
    await tester.testBruteForce();
    
    // Testa apenas bypass de autenticação
    await tester.testAuthenticationBypass();
    
    console.log('\n✅ Teste de segurança concluído!');
}

// Exemplo 3: Teste com configurações personalizadas
async function exemploTestePersonalizado() {
    console.log('\n⚙️ Exemplo 3: Teste com Configurações Personalizadas');
    console.log('='.repeat(50));
    
    // Cria tester com configurações específicas
    const tester = new StressTester('http://localhost:3000');
    
    // Testa performance com menos iterações
    console.log('📈 Testando performance com 50 iterações...');
    const testEndpoints = ['/health', '/api-docs'];
    const iterations = 50;
    
    for (const endpoint of testEndpoints) {
        console.log(`   Testando ${endpoint}...`);
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await tester.makeRequest(endpoint);
            const end = performance.now();
            times.push(end - start);
            
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        console.log(`     Média: ${avg.toFixed(2)}ms`);
    }
    
    console.log('\n✅ Teste personalizado concluído!');
}

// Exemplo 4: Monitoramento em tempo real
async function exemploMonitoramento() {
    console.log('\n📊 Exemplo 4: Monitoramento em Tempo Real');
    console.log('='.repeat(50));
    
    const tester = new StressTester('http://localhost:3000');
    
    console.log('🚦 Monitorando rate limiting em tempo real...');
    
    // Faz requests e monitora resultados
    const results = [];
    const totalRequests = 30;
    
    for (let i = 0; i < totalRequests; i++) {
        const result = await tester.makeRequest('/health');
        results.push(result);
        
        // Mostra progresso a cada 5 requests
        if ((i + 1) % 5 === 0) {
            const successCount = results.filter(r => r.success).length;
            const rateLimitedCount = results.filter(r => r.status === 429).length;
            const failedCount = results.filter(r => !r.success && r.status !== 429).length;
            
            console.log(`   ${i + 1}/${totalRequests}: ✅${successCount} 🚦${rateLimitedCount} ❌${failedCount}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Análise final
    const finalSuccess = results.filter(r => r.success).length;
    const finalRateLimited = results.filter(r => r.status === 429).length;
    const finalFailed = results.filter(r => !r.success && r.status !== 429).length;
    
    console.log(`\n📊 Resultado Final:`);
    console.log(`   ✅ Sucessos: ${finalSuccess}`);
    console.log(`   🚦 Rate Limited: ${finalRateLimited}`);
    console.log(`   ❌ Falhas: ${finalFailed}`);
    
    console.log('\n✅ Monitoramento concluído!');
}

// Exemplo 5: Teste de endpoints específicos
async function exemploEndpointsEspecificos() {
    console.log('\n🎯 Exemplo 5: Teste de Endpoints Específicos');
    console.log('='.repeat(50));
    
    const tester = new StressTester('http://localhost:3000');
    
    const endpoints = [
        { path: '/health', method: 'GET', description: 'Health Check' },
        { path: '/api-docs', method: 'GET', description: 'Swagger Docs' },
        { path: '/api/tasks', method: 'GET', description: 'Lista de Tarefas' }
    ];
    
    for (const endpoint of endpoints) {
        console.log(`🔍 Testando: ${endpoint.description} (${endpoint.method} ${endpoint.path})`);
        
        const startTime = performance.now();
        const result = await tester.makeRequest(endpoint.path, endpoint.method);
        const endTime = performance.now();
        
        if (result.success) {
            console.log(`   ✅ Status: ${result.status}, Tempo: ${(endTime - startTime).toFixed(2)}ms`);
        } else {
            console.log(`   ❌ Status: ${result.status}, Erro: ${result.error}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n✅ Teste de endpoints concluído!');
}

// Função principal que executa todos os exemplos
async function executarExemplos() {
    console.log('🚀 EXEMPLOS DE USO DOS TESTES');
    console.log('='.repeat(60));
    console.log('Este script demonstra diferentes formas de usar os testes');
    console.log('Certifique-se de que o servidor está rodando em http://localhost:3000');
    console.log('='.repeat(60));
    
    try {
        await exemploTesteEstresse();
        await exemploTesteSeguranca();
        await exemploTestePersonalizado();
        await exemploMonitoramento();
        await exemploEndpointsEspecificos();
        
        console.log('\n🎉 Todos os exemplos foram executados com sucesso!');
        console.log('\n💡 Dicas:');
        console.log('   • Use --help para ver opções do script principal');
        console.log('   • Configure variáveis de ambiente para personalizar');
        console.log('   • Monitore os logs do servidor durante os testes');
        
    } catch (error) {
        console.error('\n❌ Erro durante execução dos exemplos:', error.message);
        console.log('\n🔧 Verifique se:');
        console.log('   • O servidor está rodando');
        console.log('   • A porta 3000 está disponível');
        console.log('   • As dependências estão instaladas (npm install axios)');
    }
}

// Executa se chamado diretamente
if (require.main === module) {
    executarExemplos().catch(console.error);
}

module.exports = {
    exemploTesteEstresse,
    exemploTesteSeguranca,
    exemploTestePersonalizado,
    exemploMonitoramento,
    exemploEndpointsEspecificos
};
