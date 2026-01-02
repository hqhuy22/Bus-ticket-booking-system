import jwt from 'jsonwebtoken';
import Customer from '../models/Customer.js';

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header or cookie
    let token = req.cookies.token;

    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database
    const customer = await Customer.findByPk(decoded.customer.id, {
      attributes: { exclude: ['password'] },
    });

    if (!customer) {
      return res.status(401).json({ msg: 'Token is not valid' });
    }

    // Attach user to request
    req.user = customer;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ msg: 'Authentication required' });
  }

  if (req.user.position !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
  }

  next();
};

/**
 * Middleware to check if user's email is verified
 */
export const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ msg: 'Authentication required' });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({ msg: 'Please verify your email first' });
  }

  next();
};

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 * Useful for endpoints that support both authenticated and guest users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    // Get token from header or cookie
    let token = req.cookies.token;

    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // If no token, continue without user (guest mode)
    if (!token) {
      req.user = null;
      return next();
    }

    // Verify token if present
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database
    const customer = await Customer.findByPk(decoded.customer.id, {
      attributes: { exclude: ['password'] },
    });

    // Attach user to request (or null if not found)
    req.user = customer || null;
    next();
  } catch (err) {
    // Token invalid, continue as guest
    console.error('Optional auth - token invalid:', err.message);
    req.user = null;
    next();
  }
};
