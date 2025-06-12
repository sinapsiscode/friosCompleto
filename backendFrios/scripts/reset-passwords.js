const { PrismaClient } = require('@prisma/client');
const authConfig = require('../src/config/auth');

const prisma = new PrismaClient();

async function resetPasswords() {
  try {
    console.log('🔍 === RESETEANDO CONTRASEÑAS A VALORES CONOCIDOS ===');
    
    // Contraseñas conocidas
    const passwords = {
      'admin/servicefrios': '123456',
      'williams': '123456', 
      'jaeden1': '123456'
    };
    
    for (const [username, newPassword] of Object.entries(passwords)) {
      console.log(`\n🔑 Procesando usuario: ${username}`);
      
      // Buscar usuario
      const user = await prisma.usuario.findUnique({
        where: { username }
      });
      
      if (!user) {
        console.log(`❌ Usuario ${username} no encontrado`);
        continue;
      }
      
      // Hash de la nueva contraseña
      const hashedPassword = await authConfig.hashPassword(newPassword);
      
      // Actualizar contraseña
      await prisma.usuario.update({
        where: { username },
        data: { password: hashedPassword }
      });
      
      console.log(`✅ Contraseña actualizada para ${username}`);
      console.log(`   Nueva contraseña: ${newPassword}`);
    }
    
    console.log('\n🎉 === CONTRASEÑAS RESETEADAS EXITOSAMENTE ===');
    console.log('\n🔐 CREDENCIALES ACTUALIZADAS:');
    console.log('👨‍💼 Admin: admin/servicefrios / 123456');
    console.log('🔧 Técnico: williams / 123456');
    console.log('👥 Cliente: jaeden1 / 123456');
    console.log('\n💡 Ahora puedes usar estas credenciales para hacer login');
    
  } catch (error) {
    console.error('❌ Error reseteando contraseñas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPasswords();