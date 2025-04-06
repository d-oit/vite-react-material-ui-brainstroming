/**
 * URL validation and sanitization utilities
 * Provides comprehensive validation and sanitization for URLs
 * to prevent security issues and ensure proper configuration
 */

/**
 * Check if a string is a valid URL
 * @param url URL string to validate
 * @param requireProtocol Whether to require a protocol (default: true)
 * @returns True if valid URL, false otherwise
 */
export function isValidUrl(url: string, requireProtocol = true): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // If we don't require a protocol, add a dummy one for validation
  // but only if the URL doesn't already have one
  let urlToCheck = url;
  if (!requireProtocol && !url.includes('://')) {
    urlToCheck = `http://${url}`;
  }

  try {
    // Use the URL constructor to validate
    new URL(urlToCheck);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Check if a URL uses HTTPS scheme
 * @param url URL string to check
 * @returns True if HTTPS, false otherwise
 */
export function isHttpsUrl(url: string): boolean {
  if (!isValidUrl(url)) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

/**
 * Sanitize a URL to prevent injection attacks
 * @param url URL string to sanitize
 * @param allowedProtocols Array of allowed protocols (default: ['http:', 'https:'])
 * @param defaultUrl Default URL to return if sanitization fails (default: '')
 * @returns Sanitized URL or defaultUrl if invalid
 */
export function sanitizeUrl(
  url: string,
  allowedProtocols = ['http:', 'https:'],
  defaultUrl = ''
): string {
  if (!url || typeof url !== 'string') {
    return defaultUrl;
  }

  // For relative URLs that start with /, return as is (they're safe for same-origin navigation)
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }

  try {
    const parsedUrl = new URL(url, window.location.origin);

    // Check if protocol is allowed
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return defaultUrl;
    }

    // Remove any dangerous parts
    // 1. Remove username/password if present
    parsedUrl.username = '';
    parsedUrl.password = '';

    // 2. Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /\\\\/, // Double backslashes
      /\.\.\//, // Directory traversal
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        return defaultUrl;
      }
    }

    // Reconstruct the URL from its parts to avoid any injection
    return parsedUrl.toString();
  } catch (_) {
    return defaultUrl;
  }
}

/**
 * Validate an API endpoint URL
 * @param url URL string to validate
 * @param requireHttps Whether to require HTTPS (default: true)
 * @returns Object with validation result and error message
 */
export function validateApiEndpoint(
  url: string,
  requireHttps = true
): { isValid: boolean; message: string } {
  if (!url || url.trim() === '') {
    return { isValid: false, message: 'URL is required' };
  }

  if (!isValidUrl(url)) {
    return { isValid: false, message: 'Invalid URL format' };
  }

  if (requireHttps && !isHttpsUrl(url)) {
    return { isValid: false, message: 'URL must use HTTPS for security' };
  }

  try {
    // Additional validation for API endpoints
    const parsedUrl = new URL(url);

    // Check for suspicious patterns in the URL
    const suspiciousPatterns = [
      /\.\./, // Directory traversal
      /^data:/i, // Data URLs
      /^javascript:/i, // JavaScript URLs
      /^vbscript:/i, // VBScript URLs
      /^file:/i, // File URLs
      /^ftp:/i, // FTP URLs (not suitable for API endpoints)
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        return { isValid: false, message: 'URL contains suspicious patterns' };
      }
    }

    // Check if URL has a valid path (not just a domain)
    if (!parsedUrl.pathname || parsedUrl.pathname === '/') {
      return {
        isValid: true,
        message: 'Warning: URL should include a specific API path',
      };
    }

    return { isValid: true, message: '' };
  } catch (error) {
    return {
      isValid: false,
      message: `Invalid URL: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Validate an S3 endpoint URL
 * @param url URL string to validate
 * @param allowHttp Whether to allow HTTP for local development (default: true)
 * @returns Object with validation result and error message
 */
export function validateS3Endpoint(
  url: string,
  allowHttp = true
): { isValid: boolean; message: string } {
  if (!url || url.trim() === '') {
    return { isValid: true, message: '' }; // S3 is optional, so empty is valid
  }

  if (!isValidUrl(url)) {
    return { isValid: false, message: 'Invalid S3 endpoint URL format' };
  }

  try {
    const parsedUrl = new URL(url);

    // S3 endpoints might use HTTP in some cases (like local testing)
    // but we'll recommend HTTPS
    if (!isHttpsUrl(url)) {
      // For production, we might want to require HTTPS
      if (!allowHttp) {
        return { isValid: false, message: 'S3 endpoint must use HTTPS in production' };
      }

      // For development, we'll allow HTTP but warn
      return {
        isValid: true,
        message: 'Warning: Consider using HTTPS for better security',
      };
    }

    // Check if the URL looks like a valid S3 endpoint
    // This is a basic check - S3 endpoints typically have s3 in the hostname
    // or follow the pattern s3.region.amazonaws.com or similar
    const isLikelyS3Endpoint =
      parsedUrl.hostname.includes('s3') ||
      parsedUrl.hostname.includes('amazonaws.com') ||
      parsedUrl.hostname.includes('minio') || // Common S3-compatible server
      parsedUrl.hostname === 'localhost' || // Local development
      parsedUrl.hostname.includes('127.0.0.1'); // Local development

    if (!isLikelyS3Endpoint) {
      return {
        isValid: true,
        message: 'Warning: URL does not appear to be a standard S3 endpoint',
      };
    }

    return { isValid: true, message: '' };
  } catch (error) {
    return {
      isValid: false,
      message: `Invalid S3 endpoint: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Validate a URL for notification or navigation purposes
 * @param url URL string to validate
 * @param allowRelative Whether to allow relative URLs (default: true)
 * @returns Object with validation result and error message
 */
export function validateNavigationUrl(
  url: string,
  allowRelative = true
): { isValid: boolean; message: string } {
  if (!url || url.trim() === '') {
    return { isValid: false, message: 'URL is required' };
  }

  // For relative URLs, consider them valid if allowed
  if (allowRelative && url.startsWith('/') && !url.startsWith('//')) {
    return { isValid: true, message: '' };
  }

  if (!isValidUrl(url)) {
    return { isValid: false, message: 'Invalid URL format' };
  }

  try {
    const parsedUrl = new URL(url, window.location.origin);

    // Only allow http: and https: protocols
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return { isValid: false, message: 'URL must use HTTP or HTTPS protocol' };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.\./, // Directory traversal
      /^data:/i, // Data URLs
      /^javascript:/i, // JavaScript URLs
      /^vbscript:/i, // VBScript URLs
      /^file:/i, // File URLs
      /^blob:/i, // Blob URLs (potentially unsafe for navigation)
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        return { isValid: false, message: 'URL contains suspicious patterns' };
      }
    }

    // Check for open redirects - if the URL is external, warn about it
    if (parsedUrl.origin !== window.location.origin) {
      return {
        isValid: true,
        message: 'Warning: This is an external URL. Make sure it is trusted.',
      };
    }

    return { isValid: true, message: '' };
  } catch (error) {
    return {
      isValid: false,
      message: `Invalid URL: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Validate a URL for service worker notifications
 * This is more strict than regular navigation URLs
 * @param url URL string to validate
 * @returns Object with validation result and error message
 */
export function validateNotificationUrl(url: string): { isValid: boolean; message: string } {
  // First apply standard navigation URL validation
  const navResult = validateNavigationUrl(url, true);

  if (!navResult.isValid) {
    return navResult;
  }

  try {
    const parsedUrl = new URL(url, window.location.origin);

    // For notifications, we should be extra careful about external URLs
    // as they could be used for phishing
    if (parsedUrl.origin !== window.location.origin) {
      return {
        isValid: false,
        message: 'Notification URLs must be from the same origin for security',
      };
    }

    return { isValid: true, message: '' };
  } catch (error) {
    return {
      isValid: false,
      message: `Invalid notification URL: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Check if a URL is from the same origin as the current page
 * @param url URL to check
 * @returns True if same origin, false otherwise
 */
export function isSameOrigin(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Relative URLs are always same origin
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }

  try {
    const parsedUrl = new URL(url, window.location.origin);
    return parsedUrl.origin === window.location.origin;
  } catch (_) {
    return false;
  }
}
