const prisma = require('../config/database');

const servicioController = {
  // Obtener todos los servicios
  getAll: async (req, res) => {
    try {
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
          clienteId ? { equipo: { clienteId: parseInt(clienteId) } } : {},
          fechaInicio ? { fechaProgramada: { gte: new Date(fechaInicio) } } : {},
          fechaFin ? { fechaProgramada: { lte: new Date(fechaFin) } } : {}
        ]
      };

      const [servicios, total] = await Promise.all([
        prisma.servicio.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          include: {
            equipo: {
              include: {
                cliente: {
                  select: { id: true, nombre: true, apellido: true, telefono: true, email: true }
                }
              }
            },
            tecnico: {
              select: { id: true, nombre: true, apellido: true, telefono: true, especialidad: true }
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
    try {
      const { 
        clienteId,
        equipoId, 
        tipoServicio, 
        descripcion, 
        fechaProgramada, 
        prioridad = 'MEDIA',
        observaciones,
        detalles
      } = req.body;

      // Verificar que el cliente existe
      const cliente = await prisma.cliente.findUnique({
        where: { id: parseInt(clienteId) }
      });

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      // Verificar equipo si se proporciona
      let equipo = null;
      if (equipoId) {
        equipo = await prisma.equipo.findFirst({
          where: { 
            id: parseInt(equipoId),
            clienteId: parseInt(clienteId)
          }
        });

        if (!equipo) {
          return res.status(404).json({
            success: false,
            message: 'Equipo no encontrado o no pertenece al cliente especificado'
          });
        }
      }

      // Generar número de orden único
      const lastService = await prisma.servicio.findFirst({
        orderBy: { id: 'desc' }
      });
      
      const nextNumber = lastService ? lastService.id + 1 : 1;
      const numeroOrden = `ODT-${nextNumber.toString().padStart(3, '0')}`;

      const servicio = await prisma.servicio.create({
        data: {
          numeroOrden,
          equipoId: equipoId ? parseInt(equipoId) : null,
          tipoServicio,
          descripcion,
          fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : null,
          estado: 'PENDIENTE',
          prioridad,
          observaciones: observaciones || null,
          detalles: detalles || null,
          // Para servicios sin equipo específico, crear relación directa con cliente
          ...(equipoId ? {} : { clienteDirecto: parseInt(clienteId) })
        },
        include: {
          equipo: {
            include: {
              cliente: {
                select: { id: true, nombre: true, apellido: true }
              }
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Servicio creado exitosamente',
        data: servicio
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
        estado,
        prioridad,
        observaciones,
        detalles,
        evaluacion
      } = req.body;

      const servicio = await prisma.servicio.findUnique({
        where: { id: parseInt(id) }
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
        where: { id: parseInt(id) },
        data: {
          tecnicoId: tecnicoId ? parseInt(tecnicoId) : servicio.tecnicoId,
          tipoServicio: tipoServicio || servicio.tipoServicio,
          descripcion: descripcion || servicio.descripcion,
          fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : servicio.fechaProgramada,
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
        where: { id: parseInt(id) }
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

      if (tecnico.disponibilidad !== 'DISPONIBLE') {
        return res.status(400).json({
          success: false,
          message: 'El técnico no está disponible actualmente'
        });
      }

      const servicioActualizado = await prisma.servicio.update({
        where: { id: parseInt(id) },
        data: {
          tecnicoId: parseInt(tecnicoId),
          fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : servicio.fechaProgramada,
          estado: 'PROCESO'
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

  // Completar servicio
  completar: async (req, res) => {
    try {
      const { id } = req.params;
      const { observacionesFinales, evaluacion, repuestosUsados, tiempoEmpleado } = req.body;

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
          message: 'El servicio ya está completado'
        });
      }

      const servicioCompletado = await prisma.servicio.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'COMPLETADO',
          fechaCompletado: new Date(),
          observaciones: observacionesFinales || servicio.observaciones,
          evaluacion: evaluacion || servicio.evaluacion,
          detalles: {
            ...(servicio.detalles || {}),
            repuestosUsados: repuestosUsados || [],
            tiempoEmpleado: tiempoEmpleado || null,
            fechaFinalizacion: new Date().toISOString()
          }
        },
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
          }
        }
      });

      res.json({
        success: true,
        message: 'Servicio completado exitosamente',
        data: servicioCompletado
      });
    } catch (error) {
      console.error('Error al completar servicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
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