import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthInputIcon from '../components/input/AuthInputIcon';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');

  const handleSubmit = async e => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid reset link', { position: 'top-right' });
      return;
    }

    if (!formData.newPassword || !formData.confirmPassword) {
      toast.error('Please fill in all fields', { position: 'top-right' });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters', {
        position: 'top-right',
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match', { position: 'top-right' });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/customer/reset-password`,
        {
          token,
          newPassword: formData.newPassword,
        }
      );

      toast.success(response.data.msg, { position: 'top-right' });

      setTimeout(() => {
        navigate('/bus-booking/login');
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Password reset failed', {
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border-2 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Invalid Reset Link
          </h2>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired.
          </p>
          <button
            onClick={() => navigate('/bus-booking/forgot-password')}
            className="bg-[#6d4aff] text-white px-6 py-2 rounded-lg hover:bg-[#5b3df5] transition-colors"
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border-2">
        <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
        <p className="text-gray-600 mb-6">Enter your new password below.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AuthInputIcon
            id="newPassword"
            name="newPassword"
            label="New Password"
            placeholder="Enter new password"
            value={formData.newPassword}
            onChange={handleChange}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

          <AuthInputIcon
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm new password"
            value={formData.confirmPassword}
            onChange={handleChange}
            showPassword={showConfirmPassword}
            setShowPassword={setShowConfirmPassword}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6d4aff] text-white py-3 rounded-lg hover:bg-[#5b3df5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
