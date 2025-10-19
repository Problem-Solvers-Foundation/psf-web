/**
 * MIDDLEWARE DE RATE LIMITING PARA LOGIN
 * Bloqueia tentativas excessivas de login por IP
 */

// Armazena tentativas de login por IP: { ip: { attempts: number, blockedUntil: Date } }
const loginAttempts = new Map();

// Configurações
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION_MS = 2 * 60 * 1000; // 2 minutos em milissegundos

/**
 * Limpa registros antigos periodicamente (a cada 5 minutos)
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of loginAttempts.entries()) {
    if (data.blockedUntil && data.blockedUntil < now) {
      loginAttempts.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Middleware que verifica se o IP está bloqueado
 * IMPORTANTE: Durante bloqueio, TODAS as requisições são rejeitadas
 */
export const checkLoginRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const attemptData = loginAttempts.get(ip);

  // Se não há dados de tentativas, permitir
  if (!attemptData) {
    return next();
  }

  // Se está bloqueado, verificar se ainda está no período de bloqueio
  if (attemptData.blockedUntil && attemptData.blockedUntil > now) {
    const remainingTime = Math.ceil((attemptData.blockedUntil - now) / 1000);
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;

    const timeMessage = minutes > 0
      ? `${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`
      : `${seconds} second${seconds !== 1 ? 's' : ''}`;

    // CRÍTICO: Retornar IMEDIATAMENTE sem chamar next()
    // Isso impede o controller de processar qualquer tentativa
    return res.render('admin/login', {
      error: `Too many login attempts. Please try again in ${timeMessage}.`,
      isBlocked: true,
      blockedUntil: attemptData.blockedUntil,
      remainingSeconds: remainingTime
    });
  }

  // Se o bloqueio expirou, limpar dados e permitir nova tentativa
  if (attemptData.blockedUntil && attemptData.blockedUntil <= now) {
    loginAttempts.delete(ip);
  }

  next();
};

/**
 * Registra uma tentativa de login falhada
 */
export const recordFailedLogin = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const attemptData = loginAttempts.get(ip) || { attempts: 0, blockedUntil: null };

  // Incrementar tentativas apenas se não estiver bloqueado
  if (!attemptData.blockedUntil || attemptData.blockedUntil <= now) {
    attemptData.attempts += 1;

    // Se atingiu o máximo de tentativas, bloquear
    if (attemptData.attempts >= MAX_ATTEMPTS) {
      attemptData.blockedUntil = now + BLOCK_DURATION_MS;
      // NÃO resetar attempts aqui - manter o contador para não permitir novas tentativas
    }

    loginAttempts.set(ip, attemptData);
  }

  const isBlocked = attemptData.blockedUntil && attemptData.blockedUntil > now;

  return {
    attempts: isBlocked ? MAX_ATTEMPTS : attemptData.attempts,
    isBlocked,
    remainingAttempts: isBlocked ? 0 : Math.max(0, MAX_ATTEMPTS - attemptData.attempts)
  };
};

/**
 * Limpa tentativas após login bem-sucedido
 */
export const clearLoginAttempts = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  loginAttempts.delete(ip);
};

/**
 * Retorna informações sobre tentativas para um IP
 */
export const getLoginAttemptInfo = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  const attemptData = loginAttempts.get(ip);
  const now = Date.now();

  if (!attemptData) {
    return {
      attempts: 0,
      isBlocked: false,
      remainingAttempts: MAX_ATTEMPTS
    };
  }

  const isBlocked = attemptData.blockedUntil && attemptData.blockedUntil > now;
  const remainingTime = isBlocked ? Math.ceil((attemptData.blockedUntil - now) / 1000) : 0;

  return {
    attempts: attemptData.attempts,
    isBlocked,
    remainingAttempts: MAX_ATTEMPTS - attemptData.attempts,
    blockedUntil: attemptData.blockedUntil,
    remainingSeconds: remainingTime
  };
};