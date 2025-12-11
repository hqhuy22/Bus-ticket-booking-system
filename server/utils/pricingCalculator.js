/**
 * Pricing Calculator Utility
 * Công cụ tính toán giá vé thống nhất
 */

import pricingConfig from '../config/pricing.js';

const { CURRENCY, DEFAULT_PRICES, FEE_RATES, CALCULATION } = pricingConfig;

/**
 * Làm tròn giá trị theo quy tắc
 * @param {number} value - Giá trị cần làm tròn
 * @returns {number} - Giá trị đã làm tròn
 */
function roundPrice(value) {
  if (!CALCULATION.ROUND_TO_THOUSAND) {
    return Math.round(value);
  }
  // Làm tròn đến nghìn gần nhất
  return Math.round(value / 1000) * 1000;
}

/**
 * Validate giá vé
 * @param {number} price - Giá vé
 * @returns {number} - Giá vé hợp lệ
 */
function validatePrice(price) {
  const numPrice = parseFloat(price);

  if (!price || isNaN(numPrice) || numPrice <= 0) {
    console.warn(
      '[PricingCalculator] Invalid price, using default:',
      DEFAULT_PRICES.PRICE_PER_SEAT
    );
    return DEFAULT_PRICES.PRICE_PER_SEAT;
  }

  if (numPrice < DEFAULT_PRICES.MIN_PRICE) {
    console.warn('[PricingCalculator] Price too low, using minimum:', DEFAULT_PRICES.MIN_PRICE);
    return DEFAULT_PRICES.MIN_PRICE;
  }

  if (numPrice > DEFAULT_PRICES.MAX_PRICE) {
    console.warn('[PricingCalculator] Price too high, using maximum:', DEFAULT_PRICES.MAX_PRICE);
    return DEFAULT_PRICES.MAX_PRICE;
  }

  return numPrice;
}

/**
 * Tính toán giá vé chi tiết
 * @param {number} pricePerSeat - Giá mỗi ghế
 * @param {number} numSeats - Số ghế
 * @param {Object} options - Tùy chọn tính giá
 * @param {number} options.discount - Tỷ lệ giảm giá (0-1)
 * @param {boolean} options.includeBreakdown - Có bao gồm chi tiết không
 * @returns {Object} - Chi tiết giá vé
 */
function calculateBookingPrice(pricePerSeat, numSeats, options = {}) {
  // Validate inputs
  const validPrice = validatePrice(pricePerSeat);
  const validSeats = Math.max(1, parseInt(numSeats) || 1);

  console.log('[PricingCalculator] Calculating:', {
    pricePerSeat: validPrice,
    numSeats: validSeats,
    discount: options.discount || 0,
  });

  // Calculate base fare
  let baseFare = validPrice * validSeats;
  let busFare = baseFare;

  // Apply discount if any
  let discountAmount = 0;
  if (options.discount && options.discount > 0 && options.discount < 1) {
    discountAmount = baseFare * options.discount;
    busFare = baseFare - discountAmount;
  }

  // Calculate fees
  const convenienceFee = busFare * FEE_RATES.CONVENIENCE_FEE;
  const bankCharge = busFare * FEE_RATES.BANK_CHARGE;

  // Calculate total
  let totalPay = busFare + convenienceFee + bankCharge;

  // Round all values
  const result = {
    pricePerSeat: roundPrice(validPrice),
    numSeats: validSeats,
    baseFare: roundPrice(baseFare),
    busFare: roundPrice(busFare),
    convenienceFee: roundPrice(convenienceFee),
    bankCharge: roundPrice(bankCharge),
    totalPay: roundPrice(totalPay),
    currency: CURRENCY.CODE,
    currencySymbol: CURRENCY.SYMBOL,
  };

  // Include breakdown if requested
  if (options.includeBreakdown) {
    result.breakdown = {
      baseFare: roundPrice(baseFare),
      discount: roundPrice(discountAmount),
      discountedFare: roundPrice(busFare),
      fees: {
        convenience: roundPrice(convenienceFee),
        bank: roundPrice(bankCharge),
        total: roundPrice(convenienceFee + bankCharge),
      },
      total: roundPrice(totalPay),
    };
  }

  // Ensure minimum total
  if (result.totalPay < CALCULATION.MIN_TOTAL) {
    console.warn('[PricingCalculator] Total below minimum, adjusting:', {
      calculated: result.totalPay,
      minimum: CALCULATION.MIN_TOTAL,
    });
    result.totalPay = CALCULATION.MIN_TOTAL;
  }

  console.log('[PricingCalculator] Result:', result);

  return result;
}

/**
 * Format giá tiền theo chuẩn VND
 * @param {number} amount - Số tiền
 * @param {boolean} includeSymbol - Có hiển thị ký hiệu không
 * @returns {string} - Chuỗi định dạng
 */
function formatCurrency(amount, includeSymbol = true) {
  const numAmount = parseFloat(amount) || 0;

  // Format: 150,000 (có dấu phẩy ngăn cách nghìn)
  const formatted = new Intl.NumberFormat('vi-VN').format(Math.round(numAmount));

  return includeSymbol ? `${formatted} ${CURRENCY.SYMBOL}` : formatted;
}

/**
 * Format giá tiền ngắn gọn (k = nghìn, tr = triệu)
 * @param {number} amount - Số tiền
 * @returns {string} - Chuỗi định dạng ngắn
 */
function formatCurrencyShort(amount) {
  const numAmount = parseFloat(amount) || 0;

  if (numAmount >= 1000000) {
    return `${(numAmount / 1000000).toFixed(1)}tr ${CURRENCY.SYMBOL}`;
  }

  if (numAmount >= 1000) {
    return `${(numAmount / 1000).toFixed(0)}k ${CURRENCY.SYMBOL}`;
  }

  return `${Math.round(numAmount)} ${CURRENCY.SYMBOL}`;
}

/**
 * Parse giá từ string về number
 * @param {string|number} price - Giá cần parse
 * @returns {number} - Giá dạng số
 */
function parsePrice(price) {
  if (typeof price === 'number') return price;

  // Remove currency symbols, spaces, and commas
  const cleaned = String(price).replace(/[₫$Rs.,\s]/g, '');
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Tính phí hủy vé theo thời gian
 * @param {number} totalPay - Tổng tiền
 * @param {number} hoursBeforeDeparture - Số giờ trước khi khởi hành
 * @returns {Object} - Chi tiết phí hủy
 */
function calculateCancellationFee(totalPay, hoursBeforeDeparture) {
  let refundRate = 0;
  let cancellationFee = totalPay;
  let refundAmount = 0;

  const REFUND = pricingConfig.REFUND || {
    FULL_REFUND_HOURS: 24,
    PARTIAL_REFUND_HOURS: 12,
    NO_REFUND_HOURS: 2,
  };

  if (hoursBeforeDeparture >= REFUND.FULL_REFUND_HOURS) {
    refundRate = 1.0; // 100%
  } else if (hoursBeforeDeparture >= REFUND.PARTIAL_REFUND_HOURS) {
    refundRate = 0.5; // 50%
  } else if (hoursBeforeDeparture >= REFUND.NO_REFUND_HOURS) {
    refundRate = 0.0; // 0%
  } else {
    refundRate = 0.0; // Không hoàn tiền
  }

  refundAmount = roundPrice(totalPay * refundRate);
  cancellationFee = roundPrice(totalPay - refundAmount);

  return {
    totalPay: roundPrice(totalPay),
    refundRate,
    refundAmount,
    cancellationFee,
    hoursBeforeDeparture,
    currency: CURRENCY.CODE,
    currencySymbol: CURRENCY.SYMBOL,
  };
}

export {
  roundPrice,
  validatePrice,
  calculateBookingPrice,
  formatCurrency,
  formatCurrencyShort,
  parsePrice,
  calculateCancellationFee,
  CURRENCY,
  DEFAULT_PRICES,
  FEE_RATES,
};
