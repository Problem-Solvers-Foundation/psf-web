/**
 * ROTAS DE ESTATÍSTICAS
 * Endpoints para métricas e estatísticas agregadas
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
const router = express.Router();
import * as statsController from '../controllers/statsController.js';

// Rate limiting para endpoints de estatísticas
const statsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 requests por minuto por IP
  message: {
    success: false,
    error: 'Too many requests for statistics. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * GET /api/stats
 * Retorna estatísticas gerais do sistema
 */
router.get('/', statsRateLimit, statsController.getStats);

/**
 * GET /api/stats/category/:category
 * Retorna estatísticas de uma categoria específica
 */
router.get('/category/:category', statsRateLimit, statsController.getStatsByCategory);

/**
 * GET /api/stats/dashboard
 * Retorna estatísticas para o dashboard dinâmico da página about
 */
router.get('/dashboard', statsRateLimit, statsController.getDashboardStats);

export default router;