/**
 * Pricing Configuration - Client Side
 * Cấu hình giá vé phía client
 */

export const CURRENCY = {
  CODE: "VND",
  SYMBOL: "₫",
  NAME: "Vietnamese Dong",
  DECIMAL_PLACES: 0,
};

export const DEFAULT_PRICES = {
  PRICE_PER_SEAT: 150000, // 150,000 VND
  MIN_PRICE: 50000, // 50,000 VND
  MAX_PRICE: 2000000, // 2,000,000 VND
};

export const FEE_RATES = {
  CONVENIENCE_FEE: 0.05, // 5%
  BANK_CHARGE: 0.02, // 2%
  SERVICE_FEE: 0.03, // 3% (optional)
};

export const CALCULATION = {
  ROUND_TO_THOUSAND: true,
  MIN_TOTAL: 50000,
};

export const DISCOUNTS = {
  EARLY_BIRD: 0.1,
  GROUP_BOOKING: 0.15,
  LOYALTY_MEMBER: 0.05,
  STUDENT: 0.2,
  SENIOR: 0.25,
};

export const REFUND = {
  FULL_REFUND_HOURS: 24,
  PARTIAL_REFUND_HOURS: 12,
  NO_REFUND_HOURS: 2,
};
