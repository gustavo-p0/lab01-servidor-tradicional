const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { adaptiveRateLimit } = require('./middleware/rateLimit');

const config = require('./config');
const database = require('./database/database');
const { logger, requestLogger } = require('./config/logger');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

/**
 * Servidor de Aplicação Tradicional
 * 
 * Implementa arquitetura cliente-servidor conforme Coulouris et al. (2012):
 * - Centralização do estado da aplicação
 * - Comunicação Request-Reply via HTTP
 * - Processamento síncrono das requisições
 */

const app = express();

// Middleware de segurança
app.use(helmet());

app.use(cors());

// Parsing de dados
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Logging estruturado de requisições
app.use(requestLogger);

// Rate limiting adaptativo para rotas públicas
app.use(adaptiveRateLimit);

// Rotas principais
app.get('/', (req, res) => {
    res.json({
        service: 'Task Management API',
        version: '1.0.0',
        architecture: 'Traditional Client-Server',
        endpoints: {
            auth: ['POST /api/auth/register', 'POST /api/auth/login'],
            tasks: [
                'GET /api/tasks - Listar tarefas com filtros avançados',
                'POST /api/tasks - Criar tarefa',
                'GET /api/tasks/:id - Buscar tarefa por ID',
                'PUT /api/tasks/:id - Atualizar tarefa',
                'DELETE /api/tasks/:id - Deletar tarefa',
                'GET /api/tasks/stats/summary - Estatísticas do usuário'
            ]
        },
        filters: {
            'GET /api/tasks': {
                query: {
                    completed: 'boolean (true/false)',
                    priority: 'string ou array (high,medium,low)',
                    search: 'string (busca em título e descrição)',
                    startDate: 'YYYY-MM-DD',
                    endDate: 'YYYY-MM-DD',
                    sortBy: 'createdAt|title|priority|completed',
                    sortOrder: 'ASC|DESC',
                    page: 'number (padrão: 1)',
                    limit: 'number (padrão: 20)'
                }
            }
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);


// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Task Management API - Documentação'
}));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado'
    });
});

// Error handler global
app.use((error, req, res, next) => {
    logger.error('Erro global', error, {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id
    });
    
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    });
});

// Inicialização
async function startServer() {
    try {
        await database.init();
        
        app.listen(config.port, () => {
            logger.info('Servidor iniciado com sucesso', {
                port: config.port,
                environment: process.env.NODE_ENV || 'development',
                uptime: process.uptime()
            });
        logger.info('Health check endpoint disponível', {
            path: '/health',
            method: 'GET',
            description: 'Retorna status 200 e mensagem simples para verificação de saúde do serviço',
            environment: process.env.NODE_ENV || 'development',
            port: config.port
        });
        const swaggerUrl = `http://localhost:${config.port}/api-docs`;
        logger.info(`Swagger API docs disponível: ${swaggerUrl}`, {
            path: '/api-docs',
            url: swaggerUrl,
            method: 'GET',
            description: 'Interface interativa de documentação da API',
            environment: process.env.NODE_ENV || 'development',
            port: config.port
        });
        });
    } catch (error) {
        logger.error('Falha na inicialização do servidor', error);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = app;