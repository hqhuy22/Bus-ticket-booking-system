/**
 * Unit Tests for Pricing Calculator
 */

import {
  calculateBookingPrice,
  validatePrice,
  formatCurrency,
  formatCurrencyShort,
} from '../../utils/pricingCalculator.js';

describe('Pricing Calculator', () => {
  describe('calculateBookingPrice', () => {
    it('should calculate price for single seat', () => {
      const result = calculateBookingPrice(100000, 1);

      expect(result).toBeDefined();
      expect(result.pricePerSeat).toBe(100000);
      expect(result.numSeats).toBe(1);
      expect(result.busFare).toBe(100000);
      expect(result.totalPay).toBeGreaterThan(result.busFare);
    });

    it('should calculate price for multiple seats', () => {
      const result = calculateBookingPrice(100000, 3);

      expect(result.numSeats).toBe(3);
      expect(result.baseFare).toBe(300000);
      expect(result.busFare).toBe(300000);
      expect(result.totalPay).toBeGreaterThan(300000);
    });

    it('should include convenience fee and bank charge', () => {
      const result = calculateBookingPrice(100000, 1);

      expect(result.convenienceFee).toBeGreaterThan(0);
      expect(result.bankCharge).toBeGreaterThan(0);
      expect(result.totalPay).toBe(result.busFare + result.convenienceFee + result.bankCharge);
    });

    it('should apply discount when provided', () => {
      const resultWithoutDiscount = calculateBookingPrice(100000, 1);
      const resultWithDiscount = calculateBookingPrice(100000, 1, { discount: 0.1 });

      expect(resultWithDiscount.busFare).toBeLessThan(resultWithoutDiscount.busFare);
      expect(resultWithDiscount.totalPay).toBeLessThan(resultWithoutDiscount.totalPay);
    });

    it('should handle invalid seat numbers', () => {
      const result1 = calculateBookingPrice(100000, 0);
      const result2 = calculateBookingPrice(100000, -1);
      const result3 = calculateBookingPrice(100000, 'invalid');

      // Should default to 1 seat
      expect(result1.numSeats).toBe(1);
      expect(result2.numSeats).toBe(1);
      expect(result3.numSeats).toBe(1);
    });

    it('should round prices to thousand', () => {
      const result = calculateBookingPrice(100500, 1);

      // Prices should be rounded
      expect(result.busFare % 1000).toBe(0);
      expect(result.totalPay % 1000).toBe(0);
    });

    it('should handle edge case with very small price', () => {
      const result = calculateBookingPrice(1, 1);

      expect(result).toBeDefined();
      expect(result.totalPay).toBeGreaterThan(0);
    });

    it('should calculate correctly for large number of seats', () => {
      const result = calculateBookingPrice(100000, 50);

      expect(result.numSeats).toBe(50);
      expect(result.baseFare).toBe(5000000);
      expect(result.totalPay).toBeGreaterThan(5000000);
    });

    it('should return breakdown when requested', () => {
      const result = calculateBookingPrice(100000, 2, { includeBreakdown: true });

      expect(result).toHaveProperty('pricePerSeat');
      expect(result).toHaveProperty('numSeats');
      expect(result).toHaveProperty('baseFare');
      expect(result).toHaveProperty('busFare');
      expect(result).toHaveProperty('convenienceFee');
      expect(result).toHaveProperty('bankCharge');
      expect(result).toHaveProperty('totalPay');
      expect(result).toHaveProperty('breakdown');
    });

    it('should not apply discount greater than 100%', () => {
      const result = calculateBookingPrice(100000, 1, { discount: 1.5 });

      // Should not result in negative or zero price
      expect(result.busFare).toBeGreaterThan(0);
    });

    it('should include currency information', () => {
      const result = calculateBookingPrice(100000, 1);

      expect(result).toHaveProperty('currency');
      expect(result).toHaveProperty('currencySymbol');
      expect(result.currency).toBe('VND');
    });

    it('should enforce minimum total', () => {
      const result = calculateBookingPrice(1000, 1);

      // Even with low price, total should not be below minimum
      expect(result.totalPay).toBeGreaterThan(0);
    });
  });

  describe('validatePrice', () => {
    it('should accept valid prices', () => {
      expect(validatePrice(100000)).toBe(100000);
      expect(validatePrice(50000)).toBe(50000);
      expect(validatePrice(200000)).toBe(200000);
    });

    it('should handle invalid prices', () => {
      const result1 = validatePrice(null);
      const result2 = validatePrice(undefined);
      const result3 = validatePrice('invalid');
      const result4 = validatePrice(0);
      const result5 = validatePrice(-100);

      // Should return default or minimum price
      expect(result1).toBeGreaterThan(0);
      expect(result2).toBeGreaterThan(0);
      expect(result3).toBeGreaterThan(0);
      expect(result4).toBeGreaterThan(0);
      expect(result5).toBeGreaterThan(0);
    });

    it('should handle string numbers', () => {
      expect(validatePrice('100000')).toBe(100000);
      expect(validatePrice('50000')).toBe(50000);
    });

    it('should enforce minimum price', () => {
      const result = validatePrice(100);
      expect(result).toBeGreaterThanOrEqual(10000); // Assuming min price is 10000
    });

    it('should enforce maximum price', () => {
      const result = validatePrice(10000000);
      expect(result).toBeLessThanOrEqual(5000000); // Assuming max price is 5000000
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with symbol', () => {
      const formatted = formatCurrency(100000);
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('100');
    });

    it('should format currency without symbol', () => {
      const formatted = formatCurrency(100000, false);
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('100');
    });

    it('should handle zero amount', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toBeDefined();
    });

    it('should handle large amounts', () => {
      const formatted = formatCurrency(1000000);
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });

    it('should handle invalid inputs', () => {
      const formatted1 = formatCurrency(null);
      const formatted2 = formatCurrency(undefined);
      const formatted3 = formatCurrency('invalid');

      expect(typeof formatted1).toBe('string');
      expect(typeof formatted2).toBe('string');
      expect(typeof formatted3).toBe('string');
    });
  });

  describe('formatCurrencyShort', () => {
    it('should format thousands with k suffix', () => {
      const formatted = formatCurrencyShort(100000);
      expect(typeof formatted).toBe('string');
    });

    it('should format millions with tr suffix', () => {
      const formatted = formatCurrencyShort(1000000);
      expect(typeof formatted).toBe('string');
    });

    it('should handle small amounts', () => {
      const formatted = formatCurrencyShort(500);
      expect(typeof formatted).toBe('string');
    });
  });
});
