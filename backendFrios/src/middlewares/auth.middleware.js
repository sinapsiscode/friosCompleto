const authConfig = require('../config/auth');
const prisma = require('../config/database');

// Middleware para verificar autenticación
const authenticateToken = async (req, res, next) => {
  console.log('🔐 === MIDDLEWARE AUTH ===');
  console.log('📋 Headers:', req.headers);
  console.log('🚀 Method:', req.method);
  console.log('🌐 URL:', req.url);
  
  try {
    const authHeader = req.headers.authorization;
    console.log('🔑 Auth header:', authHeader);
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const decoded = authConfig.verifyAccessToken(token);
    
    // Verificar que el usuario existe y está activo
    const user = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      include: {
        admin: true,
        tecnico: true,
        cliente: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no válido o inactivo'
      });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile: user.admin || user.tecnico || user.cliente
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

// Middleware para verificar roles específicos
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }

    next();
  };
};

// Middleware para verificar que el usuario puede acceder a sus propios datos
const requireOwnershipOrAdmin = (req, res, next) => {
  const { role, profile } = req.user;
  const targetId = parseInt(req.params.id);

  // Los admins pueden acceder a todo
  if (role === 'ADMIN') {
    return next();
  }

  // Los usuarios solo pueden acceder a sus propios datos
  if (profile && profile.id === targetId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Solo puedes acceder a tus propios datos'
  });
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnershipOrAdmin,
  // Shortcuts para roles comunes
  requireAdmin: requireRole(['ADMIN']),
  requireTecnico: requireRole(['ADMIN', 'TECNICO']),
  requireCliente: requireRole(['ADMIN', 'CLIENTE']),
  requireAnyRole: requireRole(['ADMIN', 'TECNICO', 'CLIENTE'])
};