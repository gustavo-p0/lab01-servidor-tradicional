/**
 * Configurações para Testes de Estresse e Segurança
 * 
 * Permite ajustar parâmetros dos testes sem modificar o código
 */

const config = {
    // Configurações do servidor
    server: {
        baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
        timeout: parseInt(process.env.TEST_TIMEOUT) || 5000,
        maxRetries: parseInt(process.env.TEST_MAX_RETRIES) || 3
    },
    
    // Configurações de rate limiting
    rateLimit: {
        // Teste de rate limit público
        public: {
            requests: parseInt(process.env.TEST_PUBLIC_REQUESTS) || 120,
            delay: parseInt(process.env.TEST_PUBLIC_DELAY) || 10
        },
        
        // Teste de rate limit de autenticação
        auth: {
            requests: parseInt(process.env.TEST_AUTH_REQUESTS) || 10,
            delay: parseInt(process.env.TEST_AUTH_DELAY) || 100
        }
    },
    
    // Configurações de concorrência
    concurrency: {
        requests: parseInt(process.env.TEST_CONCURRENT_REQUESTS) || 50,
        maxConcurrent: parseInt(process.env.TEST_MAX_CONCURRENT) || 10
    },
    
    // Configurações de performance
    performance: {
        iterations: parseInt(process.env.TEST_PERFORMANCE_ITERATIONS) || 100,
        endpoints: process.env.TEST_ENDPOINTS?.split(',') || ['/health', '/api/tasks', '/api-docs']
    },
    
    // Configurações de segurança
    security: {
        // Senhas comuns para teste de força bruta
        commonPasswords: [
            'admin', 'password', '123456', 'qwerty', 'letmein',
            'welcome', 'monkey', 'dragon', 'master', 'football',
            'abc123', 'password123', 'admin123', 'root', 'toor'
        ],
        
        // Payloads maliciosos para teste
        maliciousPayloads: {
            sqlInjection: [
                "' OR '1'='1",
                "'; DROP TABLE users; --",
                "' UNION SELECT * FROM users --",
                "' OR 1=1--",
                "admin'--"
            ],
            
            xss: [
                "<script>alert('xss')</script>",
                "javascript:alert('xss')",
                "<img src=x onerror=alert('xss')>",
                "<svg onload=alert('xss')>",
                "javascript:void(0)"
            ],
            
            pathTraversal: [
                "../../../etc/passwd",
                "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
                "....//....//....//etc/passwd",
                "..%2F..%2F..%2Fetc%2Fpasswd"
            ]
        },
        
        // Headers maliciosos
        maliciousHeaders: [
            { 'X-Forwarded-For': '127.0.0.1, 192.168.1.1' },
            { 'X-Real-IP': '10.0.0.1' },
            { 'X-Forwarded-Host': 'evil.com' },
            { 'X-Forwarded-Proto': 'https' },
            { 'X-Original-URL': '/admin' },
            { 'X-Rewrite-URL': '/admin' }
        ]
    },
    
    // Configurações de ambiente
    environment: {
        // Configurações para desenvolvimento
        development: {
            verbose: true,
            slowMo: 100,
            maxFailures: 5
        },
        
        // Configurações para teste
        test: {
            verbose: false,
            slowMo: 50,
            maxFailures: 10
        },
        
        // Configurações para produção (cuidado!)
        production: {
            verbose: false,
            slowMo: 0,
            maxFailures: 1
        }
    },
    
    // Configurações de logging
    logging: {
        level: process.env.TEST_LOG_LEVEL || 'info',
        file: process.env.TEST_LOG_FILE || './test-results.log',
        console: process.env.TEST_LOG_CONSOLE !== 'false'
    },
    
    // Configurações de relatório
    reporting: {
        outputDir: process.env.TEST_OUTPUT_DIR || './test-reports',
        format: process.env.TEST_REPORT_FORMAT || 'console', // console, json, html
        includeMetrics: process.env.TEST_INCLUDE_METRICS !== 'false',
        includeVulnerabilities: process.env.TEST_INCLUDE_VULNERABILITIES !== 'false'
    }
};

// Função para obter configuração baseada no ambiente
function getConfig(env = process.env.NODE_ENV || 'development') {
    return {
        ...config,
        currentEnv: config.environment[env] || config.environment.development
    };
}

// Função para validar configurações
function validateConfig() {
    const errors = [];
    
    if (config.server.timeout < 1000) {
        errors.push('Timeout deve ser pelo menos 1000ms');
    }
    
    if (config.concurrency.requests < 1) {
        errors.push('Número de requests deve ser pelo menos 1');
    }
    
    if (config.performance.iterations < 10) {
        errors.push('Iterações de performance devem ser pelo menos 10');
    }
    
    return errors;
}

// Função para gerar configuração de teste personalizada
function generateCustomConfig(options = {}) {
    return {
        ...config,
        ...options,
        currentEnv: {
            ...config.environment.development,
            ...options.currentEnv
        }
    };
}

module.exports = {
    config,
    getConfig,
    validateConfig,
    generateCustomConfig
};
