const { PrismaClient } = require('@prisma/client');
const authConfig = require('../src/config/auth');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 === VERIFICANDO USUARIOS EN LA BASE DE DATOS ===');
    
    const usuarios = await prisma.usuario.findMany({
      include: {
        admin: true,
        tecnico: true,
        cliente: true
      }
    });
    
    console.log(`📊 Total de usuarios: ${usuarios.length}`);
    console.log('');
    
    for (const usuario of usuarios) {
      console.log(`👤 Usuario: ${usuario.username}`);
      console.log(`📧 Email: ${usuario.email}`);
      console.log(`🎭 Role: ${usuario.role}`);
      console.log(`🟢 Activo: ${usuario.isActive}`);
      
      // Mostrar perfil asociado
      if (usuario.admin) {
        console.log(`👨‍💼 Admin: ${usuario.admin.nombre} ${usuario.admin.apellido}`);
      }
      if (usuario.tecnico) {
        console.log(`🔧 Técnico: ${usuario.tecnico.nombre} ${usuario.tecnico.apellido}`);
      }
      if (usuario.cliente) {
        console.log(`👥 Cliente: ${usuario.cliente.nombre} ${usuario.cliente.apellido}`);
      }
      
      console.log('---');
    }
    
    // Verificar si existe un cliente específico
    console.log('🔍 Verificando cliente con ID 1...');
    const cliente = await prisma.cliente.findUnique({
      where: { id: 1 },
      include: { usuario: true }
    });
    
    if (cliente) {
      console.log(`✅ Cliente encontrado: ${cliente.nombre} ${cliente.apellido}`);
      if (cliente.usuario) {
        console.log(`👤 Username: ${cliente.usuario.username}`);
        console.log(`📧 Email: ${cliente.usuario.email}`);
        console.log(`🟢 Activo: ${cliente.usuario.isActive}`);
      } else {
        console.log('⚠️ Cliente no tiene usuario asociado');
      }
    } else {
      console.log('❌ Cliente con ID 1 no encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error verificando usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();