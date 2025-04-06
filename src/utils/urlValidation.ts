/**
 * URL validation and sanitization utilities
 */

/**
 * Check if a string is a valid URL
 * @param url URL string to validate
 * @returns True if valid URL, false otherwise
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    // Use the URL constructor to validate
    new URL(url);
    return true;
  } catch (_error) {
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
  } catch (_error) {
    return false;
  }
}

/**
 * Sanitize a URL to prevent injection attacks
 * @param url URL string to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!isValidUrl(url)) {
    return '';
  }

  try {
    const parsedUrl = new URL(url);

    // Only allow http: and https: protocols
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return '';
    }

    // Reconstruct the URL from its parts to avoid any injection
    return parsedUrl.toString();
  } catch (_error) {
    return '';
  }
}

/**
 * Validate an API endpoint URL
 * @param url URL string to validate
 * @returns Object with validation result and error message
 */
export function validateApiEndpoint(url: string): { isValid: boolean; message: string } {
  if (!url || url.trim() === '') {
    return { isValid: false, message: 'URL is required' };
  }

  if (!isValidUrl(url)) {
    return { isValid: false, message: 'Invalid URL format' };
  }

  if (!isHttpsUrl(url)) {
    return { isValid: false, message: 'URL must use HTTPS for security' };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate an S3 endpoint URL
 * @param url URL string to validate
 * @returns Object with validation result and error message
 */
export function validateS3Endpoint(url: string): { isValid: boolean; message: string } {
  if (!url || url.trim() === '') {
    return { isValid: true, message: '' }; // S3 is optional, so empty is valid
  }

  if (!isValidUrl(url)) {
    return { isValid: false, message: 'Invalid S3 endpoint URL format' };
  }

  // S3 endpoints might use HTTP in some cases (like local testing)
  // but we'll recommend HTTPS
  if (!isHttpsUrl(url)) {
    return {
      isValid: true,
      message: 'Warning: Consider using HTTPS for better security',
    };
  }

  return { isValid: true, message: '' };
}
