/**
 * Pricing Configuration
 * Cấu hình giá vé và phí dịch vụ
 */

export default {
  // Currency Settings - VND
  CURRENCY: {
    CODE: 'VND',
    SYMBOL: '₫',
    NAME: 'Vietnamese Dong',
    DECIMAL_PLACES: 0, // VND không dùng số thập phân
  },

  // Default Prices (VND)
  DEFAULT_PRICES: {
    PRICE_PER_SEAT: 150000, // 150,000 VND - Giá mặc định mỗi ghế
    MIN_PRICE: 50000, // 50,000 VND - Giá tối thiểu
    MAX_PRICE: 2000000, // 2,000,000 VND - Giá tối đa
  },

  // Fee Rates (%)
  FEE_RATES: {
    CONVENIENCE_FEE: 0.05, // 5% phí tiện lợi
    BANK_CHARGE: 0.02, // 2% phí ngân hàng
    SERVICE_FEE: 0.03, // 3% phí dịch vụ (optional - chưa dùng)
  },

  // Calculation Rules
  CALCULATION: {
    ROUND_TO_THOUSAND: true, // Làm tròn đến nghìn đồng
    MIN_TOTAL: 50000, // Tổng tiền tối thiểu
  },

  // Discount Rules (Optional - for future features)
  DISCOUNTS: {
    EARLY_BIRD: 0.1, // 10% giảm giá đặt trước 7 ngày
    GROUP_BOOKING: 0.15, // 15% giảm giá đặt nhóm (>5 ghế)
    LOYALTY_MEMBER: 0.05, // 5% giảm giá thành viên thân thiết
    STUDENT: 0.2, // 20% giảm giá sinh viên
    SENIOR: 0.25, // 25% giảm giá người cao tuổi
  },

  // Refund Policy (Optional - for future)
  REFUND: {
    FULL_REFUND_HOURS: 24, // Hoàn tiền 100% nếu hủy trước 24h
    PARTIAL_REFUND_HOURS: 12, // Hoàn tiền 50% nếu hủy trước 12h
    NO_REFUND_HOURS: 2, // Không hoàn tiền nếu hủy trong 2h
  },
};
