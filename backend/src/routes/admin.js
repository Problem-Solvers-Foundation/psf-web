/**
 * ROTAS ADMIN
 * Painel administrativo para gerenciar posts
 */

import { Router } from 'express';
const router = Router();
import * as adminController from '../controllers/adminController.js';
import { requireAuth, redirectIfAuthenticated } from '../middleware/auth.js';
import { requireAdminFeatures } from '../middleware/rolePermissions.js';
import { checkLoginRateLimit } from '../middleware/loginRateLimiter.js';

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
 * Processa login com rate limiting
 */
router.post('/login', checkLoginRateLimit, adminController.processLogin);

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
 * Dashboard principal (apenas para admins/superusers)
 */
router.get('/dashboard', requireAuth, requireAdminFeatures, adminController.showDashboard);

/**
 * GET /admin/community-dashboard
 * Dashboard para community users
 */
router.get('/community-dashboard', requireAuth, adminController.showCommunityDashboard);

/**
 * GET /admin/posts
 * Listagem de posts (apenas para admins/superusers)
 */
router.get('/posts', requireAuth, requireAdminFeatures, adminController.showPosts);

/**
 * GET /admin/posts/new
 * Formulário para criar novo post (apenas para admins/superusers)
 */
router.get('/posts/new', requireAuth, requireAdminFeatures, adminController.showNewPostForm);

/**
 * POST /admin/posts/create
 * Cria novo post (apenas para admins/superusers)
 */
router.post('/posts/create', requireAuth, requireAdminFeatures, adminController.createPost);

/**
 * GET /admin/posts/edit/:id
 * Formulário para editar post (apenas para admins/superusers)
 */
router.get('/posts/edit/:id', requireAuth, requireAdminFeatures, adminController.showEditPostForm);

/**
 * POST /admin/posts/edit/:id
 * Atualiza post (apenas para admins/superusers)
 */
router.post('/posts/edit/:id', requireAuth, requireAdminFeatures, adminController.updatePost);

/**
 * POST /admin/posts/delete/:id
 * Deleta post (apenas para admins/superusers)
 */
router.post('/posts/delete/:id', requireAuth, requireAdminFeatures, adminController.deletePost);

/**
 * POST /admin/posts/toggle/:id
 * Alterna status de publicação do post (apenas para admins/superusers)
 */
router.post('/posts/toggle/:id', requireAuth, requireAdminFeatures, adminController.togglePostStatus);

/**
 * GET /admin/posts/preview/:id
 * Pré-visualiza post (apenas para admins/superusers)
 */
router.get('/posts/preview/:id', requireAuth, requireAdminFeatures, adminController.previewPost);

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
router.get('/projects', requireAuth, requireAdminFeatures, adminController.showProjects);

/**
 * GET /admin/projects/new
 * Formulário para criar novo projeto
 */
router.get('/projects/new', requireAuth, requireAdminFeatures, adminController.showNewProjectForm);

/**
 * POST /admin/projects/create
 * Cria novo projeto
 */
router.post('/projects/create', requireAuth, requireAdminFeatures, adminController.createProject);

/**
 * GET /admin/projects/edit/:id
 * Formulário para editar projeto
 */
router.get('/projects/edit/:id', requireAuth, requireAdminFeatures, adminController.showEditProjectForm);

/**
 * POST /admin/projects/edit/:id
 * Atualiza projeto
 */
router.post('/projects/edit/:id', requireAuth, requireAdminFeatures, adminController.updateProject);

/**
 * POST /admin/projects/delete/:id
 * Deleta projeto
 */
router.post('/projects/delete/:id', requireAuth, requireAdminFeatures, adminController.deleteProject);

// ===============================
// GERENCIAMENTO DE USUÁRIOS
// ===============================

/**
 * GET /admin/users
 * Listagem de usuários
 */
router.get('/users', requireAuth, requireAdminFeatures, adminController.showUsers);

/**
 * POST /admin/users/create
 * Cria novo usuário
 */
router.post('/users/create', requireAuth, requireAdminFeatures, adminController.createUser);

/**
 * GET /admin/users/edit/:id
 * Formulário para editar usuário
 */
router.get('/users/edit/:id', requireAuth, requireAdminFeatures, adminController.showEditUserForm);

/**
 * POST /admin/users/edit/:id
 * Atualiza usuário
 */
router.post('/users/edit/:id', requireAuth, requireAdminFeatures, adminController.updateUser);

/**
 * POST /admin/users/delete/:id
 * Deleta usuário
 */
router.post('/users/delete/:id', requireAuth, requireAdminFeatures, adminController.deleteUser);

// ===============================
// GERENCIAMENTO DE APPLICATIONS
// ===============================

/**
 * GET /admin/applications
 * Listagem de candidaturas
 */
router.get('/applications', requireAuth, requireAdminFeatures, adminController.showApplications);

/**
 * GET /admin/applications/view/:id
 * Visualizar candidatura específica
 */
router.get('/applications/view/:id', requireAuth, requireAdminFeatures, adminController.showApplicationDetail);

/**
 * POST /admin/applications/update/:id
 * Atualiza candidatura
 */
router.post('/applications/update/:id', requireAuth, requireAdminFeatures, adminController.updateApplication);

/**
 * POST /admin/applications/delete/:id
 * Deleta candidatura
 */
router.post('/applications/delete/:id', requireAuth, requireAdminFeatures, adminController.deleteApplication);

/**
 * GET /admin/applications/export/:id/pdf
 * Exporta candidatura para PDF
 */
router.get('/applications/export/:id/pdf', requireAuth, requireAdminFeatures, adminController.exportApplicationPDF);

// ===============================
// GERENCIAMENTO DE CONTACTS
// ===============================

/**
 * GET /admin/contacts
 * Listagem de mensagens de contato
 */
router.get('/contacts', requireAuth, requireAdminFeatures, adminController.showContacts);

/**
 * GET /admin/contacts/view/:id
 * Visualizar mensagem de contato específica
 */
router.get('/contacts/view/:id', requireAuth, requireAdminFeatures, adminController.showContactDetail);

/**
 * POST /admin/contacts/update/:id
 * Atualiza status da mensagem de contato
 */
router.post('/contacts/update/:id', requireAuth, requireAdminFeatures, adminController.updateContact);

/**
 * POST /admin/contacts/delete/:id
 * Deleta mensagem de contato
 */
router.post('/contacts/delete/:id', requireAuth, requireAdminFeatures, adminController.deleteContact);

// ===============================
// GERENCIAMENTO DE PERFIL
// ===============================

/**
 * GET /admin/profile
 * Página de edição do próprio perfil
 */
router.get('/profile', requireAuth, adminController.showProfile);

/**
 * POST /admin/profile
 * Atualiza próprio perfil
 */
router.post('/profile', requireAuth, adminController.updateProfile);

export default router;