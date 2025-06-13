const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🔄 === REINICIANDO BASE DE DATOS ===');
  console.log('⚠️  Esto eliminará TODOS los datos existentes');
  
  try {
    // 1. ELIMINAR TODOS LOS DATOS
    console.log('\n🧹 Eliminando todos los datos...');
    
    // Eliminar en orden para evitar conflictos de claves foráneas
    await prisma.programacion.deleteMany();
    console.log('   ✅ Programaciones eliminadas');
    
    await prisma.servicio.deleteMany();
    console.log('   ✅ Servicios eliminados');
    
    await prisma.repuestoFormulario.deleteMany();
    console.log('   ✅ Formularios de repuestos eliminados');
    
    await prisma.evaluacion.deleteMany();
    console.log('   ✅ Evaluaciones eliminadas');
    
    await prisma.equipo.deleteMany();
    console.log('   ✅ Equipos eliminados');
    
    await prisma.administrador.deleteMany();
    console.log('   ✅ Administradores eliminados');
    
    await prisma.tecnico.deleteMany();
    console.log('   ✅ Técnicos eliminados');
    
    await prisma.cliente.deleteMany();
    console.log('   ✅ Clientes eliminados');
    
    await prisma.repuesto.deleteMany();
    console.log('   ✅ Repuestos eliminados');
    
    await prisma.herramienta.deleteMany();
    console.log('   ✅ Herramientas eliminadas');
    
    await prisma.usuario.deleteMany();
    console.log('   ✅ Usuarios eliminados');
    
    // 2. CREAR DATOS BÁSICOS
    console.log('\n👤 Creando usuarios básicos...');
    
    // Administrador
    const adminUser = await prisma.usuario.create({
      data: {
        username: 'admin',
        email: 'admin@servicefrios.pe',
        password: await bcrypt.hash('admin123', 10),
        role: 'ADMIN'
      }
    });
    
    await prisma.administrador.create({
      data: {
        userId: adminUser.id,
        nombre: 'Administrador',
        apellido: 'Principal',
        email: 'admin@servicefrios.pe',
        telefono: '+51987654321',
        direccion: 'Av. Principal 123, Lima'
      }
    });
    console.log('   ✅ Administrador creado: admin / admin123');
    
    // Técnico
    const tecnicoUser = await prisma.usuario.create({
      data: {
        username: 'tecnico',
        email: 'tecnico@servicefrios.pe',
        password: await bcrypt.hash('tecnico123', 10),
        role: 'TECNICO'
      }
    });
    
    await prisma.tecnico.create({
      data: {
        userId: tecnicoUser.id,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'tecnico@servicefrios.pe',
        telefono: '+51987654322',
        direccion: 'Av. Técnica 456, Lima',
        especialidad: 'Refrigeración Industrial',
        disponibilidad: 'Disponible'
      }
    });
    console.log('   ✅ Técnico creado: tecnico / tecnico123');
    
    // Cliente
    const clienteUser = await prisma.usuario.create({
      data: {
        username: 'cliente',
        email: 'cliente@servicefrios.pe',
        password: await bcrypt.hash('cliente123', 10),
        role: 'CLIENTE'
      }
    });
    
    await prisma.cliente.create({
      data: {
        userId: clienteUser.id,
        nombre: 'María',
        apellido: 'García',
        email: 'cliente@servicefrios.pe',
        telefono: '+51959365832',
        direccion: 'Jr. Tacna 463, Santiago de Surco'
      }
    });
    console.log('   ✅ Cliente creado: cliente / cliente123');
    
    console.log('\n✅ === REINICIO COMPLETADO ===');
    console.log('🎯 Base de datos reiniciada con datos mínimos');
    console.log('\n📋 CREDENCIALES DE ACCESO:');
    console.log('   👤 Administrador: admin / admin123');
    console.log('   🔧 Técnico: tecnico / tecnico123');
    console.log('   🏢 Cliente: cliente / cliente123');
    console.log('\n🌐 URLs:');
    console.log('   Frontend: http://localhost:2000');
    console.log('   Backend: http://localhost:2001');
    
  } catch (error) {
    console.error('❌ Error durante el reinicio:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  resetDatabase();
}

module.exports = { resetDatabase };