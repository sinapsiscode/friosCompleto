const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limpiarServiciosDuplicados() {
  console.log('🧹 === INICIANDO LIMPIEZA DE SERVICIOS DUPLICADOS ===');
  
  try {
    // Buscar servicios duplicados por programacionId y fechaProgramada
    const serviciosDuplicados = await prisma.servicio.findMany({
      where: {
        programacionId: { not: null },
        tipoServicio: 'programado'
      },
      orderBy: [
        { programacionId: 'asc' },
        { fechaProgramada: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    
    console.log(`📊 Total de servicios programados encontrados: ${serviciosDuplicados.length}`);
    
    // Agrupar servicios por programacionId + fecha (solo día)
    const grupos = new Map();
    
    serviciosDuplicados.forEach(servicio => {
      const fecha = new Date(servicio.fechaProgramada);
      const fechaStr = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getDate().toString().padStart(2, '0')}`;
      const clave = `${servicio.programacionId}_${fechaStr}_${servicio.horaInicio}`;
      
      if (!grupos.has(clave)) {
        grupos.set(clave, []);
      }
      grupos.get(clave).push(servicio);
    });
    
    let serviciosEliminados = 0;
    let gruposConDuplicados = 0;
    
    console.log('🔍 Analizando grupos de servicios...');
    
    for (const [clave, servicios] of grupos) {
      if (servicios.length > 1) {
        gruposConDuplicados++;
        console.log(`\n📅 Grupo ${clave}: ${servicios.length} servicios duplicados`);
        
        // Mantener el más antiguo (primer creado) y eliminar el resto
        const [servicioAMantener, ...serviciosAEliminar] = servicios;
        
        console.log(`✅ Manteniendo: ${servicioAMantener.id} (${servicioAMantener.createdAt})`);
        
        for (const servicioAEliminar of serviciosAEliminar) {
          console.log(`❌ Eliminando: ${servicioAEliminar.id} (${servicioAEliminar.createdAt})`);
          
          try {
            await prisma.servicio.delete({
              where: { id: servicioAEliminar.id }
            });
            serviciosEliminados++;
          } catch (error) {
            console.error(`❌ Error eliminando servicio ${servicioAEliminar.id}:`, error.message);
          }
        }
      }
    }
    
    console.log('\n✅ === LIMPIEZA COMPLETADA ===');
    console.log(`📊 Grupos con duplicados encontrados: ${gruposConDuplicados}`);
    console.log(`🗑️ Servicios duplicados eliminados: ${serviciosEliminados}`);
    console.log(`📋 Servicios únicos mantenidos: ${grupos.size}`);
    
    // Actualizar próxima ejecución de programaciones
    console.log('\n🔄 Actualizando próximas ejecuciones...');
    
    const programaciones = await prisma.programacion.findMany({
      where: { isActive: true }
    });
    
    for (const programacion of programaciones) {
      // Encontrar el último servicio generado para esta programación
      const ultimoServicio = await prisma.servicio.findFirst({
        where: {
          programacionId: programacion.id,
          tipoServicio: 'programado'
        },
        orderBy: { fechaProgramada: 'desc' }
      });
      
      if (ultimoServicio) {
        // Calcular próxima ejecución basada en el último servicio
        const proximaEjecucion = calcularProximaEjecucion(
          programacion.frecuencia,
          ultimoServicio.fechaProgramada,
          programacion.intervaloDias,
          programacion.diasSemana,
          programacion.diaMes
        );
        
        await prisma.programacion.update({
          where: { id: programacion.id },
          data: { 
            proximaEjecucion,
            ultimaEjecucion: ultimoServicio.fechaProgramada
          }
        });
        
        console.log(`📅 Programación ${programacion.id}: próxima ejecución ${proximaEjecucion.toISOString().split('T')[0]}`);
      }
    }
    
    console.log('\n🎉 ¡Proceso completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función auxiliar para calcular próxima ejecución
function calcularProximaEjecucion(frecuencia, fechaBase, intervaloDias = null, diasSemana = null, diaMes = null) {
  let proxima = new Date(fechaBase);
  
  switch (frecuencia) {
    case 'DIARIO':
      proxima.setDate(proxima.getDate() + 1);
      break;
      
    case 'SEMANAL':
      proxima.setDate(proxima.getDate() + 7);
      break;
      
    case 'QUINCENAL':
      proxima.setDate(proxima.getDate() + 15);
      break;
      
    case 'MENSUAL':
      if (diaMes) {
        proxima.setMonth(proxima.getMonth() + 1);
        proxima.setDate(diaMes);
      } else {
        proxima.setMonth(proxima.getMonth() + 1);
      }
      break;
      
    case 'BIMESTRAL':
      proxima.setMonth(proxima.getMonth() + 2);
      break;
      
    case 'TRIMESTRAL':
      proxima.setMonth(proxima.getMonth() + 3);
      break;
      
    case 'SEMESTRAL':
      proxima.setMonth(proxima.getMonth() + 6);
      break;
      
    case 'ANUAL':
      proxima.setFullYear(proxima.getFullYear() + 1);
      break;
      
    case 'PERSONALIZADO':
      if (intervaloDias) {
        proxima.setDate(proxima.getDate() + intervaloDias);
      }
      break;
      
    default:
      proxima.setDate(proxima.getDate() + 30);
  }
  
  return proxima;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  limpiarServiciosDuplicados();
}

module.exports = { limpiarServiciosDuplicados };