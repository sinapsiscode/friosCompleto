const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const adminController = {
  // Obtener perfil del administrador actual
  getProfile: async (req, res) => {
    try {
      console.log('📋 GET /admin/profile - Obteniendo perfil del administrador');
      const userId = req.user.id;
      console.log('👤 Usuario ID:', userId);

      const admin = await prisma.administrador.findUnique({
        where: { userId },
        include: {
          usuario: {
            select: {
              username: true,
              email: true,
              role: true
            }
          }
        }
      });

      if (!admin) {
        console.log('❌ Administrador no encontrado para userId:', userId);
        return res.status(404).json({
          success: false,
          message: 'Perfil de administrador no encontrado'
        });
      }

      console.log('✅ Administrador encontrado:', admin.nombre, admin.apellido);
      res.json({
        success: true,
        data: {
          id: admin.id,
          userId: admin.userId,
          nombre: admin.nombre,
          apellido: admin.apellido,
          email: admin.email,
          telefono: admin.telefono,
          direccion: admin.direccion,
          profileImage: admin.profileImage,
          usuario: admin.usuario.username,
          role: admin.usuario.role,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt
        }
      });
    } catch (error) {
      console.error('Error al obtener perfil del administrador:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar perfil del administrador
  updateProfile: async (req, res) => {
    try {
      console.log('📝 PUT /admin/profile - Actualizando perfil del administrador');
      const userId = req.user.id;
      const {
        nombre,
        apellido,
        email,
        telefono,
        direccion,
        newPassword
      } = req.body;
      
      console.log('👤 Usuario ID:', userId);
      console.log('📊 Datos recibidos:', { nombre, apellido, email, telefono, direccion, hasNewPassword: !!newPassword });

      // Verificar que el administrador existe
      const adminExistente = await prisma.administrador.findUnique({
        where: { userId }
      });

      if (!adminExistente) {
        console.log('❌ Administrador no encontrado para actualización');
        return res.status(404).json({
          success: false,
          message: 'Administrador no encontrado'
        });
      }

      console.log('✅ Administrador existente encontrado:', adminExistente.nombre, adminExistente.apellido);

      // Actualizar usuario si se proporciona nueva contraseña
      let updateUsuarioData = {};
      if (newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updateUsuarioData.password = hashedPassword;
      }

      // Actualizar email en usuario si cambió
      if (email && email !== adminExistente.email) {
        updateUsuarioData.email = email;
      }

      // Si hay cambios en el usuario, actualizarlo
      if (Object.keys(updateUsuarioData).length > 0) {
        console.log('🔐 Actualizando datos del usuario:', updateUsuarioData);
        await prisma.usuario.update({
          where: { id: userId },
          data: updateUsuarioData
        });
        console.log('✅ Usuario actualizado');
      }

      // Actualizar datos del administrador
      const updateAdminData = {
        nombre: nombre || adminExistente.nombre,
        apellido: apellido || adminExistente.apellido,
        email: email || adminExistente.email,
        telefono: telefono || adminExistente.telefono,
        direccion: direccion || adminExistente.direccion
      };
      
      console.log('📝 Actualizando datos del administrador:', updateAdminData);
      const adminActualizado = await prisma.administrador.update({
        where: { userId },
        data: updateAdminData,
        include: {
          usuario: {
            select: {
              username: true,
              email: true,
              role: true
            }
          }
        }
      });

      console.log('✅ Perfil de administrador actualizado exitosamente');
      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: {
          id: adminActualizado.id,
          userId: adminActualizado.userId,
          nombre: adminActualizado.nombre,
          apellido: adminActualizado.apellido,
          email: adminActualizado.email,
          telefono: adminActualizado.telefono,
          direccion: adminActualizado.direccion,
          profileImage: adminActualizado.profileImage,
          usuario: adminActualizado.usuario.username,
          role: adminActualizado.usuario.role,
          updatedAt: adminActualizado.updatedAt
        }
      });
    } catch (error) {
      console.error('Error al actualizar perfil del administrador:', error);
      
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = adminController;