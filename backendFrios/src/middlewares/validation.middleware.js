const Joi = require('joi');

// Middleware para validar datos de entrada
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req[property] = value;
    next();
  };
};

// Esquemas de validación comunes
const schemas = {
  // Autenticación
  login: Joi.object({
    username: Joi.string().required().messages({
      'string.empty': 'El nombre de usuario es requerido',
      'any.required': 'El nombre de usuario es requerido'
    }),
    password: Joi.string().min(6).required().messages({
      'string.empty': 'La contraseña es requerida',
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es requerida'
    }),
    role: Joi.string().valid('ADMIN', 'TECNICO', 'CLIENTE').required().messages({
      'any.only': 'El rol debe ser ADMIN, TECNICO o CLIENTE',
      'any.required': 'El rol es requerido'
    })
  }),

  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      'string.alphanum': 'El nombre de usuario solo puede contener letras y números',
      'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
      'string.max': 'El nombre de usuario no puede tener más de 30 caracteres',
      'any.required': 'El nombre de usuario es requerido'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es requerido'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es requerida'
    }),
    role: Joi.string().valid('ADMIN', 'TECNICO', 'CLIENTE').required()
  }),

  // Cliente
  cliente: Joi.object({
    nombre: Joi.string().required().messages({
      'any.required': 'El nombre es requerido'
    }),
    apellido: Joi.string().required().messages({
      'any.required': 'El apellido es requerido'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es requerido'
    }),
    telefono: Joi.string().optional(),
    direccion: Joi.string().optional()
  }),

  // Técnico
  tecnico: Joi.object({
    nombre: Joi.string().required(),
    apellido: Joi.string().required(),
    email: Joi.string().email().required(),
    telefono: Joi.string().optional(),
    direccion: Joi.string().optional(),
    especialidad: Joi.string().optional(),
    disponibilidad: Joi.string().optional()
  }),

  // Equipo
  equipo: Joi.object({
    clienteId: Joi.number().integer().positive().required(),
    nombre: Joi.string().required(),
    tipo: Joi.string().required(),
    marca: Joi.string().optional(),
    modelo: Joi.string().optional(),
    numeroSerie: Joi.string().optional(),
    ubicacion: Joi.string().optional(),
    descripcion: Joi.string().optional(),
    fechaInstalacion: Joi.date().optional()
  }),

  // Servicio
  servicio: Joi.object({
    clienteId: Joi.number().integer().positive().required(),
    equipoId: Joi.number().integer().positive().optional(),
    tipoServicio: Joi.string().required(),
    descripcion: Joi.string().required(),
    fechaProgramada: Joi.date().optional(),
    prioridad: Joi.string().valid('BAJA', 'MEDIA', 'ALTA', 'URGENTE').default('MEDIA'),
    observaciones: Joi.string().optional(),
    detalles: Joi.object().optional()
  }),

  // Actualizar servicio
  updateServicio: Joi.object({
    tecnicoId: Joi.number().integer().positive().optional(),
    tipoServicio: Joi.string().optional(),
    descripcion: Joi.string().optional(),
    fechaProgramada: Joi.date().optional(),
    estado: Joi.string().valid('PENDIENTE', 'PROCESO', 'COMPLETADO', 'CANCELADO').optional(),
    prioridad: Joi.string().valid('BAJA', 'MEDIA', 'ALTA', 'URGENTE').optional(),
    observaciones: Joi.string().optional(),
    detalles: Joi.object().optional(),
    evaluacion: Joi.object().optional()
  }),

  // Repuesto
  repuesto: Joi.object({
    nombre: Joi.string().required(),
    descripcion: Joi.string().optional(),
    marca: Joi.string().optional(),
    modelo: Joi.string().optional(),
    categoria: Joi.string().optional(),
    precio: Joi.number().positive().optional(),
    stock: Joi.number().integer().min(0).default(0),
    stockMinimo: Joi.number().integer().min(0).default(5),
    ubicacion: Joi.string().optional()
  }),

  // Herramienta
  herramienta: Joi.object({
    nombre: Joi.string().required(),
    descripcion: Joi.string().optional(),
    marca: Joi.string().optional(),
    modelo: Joi.string().optional(),
    categoria: Joi.string().optional(),
    estado: Joi.string().optional(),
    ubicacion: Joi.string().optional()
  }),

  // Parámetros de ID
  idParam: Joi.object({
    id: Joi.alternatives().try(
      Joi.number().integer().positive(),
      Joi.string().pattern(/^ODT-\d{3}$/)
    ).required()
  })
};

module.exports = {
  validate,
  schemas
};