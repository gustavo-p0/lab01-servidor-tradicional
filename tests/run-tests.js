#!/usr/bin/env node

const StressTester = require('./stress-test');
const SecurityTester = require('./security-test');
const { getConfig, validateConfig } = require('./test-config');

/**
 * Script Principal para Execução de Testes
 * 
 * Executa todos os testes de estresse e segurança
 * com configurações baseadas no ambiente
 */

class TestRunner {
    constructor() {
        this.config = getConfig();
        this.results = {
            stress: null,
            security: null,
            startTime: 0,
            endTime: 0
        };
    }

    async runAllTests() {
        console.log('🚀 INICIANDO SUITE COMPLETA DE TESTES');
        console.log('='.repeat(60));
        console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Servidor: ${this.config.server.baseURL}`);
        console.log(`⏱️  Timeout: ${this.config.server.timeout}ms`);
        console.log('='.repeat(60));
        
        this.results.startTime = Date.now();
        
        try {
            // Valida configurações
            const configErrors = validateConfig();
            if (configErrors.length > 0) {
                console.error('❌ Erros de configuração:');
                configErrors.forEach(error => console.error(`   - ${error}`));
                return;
            }
            
            // Teste 1: Teste de Estresse
            console.log('\n📊 EXECUTANDO TESTE DE ESTRESSE...');
            const stressTester = new StressTester(this.config.server.baseURL);
            await stressTester.runFullTest();
            this.results.stress = stressTester.results;
            
            // Pequena pausa entre testes
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Teste 2: Teste de Segurança
            console.log('\n🛡️ EXECUTANDO TESTE DE SEGURANÇA...');
            const securityTester = new SecurityTester(this.config.server.baseURL);
            await securityTester.runSecurityTest();
            this.results.security = securityTester.results;
            
        } catch (error) {
            console.error('❌ Erro durante execução dos testes:', error.message);
        }
        
        this.results.endTime = Date.now();
        this.generateFinalReport();
    }

    generateFinalReport() {
        const totalTime = this.results.endTime - this.results.startTime;
        
        console.log('\n' + '='.repeat(80));
        console.log('🎯 RELATÓRIO FINAL COMPLETO');
        console.log('='.repeat(80));
        
        console.log(`⏱️  Tempo total de execução: ${(totalTime / 1000).toFixed(2)}s`);
        console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
        console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        
        // Resumo do teste de estresse
        if (this.results.stress) {
            console.log('\n📊 RESUMO DO TESTE DE ESTRESSE:');
            console.log(`   • Total de requests: ${this.results.stress.totalRequests}`);
            console.log(`   • Sucessos: ${this.results.stress.successfulRequests}`);
            console.log(`   • Falhas: ${this.results.stress.failedRequests}`);
            console.log(`   • Rate Limited: ${this.results.stress.rateLimitedRequests}`);
            console.log(`   • Pacotes perdidos: ${this.results.stress.lostPackets}`);
            console.log(`   • Tempo médio de resposta: ${this.results.stress.averageResponseTime.toFixed(2)}ms`);
        }
        
        // Resumo do teste de segurança
        if (this.results.security) {
            console.log('\n🛡️ RESUMO DO TESTE DE SEGURANÇA:');
            console.log(`   • Ataques bloqueados: ${this.results.security.blockedAttacks}`);
            console.log(`   • Ataques bem-sucedidos: ${this.results.security.successfulAttacks}`);
            console.log(`   • Vulnerabilidades encontradas: ${this.results.security.vulnerabilities.length}`);
        }
        
        // Análise geral
        console.log('\n📋 ANÁLISE GERAL:');
        
        let score = 100;
        let issues = [];
        
        // Verifica rate limiting
        if (this.results.stress && this.results.stress.rateLimitedRequests > 0) {
            console.log('   ✅ Rate limiting funcionando corretamente');
        } else {
            console.log('   ⚠️ Rate limiting pode não estar funcionando');
            score -= 20;
            issues.push('Rate limiting não detectado');
        }
        
        // Verifica pacotes perdidos
        if (this.results.stress && this.results.stress.lostPackets > 0) {
            console.log(`   ⚠️ ${this.results.stress.lostPackets} pacotes perdidos`);
            score -= Math.min(30, this.results.stress.lostPackets * 5);
            issues.push(`${this.results.stress.lostPackets} pacotes perdidos`);
        } else {
            console.log('   ✅ Nenhum pacote perdido');
        }
        
        // Verifica vulnerabilidades de segurança
        if (this.results.security && this.results.security.vulnerabilities.length > 0) {
            console.log(`   🚨 ${this.results.security.vulnerabilities.length} vulnerabilidades encontradas`);
            score -= this.results.security.vulnerabilities.length * 15;
            issues.push(`${this.results.security.vulnerabilities.length} vulnerabilidades de segurança`);
        } else {
            console.log('   ✅ Nenhuma vulnerabilidade crítica encontrada');
        }
        
        // Verifica performance
        if (this.results.stress && this.results.stress.averageResponseTime > 1000) {
            console.log(`   ⚠️ Tempo de resposta alto: ${this.results.stress.averageResponseTime.toFixed(2)}ms`);
            score -= 10;
            issues.push('Tempo de resposta alto');
        } else {
            console.log('   ✅ Performance adequada');
        }
        
        // Score final
        score = Math.max(0, score);
        console.log(`\n🏆 SCORE FINAL: ${score}/100`);
        
        if (score >= 90) {
            console.log('   🎉 EXCELENTE! Sistema muito bem configurado');
        } else if (score >= 70) {
            console.log('   👍 BOM! Algumas melhorias necessárias');
        } else if (score >= 50) {
            console.log('   ⚠️ ATENÇÃO! Várias melhorias necessárias');
        } else {
            console.log('   🚨 CRÍTICO! Muitas melhorias necessárias');
        }
        
        // Recomendações
        if (issues.length > 0) {
            console.log('\n🔧 RECOMENDAÇÕES PRIORITÁRIAS:');
            issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }
        
        console.log('\n📚 PRÓXIMOS PASSOS:');
        console.log('   1. Revisar logs do servidor durante os testes');
        console.log('   2. Ajustar configurações de rate limiting se necessário');
        console.log('   3. Implementar correções de segurança identificadas');
        console.log('   4. Executar testes novamente para verificar correções');
        
        console.log('='.repeat(80));
    }
}

// Função principal
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🚀 Teste de Estresse e Segurança - Servidor Tradicional

Uso: node run-tests.js [opções]

Opções:
  --help, -h          Mostra esta ajuda
  --stress-only       Executa apenas teste de estresse
  --security-only     Executa apenas teste de segurança
  --config <arquivo>  Arquivo de configuração personalizado
  --env <ambiente>    Ambiente (development, test, production)

Variáveis de ambiente:
  NODE_ENV            Ambiente de execução
  TEST_BASE_URL       URL base do servidor
  TEST_TIMEOUT        Timeout das requisições
  TEST_LOG_LEVEL      Nível de logging

Exemplos:
  node run-tests.js
  node run-tests.js --stress-only
  node run-tests.js --env production
  TEST_BASE_URL=http://localhost:3001 node run-tests.js
        `);
        return;
    }
    
    const runner = new TestRunner();
    
    if (args.includes('--stress-only')) {
        console.log('📊 Executando apenas teste de estresse...');
        const stressTester = new StressTester(runner.config.server.baseURL);
        await stressTester.runFullTest();
    } else if (args.includes('--security-only')) {
        console.log('🛡️ Executando apenas teste de segurança...');
        const securityTester = new SecurityTester(runner.config.server.baseURL);
        await securityTester.runSecurityTest();
    } else {
        await runner.runAllTests();
    }
}

// Executa se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TestRunner;
