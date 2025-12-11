import { useState } from "react";
import "../styles/booking-detail.css";

export const BookingDetail = () => {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const seats = Array.from({ length: 32 }, (_, i) => {
    const letter = String.fromCharCode(65 + Math.floor(i / 4));
    const number = (i % 4) + 1;
    return `${letter}${number}`;
  });

  const toggleSeat = (seat: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]
    );
  };

  return (
    <div className="booking-detail-container">
      <h1>Chọn Ghế & Hoàn Tất Đặt Vé</h1>

      <div className="booking-info">
        <p>
          <strong>Hà Nội</strong> → <strong>Hồ Chí Minh</strong>
        </p>
        <p>
          Ngày: <strong>2025-12-20</strong>
        </p>
        <p>
          Giờ: <strong>08:00 - 16:30</strong>
        </p>
      </div>

      <div className="seat-map">
        <h3>Bản Đồ Ghế (32 ghế)</h3>
        <div className="seats-grid">
          {seats.map((seat) => (
            <button
              key={seat}
              className={`seat ${
                selectedSeats.includes(seat) ? "selected" : ""
              }`}
              onClick={() => toggleSeat(seat)}
            >
              {seat}
            </button>
          ))}
        </div>
      </div>

      <div className="seat-legend">
        <div>
          <span className="seat available"></span> Còn Trống
        </div>
        <div>
          <span className="seat selected"></span> Đã Chọn
        </div>
        <div>
          <span className="seat booked"></span> Đã Bán
        </div>
      </div>

      <div className="booking-summary">
        <h3>Tóm Tắt Đặt Vé</h3>
        <p>
          Ghế đã chọn:{" "}
          {selectedSeats.length > 0 ? selectedSeats.join(", ") : "Chưa chọn"}
        </p>
        <p>
          <strong>Tổng cộng:</strong> {selectedSeats.length * 450000} đ
        </p>
        <button className="confirm-btn" disabled={selectedSeats.length === 0}>
          Tiếp Tục Thanh Toán
        </button>
      </div>
    </div>
  );
};
