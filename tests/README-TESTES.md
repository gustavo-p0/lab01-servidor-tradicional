# 🚀 Testes de Estresse e Segurança - Servidor Tradicional

Este conjunto de testes foi criado para verificar a robustez, segurança e performance do seu servidor Node.js tradicional, especialmente focado em **rate limiting** e **detecção de vulnerabilidades**.

## 📋 O que os Testes Verificam

### 🚦 Rate Limiting
- **Usuários não autenticados**: 100 requests/15min
- **Usuários autenticados**: 500 requests/15min  
- **Autenticação**: 5 tentativas/15min
- **Bypass de rate limiting** via headers falsos

### 🛡️ Segurança
- **SQL Injection** em parâmetros de busca
- **XSS** em campos de entrada
- **Path Traversal** em URLs
- **Força bruta** em login
- **Bypass de autenticação** com JWT malformado
- **Injeção de headers** maliciosos

### 📊 Performance
- **Tempo de resposta** sob carga
- **Requisições concorrentes** (50 simultâneas)
- **Pacotes perdidos** por timeout/erro
- **Estabilidade** sob estresse

## 🚀 Como Executar

### Pré-requisitos
```bash
# Instalar dependências
npm install axios

# Garantir que o servidor está rodando
npm start
```

### Execução Completa
```bash
# Executa todos os testes
node run-tests.js

# Apenas teste de estresse
node run-tests.js --stress-only

# Apenas teste de segurança  
node run-tests.js --security-only
```

### Testes Individuais
```bash
# Teste de estresse básico
node stress-test.js

# Teste de segurança avançado
node security-test.js
```

## ⚙️ Configuração

### Variáveis de Ambiente
```bash
# URL do servidor (padrão: http://localhost:3000)
export TEST_BASE_URL=http://localhost:3001

# Timeout das requisições (padrão: 5000ms)
export TEST_TIMEOUT=10000

# Número de requests para teste de rate limit
export TEST_PUBLIC_REQUESTS=150
export TEST_AUTH_REQUESTS=15

# Requisições concorrentes
export TEST_CONCURRENT_REQUESTS=100

# Iterações de performance
export TEST_PERFORMANCE_ITERATIONS=200

# Ambiente
export NODE_ENV=development
```

### Configuração Personalizada
Edite `test-config.js` para ajustar:
- Payloads maliciosos
- Senhas comuns para força bruta
- Headers maliciosos
- Parâmetros de performance

## 📊 Interpretando os Resultados

### Score Final (0-100)
- **90-100**: 🎉 EXCELENTE - Sistema muito bem configurado
- **70-89**: 👍 BOM - Algumas melhorias necessárias  
- **50-69**: ⚠️ ATENÇÃO - Várias melhorias necessárias
- **0-49**: 🚨 CRÍTICO - Muitas melhorias necessárias

### Métricas Importantes
- **Pacotes perdidos**: Requests que falharam por timeout/erro de rede
- **Rate Limited**: Requests bloqueados pelo rate limiting (esperado)
- **Vulnerabilidades**: Falhas de segurança encontradas
- **Tempo de resposta**: Performance sob carga

## 🔍 Exemplos de Uso

### Teste Básico de Rate Limiting
```bash
# Testa se o rate limiting está funcionando
node run-tests.js --stress-only
```

### Teste de Segurança Focado
```bash
# Testa apenas aspectos de segurança
node run-tests.js --security-only
```

### Teste em Ambiente de Produção
```bash
# Cuidado! Testa servidor de produção
NODE_ENV=production TEST_BASE_URL=https://seu-servidor.com node run-tests.js
```

### Teste Personalizado
```bash
# Testa com configurações específicas
TEST_PUBLIC_REQUESTS=200 TEST_CONCURRENT_REQUESTS=75 node run-tests.js
```

## 🛠️ Personalização

### Adicionar Novos Payloads Maliciosos
```javascript
// Em test-config.js
security: {
    maliciousPayloads: {
        sqlInjection: [
            // ... payloads existentes
            "'; EXEC xp_cmdshell('dir'); --",  // SQL Server
            "' OR SLEEP(5) --"                  // Time-based
        ]
    }
}
```

### Criar Teste Personalizado
```javascript
const SecurityTester = require('./security-test');

class CustomSecurityTester extends SecurityTester {
    async testCustomVulnerability() {
        // Seu teste personalizado aqui
    }
}

const tester = new CustomSecurityTester();
tester.runSecurityTest();
```

## 📈 Monitoramento Durante os Testes

### Logs do Servidor
Monitore os logs do seu servidor durante os testes:
```bash
# Em outro terminal
tail -f logs/app.log
```

### Métricas em Tempo Real
Os testes mostram progresso em tempo real:
```
🚦 Testando Rate Limiting...
📊 Testando rate limit público (100 req/15min)...
   20/120 requests feitas
   40/120 requests feitas
   Rate limited: 20/120 requests
```

## 🚨 Troubleshooting

### Erro: "ECONNREFUSED"
```bash
# Servidor não está rodando
npm start
# ou
node server.js
```

### Erro: "Request timeout"
```bash
# Aumentar timeout
export TEST_TIMEOUT=15000
node run-tests.js
```

### Muitos "pacotes perdidos"
- Verificar configurações de timeout
- Ajustar rate limiting
- Verificar recursos do servidor

### Rate limiting não detectado
- Verificar se o middleware está ativo
- Confirmar configurações em `config/rateLimit.js`
- Verificar logs do servidor

## 🔒 Segurança dos Testes

### ⚠️ AVISO IMPORTANTE
- **NUNCA** execute estes testes em servidores de produção sem autorização
- Os testes incluem payloads maliciosos que podem causar danos
- Use apenas em ambientes de desenvolvimento/teste
- Monitore os logs durante a execução

### Ambientes Seguros
- ✅ Desenvolvimento local
- ✅ Servidores de teste
- ✅ Containers isolados
- ❌ Produção
- ❌ Servidores compartilhados

## 📚 Próximos Passos

1. **Execute os testes** em seu ambiente de desenvolvimento
2. **Analise os resultados** e identifique problemas
3. **Implemente correções** baseadas nas recomendações
4. **Execute novamente** para verificar as correções
5. **Monitore continuamente** a segurança e performance

## 🤝 Contribuição

Para melhorar os testes:
- Adicione novos tipos de payloads maliciosos
- Implemente testes para novas vulnerabilidades
- Melhore as métricas de performance
- Adicione suporte para outros tipos de servidor

## 📞 Suporte

Se encontrar problemas:
1. Verifique se o servidor está rodando
2. Confirme as configurações de rate limiting
3. Verifique os logs do servidor
4. Teste com configurações mais básicas primeiro

---

**Lembre-se**: Estes testes são ferramentas educacionais para melhorar a segurança e performance do seu servidor. Use com responsabilidade! 🛡️
