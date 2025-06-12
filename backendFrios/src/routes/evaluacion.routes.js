const express = require('express');
const router = express.Router();
const evaluacionController = require('../controllers/evaluacion.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /api/evaluaciones/servicio/:id - Evaluar un servicio
router.post('/servicio/:id',
  requireRole(['CLIENTE', 'ADMIN']), // Solo clientes pueden evaluar (y admins para testing)
  evaluacionController.evaluarServicio
);

// GET /api/evaluaciones/servicio/:id - Obtener evaluación de un servicio
router.get('/servicio/:id',
  requireRole(['CLIENTE', 'TECNICO', 'ADMIN']), // Todos pueden ver evaluaciones
  evaluacionController.obtenerEvaluacion
);

// GET /api/evaluaciones/mis-servicios - Obtener servicios del cliente para evaluar
router.get('/mis-servicios',
  requireRole(['CLIENTE']), // Solo clientes
  evaluacionController.obtenerServiciosParaEvaluar
);

// GET /api/evaluaciones/tecnico/:tecnicoId? - Obtener evaluaciones de un técnico
router.get('/tecnico/:tecnicoId?',
  requireRole(['TECNICO', 'ADMIN']), // Técnicos pueden ver sus propias evaluaciones, admins todas
  evaluacionController.obtenerEvaluacionesTecnico
);

module.exports = router;