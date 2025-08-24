const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Task = require('../models/Task');
const database = require('../database/database');
const { authMiddleware } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');
const { validate } = require('../middleware/validation');
const { logger } = require('../config/logger');
const { adaptiveRateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rate limiting adaptativo por usuário
router.use(adaptiveRateLimit);

/**
 * @swagger
 * /api/tasks/stats/summary:
 *   get:
 *     summary: Obter estatísticas das tarefas do usuário
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas recuperadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total de tarefas
 *                         completed:
 *                           type: integer
 *                           description: Tarefas completadas
 *                         pending:
 *                           type: integer
 *                           description: Tarefas pendentes
 *                         completionRate:
 *                           type: string
 *                           description: Taxa de conclusão em porcentagem
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats/summary', async (req, res) => {
    const startTime = Date.now();
    
    try {
        logger.info('Buscando estatísticas do usuário', { 
            userId: req.user.id,
            endpoint: '/stats/summary'
        });

        const stats = await database.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending
            FROM tasks WHERE userId = ?
        `, [req.user.id]);

        const duration = Date.now() - startTime;
        
        logger.info('Estatísticas recuperadas com sucesso', { 
            userId: req.user.id,
            total: stats.total,
            completed: stats.completed,
            pending: stats.pending,
            duration: `${duration}ms`
        });

        res.json({
            success: true,
            data: {
                ...stats,
                completionRate: stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error('Erro ao buscar estatísticas', error, { 
            userId: req.user.id,
            duration: `${duration}ms`
        });
        
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Listar tarefas do usuário com filtros avançados
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: completed
 *         schema:
 *           type: boolean
 *         description: Filtrar por status (true = completada, false = pendente)
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filtrar por prioridade
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar em título e descrição
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim (YYYY-MM-DD)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, title, priority, completed]
 *           default: createdAt
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Ordem da ordenação
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Limite de itens por página
 *     responses:
 *       200:
 *         description: Lista de tarefas recuperada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         tasks:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Task'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                             limit:
 *                               type: integer
 *                             total:
 *                               type: integer
 *                             pages:
 *                               type: integer
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', cacheMiddleware, async (req, res) => {
    const startTime = Date.now();
    
    try {
        let { 
            completed, 
            priority, 
            search,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
            page = 1, 
            limit = 20
        } = req.query;
        
        logger.info('Listando tarefas do usuário', { 
            userId: req.user.id,
            filters: { completed, priority, search, startDate, endDate, sortBy, sortOrder, page, limit },
            endpoint: '/tasks'
        });

        if (page <= 0) page = 1;
        if (limit <= 0) limit = 20; 

        const offset = (page - 1) * limit;

        let sql = 'SELECT * FROM tasks WHERE userId = ?';
        const params = [req.user.id];

        // Filtro de status (completado/pendente)
        if (completed !== undefined) {
            sql += ' AND completed = ?';
            params.push(completed === 'true' ? 1 : 0);
        }
        
        // Filtro de prioridade (suporte a múltiplas)
        if (priority) {
            if (Array.isArray(priority) || priority.includes(',')) {
                const priorities = Array.isArray(priority) ? priority : priority.split(',');
                const placeholders = priorities.map(() => '?').join(',');
                sql += ` AND priority IN (${placeholders})`;
                params.push(...priorities);
            } else {
                sql += ' AND priority = ?';
                params.push(priority);
            }
        }

        // Filtro de busca por texto (título e descrição)
        if (search && search.trim()) {
            sql += ' AND (title LIKE ? OR description LIKE ?)';
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm);
        }

        // Filtros de data
        if (startDate) {
            sql += ' AND DATE(createdAt) >= DATE(?)';
            params.push(startDate);
        }
        
        if (endDate) {
            sql += ' AND DATE(createdAt) <= DATE(?)';
            params.push(endDate);
        }

        // Validação e sanitização da ordenação
        const allowedSortFields = ['createdAt', 'title', 'priority', 'completed'];
        const allowedSortOrders = ['ASC', 'DESC'];
        
        const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const finalSortOrder = allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        // Ordenação
        sql += ` ORDER BY ${finalSortBy} ${finalSortOrder}`;
        
        // Se ordenar por prioridade, adicionar ordenação secundária
        if (finalSortBy === 'priority') {
            const priorityOrder = "CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END";
            sql += `, ${priorityOrder} ASC`;
        }
        
        // Se ordenar por título, adicionar ordenação secundária por data
        if (finalSortBy === 'title') {
            sql += ', createdAt DESC';
        }

        // Paginação
        sql += ` LIMIT ${limit}`;
        sql += ` OFFSET ${offset}`;

        const rows = await database.all(sql, params);
        const tasks = rows.map(row => new Task({...row, completed: row.completed === 1}));

        // Contar total de resultados para paginação
        let countSql = 'SELECT COUNT(*) as total FROM tasks WHERE userId = ?';
        const countParams = [req.user.id];
        
        // Aplicar os mesmos filtros na contagem
        if (completed !== undefined) {
            countSql += ' AND completed = ?';
            countParams.push(completed === 'true' ? 1 : 0);
        }
        
        if (priority) {
            if (Array.isArray(priority) || priority.includes(',')) {
                const priorities = Array.isArray(priority) ? priority : priority.split(',');
                const placeholders = priorities.map(() => '?').join(',');
                countSql += ` AND priority IN (${placeholders})`;
                countParams.push(...priorities);
            } else {
                countSql += ' AND priority = ?';
                countParams.push(priority);
            }
        }
        
        if (search && search.trim()) {
            countSql += ' AND (title LIKE ? OR description LIKE ?)';
            const searchTerm = `%${search.trim()}%`;
            countParams.push(searchTerm, searchTerm);
        }
        
        if (startDate) {
            countSql += ' AND DATE(createdAt) >= DATE(?)';
            countParams.push(startDate);
        }
        
        if (endDate) {
            countSql += ' AND DATE(createdAt) <= DATE(?)';
            countParams.push(endDate);
        }

        const totalResult = await database.get(countSql, countParams);
        const total = totalResult.total;

        const duration = Date.now() - startTime;
        
        logger.info('Tarefas listadas com sucesso', { 
            userId: req.user.id,
            totalResults: tasks.length,
            total: total,
            filters: { completed, priority, search, startDate, endDate, sortBy, sortOrder, page, limit },
            duration: `${duration}ms`
        });

        res.json({
            success: true,
            data: tasks.map(task => task.toJSON()),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            },
            filters: {
                applied: {
                    completed: completed !== undefined ? completed === 'true' : null,
                    priority: priority || null,
                    search: search || null,
                    startDate: startDate || null,
                    endDate: endDate || null,
                    sortBy: finalSortBy,
                    sortOrder: finalSortOrder
                }
            }
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error('Erro ao listar tarefas', error, { 
            userId: req.user.id,
            filters: req.query,
            duration: `${duration}ms`
        });
        
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Criar nova tarefa
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Título da tarefa
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Descrição da tarefa
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Prioridade da tarefa
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Data de vencimento (YYYY-MM-DD)
 *     responses:
 *       201:
 *         description: Tarefa criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         task:
 *                           $ref: '#/components/schemas/Task'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const taskData = { 
            id: uuidv4(), 
            ...req.body, 
            userId: req.user.id 
        };
        
        logger.info('Criando nova tarefa', { 
            userId: req.user.id,
            taskTitle: req.body.title,
            priority: req.body.priority
        });
        
        const task = new Task(taskData);
        const validation = task.validate();
        
        if (!validation.isValid) {
            logger.warn('Validação de tarefa falhou', { 
                userId: req.user.id,
                errors: validation.errors,
                taskData: req.body
            });
            
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors: validation.errors
            });
        }

        await database.run(
            'INSERT INTO tasks (id, title, description, priority, userId) VALUES (?, ?, ?, ?, ?)',
            [task.id, task.title, task.description, task.priority, task.userId]
        );

        const duration = Date.now() - startTime;
        
        logger.info('Tarefa criada com sucesso', { 
            userId: req.user.id,
            taskId: task.id,
            taskTitle: task.title,
            duration: `${duration}ms`
        });

        res.status(201).json({
            success: true,
            message: 'Tarefa criada com sucesso',
            data: task.toJSON()
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error('Erro ao criar tarefa', error, { 
            userId: req.user.id,
            taskData: req.body,
            duration: `${duration}ms`
        });
        
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Buscar tarefa por ID
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da tarefa
 *     responses:
 *       200:
 *         description: Tarefa encontrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         task:
 *                           $ref: '#/components/schemas/Task'
 *       404:
 *         description: Tarefa não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', async (req, res) => {
    try {
        const row = await database.get(
            'SELECT * FROM tasks WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );

        if (!row) {
            return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada'
            });
        }

        const task = new Task({...row, completed: row.completed === 1});
        res.json({
            success: true,
            data: task.toJSON()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Atualizar tarefa
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da tarefa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Título da tarefa
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Descrição da tarefa
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Prioridade da tarefa
 *               completed:
 *                 type: boolean
 *                 description: Status de conclusão
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Data de vencimento (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Tarefa atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         task:
 *                           $ref: '#/components/schemas/Task'
 *       404:
 *         description: Tarefa não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', async (req, res) => {
    try {
        const { title, description, completed, priority } = req.body;
        
        const result = await database.run(
            'UPDATE tasks SET title = ?, description = ?, completed = ?, priority = ? WHERE id = ? AND userId = ?',
            [title, description, completed ? 1 : 0, priority, req.params.id, req.user.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada'
            });
        }

        const updatedRow = await database.get(
            'SELECT * FROM tasks WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );

        const task = new Task({...updatedRow, completed: updatedRow.completed === 1});
        
        res.json({
            success: true,
            message: 'Tarefa atualizada com sucesso',
            data: task.toJSON()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Deletar tarefa
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da tarefa
 *     responses:
 *       200:
 *         description: Tarefa deletada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: "Tarefa deletada com sucesso"
 *       404:
 *         description: Tarefa não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', async (req, res) => {
    try {
        const result = await database.run(
            'DELETE FROM tasks WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Tarefa deletada com sucesso'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

module.exports = router;