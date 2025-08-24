const axios = require('axios');
const { performance } = require('perf_hooks');

/**
 * Teste de Estresse para Servidor Tradicional
 * 
 * Testa:
 * - Rate limiting por usuário autenticado/não autenticado
 * - Performance sob carga
 * - Detecção de pacotes perdidos
 * - Vulnerabilidades de segurança
 * - Comportamento sob ataques de força bruta
 */

class StressTester {
    constructor(baseURL = 'http://localhost:3000') {
        this.baseURL = baseURL;
        this.results = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            rateLimitedRequests: 0,
            averageResponseTime: 0,
            totalResponseTime: 0,
            startTime: 0,
            endTime: 0,
            lostPackets: 0,
            securityIssues: []
        };
        
        this.authToken = null;
        this.userId = null;
    }

    async authenticate() {
        try {
            console.log('🔐 Autenticando usuário...');
            
            // Primeiro registra um usuário
            const registerResponse = await axios.post(`${this.baseURL}/api/auth/register`, {
                username: `testuser_${Date.now()}`,
                email: `test_${Date.now()}@example.com`,
                password: 'TestPassword123!'
            });
            
            if (registerResponse.data.success) {
                this.userId = registerResponse.data.user.id;
                console.log(`✅ Usuário registrado: ${this.userId}`);
            }
            
            // Faz login
            const loginResponse = await axios.post(`${this.baseURL}/api/auth/login`, {
                username: `testuser_${Date.now()}`,
                password: 'TestPassword123!'
            });
            
            if (loginResponse.data.success) {
                this.authToken = loginResponse.data.token;
                console.log('✅ Login realizado com sucesso');
            }
            
        } catch (error) {
            console.log('⚠️ Falha na autenticação, continuando como usuário não autenticado');
        }
    }

    async makeRequest(endpoint, method = 'GET', data = null, headers = {}) {
        const startTime = performance.now();
        
        try {
            if (this.authToken) {
                headers.Authorization = `Bearer ${this.authToken}`;
            }
            
            const response = await axios({
                method,
                url: `${this.baseURL}${endpoint}`,
                data,
                headers,
                timeout: 5000
            });
            
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            this.results.totalResponseTime += responseTime;
            this.results.successfulRequests++;
            
            return {
                success: true,
                status: response.status,
                responseTime,
                data: response.data
            };
            
        } catch (error) {
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            this.results.totalResponseTime += responseTime;
            
            // Conta rate limited separadamente
            if (error.response?.status === 429) {
                this.results.rateLimitedRequests++;
                // Rate limited não é considerado "falha real"
            } else {
                // Só conta como falha se não foi rate limiting
                this.results.failedRequests++;
            }
            
            return {
                success: false,
                status: error.response?.status || 0,
                responseTime,
                error: error.message
            };
        } finally {
            this.results.totalRequests++;
        }
    }

    async testRateLimiting() {
        console.log('\n🚦 Testando Rate Limiting...');
        
        // Teste 1: Rate limiting para usuários não autenticados
        console.log('📊 Testando rate limit público (100 req/15min)...');
        const publicRequests = [];
        
        // Faz exatamente o limite + alguns extras para testar
        const testRequests = 105; // 100 (limite) + 5 extras
        
        for (let i = 0; i < testRequests; i++) {
            const result = await this.makeRequest('/health');
            publicRequests.push(result);
            
            if (i % 20 === 0) {
                console.log(`   ${i + 1}/${testRequests} requests feitas`);
            }
            
            // Pequena pausa para não sobrecarregar
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        const rateLimitedCount = publicRequests.filter(r => r.status === 429).length;
        const successCount = publicRequests.filter(r => r.success).length;
        const failedCount = publicRequests.filter(r => !r.success && r.status !== 429).length;
        
        console.log(`   ✅ Sucessos: ${successCount}/${testRequests}`);
        console.log(`   🚦 Rate Limited: ${rateLimitedCount}/${testRequests}`);
        console.log(`   ❌ Outras falhas: ${failedCount}/${testRequests}`);
        
        // Teste 2: Rate limiting para autenticação
        console.log('🔐 Testando rate limit de autenticação (5 req/15min)...');
        const authRequests = [];
        
        for (let i = 0; i < 10; i++) {
            const result = await this.makeRequest('/api/auth/login', 'POST', {
                username: 'invalid_user',
                password: 'wrong_password'
            });
            authRequests.push(result);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const authRateLimited = authRequests.filter(r => r.status === 429).length;
        const authSuccess = authRequests.filter(r => r.success).length;
        const authFailed = authRequests.filter(r => !r.success && r.status !== 429).length;
        
        console.log(`   ✅ Sucessos: ${authSuccess}/10`);
        console.log(`   🚦 Rate Limited: ${authRateLimited}/10`);
        console.log(`   ❌ Outras falhas: ${authFailed}/10`);
    }

    async testConcurrentRequests() {
        console.log('\n⚡ Testando Requisições Concorrentes...');
        
        const concurrentCount = 50;
        const promises = [];
        
        for (let i = 0; i < concurrentCount; i++) {
            promises.push(this.makeRequest('/health'));
        }
        
        const startTime = performance.now();
        const results = await Promise.allSettled(promises);
        const endTime = performance.now();
        
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.filter(r => r.status === 'rejected' || !r.value.success).length;
        const rateLimited = results.filter(r => r.status === 'fulfilled' && r.value.status === 429).length;
        
        console.log(`   Concorrentes: ${concurrentCount}`);
        console.log(`   Sucesso: ${successful}`);
        console.log(`   Falhas: ${failed}`);
        console.log(`   Rate Limited: ${rateLimited}`);
        console.log(`   Tempo total: ${(endTime - startTime).toFixed(2)}ms`);
    }

    async testSecurityVulnerabilities() {
        console.log('\n🛡️ Testando Vulnerabilidades de Segurança...');
        
        // Teste 1: SQL Injection
        console.log('💉 Testando SQL Injection...');
        const sqlInjectionTests = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT * FROM users --"
        ];
        
        for (const payload of sqlInjectionTests) {
            try {
                const result = await this.makeRequest(`/api/tasks?search=${encodeURIComponent(payload)}`);
                if (result.success && result.data.tasks && result.data.tasks.length > 0) {
                    this.results.securityIssues.push(`SQL Injection possível em search: ${payload}`);
                }
            } catch (error) {
                // Esperado falhar
            }
        }
        
        // Teste 2: XSS
        console.log('🕷️ Testando XSS...');
        const xssTests = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>"
        ];
        
        for (const payload of xssTests) {
            try {
                const result = await this.makeRequest('/api/tasks', 'POST', {
                    title: payload,
                    description: 'Test XSS',
                    priority: 'high'
                }, { 'Content-Type': 'application/json' });
                
                if (result.success) {
                    this.results.securityIssues.push(`XSS possível em title: ${payload}`);
                }
            } catch (error) {
                // Esperado falhar
            }
        }
        
        // Teste 3: Path Traversal
        console.log('📁 Testando Path Traversal...');
        const pathTraversalTests = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
            "....//....//....//etc/passwd"
        ];
        
        for (const payload of pathTraversalTests) {
            try {
                const result = await this.makeRequest(`/api/tasks/${encodeURIComponent(payload)}`);
                if (result.success) {
                    this.results.securityIssues.push(`Path Traversal possível: ${payload}`);
                }
            } catch (error) {
                // Esperado falhar
            }
        }
        
        console.log(`   Vulnerabilidades encontradas: ${this.results.securityIssues.length}`);
    }

    async testPerformance() {
        console.log('\n📈 Testando Performance...');
        
        const testEndpoints = ['/health', '/api/tasks', '/api-docs'];
        const iterations = 100;
        
        for (const endpoint of testEndpoints) {
            console.log(`   Testando ${endpoint}...`);
            const times = [];
            
            for (let i = 0; i < iterations; i++) {
                const start = performance.now();
                await this.makeRequest(endpoint);
                const end = performance.now();
                times.push(end - start);
                
                if (i % 20 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
            
            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            const min = Math.min(...times);
            const max = Math.max(...times);
            
            console.log(`     Média: ${avg.toFixed(2)}ms, Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`);
        }
    }

    async testExtremeOverload() {
        console.log('\n💥 TESTE EXTREMO - FORÇANDO PERDA DE PACOTES...');
        
        const extremeCount = 1000; // 1000 requests simultâneos!
        const promises = [];
        
        console.log(`   🚀 Lançando ${extremeCount} requests simultâneos...`);
        console.log('   ⚠️  Este teste pode quebrar o sistema!');
        
        for (let i = 0; i < extremeCount; i++) {
            promises.push(this.makeRequest('/health'));
        }
        
        const startTime = performance.now();
        const results = await Promise.allSettled(promises);
        const endTime = performance.now();
        
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.filter(r => r.status === 'rejected' || !r.value.success).length;
        const rateLimited = results.filter(r => r.status === 'fulfilled' && r.value.status === 429).length;
        const realFailures = failed - rateLimited;
        
        console.log(`   💥 RESULTADO EXTREMO:`);
        console.log(`   📊 Total: ${extremeCount}`);
        console.log(`   ✅ Sucessos: ${successful}`);
        console.log(`   🚦 Rate Limited: ${rateLimited}`);
        console.log(`   ❌ Falhas Reais: ${realFailures}`);
        console.log(`   ⏱️  Tempo: ${(endTime - startTime).toFixed(2)}ms`);
        
        if (realFailures > 0) {
            console.log(`   🎯 FINALMENTE! ${realFailures} pacotes perdidos!`);
        } else {
            console.log(`   😤 Ainda não quebrou! Sistema muito robusto...`);
        }
    }

    async testTimeoutExtreme() {
        console.log('\n⏰ TESTE DE TIMEOUT EXTREMO...');
        
        const timeoutTests = [];
        const shortTimeout = 1; // 1ms timeout - impossível de responder!
        
        console.log(`   ⚡ Testando com timeout de ${shortTimeout}ms (impossível!)`);
        
        for (let i = 0; i < 100; i++) {
            const startTime = performance.now();
            try {
                const response = await axios({
                    method: 'GET',
                    url: `${this.baseURL}/health`,
                    timeout: shortTimeout,
                    headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}
                });
                
                // Se chegou aqui, é um milagre!
                const endTime = performance.now();
                timeoutTests.push({
                    success: true,
                    responseTime: endTime - startTime,
                    miracle: true
                });
                
            } catch (error) {
                const endTime = performance.now();
                if (error.code === 'ECONNABORTED') {
                    // Timeout! Finalmente!
                    this.results.failedRequests++;
                    timeoutTests.push({
                        success: false,
                        responseTime: endTime - startTime,
                        error: 'TIMEOUT',
                        miracle: false
                    });
                } else {
                    // Outro erro
                    timeoutTests.push({
                        success: false,
                        responseTime: endTime - startTime,
                        error: error.message,
                        miracle: false
                    });
                }
            }
        }
        
        const timeouts = timeoutTests.filter(t => !t.success && t.error === 'TIMEOUT').length;
        const miracles = timeoutTests.filter(t => t.miracle).length;
        const otherErrors = timeoutTests.filter(t => !t.success && t.error !== 'TIMEOUT').length;
        
        console.log(`   ⏰ RESULTADO TIMEOUT:`);
        console.log(`   📊 Total: ${timeoutTests.length}`);
        console.log(`   ⏰ Timeouts: ${timeouts}`);
        console.log(`   🚀 Milagres: ${miracles}`);
        console.log(`   ❌ Outros erros: ${otherErrors}`);
        
        if (timeouts > 0) {
            console.log(`   🎯 FINALMENTE! ${timeouts} pacotes perdidos por timeout!`);
        } else if (miracles > 0) {
            console.log(`   😱 ${miracles} requests responderam em 1ms! SISTEMA SOBRENATURAL!`);
        }
    }

    async testMemoryOverload() {
        console.log('\n🧠 TESTE DE SOBRECARGA DE MEMÓRIA...');
        
        const memoryTests = [];
        const hugePayload = 'A'.repeat(1000000); // 1MB de dados!
        
        console.log(`   💾 Enviando payloads de 1MB cada...`);
        console.log(`   🚨 Isso pode quebrar o sistema!`);
        
        for (let i = 0; i < 50; i++) {
            const startTime = performance.now();
            try {
                const response = await axios({
                    method: 'POST',
                    url: `${this.baseURL}/api/tasks`,
                    data: {
                        title: `Task ${i}`,
                        description: hugePayload,
                        priority: 'high'
                    },
                    headers: {
                        'Content-Type': 'application/json',
                        ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {})
                    },
                    timeout: 10000
                });
                
                const endTime = performance.now();
                memoryTests.push({
                    success: true,
                    responseTime: endTime - startTime,
                    size: hugePayload.length
                });
                
            } catch (error) {
                const endTime = performance.now();
                if (error.code === 'ECONNABORTED') {
                    this.results.failedRequests++;
                    memoryTests.push({
                        success: false,
                        responseTime: endTime - startTime,
                        error: 'TIMEOUT',
                        size: hugePayload.length
                    });
                } else if (error.response?.status === 413) {
                    // Payload too large - esperado!
                    memoryTests.push({
                        success: false,
                        responseTime: endTime - startTime,
                        error: 'PAYLOAD_TOO_LARGE',
                        size: hugePayload.length
                    });
                } else {
                    this.results.failedRequests++;
                    memoryTests.push({
                        success: false,
                        responseTime: endTime - startTime,
                        error: error.message,
                        size: hugePayload.length
                    });
                }
            }
        }
        
        const timeouts = memoryTests.filter(t => !t.success && t.error === 'TIMEOUT').length;
        const payloadErrors = memoryTests.filter(t => !t.success && t.error === 'PAYLOAD_TOO_LARGE').length;
        const otherErrors = memoryTests.filter(t => !t.success && t.error !== 'TIMEOUT' && t.error !== 'PAYLOAD_TOO_LARGE').length;
        const successes = memoryTests.filter(t => t.success).length;
        
        console.log(`   🧠 RESULTADO MEMÓRIA:`);
        console.log(`   📊 Total: ${memoryTests.length}`);
        console.log(`   ✅ Sucessos: ${successes}`);
        console.log(`   ⏰ Timeouts: ${timeouts}`);
        console.log(`   📦 Payload muito grande: ${payloadErrors}`);
        console.log(`   ❌ Outros erros: ${otherErrors}`);
        
        if (timeouts > 0) {
            console.log(`   🎯 FINALMENTE! ${timeouts} pacotes perdidos por timeout!`);
        } else if (payloadErrors > 0) {
            console.log(`   🛡️  Sistema protegido contra payloads grandes!`);
        } else if (successes > 0) {
            console.log(`   😱 ${successes} requests de 1MB processados! SISTEMA INDESTRUTÍVEL!`);
        }
    }

    async runFullTest() {
        console.log('🚀 Iniciando Teste de Estresse Completo...');
        this.results.startTime = performance.now();
        
        try {
            await this.authenticate();
            await this.testRateLimiting();
            await this.testConcurrentRequests();
            await this.testSecurityVulnerabilities();
            await this.testPerformance();
            await this.testExtremeOverload(); // Adicionado o novo teste
            await this.testTimeoutExtreme(); // Adicionado o novo teste
            await this.testMemoryOverload(); // Adicionado o novo teste
            
        } catch (error) {
            console.error('❌ Erro durante o teste:', error.message);
        }
        
        this.results.endTime = performance.now();
        this.generateReport();
    }

    generateReport() {
        const totalTime = this.results.endTime - this.results.startTime;
        this.results.averageResponseTime = this.results.totalResponseTime / this.results.totalRequests;
        
        // Agora failedRequests só conta falhas reais (não rate limiting)
        // Pacotes perdidos = falhas reais (timeout, erro de rede, etc.)
        this.results.lostPackets = this.results.failedRequests;
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 RELATÓRIO DO TESTE DE ESTRESSE');
        console.log('='.repeat(60));
        
        console.log(`⏱️  Tempo total: ${(totalTime / 1000).toFixed(2)}s`);
        console.log(`📊 Total de requests: ${this.results.totalRequests}`);
        console.log(`✅ Sucessos: ${this.results.successfulRequests}`);
        console.log(`🚦 Rate Limited: ${this.results.rateLimitedRequests}`);
        console.log(`❌ Falhas Reais: ${this.results.failedRequests}`);
        console.log(`📦 Pacotes perdidos: ${this.results.lostPackets}`);
        console.log(`⏱️  Tempo médio de resposta: ${this.results.averageResponseTime.toFixed(2)}ms`);
        
        // Análise mais detalhada
        console.log('\n🔍 ANÁLISE DETALHADA:');
        if (this.results.rateLimitedRequests > 0) {
            console.log(`   • ${this.results.rateLimitedRequests} requests bloqueados por rate limiting (ESPERADO ✅)`);
        }
        if (this.results.failedRequests > 0) {
            console.log(`   • ${this.results.failedRequests} requests falharam por outros motivos (INVESTIGAR ⚠️)`);
        } else {
            console.log('   • Nenhuma falha real detectada (EXCELENTE ✅)');
        }
        
        if (this.results.securityIssues.length > 0) {
            console.log('\n🛡️  VULNERABILIDADES ENCONTRADAS:');
            this.results.securityIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        } else {
            console.log('\n✅ Nenhuma vulnerabilidade de segurança encontrada');
        }
        
        console.log('\n📋 RECOMENDAÇÕES:');
        
        if (this.results.lostPackets > 0) {
            console.log(`   • ${this.results.lostPackets} pacotes foram perdidos - verificar configurações de timeout`);
        } else {
            console.log('   • Nenhum pacote perdido - sistema estável ✅');
        }
        
        if (this.results.rateLimitedRequests > 0) {
            console.log('   • Rate limiting está funcionando perfeitamente ✅');
        }
        
        if (this.results.averageResponseTime > 1000) {
            console.log('   • Tempo de resposta alto - considerar otimizações');
        } else {
            console.log('   • Tempo de resposta excelente ✅');
        }
        
        if (this.results.securityIssues.length > 0) {
            console.log('   • Implementar validações de entrada mais rigorosas');
            console.log('   • Revisar sanitização de dados');
        }
        
        // Score final mais preciso
        let score = 100;
        if (this.results.lostPackets > 0) {
            score -= Math.min(30, this.results.lostPackets * 5);
        }
        if (this.results.averageResponseTime > 1000) {
            score -= 10;
        }
        if (this.results.securityIssues.length > 0) {
            score -= this.results.securityIssues.length * 15;
        }
        score = Math.max(0, score);
        
        console.log('\n🏆 SCORE FINAL:');
        if (score >= 90) {
            console.log(`   🎉 EXCELENTE! ${score}/100 - Sistema muito bem configurado`);
        } else if (score >= 70) {
            console.log(`   👍 BOM! ${score}/100 - Algumas melhorias necessárias`);
        } else if (score >= 50) {
            console.log(`   ⚠️ ATENÇÃO! ${score}/100 - Várias melhorias necessárias`);
        } else {
            console.log(`   🚨 CRÍTICO! ${score}/100 - Muitas melhorias necessárias`);
        }
        
        console.log('='.repeat(60));
    }
}

// Executa o teste se o arquivo for chamado diretamente
if (require.main === module) {
    const tester = new StressTester();
    tester.runFullTest().catch(console.error);
}

module.exports = StressTester;
