const axios = require('axios');
const { performance } = require('perf_hooks');

/**
 * Teste de Segurança Avançado para Servidor Tradicional
 * 
 * Foca em:
 * - Ataques de força bruta
 * - Bypass de rate limiting
 * - Injeção de payloads maliciosos
 * - Testes de autenticação
 * - Validação de headers
 */

class SecurityTester {
    constructor(baseURL = 'http://localhost:3000') {
        this.baseURL = baseURL;
        this.results = {
            vulnerabilities: [],
            bypassAttempts: 0,
            successfulAttacks: 0,
            blockedAttacks: 0,
            startTime: 0,
            endTime: 0
        };
        
        // Token de autenticação para testes
        this.authToken = null;
        this.userId = null;
    }

    async authenticate() {
        try {
            console.log('🔐 Autenticando usuário para testes de segurança...');
            
            // Aguarda um pouco para não ser bloqueado pelo rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Primeiro registra um usuário
            const registerResponse = await axios.post(`${this.baseURL}/api/auth/register`, {
                username: `security_test_${Date.now()}`,
                email: `security_${Date.now()}@example.com`,
                password: 'SecurePassword123!'
            });
            
            if (registerResponse.data.success) {
                this.userId = registerResponse.data.user.id;
                console.log(`✅ Usuário registrado: ${this.userId}`);
            }
            
            // Aguarda um pouco entre register e login
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Faz login
            const loginResponse = await axios.post(`${this.baseURL}/api/auth/login`, {
                username: `security_test_${Date.now()}`,
                password: 'SecurePassword123!'
            });
            
            if (loginResponse.data.success) {
                this.authToken = loginResponse.data.token;
                console.log('✅ Login realizado com sucesso para testes de segurança');
            }
            
        } catch (error) {
            console.log('⚠️ Falha na autenticação, alguns testes podem não funcionar corretamente');
            console.log(`   Erro: ${error.response?.data?.message || error.message}`);
            
            // Se foi rate limited, aguarda mais tempo
            if (error.response?.status === 429) {
                console.log('   ⏳ Aguardando rate limiting reset...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                // Tenta novamente uma vez
                try {
                    console.log('   🔄 Tentando autenticação novamente...');
                    const retryResponse = await axios.post(`${this.baseURL}/api/auth/register`, {
                        username: `security_test_retry_${Date.now()}`,
                        email: `security_retry_${Date.now()}@example.com`,
                        password: 'SecurePassword123!'
                    });
                    
                    if (retryResponse.data.success) {
                        this.userId = retryResponse.data.user.id;
                        console.log(`✅ Usuário registrado na segunda tentativa: ${this.userId}`);
                        
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        const retryLoginResponse = await axios.post(`${this.baseURL}/api/auth/login`, {
                            username: `security_test_retry_${Date.now()}`,
                            password: 'SecurePassword123!'
                        });
                        
                        if (retryLoginResponse.data.success) {
                            this.authToken = retryLoginResponse.data.token;
                            console.log('✅ Login realizado com sucesso na segunda tentativa');
                        }
                    }
                } catch (retryError) {
                    console.log(`   ❌ Segunda tentativa também falhou: ${retryError.response?.data?.message || retryError.message}`);
                }
            }
        }
    }

    async testBruteForce() {
        console.log('\n🔨 Testando Ataques de Força Bruta...');
        
        // Teste de força bruta em login
        console.log('   Testando força bruta em login...');
        const commonPasswords = [
            'admin', 'password', '123456', 'qwerty', 'letmein',
            'welcome', 'monkey', 'dragon', 'master', 'football'
        ];
        
        let blockedCount = 0;
        for (const password of commonPasswords) {
            try {
                const response = await axios.post(`${this.baseURL}/api/auth/login`, {
                    username: 'admin',
                    password: password
                });
                
                if (response.status === 200) {
                    this.results.vulnerabilities.push(`Login com senha comum: ${password}`);
                    this.results.successfulAttacks++;
                }
                
            } catch (error) {
                if (error.response?.status === 429) {
                    blockedCount++;
                    this.results.blockedAttacks++;
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.log(`   Senhas testadas: ${commonPasswords.length}, Bloqueadas: ${blockedCount}`);
    }

    async testRateLimitBypass() {
        console.log('\n🚪 Testando Bypass de Rate Limiting...');
        
        // Teste 1: Mudança de IP via headers
        console.log('   Testando bypass via X-Forwarded-For...');
        const fakeIPs = [
            '192.168.1.1',
            '10.0.0.1',
            '172.16.0.1',
            '127.0.0.1'
        ];
        
        for (const fakeIP of fakeIPs) {
            try {
                const response = await axios.get(`${this.baseURL}/health`, {
                    headers: {
                        'X-Forwarded-For': fakeIP,
                        'X-Real-IP': fakeIP
                    }
                });
                
                if (response.status === 200) {
                    console.log(`     ✅ Request aceito com IP fake: ${fakeIP}`);
                }
                
            } catch (error) {
                if (error.response?.status === 429) {
                    console.log(`     🚦 Rate limited com IP fake: ${fakeIP}`);
                }
            }
        }
        
        // Teste 2: Bypass via User-Agent
        console.log('   Testando bypass via User-Agent...');
        const userAgents = [
            'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)',
            'curl/7.68.0',
            'PostmanRuntime/7.28.0'
        ];
        
        for (const userAgent of userAgents) {
            try {
                const response = await axios.get(`${this.baseURL}/health`, {
                    headers: { 'User-Agent': userAgent }
                });
                
                if (response.status === 200) {
                    console.log(`     ✅ Request aceito com User-Agent: ${userAgent.substring(0, 30)}...`);
                }
                
            } catch (error) {
                if (error.response?.status === 429) {
                    console.log(`     🚦 Rate limited com User-Agent: ${userAgent.substring(0, 30)}...`);
                }
            }
        }
    }

    async testInputValidation() {
        console.log('\n🔍 Testando Validação de Entrada...');
        
        // Teste de payloads maliciosos em diferentes campos
        const maliciousPayloads = [
            // NoSQL Injection
            { username: { $ne: null }, password: { $ne: null } },
            { username: { $gt: "" }, password: { $gt: "" } },
            
            // Command Injection
            { username: "admin; rm -rf /", password: "test" },
            { username: "admin && cat /etc/passwd", password: "test" },
            
            // Template Injection
            { username: "{{7*7}}", password: "test" },
            { username: "${7*7}", password: "test" },
            
            // LDAP Injection
            { username: "*)(uid=*))(|(uid=*", password: "test" },
            { username: "admin)(&(objectClass=*)", password: "test" }
        ];
        
        for (const payload of maliciousPayloads) {
            try {
                const response = await axios.post(`${this.baseURL}/api/auth/login`, payload);
                
                if (response.status === 200) {
                    this.results.vulnerabilities.push(`Input validation falhou para: ${JSON.stringify(payload)}`);
                    this.results.successfulAttacks++;
                }
                
            } catch (error) {
                // Esperado falhar
                if (error.response?.status === 400 || error.response?.status === 422) {
                    console.log(`     ✅ Validação bloqueou payload malicioso`);
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    async testHeaderInjection() {
        console.log('\n📨 Testando Injeção de Headers...');
        
        const maliciousHeaders = [
            { 'X-Forwarded-For': '127.0.0.1, 192.168.1.1' },
            { 'X-Real-IP': '10.0.0.1' },
            { 'X-Forwarded-Host': 'evil.com' },
            { 'X-Forwarded-Proto': 'https' },
            { 'X-Original-URL': '/admin' },
            { 'X-Rewrite-URL': '/admin' }
        ];
        
        for (const header of maliciousHeaders) {
            try {
                const response = await axios.get(`${this.baseURL}/health`, { headers: header });
                
                if (response.status === 200) {
                    console.log(`     ✅ Header aceito: ${Object.keys(header)[0]}`);
                }
                
            } catch (error) {
                console.log(`     ❌ Header rejeitado: ${Object.keys(header)[0]}`);
            }
        }
    }

    async testAuthenticationBypass() {
        console.log('\n🔓 Testando Bypass de Autenticação...');
        
        // Teste 1: JWT malformado
        console.log('   Testando JWT malformado...');
        const malformedTokens = [
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', // Header apenas
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature', // Assinatura inválida
            'invalid.token.here', // Token completamente inválido
            'Bearer ', // Token vazio
            'Bearer invalid' // Token inválido
        ];
        
        for (const token of malformedTokens) {
            try {
                const response = await axios.get(`${this.baseURL}/api/tasks`, {
                    headers: { 'Authorization': token }
                });
                
                if (response.status === 200) {
                    this.results.vulnerabilities.push(`Bypass de autenticação com token: ${token}`);
                    this.results.successfulAttacks++;
                }
                
            } catch (error) {
                if (error.response?.status === 401) {
                    console.log(`     ✅ Autenticação bloqueou token inválido`);
                }
            }
        }
        
        // Teste 2: Tentativa de acesso sem token
        console.log('   Testando acesso sem token...');
        try {
            const response = await axios.get(`${this.baseURL}/api/tasks`);
            
            if (response.status === 200) {
                this.results.vulnerabilities.push('Acesso permitido sem autenticação');
                this.results.successfulAttacks++;
            }
            
        } catch (error) {
            if (error.response?.status === 401) {
                console.log(`     ✅ Autenticação requerida corretamente`);
            }
        }

        // Teste 3: Acesso com token válido (deve funcionar)
        if (this.authToken) {
            console.log('   Testando acesso com token válido...');
            try {
                const response = await axios.get(`${this.baseURL}/api/tasks`, {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                });
                
                if (response.status === 200) {
                    console.log(`     ✅ Acesso autorizado com token válido`);
                } else {
                    console.log(`     ⚠️ Token válido não funcionou: ${response.status}`);
                }
                
            } catch (error) {
                console.log(`     ❌ Erro com token válido: ${error.response?.status || error.message}`);
            }
        } else {
            console.log('   ⚠️ Não foi possível testar com token válido (falha na autenticação)');
        }
    }

    async testAuthenticatedEndpoints() {
        if (!this.authToken) {
            console.log('\n🔐 Pulando teste de endpoints autenticados (sem token)');
            return;
        }

        console.log('\n🔐 Testando Endpoints Autenticados...');
        
        // Teste de criação de tarefa com payload malicioso
        console.log('   Testando criação de tarefa com payload malicioso...');
        const maliciousTasks = [
            {
                title: "<script>alert('xss')</script>",
                description: "'; DROP TABLE tasks; --",
                priority: "high"
            },
            {
                title: "javascript:alert('xss')",
                description: "' OR 1=1--",
                priority: "medium"
            },
            {
                title: "../../../etc/passwd",
                description: "{{7*7}}",
                priority: "low"
            }
        ];

        for (const task of maliciousTasks) {
            try {
                const response = await axios.post(`${this.baseURL}/api/tasks`, task, {
                    headers: { 
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.status === 200 || response.status === 201) {
                    this.results.vulnerabilities.push(`Tarefa criada com payload malicioso: ${JSON.stringify(task)}`);
                    this.results.successfulAttacks++;
                }
                
            } catch (error) {
                if (error.response?.status === 400 || error.response?.status === 422) {
                    console.log(`     ✅ Validação bloqueou tarefa maliciosa`);
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    async runSecurityTest() {
        console.log('🛡️ Iniciando Teste de Segurança Avançado...');
        this.results.startTime = performance.now();
        
        try {
            // Primeiro se autentica
            await this.authenticate();
            
            // Executa os testes
            await this.testBruteForce();
            await this.testRateLimitBypass();
            await this.testInputValidation();
            await this.testHeaderInjection();
            await this.testAuthenticationBypass();
            await this.testAuthenticatedEndpoints();
            
        } catch (error) {
            console.error('❌ Erro durante teste de segurança:', error.message);
        }
        
        this.results.endTime = performance.now();
        this.generateSecurityReport();
    }

    generateSecurityReport() {
        const totalTime = this.results.endTime - this.results.startTime;
        
        console.log('\n' + '='.repeat(60));
        console.log('🛡️ RELATÓRIO DE SEGURANÇA');
        console.log('='.repeat(60));
        
        console.log(`⏱️  Tempo total: ${(totalTime / 1000).toFixed(2)}s`);
        console.log(`🚫 Ataques bloqueados: ${this.results.blockedAttacks}`);
        console.log(`⚠️  Ataques bem-sucedidos: ${this.results.successfulAttacks}`);
        console.log(`🔍 Vulnerabilidades encontradas: ${this.results.vulnerabilities.length}`);
        
        if (this.results.vulnerabilities.length > 0) {
            console.log('\n🚨 VULNERABILIDADES CRÍTICAS:');
            this.results.vulnerabilities.forEach((vuln, index) => {
                console.log(`   ${index + 1}. ${vuln}`);
            });
        } else {
            console.log('\n✅ Nenhuma vulnerabilidade crítica encontrada');
        }
        
        console.log('\n📋 RECOMENDAÇÕES DE SEGURANÇA:');
        
        if (this.results.successfulAttacks > 0) {
            console.log('   • Implementar validação mais rigorosa de entrada');
            console.log('   • Reforçar mecanismos de autenticação');
            console.log('   • Revisar rate limiting por IP real');
        }
        
        if (this.results.blockedAttacks > 0) {
            console.log('   • Rate limiting está funcionando');
            console.log('   • Considerar implementar WAF');
        }
        
        console.log('   • Implementar logging de segurança');
        console.log('   • Configurar alertas para tentativas de ataque');
        console.log('   • Revisar headers de segurança');
        
        console.log('='.repeat(60));
    }
}

// Executa o teste se o arquivo for chamado diretamente
if (require.main === module) {
    const tester = new SecurityTester();
    tester.runSecurityTest().catch(console.error);
}

module.exports = SecurityTester;
