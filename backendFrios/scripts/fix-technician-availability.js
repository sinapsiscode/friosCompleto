const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTechnicianAvailability() {
  try {
    console.log('🔧 Arreglando disponibilidad de técnicos...\n');
    
    // Verificar estado actual
    const tecnicos = await prisma.tecnico.findMany({
      select: { 
        id: true, 
        nombre: true, 
        apellido: true, 
        disponibilidad: true, 
        isActive: true 
      }
    });

    console.log('📊 Estado actual de técnicos:');
    tecnicos.forEach(t => {
      console.log(`🧑‍🔧 ${t.nombre} ${t.apellido} (ID: ${t.id})`);
      console.log(`   📍 Disponibilidad: ${t.disponibilidad}`);
      console.log(`   ✅ Activo: ${t.isActive}`);
      console.log('');
    });

    // Actualizar todos los técnicos activos a DISPONIBLE
    const result = await prisma.tecnico.updateMany({
      where: {
        isActive: true
      },
      data: {
        disponibilidad: 'DISPONIBLE'
      }
    });

    console.log(`✅ Se actualizaron ${result.count} técnicos a DISPONIBLE\n`);

    // Verificar resultado
    const tecnicosActualizados = await prisma.tecnico.findMany({
      select: { 
        id: true, 
        nombre: true, 
        apellido: true, 
        disponibilidad: true, 
        isActive: true 
      }
    });

    console.log('📊 Estado después de la actualización:');
    tecnicosActualizados.forEach(t => {
      console.log(`🧑‍🔧 ${t.nombre} ${t.apellido} (ID: ${t.id})`);
      console.log(`   📍 Disponibilidad: ${t.disponibilidad}`);
      console.log(`   ✅ Activo: ${t.isActive}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTechnicianAvailability();