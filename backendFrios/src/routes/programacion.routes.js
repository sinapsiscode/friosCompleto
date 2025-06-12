const express = require('express');
const programacionController = require('../controllers/programacion.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/programaciones - Obtener todas las programaciones
router.get('/', 
  requireRole(['ADMIN', 'TECNICO']),
  programacionController.getAll
);

// POST /api/programaciones - Crear nueva programación
router.post('/',
  requireRole(['ADMIN']),
  programacionController.create
);

// PUT /api/programaciones/:id - Actualizar programación
router.put('/:id',
  requireRole(['ADMIN']),
  programacionController.update
);

module.exports = router;