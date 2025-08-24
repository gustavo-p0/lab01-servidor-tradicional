## **PASSO 8: Execução e Testes**

### 8.1 Executar o Servidor

```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm start
```

### 8.2 Testar com cURL

```bash
# 1. Registrar usuário
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","username":"testuser","password":"123456","firstName":"João","lastName":"Silva"}'

# 2. Fazer login (salvar o token retornado)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user@test.com","password":"123456"}'



# 3. Criar tarefa (usar token do login)
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"title":"Minha Tarefa","description":"Descrição","priority":"high"}'

# 4. Listar tarefas
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 8.3 Teste de Carga com Apache Bench

#### Instalação
```bash
# Ubuntu/Debian
sudo apt install apache2-utils

# macOS
brew install httpd
```

#### Comando de Teste de Carga Extrema
```bash
# Teste com 100.000 requests e 20.000 simultâneos (máximo)
ab -n 100000 -c 20000 \
  -H "Authorization: Bearer SEU_TOKEN_JWT_AQUI" \
  http://localhost:3000/api/tasks
```

#### Parâmetros do Teste
- `-n 100000`: Total de requests
- `-c 20000`: Requests simultâneos (concurrent) - máximo suportado
- `-H`: Header de autorização com token JWT
- `-v 2`: Para mais detalhes durante o teste (opcional)

#### Resultados Esperados
Este teste simula carga extrema que sistemas tradicionais monolíticos têm dificuldade para suportar, demonstrando a necessidade de arquiteturas mais robustas para aplicações de alta escala.

---

## **PASSO 9: Análise e Documentação**

### 9.1 Análise Arquitetural

**Características Implementadas:**
- ✅ Arquitetura monolítica centralizada
- ✅ API REST com operações CRUD
- ✅ Autenticação JWT stateless
- ✅ Validação de dados robusta
- ✅ Persistência com SQLite

**Métricas de Performance Esperadas:**
- Latência: ~30-50ms por requisição
- Throughput: ~500-1000 req/sec
- Memória: ~50-100MB

**Limitações Identificadas:**
- Escalabilidade limitada (vertical apenas)
- Ponto único de falha
- Estado centralizado
- Sem distribuição de carga

### 9.2 Comparação com Próximas Arquiteturas

| Aspecto | Tradicional | gRPC | Microsserviços | Serverless |
|---------|-------------|------|----------------|------------|
| **Complexidade** | Baixa | Média | Alta | Média |
| **Performance** | Baseline | +60% | Variável | Variável |
| **Escalabilidade** | Limitada | Boa | Excelente | Automática |
| **Manutenção** | Simples | Média | Complexa | Mínima |

## Exercícios Complementares

Algumas atividades serão propostas para serem realizadas no código original, confira a descrição das tarefas na pasta docs neste repositório.

## Comandos de Execução

```bash
# Setup
npm install

# Desenvolvimento
npm run dev

# Produção
npm start
```

## Referências

<sup>[1]</sup> COULOURIS, George; DOLLIMORE, Jean; KINDBERG, Tim; BLAIR, Gordon. **Distributed Systems: Concepts and Design**. 5th ed. Boston: Pearson, 2012.

<sup>[2]</sup> TANENBAUM, Andrew S.; VAN STEEN, Maarten. **Distributed Systems: Principles and Paradigms**. 3rd ed. Boston: Pearson, 2017.

---

## Próximos Passos

Este roteiro estabelece a **base arquitetural** para os laboratórios seguintes:

- **Roteiro 2**: Migração para comunicação gRPC (performance e type safety)
- **Roteiro 3**: Decomposição em microsserviços (escalabilidade e resiliência)  
- **Roteiro 4**: Implementação serverless (auto-scaling e zero-ops)

