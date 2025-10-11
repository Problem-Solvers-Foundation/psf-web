/**
 * ROTAS DE AUTENTICAÇÃO (TEMPORÁRIO)
 * Vamos implementar depois - por enquanto só retorna uma mensagem
 */

import express from 'express';
const router = express.Router();

// Rota temporária
router.get('/', (req, res) => {
  res.json({
    message: 'Auth routes - em desenvolvimento',
    status: 'coming soon'
  });
});

export default router;