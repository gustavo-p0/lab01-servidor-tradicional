const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Formato personalizado para logs
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return JSON.stringify({
            timestamp,
            level: level.toUpperCase(),
            message,
            ...meta
        });
    })
);

// Configuração dos transportes
const transports = [
    // Console para desenvolvimento
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }),
    
    // Arquivo de logs de erro
    new DailyRotateFile({
        filename: path.join('logs', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
        format: logFormat
    }),
    
    // Arquivo de logs combinados
    new DailyRotateFile({
        filename: path.join('logs', 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: logFormat
    })
];

// Logger principal
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exitOnError: false
});

// Middleware para logging de requisições
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress,
            userId: req.user?.id || 'anonymous'
        };
        
        if (res.statusCode >= 400) {
            logger.warn('HTTP Request', logData);
        } else {
            logger.info('HTTP Request', logData);
        }
    });
    
    next();
};

// Logger para operações de banco
const dbLogger = {
    info: (message, meta = {}) => logger.info(message, { ...meta, component: 'database' }),
    error: (message, error, meta = {}) => logger.error(message, { 
        ...meta, 
        component: 'database',
        error: error.message,
        stack: error.stack 
    }),
    warn: (message, meta = {}) => logger.warn(message, { ...meta, component: 'database' })
};

// Logger para autenticação
const authLogger = {
    info: (message, meta = {}) => logger.info(message, { ...meta, component: 'auth' }),
    error: (message, error, meta = {}) => logger.error(message, { 
        ...meta, 
        component: 'auth',
        error: error.message,
        stack: error.stack 
    }),
    warn: (message, meta = {}) => logger.warn(message, { ...meta, component: 'auth' })
};


module.exports = {
    // Configurações do servidor
    port: process.env.PORT || 3000,
    
    // JWT
    jwtSecret: process.env.JWT_SECRET || 'seu-secret-aqui',
    jwtExpiration: '24h',
    
    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 1000, // máximo 1000 requests por IP
        userMax: 500, // máximo 500 requests por usuário autenticado
        authMax: 5, // máximo 5 tentativas de auth por IP
        writeMax: 100 // máximo 100 operações de escrita por usuário
    },
    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        maxFiles: process.env.LOG_MAX_FILES || '30d',
        maxSize: process.env.LOG_MAX_SIZE || '20m'
    }
};