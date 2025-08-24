const rateLimit = require('express-rate-limit');
const rateLimitConfig = require('../config/rateLimit');

/**
 * Rate Limiting por Usuário
 * 
 * Aplica limites diferentes baseados no status de autenticação:
 * - Usuários autenticados: limites mais altos
 * - Usuários não autenticados: limites mais baixos
 */

// Rate limiter para usuários autenticados
const userRateLimit = rateLimit({
    windowMs: rateLimitConfig.windowMs * 60 * 1000, // minutos para milissegundos
    max: rateLimitConfig.authenticated.normal,
    message: {
        ...rateLimitConfig.messages.authenticated,
        retryAfter: Math.ceil(rateLimitConfig.windowMs * 60 / 1000) // segundos até reset
    },
    standardHeaders: rateLimitConfig.headers.standard,
    legacyHeaders: rateLimitConfig.headers.legacy,
    keyGenerator: (req) => {
        // Chave única por usuário + IP para maior segurança
        return req.user ? `${req.user.id}:${req.ip}` : req.ip;
    },
    skip: (req) => {
        // Pula rate limiting para rotas configuradas
        return rateLimitConfig.skipPaths.some(path => 
            req.path === path || req.path.startsWith(path.replace('/*', ''))
        );
    },
    handler: (req, res) => {
        res.status(429).json({
            ...rateLimitConfig.messages.authenticated,
            retryAfter: Math.ceil(rateLimitConfig.windowMs * 60 / 1000),
            userId: req.user?.id,
            ip: req.ip
        });
    }
});

// Rate limiter para usuários não autenticados
const publicRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por 15 min
    message: {
        success: false,
        message: 'Limite de requisições excedido para usuários não autenticados',
        retryAfter: Math.ceil(15 * 60 / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    skip: (req) => {
        return req.path === '/health' || req.path.startsWith('/api-docs');
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Limite de requisições excedido para usuários não autenticados',
            retryAfter: Math.ceil(15 * 60 / 1000),
            ip: req.ip
        });
    }
});

// Rate limiter específico para autenticação (mais restritivo)
const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas por 15 min
    message: {
        success: false,
        message: 'Muitas tentativas de autenticação. Tente novamente em alguns minutos.',
        retryAfter: Math.ceil(15 * 60 / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    skip: (req) => req.path === '/health',
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Muitas tentativas de autenticação. Tente novamente em alguns minutos.',
            retryAfter: Math.ceil(15 * 60 / 1000),
            ip: req.ip
        });
    }
});

// Middleware que aplica rate limiting baseado no status de autenticação
const adaptiveRateLimit = (req, res, next) => {
    // Se o usuário está autenticado, usa userRateLimit
    if (req.user) {
        return userRateLimit(req, res, next);
    }
    
    // Se não está autenticado, usa publicRateLimit
    return publicRateLimit(req, res, next);
};

module.exports = {
    adaptiveRateLimit,
    userRateLimit,
    publicRateLimit,
    authRateLimit
};
