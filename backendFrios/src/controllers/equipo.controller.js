const prisma = require('../config/database');
const { deleteOldFile } = require('../config/upload');

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
              select: { id: true, estado: true, fechaProgramada: true, tipoServicio: true }
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
    console.log('🔧 === INICIO CREACIÓN EQUIPO ===');
    console.log('📝 Datos recibidos en req.body:', JSON.stringify(req.body, null, 2));
    console.log('📷 Archivo recibido req.file:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size
    } : 'No hay archivo');
    
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
        fechaCompra,
        capacidad,
        estadoOperativo = 'operativo'
      } = req.body;

      console.log('🔍 Verificando cliente...');
      
      // Verificar que el cliente existe
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

      // Verificar si ya existe un equipo con el mismo número de serie
      if (numeroSerie && numeroSerie.trim()) {
        console.log('🔍 Verificando número de serie:', numeroSerie);
        const equipoExistente = await prisma.equipo.findFirst({
          where: { numeroSerie: numeroSerie.trim() }
        });

        if (equipoExistente) {
          console.log('❌ Equipo con número de serie ya existe');
          return res.status(409).json({
            success: false,
            message: 'Ya existe un equipo con este número de serie'
          });
        }
      }

      console.log('💾 Creando equipo en BD...');
      
      const equipoData = {
        clienteId: parseInt(clienteId),
        nombre: nombre || `${tipo} ${marca || ''}`.trim(),
        tipo,
        marca: marca || null,
        modelo: modelo || null,
        numeroSerie: numeroSerie ? numeroSerie.trim() : null,
        ubicacion: ubicacion || null,
        descripcion: descripcion || null,
        fechaInstalacion: fechaInstalacion ? new Date(fechaInstalacion) : null,
        fechaCompra: fechaCompra ? new Date(fechaCompra) : null,
        capacidad: capacidad || null,
        estadoOperativo: estadoOperativo || 'operativo',
        imagenEquipo: req.file ? `equipos/imagenes/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${req.file.filename}` : null,
        isActive: true
      };

      const equipo = await prisma.equipo.create({
        data: equipoData,
        include: {
          cliente: {
            select: { id: true, nombre: true, apellido: true }
          }
        }
      });

      console.log('✅ Equipo creado exitosamente con ID:', equipo.id);

      res.status(201).json({
        success: true,
        message: 'Equipo creado exitosamente',
        data: equipo
      });
    } catch (error) {
      console.error('💥 ERROR AL CREAR EQUIPO:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    console.log('🏁 === FIN CREACIÓN EQUIPO ===');
  },

  // Actualizar equipo
  update: async (req, res) => {
    console.log('🔧 === INICIO ACTUALIZACIÓN EQUIPO ===');
    console.log('📝 Datos recibidos en req.body:', JSON.stringify(req.body, null, 2));
    console.log('📷 Archivo recibido req.file:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size
    } : 'No hay archivo');
    
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
        fechaCompra,
        capacidad,
        estadoOperativo,
        isActive
      } = req.body;

      const equipoExistente = await prisma.equipo.findUnique({
        where: { id: parseInt(id) }
      });

      if (!equipoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Equipo no encontrado'
        });
      }

      // Verificar número de serie único (si cambió)
      if (numeroSerie && numeroSerie.trim() && numeroSerie.trim() !== equipoExistente.numeroSerie) {
        const equipoConMismoSerial = await prisma.equipo.findFirst({
          where: { 
            numeroSerie: numeroSerie.trim(),
            id: { not: parseInt(id) }
          }
        });

        if (equipoConMismoSerial) {
          return res.status(409).json({
            success: false,
            message: 'Ya existe otro equipo con este número de serie'
          });
        }
      }

      const updateData = {
        nombre: nombre || `${tipo} ${marca || ''}`.trim(),
        tipo,
        marca: marca || null,
        modelo: modelo || null,
        numeroSerie: numeroSerie ? numeroSerie.trim() : null,
        ubicacion: ubicacion || null,
        descripcion: descripcion || null,
        fechaInstalacion: fechaInstalacion ? new Date(fechaInstalacion) : null,
        fechaCompra: fechaCompra ? new Date(fechaCompra) : null,
        capacidad: capacidad || null,
        estadoOperativo: estadoOperativo || 'operativo',
        isActive: isActive !== undefined ? isActive : true
      };

      // Solo actualizar imagen si se subió una nueva
      if (req.file) {
        // Eliminar imagen antigua si existe
        if (equipoExistente.imagenEquipo) {
          console.log('🗑️ Eliminando imagen antigua:', equipoExistente.imagenEquipo);
          await deleteOldFile(equipoExistente.imagenEquipo, 'equipos');
        }
        
        updateData.imagenEquipo = `equipos/imagenes/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${req.file.filename}`;
        console.log('📷 Actualizando imagenEquipo a:', updateData.imagenEquipo);
      }

      const equipoActualizado = await prisma.equipo.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          cliente: {
            select: { id: true, nombre: true, apellido: true }
          }
        }
      });

      console.log('✅ Equipo actualizado exitosamente');
      res.json({
        success: true,
        message: 'Equipo actualizado exitosamente',
        data: equipoActualizado
      });
    } catch (error) {
      console.error('💥 ERROR AL ACTUALIZAR EQUIPO:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
    console.log('🏁 === FIN ACTUALIZACIÓN EQUIPO ===');
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

  // Obtener servicios del equipo
  getServicios: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, estado } = req.query;
      const skip = (page - 1) * limit;

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
            },
            cliente: {
              select: { nombre: true, apellido: true, telefono: true, email: true }
            }
          },
          orderBy: { fechaProgramada: 'desc' },
          skip: parseInt(skip),
          take: parseInt(limit)
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
      const { activo = true } = req.query;

      const equipos = await prisma.equipo.findMany({
        where: {
          clienteId: parseInt(clienteId),
          isActive: activo === 'true'
        },
        include: {
          servicios: {
            where: { estado: { in: ['PENDIENTE', 'PROCESO'] } },
            select: { id: true, estado: true, fechaProgramada: true, tipoServicio: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: equipos
      });
    } catch (error) {
      console.error('Error al obtener equipos del cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = equipoController;