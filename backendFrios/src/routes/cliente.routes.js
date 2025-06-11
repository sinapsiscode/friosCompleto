const express = require('express');
const router = express.Router();

// Placeholder para rutas de clientes
router.get('/', (req, res) => {
  res.json({ message: 'Rutas de clientes - En desarrollo' });
});

module.exports = router;