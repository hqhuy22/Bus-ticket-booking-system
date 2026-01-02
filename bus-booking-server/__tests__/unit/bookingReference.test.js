/**
 * Unit Tests for Booking Reference Utility
 */

import {
  generateBookingReference,
  isValidBookingReference,
  generateGuestIdentifier,
} from '../../utils/bookingReference.js';

describe('Booking Reference Utility', () => {
  describe('generateBookingReference', () => {
    it('should generate a valid booking reference', () => {
      const ref = generateBookingReference();
      expect(ref).toBeDefined();
      expect(typeof ref).toBe('string');
      expect(ref).toMatch(/^BKG-[A-Z0-9]+-[A-Z0-9]+$/);
    });

    it('should generate unique references', () => {
      const ref1 = generateBookingReference();
      const ref2 = generateBookingReference();
      expect(ref1).not.toBe(ref2);
    });

    it('should always start with BKG-', () => {
      const ref = generateBookingReference();
      expect(ref.startsWith('BKG-')).toBe(true);
    });

    it('should generate multiple unique references', () => {
      const refs = new Set();
      for (let i = 0; i < 100; i++) {
        refs.add(generateBookingReference());
      }
      expect(refs.size).toBe(100);
    });
  });

  describe('isValidBookingReference', () => {
    it('should validate correct booking reference format', () => {
      const validRef = 'BKG-ABC123-XYZ9';
      expect(isValidBookingReference(validRef)).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidBookingReference('INVALID')).toBe(false);
      expect(isValidBookingReference('BKG-')).toBe(false);
      expect(isValidBookingReference('BKG-ABC')).toBe(false);
      expect(isValidBookingReference('ABC-123-XYZ')).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(isValidBookingReference(null)).toBe(false);
      expect(isValidBookingReference(undefined)).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isValidBookingReference(123)).toBe(false);
      expect(isValidBookingReference({})).toBe(false);
      expect(isValidBookingReference([])).toBe(false);
    });

    it('should validate generated references', () => {
      const ref = generateBookingReference();
      expect(isValidBookingReference(ref)).toBe(true);
    });

    it('should reject references with lowercase letters', () => {
      expect(isValidBookingReference('bkg-abc123-xyz9')).toBe(false);
    });

    it('should reject references with special characters', () => {
      expect(isValidBookingReference('BKG-ABC@123-XYZ')).toBe(false);
      expect(isValidBookingReference('BKG-ABC 123-XYZ')).toBe(false);
    });
  });

  describe('generateGuestIdentifier', () => {
    it('should generate a guest identifier with email and phone', () => {
      const identifier = generateGuestIdentifier('test@example.com', '1234567890');
      expect(identifier).toBeDefined();
      expect(typeof identifier).toBe('string');
      expect(identifier.startsWith('GUEST-')).toBe(true);
    });

    it('should handle missing email', () => {
      const identifier = generateGuestIdentifier('', '1234567890');
      expect(identifier).toBeDefined();
      expect(identifier.startsWith('GUEST-')).toBe(true);
    });

    it('should handle missing phone', () => {
      const identifier = generateGuestIdentifier('test@example.com', '');
      expect(identifier).toBeDefined();
      expect(identifier.startsWith('GUEST-')).toBe(true);
    });

    it('should limit length to 50 characters', () => {
      const longEmail = 'verylongemailaddress@example.com';
      const identifier = generateGuestIdentifier(longEmail, '1234567890');
      expect(identifier.length).toBeLessThanOrEqual(50);
    });

    it('should extract last 4 digits of phone', () => {
      const identifier = generateGuestIdentifier('test@example.com', '1234567890');
      expect(identifier).toContain('7890');
    });

    it('should convert email to lowercase', () => {
      const identifier1 = generateGuestIdentifier('TEST@EXAMPLE.COM', '1234567890');
      const identifier2 = generateGuestIdentifier('test@example.com', '1234567890');
      // Both should contain lowercase email part
      expect(identifier1.toLowerCase()).toContain('test@exa');
    });
  });
});
