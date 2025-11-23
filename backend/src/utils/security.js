/**
 * Security utilities for input validation and sanitization
 * Problem Solver Foundation Backend
 */

import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize text input to prevent XSS attacks
 */
export const sanitizeText = (input, maxLength = 500) => {
  if (!input || typeof input !== 'string') return '';

  // Remove potentially dangerous characters and limit length
  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  }).substring(0, maxLength);
};

/**
 * Sanitize HTML content (for rich text fields)
 */
export const sanitizeHtml = (input, maxLength = 2000) => {
  if (!input || typeof input !== 'string') return '';

  // Allow basic formatting but remove scripts and dangerous content
  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  }).substring(0, maxLength);
};

/**
 * Validate and sanitize email
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';

  const cleanEmail = email.toLowerCase().trim();
  return validator.isEmail(cleanEmail) ? cleanEmail : '';
};

/**
 * Validate and sanitize URLs with domain restrictions
 */
export const sanitizeUrl = (url, allowedDomains = []) => {
  if (!url || typeof url !== 'string') return '';

  const cleanUrl = url.trim();

  // Check if it's a valid URL
  if (!validator.isURL(cleanUrl, {
    protocols: ['http', 'https'],
    require_protocol: true
  })) {
    return '';
  }

  // If domain restrictions are specified, validate them
  if (allowedDomains.length > 0) {
    try {
      const urlObj = new URL(cleanUrl);
      const domain = urlObj.hostname.toLowerCase();

      const isAllowed = allowedDomains.some(allowedDomain =>
        domain === allowedDomain || domain.endsWith('.' + allowedDomain)
      );

      if (!isAllowed) {
        return '';
      }
    } catch (error) {
      return '';
    }
  }

  return cleanUrl;
};

/**
 * Validate LinkedIn URL
 */
export const validateLinkedInUrl = (url) => {
  return sanitizeUrl(url, ['linkedin.com']);
};

/**
 * Validate Twitter URL
 */
export const validateTwitterUrl = (url) => {
  return sanitizeUrl(url, ['twitter.com', 'x.com']);
};

/**
 * Validate Instagram URL
 */
export const validateInstagramUrl = (url) => {
  return sanitizeUrl(url, ['instagram.com']);
};

/**
 * Sanitize and validate array input (for comma-separated values)
 */
export const sanitizeArray = (input, maxItems = 10, maxItemLength = 100) => {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input.slice(0, maxItems).map(item =>
      sanitizeText(item, maxItemLength)
    ).filter(item => item.length > 0);
  }

  if (typeof input === 'string') {
    return input.split(',')
      .slice(0, maxItems)
      .map(item => sanitizeText(item, maxItemLength))
      .filter(item => item.length > 0);
  }

  return [];
};

/**
 * Validate date input
 */
export const sanitizeDate = (dateInput) => {
  if (!dateInput) return null;

  const date = new Date(dateInput);

  // Check if date is valid and reasonable (between 1900 and current year)
  if (isNaN(date.getTime())) return null;

  const currentYear = new Date().getFullYear();
  const inputYear = date.getFullYear();

  if (inputYear < 1900 || inputYear > currentYear) return null;

  return date;
};

/**
 * Rate limiting store (simple in-memory implementation)
 * In production, use Redis or similar
 */
const rateLimitStore = new Map();

/**
 * Check rate limit for profile updates
 */
export const checkProfileUpdateRateLimit = (userId) => {
  const key = `profile_update_${userId}`;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxAttempts = 5; // 5 updates per 5 minutes

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }

  const attempts = rateLimitStore.get(key);

  // Remove old attempts outside the window
  const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);

  if (validAttempts.length >= maxAttempts) {
    return {
      allowed: false,
      resetTime: Math.min(...validAttempts) + windowMs
    };
  }

  // Add current attempt
  validAttempts.push(now);
  rateLimitStore.set(key, validAttempts);

  return {
    allowed: true,
    remaining: maxAttempts - validAttempts.length
  };
};

/**
 * Clean up old rate limit entries (call periodically)
 */
export const cleanupRateLimitStore = () => {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;

  for (const [key, attempts] of rateLimitStore.entries()) {
    const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);

    if (validAttempts.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, validAttempts);
    }
  }
};

// Clean up every 10 minutes
setInterval(cleanupRateLimitStore, 10 * 60 * 1000);