/**
 * ERROR HANDLING MIDDLEWARE
 * Manages errors securely, preventing exposure of sensitive information
 */

import crypto from 'crypto';

/**
 * Sanitizes strings to prevent XSS and exposure of sensitive information
 * @param {string} str - String to be sanitized
 * @returns {string} - Sanitized string
 */
function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';

  // Remove special characters and keep only alphanumeric, hyphens, slashes and underscores
  return str
    .replace(/[<>'"]/g, '') // Remove dangerous characters for XSS
    .replace(/\.\./g, '') // Remove directory navigation
    .replace(/[^\w\s\-\/]/g, '') // Remove special characters except alphanumeric, spaces, hyphens and slashes
    .substring(0, 200); // Limit size
}

/**
 * Generates a unique ID for error tracking
 * @returns {string} - Unique ID
 */
function generateErrorId() {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Determines if the request expects JSON or HTML
 * @param {object} req - Express request object
 * @returns {boolean} - true if expects JSON
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
 * Middleware to handle 404 errors (Route not found)
 */
export function handle404(req, res, _next) {
  const errorId = generateErrorId();
  const sanitizedPath = sanitizeString(req.path);
  const sanitizedMethod = sanitizeString(req.method);

  // Log error for audit (without sensitive information)
  console.log(`⚠️  404 Error [${errorId}]: ${sanitizedMethod} ${sanitizedPath}`);

  if (expectsJson(req)) {
    // JSON response for API requests
    return res.status(404).json({
      error: 'Resource not found',
      statusCode: 404,
      errorId: errorId,
      timestamp: new Date().toISOString()
    });
  }

  // HTML response for browsers
  return res.status(404).render('errors/404', {
    errorId: errorId,
    sanitizedPath: sanitizedPath
  });
}

/**
 * Middleware to handle 403 errors (Access denied)
 */
export function handle403(req, res) {
  const errorId = generateErrorId();
  const sanitizedPath = sanitizeString(req.path);

  console.log(`🔒 403 Error [${errorId}]: Access denied to ${sanitizedPath}`);

  if (expectsJson(req)) {
    return res.status(403).json({
      error: 'Access denied',
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
 * Middleware to handle 500 errors (Internal server error)
 */
export function handle500(err, req, res, _next) {
  const errorId = generateErrorId();
  const sanitizedPath = sanitizeString(req.path);

  // Complete error log on server (for debugging)
  console.error(`❌ 500 Error [${errorId}]:`, {
    path: sanitizedPath,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : 'hidden'
  });

  // In production, never expose error details
  const isProduction = process.env.NODE_ENV === 'production';

  if (expectsJson(req)) {
    return res.status(500).json({
      error: 'Internal server error',
      statusCode: 500,
      errorId: errorId,
      timestamp: new Date().toISOString(),
      // Only expose details in development
      details: !isProduction ? {
        message: err.message,
        type: err.name
      } : undefined
    });
  }

  return res.status(500).render('errors/500', {
    errorId: errorId,
    // Do not pass sensitive information to template
    errorMessage: !isProduction ? sanitizeString(err.message) : null
  });
}

/**
 * Security middleware to prevent stack trace exposure
 */
export function securityHeaders(_req, res, next) {
  // Remove header that exposes the technology used
  res.removeHeader('X-Powered-By');

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Basic Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com https://cdn.quilljs.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.quilljs.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self';"
  );

  next();
}

/**
 * Middleware to sanitize input parameters
 */
export function sanitizeInputs(req, _res, next) {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }

  // Sanitize route parameters
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
