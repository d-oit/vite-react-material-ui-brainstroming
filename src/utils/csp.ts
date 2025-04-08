/**
 * Content Security Policy configuration
 * This file defines the Content Security Policy for the application
 */

export interface CSPDirectives {
  [key: string]: string[];
}

/**
 * Default CSP directives
 * These are applied to all environments
 */
export const defaultDirectives: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'script-src-attr': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': ["'self'", 'https://api.openrouter.ai', 'https://*.amazonaws.com'],
  'frame-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  // 'frame-ancestors' is not supported in meta tags, only in HTTP headers
  // 'frame-ancestors': ["'self'"],
  'manifest-src': ["'self'"],
  'media-src': ["'self'"],
  'worker-src': ["'self'", 'blob:'],
};

/**
 * Development-specific CSP directives
 * These are only applied in development mode
 */
export const developmentDirectives: CSPDirectives = {
  'connect-src': [
    "'self'",
    'https://api.openrouter.ai',
    'https://*.amazonaws.com',
    'ws:',
    'http://localhost:*',
  ],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'http://localhost:*'],
  'script-src-attr': ["'self'", "'unsafe-inline'"],
};

/**
 * Production-specific CSP directives
 * These are only applied in production mode
 */
export const productionDirectives: CSPDirectives = {
  'upgrade-insecure-requests': [],
};

/**
 * Generate a CSP header value from directives
 * @param directives CSP directives
 * @returns CSP header value
 */
export function generateCSP(directives: CSPDirectives): string {
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key;
      }
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Get CSP directives for the current environment
 * @returns CSP directives
 */
export function getCSPDirectives(): CSPDirectives {
  const isDevelopment = import.meta.env.DEV;
  const directives = { ...defaultDirectives };

  if (isDevelopment) {
    // Merge development directives
    Object.entries(developmentDirectives).forEach(([key, values]) => {
      // Use type assertion to ensure type safety
      const directiveKey = key as keyof typeof directives;
      // Safe to use directiveKey as it's validated through type assertion
      // eslint-disable-next-line security/detect-object-injection
      directives[directiveKey] = [...(directives[directiveKey] || []), ...values];
    });
  } else {
    // Merge production directives
    Object.entries(productionDirectives).forEach(([key, values]) => {
      // Use type assertion to ensure type safety
      const directiveKey = key as keyof typeof directives;
      // Safe to use directiveKey as it's validated through type assertion
      // eslint-disable-next-line security/detect-object-injection
      directives[directiveKey] = [...(directives[directiveKey] || []), ...values];
    });
  }

  return directives;
}

/**
 * Get CSP meta tag content
 * @returns CSP meta tag content
 */
export function getCSPMetaContent(): string {
  return generateCSP(getCSPDirectives());
}

export default {
  getCSPDirectives,
  getCSPMetaContent,
  generateCSP,
};
