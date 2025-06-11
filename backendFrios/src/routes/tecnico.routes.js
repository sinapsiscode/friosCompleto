const express = require('express');
const tecnicoController = require('../controllers/tecnico.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');
const { validate, schemas } = require('../middlewares/validation.middleware');
const { uploadTecnicoAvatar, handleUploadError } = require('../config/upload');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/tecnicos - Obtener todos los técnicos
router.get('/', 
  requireRole(['ADMIN', 'TECNICO']),
  tecnicoController.getAll
);

// GET /api/tecnicos/:id - Obtener técnico por ID
router.get('/:id',
  requireRole(['ADMIN', 'TECNICO']),
  tecnicoController.getById
);

// POST /api/tecnicos - Crear nuevo técnico (con foto)
router.post('/',
  requireRole(['ADMIN']),
  uploadTecnicoAvatar,
  handleUploadError,
  validate(schemas.createTecnico),
  tecnicoController.create
);

// PUT /api/tecnicos/:id - Actualizar técnico (con foto)
router.put('/:id',
  requireRole(['ADMIN', 'TECNICO']),
  uploadTecnicoAvatar,
  handleUploadError,
  validate(schemas.updateTecnico),
  tecnicoController.update
);

// DELETE /api/tecnicos/:id - Eliminar técnico
router.delete('/:id',
  requireRole(['ADMIN']),
  tecnicoController.delete
);

// GET /api/tecnicos/:id/servicios - Obtener servicios del técnico
router.get('/:id/servicios',
  requireRole(['ADMIN', 'TECNICO']),
  tecnicoController.getServicios
);

// GET /api/tecnicos/:id/disponibilidad - Obtener disponibilidad del técnico
router.get('/:id/disponibilidad',
  requireRole(['ADMIN', 'TECNICO']),
  tecnicoController.getDisponibilidad
);

module.exports = router;