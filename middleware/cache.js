const cache = new Map();
const TTL = 5 * 60 * 1000; // 5 minutos
const { logger } = require('../config/logger');


// Middleware de cache
const cacheMiddleware = (req, res, next) => {
    const key = `tasks:${req.user.id}:${JSON.stringify(req.query)}`;
    const cached = cache.get(key);

    const isTTLValid = () => Date.now() - cached.timestamp < TTL;
    
    if (cached && isTTLValid()) {
        logger.info('Usando cache em memória da lista de tarefas do usuário', { 
            userId: req.user.id,
            query: req.query,
            endpoint: '/tasks'
        });        
        return res.json(cached.data);
    }
    
    const originalJson = res.json;
    res.json = function(data) {
        logger.info('Defininindo cache em memória da lista de tarefas do usuário', { 
            userId: req.user.id,
            query: req.query,
            endpoint: '/tasks'
        });
        cache.set(key, { data, timestamp: Date.now() });
        originalJson.call(this, data);
    };
    
    next();
};

module.exports = {cacheMiddleware}