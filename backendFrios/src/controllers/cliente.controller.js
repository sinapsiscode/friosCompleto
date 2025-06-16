const prisma = require('../config/database');
const authConfig = require('../config/auth');
const { deleteOldFile } = require('../config/upload');
const { autoFixImagePaths } = require('../utils/imagePathFixer');

const clienteController = {
  // Obtener información del cliente autenticado
  getMe: async (req, res) => {
    try {
      console.log('👤 === GET ME - INICIO ===');
      console.log('🔍 req.user completo:', req.user);
      console.log('🆔 req.user.userId:', req.user?.userId);
      console.log('🆔 req.user.id:', req.user?.id);
      
      const userId = req.user.userId || req.user.id;
      console.log('🎯 userId a usar:', userId);
      
      if (!userId) {
        console.log('❌ No se encontró userId en req.user');
        return res.status(400).json({
          success: false,
          message: 'Usuario no identificado correctamente'
        });
      }
      
      console.log('🔍 Buscando cliente con userId:', userId);
      
      const cliente = await prisma.cliente.findUnique({
        where: { userId },
        include: {
          usuario: {
            select: { id: true, username: true, email: true, isActive: true }
          },
          equipos: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      console.log('📋 Cliente encontrado:', cliente ? 'SÍ' : 'NO');
      if (cliente) {
        console.log('✅ Cliente datos:', {
          id: cliente.id,
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          equiposCount: cliente.equipos?.length || 0
        });
      }

      if (!cliente) {
        console.log('❌ Cliente no encontrado para userId:', userId);
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      // Reparar ruta de imagen automáticamente
      const clienteWithFixedPath = autoFixImagePaths(cliente, 'clientes');

      console.log('✅ Enviando respuesta exitosa con cliente:', clienteWithFixedPath.id);
      res.json({
        success: true,
        data: clienteWithFixedPath
      });
    } catch (error) {
      console.error('💥 Error al obtener información del cliente:', error);
      console.error('📍 Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Obtener todos los clientes
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', activo } = req.query;
      const skip = (page - 1) * limit;

      const where = {
        AND: [
          search ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { apellido: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { usuario: { username: { contains: search, mode: 'insensitive' } } }
            ]
          } : {},
          activo !== undefined ? { isActive: activo === 'true' } : {}
        ]
      };

      const [clientes, total] = await Promise.all([
        prisma.cliente.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          include: {
            usuario: {
              select: { id: true, username: true, email: true, isActive: true }
            },
            equipos: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.cliente.count({ where })
      ]);

      // Reparar rutas de imagen automáticamente
      const clientesWithFixedPaths = autoFixImagePaths(clientes, 'clientes');

      res.json({
        success: true,
        data: clientesWithFixedPaths,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener cliente por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const cliente = await prisma.cliente.findUnique({
        where: { id: parseInt(id) },
        include: {
          usuario: {
            select: { id: true, username: true, email: true, isActive: true }
          },
          equipos: {
            include: {
              servicios: {
                orderBy: { createdAt: 'desc' },
                take: 5
              }
            }
          }
        }
      });

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      // Reparar ruta de imagen automáticamente
      const clienteWithFixedPath = autoFixImagePaths(cliente, 'clientes');

      res.json({
        success: true,
        data: clienteWithFixedPath
      });
    } catch (error) {
      console.error('Error al obtener cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear nuevo cliente
  create: async (req, res) => {
    console.log('👥 === INICIO CREACIÓN CLIENTE ===');
    console.log('📝 Datos recibidos en req.body:', JSON.stringify(req.body, null, 2));
    console.log('📷 Archivo recibido req.file:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size
    } : 'No hay archivo');
    console.log('👤 Usuario autenticado:', req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    } : 'NO AUTENTICADO');
    
    try {
      const { 
        username, 
        email, 
        password, 
        nombre, 
        apellido, 
        telefono, 
        direccion, 
        ciudad,
        distrito,
        tipo,
        razonSocial,
        ruc,
        dni,
        sector,
        equipos
      } = req.body;

      // Parsear equipos si viene como string JSON
      let equiposArray = [];
      if (equipos) {
        try {
          equiposArray = typeof equipos === 'string' ? JSON.parse(equipos) : equipos;
        } catch (e) {
          console.log('⚠️ Error parseando equipos, usando array vacío');
          equiposArray = [];
        }
      }

      console.log('🔍 Verificando si usuario/email ya existen...');
      // Verificar si el usuario ya existe
      const existingUser = await prisma.usuario.findFirst({
        where: {
          OR: [{ username }, { email }]
        }
      });
      console.log('📋 Usuario existente encontrado:', existingUser ? 'SÍ' : 'NO');

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'El usuario o email ya existe'
        });
      }

      console.log('🔒 Hasheando contraseña...');
      // Crear usuario y cliente en una transacción
      const result = await prisma.$transaction(async (tx) => {
        // Crear usuario
        const hashedPassword = await authConfig.hashPassword(password);
        console.log('👤 Creando usuario en BD...');
        const usuario = await tx.usuario.create({
          data: {
            username,
            email,
            password: hashedPassword,
            role: 'CLIENTE',
            isActive: true
          }
        });
        console.log('✅ Usuario creado con ID:', usuario.id);

        console.log('👥 Creando cliente en BD...');
        // Crear cliente
        const cliente = await tx.cliente.create({
          data: {
            userId: usuario.id,
            nombre,
            apellido,
            email,
            telefono: telefono || null,
            direccion: direccion || null,
            ciudad: ciudad || null,
            distrito: distrito || null,
            tipo: tipo || 'persona',
            razonSocial: razonSocial || null,
            ruc: ruc || null,
            dni: dni || null,
            sector: sector || null,
            profileImage: req.file ? `clientes/avatars/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${req.file.filename}` : null,
            isActive: true
          }
        });
        console.log('✅ Cliente creado con ID:', cliente.id);

        return { usuario, cliente };
      });
      
      console.log('🎉 Transacción completada exitosamente');

      console.log('📤 Enviando respuesta exitosa al frontend...');
      res.status(201).json({
        success: true,
        message: 'Cliente creado exitosamente',
        data: {
          id: result.cliente.id,
          nombre: result.cliente.nombre,
          apellido: result.cliente.apellido,
          email: result.cliente.email,
          telefono: result.cliente.telefono,
          usuario: {
            id: result.usuario.id,
            username: result.usuario.username,
            email: result.usuario.email
          }
        }
      });
    } catch (error) {
      console.error('💥 ERROR AL CREAR CLIENTE:', error);
      console.error('📍 Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    console.log('🏁 === FIN CREACIÓN CLIENTE ===');
  },

  // Actualizar cliente
  update: async (req, res) => {
    console.log('👥 === INICIO ACTUALIZACIÓN CLIENTE ===');
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
        apellido, 
        email, 
        telefono, 
        direccion,
        ciudad,
        distrito, 
        tipo, 
        razonSocial,
        ruc,
        dni,
        sector,
        isActive 
      } = req.body;

      const cliente = await prisma.cliente.findUnique({
        where: { id: parseInt(id) },
        include: { usuario: true }
      });

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      console.log('🔍 Cliente actual encontrado:', cliente.nombre, cliente.apellido);
      console.log('🔍 Datos actuales en BD:', {
        distrito: cliente.distrito,
        ciudad: cliente.ciudad,
        telefono: cliente.telefono
      });
      console.log('🔍 Datos recibidos del frontend:', {
        distrito: distrito,
        ciudad: ciudad,
        telefono: telefono
      });

      // Actualizar cliente y usuario en transacción
      const result = await prisma.$transaction(async (tx) => {
        // Comparar datos actuales con los nuevos para detectar cambios
        const updateData = {};
        console.log('🔄 Iniciando comparación de campos...');
        
        // Función helper para comparar y agregar campos modificados
        const addIfChanged = (field, newValue, currentValue, transform = (v) => v) => {
          console.log(`🔍 Evaluando campo: ${field}`, {
            newValue: newValue,
            currentValue: currentValue,
            isUndefined: newValue === undefined,
            isNull: newValue === null
          });
          
          // Solo procesar si el nuevo valor no es undefined/null
          if (newValue === undefined || newValue === null) {
            console.log(`⚠️ Campo ${field} ignorado: valor undefined/null`);
            return; // No actualizar si no se envió el campo
          }
          
          const normalizedNew = transform(newValue);
          const normalizedCurrent = transform(currentValue);
          
          console.log(`🔍 Comparando ${field}:`, {
            normalizedNew: normalizedNew,
            normalizedCurrent: normalizedCurrent,
            sonIguales: normalizedNew === normalizedCurrent
          });
          
          // Solo actualizar si realmente son diferentes
          if (normalizedNew !== normalizedCurrent) {
            updateData[field] = normalizedNew;
            console.log(`🔄 Campo modificado: ${field} = "${normalizedCurrent}" -> "${normalizedNew}"`);
          } else {
            console.log(`✅ Campo ${field} sin cambios`);
          }
        };

        // Comparar todos los campos
        addIfChanged('nombre', nombre, cliente.nombre, v => v?.trim());
        addIfChanged('apellido', apellido, cliente.apellido, v => v?.trim());
        addIfChanged('email', email, cliente.email, v => v?.trim());
        addIfChanged('telefono', telefono, cliente.telefono, v => v?.trim());
        addIfChanged('direccion', direccion, cliente.direccion, v => v?.trim());
        addIfChanged('ciudad', ciudad, cliente.ciudad, v => v?.trim());
        addIfChanged('distrito', distrito, cliente.distrito, v => v?.trim());
        addIfChanged('tipo', tipo, cliente.tipo, v => v?.trim());
        addIfChanged('razonSocial', razonSocial, cliente.razonSocial, v => v?.trim());
        addIfChanged('ruc', ruc, cliente.ruc, v => v?.trim());
        addIfChanged('dni', dni, cliente.dni, v => v?.trim());
        addIfChanged('sector', sector, cliente.sector, v => v?.trim());
        addIfChanged('isActive', isActive, cliente.isActive);
        
        // Solo actualizar profileImage si se subió un nuevo archivo
        if (req.file) {
          // Eliminar foto antigua si existe
          if (cliente.profileImage) {
            console.log('🗑️ Eliminando foto antigua:', cliente.profileImage);
            await deleteOldFile(cliente.profileImage, 'clientes');
          }
          
          updateData.profileImage = `clientes/avatars/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${req.file.filename}`;
          console.log('📷 Actualizando profileImage a:', updateData.profileImage);
        }
        
        console.log('📝 Campos finales a actualizar:', updateData);
        console.log('📊 Total de campos a actualizar:', Object.keys(updateData).length);
        
        // Si no hay cambios, no hacer UPDATE
        if (Object.keys(updateData).length === 0) {
          console.log('⚠️ No hay cambios detectados, omitiendo UPDATE');
          // Obtener el cliente actual sin modificar
          const clienteSinCambios = await tx.cliente.findUnique({
            where: { id: parseInt(id) },
            include: {
              usuario: {
                select: { id: true, username: true, email: true, isActive: true }
              }
            }
          });
          return clienteSinCambios;
        }
        
        // Actualizar cliente solo con los campos que tienen datos
        const clienteActualizado = await tx.cliente.update({
          where: { id: parseInt(id) },
          data: updateData
        });

        // Actualizar email en usuario si cambió y no está vacío
        if (email && email.trim() && email !== cliente.usuario.email) {
          console.log('📧 Actualizando email en usuario');
          await tx.usuario.update({
            where: { id: cliente.userId },
            data: { email: email.trim() }
          });
        }

        // Actualizar estado del usuario si cambió
        if (isActive !== undefined && isActive !== cliente.usuario.isActive) {
          console.log('🔄 Actualizando estado de usuario a:', isActive);
          await tx.usuario.update({
            where: { id: cliente.userId },
            data: { isActive }
          });
        }

        // Obtener el cliente completo actualizado con todas las relaciones
        const clienteCompleto = await tx.cliente.findUnique({
          where: { id: parseInt(id) },
          include: {
            usuario: {
              select: { id: true, username: true, email: true, isActive: true }
            }
          }
        });

        return clienteCompleto;
      });

      console.log('✅ Cliente actualizado exitosamente');
      res.json({
        success: true,
        message: 'Cliente actualizado exitosamente',
        data: result
      });
    } catch (error) {
      console.error('💥 ERROR AL ACTUALIZAR CLIENTE:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
    console.log('🏁 === FIN ACTUALIZACIÓN CLIENTE ===');
  },

  // Eliminar cliente (soft delete)
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const cliente = await prisma.cliente.findUnique({
        where: { id: parseInt(id) }
      });

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      // Soft delete: marcar como inactivo
      await prisma.$transaction(async (tx) => {
        await tx.cliente.update({
          where: { id: parseInt(id) },
          data: { isActive: false }
        });

        await tx.usuario.update({
          where: { id: cliente.userId },
          data: { isActive: false }
        });
      });

      res.json({
        success: true,
        message: 'Cliente eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener equipos de un cliente
  getEquipos: async (req, res) => {
    try {
      const { id } = req.params;

      const cliente = await prisma.cliente.findUnique({
        where: { id: parseInt(id) },
        include: {
          equipos: {
            include: {
              servicios: {
                orderBy: { createdAt: 'desc' },
                take: 3,
                include: {
                  tecnico: {
                    select: { nombre: true, apellido: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      res.json({
        success: true,
        data: cliente.equipos
      });
    } catch (error) {
      console.error('Error al obtener equipos del cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener historial de servicios de un cliente
  getServicios: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const servicios = await prisma.servicio.findMany({
        where: {
          equipo: {
            clienteId: parseInt(id)
          }
        },
        include: {
          equipo: {
            select: { marca: true, modelo: true, tipo: true }
          },
          tecnico: {
            select: { nombre: true, apellido: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      });

      const total = await prisma.servicio.count({
        where: {
          equipo: {
            clienteId: parseInt(id)
          }
        }
      });

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
      console.error('Error al obtener servicios del cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = clienteController;