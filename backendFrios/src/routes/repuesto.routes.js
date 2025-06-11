const express = require('express');
const repuestoController = require('../controllers/repuesto.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');
const { validate, schemas } = require('../middlewares/validation.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/repuestos - Obtener todos los repuestos
router.get('/', 
  requireRole(['ADMIN', 'TECNICO']),
  repuestoController.getAll
);

// GET /api/repuestos/stock-bajo - Obtener repuestos con stock bajo
router.get('/stock-bajo',
  requireRole(['ADMIN']),
  repuestoController.getStockBajo
);

// GET /api/repuestos/categorias - Obtener categorías disponibles
router.get('/categorias',
  requireRole(['ADMIN', 'TECNICO']),
  repuestoController.getCategorias
);

// GET /api/repuestos/marcas - Obtener marcas disponibles
router.get('/marcas',
  requireRole(['ADMIN', 'TECNICO']),
  repuestoController.getMarcas
);

// GET /api/repuestos/:id - Obtener repuesto por ID
router.get('/:id',
  requireRole(['ADMIN', 'TECNICO']),
  repuestoController.getById
);

// POST /api/repuestos - Crear nuevo repuesto
router.post('/',
  requireRole(['ADMIN']),
  validate(schemas.createRepuesto),
  repuestoController.create
);

// PUT /api/repuestos/:id - Actualizar repuesto
router.put('/:id',
  requireRole(['ADMIN']),
  validate(schemas.updateRepuesto),
  repuestoController.update
);

// DELETE /api/repuestos/:id - Eliminar repuesto
router.delete('/:id',
  requireRole(['ADMIN']),
  repuestoController.delete
);

// PATCH /api/repuestos/:id/stock - Actualizar stock
router.patch('/:id/stock',
  requireRole(['ADMIN', 'TECNICO']),
  validate(schemas.updateStock),
  repuestoController.updateStock
);

module.exports = router;