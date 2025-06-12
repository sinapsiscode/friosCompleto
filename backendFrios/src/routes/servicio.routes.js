const express = require('express');
const servicioController = require('../controllers/servicio.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');
const { validate, schemas } = require('../middlewares/validation.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/servicios - Obtener todos los servicios
router.get('/', 
  requireRole(['ADMIN', 'TECNICO']),
  servicioController.getAll
);

// GET /api/servicios/estadisticas - Obtener estadísticas de servicios
router.get('/estadisticas',
  requireRole(['ADMIN']),
  servicioController.getEstadisticas
);

// GET /api/servicios/:id - Obtener servicio por ID o número de orden
router.get('/:id',
  requireRole(['ADMIN', 'TECNICO', 'CLIENTE']),
  servicioController.getById
);

// POST /api/servicios - Crear nuevo servicio
router.post('/',
  requireRole(['ADMIN', 'CLIENTE', 'TECNICO']),
  validate(schemas.createServicio),
  servicioController.create
);

// PUT /api/servicios/:id - Actualizar servicio
router.put('/:id',
  requireRole(['ADMIN', 'TECNICO']),
  validate(schemas.updateServicio),
  servicioController.update
);

// POST /api/servicios/:id/asignar-tecnico - Asignar técnico a servicio
router.post('/:id/asignar-tecnico',
  requireRole(['ADMIN']),
  validate(schemas.asignarTecnico),
  servicioController.asignarTecnico
);

// POST /api/servicios/:id/completar - Completar servicio
router.post('/:id/completar',
  requireRole(['ADMIN', 'TECNICO']),
  validate(schemas.completarServicio),
  servicioController.completar
);

// POST /api/servicios/:id/cancelar - Cancelar servicio
router.post('/:id/cancelar',
  requireRole(['ADMIN']),
  validate(schemas.cancelarServicio),
  servicioController.cancelar
);

module.exports = router;