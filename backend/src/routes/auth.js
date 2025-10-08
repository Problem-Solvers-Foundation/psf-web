/**
 * ROTAS DE AUTENTICAÇÃO (TEMPORÁRIO)
 * Vamos implementar depois - por enquanto só retorna uma mensagem
 */

const express = require('express');
const router = express.Router();

// Rota temporária
router.get('/', (req, res) => {
  res.json({
    message: 'Auth routes - em desenvolvimento',
    status: 'coming soon'
  });
});

module.exports = router;