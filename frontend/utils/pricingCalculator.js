/**
 * Pricing Calculator Utility - Client Side
 * Công cụ tính toán giá vé thống nhất
 */

import {
  CURRENCY,
  DEFAULT_PRICES,
  FEE_RATES,
  CALCULATION,
  REFUND,
} from '../config/pricing';

/**
 * Làm tròn giá trị theo quy tắc
 */
export function roundPrice(value) {
  if (!CALCULATION.ROUND_TO_THOUSAND) {
    return Math.round(value);
  }
  return Math.round(value / 1000) * 1000;
}

/**
 * Validate giá vé
 */
export function validatePrice(price) {
  const numPrice = parseFloat(price);

  if (!price || isNaN(numPrice) || numPrice <= 0) {
    console.warn(
      '[PricingCalculator] Invalid price, using default:',
      DEFAULT_PRICES.PRICE_PER_SEAT
    );
    return DEFAULT_PRICES.PRICE_PER_SEAT;
  }

  if (numPrice < DEFAULT_PRICES.MIN_PRICE) {
    console.warn(
      '[PricingCalculator] Price too low, using minimum:',
      DEFAULT_PRICES.MIN_PRICE
    );
    return DEFAULT_PRICES.MIN_PRICE;
  }

  if (numPrice > DEFAULT_PRICES.MAX_PRICE) {
    console.warn(
      '[PricingCalculator] Price too high, using maximum:',
      DEFAULT_PRICES.MAX_PRICE
    );
    return DEFAULT_PRICES.MAX_PRICE;
  }

  return numPrice;
}

/**
 * Tính toán giá vé chi tiết
 */
export function calculateBookingPrice(pricePerSeat, numSeats, options = {}) {
  const validPrice = validatePrice(pricePerSeat);
  const validSeats = Math.max(1, parseInt(numSeats) || 1);

  console.log('[PricingCalculator] Calculating:', {
    pricePerSeat: validPrice,
    numSeats: validSeats,
    discount: options.discount || 0,
  });

  let baseFare = validPrice * validSeats;
  let busFare = baseFare;

  let discountAmount = 0;
  if (options.discount && options.discount > 0 && options.discount < 1) {
    discountAmount = baseFare * options.discount;
    busFare = baseFare - discountAmount;
  }

  const convenienceFee = busFare * FEE_RATES.CONVENIENCE_FEE;
  const bankCharge = busFare * FEE_RATES.BANK_CHARGE;
  let totalPay = busFare + convenienceFee + bankCharge;

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
 */
export function formatCurrency(amount, includeSymbol = true) {
  const numAmount = parseFloat(amount) || 0;
  const formatted = new Intl.NumberFormat('vi-VN').format(
    Math.round(numAmount)
  );
  return includeSymbol ? `${formatted} ${CURRENCY.SYMBOL}` : formatted;
}

/**
 * Format giá tiền ngắn gọn
 */
export function formatCurrencyShort(amount) {
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
 */
export function parsePrice(price) {
  if (typeof price === 'number') return price;
  const cleaned = String(price).replace(/[₫$Rs.,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Tính phí hủy vé theo thời gian
 */
export function calculateCancellationFee(totalPay, hoursBeforeDeparture) {
  let refundRate = 0;

  if (hoursBeforeDeparture >= REFUND.FULL_REFUND_HOURS) {
    refundRate = 1.0;
  } else if (hoursBeforeDeparture >= REFUND.PARTIAL_REFUND_HOURS) {
    refundRate = 0.5;
  } else {
    refundRate = 0.0;
  }

  const refundAmount = roundPrice(totalPay * refundRate);
  const cancellationFee = roundPrice(totalPay - refundAmount);

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
