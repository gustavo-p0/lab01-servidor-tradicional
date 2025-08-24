const express = require('express');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const database = require('../database/database');
const { validate } = require('../middleware/validation');
const { authLogger } = require('../config/logger');
const { authRateLimit } = require('../middleware/rateLimit');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 description: Nome de usuário único
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Senha do usuário
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Primeiro nome
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Sobrenome
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         token:
 *                           type: string
 *                           description: JWT token de autenticação
 *       409:
 *         description: Email ou username já existe
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
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', authRateLimit, validate('register'), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { email, username, password, firstName, lastName } = req.body;
        
        authLogger.info('Tentativa de registro', { 
            email, 
            username, 
            firstName, 
            lastName,
            ip: req.ip 
        });

        // Verificar se usuário já existe
        const existingUser = await database.get(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUser) {
            authLogger.warn('Tentativa de registro com credenciais existentes', { 
                email, 
                username, 
                ip: req.ip 
            });
            
            return res.status(409).json({
                success: false,
                message: 'Email ou username já existe'
            });
        }

        // Criar usuário
        const userData = { id: uuidv4(), email, username, password, firstName, lastName };
        const user = new User(userData);
        await user.hashPassword();

        await database.run(
            'INSERT INTO users (id, email, username, password, firstName, lastName) VALUES (?, ?, ?, ?, ?, ?)',
            [user.id, user.email, user.username, user.password, user.firstName, user.lastName]
        );

        const token = user.generateToken();
        const duration = Date.now() - startTime;

        authLogger.info('Usuário registrado com sucesso', { 
            userId: user.id, 
            email, 
            username, 
            duration: `${duration}ms`,
            ip: req.ip 
        });

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            data: { user: user.toJSON(), token }
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        
        authLogger.error('Erro no registro de usuário', error, { 
            email: req.body.email, 
            username: req.body.username,
            duration: `${duration}ms`,
            ip: req.ip 
        });
        
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autenticar usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email ou username do usuário
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         token:
 *                           type: string
 *                           description: JWT token de autenticação
 *       401:
 *         description: Credenciais inválidas
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
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authRateLimit, validate('login'), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { identifier, password } = req.body;
        
        authLogger.info('Tentativa de login', { 
            identifier, 
            ip: req.ip 
        });

        const userData = await database.get(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [identifier, identifier]
        );

        if (!userData) {
            authLogger.warn('Tentativa de login com usuário inexistente', { 
                identifier, 
                ip: req.ip 
            });
            
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        const user = new User(userData);
        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            authLogger.warn('Tentativa de login com senha incorreta', { 
                identifier, 
                userId: userData.id,
                ip: req.ip 
            });
            
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        const token = user.generateToken();
        const duration = Date.now() - startTime;

        authLogger.info('Login realizado com sucesso', { 
            userId: user.id, 
            identifier, 
            duration: `${duration}ms`,
            ip: req.ip 
        });

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: { user: user.toJSON(), token }
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        
        authLogger.error('Erro no login', error, { 
            identifier: req.body.identifier,
            duration: `${duration}ms`,
            ip: req.ip 
        });
        
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

module.exports = router;