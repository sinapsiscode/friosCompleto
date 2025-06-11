const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  try {
    // Limpiar datos existentes (opcional)
    console.log('🧹 Limpiando datos existentes...');
    await prisma.servicio.deleteMany();
    await prisma.equipo.deleteMany();
    await prisma.administrador.deleteMany();
    await prisma.tecnico.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.repuesto.deleteMany();
    await prisma.herramienta.deleteMany();

    // Crear usuarios base
    console.log('👤 Creando usuarios base...');
    
    // 1. Administrador principal
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

    // 2. Usuario técnico por defecto
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
        nombre: 'Técnico',
        apellido: 'General',
        email: 'tecnico@servicefrios.pe',
        telefono: '+51987654322',
        direccion: 'Av. Técnica 456, Lima',
        especialidad: 'Refrigeración Industrial',
        disponibilidad: 'Disponible'
      }
    });

    // 3. Usuario cliente por defecto
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
        nombre: 'Cliente',
        apellido: 'Ejemplo',
        email: 'cliente@servicefrios.pe',
        telefono: '+51987654323',
        direccion: 'Av. Cliente 789, Lima'
      }
    });

    // Crear técnicos específicos
    console.log('🔧 Creando técnicos específicos...');
    
    const tecnicos = [
      {
        username: 'jperez',
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@servicefrios.pe',
        telefono: '+51987111111',
        especialidad: 'Aire Acondicionado',
        disponibilidad: 'Disponible'
      },
      {
        username: 'mlopez',
        nombre: 'María',
        apellido: 'López',
        email: 'maria.lopez@servicefrios.pe',
        telefono: '+51987222222',
        especialidad: 'Refrigeración Comercial',
        disponibilidad: 'Disponible'
      },
      {
        username: 'cgonzalez',
        nombre: 'Carlos',
        apellido: 'González',
        email: 'carlos.gonzalez@servicefrios.pe',
        telefono: '+51987333333',
        especialidad: 'Refrigeración Industrial',
        disponibilidad: 'Ocupado'
      },
      {
        username: 'amartinez',
        nombre: 'Ana',
        apellido: 'Martínez',
        email: 'ana.martinez@servicefrios.pe',
        telefono: '+51987444444',
        especialidad: 'Mantenimiento Preventivo',
        disponibilidad: 'Disponible'
      }
    ];

    for (const tecnico of tecnicos) {
      const user = await prisma.usuario.create({
        data: {
          username: tecnico.username,
          email: tecnico.email,
          password: await bcrypt.hash('123', 10),
          role: 'TECNICO'
        }
      });

      await prisma.tecnico.create({
        data: {
          userId: user.id,
          nombre: tecnico.nombre,
          apellido: tecnico.apellido,
          email: tecnico.email,
          telefono: tecnico.telefono,
          especialidad: tecnico.especialidad,
          disponibilidad: tecnico.disponibilidad
        }
      });
    }

    // Crear clientes específicos
    console.log('👥 Creando clientes específicos...');
    
    const clientes = [
      {
        username: 'norte',
        nombre: 'Supermercados',
        apellido: 'Norte',
        email: 'compras@supernorte.pe',
        telefono: '+51987555555',
        direccion: 'Av. Norte 100, Trujillo'
      },
      {
        username: 'buenamesarestaurante',
        nombre: 'Restaurant',
        apellido: 'Buena Mesa',
        email: 'gerencia@buenamesarestaurante.pe',
        telefono: '+51987666666',
        direccion: 'Jr. Gourmet 200, Lima'
      },
      {
        username: 'rsanchez',
        nombre: 'Roberto',
        apellido: 'Sánchez',
        email: 'rsanchez@email.com',
        telefono: '+51987777777',
        direccion: 'Av. Residencial 300, Arequipa'
      },
      {
        username: 'hospitalsanjuan',
        nombre: 'Hospital',
        apellido: 'San Juan',
        email: 'mantenimiento@hospitalsanjuan.pe',
        telefono: '+51987888888',
        direccion: 'Av. Salud 400, Cusco'
      }
    ];

    for (const cliente of clientes) {
      const user = await prisma.usuario.create({
        data: {
          username: cliente.username,
          email: cliente.email,
          password: await bcrypt.hash('123', 10),
          role: 'CLIENTE'
        }
      });

      await prisma.cliente.create({
        data: {
          userId: user.id,
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          email: cliente.email,
          telefono: cliente.telefono,
          direccion: cliente.direccion
        }
      });
    }

    // Crear equipos de ejemplo
    console.log('❄️ Creando equipos de ejemplo...');
    
    const clientesCreados = await prisma.cliente.findMany();
    
    const equipos = [
      {
        clienteId: clientesCreados[0]?.id,
        nombre: 'Cámara Frigorífica Principal',
        tipo: 'Cámara Frigorífica',
        marca: 'Carrier',
        modelo: 'CF-2000',
        numeroSerie: 'CF2000-001',
        ubicacion: 'Almacén Principal',
        descripcion: 'Cámara frigorífica para productos frescos'
      },
      {
        clienteId: clientesCreados[1]?.id,
        nombre: 'Aire Acondicionado Salón',
        tipo: 'Aire Acondicionado',
        marca: 'Daikin',
        modelo: 'SKY-AIR',
        numeroSerie: 'DA2024-002',
        ubicacion: 'Salón Principal',
        descripcion: 'Sistema de climatización central'
      }
    ];

    for (const equipo of equipos) {
      if (equipo.clienteId) {
        await prisma.equipo.create({ data: equipo });
      }
    }

    // Crear repuestos de ejemplo
    console.log('🔩 Creando repuestos de ejemplo...');
    
    const repuestos = [
      {
        nombre: 'Compresor Hermético',
        descripcion: 'Compresor para refrigeración comercial',
        marca: 'Tecumseh',
        modelo: 'AE2410Z',
        categoria: 'Compresores',
        precio: 850.00,
        stock: 5,
        stockMinimo: 2,
        ubicacion: 'Almacén A-1'
      },
      {
        nombre: 'Filtro Deshidratador',
        descripcion: 'Filtro deshidratador universal',
        marca: 'Danfoss',
        modelo: 'DML-163',
        categoria: 'Filtros',
        precio: 45.00,
        stock: 20,
        stockMinimo: 5,
        ubicacion: 'Almacén B-2'
      },
      {
        nombre: 'Válvula de Expansión',
        descripcion: 'Válvula termostática de expansión',
        marca: 'Sporlan',
        modelo: 'ORIT-6',
        categoria: 'Válvulas',
        precio: 120.00,
        stock: 8,
        stockMinimo: 3,
        ubicacion: 'Almacén B-1'
      }
    ];

    for (const repuesto of repuestos) {
      await prisma.repuesto.create({ data: repuesto });
    }

    // Crear herramientas de ejemplo
    console.log('🔧 Creando herramientas de ejemplo...');
    
    const herramientas = [
      {
        nombre: 'Manifold Digital',
        descripcion: 'Manifold digital para medición de presiones',
        marca: 'Testo',
        modelo: '557',
        categoria: 'Medición',
        estado: 'Excelente',
        ubicacion: 'Taller Principal'
      },
      {
        nombre: 'Soldadora Oxiacetilénica',
        descripcion: 'Equipo de soldadura para tuberías de cobre',
        marca: 'Lincoln',
        modelo: 'OX-250',
        categoria: 'Soldadura',
        estado: 'Bueno',
        ubicacion: 'Taller Principal'
      },
      {
        nombre: 'Detector de Fugas',
        descripcion: 'Detector electrónico de fugas de refrigerante',
        marca: 'Robinair',
        modelo: '16455',
        categoria: 'Detección',
        estado: 'Excelente',
        ubicacion: 'Vehículo 1'
      }
    ];

    for (const herramienta of herramientas) {
      await prisma.herramienta.create({ data: herramienta });
    }

    // Crear servicios de ejemplo
    console.log('📋 Creando servicios de ejemplo...');
    
    const equiposCreados = await prisma.equipo.findMany();
    const tecnicosCreados = await prisma.tecnico.findMany();
    
    if (equiposCreados.length > 0 && tecnicosCreados.length > 0) {
      const servicios = [
        {
          id: 'ODT-001',
          clienteId: clientesCreados[0]?.id || 1,
          equipoId: equiposCreados[0]?.id,
          tecnicoId: tecnicosCreados[0]?.id,
          tipoServicio: 'Mantenimiento Preventivo',
          descripcion: 'Mantenimiento preventivo de cámara frigorífica',
          fechaProgramada: new Date('2024-12-15'),
          estado: 'PENDIENTE',
          prioridad: 'MEDIA',
          observaciones: 'Revisar estado de compresores y filtros'
        },
        {
          id: 'ODT-002',
          clienteId: clientesCreados[1]?.id || 2,
          equipoId: equiposCreados[1]?.id,
          tecnicoId: tecnicosCreados[1]?.id,
          tipoServicio: 'Reparación',
          descripcion: 'Reparación de fuga en sistema de refrigeración',
          fechaProgramada: new Date('2024-12-20'),
          estado: 'PROCESO',
          prioridad: 'ALTA',
          observaciones: 'Fuga detectada en evaporador'
        }
      ];

      for (const servicio of servicios) {
        if (servicio.clienteId && servicio.equipoId && servicio.tecnicoId) {
          await prisma.servicio.create({ data: servicio });
        }
      }
    }

    console.log('✅ Seed completado exitosamente!');
    console.log('📊 Datos creados:');
    console.log(`   - ${await prisma.usuario.count()} usuarios`);
    console.log(`   - ${await prisma.administrador.count()} administradores`);
    console.log(`   - ${await prisma.tecnico.count()} técnicos`);
    console.log(`   - ${await prisma.cliente.count()} clientes`);
    console.log(`   - ${await prisma.equipo.count()} equipos`);
    console.log(`   - ${await prisma.servicio.count()} servicios`);
    console.log(`   - ${await prisma.repuesto.count()} repuestos`);
    console.log(`   - ${await prisma.herramienta.count()} herramientas`);

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