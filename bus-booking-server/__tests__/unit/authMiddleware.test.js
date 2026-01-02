/**
 * Unit Tests for Auth Middleware
 */

import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

// Mock Customer model
const mockCustomer = {
  findByPk: jest.fn(),
};

jest.unstable_mockModule('../../models/Customer.js', () => ({
  default: mockCustomer,
}));

// Import middleware after mocking
const { authenticateToken, requireAdmin, requireVerified, optionalAuth } =
  await import('../../middleware/auth.js');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      cookies: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token from cookie', async () => {
      const mockUser = { id: 1, email: 'test@example.com', position: 'user' };
      const token = jwt.sign({ customer: { id: 1 } }, process.env.JWT_SECRET);

      req.cookies.token = token;
      mockCustomer.findByPk.mockResolvedValue(mockUser);

      await authenticateToken(req, res, next);

      expect(mockCustomer.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should authenticate valid token from Authorization header', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const token = jwt.sign({ customer: { id: 1 } }, process.env.JWT_SECRET);

      req.headers.authorization = `Bearer ${token}`;
      mockCustomer.findByPk.mockResolvedValue(mockUser);

      await authenticateToken(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'No token, authorization denied' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      req.cookies.token = 'invalid-token';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Token is not valid' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject token for non-existent user', async () => {
      const token = jwt.sign({ customer: { id: 999 } }, process.env.JWT_SECRET);

      req.cookies.token = token;
      mockCustomer.findByPk.mockResolvedValue(null);

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Token is not valid' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      const token = jwt.sign({ customer: { id: 1 } }, process.env.JWT_SECRET, { expiresIn: '0s' });

      req.cookies.token = token;

      // Wait for token to expire
      await new Promise((resolve) => setTimeout(resolve, 100));

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin users', () => {
      req.user = { id: 1, position: 'admin' };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject non-admin users', () => {
      req.user = { id: 1, position: 'user' };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Access denied. Admin privileges required.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated users', () => {
      req.user = null;

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireVerified', () => {
    it('should allow verified users', () => {
      req.user = { id: 1, isVerified: true };

      requireVerified(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject unverified users', () => {
      req.user = { id: 1, isVerified: false };

      requireVerified(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Please verify your email first' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated users', () => {
      req.user = null;

      requireVerified(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should attach user if valid token provided', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const token = jwt.sign({ customer: { id: 1 } }, process.env.JWT_SECRET);

      req.cookies.token = token;
      mockCustomer.findByPk.mockResolvedValue(mockUser);

      await optionalAuth(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should continue without user if no token', async () => {
      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without user if invalid token', async () => {
      req.cookies.token = 'invalid-token';

      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    it('should handle non-existent user gracefully', async () => {
      const token = jwt.sign({ customer: { id: 999 } }, process.env.JWT_SECRET);

      req.cookies.token = token;
      mockCustomer.findByPk.mockResolvedValue(null);

      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });
  });
});
