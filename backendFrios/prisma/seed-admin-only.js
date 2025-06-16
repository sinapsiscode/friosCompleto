const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed solo con administrador...');

  try {
    // Limpiar datos existentes
    console.log('🧹 Limpiando datos existentes...');
    await prisma.servicio.deleteMany();
    await prisma.equipo.deleteMany();
    await prisma.administrador.deleteMany();
    await prisma.tecnico.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.repuesto.deleteMany();
    await prisma.herramienta.deleteMany();

    // Crear solo el administrador principal
    console.log('👤 Creando administrador principal...');
    
    const adminUser = await prisma.usuario.create({
      data: {
        username: 'admin/servicefrios',
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

    console.log('✅ Seed completado exitosamente!');
    console.log('📊 Datos creados:');
    console.log(`   - ${await prisma.usuario.count()} usuarios`);
    console.log(`   - ${await prisma.administrador.count()} administradores`);
    console.log('');
    console.log('🔑 Credenciales del administrador:');
    console.log('   Usuario: admin/servicefrios');
    console.log('   Email: admin@servicefrios.pe');
    console.log('   Contraseña: admin123');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
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