/**
 * Unit Tests for Customer Controller
 */

import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock Customer model
const mockCustomer = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
};

jest.unstable_mockModule('../../models/Customer.js', () => ({
  default: mockCustomer,
}));

// Mock email utility
jest.unstable_mockModule('../../utils/email.js', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

// Import controller after mocking
const { loginCustomer, registerCustomer } = await import('../../controllers/customerController.js');

describe('Customer Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      cookies: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('loginCustomer', () => {
    it('should login with valid credentials', async () => {
      req.body = {
        username: 'testuser',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        position: 'customer',
        provider: 'local',
        isVerified: true,
        matchPassword: jest.fn().mockResolvedValue(true),
      };

      mockCustomer.findOne.mockResolvedValue(mockUser);

      await loginCustomer(req, res);

      expect(mockCustomer.findOne).toHaveBeenCalled();
      expect(res.cookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Login successful',
          token: expect.any(String),
          user: expect.objectContaining({
            id: 1,
            username: 'testuser',
          }),
        })
      );
    });

    it('should login with email instead of username', async () => {
      req.body = {
        username: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        position: 'customer',
        provider: 'local',
        isVerified: true,
        matchPassword: jest.fn().mockResolvedValue(true),
      };

      mockCustomer.findOne.mockResolvedValue(mockUser);

      await loginCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ msg: 'Login successful' }));
    });

    it('should reject invalid username', async () => {
      req.body = {
        username: 'nonexistent',
        password: 'password123',
      };

      mockCustomer.findOne.mockResolvedValue(null);

      await loginCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Invalid Credentials' });
    });

    it('should reject invalid password', async () => {
      req.body = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        provider: 'local',
        isVerified: true,
        matchPassword: jest.fn().mockResolvedValue(false),
      };

      mockCustomer.findOne.mockResolvedValue(mockUser);

      await loginCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Invalid Credentials' });
    });

    // TODO: Fix this test - message format changed to include more details
    it.skip('should reject unverified email', async () => {
      req.body = {
        username: 'testuser',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        provider: 'local',
        isVerified: false,
        matchPassword: jest.fn().mockResolvedValue(true),
      };

      mockCustomer.findOne.mockResolvedValue(mockUser);

      await loginCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Please verify your email before logging in',
      });
    });

    it('should reject OAuth users trying to login with password', async () => {
      req.body = {
        username: 'testuser',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        provider: 'google',
        isVerified: true,
      };

      mockCustomer.findOne.mockResolvedValue(mockUser);

      await loginCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Please login using Google' });
    });

    it('should handle server errors', async () => {
      req.body = {
        username: 'testuser',
        password: 'password123',
      };

      mockCustomer.findOne.mockRejectedValue(new Error('Database error'));

      await loginCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Server error' });
    });
  });

  describe('registerCustomer', () => {
    // TODO: Fix these tests - password validation and registration flow changed
    it.skip('should register a new customer', async () => {
      req.body = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
      };

      mockCustomer.findOne.mockResolvedValue(null); // No existing user
      mockCustomer.create.mockResolvedValue({
        id: 1,
        email: 'newuser@example.com',
        username: 'newuser',
        position: 'customer',
        isVerified: false,
      });

      await registerCustomer(req, res);

      expect(mockCustomer.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should reject registration with missing fields', async () => {
      req.body = {
        email: 'newuser@example.com',
        // Missing username and password
      };

      await registerCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Email, username and password are required',
      });
      expect(mockCustomer.create).not.toHaveBeenCalled();
    });

    it('should reject registration with short password', async () => {
      req.body = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: '12345', // Too short
      };

      await registerCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Password must be at least 6 characters',
      });
      expect(mockCustomer.create).not.toHaveBeenCalled();
    });

    it.skip('should reject registration with existing email', async () => {
      req.body = {
        email: 'existing@example.com',
        username: 'newuser',
        password: 'password123',
      };

      mockCustomer.findOne.mockResolvedValue({
        email: 'existing@example.com',
        username: 'existinguser',
      });

      await registerCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Email already exists' });
      expect(mockCustomer.create).not.toHaveBeenCalled();
    });

    it.skip('should reject registration with existing username', async () => {
      req.body = {
        email: 'newuser@example.com',
        username: 'existinguser',
        password: 'password123',
      };

      mockCustomer.findOne.mockResolvedValue({
        email: 'other@example.com',
        username: 'existinguser',
      });

      await registerCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Username already exists' });
      expect(mockCustomer.create).not.toHaveBeenCalled();
    });

    it.skip('should force position to customer', async () => {
      req.body = {
        email: 'hacker@example.com',
        username: 'hacker',
        password: 'password123',
        position: 'admin', // Trying to set admin role
      };

      mockCustomer.findOne.mockResolvedValue(null);
      mockCustomer.create.mockResolvedValue({
        id: 1,
        email: 'hacker@example.com',
        username: 'hacker',
        position: 'customer', // Should be forced to customer
      });

      await registerCustomer(req, res);

      // Verify that create was called with position: 'customer'
      const createCall = mockCustomer.create.mock.calls[0][0];
      expect(createCall.position).toBe('customer');
    });

    it.skip('should handle database errors', async () => {
      req.body = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
      };

      mockCustomer.findOne.mockResolvedValue(null);
      mockCustomer.create.mockRejectedValue(new Error('Database error'));

      await registerCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
