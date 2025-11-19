/**
 * CONFIGURAÇÕES DE SEGURANÇA
 * Configurações centralizadas para melhorar a segurança do sistema
 */

export const SECURITY_CONFIG = {
  // Validação de senhas
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
    REQUIRE_NUMBERS: false,
    REQUIRE_SYMBOLS: false,
    REQUIRE_UPPERCASE: false
  },

  // Validação de email
  EMAIL: {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 254
  },

  // Validação de nomes
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    FORBIDDEN_CHARS: /[<>\"'&]/g // Caracteres que serão removidos
  },

  // Rate limiting
  RATE_LIMIT: {
    MAX_LOGIN_ATTEMPTS: 3,
    BLOCK_DURATION_MS: 2 * 60 * 1000, // 2 minutos
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000 // 5 minutos
  },

  // Roles válidos
  ROLES: {
    VALID_ROLES: ['user', 'admin', 'superuser'],
    DEFAULT_ROLE: 'user'
  },

  // Sessão
  SESSION: {
    MAX_AGE: 24 * 60 * 60 * 1000, // 24 horas
    REQUIRED_FIELDS: ['id', 'email', 'role', 'name']
  }
};

/**
 * Valida formato de email
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  if (email.length > SECURITY_CONFIG.EMAIL.MAX_LENGTH) return false;
  return SECURITY_CONFIG.EMAIL.REGEX.test(email);
};

/**
 * Sanitiza nome removendo caracteres perigosos
 */
export const sanitizeName = (name) => {
  if (!name || typeof name !== 'string') return '';
  const sanitized = name.trim().replace(SECURITY_CONFIG.NAME.FORBIDDEN_CHARS, '');
  return sanitized;
};

/**
 * Valida nome
 */
export const validateName = (name) => {
  const sanitized = sanitizeName(name);
  return sanitized.length >= SECURITY_CONFIG.NAME.MIN_LENGTH &&
         sanitized.length <= SECURITY_CONFIG.NAME.MAX_LENGTH;
};

/**
 * Valida senha
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= SECURITY_CONFIG.PASSWORD.MIN_LENGTH &&
         password.length <= SECURITY_CONFIG.PASSWORD.MAX_LENGTH;
};

/**
 * Valida se role é válido
 */
export const validateRole = (role) => {
  return SECURITY_CONFIG.ROLES.VALID_ROLES.includes(role);
};

/**
 * Valida integridade dos dados de sessão
 */
export const validateSessionData = (user) => {
  if (!user || typeof user !== 'object') return false;

  // Verificar campos obrigatórios
  for (const field of SECURITY_CONFIG.SESSION.REQUIRED_FIELDS) {
    if (!user[field]) return false;
  }

  // Validar role
  return validateRole(user.role);
};