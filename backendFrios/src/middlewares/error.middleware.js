const { Prisma } = require('@prisma/client');

const errorHandler = (error, req, res, next) => {
  console.error('🚨 Error:', error);

  // Error de validación de Joi
  if (error.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  // Errores de Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          message: 'Ya existe un registro con esos datos únicos',
          field: error.meta?.target?.[0]
        });
      
      case 'P2025':
        return res.status(404).json({
          success: false,
          message: 'Registro no encontrado'
        });
      
      case 'P2003':
        return res.status(400).json({
          success: false,
          message: 'Violación de restricción de clave foránea'
        });
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Error en la base de datos',
          code: error.code
        });
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación en la base de datos'
    });
  }

  // Error de JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado'
    });
  }

  // Error de Multer (archivos)
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'El archivo es demasiado grande'
    });
  }

  // Error personalizado
  if (error.status || error.statusCode) {
    return res.status(error.status || error.statusCode).json({
      success: false,
      message: error.message || 'Error del servidor'
    });
  }

  // Error genérico del servidor
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Error interno del servidor'
  });
};

module.exports = errorHandler;