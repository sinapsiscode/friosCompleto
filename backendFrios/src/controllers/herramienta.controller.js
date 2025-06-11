const prisma = require('../config/database');

const herramientaController = {
  // Obtener todas las herramientas
  getAll: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        categoria, 
        marca,
        estado,
        disponible 
      } = req.query;
      const skip = (page - 1) * limit;

      const where = {
        AND: [
          search ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { descripcion: { contains: search, mode: 'insensitive' } },
              { marca: { contains: search, mode: 'insensitive' } },
              { modelo: { contains: search, mode: 'insensitive' } },
              { categoria: { contains: search, mode: 'insensitive' } },
              { ubicacion: { contains: search, mode: 'insensitive' } }
            ]
          } : {},
          categoria ? { categoria: { contains: categoria, mode: 'insensitive' } } : {},
          marca ? { marca: { contains: marca, mode: 'insensitive' } } : {},
          estado ? { estado: { contains: estado, mode: 'insensitive' } } : {},
          disponible !== undefined ? { disponible: disponible === 'true' } : {}
        ]
      };

      const [herramientas, total] = await Promise.all([
        prisma.herramienta.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: { nombre: 'asc' }
        }),
        prisma.herramienta.count({ where })
      ]);

      res.json({
        success: true,
        data: herramientas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error al obtener herramientas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener herramienta por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const herramienta = await prisma.herramienta.findUnique({
        where: { id: parseInt(id) }
      });

      if (!herramienta) {
        return res.status(404).json({
          success: false,
          message: 'Herramienta no encontrada'
        });
      }

      res.json({
        success: true,
        data: herramienta
      });
    } catch (error) {
      console.error('Error al obtener herramienta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear nueva herramienta
  create: async (req, res) => {
    try {
      const { 
        nombre, 
        descripcion, 
        marca, 
        modelo, 
        categoria, 
        estado = 'BUENO', 
        ubicacion,
        codigoInterno,
        fechaAdquisicion,
        valorAdquisicion,
        mantenimiento
      } = req.body;

      // Verificar si ya existe una herramienta con el mismo código interno
      if (codigoInterno) {
        const herramientaExistente = await prisma.herramienta.findFirst({
          where: { codigoInterno }
        });

        if (herramientaExistente) {
          return res.status(409).json({
            success: false,
            message: 'Ya existe una herramienta con el mismo código interno'
          });
        }
      }

      const herramienta = await prisma.herramienta.create({
        data: {
          nombre,
          descripcion: descripcion || null,
          marca: marca || null,
          modelo: modelo || null,
          categoria: categoria || null,
          estado,
          ubicacion: ubicacion || null,
          codigoInterno: codigoInterno || null,
          fechaAdquisicion: fechaAdquisicion ? new Date(fechaAdquisicion) : null,
          valorAdquisicion: valorAdquisicion || null,
          mantenimiento: mantenimiento || null,
          disponible: true,
          isActive: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Herramienta creada exitosamente',
        data: herramienta
      });
    } catch (error) {
      console.error('Error al crear herramienta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar herramienta
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        nombre, 
        descripcion, 
        marca, 
        modelo, 
        categoria, 
        estado, 
        ubicacion,
        codigoInterno,
        fechaAdquisicion,
        valorAdquisicion,
        mantenimiento,
        disponible,
        isActive 
      } = req.body;

      const herramienta = await prisma.herramienta.findUnique({
        where: { id: parseInt(id) }
      });

      if (!herramienta) {
        return res.status(404).json({
          success: false,
          message: 'Herramienta no encontrada'
        });
      }

      // Verificar si el nuevo código interno ya existe en otra herramienta
      if (codigoInterno && codigoInterno !== herramienta.codigoInterno) {
        const herramientaExistente = await prisma.herramienta.findFirst({
          where: { 
            codigoInterno,
            id: { not: parseInt(id) }
          }
        });

        if (herramientaExistente) {
          return res.status(409).json({
            success: false,
            message: 'Ya existe otra herramienta con el mismo código interno'
          });
        }
      }

      const herramientaActualizada = await prisma.herramienta.update({
        where: { id: parseInt(id) },
        data: {
          nombre: nombre || herramienta.nombre,
          descripcion: descripcion !== undefined ? descripcion : herramienta.descripcion,
          marca: marca !== undefined ? marca : herramienta.marca,
          modelo: modelo !== undefined ? modelo : herramienta.modelo,
          categoria: categoria !== undefined ? categoria : herramienta.categoria,
          estado: estado || herramienta.estado,
          ubicacion: ubicacion !== undefined ? ubicacion : herramienta.ubicacion,
          codigoInterno: codigoInterno !== undefined ? codigoInterno : herramienta.codigoInterno,
          fechaAdquisicion: fechaAdquisicion ? new Date(fechaAdquisicion) : herramienta.fechaAdquisicion,
          valorAdquisicion: valorAdquisicion !== undefined ? valorAdquisicion : herramienta.valorAdquisicion,
          mantenimiento: mantenimiento !== undefined ? mantenimiento : herramienta.mantenimiento,
          disponible: disponible !== undefined ? disponible : herramienta.disponible,
          isActive: isActive !== undefined ? isActive : herramienta.isActive
        }
      });

      res.json({
        success: true,
        message: 'Herramienta actualizada exitosamente',
        data: herramientaActualizada
      });
    } catch (error) {
      console.error('Error al actualizar herramienta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Eliminar herramienta (soft delete)
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const herramienta = await prisma.herramienta.findUnique({
        where: { id: parseInt(id) }
      });

      if (!herramienta) {
        return res.status(404).json({
          success: false,
          message: 'Herramienta no encontrada'
        });
      }

      await prisma.herramienta.update({
        where: { id: parseInt(id) },
        data: { 
          isActive: false,
          disponible: false
        }
      });

      res.json({
        success: true,
        message: 'Herramienta eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar herramienta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Asignar herramienta a técnico
  asignar: async (req, res) => {
    try {
      const { id } = req.params;
      const { tecnicoId, fechaAsignacion, observaciones } = req.body;

      const herramienta = await prisma.herramienta.findUnique({
        where: { id: parseInt(id) }
      });

      if (!herramienta) {
        return res.status(404).json({
          success: false,
          message: 'Herramienta no encontrada'
        });
      }

      if (!herramienta.disponible) {
        return res.status(400).json({
          success: false,
          message: 'La herramienta no está disponible para asignar'
        });
      }

      // Verificar que el técnico existe
      const tecnico = await prisma.tecnico.findUnique({
        where: { id: parseInt(tecnicoId) }
      });

      if (!tecnico || !tecnico.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Técnico no encontrado o inactivo'
        });
      }

      const herramientaAsignada = await prisma.herramienta.update({
        where: { id: parseInt(id) },
        data: { 
          disponible: false,
          asignadoA: parseInt(tecnicoId),
          fechaAsignacion: fechaAsignacion ? new Date(fechaAsignacion) : new Date(),
          observacionesAsignacion: observaciones || null
        },
        include: {
          tecnicoAsignado: {
            select: { id: true, nombre: true, apellido: true }
          }
        }
      });

      res.json({
        success: true,
        message: 'Herramienta asignada exitosamente',
        data: herramientaAsignada
      });
    } catch (error) {
      console.error('Error al asignar herramienta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Devolver herramienta
  devolver: async (req, res) => {
    try {
      const { id } = req.params;
      const { estadoDevolucion, observaciones } = req.body;

      const herramienta = await prisma.herramienta.findUnique({
        where: { id: parseInt(id) }
      });

      if (!herramienta) {
        return res.status(404).json({
          success: false,
          message: 'Herramienta no encontrada'
        });
      }

      if (herramienta.disponible) {
        return res.status(400).json({
          success: false,
          message: 'La herramienta no está asignada actualmente'
        });
      }

      const herramientaDevuelta = await prisma.herramienta.update({
        where: { id: parseInt(id) },
        data: { 
          disponible: true,
          asignadoA: null,
          fechaDevolucion: new Date(),
          fechaAsignacion: null,
          estado: estadoDevolucion || herramienta.estado,
          observacionesDevolucion: observaciones || null,
          observacionesAsignacion: null
        }
      });

      res.json({
        success: true,
        message: 'Herramienta devuelta exitosamente',
        data: herramientaDevuelta
      });
    } catch (error) {
      console.error('Error al devolver herramienta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener herramientas disponibles
  getDisponibles: async (req, res) => {
    try {
      const { categoria, estado } = req.query;

      const where = {
        isActive: true,
        disponible: true,
        ...(categoria && { categoria: { contains: categoria, mode: 'insensitive' } }),
        ...(estado && { estado: { contains: estado, mode: 'insensitive' } })
      };

      const herramientas = await prisma.herramienta.findMany({
        where,
        orderBy: [
          { categoria: 'asc' },
          { nombre: 'asc' }
        ]
      });

      res.json({
        success: true,
        data: herramientas,
        total: herramientas.length
      });
    } catch (error) {
      console.error('Error al obtener herramientas disponibles:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener categorías disponibles
  getCategorias: async (req, res) => {
    try {
      const categorias = await prisma.herramienta.findMany({
        where: { 
          isActive: true,
          categoria: { not: null }
        },
        select: { categoria: true },
        distinct: ['categoria']
      });

      const listaCategorias = categorias
        .map(item => item.categoria)
        .filter(Boolean)
        .sort();

      res.json({
        success: true,
        data: listaCategorias
      });
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener herramientas asignadas por técnico
  getByTecnico: async (req, res) => {
    try {
      const { tecnicoId } = req.params;

      const tecnico = await prisma.tecnico.findUnique({
        where: { id: parseInt(tecnicoId) },
        select: { id: true, nombre: true, apellido: true }
      });

      if (!tecnico) {
        return res.status(404).json({
          success: false,
          message: 'Técnico no encontrado'
        });
      }

      const herramientas = await prisma.herramienta.findMany({
        where: {
          asignadoA: parseInt(tecnicoId),
          disponible: false
        },
        orderBy: { fechaAsignacion: 'desc' }
      });

      res.json({
        success: true,
        data: {
          tecnico,
          herramientas,
          total: herramientas.length
        }
      });
    } catch (error) {
      console.error('Error al obtener herramientas por técnico:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = herramientaController;