import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authActions } from '../../redux/auth-slice';
import AuthInput from '../input/AuthInput';
import AuthInputIcon from '../input/AuthInputIcon';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AuthForm({ authMethod }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState(
    authMethod === 'register'
      ? {
          username: '',
          email: '',
          password: '',
          repeat_password: '',
          fullName: '',
        }
      : { username: '', password: '' }
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Check for Google OAuth redirect
  const dispatch = useDispatch();

  useEffect(() => {
    if (authMethod === 'login') {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const error = searchParams.get('error');

      if (error) {
        toast.error('Google authentication failed. Please try again.', {
          position: 'top-right',
        });
      } else if (token && userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          // Update redux auth state and navigate immediately so protected routes see credentials
          dispatch(authActions.login());
          toast.success('Login successful!', { position: 'top-right' });
          navigate('/bus-booking/dashboard');
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
    }
  }, [searchParams, authMethod, navigate, dispatch]);

  useEffect(() => {
    if (authMethod === 'register') {
      setFormData({
        username: '',
        email: '',
        password: '',
        repeat_password: '',
        fullName: '',
      });
    } else {
      setFormData({ username: '', password: '' });
    }
  }, [authMethod]);

  // Real-time email availability check with debounce
  useEffect(() => {
    // Enhanced email validation regex (more strict)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (authMethod === 'register' && formData.email) {
      // First check if format is valid
      if (!emailRegex.test(formData.email)) {
        // Invalid format - show error immediately without API call
        if (formData.email.includes('@') && formData.email.split('@')[1]) {
          // User has typed @ and domain, so show error
          setErrors(prev => ({
            ...prev,
            email:
              'Invalid email format (no special characters except . _ % + -)',
          }));
        }
        setEmailAvailable(null);
        setEmailChecking(false);
        return;
      }

      // Format is valid - check availability with debounce (including domain verification)
      const timeoutId = setTimeout(async () => {
        setEmailChecking(true);
        try {
          const response = await axios.get(
            `/api/customer/check-email?email=${encodeURIComponent(formData.email)}`
          );
          setEmailAvailable(response.data.available);
          if (!response.data.available) {
            // Different error messages based on error type
            let errorMsg = response.data.msg;
            if (response.data.error === 'invalid_domain') {
              errorMsg = '⚠️ ' + errorMsg; // Add warning icon for domain issues
            }
            setErrors(prev => ({ ...prev, email: errorMsg }));
          } else {
            // Remove email error if it exists
            setErrors(prev => {
              // eslint-disable-next-line no-unused-vars
              const { email, ...rest } = prev;
              return rest;
            });
          }
        } catch (error) {
          console.error('Email check error:', error);
          if (error.response?.data) {
            const errorData = error.response.data;
            let errorMsg = errorData.msg || 'Email validation failed';

            // Add context based on error type
            if (errorData.error === 'invalid_domain') {
              errorMsg = '⚠️ ' + errorMsg;
            }

            setErrors(prev => ({ ...prev, email: errorMsg }));
            setEmailAvailable(false);
          }
        } finally {
          setEmailChecking(false);
        }
      }, 800); // Increased to 800ms to allow time for user to finish typing

      return () => clearTimeout(timeoutId);
    } else if (authMethod === 'register' && !formData.email) {
      // Reset state when email is cleared
      setEmailAvailable(null);
      setEmailChecking(false);
    }
  }, [formData.email, authMethod]);

  const inputDataChange = event => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    let formErrors = {};

    if (!formData.username.trim()) {
      formErrors.username = 'Username is required';
    }
    if (!formData.password) {
      formErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      formErrors.password = 'Password must be at least 6 characters';
    } else {
      // Enhanced password validation
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(formData.password)) {
        formErrors.password =
          'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)';
      }
    }

    if (authMethod === 'register') {
      // Enhanced email validation (same as real-time check)
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (!formData.email.trim()) {
        formErrors.email = 'Email is required';
      } else if (!emailRegex.test(formData.email)) {
        formErrors.email =
          'Invalid email format (allowed: letters, numbers, . _ % + - )';
      } else if (emailAvailable === false) {
        formErrors.email = 'Email already exists';
      }

      if (formData.fullName && formData.fullName.trim().length < 2) {
        formErrors.fullName = 'Full name must be at least 2 characters';
      }

      if (!formData.repeat_password) {
        formErrors.repeat_password = 'Confirm password is required';
      } else if (formData.password !== formData.repeat_password) {
        formErrors.repeat_password = 'Passwords do not match';
      }
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      let response;
      if (authMethod === 'register') {
        // Use relative path so cookies are set from server and CORS with credentials works
        response = await axios.post('/api/customer/register', formData);

        // Store registered email for modal
        setRegisteredEmail(formData.email);

        // Show success toast with email verification instruction
        toast.success(
          '✅ Registration successful! Please check your email to verify your account.',
          {
            position: 'top-right',
            autoClose: 5000,
          }
        );

        // Show verification modal
        setShowVerificationModal(true);

        // Redirect to login after 5 seconds
        setTimeout(() => {
          setShowVerificationModal(false);
          navigate('/bus-booking/login');
        }, 5000);
      } else {
        response = await axios.post('/api/customer/login', {
          username: formData.username,
          password: formData.password,
        });

        localStorage.setItem('token', response.data.token);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        // Update redux state so protected routes allow access and navigate immediately
        dispatch(authActions.login());
        toast.success('Login successful! Redirecting...', {
          position: 'top-right',
        });
        navigate('/bus-booking/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Something went wrong!', {
        position: 'top-right',
      });
    }
  };

  const handleGoogleLogin = () => {
    // Use absolute URL for OAuth redirects to server (keeps existing behavior)
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4  ">
      <div className="rounded-2xl p-8 w-full max-w-md border-2">
        {authMethod === 'register' ? (
          <h1 className="text-3xl font-semibold mb-8  text-center">
            Create your QTechy Account
          </h1>
        ) : (
          <div className="flex justify-start items-start flex-col">
            <h1 className="text-3xl font-bold mb-2">Sign in</h1>
            <p className="text-gray-600 mb-6">
              Enter your QTechy Account details.
            </p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <AuthInput
            id="username"
            name="username"
            label="Username"
            placeholder="Enter your username"
            value={formData.username}
            onChange={inputDataChange}
            error={errors.username}
          />

          {authMethod === 'register' && (
            <>
              <AuthInput
                id="fullName"
                name="fullName"
                label="Full Name (Optional)"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={inputDataChange}
                error={errors.fullName}
              />

              <div className="relative">
                <AuthInput
                  id="email"
                  name="email"
                  label="Email"
                  placeholder="example@gmail.com"
                  value={formData.email}
                  onChange={inputDataChange}
                  error={errors.email}
                />
                {emailChecking && (
                  <span className="absolute right-3 top-9 text-gray-400 text-sm">
                    Checking...
                  </span>
                )}
                {!emailChecking &&
                  emailAvailable === true &&
                  formData.email && (
                    <span className="absolute right-3 top-9 text-success-500 text-sm">
                      ✓ Available
                    </span>
                  )}
              </div>
            </>
          )}

          <div>
            <AuthInputIcon
              id="password"
              name="password"
              label="Password"
              placeholder="********"
              value={formData.password}
              onChange={inputDataChange}
              error={errors.password}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
            {authMethod === 'register' && (
              <p className="mt-1 text-xs text-gray-500">
                Password must contain: uppercase, lowercase, number, and special
                character (@$!%*?&)
              </p>
            )}
          </div>

          {authMethod === 'register' && (
            <AuthInputIcon
              id="repeat_password"
              name="repeat_password"
              label="Repeat Password"
              placeholder="********"
              value={formData.repeat_password}
              onChange={inputDataChange}
              error={errors.repeat_password}
              showPassword={showRepeatPassword}
              setShowPassword={setShowRepeatPassword}
            />
          )}

          {authMethod === 'login' && (
            <div className="text-right">
              <Link
                to="/bus-booking/forgot-password"
                className="text-sm text-[#6d4aff] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#6d4aff] text-white py-3 rounded-lg hover:bg-[#5b3df5] transition-colors"
          >
            {authMethod === 'register' ? 'Create account' : 'Sign in'}
          </button>

          {authMethod === 'login' && (
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="mt-4 w-full flex items-center justify-center gap-3 bg-white text-gray-700 py-3 px-4 rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          {authMethod === 'register' ? (
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/bus-booking/login"
                className="text-[#6d4aff] hover:underline"
              >
                Sign in
              </Link>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              New to QTechy?{' '}
              <Link
                to="/bus-booking/register"
                className="text-[#6d4aff] hover:underline"
              >
                Create account
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Email Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fadeIn">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-success-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
              Registration Successful! 🎉
            </h2>

            {/* Message */}
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4">
                We&apos;ve sent a verification email to:
              </p>
              <p className="text-lg font-semibold text-[#6d4aff] mb-4 break-all">
                {registeredEmail}
              </p>
              <div className="bg-blue-50 border-l-4 border-info-500 p-4 text-left">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-info-500 mt-0.5 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-info-800 mb-1">Important:</p>
                    <ul className="text-info-700 space-y-1">
                      <li>• Check your inbox and spam folder</li>
                      <li>• Click the verification link in the email</li>
                      <li>• You must verify before logging in</li>
                      <li>• Link expires in 24 hours</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowVerificationModal(false);
                  navigate('/bus-booking/login');
                }}
                className="w-full bg-[#6d4aff] text-white py-3 rounded-lg hover:bg-[#5b3df5] transition-colors font-medium"
              >
                Go to Login Page
              </button>
              <p className="text-xs text-gray-500 text-center">
                Redirecting automatically in 5 seconds...
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

AuthForm.propTypes = {
  authMethod: PropTypes.oneOf(['login', 'register']).isRequired,
};

export default AuthForm;
