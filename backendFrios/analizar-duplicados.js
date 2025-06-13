const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analizar() {
  try {
    console.log('=== ANÁLISIS DE SERVICIOS PROGRAMADOS ===\n');
    
    // 1. Obtener todas las programaciones
    const programaciones = await prisma.programacion.findMany({
      include: {
        cliente: { select: { nombre: true, apellido: true, razonSocial: true } },
        _count: { select: { servicios: true } }
      }
    });
    
    console.log('📋 PROGRAMACIONES ENCONTRADAS:');
    programaciones.forEach(prog => {
      const clienteNombre = prog.cliente.razonSocial || `${prog.cliente.nombre} ${prog.cliente.apellido}`;
      console.log(`- ID: ${prog.id} | Cliente: ${clienteNombre} | Frecuencia: ${prog.frecuencia} | Servicios: ${prog._count.servicios}`);
      console.log(`  Fecha inicio: ${prog.fechaInicio?.toISOString().split('T')[0]} | Próxima: ${prog.proximaEjecucion?.toISOString().split('T')[0]}`);
    });
    
    console.log('\n=== SERVICIOS PROGRAMADOS ===\n');
    
    // 2. Obtener servicios programados agrupados por programacionId
    const serviciosProgramados = await prisma.servicio.findMany({
      where: { tipoServicio: 'programado' },
      include: {
        cliente: { select: { nombre: true, apellido: true, razonSocial: true } },
        programacion: { select: { id: true, nombre: true } }
      },
      orderBy: [
        { programacionId: 'asc' },
        { fechaProgramada: 'asc' }
      ]
    });
    
    console.log(`📊 Total servicios programados: ${serviciosProgramados.length}`);
    
    // Agrupar por programacionId
    const serviciosPorProgramacion = {};
    serviciosProgramados.forEach(servicio => {
      const progId = servicio.programacionId;
      if (!serviciosPorProgramacion[progId]) {
        serviciosPorProgramacion[progId] = [];
      }
      serviciosPorProgramacion[progId].push(servicio);
    });
    
    // Analizar cada grupo
    Object.keys(serviciosPorProgramacion).forEach(progId => {
      const servicios = serviciosPorProgramacion[progId];
      const clienteNombre = servicios[0].cliente.razonSocial || `${servicios[0].cliente.nombre} ${servicios[0].cliente.apellido}`;
      
      console.log(`\n🔍 PROGRAMACIÓN ID: ${progId} (${clienteNombre})`);
      console.log(`Total servicios: ${servicios.length}`);
      
      // Agrupar por fecha para detectar duplicados
      const serviciosPorFecha = {};
      servicios.forEach(servicio => {
        const fecha = servicio.fechaProgramada?.toISOString().split('T')[0];
        if (!serviciosPorFecha[fecha]) {
          serviciosPorFecha[fecha] = [];
        }
        serviciosPorFecha[fecha].push(servicio);
      });
      
      // Mostrar fechas duplicadas
      Object.keys(serviciosPorFecha).forEach(fecha => {
        const serviciosFecha = serviciosPorFecha[fecha];
        if (serviciosFecha.length > 1) {
          console.log(`  ⚠️  DUPLICADO en ${fecha}: ${serviciosFecha.length} servicios`);
          serviciosFecha.forEach((s, idx) => {
            console.log(`    - [${idx+1}] ID: ${s.id} | Orden: ${s.numeroOrden} | Creado: ${s.createdAt.toISOString()}`);
          });
        } else {
          console.log(`  ✅ ${fecha}: 1 servicio (ID: ${serviciosFecha[0].id})`);
        }
      });
    });
    
    console.log('\n=== ANÁLISIS DE CAUSAS POTENCIALES ===\n');
    
    // 3. Verificar si hay múltiples ejecuciones del generador
    const serviciosRecientes = await prisma.servicio.findMany({
      where: { 
        tipoServicio: 'programado',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24 horas
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    console.log('🕐 SERVICIOS CREADOS EN LAS ÚLTIMAS 24 HORAS:');
    serviciosRecientes.forEach(s => {
      console.log(`- ${s.id} | Prog: ${s.programacionId} | Fecha prog: ${s.fechaProgramada?.toISOString().split('T')[0]} | Creado: ${s.createdAt.toISOString()}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

analizar();