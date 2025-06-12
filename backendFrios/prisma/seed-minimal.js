const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Reiniciando base de datos con usuarios básicos...');

  try {
    // Limpiar TODA la base de datos
    console.log('🧹 Limpiando base de datos completa...');
    await prisma.servicio.deleteMany();
    await prisma.equipo.deleteMany();
    await prisma.administrador.deleteMany();
    await prisma.tecnico.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.repuesto.deleteMany();
    await prisma.herramienta.deleteMany();
    await prisma.repuestoFormulario.deleteMany();

    console.log('✅ Base de datos limpiada');

    // Crear solo 3 usuarios básicos
    console.log('👤 Creando usuarios básicos...');
    
    // 1. ADMINISTRADOR
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

    // 2. TÉCNICO
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

    // 3. CLIENTE
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
        telefono: '+51987654323',
        direccion: 'Av. Cliente 789, Lima',
        ruc: '20123456789',
        razonSocial: 'Empresa García SAC'
      }
    });

    console.log('✅ Usuarios básicos creados exitosamente!');
    console.log('📊 Resumen:');
    console.log('   - 1 Administrador: admin@servicefrios.pe (password: admin123)');
    console.log('   - 1 Técnico: tecnico@servicefrios.pe (password: tecnico123)');
    console.log('   - 1 Cliente: cliente@servicefrios.pe (password: cliente123)');
    console.log('');
    console.log('🔑 Credenciales de acceso:');
    console.log('   Admin: username="admin", password="admin123"');
    console.log('   Técnico: username="tecnico", password="tecnico123"');
    console.log('   Cliente: username="cliente", password="cliente123"');

  } catch (error) {
    console.error('❌ Error durante el reset:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });