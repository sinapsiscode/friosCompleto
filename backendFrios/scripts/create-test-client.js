const { PrismaClient } = require('@prisma/client');
const authConfig = require('../src/config/auth');

const prisma = new PrismaClient();

async function createTestClient() {
  try {
    console.log('🔍 === CREANDO USUARIO CLIENTE DE PRUEBA ===');
    
    const username = 'maria.lopez';
    const password = '123456';
    const email = 'maria.lopez@test.com';
    
    // Verificar si ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { username }
    });
    
    if (existingUser) {
      console.log('⚠️ El usuario ya existe');
      
      // Mostrar datos del usuario existente
      const userWithProfile = await prisma.usuario.findUnique({
        where: { username },
        include: { cliente: true }
      });
      
      console.log(`👤 Usuario: ${userWithProfile.username}`);
      console.log(`📧 Email: ${userWithProfile.email}`);
      console.log(`🎭 Role: ${userWithProfile.role}`);
      console.log(`🟢 Activo: ${userWithProfile.isActive}`);
      
      if (userWithProfile.cliente) {
        console.log(`👥 Cliente: ${userWithProfile.cliente.nombre} ${userWithProfile.cliente.apellido}`);
        console.log(`📞 Teléfono: ${userWithProfile.cliente.telefono}`);
        console.log(`📍 Dirección: ${userWithProfile.cliente.direccion}`);
      }
      
      console.log('');
      console.log('🔐 CREDENCIALES PARA LOGIN:');
      console.log(`👤 Usuario: ${username}`);
      console.log(`🔒 Password: ${password}`);
      
      return;
    }
    
    // Hash de la contraseña
    const hashedPassword = await authConfig.hashPassword(password);
    
    // Crear usuario y cliente en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear usuario
      const newUser = await tx.usuario.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: 'CLIENTE'
        }
      });
      
      // Crear perfil de cliente
      const newCliente = await tx.cliente.create({
        data: {
          userId: newUser.id,
          nombre: 'María',
          apellido: 'López',
          email,
          telefono: '959365832',
          direccion: 'Av. Surco 123',
          ciudad: 'Lima',
          distrito: 'Surco',
          tipo: 'persona'
        }
      });
      
      return { user: newUser, cliente: newCliente };
    });
    
    console.log('✅ Usuario cliente creado exitosamente');
    console.log(`👤 Usuario: ${result.user.username}`);
    console.log(`📧 Email: ${result.user.email}`);
    console.log(`👥 Cliente: ${result.cliente.nombre} ${result.cliente.apellido}`);
    console.log('');
    console.log('🔐 CREDENCIALES PARA LOGIN:');
    console.log(`👤 Usuario: ${username}`);
    console.log(`🔒 Password: ${password}`);
    
  } catch (error) {
    console.error('❌ Error creando usuario cliente:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestClient();