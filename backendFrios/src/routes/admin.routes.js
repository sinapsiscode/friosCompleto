const express = require('express');
const router = express.Router();

// Placeholder para rutas de administrador
router.get('/', (req, res) => {
  res.json({ message: 'Rutas de administrador - En desarrollo' });
});

module.exports = router;