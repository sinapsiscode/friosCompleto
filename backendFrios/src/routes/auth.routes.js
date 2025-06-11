const express = require('express');
const Joi = require('joi');
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validate, schemas } = require('../middlewares/validation.middleware');

const router = express.Router();

// Rutas públicas (sin autenticación)
router.post('/register', 
  validate(schemas.register),
  authController.register
);

router.post('/login',
  validate(schemas.login),
  authController.login
);

router.post('/refresh',
  authController.refreshToken
);

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);

router.get('/profile',
  authController.profile
);

router.post('/logout',
  authController.logout
);

router.put('/change-password',
  validate(Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  })),
  authController.changePassword
);

module.exports = router;