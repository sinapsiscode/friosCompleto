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
    password: Joi.string().min(1).required().messages({
      'string.empty': 'La contraseña es requerida',
      'any.required': 'La contraseña es requerida'
    })
  }),

  // Técnicos
  createTecnico: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    nombre: Joi.string().min(2).max(50).required(),
    apellido: Joi.string().min(2).max(50).required(),
    telefono: Joi.string().optional().allow(''),
    direccion: Joi.string().optional().allow(''),
    distrito: Joi.string().optional().allow(''),
    dni: Joi.string().length(8).pattern(/^[0-9]+$/).optional().allow(''),
    especialidad: Joi.string().valid('general', 'refrigeracion', 'aire_acondicionado', 'sistemas_comerciales', 'sistemas_industriales').optional(),
    experiencia: Joi.number().integer().min(0).max(50).optional(),
    certificaciones: Joi.string().optional().allow(''),
    disponibilidad: Joi.string().valid('DISPONIBLE', 'NO_DISPONIBLE', 'OCUPADO').optional()
  }),

  updateTecnico: Joi.object({
    nombre: Joi.string().min(2).max(50).optional(),
    apellido: Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().optional(),
    telefono: Joi.string().optional().allow(''),
    direccion: Joi.string().optional().allow(''),
    distrito: Joi.string().optional().allow(''),
    dni: Joi.string().length(8).pattern(/^[0-9]+$/).optional().allow(''),
    especialidad: Joi.string().valid('general', 'refrigeracion', 'aire_acondicionado', 'sistemas_comerciales', 'sistemas_industriales').optional(),
    experiencia: Joi.number().integer().min(0).max(50).optional(),
    certificaciones: Joi.string().optional().allow(''),
    disponibilidad: Joi.string().valid('DISPONIBLE', 'NO_DISPONIBLE', 'OCUPADO').optional(),
    isActive: Joi.boolean().optional()
  }),

  // Clientes
  createCliente: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    nombre: Joi.string().min(2).max(50).required(),
    apellido: Joi.string().min(2).max(50).required(),
    telefono: Joi.string().pattern(/^[+]?[0-9\s\-()]{9,20}$/).optional(),
    direccion: Joi.string().max(200).optional(),
    tipo: Joi.string().valid('persona', 'empresa').default('persona')
  }),

  updateCliente: Joi.object({
    nombre: Joi.string().min(2).max(50).optional(),
    apellido: Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().optional(),
    telefono: Joi.string().pattern(/^[+]?[0-9\s\-()]{9,20}$/).optional(),
    direccion: Joi.string().max(200).optional(),
    tipo: Joi.string().valid('persona', 'empresa').optional(),
    isActive: Joi.boolean().optional()
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
    username: Joi.string().pattern(/^[a-zA-Z0-9._-]+$/).min(3).max(30).required().messages({
      'any.required': 'El nombre de usuario es requerido',
      'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
      'string.pattern.base': 'El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es requerido'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es requerida'
    }),
    nombre: Joi.string().required().messages({
      'any.required': 'El nombre es requerido'
    }),
    apellido: Joi.string().required().messages({
      'any.required': 'El apellido es requerido'
    }),
    telefono: Joi.string().optional(),
    direccion: Joi.string().optional(),
    ciudad: Joi.string().optional(),
    distrito: Joi.string().optional(),
    tipo: Joi.string().valid('persona', 'empresa').optional(),
    razonSocial: Joi.string().when('tipo', {
      is: 'empresa',
      then: Joi.string().required(),
      otherwise: Joi.string().optional().allow('')
    }),
    ruc: Joi.string().when('tipo', {
      is: 'empresa',
      then: Joi.string().pattern(/^[0-9]{11}$/).required(),
      otherwise: Joi.string().optional().allow('')
    }),
    dni: Joi.string().when('tipo', {
      is: 'persona',
      then: Joi.string().pattern(/^[0-9]{8}$/).optional(),
      otherwise: Joi.string().optional()
    }),
    sector: Joi.string().optional(),
    equipos: Joi.alternatives().try(
      Joi.array(),
      Joi.string().allow('')
    ).optional() // Permitir array o string vacío
  }),

  // Técnicos
  createTecnico: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    nombre: Joi.string().min(2).max(50).required(),
    apellido: Joi.string().min(2).max(50).required(),
    telefono: Joi.string().pattern(/^[+]?[0-9\s\-()]{9,20}$/).optional(),
    direccion: Joi.string().max(200).optional(),
    distrito: Joi.string().max(100).optional(),
    dni: Joi.string().pattern(/^[0-9]{8}$/).optional(),
    especialidad: Joi.string().max(100).optional(),
    experiencia: Joi.number().integer().min(0).max(50).optional(),
    certificaciones: Joi.string().max(500).optional().allow(''),
    disponibilidad: Joi.string().valid('DISPONIBLE', 'NO_DISPONIBLE', 'EN_SERVICIO').default('DISPONIBLE')
  }),

  updateTecnico: Joi.object({
    nombre: Joi.string().min(2).max(50).optional(),
    apellido: Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().optional(),
    telefono: Joi.string().pattern(/^[+]?[0-9\s\-()]{9,20}$/).optional(),
    direccion: Joi.string().max(200).optional(),
    especialidad: Joi.string().max(100).optional(),
    certificaciones: Joi.string().max(500).optional(),
    disponibilidad: Joi.string().valid('DISPONIBLE', 'NO_DISPONIBLE', 'EN_SERVICIO').optional(),
    isActive: Joi.boolean().optional()
  }),

  tecnico: Joi.object({
    nombre: Joi.string().required(),
    apellido: Joi.string().required(),
    email: Joi.string().email().required(),
    telefono: Joi.string().optional(),
    direccion: Joi.string().optional(),
    especialidad: Joi.string().optional(),
    disponibilidad: Joi.string().optional()
  }),

  // Equipos
  createEquipo: Joi.object({
    clienteId: Joi.number().integer().positive().required(),
    nombre: Joi.string().min(2).max(100).optional(),
    tipo: Joi.string().min(2).max(50).required(),
    marca: Joi.string().max(50).optional(),
    modelo: Joi.string().max(50).optional(),
    numeroSerie: Joi.string().max(100).optional(),
    ubicacion: Joi.string().max(200).optional(),
    descripcion: Joi.string().max(500).optional(),
    fechaInstalacion: Joi.date().optional(),
    fechaCompra: Joi.date().optional(),
    capacidad: Joi.string().max(100).optional(),
    estadoOperativo: Joi.string().valid('operativo', 'mantenimiento', 'reparacion', 'inactivo').optional(),
    especificacionesTecnicas: Joi.string().max(1000).optional(),
    garantia: Joi.string().max(200).optional()
  }),

  updateEquipo: Joi.object({
    nombre: Joi.string().min(2).max(100).optional(),
    tipo: Joi.string().min(2).max(50).optional(),
    marca: Joi.string().max(50).optional(),
    modelo: Joi.string().max(50).optional(),
    numeroSerie: Joi.string().max(100).optional(),
    ubicacion: Joi.string().max(200).optional(),
    descripcion: Joi.string().max(500).optional(),
    fechaInstalacion: Joi.date().optional(),
    fechaCompra: Joi.date().optional(),
    capacidad: Joi.string().max(100).optional(),
    estadoOperativo: Joi.string().valid('operativo', 'mantenimiento', 'reparacion', 'inactivo').optional(),
    especificacionesTecnicas: Joi.string().max(1000).optional(),
    garantia: Joi.string().max(200).optional(),
    isActive: Joi.boolean().optional()
  }),

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

  // Servicios
  createServicio: Joi.object({
    clienteId: Joi.number().integer().positive().required(),
    equipoId: Joi.number().integer().positive().optional(),
    tipoServicio: Joi.string().min(5).max(100).required(),
    descripcion: Joi.string().min(10).max(1000).required(),
    fechaProgramada: Joi.date().min('now').optional(),
    prioridad: Joi.string().valid('BAJA', 'MEDIA', 'ALTA', 'URGENTE').default('MEDIA'),
    observaciones: Joi.string().max(500).optional(),
    detalles: Joi.object().optional()
  }),

  updateServicio: Joi.object({
    tecnicoId: Joi.number().integer().positive().optional(),
    tipoServicio: Joi.string().min(5).max(100).optional(),
    descripcion: Joi.string().min(10).max(1000).optional(),
    fechaProgramada: Joi.date().optional(),
    estado: Joi.string().valid('PENDIENTE', 'PROCESO', 'COMPLETADO', 'CANCELADO').optional(),
    prioridad: Joi.string().valid('BAJA', 'MEDIA', 'ALTA', 'URGENTE').optional(),
    observaciones: Joi.string().max(500).optional(),
    detalles: Joi.object().optional(),
    evaluacion: Joi.object().optional()
  }),

  asignarTecnico: Joi.object({
    tecnicoId: Joi.number().integer().positive().required(),
    fechaProgramada: Joi.date().min('now').optional()
  }),

  completarServicio: Joi.object({
    observacionesFinales: Joi.string().max(1000).optional(),
    evaluacion: Joi.object().optional(),
    repuestosUsados: Joi.array().items(Joi.object()).optional(),
    tiempoEmpleado: Joi.number().positive().optional()
  }),

  cancelarServicio: Joi.object({
    motivoCancelacion: Joi.string().min(10).max(500).required()
  }),

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

  // Repuestos
  createRepuesto: Joi.object({
    nombre: Joi.string().min(2).max(100).required(),
    descripcion: Joi.string().max(500).optional(),
    marca: Joi.string().max(50).optional(),
    modelo: Joi.string().max(50).optional(),
    categoria: Joi.string().max(50).optional(),
    precio: Joi.number().positive().precision(2).optional(),
    stock: Joi.number().integer().min(0).default(0),
    stockMinimo: Joi.number().integer().min(0).default(5),
    ubicacion: Joi.string().max(100).optional(),
    codigoInterno: Joi.string().max(50).optional(),
    proveedor: Joi.string().max(100).optional()
  }),

  updateRepuesto: Joi.object({
    nombre: Joi.string().min(2).max(100).optional(),
    descripcion: Joi.string().max(500).optional(),
    marca: Joi.string().max(50).optional(),
    modelo: Joi.string().max(50).optional(),
    categoria: Joi.string().max(50).optional(),
    precio: Joi.number().positive().precision(2).optional(),
    stock: Joi.number().integer().min(0).optional(),
    stockMinimo: Joi.number().integer().min(0).optional(),
    ubicacion: Joi.string().max(100).optional(),
    codigoInterno: Joi.string().max(50).optional(),
    proveedor: Joi.string().max(100).optional(),
    isActive: Joi.boolean().optional()
  }),

  updateStock: Joi.object({
    cantidad: Joi.number().integer().min(0).required(),
    operacion: Joi.string().valid('set', 'add', 'subtract').default('set'),
    observaciones: Joi.string().max(200).optional()
  }),

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

  // Herramientas
  createHerramienta: Joi.object({
    nombre: Joi.string().min(2).max(100).required(),
    descripcion: Joi.string().max(500).optional(),
    marca: Joi.string().max(50).optional(),
    modelo: Joi.string().max(50).optional(),
    categoria: Joi.string().max(50).optional(),
    estado: Joi.string().valid('EXCELENTE', 'BUENO', 'REGULAR', 'MALO', 'REPARACION').default('BUENO'),
    ubicacion: Joi.string().max(100).optional(),
    codigoInterno: Joi.string().max(50).optional(),
    fechaAdquisicion: Joi.date().optional(),
    valorAdquisicion: Joi.number().positive().optional(),
    mantenimiento: Joi.string().max(500).optional()
  }),

  updateHerramienta: Joi.object({
    nombre: Joi.string().min(2).max(100).optional(),
    descripcion: Joi.string().max(500).optional(),
    marca: Joi.string().max(50).optional(),
    modelo: Joi.string().max(50).optional(),
    categoria: Joi.string().max(50).optional(),
    estado: Joi.string().valid('EXCELENTE', 'BUENO', 'REGULAR', 'MALO', 'REPARACION').optional(),
    ubicacion: Joi.string().max(100).optional(),
    codigoInterno: Joi.string().max(50).optional(),
    fechaAdquisicion: Joi.date().optional(),
    valorAdquisicion: Joi.number().positive().optional(),
    mantenimiento: Joi.string().max(500).optional(),
    disponible: Joi.boolean().optional(),
    isActive: Joi.boolean().optional()
  }),

  asignarHerramienta: Joi.object({
    tecnicoId: Joi.number().integer().positive().required(),
    fechaAsignacion: Joi.date().optional(),
    observaciones: Joi.string().max(200).optional()
  }),

  devolverHerramienta: Joi.object({
    estadoDevolucion: Joi.string().valid('EXCELENTE', 'BUENO', 'REGULAR', 'MALO', 'REPARACION').optional(),
    observaciones: Joi.string().max(200).optional()
  }),

  herramienta: Joi.object({
    nombre: Joi.string().required(),
    descripcion: Joi.string().optional(),
    marca: Joi.string().optional(),
    modelo: Joi.string().optional(),
    categoria: Joi.string().optional(),
    estado: Joi.string().optional(),
    ubicacion: Joi.string().optional()
  }),

  // Servicios
  createServicio: Joi.object({
    clienteId: Joi.number().integer().positive().required().messages({
      'any.required': 'El cliente es requerido',
      'number.base': 'El cliente debe ser válido'
    }),
    tecnicoId: Joi.number().integer().positive().optional().allow(null).messages({
      'number.base': 'El técnico debe ser válido'
    }),
    equipoId: Joi.number().integer().positive().optional().allow(null).messages({
      'number.base': 'El equipo debe ser válido'
    }),
    tipoServicio: Joi.string().required().messages({
      'any.required': 'El tipo de servicio es requerido',
      'string.empty': 'El tipo de servicio no puede estar vacío'
    }),
    descripcion: Joi.string().min(10).max(1000).required().messages({
      'any.required': 'La descripción es requerida',
      'string.min': 'La descripción debe tener al menos 10 caracteres',
      'string.max': 'La descripción no puede exceder 1000 caracteres'
    }),
    observaciones: Joi.string().max(500).optional().allow('', null),
    fechaProgramada: Joi.date().optional().allow(null),
    prioridad: Joi.string().valid('BAJA', 'MEDIA', 'ALTA', 'URGENTE').default('MEDIA'),
    estado: Joi.string().valid('PENDIENTE', 'PROCESO', 'COMPLETADO', 'CANCELADO').default('PENDIENTE'),
    detalles: Joi.object().optional(),
    equiposIds: Joi.array().items(Joi.number().integer().positive()).optional() // Para múltiples equipos
  }),

  updateServicio: Joi.object({
    clienteId: Joi.number().integer().positive().optional(),
    tecnicoId: Joi.number().integer().positive().optional().allow(null),
    equipoId: Joi.number().integer().positive().optional().allow(null),
    tipoServicio: Joi.string().optional(),
    descripcion: Joi.string().min(10).max(1000).optional(),
    observaciones: Joi.string().max(500).optional().allow('', null),
    fechaProgramada: Joi.date().optional().allow(null),
    fechaInicio: Joi.date().optional().allow(null),
    fechaCompletado: Joi.date().optional().allow(null),
    prioridad: Joi.string().valid('BAJA', 'MEDIA', 'ALTA', 'URGENTE').optional(),
    estado: Joi.string().valid('PENDIENTE', 'PROCESO', 'COMPLETADO', 'CANCELADO').optional(),
    motivoCancelacion: Joi.string().max(500).optional().allow('', null),
    detalles: Joi.object().optional(),
    evaluacion: Joi.object().optional(),
    equiposIds: Joi.array().items(Joi.number().integer().positive()).optional()
  }),

  asignarTecnico: Joi.object({
    tecnicoId: Joi.number().integer().positive().required().messages({
      'any.required': 'El técnico es requerido',
      'number.base': 'El técnico debe ser válido'
    }),
    fechaProgramada: Joi.date().optional(),
    observaciones: Joi.string().max(500).optional()
  }),

  completarServicio: Joi.object({
    observacionesFinales: Joi.string().max(1000).optional(),
    detallesCompletado: Joi.object().optional(),
    evaluacionTecnico: Joi.object().optional(),
    fechaCompletado: Joi.date().optional()
  }),

  cancelarServicio: Joi.object({
    motivo: Joi.string().min(5).max(500).required().messages({
      'any.required': 'El motivo de cancelación es requerido',
      'string.min': 'El motivo debe tener al menos 5 caracteres'
    }),
    observaciones: Joi.string().max(500).optional()
  }),

  servicioQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(100).optional(),
    estado: Joi.string().valid('PENDIENTE', 'PROCESO', 'COMPLETADO', 'CANCELADO').optional(),
    tecnicoId: Joi.number().integer().positive().optional(),
    clienteId: Joi.number().integer().positive().optional(),
    fechaInicio: Joi.date().optional(),
    fechaFin: Joi.date().optional(),
    prioridad: Joi.string().valid('BAJA', 'MEDIA', 'ALTA', 'URGENTE').optional()
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