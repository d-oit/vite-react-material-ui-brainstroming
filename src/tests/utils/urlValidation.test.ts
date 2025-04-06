import { describe, it, expect } from 'vitest';

import {
  isValidUrl,
  isHttpsUrl,
  sanitizeUrl,
  validateApiEndpoint,
  validateS3Endpoint,
} from '../../utils/urlValidation';

describe('URL Validation Utils', () => {
  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://api.openrouter.ai/api/v1')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false); // Missing protocol
      expect(isValidUrl('javascript:alert(1)')).toBe(true); // Valid URL but unsafe
    });
  });

  describe('isHttpsUrl', () => {
    it('should return true for HTTPS URLs', () => {
      expect(isHttpsUrl('https://example.com')).toBe(true);
      expect(isHttpsUrl('https://api.openrouter.ai/api/v1')).toBe(true);
    });

    it('should return false for non-HTTPS URLs', () => {
      expect(isHttpsUrl('http://example.com')).toBe(false);
      expect(isHttpsUrl('ftp://example.com')).toBe(false);
      expect(isHttpsUrl('javascript:alert(1)')).toBe(false);
      expect(isHttpsUrl('')).toBe(false);
      expect(isHttpsUrl('not a url')).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    it('should return sanitized URLs for valid inputs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
      expect(sanitizeUrl('http://localhost:3000/api')).toBe('http://localhost:3000/api');
    });

    it('should return empty string for invalid or dangerous URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
      expect(sanitizeUrl('file:///etc/passwd')).toBe('');
      expect(sanitizeUrl('')).toBe('');
      expect(sanitizeUrl('not a url')).toBe('');
    });
  });

  describe('validateApiEndpoint', () => {
    it('should validate correct API endpoints', () => {
      const result = validateApiEndpoint('https://api.openrouter.ai/api/v1');
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('');
    });

    it('should reject non-HTTPS API endpoints', () => {
      const result = validateApiEndpoint('http://api.example.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('HTTPS');
    });

    it('should reject invalid URLs', () => {
      const result = validateApiEndpoint('not a url');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Invalid URL');
    });

    it('should reject empty URLs', () => {
      const result = validateApiEndpoint('');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('required');
    });
  });

  describe('validateS3Endpoint', () => {
    it('should validate correct S3 endpoints', () => {
      const result = validateS3Endpoint('https://s3.amazonaws.com');
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('');
    });

    it('should allow empty S3 endpoints (since S3 is optional)', () => {
      const result = validateS3Endpoint('');
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('');
    });

    it('should warn but not reject HTTP S3 endpoints', () => {
      const result = validateS3Endpoint('http://localhost:9000');
      expect(result.isValid).toBe(true);
      expect(result.message).toContain('Warning');
    });

    it('should reject invalid URLs', () => {
      const result = validateS3Endpoint('not a url');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Invalid');
    });
  });
});
