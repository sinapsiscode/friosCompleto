const prisma = require('../config/database');
const authConfig = require('../config/auth');

const authController = {
  // Registro de nuevo usuario
  register: async (req, res) => {
    const { username, email, password, role, profileData } = req.body;

    try {
      // Verificar si el usuario ya existe
      const existingUser = await prisma.usuario.findFirst({
        where: {
          OR: [
            { username },
            { email }
          ]
        }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'El usuario o email ya existe'
        });
      }

      // Hashear contraseña
      const hashedPassword = await authConfig.hashPassword(password);

      // Crear usuario con perfil correspondiente
      const result = await prisma.$transaction(async (tx) => {
        // Crear usuario base
        const newUser = await tx.usuario.create({
          data: {
            username,
            email,
            password: hashedPassword,
            role
          }
        });

        let profile = null;

        // Crear perfil según el rol
        switch (role) {
          case 'ADMIN':
            profile = await tx.administrador.create({
              data: {
                userId: newUser.id,
                nombre: profileData?.nombre || '',
                apellido: profileData?.apellido || '',
                email,
                telefono: profileData?.telefono || null,
                direccion: profileData?.direccion || null
              }
            });
            break;

          case 'TECNICO':
            profile = await tx.tecnico.create({
              data: {
                userId: newUser.id,
                nombre: profileData?.nombre || '',
                apellido: profileData?.apellido || '',
                email,
                telefono: profileData?.telefono || null,
                direccion: profileData?.direccion || null,
                especialidad: profileData?.especialidad || null,
                disponibilidad: profileData?.disponibilidad || 'Disponible'
              }
            });
            break;

          case 'CLIENTE':
            profile = await tx.cliente.create({
              data: {
                userId: newUser.id,
                nombre: profileData?.nombre || '',
                apellido: profileData?.apellido || '',
                email,
                telefono: profileData?.telefono || null,
                direccion: profileData?.direccion || null
              }
            });
            break;
        }

        return { user: newUser, profile };
      });

      // Generar tokens
      const tokens = authConfig.generateTokens({
        userId: result.user.id,
        username: result.user.username,
        role: result.user.role
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          role: result.user.role,
          profile: result.profile
        },
        ...tokens
      });

    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Login de usuario
  login: async (req, res) => {
    const { username, password, role } = req.body;

    try {
      // Buscar usuario
      const user = await prisma.usuario.findFirst({
        where: {
          username,
          role,
          isActive: true
        },
        include: {
          admin: true,
          tecnico: true,
          cliente: true
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const isValidPassword = await authConfig.verifyPassword(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Generar tokens
      const tokens = authConfig.generateTokens({
        userId: user.id,
        username: user.username,
        role: user.role
      });

      // Obtener perfil según rol
      const profile = user.admin || user.tecnico || user.cliente;

      res.json({
        success: true,
        message: 'Login exitoso',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile
        },
        ...tokens
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Renovar token
  refreshToken: async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    try {
      const decoded = authConfig.verifyRefreshToken(refreshToken);

      // Verificar que el usuario existe
      const user = await prisma.usuario.findUnique({
        where: { 
          id: decoded.userId,
          isActive: true 
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no válido'
        });
      }

      // Generar nuevos tokens
      const tokens = authConfig.generateTokens({
        userId: user.id,
        username: user.username,
        role: user.role
      });

      res.json({
        success: true,
        message: 'Token renovado exitosamente',
        ...tokens
      });

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido o expirado'
      });
    }
  },

  // Obtener perfil del usuario autenticado
  profile: async (req, res) => {
    try {
      const user = await prisma.usuario.findUnique({
        where: { id: req.user.id },
        include: {
          admin: true,
          tecnico: true,
          cliente: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const profile = user.admin || user.tecnico || user.cliente;

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile,
          createdAt: user.createdAt
        }
      });

    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Logout (invalidar token - para implementación futura con blacklist)
  logout: async (req, res) => {
    // En una implementación completa, aquí se añadiría el token a una blacklist
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  },

  // Cambiar contraseña
  changePassword: async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
      const user = await prisma.usuario.findUnique({
        where: { id: req.user.id }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar contraseña actual
      const isValidPassword = await authConfig.verifyPassword(currentPassword, user.password);

      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }

      // Hashear nueva contraseña
      const hashedPassword = await authConfig.hashPassword(newPassword);

      // Actualizar contraseña
      await prisma.usuario.update({
        where: { id: req.user.id },
        data: { password: hashedPassword }
      });

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = authController;