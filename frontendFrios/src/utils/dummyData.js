export const dummyData = {
  tecnicos: [
    {
      id: 1,
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'jperez@empresa.com',
      telefono: '987654321',
      especialidad: 'Refrigeración Industrial',
      disponibilidad: 'DISPONIBLE',
      experiencia: 5,
      isActive: true,
      usuario: {
        id: 'tecnico-1',
        username: 'tecnico',
        email: 'jperez@empresa.com',
        isActive: true
      }
    },
    {
      id: 2,
      nombre: 'María',
      apellido: 'López',
      email: 'mlopez@empresa.com',
      telefono: '987654322',
      especialidad: 'Aires Acondicionados',
      disponibilidad: 'DISPONIBLE',
      experiencia: 3,
      isActive: true,
      usuario: {
        id: 'tecnico-2',
        username: 'mlopez',
        email: 'mlopez@empresa.com',
        isActive: true
      }
    },
    {
      id: 3,
      nombre: 'Carlos',
      apellido: 'González',
      email: 'cgonzalez@empresa.com',
      telefono: '987654323',
      especialidad: 'Climatización',
      disponibilidad: 'DISPONIBLE',
      experiencia: 7,
      isActive: true,
      usuario: {
        id: 'tecnico-3',
        username: 'cgonzalez',
        email: 'cgonzalez@empresa.com',
        isActive: true
      }
    },
    {
      id: 4,
      nombre: 'Ana',
      apellido: 'Martínez',
      email: 'amartinez@empresa.com',
      telefono: '987654324',
      especialidad: 'Mantenimiento General',
      disponibilidad: 'DISPONIBLE',
      experiencia: 4,
      isActive: true,
      usuario: {
        id: 'tecnico-4',
        username: 'amartinez',
        email: 'amartinez@empresa.com',
        isActive: true
      }
    }
  ],
  clientes: [
    {
      id: 'cmbteqkv0000276w9kdsfey2d',
      usuario: 'cliente',
      nombre: 'María',
      apellido: 'López',
      razonSocial: 'Empresa Cliente Demo S.A.C.',
      email: 'cliente@servicefrios.pe',
      telefono: '987654321',
      direccion: 'Av. Principal 123, Lima',
      tipo: 'empresa',
      isActive: true,
      equipos: [1, 2]
    },
    {
      id: 1,
      nombre: 'Empresa',
      apellido: 'Norte SAC',
      razonSocial: 'Empresa Norte SAC',
      email: 'contacto@empresanorte.com',
      telefono: '987654321',
      direccion: 'Av. Principal 123, Lima',
      tipo: 'empresa',
      isActive: true
    },
    {
      id: 2,
      nombre: 'Restaurante',
      apellido: 'Buena Mesa',
      razonSocial: 'Restaurante Buena Mesa EIRL',
      email: 'info@buenamesarestaurante.com',
      telefono: '987654322',
      direccion: 'Jr. Los Olivos 456, Lima',
      tipo: 'empresa',
      isActive: true
    }
  ],
  equipos: [
    {
      id: 1,
      clienteId: 1,
      nombre: 'Refrigerador Industrial',
      tipo: 'refrigerador',
      marca: 'Carrier',
      modelo: 'XYZ-2000',
      ubicacion: 'Almacén Principal',
      isActive: true
    },
    {
      id: 2,
      clienteId: 2,
      nombre: 'Sistema de Climatización',
      tipo: 'aire_acondicionado',
      marca: 'Daikin',
      modelo: 'ABC-1500',
      ubicacion: 'Salón Principal',
      isActive: true
    }
  ],
  servicios: [
    {
      id: 'ODT-001',
      clienteId: 'cmbteqkv0000276w9kdsfey2d',
      equipos: [1],
      tecnicoId: 1,
      tipoServicio: 'preventivo',
      descripcion: 'Mantenimiento preventivo de equipo de refrigeración',
      fecha: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], // En 3 días
      hora: '09:00',
      estado: 'pendiente',
      prioridad: 'media',
      tipo: 'preventivo'
    },
    {
      id: 'ODT-002',
      clienteId: 'cmbteqkv0000276w9kdsfey2d',
      equipos: [2],
      tecnicoId: 2,
      tipoServicio: 'correctivo',
      descripcion: 'Reparación de sistema de climatización',
      fecha: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], // En 7 días
      hora: '14:00',
      estado: 'pendiente',
      prioridad: 'alta',
      tipo: 'correctivo'
    },
    {
      id: 'ODT-003',
      clienteId: 'cmbteqkv0000276w9kdsfey2d',
      equipos: [1],
      tecnicoId: 1,
      tipoServicio: 'preventivo',
      descripcion: 'Limpieza y revisión general',
      fecha: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], // Hace 7 días
      hora: '10:30',
      estado: 'completado',
      prioridad: 'media',
      tipo: 'preventivo',
      evaluacion: {
        calificacion: 5,
        comentario: 'Excelente trabajo, muy profesional',
        fecha: new Date(Date.now() - 6 * 86400000).toISOString()
      }
    },
    {
      id: 'ODT-004',
      clienteId: 'cmbteqkv0000276w9kdsfey2d',
      equipos: [2],
      tecnicoId: 2,
      tipoServicio: 'correctivo',
      descripcion: 'Revisión técnica del sistema',
      fecha: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0], // Hace 14 días
      hora: '15:30',
      estado: 'completado',
      prioridad: 'media',
      tipo: 'correctivo'
    }
  ],
  repuestos: [],
  herramientas: [],
  administradores: [
    {
      id: 1,
      nombre: 'Administrador',
      apellido: 'Principal',
      email: 'admin@sistema.com',
      usuario: 'admin',
      password: 'admin123'
    }
  ]
};