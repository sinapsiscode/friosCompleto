// Seed mínimo - Solo crear usuario administrador
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function adminOnlySeed() {
  console.log('🌱 Creando usuario administrador...');
  
  try {
    // Solo crear usuario administrador
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
    
    console.log('✅ Usuario administrador creado exitosamente');
    console.log('📋 Credenciales:');
    console.log('   Usuario: admin/servicefrios');
    console.log('   Contraseña: 123456');
    console.log('   Email:', admin.email);
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  El usuario admin ya existe');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

adminOnlySeed();