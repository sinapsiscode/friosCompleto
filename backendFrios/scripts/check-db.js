// Script para verificar conexión a PostgreSQL
const { PrismaClient } = require('@prisma/client');

async function checkConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando conexión a PostgreSQL...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa a PostgreSQL');
    
    // Verificar si las tablas existen
    const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('📋 Tablas encontradas:', result.length);
    
    if (result.length === 0) {
      console.log('⚠️  No hay tablas. Ejecuta: npx prisma migrate dev');
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n🔧 Soluciones posibles:');
    console.log('1. Verificar que PostgreSQL esté corriendo');
    console.log('2. Verificar credenciales en .env');
    console.log('3. Para WSL, usar IP de Windows en lugar de localhost');
    console.log('4. Ejecutar: ip route show | grep default');
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection();