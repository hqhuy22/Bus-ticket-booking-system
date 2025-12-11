import "../styles/bookings.css";

export const MyBookings = () => {
  const mockBookings = [
    {
      id: "BK001",
      from: "Hà Nội",
      to: "Hồ Chí Minh",
      date: "2025-12-20",
      departure: "08:00",
      price: 450000,
      status: "confirmed",
      seats: ["A1", "A2"],
    },
    {
      id: "BK002",
      from: "TP Hồ Chí Minh",
      to: "Cần Thơ",
      date: "2025-12-25",
      departure: "14:00",
      price: 350000,
      status: "pending",
      seats: ["B5"],
    },
  ];

  return (
    <div className="bookings-container">
      <h1>Đặt Vé Của Tôi</h1>

      {mockBookings.length === 0 ? (
        <div className="no-bookings">
          <p>Bạn chưa có đặt vé nào</p>
        </div>
      ) : (
        <div className="booking-list">
          {mockBookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <h3>{booking.id}</h3>
                <span className={`status ${booking.status}`}>
                  {booking.status === "confirmed"
                    ? "Đã Xác Nhận"
                    : "Chưa Thanh Toán"}
                </span>
              </div>

              <div className="booking-route">
                <div className="station">
                  <p className="time">{booking.departure}</p>
                  <p className="city">{booking.from}</p>
                </div>
                <div className="arrow">→</div>
                <div className="station">
                  <p className="city">{booking.to}</p>
                </div>
              </div>

              <div className="booking-info">
                <p>
                  <strong>Ngày:</strong>{" "}
                  {new Date(booking.date).toLocaleDateString("vi-VN")}
                </p>
                <p>
                  <strong>Ghế:</strong> {booking.seats.join(", ")}
                </p>
                <p>
                  <strong>Giá:</strong> {booking.price.toLocaleString()} đ
                </p>
              </div>

              <div className="booking-actions">
                <button className="view-btn">Xem Chi Tiết</button>
                <button className="download-btn">Tải E-Ticket</button>
                {booking.status === "pending" && (
                  <button className="pay-btn">Thanh Toán</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
