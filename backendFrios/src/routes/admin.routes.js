const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateToken, requireAdmin } = require('../middlewares/auth.middleware');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Rutas del perfil del administrador
router.get('/profile', adminController.getProfile);
router.put('/profile', adminController.updateProfile);

module.exports = router;