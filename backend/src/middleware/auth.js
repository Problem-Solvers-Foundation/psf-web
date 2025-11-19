/**
 * MIDDLEWARE DE AUTENTICAÇÃO
 * Protege rotas admin com sistema de hierarquia
 */

import { requireAdminAccess } from './rolePermissions.js';

/**
 * SEGURANÇA: Valida integridade da sessão
 * Verifica se dados essenciais estão presentes e válidos
 */
export const validateSession = (req, res, next) => {
  if (req.session && req.session.isAuthenticated) {
    // Verificar se user object existe e tem campos obrigatórios
    const user = req.session.user;

    if (!user || !user.id || !user.email || !user.role) {
      console.warn(`[SECURITY] Invalid session data for IP: ${req.ip}`);
      req.session.destroy();
      return res.redirect('/signin');
    }

    // Verificar se role é válido
    const validRoles = ['user', 'admin', 'superuser'];
    if (!validRoles.includes(user.role)) {
      console.warn(`[SECURITY] Invalid role "${user.role}" for user ${user.email}`);
      req.session.destroy();
      return res.redirect('/signin');
    }
  }

  next();
};

/**
 * Verifica se o usuário está autenticado (para rotas básicas)
 */
export const requireAuth = (req, res, next) => {
  // SEGURANÇA: Primeiro validar integridade da sessão
  validateSession(req, res, () => {
    // Verificar se existe sessão
    if (req.session && req.session.isAuthenticated) {
      return next();
    }

    // Redirecionar para login
    res.redirect('/signin');
  });
};

/**
 * Verifica se o usuário pode acessar painel admin
 * (substitui requireAuth em rotas admin - verifica role também)
 */
export const requireAdminAuth = (req, res, next) => {
  // First check if authenticated
  if (!req.session || !req.session.isAuthenticated) {
    return res.redirect('/signin');
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
    // SEGURANÇA: Redirecionar baseado no role do usuário
    const userRole = req.session.user?.role;

    if (userRole === 'user') {
      return res.redirect('/admin/community-dashboard');
    } else if (userRole === 'admin' || userRole === 'superuser') {
      return res.redirect('/admin/dashboard');
    } else {
      // Role inválido - força logout por segurança
      req.session.destroy();
      return res.redirect('/signin');
    }
  }
  next();
};