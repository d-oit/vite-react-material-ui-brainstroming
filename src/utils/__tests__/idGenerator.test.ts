import { generateUniqueId, isValidId } from '../idGenerator';

describe('idGenerator', () => {
  describe('generateUniqueId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs in the correct format', () => {
      const id = generateUniqueId();
      expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    });
  });

  describe('isValidId', () => {
    it('should validate correct IDs', () => {
      expect(isValidId('abc123-xyz789')).toBe(true);
      expect(isValidId('1234-5678')).toBe(true);
    });

    it('should reject invalid IDs', () => {
      expect(isValidId('invalid')).toBe(false);
      expect(isValidId('abc-123-xyz')).toBe(false);
      expect(isValidId('')).toBe(false);
      expect(isValidId('ABC-123')).toBe(false);
    });
  });
});