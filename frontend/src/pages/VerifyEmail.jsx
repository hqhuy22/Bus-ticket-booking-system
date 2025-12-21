import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      // Support server redirect flow: server may redirect to client with status and msg
      const statusParam = searchParams.get('status');
      const msgParam = searchParams.get('msg');

      if (statusParam) {
        const decodedMsg = msgParam ? decodeURIComponent(msgParam) : '';
        if (statusParam === 'success') {
          setStatus('success');
          setMessage(decodedMsg || 'Email verified successfully!');
          toast.success(decodedMsg || 'Email verified successfully!', {
            position: 'top-right',
          });

          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/bus-booking/login');
          }, 3000);
          return;
        }

        // Any non-success status treated as error
        setStatus('error');
        setMessage(decodedMsg || 'Invalid verification link');
        toast.error(decodedMsg || 'Verification failed', {
          position: 'top-right',
        });
        return;
      }

      // Fallback: token flow (when user opens client verify page and token is present)
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/customer/verify-email?token=${token}`
        );
        setStatus('success');
        setMessage(response.data.msg);
        toast.success('Email verified successfully!', {
          position: 'top-right',
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/bus-booking/login');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.msg || 'Email verification failed');
        toast.error(error.response?.data?.msg || 'Verification failed', {
          position: 'top-right',
        });
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {status === 'verifying' && (
          <div>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#6d4aff] mx-auto"></div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Verifying your email...
            </h2>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="mx-auto h-16 w-16 text-success-500">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Email Verified!
            </h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <p className="mt-4 text-sm text-gray-500">
              Redirecting to login...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="mx-auto h-16 w-16 text-error-500">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Verification Failed
            </h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <button
              onClick={() => navigate('/bus-booking/login')}
              className="mt-6 bg-[#6d4aff] text-white px-6 py-2 rounded-lg hover:bg-[#5b3df5] transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
