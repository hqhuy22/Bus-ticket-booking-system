import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address', { position: 'top-right' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address', {
        position: 'top-right',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/customer/forgot-password`,
        { email }
      );
      toast.success(response.data.msg, { position: 'top-right' });
      setSubmitted(true);
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Something went wrong', {
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border-2 text-center">
          <div className="mx-auto h-16 w-16 text-success-500 mb-4">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Check Your Email
          </h2>
          <p className="text-gray-600 mb-6">
            If an account exists for {email}, you will receive password reset
            instructions.
          </p>
          <Link
            to="/bus-booking/login"
            className="text-[#6d4aff] hover:underline font-medium"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border-2">
        <h1 className="text-3xl font-bold mb-2">Forgot Password?</h1>
        <p className="text-gray-600 mb-6">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6d4aff] focus:border-transparent outline-none"
              placeholder="example@gmail.com"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6d4aff] text-white py-3 rounded-lg hover:bg-[#5b3df5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/bus-booking/login"
            className="text-sm text-[#6d4aff] hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
