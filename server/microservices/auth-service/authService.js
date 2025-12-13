/**
 * AUTH SERVICE
 * Handles authentication, authorization, and user management
 * Microservice architecture implementation
 */

import eventBus, { EventTypes } from '../shared/eventBus.js';
import serviceRegistry, { ServiceNames } from '../shared/serviceRegistry.js';
import Customer from '../../models/Customer.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class AuthService {
  constructor() {
    this.serviceName = ServiceNames.AUTH_SERVICE;
    this.initialize();
  }

  /**
   * Initialize the auth service
   */
  initialize() {
    // Register with service registry
    serviceRegistry.register(this.serviceName, {
      name: this.serviceName,
      version: '1.0.0',
      endpoints: {
        register: '/api/auth/register',
        login: '/api/auth/login',
        verify: '/api/auth/verify-email',
        resetPassword: '/api/auth/reset-password',
      },
    });

    // Subscribe to relevant events
    this.setupEventSubscriptions();

    console.log(`[${this.serviceName}] Service initialized`);
  }

  /**
   * Setup event subscriptions
   */
  setupEventSubscriptions() {
    // Listen for payment success to update user credits
    eventBus.subscribe(EventTypes.PAYMENT_SUCCESS, this.handlePaymentSuccess.bind(this));
  }

  /**
   * Register a new user
   * @param {object} userData - User registration data
   * @returns {object} Created user and token
   */
  async register(userData) {
    try {
      const { username, email, password, fullName, phoneNumber } = userData;

      // Check if user already exists
      const existingUser = await Customer.findOne({
        where: { email },
      });

      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create user
      const user = await Customer.create({
        username,
        email,
        password: hashedPassword,
        fullName,
        phoneNumber,
        verificationToken,
        isVerified: false,
        role: 'customer',
      });

      // Publish event for other services
      eventBus.publish(EventTypes.USER_REGISTERED, {
        userId: user.id,
        email: user.email,
        username: user.username,
        verificationToken,
      });

      // Generate JWT
      const token = this.generateToken(user);

      return {
        success: true,
        user: this.sanitizeUser(user),
        token,
        message: 'Registration successful. Please verify your email.',
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Register error:`, error);
      throw error;
    }
  }

  /**
   * Login user
   * @param {object} credentials - Login credentials
   * @returns {object} User and token
   */
  async login(credentials) {
    try {
      const { email, password } = credentials;

      // Find user
      const user = await Customer.findOne({ where: { email } });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await user.update({ lastLogin: new Date() });

      // Publish event
      eventBus.publish(EventTypes.USER_LOGGED_IN, {
        userId: user.id,
        email: user.email,
        username: user.username,
      });

      // Generate JWT
      const token = this.generateToken(user);

      return {
        success: true,
        user: this.sanitizeUser(user),
        token,
        message: 'Login successful',
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Login error:`, error);
      throw error;
    }
  }

  /**
   * Verify email with token
   * @param {string} token - Verification token
   * @returns {object} Verification result
   */
  async verifyEmail(token) {
    try {
      const user = await Customer.findOne({
        where: { verificationToken: token },
      });

      if (!user) {
        throw new Error('Invalid verification token');
      }

      await user.update({
        isVerified: true,
        verificationToken: null,
      });

      // Publish event
      eventBus.publish(EventTypes.USER_VERIFIED, {
        userId: user.id,
        email: user.email,
      });

      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Verify email error:`, error);
      throw error;
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {object} Reset token
   */
  async requestPasswordReset(email) {
    try {
      const user = await Customer.findOne({ where: { email } });

      if (!user) {
        // Don't reveal if email exists
        return {
          success: true,
          message: 'If email exists, reset link will be sent',
        };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      await user.update({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpiry,
      });

      // Publish event for notification service
      eventBus.publish(EventTypes.PASSWORD_RESET, {
        userId: user.id,
        email: user.email,
        username: user.username,
        resetToken,
      });

      return {
        success: true,
        message: 'Password reset link sent to email',
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Request password reset error:`, error);
      throw error;
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {object} Reset result
   */
  async resetPassword(token, newPassword) {
    try {
      const user = await Customer.findOne({
        where: {
          resetPasswordToken: token,
        },
      });

      if (!user || user.resetPasswordExpires < new Date()) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await user.update({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });

      return {
        success: true,
        message: 'Password reset successful',
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Reset password error:`, error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {object} Decoded token
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Generate JWT token
   * @param {object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '12h' }
    );
  }

  /**
   * Sanitize user object (remove sensitive data)
   * @param {object} user - User object
   * @returns {object} Sanitized user
   */
  sanitizeUser(user) {
    const { password, verificationToken, resetPasswordToken, ...sanitized } = user.toJSON();
    return sanitized;
  }

  /**
   * Event handler: Payment success
   */
  async handlePaymentSuccess(data) {
    console.log(`[${this.serviceName}] Handling payment success for user:`, data.userId);
    // You can update user credits, loyalty points, etc.
  }

  /**
   * Get user by ID (for inter-service communication)
   * @param {number} userId - User ID
   * @returns {object} User object
   */
  async getUserById(userId) {
    try {
      const user = await Customer.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return this.sanitizeUser(user);
    } catch (error) {
      console.error(`[${this.serviceName}] Get user error:`, error);
      throw error;
    }
  }

  /**
   * Health check
   * @returns {object} Service health status
   */
  healthCheck() {
    return {
      service: this.serviceName,
      status: 'healthy',
      timestamp: new Date(),
    };
  }
}

// Singleton instance
const authService = new AuthService();

export default authService;
