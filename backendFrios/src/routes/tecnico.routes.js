const express = require('express');
const router = express.Router();

// Placeholder para rutas de técnicos
router.get('/', (req, res) => {
  res.json({ message: 'Rutas de técnicos - En desarrollo' });
});

module.exports = router;