const express = require('express');
const repuestoFormularioController = require('../controllers/repuestoFormulario.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/repuestos-formulario - Obtener todos los repuestos del formulario
router.get('/', 
  requireRole(['ADMIN', 'TECNICO']),
  repuestoFormularioController.getAll
);

// GET /api/repuestos-formulario/:id - Obtener repuesto por ID
router.get('/:id',
  requireRole(['ADMIN', 'TECNICO']),
  repuestoFormularioController.getById
);

// POST /api/repuestos-formulario - Crear nuevo repuesto
router.post('/',
  requireRole(['ADMIN', 'TECNICO']),
  repuestoFormularioController.create
);

// PUT /api/repuestos-formulario/:id - Actualizar repuesto
router.put('/:id',
  requireRole(['ADMIN', 'TECNICO']),
  repuestoFormularioController.update
);

// DELETE /api/repuestos-formulario/:id - Eliminar repuesto
router.delete('/:id',
  requireRole(['ADMIN', 'TECNICO']),
  repuestoFormularioController.delete
);

module.exports = router;