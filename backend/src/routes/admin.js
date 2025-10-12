/**
 * ROTAS ADMIN
 * Painel administrativo para gerenciar posts
 */

import { Router } from 'express';
const router = Router();
import * as adminController from '../controllers/adminController.js';
import { requireAuth, redirectIfAuthenticated } from '../middleware/auth.js';

// ===============================
// ROTAS PÚBLICAS (sem autenticação)
// ===============================

/**
 * GET /admin/login
 * Página de login
 */
router.get('/login', redirectIfAuthenticated, adminController.showLogin);

/**
 * POST /admin/login
 * Processa login
 */
router.post('/login', adminController.processLogin);

/**
 * GET /admin/logout
 * Faz logout
 */
router.get('/logout', adminController.logout);

// ===============================
// ROTAS PROTEGIDAS (requerem autenticação)
// ===============================

/**
 * GET /admin/dashboard
 * Dashboard principal
 */
router.get('/dashboard', requireAuth, adminController.showDashboard);

/**
 * GET /admin/posts
 * Listagem de posts
 */
router.get('/posts', requireAuth, adminController.showPosts);

/**
 * GET /admin/posts/new
 * Formulário para criar novo post
 */
router.get('/posts/new', requireAuth, adminController.showNewPostForm);

/**
 * POST /admin/posts/create
 * Cria novo post
 */
router.post('/posts/create', requireAuth, adminController.createPost);

/**
 * GET /admin/posts/edit/:id
 * Formulário para editar post
 */
router.get('/posts/edit/:id', requireAuth, adminController.showEditPostForm);

/**
 * POST /admin/posts/edit/:id
 * Atualiza post
 */
router.post('/posts/edit/:id', requireAuth, adminController.updatePost);

/**
 * POST /admin/posts/delete/:id
 * Deleta post
 */
router.post('/posts/delete/:id', requireAuth, adminController.deletePost);

/**
 * GET /admin (redireciona para dashboard)
 */
router.get('/', (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    res.redirect('/admin/dashboard');
  } else {
    res.redirect('/admin/login');
  }
});

// ===============================
// GERENCIAMENTO DE PROJETOS
// ===============================

/**
 * GET /admin/projects
 * Listagem de projetos
 */
router.get('/projects', requireAuth, adminController.showProjects);

/**
 * GET /admin/projects/new
 * Formulário para criar novo projeto
 */
router.get('/projects/new', requireAuth, adminController.showNewProjectForm);

/**
 * POST /admin/projects/create
 * Cria novo projeto
 */
router.post('/projects/create', requireAuth, adminController.createProject);

/**
 * GET /admin/projects/edit/:id
 * Formulário para editar projeto
 */
router.get('/projects/edit/:id', requireAuth, adminController.showEditProjectForm);

/**
 * POST /admin/projects/edit/:id
 * Atualiza projeto
 */
router.post('/projects/edit/:id', requireAuth, adminController.updateProject);

/**
 * POST /admin/projects/delete/:id
 * Deleta projeto
 */
router.post('/projects/delete/:id', requireAuth, adminController.deleteProject);

// ===============================
// GERENCIAMENTO DE USUÁRIOS
// ===============================

/**
 * GET /admin/users
 * Listagem de usuários
 */
router.get('/users', requireAuth, adminController.showUsers);

/**
 * POST /admin/users/create
 * Cria novo usuário
 */
router.post('/users/create', requireAuth, adminController.createUser);

/**
 * GET /admin/users/edit/:id
 * Formulário para editar usuário
 */
router.get('/users/edit/:id', requireAuth, adminController.showEditUserForm);

/**
 * POST /admin/users/edit/:id
 * Atualiza usuário
 */
router.post('/users/edit/:id', requireAuth, adminController.updateUser);

/**
 * POST /admin/users/delete/:id
 * Deleta usuário
 */
router.post('/users/delete/:id', requireAuth, adminController.deleteUser);

// ===============================
// GERENCIAMENTO DE APPLICATIONS
// ===============================

/**
 * GET /admin/applications
 * Listagem de candidaturas
 */
router.get('/applications', requireAuth, adminController.showApplications);

/**
 * GET /admin/applications/view/:id
 * Visualizar candidatura específica
 */
router.get('/applications/view/:id', requireAuth, adminController.showApplicationDetail);

/**
 * POST /admin/applications/update/:id
 * Atualiza candidatura
 */
router.post('/applications/update/:id', requireAuth, adminController.updateApplication);

/**
 * POST /admin/applications/delete/:id
 * Deleta candidatura
 */
router.post('/applications/delete/:id', requireAuth, adminController.deleteApplication);

/**
 * GET /admin/applications/export/:id/pdf
 * Exporta candidatura para PDF
 */
router.get('/applications/export/:id/pdf', requireAuth, adminController.exportApplicationPDF);

export default router;