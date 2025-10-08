/**
 * ROTAS DE ESTATÍSTICAS
 * Endpoints para métricas e estatísticas agregadas
 */

const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

/**
 * GET /api/stats
 * Retorna estatísticas gerais do sistema
 */
router.get('/', statsController.getStats);

/**
 * GET /api/stats/category/:category
 * Retorna estatísticas de uma categoria específica
 */
router.get('/category/:category', statsController.getStatsByCategory);

module.exports = router;
