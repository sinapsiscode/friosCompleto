const prisma = require('../config/database');

// Función helper para generar número de orden único
const generateOrderNumber = async () => {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  // Buscar el último número de orden del día
  const lastOrder = await prisma.servicio.findFirst({
    where: {
      numeroOrden: {
        startsWith: `ODT-${year}${month}${day}`
      }
    },
    orderBy: { numeroOrden: 'desc' }
  });
  
  let nextNumber = 1;
  if (lastOrder) {
    const lastNumber = parseInt(lastOrder.numeroOrden.slice(-3));
    nextNumber = lastNumber + 1;
  }
  
  return `ODT-${year}${month}${day}${String(nextNumber).padStart(3, '0')}`;
};

const servicioController = {
  // Obtener todos los servicios
  getAll: async (req, res) => {
    try {
      console.log('📋 === GET ALL SERVICIOS ===');
      console.log('👤 Usuario:', req.user);
      console.log('🔍 Query params:', req.query);

      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        estado, 
        prioridad, 
        tecnicoId, 
        clienteId,
        fechaInicio,
        fechaFin 
      } = req.query;
      const skip = (page - 1) * limit;

      // Si es un cliente, solo puede ver sus propios servicios
      let finalClienteId = clienteId;
      if (req.user.role === 'CLIENTE') {
        console.log('🔍 Es cliente, buscando perfil...');
        try {
          // Buscar el perfil del cliente basado en el userId
          const clientePerfil = await prisma.cliente.findUnique({
            where: { userId: req.user.id }
          });
          console.log('👤 Perfil encontrado:', clientePerfil);
          if (clientePerfil) {
            finalClienteId = clientePerfil.id;
            console.log('✅ Using clienteId:', finalClienteId);
          } else {
            console.log('❌ No se encontró perfil del cliente');
            return res.status(404).json({
              success: false,
              message: 'Perfil de cliente no encontrado'
            });
          }
        } catch (error) {
          console.error('❌ Error buscando perfil del cliente:', error);
          return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
          });
        }
      }

      const where = {
        AND: [
          search ? {
            OR: [
              { numeroOrden: { contains: search, mode: 'insensitive' } },
              { tipoServicio: { contains: search, mode: 'insensitive' } },
              { descripcion: { contains: search, mode: 'insensitive' } },
              { equipo: { 
                OR: [
                  { nombre: { contains: search, mode: 'insensitive' } },
                  { marca: { contains: search, mode: 'insensitive' } },
                  { modelo: { contains: search, mode: 'insensitive' } }
                ]
              }},
              { equipo: { 
                cliente: {
                  OR: [
                    { nombre: { contains: search, mode: 'insensitive' } },
                    { apellido: { contains: search, mode: 'insensitive' } }
                  ]
                }
              }}
            ]
          } : {},
          estado ? { estado } : {},
          prioridad ? { prioridad } : {},
          tecnicoId ? { tecnicoId: parseInt(tecnicoId) } : {},
          finalClienteId ? { clienteId: parseInt(finalClienteId) } : {},
          fechaInicio ? { fechaProgramada: { gte: new Date(fechaInicio) } } : {},
          fechaFin ? { fechaProgramada: { lte: new Date(fechaFin) } } : {}
        ]
      };

      console.log('🔍 Where clause final:', JSON.stringify(where, null, 2));
      console.log('📊 Skip:', skip, 'Limit:', limit);

      const [servicios, total] = await Promise.all([
        prisma.servicio.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          include: {
            cliente: {
              select: { id: true, nombre: true, apellido: true, razonSocial: true, telefono: true, email: true }
            },
            equipo: {
              include: {
                cliente: {
                  select: { id: true, nombre: true, apellido: true, telefono: true, email: true }
                }
              }
            },
            tecnico: {
              select: { id: true, nombre: true, apellido: true, telefono: true, especialidad: true }
            },
            equiposServicio: {
              include: {
                equipo: {
                  select: { id: true, nombre: true, tipo: true, marca: true, modelo: true }
                }
              }
            }
          },
          orderBy: [
            { prioridad: 'desc' },
            { fechaProgramada: 'asc' },
            { createdAt: 'desc' }
          ]
        }),
        prisma.servicio.count({ where })
      ]);

      console.log('✅ Servicios encontrados:', servicios.length);
      console.log('📊 Total count:', total);
      console.log('📋 Servicios IDs:', servicios.map(s => ({ id: s.id, clienteId: s.clienteId })));

      res.json({
        success: true,
        data: servicios,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error al obtener servicios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener servicio por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      // Permitir búsqueda por ID numérico o número de orden
      const where = isNaN(id) 
        ? { numeroOrden: id }
        : { id: parseInt(id) };

      const servicio = await prisma.servicio.findFirst({
        where,
        include: {
          equipo: {
            include: {
              cliente: {
                select: { id: true, nombre: true, apellido: true, telefono: true, email: true, direccion: true }
              }
            }
          },
          tecnico: {
            select: { id: true, nombre: true, apellido: true, telefono: true, especialidad: true, disponibilidad: true }
          }
        }
      });

      if (!servicio) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado'
        });
      }

      res.json({
        success: true,
        data: servicio
      });
    } catch (error) {
      console.error('Error al obtener servicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear nuevo servicio
  create: async (req, res) => {
    console.log('📋 === CREAR SERVICIO ===');
    console.log('📝 Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    try {
      const { 
        clienteId,
        equipoId, 
        tecnicoId,
        tipoServicio, 
        descripcion, 
        fechaProgramada, 
        prioridad = 'MEDIA',
        observaciones,
        detalles,
        equiposIds, // Array de IDs de equipos para múltiples equipos
        // Campos adicionales del frontend
        direccionServicio,
        ciudadServicio,
        distritoServicio
      } = req.body;

      // Verificar que el cliente existe
      console.log('🔍 Verificando cliente:', clienteId);
      const cliente = await prisma.cliente.findUnique({
        where: { id: parseInt(clienteId) }
      });

      if (!cliente) {
        console.log('❌ Cliente no encontrado');
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      // Verificar técnico si se proporciona
      let tecnico = null;
      if (tecnicoId) {
        console.log('🔍 Verificando técnico:', tecnicoId);
        tecnico = await prisma.tecnico.findUnique({
          where: { id: parseInt(tecnicoId) }
        });

        if (!tecnico) {
          console.log('❌ Técnico no encontrado');
          return res.status(404).json({
            success: false,
            message: 'Técnico no encontrado'
          });
        }
      }

      // Verificar equipo principal si se proporciona
      let equipo = null;
      if (equipoId) {
        console.log('🔍 Verificando equipo principal:', equipoId);
        equipo = await prisma.equipo.findFirst({
          where: { 
            id: parseInt(equipoId),
            clienteId: parseInt(clienteId)
          }
        });

        if (!equipo) {
          console.log('❌ Equipo principal no encontrado o no pertenece al cliente');
          return res.status(404).json({
            success: false,
            message: 'Equipo no encontrado o no pertenece al cliente especificado'
          });
        }
      }

      // Verificar equipos adicionales si se proporcionan
      let equiposAdicionales = [];
      if (equiposIds && equiposIds.length > 0) {
        console.log('🔍 Verificando equipos adicionales:', equiposIds);
        equiposAdicionales = await prisma.equipo.findMany({
          where: {
            id: { in: equiposIds.map(id => parseInt(id)) },
            clienteId: parseInt(clienteId)
          }
        });

        if (equiposAdicionales.length !== equiposIds.length) {
          console.log('❌ Algunos equipos adicionales no encontrados');
          return res.status(404).json({
            success: false,
            message: 'Algunos equipos no encontrados o no pertenecen al cliente'
          });
        }
      }

      // Generar número de orden único
      console.log('🔢 Generando número de orden...');
      const numeroOrden = await generateOrderNumber();

      // Crear servicio en transacción para manejar múltiples equipos
      console.log('💾 Creando servicio en transacción...');
      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Crear el servicio principal
        const servicio = await tx.servicio.create({
          data: {
            id: numeroOrden,
            numeroOrden,
            clienteId: parseInt(clienteId),
            equipoId: equipoId ? parseInt(equipoId) : null,
            tecnicoId: tecnicoId ? parseInt(tecnicoId) : null,
            tipoServicio,
            descripcion,
            fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : null,
            estado: 'PENDIENTE',
            prioridad,
            observaciones: observaciones || null,
            detalles: detalles || null
          }
        });

        // 2. Crear relaciones con equipos adicionales si existen
        if (equiposIds && equiposIds.length > 0) {
          console.log('🔗 Creando relaciones con equipos adicionales...');
          const equiposRelaciones = equiposIds.map(eqId => ({
            servicioId: servicio.id,
            equipoId: parseInt(eqId)
          }));

          await tx.servicioEquipo.createMany({
            data: equiposRelaciones
          });
        }

        // 3. Recuperar el servicio completo con todas las relaciones
        const servicioCompleto = await tx.servicio.findUnique({
          where: { id: servicio.id },
          include: {
            cliente: {
              select: { id: true, nombre: true, apellido: true, email: true, telefono: true }
            },
            equipo: {
              select: { id: true, nombre: true, tipo: true, marca: true, modelo: true }
            },
            tecnico: {
              select: { id: true, nombre: true, apellido: true, especialidad: true }
            },
            equiposServicio: {
              include: {
                equipo: {
                  select: { id: true, nombre: true, tipo: true, marca: true, modelo: true }
                }
              }
            }
          }
        });

        return servicioCompleto;
      });

      console.log('✅ Servicio creado exitosamente:', resultado.numeroOrden);
      res.status(201).json({
        success: true,
        message: 'Servicio creado exitosamente',
        data: resultado
      });
    } catch (error) {
      console.error('Error al crear servicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar servicio
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        tecnicoId,
        tipoServicio, 
        descripcion, 
        fechaProgramada, 
        fechaInicio,
        estado,
        prioridad,
        observaciones,
        detalles,
        evaluacion
      } = req.body;

      console.log('🔄 Actualizando servicio:', id);
      console.log('📝 Datos recibidos:', req.body);

      const servicio = await prisma.servicio.findUnique({
        where: { id: id }
      });

      if (!servicio) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado'
        });
      }

      // Verificar técnico si se asigna
      if (tecnicoId) {
        const tecnico = await prisma.tecnico.findUnique({
          where: { id: parseInt(tecnicoId) }
        });

        if (!tecnico || !tecnico.isActive) {
          return res.status(404).json({
            success: false,
            message: 'Técnico no encontrado o inactivo'
          });
        }
      }

      // Validar transiciones de estado
      const estadosValidos = ['PENDIENTE', 'PROCESO', 'COMPLETADO', 'CANCELADO'];
      if (estado && !estadosValidos.includes(estado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado no válido'
        });
      }

      const servicioActualizado = await prisma.servicio.update({
        where: { id: id },
        data: {
          tecnicoId: tecnicoId ? parseInt(tecnicoId) : servicio.tecnicoId,
          tipoServicio: tipoServicio || servicio.tipoServicio,
          descripcion: descripcion || servicio.descripcion,
          fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : servicio.fechaProgramada,
          fechaInicio: fechaInicio ? new Date(fechaInicio) : servicio.fechaInicio,
          estado: estado || servicio.estado,
          prioridad: prioridad || servicio.prioridad,
          observaciones: observaciones !== undefined ? observaciones : servicio.observaciones,
          detalles: detalles !== undefined ? detalles : servicio.detalles,
          evaluacion: evaluacion !== undefined ? evaluacion : servicio.evaluacion,
          // Actualizar fecha de finalización si se completa
          fechaCompletado: estado === 'COMPLETADO' ? new Date() : servicio.fechaCompletado
        },
        include: {
          equipo: {
            include: {
              cliente: {
                select: { id: true, nombre: true, apellido: true }
              }
            }
          },
          tecnico: {
            select: { id: true, nombre: true, apellido: true }
          }
        }
      });

      res.json({
        success: true,
        message: 'Servicio actualizado exitosamente',
        data: servicioActualizado
      });
    } catch (error) {
      console.error('Error al actualizar servicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Asignar técnico a servicio
  asignarTecnico: async (req, res) => {
    try {
      const { id } = req.params;
      const { tecnicoId, fechaProgramada } = req.body;

      const servicio = await prisma.servicio.findUnique({
        where: { id: id }
      });

      if (!servicio) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado'
        });
      }

      // Verificar que el técnico existe y está disponible
      const tecnico = await prisma.tecnico.findUnique({
        where: { id: parseInt(tecnicoId) }
      });

      if (!tecnico || !tecnico.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Técnico no encontrado o inactivo'
        });
      }

      // Los técnicos siempre pueden ser asignados independientemente de su disponibilidad

      const servicioActualizado = await prisma.servicio.update({
        where: { id: id },
        data: {
          tecnicoId: parseInt(tecnicoId),
          fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : servicio.fechaProgramada,
          // Mantener el estado PENDIENTE cuando se asigna técnico
          // El técnico puede iniciar manualmente después
        },
        include: {
          equipo: {
            include: {
              cliente: {
                select: { id: true, nombre: true, apellido: true }
              }
            }
          },
          tecnico: {
            select: { id: true, nombre: true, apellido: true, telefono: true }
          }
        }
      });

      res.json({
        success: true,
        message: 'Técnico asignado exitosamente',
        data: servicioActualizado
      });
    } catch (error) {
      console.error('Error al asignar técnico:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Iniciar servicio (por el técnico)
  iniciarServicio: async (req, res) => {
    try {
      const { id } = req.params;
      
      const servicio = await prisma.servicio.findUnique({
        where: { id: id },
        include: {
          tecnico: {
            select: { id: true, nombre: true, apellido: true }
          }
        }
      });

      if (!servicio) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado'
        });
      }

      // Verificar que el servicio está asignado a un técnico
      if (!servicio.tecnicoId) {
        return res.status(400).json({
          success: false,
          message: 'El servicio debe tener un técnico asignado para poder iniciarse'
        });
      }

      // Verificar que el servicio está en estado PENDIENTE
      if (servicio.estado !== 'PENDIENTE') {
        return res.status(400).json({
          success: false,
          message: `El servicio ya está en estado ${servicio.estado}`
        });
      }

      const servicioActualizado = await prisma.servicio.update({
        where: { id: id },
        data: {
          estado: 'PROCESO',
          fechaInicio: new Date()
        },
        include: {
          equipo: {
            include: {
              cliente: {
                select: { id: true, nombre: true, apellido: true, razonSocial: true }
              }
            }
          },
          tecnico: {
            select: { id: true, nombre: true, apellido: true, telefono: true }
          }
        }
      });

      res.json({
        success: true,
        message: 'Servicio iniciado exitosamente',
        data: servicioActualizado
      });
    } catch (error) {
      console.error('Error al iniciar servicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Completar servicio
  completar: async (req, res) => {
    try {
      const { id } = req.params;
      // Extraer datos del cuerpo de la solicitud
      let {
        // Nuevos campos del formulario
        trabajosRealizados,
        repuestosUtilizados, // Array de IDs
        recomendaciones,
        proximoMantenimiento,
        frecuenciaMantenimiento,
        fotosAntes,
        fotosDespues,
        fotos,
        // Campos existentes (mantener compatibilidad)
        observacionesFinales,
        evaluacion,
        repuestosUsados, // Para compatibilidad
        tiempoEmpleado
      } = req.body;

      // Si vienen como strings JSON desde FormData, parsearlos
      try {
        if (typeof repuestosUtilizados === 'string') {
          repuestosUtilizados = JSON.parse(repuestosUtilizados);
        }
        if (typeof fotosAntes === 'string') {
          fotosAntes = JSON.parse(fotosAntes);
        }
        if (typeof fotosDespues === 'string') {
          fotosDespues = JSON.parse(fotosDespues);
        }
        if (typeof fotos === 'string') {
          fotos = JSON.parse(fotos);
        }
      } catch (parseError) {
        console.log('⚠️ Error parsing JSON fields:', parseError.message);
        // Continuar con los valores originales si no se pueden parsear
      }

      console.log('🔧 === COMPLETAR SERVICIO ===');
      console.log('📝 ID del servicio:', id);
      console.log('📝 Datos recibidos:', JSON.stringify(req.body, null, 2));

      const servicio = await prisma.servicio.findUnique({
        where: { id: id }
      });

      if (!servicio) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado'
        });
      }

      if (servicio.estado === 'COMPLETADO') {
        return res.status(400).json({
          success: false,
          message: 'El servicio ya está completado'
        });
      }

      console.log('📋 Servicio encontrado, iniciando transacción...');

      // Usar transacción para manejar múltiples tablas
      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Actualizar servicio principal con nuevos campos
        const servicioActualizado = await tx.servicio.update({
          where: { id: id },
          data: {
            estado: 'COMPLETADO',
            fechaCompletado: new Date(),
            // Nuevos campos específicos
            trabajosRealizados: trabajosRealizados || null,
            recomendaciones: recomendaciones || null,
            proximoMantenimiento: proximoMantenimiento ? new Date(proximoMantenimiento) : null,
            frecuenciaMantenimiento: frecuenciaMantenimiento || null,
            // Mantener compatibilidad con campos existentes
            observaciones: observacionesFinales || servicio.observaciones,
            evaluacion: evaluacion || servicio.evaluacion,
            detalles: {
              ...(servicio.detalles || {}),
              repuestosUsados: repuestosUsados || [],
              tiempoEmpleado: tiempoEmpleado || null,
              fechaFinalizacion: new Date().toISOString()
            }
          }
        });

        console.log('✅ Servicio principal actualizado');

        // 2. Guardar repuestos utilizados en tabla separada
        if (repuestosUtilizados && repuestosUtilizados.length > 0) {
          console.log('💊 Guardando repuestos utilizados:', repuestosUtilizados);
          
          // Eliminar repuestos existentes para este servicio (si los hay)
          await tx.servicioRepuesto.deleteMany({
            where: { servicioId: id }
          });

          // Crear nuevos registros de repuestos
          const repuestosData = repuestosUtilizados.map(repuestoId => ({
            servicioId: id,
            repuestoId: parseInt(repuestoId),
            cantidad: 1
          }));
          
          await tx.servicioRepuesto.createMany({
            data: repuestosData
          });

          console.log(`✅ ${repuestosData.length} repuestos guardados`);
        }

        // 3. Guardar fotos en tabla separada
        const fotosParaGuardar = [];
        
        // Fotos ANTES del servicio
        if (fotosAntes && fotosAntes.length > 0) {
          console.log('📷 Procesando fotos ANTES:', fotosAntes.length);
          fotosAntes.forEach((foto, index) => {
            fotosParaGuardar.push({
              servicioId: id,
              tipo: 'ANTES',
              archivoPath: typeof foto === 'string' ? foto : (foto.path || `foto_antes_${index}.jpg`),
              nombreOriginal: typeof foto === 'string' ? `foto_antes_${index}.jpg` : (foto.name || `foto_antes_${index}.jpg`)
            });
          });
        }
        
        // Fotos DESPUÉS del servicio
        if (fotosDespues && fotosDespues.length > 0) {
          console.log('📷 Procesando fotos DESPUÉS:', fotosDespues.length);
          fotosDespues.forEach((foto, index) => {
            fotosParaGuardar.push({
              servicioId: id,
              tipo: 'DESPUES',
              archivoPath: typeof foto === 'string' ? foto : (foto.path || `foto_despues_${index}.jpg`),
              nombreOriginal: typeof foto === 'string' ? `foto_despues_${index}.jpg` : (foto.name || `foto_despues_${index}.jpg`)
            });
          });
        }

        // Fotos adicionales
        if (fotos && fotos.length > 0) {
          console.log('📷 Procesando fotos adicionales:', fotos.length);
          fotos.forEach((foto, index) => {
            fotosParaGuardar.push({
              servicioId: id,
              tipo: 'ADICIONAL',
              archivoPath: typeof foto === 'string' ? foto : (foto.path || `foto_adicional_${index}.jpg`),
              nombreOriginal: typeof foto === 'string' ? `foto_adicional_${index}.jpg` : (foto.name || `foto_adicional_${index}.jpg`)
            });
          });
        }

        // Guardar todas las fotos si hay alguna
        if (fotosParaGuardar.length > 0) {
          console.log(`📸 Guardando ${fotosParaGuardar.length} fotos...`);
          
          // Eliminar fotos existentes para este servicio (si las hay)
          await tx.servicioFoto.deleteMany({
            where: { servicioId: id }
          });

          // Crear nuevos registros de fotos
          await tx.servicioFoto.createMany({
            data: fotosParaGuardar
          });

          console.log(`✅ ${fotosParaGuardar.length} fotos guardadas`);
        }

        // 4. Retornar servicio completo con todas las relaciones
        const servicioCompleto = await tx.servicio.findUnique({
          where: { id: id },
          include: {
            equipo: {
              include: {
                cliente: {
                  select: { id: true, nombre: true, apellido: true, telefono: true, email: true }
                }
              }
            },
            tecnico: {
              select: { id: true, nombre: true, apellido: true }
            },
            repuestosUtilizados: {
              include: {
                repuesto: {
                  select: { id: true, nombre: true, descripcion: true }
                }
              }
            },
            fotos: {
              select: { id: true, tipo: true, archivoPath: true, nombreOriginal: true, createdAt: true }
            }
          }
        });

        return servicioCompleto;
      });

      console.log('🎉 Servicio completado exitosamente');

      res.json({
        success: true,
        message: 'Servicio completado exitosamente',
        data: resultado
      });
    } catch (error) {
      console.error('❌ Error al completar servicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Cancelar servicio
  cancelar: async (req, res) => {
    try {
      const { id } = req.params;
      const { motivoCancelacion } = req.body;

      const servicio = await prisma.servicio.findUnique({
        where: { id: parseInt(id) }
      });

      if (!servicio) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado'
        });
      }

      if (servicio.estado === 'COMPLETADO') {
        return res.status(400).json({
          success: false,
          message: 'No se puede cancelar un servicio completado'
        });
      }

      const servicioCancelado = await prisma.servicio.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'CANCELADO',
          observaciones: motivoCancelacion || 'Servicio cancelado',
          detalles: {
            ...(servicio.detalles || {}),
            motivoCancelacion: motivoCancelacion || 'No especificado',
            fechaCancelacion: new Date().toISOString()
          }
        }
      });

      res.json({
        success: true,
        message: 'Servicio cancelado exitosamente',
        data: servicioCancelado
      });
    } catch (error) {
      console.error('Error al cancelar servicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener estadísticas de servicios
  getEstadisticas: async (req, res) => {
    try {
      const { fechaInicio, fechaFin, tecnicoId } = req.query;

      const whereCondition = {
        ...(fechaInicio && { createdAt: { gte: new Date(fechaInicio) } }),
        ...(fechaFin && { createdAt: { lte: new Date(fechaFin) } }),
        ...(tecnicoId && { tecnicoId: parseInt(tecnicoId) })
      };

      const [
        totalServicios,
        serviciosPendientes,
        serviciosEnProceso,
        serviciosCompletados,
        serviciosCancelados,
        serviciosPorPrioridad
      ] = await Promise.all([
        prisma.servicio.count({ where: whereCondition }),
        prisma.servicio.count({ where: { ...whereCondition, estado: 'PENDIENTE' } }),
        prisma.servicio.count({ where: { ...whereCondition, estado: 'PROCESO' } }),
        prisma.servicio.count({ where: { ...whereCondition, estado: 'COMPLETADO' } }),
        prisma.servicio.count({ where: { ...whereCondition, estado: 'CANCELADO' } }),
        prisma.servicio.groupBy({
          by: ['prioridad'],
          where: whereCondition,
          _count: { id: true }
        })
      ]);

      const prioridadMap = serviciosPorPrioridad.reduce((acc, item) => {
        acc[item.prioridad] = item._count.id;
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          total: totalServicios,
          pendientes: serviciosPendientes,
          enProceso: serviciosEnProceso,
          completados: serviciosCompletados,
          cancelados: serviciosCancelados,
          porPrioridad: {
            baja: prioridadMap.BAJA || 0,
            media: prioridadMap.MEDIA || 0,
            alta: prioridadMap.ALTA || 0,
            urgente: prioridadMap.URGENTE || 0
          }
        }
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = servicioController;