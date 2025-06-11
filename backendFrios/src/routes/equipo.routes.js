const express = require('express');
const equipoController = require('../controllers/equipo.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');
const { validate, schemas } = require('../middlewares/validation.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/equipos - Obtener todos los equipos
router.get('/', 
  requireRole(['ADMIN', 'TECNICO']),
  equipoController.getAll
);

// GET /api/equipos/:id - Obtener equipo por ID
router.get('/:id',
  requireRole(['ADMIN', 'TECNICO', 'CLIENTE']),
  equipoController.getById
);

// POST /api/equipos - Crear nuevo equipo
router.post('/',
  requireRole(['ADMIN']),
  validate(schemas.createEquipo),
  equipoController.create
);

// PUT /api/equipos/:id - Actualizar equipo
router.put('/:id',
  requireRole(['ADMIN']),
  validate(schemas.updateEquipo),
  equipoController.update
);

// DELETE /api/equipos/:id - Eliminar equipo
router.delete('/:id',
  requireRole(['ADMIN']),
  equipoController.delete
);

// GET /api/equipos/:id/servicios - Obtener servicios del equipo
router.get('/:id/servicios',
  requireRole(['ADMIN', 'TECNICO', 'CLIENTE']),
  equipoController.getServicios
);

// GET /api/equipos/cliente/:clienteId - Obtener equipos por cliente
router.get('/cliente/:clienteId',
  requireRole(['ADMIN', 'TECNICO', 'CLIENTE']),
  equipoController.getByCliente
);

module.exports = router;