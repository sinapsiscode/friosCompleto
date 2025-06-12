const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyDatabaseData() {
  try {
    console.log('🔍 VERIFICANDO DATOS EN BASE DE DATOS...\n');
    
    // 1. Verificar servicios
    console.log('📋 === SERVICIOS ===');
    const servicios = await prisma.servicio.findMany({
      include: {
        cliente: {
          select: { nombre: true, apellido: true, razonSocial: true }
        },
        tecnico: {
          select: { nombre: true, apellido: true, disponibilidad: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    servicios.forEach(servicio => {
      console.log(`🆔 ID: ${servicio.id}`);
      console.log(`📅 Fecha: ${servicio.fechaProgramada || servicio.fechaSolicitud}`);
      console.log(`👤 Cliente: ${servicio.cliente?.razonSocial || `${servicio.cliente?.nombre} ${servicio.cliente?.apellido}`}`);
      console.log(`🔧 Técnico: ${servicio.tecnico ? `${servicio.tecnico.nombre} ${servicio.tecnico.apellido} (${servicio.tecnico.disponibilidad})` : 'Sin asignar'}`);
      console.log(`📊 Estado: ${servicio.estado}`);
      console.log(`📝 Tipo: ${servicio.tipoServicio}`);
      console.log('---');
    });

    // 2. Verificar técnicos
    console.log('\n👨‍🔧 === TÉCNICOS ===');
    const tecnicos = await prisma.tecnico.findMany({
      select: { 
        id: true, 
        nombre: true, 
        apellido: true, 
        disponibilidad: true, 
        isActive: true,
        _count: {
          select: { servicios: true }
        }
      }
    });

    tecnicos.forEach(tecnico => {
      console.log(`🆔 ID: ${tecnico.id} - ${tecnico.nombre} ${tecnico.apellido}`);
      console.log(`📍 Disponibilidad: ${tecnico.disponibilidad}`);
      console.log(`✅ Activo: ${tecnico.isActive}`);
      console.log(`📊 Servicios asignados: ${tecnico._count.servicios}`);
      console.log('---');
    });

    // 3. Verificar clientes
    console.log('\n👥 === CLIENTES ===');
    const clientes = await prisma.cliente.findMany({
      select: { 
        id: true, 
        nombre: true, 
        apellido: true, 
        razonSocial: true,
        isActive: true,
        _count: {
          select: { servicios: true, equipos: true }
        }
      }
    });

    clientes.forEach(cliente => {
      console.log(`🆔 ID: ${cliente.id} - ${cliente.razonSocial || `${cliente.nombre} ${cliente.apellido}`}`);
      console.log(`✅ Activo: ${cliente.isActive}`);
      console.log(`📊 Servicios: ${cliente._count.servicios} | Equipos: ${cliente._count.equipos}`);
      console.log('---');
    });

    // 4. Verificar el último servicio ODT-250612001 específicamente
    console.log('\n🎯 === SERVICIO ODT-250612001 ===');
    const servicioEspecifico = await prisma.servicio.findUnique({
      where: { id: 'ODT-250612001' },
      include: {
        cliente: {
          select: { nombre: true, apellido: true, razonSocial: true }
        },
        tecnico: {
          select: { nombre: true, apellido: true, disponibilidad: true }
        }
      }
    });

    if (servicioEspecifico) {
      console.log(`🆔 ID: ${servicioEspecifico.id}`);
      console.log(`📅 Fecha: ${servicioEspecifico.fechaProgramada || servicioEspecifico.fechaSolicitud}`);
      console.log(`👤 Cliente: ${servicioEspecifico.cliente?.razonSocial || `${servicioEspecifico.cliente?.nombre} ${servicioEspecifico.cliente?.apellido}`}`);
      console.log(`🔧 Técnico: ${servicioEspecifico.tecnico ? `${servicioEspecifico.tecnico.nombre} ${servicioEspecifico.tecnico.apellido} (${servicioEspecifico.tecnico.disponibilidad})` : 'Sin asignar'}`);
      console.log(`📊 Estado: ${servicioEspecifico.estado}`);
      console.log(`🔧 Técnico ID: ${servicioEspecifico.tecnicoId}`);
    } else {
      console.log('❌ Servicio ODT-250612001 no encontrado');
    }

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabaseData();