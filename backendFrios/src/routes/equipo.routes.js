const express = require('express');
const router = express.Router();

// Placeholder para rutas de equipos
router.get('/', (req, res) => {
  res.json({ message: 'Rutas de equipos - En desarrollo' });
});

module.exports = router;