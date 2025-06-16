const prisma = require('../config/database');
const authConfig = require('../config/auth');
const { deleteOldFile } = require('../config/upload');
const { autoFixImagePaths } = require('../utils/imagePathFixer');

const tecnicoController = {
  // Obtener todos los técnicos
  getAll: async (req, res) => {
    console.log('📋 === GET ALL TÉCNICOS ===');
    console.log('🔍 Query params:', req.query);
    try {
      const { page = 1, limit = 10, search = '', activo, disponible } = req.query;
      const skip = (page - 1) * limit;

      const where = {
        AND: [
          search ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { apellido: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { especialidad: { contains: search, mode: 'insensitive' } },
              { usuario: { username: { contains: search, mode: 'insensitive' } } }
            ]
          } : {},
          activo !== undefined ? { isActive: activo === 'true' } : {},
          disponible !== undefined ? { disponibilidad: disponible === 'true' ? 'DISPONIBLE' : 'NO_DISPONIBLE' } : {}
        ]
      };

      console.log('🔎 Where clause:', JSON.stringify(where, null, 2));
      
      const [tecnicos, total] = await Promise.all([
        prisma.tecnico.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          include: {
            usuario: {
              select: { id: true, username: true, email: true, isActive: true }
            }
            // Temporalmente quitamos servicios para evitar el error
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.tecnico.count({ where })
      ]);
      
      console.log(`✅ Técnicos encontrados: ${tecnicos.length} de ${total} total`);

      // Reparar rutas de imagen automáticamente
      const tecnicosWithFixedPaths = autoFixImagePaths(tecnicos, 'tecnicos');

      res.json({
        success: true,
        data: tecnicosWithFixedPaths,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('💥 Error al obtener técnicos:', error);
      console.error('📍 Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Obtener técnico por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const tecnico = await prisma.tecnico.findUnique({
        where: { id: parseInt(id) },
        include: {
          usuario: {
            select: { id: true, username: true, email: true, isActive: true }
          },
          servicios: {
            include: {
              equipo: {
                include: {
                  cliente: {
                    select: { nombre: true, apellido: true, telefono: true }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      if (!tecnico) {
        return res.status(404).json({
          success: false,
          message: 'Técnico no encontrado'
        });
      }

      // Reparar ruta de imagen automáticamente
      const tecnicoWithFixedPath = autoFixImagePaths(tecnico, 'tecnicos');

      res.json({
        success: true,
        data: tecnicoWithFixedPath
      });
    } catch (error) {
      console.error('Error al obtener técnico:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear nuevo técnico
  create: async (req, res) => {
    console.log('🔧 === INICIO CREACIÓN TÉCNICO ===');
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
        distrito, 
        dni,
        especialidad, 
        experiencia,
        certificaciones,
        disponibilidad = 'DISPONIBLE'
      } = req.body;

      console.log('🔍 Verificando si usuario/email ya existen...');
      // Verificar si el usuario ya existe
      const existingUser = await prisma.usuario.findFirst({
        where: {
          OR: [{ username }, { email }]
        }
      });
      console.log('📋 Usuario existente encontrado:', existingUser ? 'SÍ' : 'NO');

      if (existingUser) {
        console.log('❌ Usuario/email ya existe, abortando creación');
        return res.status(409).json({
          success: false,
          message: 'El usuario o email ya existe'
        });
      }

      // Verificar si el DNI ya existe (si se proporciona)
      if (dni) {
        console.log('🆔 Verificando DNI:', dni);
        const existingDni = await prisma.tecnico.findFirst({
          where: { dni }
        });
        console.log('📋 DNI existente encontrado:', existingDni ? 'SÍ' : 'NO');

        if (existingDni) {
          console.log('❌ DNI ya existe, abortando creación');
          return res.status(409).json({
            success: false,
            message: 'El DNI ya está registrado'
          });
        }
      }

      console.log('🔒 Hasheando contraseña...');
      // Crear usuario y técnico en una transacción
      const result = await prisma.$transaction(async (tx) => {
        // Crear usuario
        const hashedPassword = await authConfig.hashPassword(password);
        console.log('👤 Creando usuario en BD...');
        const usuario = await tx.usuario.create({
          data: {
            username,
            email,
            password: hashedPassword,
            role: 'TECNICO',
            isActive: true
          }
        });
        console.log('✅ Usuario creado con ID:', usuario.id);

        console.log('🔧 Creando técnico en BD...');
        // Crear técnico
        const tecnico = await tx.tecnico.create({
          data: {
            userId: usuario.id,
            nombre,
            apellido,
            email,
            telefono: telefono || null,
            direccion: direccion || null,
            distrito: distrito || null,
            dni: dni || null,
            especialidad: especialidad || null,
            experiencia: parseInt(experiencia) || 0,
            certificaciones: certificaciones || null,
            disponibilidad,
            profileImage: req.file ? `tecnicos/avatars/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${req.file.filename}` : null,
            isActive: true
          }
        });
        console.log('✅ Técnico creado con ID:', tecnico.id);

        return { usuario, tecnico };
      });
      
      console.log('🎉 Transacción completada exitosamente');

      console.log('📤 Enviando respuesta exitosa al frontend...');
      res.status(201).json({
        success: true,
        message: 'Técnico creado exitosamente',
        data: {
          id: result.tecnico.id,
          nombre: result.tecnico.nombre,
          apellido: result.tecnico.apellido,
          email: result.tecnico.email,
          telefono: result.tecnico.telefono,
          especialidad: result.tecnico.especialidad,
          disponibilidad: result.tecnico.disponibilidad,
          usuario: {
            id: result.usuario.id,
            username: result.usuario.username,
            email: result.usuario.email
          }
        }
      });
    } catch (error) {
      console.error('💥 ERROR AL CREAR TÉCNICO:', error);
      console.error('📍 Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    console.log('🏁 === FIN CREACIÓN TÉCNICO ===');
  },

  // Actualizar técnico
  update: async (req, res) => {
    console.log('🔧 === INICIO ACTUALIZACIÓN TÉCNICO ===');
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
        especialidad, 
        certificaciones,
        disponibilidad,
        distrito,
        dni,
        experiencia,
        isActive 
      } = req.body;

      const tecnico = await prisma.tecnico.findUnique({
        where: { id: parseInt(id) },
        include: { usuario: true }
      });

      if (!tecnico) {
        return res.status(404).json({
          success: false,
          message: 'Técnico no encontrado'
        });
      }

      console.log('🔍 Técnico actual encontrado:', tecnico.nombre, tecnico.apellido);
      console.log('🔍 Datos actuales en BD:', {
        experiencia: tecnico.experiencia,
        dni: tecnico.dni,
        distrito: tecnico.distrito
      });
      console.log('🔍 Datos recibidos del frontend:', {
        experiencia: experiencia,
        dni: dni,
        distrito: distrito
      });

      // Actualizar técnico y usuario en transacción
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
        addIfChanged('nombre', nombre, tecnico.nombre, v => v?.trim());
        addIfChanged('apellido', apellido, tecnico.apellido, v => v?.trim());
        addIfChanged('email', email, tecnico.email, v => v?.trim());
        addIfChanged('telefono', telefono, tecnico.telefono, v => v?.trim());
        addIfChanged('direccion', direccion, tecnico.direccion, v => v?.trim());
        addIfChanged('especialidad', especialidad, tecnico.especialidad, v => v?.trim());
        addIfChanged('disponibilidad', disponibilidad, tecnico.disponibilidad, v => v?.trim());
        addIfChanged('distrito', distrito, tecnico.distrito, v => v?.trim());
        addIfChanged('dni', dni, tecnico.dni, v => v?.trim());
        addIfChanged('experiencia', experiencia, tecnico.experiencia, v => parseInt(v) || 0);
        addIfChanged('isActive', isActive, tecnico.isActive);
        
        // Certificaciones puede ser null/vacío
        if (certificaciones !== undefined && certificaciones !== tecnico.certificaciones) {
          updateData.certificaciones = certificaciones;
          console.log(`🔄 Campo modificado: certificaciones = "${tecnico.certificaciones}" -> "${certificaciones}"`);
        }
        
        // Solo actualizar profileImage si se subió un nuevo archivo
        if (req.file) {
          // Eliminar foto antigua si existe
          if (tecnico.profileImage) {
            console.log('🗑️ Eliminando foto antigua:', tecnico.profileImage);
            await deleteOldFile(tecnico.profileImage, 'tecnicos');
          }
          
          updateData.profileImage = `tecnicos/avatars/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${req.file.filename}`;
          console.log('📷 Actualizando profileImage a:', updateData.profileImage);
        }
        
        console.log('📝 Campos finales a actualizar:', updateData);
        console.log('📊 Total de campos a actualizar:', Object.keys(updateData).length);
        
        // Si no hay cambios, no hacer UPDATE
        if (Object.keys(updateData).length === 0) {
          console.log('⚠️ No hay cambios detectados, omitiendo UPDATE');
          // Obtener el técnico actual sin modificar
          const tecnicoSinCambios = await tx.tecnico.findUnique({
            where: { id: parseInt(id) },
            include: {
              usuario: {
                select: { id: true, username: true, email: true, isActive: true }
              }
            }
          });
          return tecnicoSinCambios;
        }
        
        // Actualizar técnico solo con los campos que tienen datos
        const tecnicoActualizado = await tx.tecnico.update({
          where: { id: parseInt(id) },
          data: updateData
        });

        // Actualizar email en usuario si cambió y no está vacío
        if (email && email.trim() && email !== tecnico.usuario.email) {
          console.log('📧 Actualizando email en usuario');
          await tx.usuario.update({
            where: { id: tecnico.userId },
            data: { email: email.trim() }
          });
        }

        // Actualizar estado del usuario si cambió
        if (isActive !== undefined && isActive !== tecnico.usuario.isActive) {
          console.log('🔄 Actualizando estado de usuario a:', isActive);
          await tx.usuario.update({
            where: { id: tecnico.userId },
            data: { isActive }
          });
        }

        // Obtener el técnico completo actualizado con todas las relaciones
        const tecnicoCompleto = await tx.tecnico.findUnique({
          where: { id: parseInt(id) },
          include: {
            usuario: {
              select: { id: true, username: true, email: true, isActive: true }
            }
          }
        });

        return tecnicoCompleto;
      });

      console.log('✅ Técnico actualizado exitosamente');
      res.json({
        success: true,
        message: 'Técnico actualizado exitosamente',
        data: result
      });
    } catch (error) {
      console.error('Error al actualizar técnico:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Eliminar técnico (soft delete)
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const tecnico = await prisma.tecnico.findUnique({
        where: { id: parseInt(id) },
        include: {
          servicios: {
            where: { estado: { in: ['PENDIENTE', 'PROCESO'] } }
          }
        }
      });

      if (!tecnico) {
        return res.status(404).json({
          success: false,
          message: 'Técnico no encontrado'
        });
      }

      // Verificar si tiene servicios activos
      if (tecnico.servicios.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el técnico porque tiene servicios pendientes o en proceso'
        });
      }

      // Soft delete: marcar como inactivo
      await prisma.$transaction(async (tx) => {
        await tx.tecnico.update({
          where: { id: parseInt(id) },
          data: { 
            isActive: false,
            disponibilidad: 'NO_DISPONIBLE'
          }
        });

        await tx.usuario.update({
          where: { id: tecnico.userId },
          data: { isActive: false }
        });
      });

      res.json({
        success: true,
        message: 'Técnico eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar técnico:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener servicios asignados a un técnico
  getServicios: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, estado } = req.query;
      const skip = (page - 1) * limit;

      const where = {
        tecnicoId: parseInt(id),
        ...(estado && { estado })
      };

      const [servicios, total] = await Promise.all([
        prisma.servicio.findMany({
          where,
          include: {
            equipo: {
              include: {
                cliente: {
                  select: { nombre: true, apellido: true, telefono: true, email: true }
                }
              }
            }
          },
          orderBy: { fechaProgramada: 'asc' },
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
      console.error('Error al obtener servicios del técnico:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener disponibilidad del técnico
  getDisponibilidad: async (req, res) => {
    try {
      const { id } = req.params;
      const { fechaInicio, fechaFin } = req.query;

      const tecnico = await prisma.tecnico.findUnique({
        where: { id: parseInt(id) },
        select: { id: true, nombre: true, apellido: true, disponibilidad: true }
      });

      if (!tecnico) {
        return res.status(404).json({
          success: false,
          message: 'Técnico no encontrado'
        });
      }

      // Obtener servicios programados en el rango de fechas
      const serviciosProgramados = await prisma.servicio.findMany({
        where: {
          tecnicoId: parseInt(id),
          estado: { in: ['PENDIENTE', 'PROCESO'] },
          fechaProgramada: {
            gte: fechaInicio ? new Date(fechaInicio) : new Date(),
            lte: fechaFin ? new Date(fechaFin) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
          }
        },
        select: {
          id: true,
          numeroOrden: true,
          fechaProgramada: true,
          estado: true,
          tipoServicio: true,
          equipo: {
            select: {
              cliente: {
                select: { nombre: true, apellido: true }
              }
            }
          }
        },
        orderBy: { fechaProgramada: 'asc' }
      });

      res.json({
        success: true,
        data: {
          tecnico,
          serviciosProgramados,
          disponibilidadGeneral: tecnico.disponibilidad,
          totalServicios: serviciosProgramados.length
        }
      });
    } catch (error) {
      console.error('Error al obtener disponibilidad del técnico:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = tecnicoController;