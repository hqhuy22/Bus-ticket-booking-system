import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import "../styles/home.css";

export const Home = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const logout = useAuthStore((state) => state.logout);
  const [searchParams, setSearchParams] = useState({
    from: "",
    to: "",
    date: "",
    passengers: 1,
  });

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate("/search");
    } else {
      navigate("/login");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="home-container">
      <header className="navbar">
        <div className="navbar-content">
          <h1>🚌 Bus Ticket Booking</h1>
          <nav>
            {isAuthenticated ? (
              <>
                <button onClick={() => navigate("/search")}>Tìm Kiếm</button>
                <button onClick={() => navigate("/my-bookings")}>
                  Đặt Vé Của Tôi
                </button>
                <button onClick={handleLogout} className="logout-btn">
                  Đăng Xuất
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="login-btn"
                >
                  Đăng Nhập
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="signup-btn"
                >
                  Đăng Ký
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h2>Đặt vé xe khách trực tuyến</h2>
          <p>Tìm và đặt vé xe nhanh chóng, an toàn</p>

          <form className="hero-search-form" onSubmit={handleSearch}>
            <div className="form-group">
              <label>Điểm Đi</label>
              <input
                type="text"
                name="from"
                placeholder="Nhập thành phố bắt đầu"
                value={searchParams.from}
                onChange={handleSearchChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Điểm Đến</label>
              <input
                type="text"
                name="to"
                placeholder="Nhập thành phố kết thúc"
                value={searchParams.to}
                onChange={handleSearchChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Ngày Khởi Hành</label>
              <input
                type="date"
                name="date"
                value={searchParams.date}
                onChange={handleSearchChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Hành Khách</label>
              <select
                name="passengers"
                value={searchParams.passengers}
                onChange={handleSearchChange}
              >
                <option value={1}>1 Người</option>
                <option value={2}>2 Người</option>
                <option value={3}>3 Người</option>
                <option value={4}>4+ Người</option>
              </select>
            </div>

            <button type="submit" className="cta-btn">
              Tìm Kiếm Vé
            </button>
          </form>
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <h3>Giá Rẻ Nhất</h3>
          <p>Giảm giá tới 20% cho khách hàng mới</p>
        </div>
        <div className="feature-card">
          <h3>Nhanh & Tiện</h3>
          <p>Đặt vé chỉ trong 2 phút</p>
        </div>
        <div className="feature-card">
          <h3>An Toàn</h3>
          <p>Thanh toán bảo mật 100%</p>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <p className="footer-copyright">
            Ⓒ 2025 Robus Vietnam All Rights Reserved
          </p>
          <p className="footer-text">ROBUS VIETNAM COMPANY LIMITED.</p>
          <p className="footer-text">Email: contact@robus.vn</p>
          <p className="footer-text">Contact: 10000000</p>
          <p className="footer-text">
            Address: District 10, Ho Chi Minh City, Vietnam.
          </p>
          <p className="footer-text">
            Business Registration No. 0317772089 issued by Department of
            Planning and Investment of Ho Chi Minh City on June 04th, 2023.
          </p>
        </div>
      </footer>
    </div>
  );
};
