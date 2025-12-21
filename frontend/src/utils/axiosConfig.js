import axios from 'axios';

// Use the VITE_API_BASE_URL environment variable when available,
// otherwise default to local server.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Ensure cookies (httpOnly token) are sent with requests so server auth middleware can read them
  withCredentials: true,
});

// Attach Authorization header from localStorage token (if present)
axiosInstance.interceptors.request.use(
  config => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
    return config;
  },
  error => Promise.reject(error)
);

// Optionally handle 401 globally (leave components to redirect if needed)
axiosInstance.interceptors.response.use(
  resp => resp,
  err => {
    // keep default behavior; components can react to 401 and redirect
    return Promise.reject(err);
  }
);

export default axiosInstance;
