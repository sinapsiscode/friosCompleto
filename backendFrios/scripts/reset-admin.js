// Script para resetear y crear usuario admin con nuevas credenciales
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdmin() {
  console.log('🔄 Reseteando usuario administrador...');
  
  try {
    // Eliminar usuarios existentes
    console.log('🗑️ Eliminando usuarios existentes...');
    await prisma.administrador.deleteMany();
    await prisma.usuario.deleteMany();
    
    // Crear nuevo usuario administrador
    console.log('👤 Creando nuevo usuario administrador...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const admin = await prisma.usuario.create({
      data: {
        username: 'admin/servicefrios',
        email: 'admin@servicefrios.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        admin: {
          create: {
            nombre: 'Administrador',
            apellido: 'ServiceFrios',
            email: 'admin@servicefrios.com',
            telefono: '+51999999999'
          }
        }
      }
    });
    
    console.log('✅ Usuario administrador reseteado exitosamente');
    console.log('📋 Nuevas credenciales:');
    console.log('   Usuario: admin/servicefrios');
    console.log('   Contraseña: 123456');
    console.log('   Email:', admin.email);
    
  } catch (error) {
    console.error('❌ Error durante el reset:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();