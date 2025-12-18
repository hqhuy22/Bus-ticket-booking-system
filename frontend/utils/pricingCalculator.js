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
} from "../config/pricing";

export function roundPrice(value) {
  if (!CALCULATION.ROUND_TO_THOUSAND) {
    return Math.round(value);
  }
  return Math.round(value / 1000) * 1000;
}

export function validatePrice(price) {
  const numPrice = parseFloat(price);

  if (!price || isNaN(numPrice) || numPrice <= 0) {
    return DEFAULT_PRICES.PRICE_PER_SEAT;
  }

  if (numPrice < DEFAULT_PRICES.MIN_PRICE) {
    return DEFAULT_PRICES.MIN_PRICE;
  }

  if (numPrice > DEFAULT_PRICES.MAX_PRICE) {
    return DEFAULT_PRICES.MAX_PRICE;
  }

  return numPrice;
}

export function calculateBookingPrice(pricePerSeat, numSeats, options = {}) {
  const validPrice = validatePrice(pricePerSeat);
  const validSeats = Math.max(1, parseInt(numSeats) || 1);

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
    result.totalPay = CALCULATION.MIN_TOTAL;
  }

  return result;
}

export function formatCurrency(amount, includeSymbol = true) {
  const numAmount = Number.parseFloat(amount);
  const safeAmount = Number.isFinite(numAmount) ? numAmount : 0;

  const formatted = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: CURRENCY.CODE,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(Math.round(safeAmount))
    // Keep legacy "amount symbol" output the rest of the app expects.
    .replace(`${CURRENCY.SYMBOL}`, "")
    .trim();

  return includeSymbol ? `${formatted} ${CURRENCY.SYMBOL}` : formatted;
}

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

export function parsePrice(price) {
  if (typeof price === "number") return price;
  const cleaned = String(price).replace(/[₫$Rs.,\s]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

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
