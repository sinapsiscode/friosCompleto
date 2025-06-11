const prisma = require('../config/database');

const repuestoFormularioController = {
  // Obtener todos los repuestos del formulario
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const skip = (page - 1) * limit;

      const where = search ? {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } }
        ]
      } : {};

      const [repuestos, total] = await Promise.all([
        prisma.repuestoFormulario.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.repuestoFormulario.count({ where })
      ]);

      res.json({
        success: true,
        data: repuestos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error al obtener repuestos formulario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener repuesto por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const repuesto = await prisma.repuestoFormulario.findUnique({
        where: { id: parseInt(id) }
      });

      if (!repuesto) {
        return res.status(404).json({
          success: false,
          message: 'Repuesto no encontrado'
        });
      }

      res.json({
        success: true,
        data: repuesto
      });
    } catch (error) {
      console.error('Error al obtener repuesto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear nuevo repuesto
  create: async (req, res) => {
    try {
      const { nombre, descripcion, disponible = true } = req.body;

      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El nombre del repuesto es obligatorio'
        });
      }

      const repuesto = await prisma.repuestoFormulario.create({
        data: {
          nombre: nombre.trim(),
          descripcion: descripcion ? descripcion.trim() : null,
          disponible
        }
      });

      res.status(201).json({
        success: true,
        message: 'Repuesto creado exitosamente',
        data: repuesto
      });
    } catch (error) {
      console.error('Error al crear repuesto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar repuesto
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion, disponible } = req.body;

      const repuestoExistente = await prisma.repuestoFormulario.findUnique({
        where: { id: parseInt(id) }
      });

      if (!repuestoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Repuesto no encontrado'
        });
      }

      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El nombre del repuesto es obligatorio'
        });
      }

      const repuesto = await prisma.repuestoFormulario.update({
        where: { id: parseInt(id) },
        data: {
          nombre: nombre.trim(),
          descripcion: descripcion ? descripcion.trim() : null,
          disponible
        }
      });

      res.json({
        success: true,
        message: 'Repuesto actualizado exitosamente',
        data: repuesto
      });
    } catch (error) {
      console.error('Error al actualizar repuesto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Eliminar repuesto
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const repuestoExistente = await prisma.repuestoFormulario.findUnique({
        where: { id: parseInt(id) }
      });

      if (!repuestoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Repuesto no encontrado'
        });
      }

      await prisma.repuestoFormulario.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: 'Repuesto eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar repuesto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = repuestoFormularioController;