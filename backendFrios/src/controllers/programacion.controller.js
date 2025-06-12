const prisma = require('../config/database');

const programacionController = {
  // Obtener todas las programaciones
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10, clienteId, estado } = req.query;
      const skip = (page - 1) * limit;

      const where = {
        AND: [
          clienteId ? { clienteId: parseInt(clienteId) } : {},
          estado ? { estado } : {},
          { isActive: true }
        ]
      };

      const [programaciones, total] = await Promise.all([
        prisma.programacion.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          include: {
            cliente: {
              select: { id: true, nombre: true, apellido: true }
            },
            servicios: {
              select: { id: true, estado: true, fechaProgramada: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.programacion.count({ where })
      ]);

      res.json({
        success: true,
        data: programaciones,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error al obtener programaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear nueva programación
  create: async (req, res) => {
    try {
      const { 
        clienteId, 
        frecuencia, 
        fechaInicio, 
        fechaFin, 
        descripcion,
        equipos,
        diasSemana,
        diaMes
      } = req.body;

      const programacion = await prisma.programacion.create({
        data: {
          clienteId: parseInt(clienteId),
          frecuencia,
          fechaInicio: new Date(fechaInicio),
          fechaFin: new Date(fechaFin),
          descripcion,
          equipos,
          diasSemana,
          diaMes: diaMes ? parseInt(diaMes) : null,
          estado: 'activa'
        },
        include: {
          cliente: {
            select: { id: true, nombre: true, apellido: true }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Programación creada exitosamente',
        data: programacion
      });
    } catch (error) {
      console.error('Error al crear programación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar programación
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado, fechaFin, descripcion } = req.body;

      const programacion = await prisma.programacion.update({
        where: { id: parseInt(id) },
        data: {
          estado,
          fechaFin: fechaFin ? new Date(fechaFin) : undefined,
          descripcion
        }
      });

      res.json({
        success: true,
        message: 'Programación actualizada exitosamente',
        data: programacion
      });
    } catch (error) {
      console.error('Error al actualizar programación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = programacionController;