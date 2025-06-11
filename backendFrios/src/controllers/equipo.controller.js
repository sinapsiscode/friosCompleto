const prisma = require('../config/database');

const equipoController = {
  // Obtener todos los equipos
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', clienteId, tipo, estado } = req.query;
      const skip = (page - 1) * limit;

      const where = {
        AND: [
          search ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { tipo: { contains: search, mode: 'insensitive' } },
              { marca: { contains: search, mode: 'insensitive' } },
              { modelo: { contains: search, mode: 'insensitive' } },
              { numeroSerie: { contains: search, mode: 'insensitive' } },
              { ubicacion: { contains: search, mode: 'insensitive' } },
              { cliente: { 
                OR: [
                  { nombre: { contains: search, mode: 'insensitive' } },
                  { apellido: { contains: search, mode: 'insensitive' } }
                ]
              }}
            ]
          } : {},
          clienteId ? { clienteId: parseInt(clienteId) } : {},
          tipo ? { tipo: { contains: tipo, mode: 'insensitive' } } : {},
          estado !== undefined ? { isActive: estado === 'true' } : {}
        ]
      };

      const [equipos, total] = await Promise.all([
        prisma.equipo.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          include: {
            cliente: {
              select: { id: true, nombre: true, apellido: true, telefono: true, email: true }
            },
            servicios: {
              where: { estado: { in: ['PENDIENTE', 'PROCESO'] } },
              select: { id: true, numeroOrden: true, estado: true, fechaProgramada: true, tipoServicio: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.equipo.count({ where })
      ]);

      res.json({
        success: true,
        data: equipos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error al obtener equipos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener equipo por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const equipo = await prisma.equipo.findUnique({
        where: { id: parseInt(id) },
        include: {
          cliente: {
            select: { id: true, nombre: true, apellido: true, telefono: true, email: true, direccion: true }
          },
          servicios: {
            include: {
              tecnico: {
                select: { nombre: true, apellido: true, telefono: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!equipo) {
        return res.status(404).json({
          success: false,
          message: 'Equipo no encontrado'
        });
      }

      res.json({
        success: true,
        data: equipo
      });
    } catch (error) {
      console.error('Error al obtener equipo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear nuevo equipo
  create: async (req, res) => {
    try {
      const { 
        clienteId, 
        nombre, 
        tipo, 
        marca, 
        modelo, 
        numeroSerie, 
        ubicacion, 
        descripcion, 
        fechaInstalacion,
        especificacionesTecnicas,
        garantia
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

      // Verificar si ya existe un equipo con el mismo número de serie
      if (numeroSerie) {
        const equipoExistente = await prisma.equipo.findFirst({
          where: { numeroSerie }
        });

        if (equipoExistente) {
          return res.status(409).json({
            success: false,
            message: 'Ya existe un equipo con este número de serie'
          });
        }
      }

      const equipo = await prisma.equipo.create({
        data: {
          clienteId: parseInt(clienteId),
          nombre,
          tipo,
          marca: marca || null,
          modelo: modelo || null,
          numeroSerie: numeroSerie || null,
          ubicacion: ubicacion || null,
          descripcion: descripcion || null,
          fechaInstalacion: fechaInstalacion ? new Date(fechaInstalacion) : null,
          especificacionesTecnicas: especificacionesTecnicas || null,
          garantia: garantia || null,
          isActive: true
        },
        include: {
          cliente: {
            select: { id: true, nombre: true, apellido: true }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Equipo creado exitosamente',
        data: equipo
      });
    } catch (error) {
      console.error('Error al crear equipo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar equipo
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        nombre, 
        tipo, 
        marca, 
        modelo, 
        numeroSerie, 
        ubicacion, 
        descripcion, 
        fechaInstalacion,
        especificacionesTecnicas,
        garantia,
        isActive 
      } = req.body;

      const equipo = await prisma.equipo.findUnique({
        where: { id: parseInt(id) }
      });

      if (!equipo) {
        return res.status(404).json({
          success: false,
          message: 'Equipo no encontrado'
        });
      }

      // Verificar si el número de serie ya existe en otro equipo
      if (numeroSerie && numeroSerie !== equipo.numeroSerie) {
        const equipoExistente = await prisma.equipo.findFirst({
          where: { 
            numeroSerie,
            id: { not: parseInt(id) }
          }
        });

        if (equipoExistente) {
          return res.status(409).json({
            success: false,
            message: 'Ya existe otro equipo con este número de serie'
          });
        }
      }

      const equipoActualizado = await prisma.equipo.update({
        where: { id: parseInt(id) },
        data: {
          nombre,
          tipo,
          marca,
          modelo,
          numeroSerie,
          ubicacion,
          descripcion,
          fechaInstalacion: fechaInstalacion ? new Date(fechaInstalacion) : equipo.fechaInstalacion,
          especificacionesTecnicas,
          garantia,
          isActive
        },
        include: {
          cliente: {
            select: { id: true, nombre: true, apellido: true }
          }
        }
      });

      res.json({
        success: true,
        message: 'Equipo actualizado exitosamente',
        data: equipoActualizado
      });
    } catch (error) {
      console.error('Error al actualizar equipo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Eliminar equipo (soft delete)
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const equipo = await prisma.equipo.findUnique({
        where: { id: parseInt(id) },
        include: {
          servicios: {
            where: { estado: { in: ['PENDIENTE', 'PROCESO'] } }
          }
        }
      });

      if (!equipo) {
        return res.status(404).json({
          success: false,
          message: 'Equipo no encontrado'
        });
      }

      // Verificar si tiene servicios activos
      if (equipo.servicios.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el equipo porque tiene servicios pendientes o en proceso'
        });
      }

      // Soft delete: marcar como inactivo
      await prisma.equipo.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });

      res.json({
        success: true,
        message: 'Equipo eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar equipo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener historial de servicios de un equipo
  getServicios: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, estado } = req.query;
      const skip = (page - 1) * limit;

      const equipo = await prisma.equipo.findUnique({
        where: { id: parseInt(id) },
        select: { id: true, nombre: true, tipo: true, marca: true, modelo: true }
      });

      if (!equipo) {
        return res.status(404).json({
          success: false,
          message: 'Equipo no encontrado'
        });
      }

      const where = {
        equipoId: parseInt(id),
        ...(estado && { estado })
      };

      const [servicios, total] = await Promise.all([
        prisma.servicio.findMany({
          where,
          include: {
            tecnico: {
              select: { nombre: true, apellido: true, telefono: true, especialidad: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: parseInt(skip),
          take: parseInt(limit)
        }),
        prisma.servicio.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          equipo,
          servicios,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error al obtener servicios del equipo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener equipos por cliente
  getByCliente: async (req, res) => {
    try {
      const { clienteId } = req.params;
      const { activo } = req.query;

      const cliente = await prisma.cliente.findUnique({
        where: { id: parseInt(clienteId) },
        select: { id: true, nombre: true, apellido: true }
      });

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      const where = {
        clienteId: parseInt(clienteId),
        ...(activo !== undefined && { isActive: activo === 'true' })
      };

      const equipos = await prisma.equipo.findMany({
        where,
        include: {
          servicios: {
            where: { estado: { in: ['PENDIENTE', 'PROCESO'] } },
            select: { id: true, numeroOrden: true, estado: true, fechaProgramada: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: {
          cliente,
          equipos,
          total: equipos.length
        }
      });
    } catch (error) {
      console.error('Error al obtener equipos por cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = equipoController;