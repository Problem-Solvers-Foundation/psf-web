/**
 * ROTAS DE PROJETOS
 * Solutions, Progress e Impact
 */

const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
// const authMiddleware = require('../middleware/auth'); // Vamos adicionar depois

// ===============================
// ROTAS PÚBLICAS (sem autenticação)
// ===============================

/**
 * GET /api/projects
 * Retorna todos os projetos
 * Exemplo: /api/projects?category=solutions&limit=10
 */
router.get('/', projectController.getAllProjects);

/**
 * GET /api/projects/:id
 * Retorna um projeto específico por ID
 * Exemplo: /api/projects/abc123
 */
router.get('/:id', projectController.getProjectById);

/**
 * GET /api/projects/category/:category
 * Retorna projetos por categoria (solutions, progress, impact)
 * Exemplo: /api/projects/category/solutions
 */
router.get('/category/:category', projectController.getProjectsByCategory);

// ===============================
// ROTAS PROTEGIDAS (requerem autenticação)
// ===============================
// Vamos adicionar o middleware de autenticação depois

/**
 * POST /api/projects
 * Cria um novo projeto
 * Body: { title, description, category, imageUrl, progress, etc }
 */
router.post('/', /* authMiddleware, */ projectController.createProject);

/**
 * PUT /api/projects/:id
 * Atualiza um projeto existente
 * Body: campos a serem atualizados
 */
router.put('/:id', /* authMiddleware, */ projectController.updateProject);

/**
 * DELETE /api/projects/:id
 * Deleta um projeto
 */
router.delete('/:id', /* authMiddleware, */ projectController.deleteProject);

/**
 * PATCH /api/projects/:id/progress
 * Atualiza apenas o progresso do projeto
 * Body: { progress: 75 }
 */
router.patch('/:id/progress', /* authMiddleware, */ projectController.updateProgress);

module.exports = router;