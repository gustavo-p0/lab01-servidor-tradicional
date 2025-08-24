# 🚀 Testes de Estresse e Segurança - Servidor Tradicional

> **📁 Todos os testes estão organizados na pasta `tests/`**

## 🎯 Visão Geral

Esta é uma suite completa de testes para verificar a robustez, segurança e performance do seu servidor Node.js tradicional, especialmente focado em **rate limiting** e **detecção de vulnerabilidades**.

## 🆕 **CORREÇÃO IMPORTANTE - Autenticação**

**✅ PROBLEMA RESOLVIDO**: Os testes de segurança agora usam autenticação real para testar rotas protegidas corretamente.

- **Antes**: Tentava acessar rotas autenticadas sem token (erro 401)
- **Agora**: Registra usuário real, faz login e usa token válido para testes
- **Benefício**: Testes mais realistas e precisos de segurança

## 📁 Estrutura do Projeto

```
lab01-servidor-tradicional/
├── tests/                          # 🎯 Pasta principal dos testes
│   ├── index.js                    # Interface principal
│   ├── package.json                # Dependências dos testes
│   ├── stress-test.js              # Teste de estresse e performance
│   ├── security-test.js            # Teste de segurança (CORRIGIDO)
│   ├── test-auth.js                # Teste rápido de autenticação
│   ├── run-tests.js                # Script principal
│   ├── test-config.js              # Configurações
│   ├── example-usage.js            # Exemplos práticos
│   ├── install-tests.sh            # Instalação automatizada
│   ├── README-TESTES.md            # Documentação completa
│   └── RESUMO-IMPLEMENTACAO.md     # Resumo técnico
├── server.js                       # Seu servidor principal
├── package.json                    # Dependências do projeto
└── README.md                       # Documentação do projeto
```

## 🚀 Como Usar (Resumo Rápido)

### 1. Navegue para a pasta de testes
```bash
cd tests/
```

### 2. Instale as dependências
```bash
# Opção 1: Script automatizado
./install-tests.sh

# Opção 2: Manual
npm install
```

### 3. Execute os testes
```bash
# Teste completo (recomendado)
npm test

# Apenas estresse
npm run test:stress

# Apenas segurança (CORRIGIDO)
npm run test:security

# Teste rápido de conectividade
npm run test:quick

# Teste de autenticação (NOVO)
npm run test:auth

# Exemplos práticos
npm run test:examples

# Ver ajuda
npm run help
```

## 🔍 Comandos Diretos (Alternativa)

```bash
# Da pasta tests/
node run-tests.js                    # Teste completo
node run-tests.js --stress-only      # Apenas estresse
node run-tests.js --security-only    # Apenas segurança (CORRIGIDO)
node test-auth.js                    # Teste de autenticação
node example-usage.js                # Exemplos
node index.js help                   # Interface principal
```

## 📊 O que os Testes Verificam

### 🚦 Rate Limiting
- **Usuários não autenticados**: 100 requests/15min
- **Usuários autenticados**: 500 requests/15min  
- **Autenticação**: 5 tentativas/15min
- **Bypass de rate limiting** via headers falsos

### 🛡️ Segurança (CORRIGIDO)
- **SQL Injection** em parâmetros de busca
- **XSS** em campos de entrada
- **Path Traversal** em URLs
- **Força bruta** em login
- **Bypass de autenticação** com JWT malformado
- **Injeção de headers** maliciosos
- **Endpoints autenticados** com token válido (NOVO)

### 📈 Performance
- **Tempo de resposta** sob carga
- **Requisições concorrentes** (50 simultâneas)
- **Pacotes perdidos** por timeout/erro
- **Estabilidade** sob estresse

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

## 📚 Documentação Detalhada

Para informações completas sobre:
- **Configuração avançada**: Veja `tests/README-TESTES.md`
- **Resumo técnico**: Veja `tests/RESUMO-IMPLEMENTACAO.md`
- **Exemplos práticos**: Execute `npm run test:examples`
- **Teste de autenticação**: Execute `npm run test:auth`

## 🎯 Exemplos de Uso

### Teste Básico de Rate Limiting
```bash
cd tests/
npm run test:stress
```

### Teste de Segurança Focado (CORRIGIDO)
```bash
cd tests/
npm run test:security
```

### Teste de Autenticação (NOVO)
```bash
cd tests/
npm run test:auth
```

### Teste em Ambiente de Produção
```bash
cd tests/
NODE_ENV=production TEST_BASE_URL=https://seu-servidor.com npm test
```

### Teste Personalizado
```bash
cd tests/
TEST_PUBLIC_REQUESTS=200 TEST_CONCURRENT_REQUESTS=75 npm test
```

## 🛠️ Personalização

### Adicionar Novos Payloads Maliciosos
```javascript
// Em tests/test-config.js
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
const { SecurityTester } = require('./tests');

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
# Em outro terminal (da pasta raiz)
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
# Servidor não está rodando (da pasta raiz)
npm start
# ou
node server.js
```

### Erro: "Request timeout"
```bash
# Aumentar timeout
export TEST_TIMEOUT=15000
npm test
```

### Erro: "Rate limited" durante autenticação
```bash
# Aguarde alguns minutos para o rate limiting reset
# Ou use o teste específico de autenticação
npm run test:auth
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

1. **Navegue para a pasta de testes**: `cd tests/`
2. **Instale as dependências**: `./install-tests.sh`
3. **Teste a autenticação**: `npm run test:auth`
4. **Execute os testes**: `npm test`
5. **Analise os resultados** e identifique problemas
6. **Implemente correções** baseadas nas recomendações
7. **Execute novamente** para verificar correções

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
5. Use `npm run test:auth` para verificar autenticação

---

**🚀 Navegue para a pasta `tests/` e comece a testar seu servidor agora!**

**🔐 A autenticação agora funciona corretamente nos testes de segurança!**
