// Script para probar endpoints del backend
const axios = require('axios');

const BASE_URL = 'http://localhost:2001';

async function testEndpoints() {
  console.log('🧪 Probando endpoints del backend ServiceFrios...\n');
  
  try {
    // 1. Health Check
    console.log('1. 🔍 Health Check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health:', health.data);
    
    // 2. Login con credenciales por defecto
    console.log('\n2. 🔐 Login de administrador...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    console.log('✅ Login exitoso:', loginResponse.data.user.username);
    const token = loginResponse.data.token;
    
    // 3. Verificar perfil con token
    console.log('\n3. 👤 Verificar perfil...');
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Perfil obtenido:', profileResponse.data.user.role);
    
    // 4. Probar otros endpoints (placeholders)
    console.log('\n4. 📋 Probando endpoints de recursos...');
    const endpoints = [
      '/api/clientes',
      '/api/tecnicos', 
      '/api/servicios',
      '/api/equipos',
      '/api/admin'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ ${endpoint}:`, response.data.message || 'OK');
      } catch (error) {
        console.log(`⚠️  ${endpoint}: ${error.response?.status || 'Error'}`);
      }
    }
    
    console.log('\n🎉 Pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.response?.data || error.message);
  }
}

testEndpoints();