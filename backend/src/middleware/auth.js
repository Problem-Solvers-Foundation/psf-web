/**
 * MIDDLEWARE DE AUTENTICAÇÃO
 * Protege rotas admin com sistema de hierarquia
 */

import { requireAdminAccess } from './rolePermissions.js';

/**
 * Verifica se o usuário está autenticado (para rotas básicas)
 */
export const requireAuth = (req, res, next) => {
  // Verificar se existe sessão
  if (req.session && req.session.isAuthenticated) {
    return next();
  }

  // Redirecionar para login
  res.redirect('/admin/login');
};

/**
 * Verifica se o usuário pode acessar painel admin
 * (substitui requireAuth em rotas admin - verifica role também)
 */
export const requireAdminAuth = (req, res, next) => {
  // First check if authenticated
  if (!req.session || !req.session.isAuthenticated) {
    return res.redirect('/admin/login');
  }

  // Then check admin access (role-based)
  return requireAdminAccess(req, res, next);
};

/**
 * Verifica se o usuário já está logado
 * (usado na página de login para redirecionar se já estiver logado)
 */
export const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.isAuthenticated) {
    return res.redirect('/admin/dashboard');
  }
  next();
};