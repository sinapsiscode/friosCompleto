const express = require('express');
const clienteController = require('../controllers/cliente.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');
const { validate, schemas } = require('../middlewares/validation.middleware');
const { uploadClienteAvatar } = require('../config/upload');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/clientes - Obtener todos los clientes
router.get('/', 
  requireRole(['ADMIN', 'TECNICO']),
  clienteController.getAll
);

// GET /api/clientes/:id - Obtener cliente por ID
router.get('/:id',
  requireRole(['ADMIN', 'TECNICO', 'CLIENTE']),
  clienteController.getById
);

// POST /api/clientes - Crear nuevo cliente
router.post('/',
  requireRole(['ADMIN']),
  uploadClienteAvatar,
  validate(schemas.cliente),
  clienteController.create
);

// PUT /api/clientes/:id - Actualizar cliente
router.put('/:id',
  requireRole(['ADMIN', 'CLIENTE']),
  uploadClienteAvatar,
  validate(schemas.updateCliente),
  clienteController.update
);

// DELETE /api/clientes/:id - Eliminar cliente
router.delete('/:id',
  requireRole(['ADMIN']),
  clienteController.delete
);

// GET /api/clientes/:id/equipos - Obtener equipos del cliente
router.get('/:id/equipos',
  requireRole(['ADMIN', 'TECNICO', 'CLIENTE']),
  clienteController.getEquipos
);

// GET /api/clientes/:id/servicios - Obtener servicios del cliente
router.get('/:id/servicios',
  requireRole(['ADMIN', 'TECNICO', 'CLIENTE']),
  clienteController.getServicios
);

module.exports = router;