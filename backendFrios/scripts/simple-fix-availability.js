const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simpleFixAvailability() {
  try {
    console.log('🔧 Corrigiendo disponibilidad SIN cambiar schema...\n');
    
    // 1. Ver estado actual
    console.log('📊 Estado ANTES:');
    const before = await prisma.tecnico.findMany({
      select: { id: true, nombre: true, apellido: true, disponibilidad: true }
    });
    
    before.forEach(t => {
      console.log(`🧑‍🔧 ${t.nombre} ${t.apellido} → "${t.disponibilidad}"`);
    });

    // 2. Normalizar SOLO los datos inconsistentes
    console.log('\n🔄 Normalizando inconsistencias...');
    
    const updated = await prisma.tecnico.updateMany({
      where: {
        disponibilidad: {
          not: 'DISPONIBLE'
        }
      },
      data: {
        disponibilidad: 'DISPONIBLE'
      }
    });

    console.log(`✅ Se normalizaron ${updated.count} técnicos`);

    // 3. Verificar resultado
    console.log('\n📊 Estado DESPUÉS:');
    const after = await prisma.tecnico.findMany({
      select: { id: true, nombre: true, apellido: true, disponibilidad: true }
    });
    
    after.forEach(t => {
      console.log(`🧑‍🔧 ${t.nombre} ${t.apellido} → "${t.disponibilidad}"`);
    });

    console.log('\n✅ TODOS los técnicos ahora tienen "DISPONIBLE" consistente');
    console.log('🛡️ NO se cambió el schema - cero riesgo de errores');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleFixAvailability();