import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token) {
    return <Navigate to="/bus-booking/login" replace />;
  }

  if (requireAdmin && userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.position !== 'admin') {
        return <Navigate to="/bus-booking/dashboard" replace />;
      }
    } catch {
      return <Navigate to="/bus-booking/login" replace />;
    }
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requireAdmin: PropTypes.bool,
};
