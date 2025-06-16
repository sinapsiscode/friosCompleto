const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const programacionController = {
  // Obtener todas las programaciones
  getAll: async (req, res) => {
    try {
      console.log('📅 === PROGRAMACION CONTROLLER GET ALL ===');
      
      const { page = 1, limit = 50, clienteId, tecnicoId, frecuencia, isActive } = req.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);
      
      // Construir filtros
      const where = {};
      if (clienteId) where.clienteId = parseInt(clienteId);
      if (tecnicoId) where.tecnicoId = parseInt(tecnicoId);
      if (frecuencia) where.frecuencia = frecuencia;
      if (isActive !== undefined) where.isActive = isActive === 'true';
      
      console.log('🔍 Filtros aplicados:', where);
      
      const [programaciones, total] = await Promise.all([
        prisma.programacion.findMany({
          where,
          skip,
          take,
          include: {
            cliente: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                razonSocial: true,
                email: true,
                telefono: true
              }
            },
            tecnico: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                especialidad: true,
                telefono: true
              }
            },
            _count: {
              select: {
                servicios: true
              }
            }
          },
          orderBy: {
            proximaEjecucion: 'asc'
          }
        }),
        prisma.programacion.count({ where })
      ]);
      
      console.log('✅ Programaciones encontradas:', programaciones.length);
      
      res.json({
        success: true,
        data: programaciones,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
      
    } catch (error) {
      console.error('❌ Error al obtener programaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener programaciones',
        error: error.message
      });
    }
  },

  // Obtener programación por ID
  getById: async (req, res) => {
    try {
      console.log('📅 === PROGRAMACION CONTROLLER GET BY ID ===');
      
      const { id } = req.params;
      console.log('🆔 ID programación:', id);
      
      const programacion = await prisma.programacion.findUnique({
        where: { id: parseInt(id) },
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              razonSocial: true,
              email: true,
              telefono: true,
              direccion: true
            }
          },
          tecnico: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              especialidad: true,
              telefono: true,
              email: true
            }
          },
          servicios: {
            select: {
              id: true,
              numeroOrden: true,
              fechaProgramada: true,
              estado: true,
              fechaCompletado: true
            },
            orderBy: {
              fechaProgramada: 'desc'
            },
            take: 10
          }
        }
      });
      
      if (!programacion) {
        console.log('❌ Programación no encontrada');
        return res.status(404).json({
          success: false,
          message: 'Programación no encontrada'
        });
      }
      
      console.log('✅ Programación encontrada:', programacion.nombre);
      
      res.json({
        success: true,
        data: programacion
      });
      
    } catch (error) {
      console.error('❌ Error al obtener programación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener programación',
        error: error.message
      });
    }
  },

  // Crear nueva programación
  create: async (req, res) => {
    try {
      console.log('📅 === PROGRAMACION CONTROLLER CREATE ===');
      console.log('📝 Datos recibidos:', req.body);
      
      const {
        clienteId,
        tecnicoId,
        nombre,
        descripcion,
        tipoServicio = 'programado',
        frecuencia,
        intervaloDias,
        horaInicio,
        horaFin,
        diasSemana,
        diaMes,
        fechaInicio,
        fechaFin,
        prioridad = 'MEDIA',
        observaciones,
        equipos
      } = req.body;
      
      // Validaciones básicas
      if (!clienteId || !nombre || !frecuencia || !horaInicio || !fechaInicio) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios: clienteId, nombre, frecuencia, horaInicio, fechaInicio'
        });
      }
      
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
      
      // Verificar técnico si se proporciona
      if (tecnicoId) {
        const tecnico = await prisma.tecnico.findUnique({
          where: { id: parseInt(tecnicoId) }
        });
        
        if (!tecnico) {
          return res.status(404).json({
            success: false,
            message: 'Técnico no encontrado'
          });
        }
      }
      
      // Crear fecha de inicio sin problemas de zona horaria
      const fechaInicioLocal = new Date(fechaInicio + 'T00:00:00');
      
      // Para la primera programación, la próxima ejecución ES la fecha de inicio
      const proximaEjecucion = fechaInicioLocal;
      
      const programacion = await prisma.programacion.create({
        data: {
          clienteId: parseInt(clienteId),
          tecnicoId: tecnicoId ? parseInt(tecnicoId) : null,
          nombre,
          descripcion,
          tipoServicio,
          frecuencia,
          intervaloDias,
          horaInicio,
          horaFin,
          diasSemana: diasSemana ? JSON.parse(diasSemana) : null,
          diaMes,
          fechaInicio: fechaInicioLocal,
          fechaFin: fechaFin ? new Date(fechaFin + 'T23:59:59') : null,
          proximaEjecucion,
          prioridad,
          observaciones,
          equipos: equipos ? JSON.parse(equipos) : []
        },
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              razonSocial: true
            }
          },
          tecnico: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              especialidad: true
            }
          }
        }
      });
      
      console.log('✅ Programación creada exitosamente:', programacion.id);
      
      res.status(201).json({
        success: true,
        message: 'Programación creada exitosamente',
        data: programacion
      });
      
    } catch (error) {
      console.error('❌ Error al crear programación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear programación',
        error: error.message
      });
    }
  },

  // Actualizar programación
  update: async (req, res) => {
    try {
      console.log('📅 === PROGRAMACION CONTROLLER UPDATE ===');
      
      const { id } = req.params;
      const updateData = req.body;
      
      console.log('🆔 ID:', id);
      console.log('📝 Datos a actualizar:', updateData);
      
      // Verificar que la programación existe
      const existingProgramacion = await prisma.programacion.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (!existingProgramacion) {
        return res.status(404).json({
          success: false,
          message: 'Programación no encontrada'
        });
      }
      
      // Preparar datos para actualización
      const dataToUpdate = {};
      
      // Campos simples
      if (updateData.nombre) dataToUpdate.nombre = updateData.nombre;
      if (updateData.descripcion !== undefined) dataToUpdate.descripcion = updateData.descripcion;
      if (updateData.tipoServicio) dataToUpdate.tipoServicio = updateData.tipoServicio;
      if (updateData.frecuencia) dataToUpdate.frecuencia = updateData.frecuencia;
      if (updateData.intervaloDias) dataToUpdate.intervaloDias = parseInt(updateData.intervaloDias);
      if (updateData.horaInicio) dataToUpdate.horaInicio = updateData.horaInicio;
      if (updateData.horaFin !== undefined) dataToUpdate.horaFin = updateData.horaFin;
      if (updateData.diaMes) dataToUpdate.diaMes = parseInt(updateData.diaMes);
      if (updateData.fechaInicio) dataToUpdate.fechaInicio = new Date(updateData.fechaInicio);
      if (updateData.fechaFin !== undefined) dataToUpdate.fechaFin = updateData.fechaFin ? new Date(updateData.fechaFin) : null;
      if (updateData.prioridad) dataToUpdate.prioridad = updateData.prioridad;
      if (updateData.observaciones !== undefined) dataToUpdate.observaciones = updateData.observaciones;
      if (updateData.isActive !== undefined) dataToUpdate.isActive = updateData.isActive;
      
      // Campos relacionales
      if (updateData.clienteId) dataToUpdate.clienteId = parseInt(updateData.clienteId);
      if (updateData.tecnicoId !== undefined) {
        dataToUpdate.tecnicoId = updateData.tecnicoId ? parseInt(updateData.tecnicoId) : null;
      }
      
      // Campos JSON
      if (updateData.diasSemana !== undefined) {
        dataToUpdate.diasSemana = updateData.diasSemana ? JSON.parse(updateData.diasSemana) : null;
      }
      if (updateData.equipos !== undefined) {
        dataToUpdate.equipos = updateData.equipos ? JSON.parse(updateData.equipos) : [];
      }
      
      // Recalcular próxima ejecución si cambió la frecuencia o fechas
      if (updateData.frecuencia || updateData.fechaInicio || updateData.intervaloDias || updateData.diasSemana || updateData.diaMes) {
        const fechaInicio = dataToUpdate.fechaInicio || existingProgramacion.fechaInicio;
        const frecuencia = dataToUpdate.frecuencia || existingProgramacion.frecuencia;
        const intervaloDias = dataToUpdate.intervaloDias || existingProgramacion.intervaloDias;
        const diasSemana = dataToUpdate.diasSemana || existingProgramacion.diasSemana;
        const diaMes = dataToUpdate.diaMes || existingProgramacion.diaMes;
        
        dataToUpdate.proximaEjecucion = calcularProximaEjecucion(frecuencia, fechaInicio, intervaloDias, diasSemana, diaMes);
      }
      
      const programacion = await prisma.programacion.update({
        where: { id: parseInt(id) },
        data: dataToUpdate,
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              razonSocial: true
            }
          },
          tecnico: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              especialidad: true
            }
          }
        }
      });
      
      console.log('✅ Programación actualizada exitosamente');
      
      res.json({
        success: true,
        message: 'Programación actualizada exitosamente',
        data: programacion
      });
      
    } catch (error) {
      console.error('❌ Error al actualizar programación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar programación',
        error: error.message
      });
    }
  },

  // Eliminar programación
  delete: async (req, res) => {
    try {
      console.log('📅 === PROGRAMACION CONTROLLER DELETE ===');
      
      const { id } = req.params;
      console.log('🆔 ID a eliminar:', id);
      
      // Verificar que la programación existe
      const existingProgramacion = await prisma.programacion.findUnique({
        where: { id: parseInt(id) },
        include: {
          _count: {
            select: {
              servicios: true
            }
          }
        }
      });
      
      if (!existingProgramacion) {
        return res.status(404).json({
          success: false,
          message: 'Programación no encontrada'
        });
      }
      
      // Si tiene servicios asociados, solo desactivar
      if (existingProgramacion._count.servicios > 0) {
        console.log('⚠️ Programación tiene servicios asociados, desactivando en lugar de eliminar');
        
        const programacion = await prisma.programacion.update({
          where: { id: parseInt(id) },
          data: { isActive: false }
        });
        
        return res.json({
          success: true,
          message: 'Programación desactivada debido a servicios asociados',
          data: programacion
        });
      }
      
      // Eliminar programación
      await prisma.programacion.delete({
        where: { id: parseInt(id) }
      });
      
      console.log('✅ Programación eliminada exitosamente');
      
      res.json({
        success: true,
        message: 'Programación eliminada exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error al eliminar programación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar programación',
        error: error.message
      });
    }
  },

  // Activar/Desactivar programación
  toggleActive: async (req, res) => {
    try {
      console.log('📅 === PROGRAMACION CONTROLLER TOGGLE ACTIVE ===');
      
      const { id } = req.params;
      console.log('🆔 ID:', id);
      
      const existingProgramacion = await prisma.programacion.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (!existingProgramacion) {
        return res.status(404).json({
          success: false,
          message: 'Programación no encontrada'
        });
      }
      
      const programacion = await prisma.programacion.update({
        where: { id: parseInt(id) },
        data: { isActive: !existingProgramacion.isActive },
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              razonSocial: true
            }
          }
        }
      });
      
      console.log(`✅ Programación ${programacion.isActive ? 'activada' : 'desactivada'} exitosamente`);
      
      res.json({
        success: true,
        message: `Programación ${programacion.isActive ? 'activada' : 'desactivada'} exitosamente`,
        data: programacion
      });
      
    } catch (error) {
      console.error('❌ Error al cambiar estado de programación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado de programación',
        error: error.message
      });
    }
  },

  // Generar servicios de programaciones activas
  generarServicios: async (req, res) => {
    try {
      console.log('📅 === PROGRAMACION CONTROLLER GENERAR SERVICIOS ===');
      
      const { fechaHasta } = req.query;
      const hasta = fechaHasta ? new Date(fechaHasta) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días por defecto
      
      console.log('📅 Generando servicios hasta:', hasta.toISOString());
      
      // Obtener programaciones activas que necesiten generar servicios
      const programaciones = await prisma.programacion.findMany({
        where: {
          isActive: true,
          OR: [
            { proximaEjecucion: { lte: hasta } },
            { proximaEjecucion: null }
          ]
        },
        include: {
          cliente: true,
          tecnico: true
        }
      });
      
      console.log(`🔍 Encontradas ${programaciones.length} programaciones para procesar`);
      
      let serviciosCreados = 0;
      const errores = [];
      
      for (const programacion of programaciones) {
        try {
          const serviciosGenerados = await generarServiciosParaProgramacion(programacion, hasta);
          serviciosCreados += serviciosGenerados;
          
          // Actualizar próxima ejecución usando la última fecha procesada
          const nuevaProximaEjecucion = calcularProximaEjecucion(
            programacion.frecuencia,
            programacion.fechaInicio,
            programacion.intervaloDias,
            programacion.diasSemana,
            programacion.diaMes,
            programacion.ultimaEjecucion
          );
          
          await prisma.programacion.update({
            where: { id: programacion.id },
            data: { 
              proximaEjecucion: nuevaProximaEjecucion,
              ultimaEjecucion: new Date()
            }
          });
          
        } catch (error) {
          console.error(`❌ Error procesando programación ${programacion.id}:`, error);
          errores.push({
            programacionId: programacion.id,
            nombre: programacion.nombre,
            error: error.message
          });
        }
      }
      
      console.log(`✅ Proceso completado: ${serviciosCreados} servicios creados`);
      
      res.json({
        success: true,
        message: `Generación de servicios completada`,
        data: {
          serviciosCreados,
          programacionesProcesadas: programaciones.length,
          errores
        }
      });
      
    } catch (error) {
      console.error('❌ Error al generar servicios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar servicios',
        error: error.message
      });
    }
  }
};

// Función auxiliar para calcular próxima ejecución
function calcularProximaEjecucion(frecuencia, fechaInicio, intervaloDias = null, diasSemana = null, diaMes = null, ultimaEjecucion = null) {
  // Crear fechas locales sin problemas de zona horaria
  const ahora = new Date();
  const inicio = new Date(fechaInicio);
  
  // Si hay última ejecución, usar esa como base; sino usar la fecha de inicio tal como la seleccionó el usuario
  let proxima = ultimaEjecucion ? new Date(ultimaEjecucion) : new Date(inicio);
  
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
      proxima.setDate(proxima.getDate() + 30); // Default mensual
  }
  
  return proxima;
}

// Función auxiliar para generar servicios de una programación
async function generarServiciosParaProgramacion(programacion, fechaHasta) {
  let serviciosCreados = 0;
  // Siempre empezar desde fechaInicio para respetar la selección del usuario
  let fechaActual = new Date(programacion.fechaInicio);
  
  // Usar mutex para evitar condiciones de carrera
  const lockKey = `programacion_${programacion.id}`;
  
  while (fechaActual <= fechaHasta) {
    // Usar transacción para verificación y creación atómica
    const servicioCreado = await prisma.$transaction(async (tx) => {
      // Verificación más específica de servicios existentes
      const existeServicio = await tx.servicio.findFirst({
        where: {
          programacionId: programacion.id,
          fechaProgramada: {
            gte: new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate()),
            lt: new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate() + 1)
          },
          horaInicio: programacion.horaInicio,
          isActive: true
        }
      });
      
      if (existeServicio) {
        return false; // Ya existe, no crear
      }
      
      // Generar número de orden único con timestamp más específico
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const numeroOrden = `ODT-${timestamp.toString().slice(-8)}${random}`;
      
      // Crear fecha y hora programada
      const [hora, minuto] = programacion.horaInicio.split(':');
      const fechaProgramada = new Date(fechaActual);
      fechaProgramada.setHours(parseInt(hora), parseInt(minuto), 0, 0);
      
      await tx.servicio.create({
        data: {
          id: numeroOrden,
          clienteId: programacion.clienteId,
          tecnicoId: programacion.tecnicoId,
          programacionId: programacion.id,
          equipoId: programacion.equipos?.length > 0 ? programacion.equipos[0] : null,
          tipoServicio: programacion.tipoServicio,
          descripcion: `${programacion.nombre} - ${programacion.descripcion || 'Mantenimiento programado'}`,
          fechaProgramada,
          prioridad: programacion.prioridad,
          observaciones: programacion.observaciones,
          numeroOrden,
          horaInicio: programacion.horaInicio,
          horaFin: programacion.horaFin,
          rangoHorario: programacion.horaFin ? `${programacion.horaInicio}-${programacion.horaFin}` : programacion.horaInicio,
          detalles: {
            generadoPor: 'programacion',
            programacionId: programacion.id,
            fechaOriginal: fechaActual.toISOString().split('T')[0],
            horaOriginal: programacion.horaInicio,
            equiposSeleccionados: programacion.equipos || []
          }
        }
      });
      
      return true; // Servicio creado
    });
    
    if (servicioCreado) {
      serviciosCreados++;
    }
    
    // Calcular siguiente fecha según frecuencia
    fechaActual = calcularProximaEjecucion(
      programacion.frecuencia,
      fechaActual,
      programacion.intervaloDias,
      programacion.diasSemana,
      programacion.diaMes
    );
  }
  
  return serviciosCreados;
}

module.exports = programacionController;