const express = require('express');
const router = express.Router();
const programacionController = require('../controllers/programacion.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

console.log('📅 === PROGRAMACION ROUTES LOADED ===');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Ruta para obtener todas las programaciones
// GET /api/programaciones
router.get('/', programacionController.getAll);

// Ruta para obtener programación por ID
// GET /api/programaciones/:id
router.get('/:id', programacionController.getById);

// Ruta para crear nueva programación
// POST /api/programaciones
router.post('/', programacionController.create);

// Ruta para actualizar programación
// PUT /api/programaciones/:id
router.put('/:id', programacionController.update);

// Ruta para eliminar programación
// DELETE /api/programaciones/:id
router.delete('/:id', programacionController.delete);

// Ruta para activar/desactivar programación
// POST /api/programaciones/:id/toggle-active
router.post('/:id/toggle-active', programacionController.toggleActive);

// Ruta para generar servicios de programaciones activas
// POST /api/programaciones/generar-servicios
router.post('/generar-servicios', programacionController.generarServicios);

module.exports = router;