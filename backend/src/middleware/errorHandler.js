/**
 * MIDDLEWARE DE TRATAMENTO DE ERROS
 * Gerencia erros de forma segura, evitando exposição de informações sensíveis
 */

import crypto from 'crypto';

/**
 * Sanitiza strings para evitar XSS e exposição de informações sensíveis
 * @param {string} str - String a ser sanitizada
 * @returns {string} - String sanitizada
 */
function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';

  // Remove caracteres especiais e mantém apenas alfanuméricos, hífens, barras e underscores
  return str
    .replace(/[<>'"]/g, '') // Remove caracteres perigosos para XSS
    .replace(/\.\./g, '') // Remove navegação de diretório
    .replace(/[^\w\s\-\/]/g, '') // Remove caracteres especiais exceto alfanuméricos, espaços, hífens e barras
    .substring(0, 200); // Limita tamanho
}

/**
 * Gera um ID único para rastreamento de erros
 * @returns {string} - ID único
 */
function generateErrorId() {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Determina se a requisição espera JSON ou HTML
 * @param {object} req - Objeto de requisição Express
 * @returns {boolean} - true se espera JSON
 */
function expectsJson(req) {
  const acceptHeader = req.get('accept') || '';
  return (
    req.xhr ||
    acceptHeader.includes('application/json') ||
    req.path.startsWith('/api/')
  );
}

/**
 * Middleware para tratar erros 404 (Rota não encontrada)
 */
export function handle404(req, res, _next) {
  const errorId = generateErrorId();
  const sanitizedPath = sanitizeString(req.path);
  const sanitizedMethod = sanitizeString(req.method);

  // Log do erro para auditoria (sem informações sensíveis)
  console.log(`⚠️  404 Error [${errorId}]: ${sanitizedMethod} ${sanitizedPath}`);

  if (expectsJson(req)) {
    // Resposta JSON para requisições API
    return res.status(404).json({
      error: 'Recurso não encontrado',
      statusCode: 404,
      errorId: errorId,
      timestamp: new Date().toISOString()
    });
  }

  // Resposta HTML para navegadores
  return res.status(404).render('errors/404', {
    errorId: errorId,
    sanitizedPath: sanitizedPath
  });
}

/**
 * Middleware para tratar erros 403 (Acesso negado)
 */
export function handle403(req, res) {
  const errorId = generateErrorId();
  const sanitizedPath = sanitizeString(req.path);

  console.log(`🔒 403 Error [${errorId}]: Access denied to ${sanitizedPath}`);

  if (expectsJson(req)) {
    return res.status(403).json({
      error: 'Acesso negado',
      statusCode: 403,
      errorId: errorId,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(403).render('errors/403', {
    errorId: errorId
  });
}

/**
 * Middleware para tratar erros 500 (Erro interno do servidor)
 */
export function handle500(err, req, res, _next) {
  const errorId = generateErrorId();
  const sanitizedPath = sanitizeString(req.path);

  // Log completo do erro no servidor (para debugging)
  console.error(`❌ 500 Error [${errorId}]:`, {
    path: sanitizedPath,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : 'hidden'
  });

  // Em produção, nunca expor detalhes do erro
  const isProduction = process.env.NODE_ENV === 'production';

  if (expectsJson(req)) {
    return res.status(500).json({
      error: 'Erro interno do servidor',
      statusCode: 500,
      errorId: errorId,
      timestamp: new Date().toISOString(),
      // Só expor detalhes em desenvolvimento
      details: !isProduction ? {
        message: err.message,
        type: err.name
      } : undefined
    });
  }

  return res.status(500).render('errors/500', {
    errorId: errorId,
    // Não passar informações sensíveis para o template
    errorMessage: !isProduction ? sanitizeString(err.message) : null
  });
}

/**
 * Middleware de segurança para prevenir exposição de stack traces
 */
export function securityHeaders(_req, res, next) {
  // Remove header que expõe a tecnologia usada
  res.removeHeader('X-Powered-By');

  // Headers de segurança
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy básico
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self';"
  );

  next();
}

/**
 * Middleware para sanitizar parâmetros de entrada
 */
export function sanitizeInputs(req, _res, next) {
  // Sanitizar query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }

  // Sanitizar parâmetros de rota
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeString(req.params[key]);
      }
    });
  }

  next();
}

export default {
  handle404,
  handle403,
  handle500,
  securityHeaders,
  sanitizeInputs
};
