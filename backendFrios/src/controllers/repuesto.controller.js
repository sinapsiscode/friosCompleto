const prisma = require('../config/database');

const repuestoController = {
  // Obtener todos los repuestos
  getAll: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        categoria, 
        marca,
        stockBajo = false 
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
              { categoria: { contains: search, mode: 'insensitive' } }
            ]
          } : {},
          categoria ? { categoria: { contains: categoria, mode: 'insensitive' } } : {},
          marca ? { marca: { contains: marca, mode: 'insensitive' } } : {},
          stockBajo === 'true' ? {
            AND: [
              { stock: { not: null } },
              { stockMinimo: { not: null } },
              { stock: { lte: prisma.repuesto.fields.stockMinimo } }
            ]
          } : {}
        ]
      };

      const [repuestos, total] = await Promise.all([
        prisma.repuesto.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: { nombre: 'asc' }
        }),
        prisma.repuesto.count({ where })
      ]);

      // Identificar repuestos con stock bajo
      const repuestosConEstado = repuestos.map(repuesto => ({
        ...repuesto,
        stockBajo: repuesto.stock <= repuesto.stockMinimo,
        estadoStock: repuesto.stock === 0 ? 'sin_stock' : 
                    repuesto.stock <= repuesto.stockMinimo ? 'stock_bajo' : 'stock_normal'
      }));

      res.json({
        success: true,
        data: repuestosConEstado,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error al obtener repuestos:', error);
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

      const repuesto = await prisma.repuesto.findUnique({
        where: { id: parseInt(id) }
      });

      if (!repuesto) {
        return res.status(404).json({
          success: false,
          message: 'Repuesto no encontrado'
        });
      }

      // Agregar información del estado del stock
      const repuestoConEstado = {
        ...repuesto,
        stockBajo: repuesto.stock <= repuesto.stockMinimo,
        estadoStock: repuesto.stock === 0 ? 'sin_stock' : 
                    repuesto.stock <= repuesto.stockMinimo ? 'stock_bajo' : 'stock_normal'
      };

      res.json({
        success: true,
        data: repuestoConEstado
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
      const { 
        nombre, 
        descripcion, 
        marca, 
        modelo, 
        categoria, 
        precio, 
        stock = 0, 
        stockMinimo = 5, 
        ubicacion,
        codigoInterno,
        proveedor
      } = req.body;

      // Verificar si ya existe un repuesto con el mismo nombre y marca
      const repuestoExistente = await prisma.repuesto.findFirst({
        where: { 
          nombre: { equals: nombre, mode: 'insensitive' },
          marca: { equals: marca || null, mode: 'insensitive' }
        }
      });

      if (repuestoExistente) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un repuesto con el mismo nombre y marca'
        });
      }

      const repuesto = await prisma.repuesto.create({
        data: {
          nombre,
          descripcion: descripcion || null,
          marca: marca || null,
          modelo: modelo || null,
          categoria: categoria || null,
          precio: precio || null,
          stock: parseInt(stock),
          stockMinimo: parseInt(stockMinimo),
          ubicacion: ubicacion || null,
          codigoInterno: codigoInterno || null,
          proveedor: proveedor || null,
          isActive: true
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
      const { 
        nombre, 
        descripcion, 
        marca, 
        modelo, 
        categoria, 
        precio, 
        stock, 
        stockMinimo, 
        ubicacion,
        codigoInterno,
        proveedor,
        isActive 
      } = req.body;

      const repuesto = await prisma.repuesto.findUnique({
        where: { id: parseInt(id) }
      });

      if (!repuesto) {
        return res.status(404).json({
          success: false,
          message: 'Repuesto no encontrado'
        });
      }

      // Verificar si el nuevo nombre y marca ya existen en otro repuesto
      if (nombre && marca) {
        const repuestoExistente = await prisma.repuesto.findFirst({
          where: { 
            nombre: { equals: nombre, mode: 'insensitive' },
            marca: { equals: marca, mode: 'insensitive' },
            id: { not: parseInt(id) }
          }
        });

        if (repuestoExistente) {
          return res.status(409).json({
            success: false,
            message: 'Ya existe otro repuesto con el mismo nombre y marca'
          });
        }
      }

      const repuestoActualizado = await prisma.repuesto.update({
        where: { id: parseInt(id) },
        data: {
          nombre: nombre || repuesto.nombre,
          descripcion: descripcion !== undefined ? descripcion : repuesto.descripcion,
          marca: marca !== undefined ? marca : repuesto.marca,
          modelo: modelo !== undefined ? modelo : repuesto.modelo,
          categoria: categoria !== undefined ? categoria : repuesto.categoria,
          precio: precio !== undefined ? precio : repuesto.precio,
          stock: stock !== undefined ? parseInt(stock) : repuesto.stock,
          stockMinimo: stockMinimo !== undefined ? parseInt(stockMinimo) : repuesto.stockMinimo,
          ubicacion: ubicacion !== undefined ? ubicacion : repuesto.ubicacion,
          codigoInterno: codigoInterno !== undefined ? codigoInterno : repuesto.codigoInterno,
          proveedor: proveedor !== undefined ? proveedor : repuesto.proveedor,
          isActive: isActive !== undefined ? isActive : repuesto.isActive
        }
      });

      res.json({
        success: true,
        message: 'Repuesto actualizado exitosamente',
        data: repuestoActualizado
      });
    } catch (error) {
      console.error('Error al actualizar repuesto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Eliminar repuesto (soft delete)
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const repuesto = await prisma.repuesto.findUnique({
        where: { id: parseInt(id) }
      });

      if (!repuesto) {
        return res.status(404).json({
          success: false,
          message: 'Repuesto no encontrado'
        });
      }

      await prisma.repuesto.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
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
  },

  // Actualizar stock
  updateStock: async (req, res) => {
    try {
      const { id } = req.params;
      const { cantidad, operacion = 'set', observaciones } = req.body;

      const repuesto = await prisma.repuesto.findUnique({
        where: { id: parseInt(id) }
      });

      if (!repuesto) {
        return res.status(404).json({
          success: false,
          message: 'Repuesto no encontrado'
        });
      }

      let nuevoStock;
      switch (operacion) {
        case 'add':
          nuevoStock = repuesto.stock + parseInt(cantidad);
          break;
        case 'subtract':
          nuevoStock = Math.max(0, repuesto.stock - parseInt(cantidad));
          break;
        case 'set':
        default:
          nuevoStock = parseInt(cantidad);
          break;
      }

      const repuestoActualizado = await prisma.repuesto.update({
        where: { id: parseInt(id) },
        data: { 
          stock: nuevoStock,
          updatedAt: new Date()
        }
      });

      // TODO: Aquí se podría agregar un log de movimientos de inventario
      // await prisma.movimientoInventario.create({...})

      res.json({
        success: true,
        message: 'Stock actualizado exitosamente',
        data: {
          ...repuestoActualizado,
          stockAnterior: repuesto.stock,
          stockNuevo: nuevoStock,
          diferencia: nuevoStock - repuesto.stock
        }
      });
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener repuestos con stock bajo
  getStockBajo: async (req, res) => {
    try {
      const repuestosStockBajo = await prisma.repuesto.findMany({
        where: {
          isActive: true,
          stock: {
            lte: prisma.repuesto.fields.stockMinimo
          }
        },
        orderBy: [
          { stock: 'asc' },
          { nombre: 'asc' }
        ]
      });

      const repuestosConEstado = repuestosStockBajo.map(repuesto => ({
        ...repuesto,
        estadoStock: repuesto.stock === 0 ? 'sin_stock' : 'stock_bajo',
        diferencia: repuesto.stockMinimo - repuesto.stock
      }));

      res.json({
        success: true,
        data: repuestosConEstado,
        total: repuestosConEstado.length
      });
    } catch (error) {
      console.error('Error al obtener repuestos con stock bajo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener categorías disponibles
  getCategorias: async (req, res) => {
    try {
      const categorias = await prisma.repuesto.findMany({
        where: { 
          isActive: true,
          categoria: { not: null }
        },
        select: { categoria: true },
        distinct: ['categoria']
      });

      const listaCategories = categorias
        .map(item => item.categoria)
        .filter(Boolean)
        .sort();

      res.json({
        success: true,
        data: listaCategories
      });
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener marcas disponibles
  getMarcas: async (req, res) => {
    try {
      const marcas = await prisma.repuesto.findMany({
        where: { 
          isActive: true,
          marca: { not: null }
        },
        select: { marca: true },
        distinct: ['marca']
      });

      const listaMarcas = marcas
        .map(item => item.marca)
        .filter(Boolean)
        .sort();

      res.json({
        success: true,
        data: listaMarcas
      });
    } catch (error) {
      console.error('Error al obtener marcas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = repuestoController;