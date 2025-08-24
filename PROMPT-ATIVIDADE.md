# 🚀 PROMPT COMPLETO - Atividade de IA: Testes de Estresse e Segurança

## 📋 **TAREFA COMPLETA**

Utilizando uma ferramenta de IA/LLM, peça a ela para gerar um teste de estresse para verificar a quantidade de pacotes perdidos e as falhas de segurança do sistema. Com isso, você conseguirá explorar o rate limite.

## 🎯 **OBJETIVOS ESPECÍFICOS**

### 1. **Teste de Estresse e Performance**
- Implementar teste de rate limiting (100 req/15min para usuários não autenticados, 500 req/15min para autenticados)
- Testar performance sob carga (50 requests simultâneos)
- Detectar pacotes perdidos por timeout/erro de rede
- Medir tempo de resposta sob estresse

### 2. **Teste de Segurança Avançado**
- SQL Injection em parâmetros de busca
- XSS em campos de entrada
- Path Traversal em URLs
- Força bruta em login
- Bypass de autenticação com JWT malformado
- Injeção de headers maliciosos
- **IMPORTANTE**: Usar autenticação real para testar rotas protegidas

### 3. **Sistema de Configuração**
- Configurações por ambiente (dev/test/prod)
- Variáveis de ambiente personalizáveis
- Validação de configurações
- Payloads maliciosos configuráveis

### 4. **Interface Unificada**
- Script principal que executa todos os testes
- Comandos npm intuitivos
- Relatórios detalhados com score (0-100)
- Análise automática de problemas

## 🔧 **REQUISITOS TÉCNICOS**

### **Arquivos a serem criados:**
1. `tests/stress-test.js` - Teste completo de estresse e performance
2. `tests/security-test.js` - Teste avançado de segurança (COM AUTENTICAÇÃO REAL)
3. `tests/test-config.js` - Configurações personalizáveis
4. `tests/run-tests.js` - Script principal com todas as opções
5. `tests/index.js` - Interface principal unificada
6. `tests/package.json` - Dependências específicas dos testes
7. `tests/example-usage.js` - Exemplos práticos de uso
8. `tests/install-tests.sh` - Instalação automatizada
9. `tests/README-TESTES.md` - Documentação completa
10. `tests/RESUMO-IMPLEMENTACAO.md` - Resumo técnico
11. `tests/test-auth.js` - Teste específico de autenticação

### **Funcionalidades obrigatórias:**
- ✅ Rate limiting funcionando corretamente
- ✅ Autenticação real para rotas protegidas
- ✅ Detecção de pacotes perdidos
- ✅ Testes de vulnerabilidades de segurança
- ✅ Relatórios com métricas e recomendações
- ✅ Configuração via variáveis de ambiente
- ✅ Comandos npm intuitivos

## 📝 **PROMPT PARA IA/LLM**

```
Preciso que você implemente uma suite completa de testes de estresse e segurança para um servidor Node.js tradicional. 

## CONTEXTO
Tenho um servidor Express com:
- Rate limiting configurado (100 req/15min público, 500 req/15min autenticado)
- Autenticação JWT
- Rotas protegidas (/api/tasks, etc.)
- Middleware de segurança (Helmet, CORS)

## REQUISITOS TÉCNICOS

### 1. TESTE DE ESTRESSE (stress-test.js)
- Teste rate limiting: 120 requests para endpoint público
- Teste concorrência: 50 requests simultâneos
- Teste performance: 100 iterações por endpoint
- Detecção de pacotes perdidos (timeout/erro)
- Autenticação real (registra usuário e faz login)

### 2. TESTE DE SEGURANÇA (security-test.js)
- IMPORTANTE: Deve usar autenticação real para testar rotas protegidas
- SQL Injection, XSS, Path Traversal
- Força bruta em login
- Bypass de autenticação com JWT malformado
- Injeção de headers maliciosos
- Teste de endpoints autenticados com payloads maliciosos

### 3. SISTEMA DE CONFIGURAÇÃO (test-config.js)
- Configurações por ambiente
- Variáveis de ambiente personalizáveis
- Payloads maliciosos configuráveis
- Validação de configurações

### 4. SCRIPT PRINCIPAL (run-tests.js)
- Execução completa de todos os testes
- Opções: --stress-only, --security-only
- Relatório final com score 0-100
- Análise automática de problemas

### 5. INTERFACE UNIFICADA (index.js)
- Comandos: quick, stress, security, full, help
- Integração com npm scripts
- Interface intuitiva

### 6. PACKAGE.JSON
- Scripts npm: test, test:stress, test:security, test:quick, test:auth
- Dependência: axios
- Comandos intuitivos

### 7. INSTALAÇÃO AUTOMATIZADA
- Script bash para instalação
- Verificação de dependências
- Configuração automática

### 8. DOCUMENTAÇÃO COMPLETA
- README detalhado
- Exemplos de uso
- Troubleshooting
- Configuração avançada

## PONTOS CRÍTICOS
1. AUTENTICAÇÃO REAL: Os testes de segurança devem registrar usuário real, fazer login e usar token válido para testar rotas protegidas
2. RATE LIMITING: Testar se está funcionando corretamente
3. PACOTES PERDIDOS: Detectar requests que falharam por timeout/erro
4. VULNERABILIDADES: Testar com payloads maliciosos reais
5. RELATÓRIOS: Score final e recomendações automáticas

## ESTRUTURA FINAL
```
tests/
├── index.js
├── package.json
├── stress-test.js
├── security-test.js
├── test-config.js
├── run-tests.js
├── example-usage.js
├── install-tests.sh
├── README-TESTES.md
├── RESUMO-IMPLEMENTACAO.md
└── test-auth.js
```

## COMANDOS FINAIS
```bash
cd tests/
npm test                    # Teste completo
npm run test:stress        # Apenas estresse
npm run test:security      # Apenas segurança
npm run test:quick         # Teste rápido
npm run test:auth          # Teste de autenticação
npm run test:examples      # Exemplos
npm run help               # Ajuda
```

## RESULTADO ESPERADO
- Score final 70-80/100
- Rate limiting funcionando
- Nenhuma vulnerabilidade crítica
- Detecção de pacotes perdidos
- Relatórios detalhados com recomendações

Implemente TUDO isso de forma funcional e bem documentada.
```

## 🎯 **PONTOS CRÍTICOS PARA DESTACAR**

### **1. AUTENTICAÇÃO REAL (MUITO IMPORTANTE)**
- A IA deve implementar registro e login real de usuário
- Usar token válido para testar rotas protegidas
- Não apenas tentar acessar sem autenticação

### **2. RATE LIMITING FUNCIONAL**
- Testar se está bloqueando corretamente
- Verificar se não está sendo bypassado
- Medir quantos requests foram bloqueados

### **3. PACOTES PERDIDOS**
- Detectar requests que falharam por timeout
- Diferenciar de requests bloqueados por rate limiting
- Calcular porcentagem de perda

### **4. VULNERABILIDADES DE SEGURANÇA**
- SQL Injection, XSS, Path Traversal
- Força bruta em login
- Bypass de autenticação
- Headers maliciosos

## 📊 **CRITÉRIOS DE AVALIAÇÃO**

### **Funcionalidade (40%)**
- ✅ Todos os testes funcionando
- ✅ Autenticação real implementada
- ✅ Rate limiting testado corretamente
- ✅ Vulnerabilidades detectadas

### **Organização (25%)**
- ✅ Estrutura de pastas organizada
- ✅ Comandos npm intuitivos
- ✅ Interface unificada
- ✅ Scripts de instalação

### **Documentação (20%)**
- ✅ README completo
- ✅ Exemplos práticos
- ✅ Troubleshooting
- ✅ Configuração avançada

### **Qualidade do Código (15%)**
- ✅ Código limpo e organizado
- ✅ Tratamento de erros
- ✅ Configurações flexíveis
- ✅ Relatórios detalhados

## 🚀 **COMO ENTREGAR**

1. **Implemente todos os arquivos** conforme especificado
2. **Teste se está funcionando** com `npm test`
3. **Documente qualquer problema** encontrado
4. **Crie um resumo** da implementação
5. **Execute e mostre resultados** dos testes

## 💡 **DICAS IMPORTANTES**

- **Comece pelo teste de estresse** - é mais simples
- **Implemente autenticação real** antes dos testes de segurança
- **Teste rate limiting** com requests suficientes
- **Use payloads maliciosos reais** para testes de segurança
- **Implemente retry logic** para rate limiting
- **Crie relatórios detalhados** com métricas

---

**🎯 OBJETIVO FINAL**: Uma suite de testes profissional que detecte problemas reais de segurança e performance no servidor!

**⚠️ IMPORTANTE**: Use apenas em ambientes de desenvolvimento/teste. NUNCA em produção!
