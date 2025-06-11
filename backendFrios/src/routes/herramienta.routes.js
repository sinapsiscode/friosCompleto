const express = require('express');
const herramientaController = require('../controllers/herramienta.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');
const { validate, schemas } = require('../middlewares/validation.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/herramientas - Obtener todas las herramientas
router.get('/', 
  requireRole(['ADMIN', 'TECNICO']),
  herramientaController.getAll
);

// GET /api/herramientas/disponibles - Obtener herramientas disponibles
router.get('/disponibles',
  requireRole(['ADMIN', 'TECNICO']),
  herramientaController.getDisponibles
);

// GET /api/herramientas/categorias - Obtener categorías disponibles
router.get('/categorias',
  requireRole(['ADMIN', 'TECNICO']),
  herramientaController.getCategorias
);

// GET /api/herramientas/tecnico/:tecnicoId - Obtener herramientas asignadas a un técnico
router.get('/tecnico/:tecnicoId',
  requireRole(['ADMIN', 'TECNICO']),
  herramientaController.getByTecnico
);

// GET /api/herramientas/:id - Obtener herramienta por ID
router.get('/:id',
  requireRole(['ADMIN', 'TECNICO']),
  herramientaController.getById
);

// POST /api/herramientas - Crear nueva herramienta
router.post('/',
  requireRole(['ADMIN']),
  validate(schemas.createHerramienta),
  herramientaController.create
);

// PUT /api/herramientas/:id - Actualizar herramienta
router.put('/:id',
  requireRole(['ADMIN']),
  validate(schemas.updateHerramienta),
  herramientaController.update
);

// DELETE /api/herramientas/:id - Eliminar herramienta
router.delete('/:id',
  requireRole(['ADMIN']),
  herramientaController.delete
);

// POST /api/herramientas/:id/asignar - Asignar herramienta a técnico
router.post('/:id/asignar',
  requireRole(['ADMIN']),
  validate(schemas.asignarHerramienta),
  herramientaController.asignar
);

// POST /api/herramientas/:id/devolver - Devolver herramienta
router.post('/:id/devolver',
  requireRole(['ADMIN', 'TECNICO']),
  validate(schemas.devolverHerramienta),
  herramientaController.devolver
);

module.exports = router;