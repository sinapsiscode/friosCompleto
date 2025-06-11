// Seed simplificado para poblar solo con datos mínimos
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function simpleSeed() {
  console.log('🌱 Iniciando seed simplificado...');
  
  try {
    // 1. Crear usuario administrador
    console.log('👤 Creando usuario administrador...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.usuario.create({
      data: {
        username: 'admin',
        email: 'admin@servicefrios.com',
        password: hashedPassword,
        role: 'ADMIN',
        nombre: 'Administrador',
        apellido: 'Principal',
        telefono: '+51999999999',
        activo: true
      }
    });
    console.log('✅ Administrador creado:', admin.username);
    
    // 2. Crear un técnico
    console.log('🔧 Creando técnico...');
    const tecnicoPassword = await bcrypt.hash('tecnico123', 10);
    
    const tecnico = await prisma.usuario.create({
      data: {
        username: 'tecnico',
        email: 'tecnico@servicefrios.com',
        password: tecnicoPassword,
        role: 'TECNICO',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+51888888888',
        activo: true,
        tecnico: {
          create: {
            especialidad: 'Refrigeración Industrial',
            certificaciones: ['Técnico en Refrigeración', 'Manejo de Gases Refrigerantes'],
            experiencia: 5,
            disponible: true
          }
        }
      }
    });
    console.log('✅ Técnico creado:', tecnico.username);
    
    // 3. Crear un cliente
    console.log('🏢 Creando cliente...');
    const clientePassword = await bcrypt.hash('cliente123', 10);
    
    const cliente = await prisma.usuario.create({
      data: {
        username: 'cliente',
        email: 'cliente@empresa.com',
        password: clientePassword,
        role: 'CLIENTE',
        nombre: 'María',
        apellido: 'García',
        telefono: '+51777777777',
        activo: true,
        cliente: {
          create: {
            razonSocial: 'Empresa Ejemplo S.A.C.',
            ruc: '20123456789',
            direccion: 'Av. Principal 123, Lima',
            contacto: 'María García',
            telefonoContacto: '+51777777777'
          }
        }
      }
    });
    console.log('✅ Cliente creado:', cliente.username);
    
    console.log('\n🎉 Seed completado exitosamente!');
    console.log('📋 Credenciales creadas:');
    console.log('   - Admin: admin / admin123');
    console.log('   - Técnico: tecnico / tecnico123');
    console.log('   - Cliente: cliente / cliente123');
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleSeed();