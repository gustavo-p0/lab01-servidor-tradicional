## **Escalabilidade -  Como esta arquitetura se comportaria com 1000 usuários simultâneos?**

A arquitetura atual não suportaria porque é monolítica, com um banco de dados de arquivo, único e sem concorrência. Além disso, o rate limiting está sendo feito também em memória e não é possível fazer o balanceamento dessa aplicação, pois poderia rodar apenas em um servidor. A aplicação atual está construída de uma forma que impede a escalabilidade e a distribuição, por estar muito dependente de da memória do processo, e por conta de usar um banco de dados baseado em arquivos, que trava facilmente com múltiplas requisições concorrentes.

**Limites práticos:** Máximo ~100-200 usuários simultâneos, com SQLite travando com múltiplas escritas concorrentes e memória do processo saturando rapidamente.

## **Disponibilidade - Quais são os pontos de falha identificados?**

Identifica-se severos pontos de falha, dentre eles: um único ponto de falha, uso de banco de dados por arquivo, dependência de memória local para rate-limiting e cache, ausência de health checks externos. Além disso, é possível identificar outros pontos que calcanham a disponibilidade, dentre eles: persistência de logs em disco, falta de redudância de dados, dependência única de rede.

**Pontos críticos:** Single Point of Failure derruba todo o sistema, SQLite corrompido perde todos os dados, rate limiting perde estado se servidor reinicia, sem detecção automática de falhas.

## **Performance - Onde estão os possíveis gargalos do sistema?**

Dentre os gargalos do sistema no estado atual, estão a falta de otimização das consultas do banco de dados, o processamento síncrono, o rate limiting em memória, cache em memória.

**Gargalos principais:** SQLite sem índices com queries sequenciais, processamento síncrono bloqueando thread principal, rate limiting em memória com complexidade O(n), logs síncronos bloqueando resposta, ausência de cache forçando sempre acesso ao banco.

**Estimativas de performance:** Latência de 50-200ms (aceitável), throughput de ~100 req/s (baixo), memória de ~50-100MB por instância.

## **Manutenção: Como seria o processo de atualização em produção?**

O processo de atualização em produção demendaria a interrupção do serviço por completo. Atualmente, não existe nenhum mecanismo de rollback, o deploy e o backup são manuais, e os logs são locais. O processo de atualização iria seguir os seguintes passos, provavelmente:

1. Parar servidor
2. Fazer backup do SQLite
3. Deploy novo código
4. Reiniciar
5. Verificar logs
6. Realizar correções necessárias
7. Fazer o deploy com as novas mudanças

**Problemas críticos:** Downtime obrigatório derruba serviço, sem rollback automático, deploy manual sem CI/CD, backup manual do SQLite, logs locais dificultando debug em produção.

## **Evolução: Que mudanças seriam necessárias para suportar múltiplas regiões?**

Para que a aplicação opere de forma eficiente e resiliente em um ambiente distribuído geograficamente, a mudança precisa ser fundamental:

### 1. Padrões de Arquitetura e Dados

> **Serviços Desacoplados e Independentes (Padrão Microservices/SOA)**

Em vez de um monólito, a aplicação deve ser quebrada em serviços menores e autônomos. Cada serviço deverá ter uma responsabilidade única e poderá ser desenvolvido, implantado e escalado de forma independente. 
Isso permite que equipes diferentes trabalhem em paralelo e que apenas as partes necessárias do sistema sejam escaladas em cada região.

> **Serviços sem Estado (Stateless Services)**

**Este é o padrão mais crítico para escalabilidade global.** A lógica da aplicação não deve guardar nenhuma informação sobre sessões ou dados de usuários na própria memória do processo ou disco local. 

Qualquer estado (como login de usuário ou um carrinho de compras) deve ser externalizado para um repositório de dados compartilhado e distribuído (como um banco de dados ou um cache distribuído). 

Isso garante que qualquer requisição de um usuário pode ser atendida por qualquer servidor, em qualquer região, a qualquer momento.

> **Replicação e Consistência de Dados (Data Replication & Consistency Models)**

O banco de dados não pode mais ser um arquivo único. Ele precisa ser um sistema que permita a replicação dos dados através das diferentes regiões. Você precisará escolher um modelo de consistência:

    - Consistência Forte: Garante que todas as regiões vejam os mesmos dados ao mesmo tempo, mas pode aumentar a latência.

    - Consistência Eventual: Permite uma latência menor, mas aceita que, por um curto período, diferentes regiões possam ver versões ligeiramente diferentes dos dados. 


**A escolha depende criticamente do caso de uso de cada informação.**

> **Cache Distribuído (Distributed Caching)**


Para reduzir a latência e a carga no banco de dados, um padrão de cache distribuído é fundamental. 

Em vez de um cache em memória local, utiliza-se um serviço de cache externo que pode ser acessado por todas as instâncias da aplicação, independentemente da região. Isso aproxima os dados frequentemente acessados dos usuários.

### 2. Padrões de Infraestrutura e Roteamento

> **Balanceamento de Carga Global (Global Server Load Balancing - GSLB)**

Não basta ter um balanceador de carga local. É preciso um sistema que direcione o tráfego do usuário para a região geograficamente mais próxima ou para a mais saudável (com menor latência/erros). Isso é geralmente implementado com roteamento baseado em DNS ou Anycast.

> **Infraestrutura como Código (Infrastructure as Code - IaC)**

Toda a infraestrutura (servidores, redes, bancos de dados) deve ser definida e gerenciada através de código. 

Isso garante que você possa replicar ambientes idênticos em múltiplas regiões de forma rápida, consistente e com menos erros manuais.

> **Orquestração de Containers (Container Orchestration)** 

Ao invés de gerenciar máquinas virtuais, os serviços são "empacotados" em containers. 

Um orquestrador gerencia o ciclo de vida desses containers (implantação, escalonamento, recuperação de falhas) de forma declarativa e automatizada em todas as regiões, abstraindo a complexidade da infraestrutura subjacente.

### 3. Padrões de Código e Comunicação

> **Quebra de Circuito (Circuit Breaker)**


Quando um serviço tenta se comunicar com outro que está falhando, em vez de continuar tentando e consumindo recursos, o "circuito abre". 

Por um tempo, as chamadas para o serviço falho são interrompidas instantaneamente, evitando falhas em cascata e permitindo que o serviço problemático se recupere.

> **Descoberta de Serviços (Service Discovery)**

Em um ambiente dinâmico onde serviços sobem e descem o tempo todo, eles não podem ter endereços de IP fixos. 

Um mecanismo de descoberta de serviços permite que uma aplicação encontre dinamicamente a localização de rede de outros serviços dos quais ela depende.

> **Observabilidade (Observability Patterns)**

Monitorar um sistema distribuído é complexo. É preciso adotar três pilares:

    1. Logs Centralizados: Todos os logs de todos os serviços em todas as regiões são enviados para um sistema centralizado para análise.

    2. Métricas: Coleta de dados numéricos (ex: tempo de resposta, uso de CPU) de todo o sistema para monitoramento e alertas.

    3. Rastreamento Distribuído (Distributed Tracing): Permite seguir o caminho de uma única requisição através de múltiplos serviços, identificando gargalos e pontos de falha em toda a cadeia de chamadas.

Ao adotar esses padrões, a aplicação deixará de ser um sistema frágil e centralizado, e no processo de se tornar uma plataforma distribuída, ganhará robustez, resiliência e ágil para escalar globalmente, com capacidade de atender usuários em múltiplas regiões com alta performance e disponibilidade.

