/**
 * MIDDLEWARE DE AUTENTICAÇÃO
 * Protege rotas admin
 */

/**
 * Verifica se o usuário está autenticado
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
 * Verifica se o usuário já está logado
 * (usado na página de login para redirecionar se já estiver logado)
 */
export const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.isAuthenticated) {
    return res.redirect('/admin/dashboard');
  }
  next();
};