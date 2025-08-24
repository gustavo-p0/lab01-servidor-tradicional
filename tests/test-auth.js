#!/usr/bin/env node

const axios = require('axios');

/**
 * Teste Rápido de Autenticação
 * 
 * Verifica se o sistema de autenticação está funcionando
 * e se conseguimos obter um token válido
 */

async function testAuth() {
    const baseURL = 'http://localhost:3000';
    
    console.log('🔐 Testando Autenticação...');
    console.log('='.repeat(40));
    
    try {
        // Aguarda um pouco para não ser bloqueado
        console.log('⏳ Aguardando 3 segundos para evitar rate limiting...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Registra usuário
        console.log('📝 Registrando usuário...');
        const registerResponse = await axios.post(`${baseURL}/api/auth/register`, {
            username: `test_auth_${Date.now()}`,
            email: `test_auth_${Date.now()}@example.com`,
            password: 'TestPassword123!'
        });
        
        if (registerResponse.data.success) {
            console.log('✅ Usuário registrado com sucesso');
            console.log(`   ID: ${registerResponse.data.user.id}`);
            console.log(`   Username: ${registerResponse.data.user.username}`);
        } else {
            console.log('❌ Falha no registro');
            console.log(`   Erro: ${registerResponse.data.message}`);
            return;
        }
        
        // Aguarda um pouco
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Faz login
        console.log('🔑 Fazendo login...');
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
            username: `test_auth_${Date.now()}`,
            password: 'TestPassword123!'
        });
        
        if (loginResponse.data.success) {
            console.log('✅ Login realizado com sucesso');
            console.log(`   Token: ${loginResponse.data.token.substring(0, 50)}...`);
            
            // Testa acesso a rota autenticada
            console.log('🔒 Testando acesso a rota autenticada...');
            const tasksResponse = await axios.get(`${baseURL}/api/tasks`, {
                headers: { 'Authorization': `Bearer ${loginResponse.data.token}` }
            });
            
            if (tasksResponse.status === 200) {
                console.log('✅ Acesso autorizado a /api/tasks');
                console.log(`   Status: ${tasksResponse.status}`);
            } else {
                console.log('⚠️ Status inesperado:', tasksResponse.status);
            }
            
        } else {
            console.log('❌ Falha no login');
            console.log(`   Erro: ${loginResponse.data.message}`);
        }
        
    } catch (error) {
        console.error('❌ Erro durante teste:', error.message);
        
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Mensagem: ${error.response.data?.message || 'Sem mensagem'}`);
        }
    }
    
    console.log('='.repeat(40));
    console.log('🏁 Teste de autenticação concluído');
}

// Executa se chamado diretamente
if (require.main === module) {
    testAuth().catch(console.error);
}

module.exports = testAuth;
