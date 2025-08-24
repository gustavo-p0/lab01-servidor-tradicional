/**
 * Configurações de Rate Limiting
 * 
 * Valores configuráveis por ambiente para facilitar ajustes
 * sem necessidade de modificar o código
 */

const config = {
    // Janela de tempo para rate limiting (em minutos)
    windowMs: 15,
    
    // Limites por usuário autenticado
    authenticated: {
        normal: process.env.RATE_LIMIT_AUTH_NORMAL || 500,      // usuários normais
    },
    
    // Limites para usuários não autenticados
    public: {
        general: process.env.RATE_LIMIT_PUBLIC_GENERAL || 100,  // rotas públicas
        auth: process.env.RATE_LIMIT_PUBLIC_AUTH || 5,          // tentativas de auth
    },
    
    // Headers de rate limiting
    headers: {
        standard: true,    // X-RateLimit-* headers
        legacy: false,     // Deprecated headers
    },
    
    // Rotas que devem pular rate limiting
    skipPaths: [
        '/health',
        '/api-docs',
        '/api-docs/*'
    ],
    
    // Mensagens de erro personalizadas
    messages: {
        authenticated: {
            success: false,
            message: 'Limite de requisições excedido para este usuário',
        },
        public: {
            success: false,
            message: 'Limite de requisições excedido para usuários não autenticados',
        },
        auth: {
            success: false,
            message: 'Muitas tentativas de autenticação. Tente novamente em alguns minutos.',
        }
    }
};

module.exports = config;
