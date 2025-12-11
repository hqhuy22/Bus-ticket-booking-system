import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { authAPI } from "../lib/authAPI";
import "../styles/auth.css";

export const Signup = () => {
  const navigate = useNavigate();
  const { setToken, setLoading, setError, isLoading, error } = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authAPI.signup(formData);
      // After signup, show verification message or redirect to login
      setError(null);
      navigate("/login", {
        state: { message: "Đăng ký thành công! Vui lòng đăng nhập." },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Đăng Ký</h1>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Số điện thoại"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Mật khẩu (tối thiểu 6 ký tự)"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Đang đăng ký..." : "Đăng Ký"}
          </button>
        </form>

        <p>
          Đã có tài khoản? <a href="/login">Đăng nhập tại đây</a>
        </p>
      </div>
    </div>
  );
};
