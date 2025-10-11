/**
 * ROTAS DE ESTATÍSTICAS
 * Endpoints para métricas e estatísticas agregadas
 */

import express from 'express';
const router = express.Router();
import * as statsController from '../controllers/statsController.js';

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

export default router;