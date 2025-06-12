const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTechnicianAvailabilityEnum() {
  try {
    console.log('🔧 Arreglando disponibilidad de técnicos a ENUM...\n');
    
    // 1. Verificar estado actual
    console.log('📊 Estado ANTES de la corrección:');
    const tecnicosBefore = await prisma.tecnico.findMany({
      select: { 
        id: true, 
        nombre: true, 
        apellido: true, 
        disponibilidad: true 
      }
    });

    tecnicosBefore.forEach(t => {
      console.log(`🧑‍🔧 ${t.nombre} ${t.apellido} (ID: ${t.id}) → "${t.disponibilidad}"`);
    });

    // 2. Normalizar todos los valores a DISPONIBLE
    console.log('\n🔄 Normalizando todos los técnicos a DISPONIBLE...');
    
    // Actualizar usando SQL directo para evitar problemas con el enum
    await prisma.$executeRaw`
      UPDATE tecnicos 
      SET disponibilidad = 'DISPONIBLE' 
      WHERE disponibilidad IS NOT NULL;
    `;

    console.log('✅ Técnicos actualizados a DISPONIBLE');

    // 3. Verificar resultado
    console.log('\n📊 Estado DESPUÉS de la corrección:');
    const tecnicosAfter = await prisma.tecnico.findMany({
      select: { 
        id: true, 
        nombre: true, 
        apellido: true, 
        disponibilidad: true 
      }
    });

    tecnicosAfter.forEach(t => {
      console.log(`🧑‍🔧 ${t.nombre} ${t.apellido} (ID: ${t.id}) → "${t.disponibilidad}"`);
    });

    console.log('\n✅ Corrección completada - todos los técnicos tienen disponibilidad consistente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTechnicianAvailabilityEnum();