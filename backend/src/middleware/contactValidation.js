/**
 * CONTACT FORM VALIDATION MIDDLEWARE
 * Validates and sanitizes contact form submissions to prevent malicious input
 */

import validator from 'validator';

/**
 * Validates contact form submission
 * Prevents XSS, SQL injection, and other malicious inputs
 */
export function validateContactForm(req, res, next) {
  const { name, email, message } = req.body;
  const errors = [];

  // Validate name
  if (!name || typeof name !== 'string') {
    errors.push('Name is required');
  } else {
    const sanitizedName = validator.trim(name);

    if (validator.isEmpty(sanitizedName)) {
      errors.push('Name cannot be empty');
    } else if (!validator.isLength(sanitizedName, { min: 2, max: 100 })) {
      errors.push('Name must be between 2 and 100 characters');
    } else if (!validator.matches(sanitizedName, /^[a-zA-Z\s\u00C0-\u024F\u1E00-\u1EFF'-]+$/)) {
      errors.push('Name contains invalid characters');
    } else {
      // Sanitize and store
      req.body.name = validator.escape(sanitizedName);
    }
  }

  // Validate email
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else {
    const sanitizedEmail = validator.trim(email).toLowerCase();

    if (validator.isEmpty(sanitizedEmail)) {
      errors.push('Email cannot be empty');
    } else if (!validator.isEmail(sanitizedEmail)) {
      errors.push('Invalid email format');
    } else if (!validator.isLength(sanitizedEmail, { max: 254 })) {
      errors.push('Email is too long');
    } else {
      // Additional email security checks
      const emailParts = sanitizedEmail.split('@');
      if (emailParts.length !== 2) {
        errors.push('Invalid email format');
      } else if (emailParts[0].length > 64) {
        errors.push('Email local part is too long');
      } else {
        // Sanitize and store
        req.body.email = validator.normalizeEmail(sanitizedEmail, {
          all_lowercase: true,
          gmail_remove_dots: false
        });
      }
    }
  }

  // Validate message
  if (!message || typeof message !== 'string') {
    errors.push('Message is required');
  } else {
    const sanitizedMessage = validator.trim(message);

    if (validator.isEmpty(sanitizedMessage)) {
      errors.push('Message cannot be empty');
    } else if (!validator.isLength(sanitizedMessage, { min: 10, max: 5000 })) {
      errors.push('Message must be between 10 and 5000 characters');
    } else {
      // Check for suspicious patterns (multiple validation layers)
      const suspiciousPatterns = [
        /<script[^>]*>[\s\S]*?<\/script>/gi, // Script tags
        /javascript:/gi, // JavaScript protocol
        /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc.)
        /<iframe/gi, // Iframes
        /data:text\/html/gi, // Data URIs
        /vbscript:/gi, // VBScript
      ];

      let hasSuspiciousContent = false;
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(sanitizedMessage)) {
          hasSuspiciousContent = true;
          break;
        }
      }

      if (hasSuspiciousContent) {
        errors.push('Message contains potentially malicious content');
      } else {
        // Sanitize and store (escape HTML but preserve line breaks)
        req.body.message = validator.escape(sanitizedMessage);
      }
    }
  }

  // Check for honeypot field (bot detection)
  if (req.body.website) {
    errors.push('Bot detected');
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors: errors,
      message: 'Validation failed'
    });
  }

  // Validation passed, proceed to next middleware
  next();
}

/**
 * Rate limiting check for contact form
 * Prevents spam by limiting submissions per IP
 */
const submissionTracker = new Map();

export function rateLimitContact(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const timeWindow = 60 * 1000; // 1 minute
  const maxSubmissions = 3; // Max 3 submissions per minute

  // Get submission history for this IP
  const submissions = submissionTracker.get(ip) || [];

  // Remove old submissions outside time window
  const recentSubmissions = submissions.filter(time => now - time < timeWindow);

  // Check if rate limit exceeded
  if (recentSubmissions.length >= maxSubmissions) {
    return res.status(429).json({
      success: false,
      message: 'Too many submissions. Please try again later.',
      retryAfter: Math.ceil((recentSubmissions[0] + timeWindow - now) / 1000)
    });
  }

  // Add current submission
  recentSubmissions.push(now);
  submissionTracker.set(ip, recentSubmissions);

  // Clean up old entries periodically
  if (submissionTracker.size > 1000) {
    cleanupTracker();
  }

  next();
}

/**
 * Clean up old entries from submission tracker
 */
function cleanupTracker() {
  const now = Date.now();
  const timeWindow = 60 * 1000;

  for (const [ip, submissions] of submissionTracker.entries()) {
    const recentSubmissions = submissions.filter(time => now - time < timeWindow);
    if (recentSubmissions.length === 0) {
      submissionTracker.delete(ip);
    } else {
      submissionTracker.set(ip, recentSubmissions);
    }
  }
}

export default {
  validateContactForm,
  rateLimitContact
};
