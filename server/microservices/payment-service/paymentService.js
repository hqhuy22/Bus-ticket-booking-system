/**
 * PAYMENT SERVICE
 * Handles payment processing, payment sessions, and payment lifecycle
 * Microservice architecture implementation
 */

import eventBus, { EventTypes } from '../shared/eventBus.js';
import serviceRegistry, { ServiceNames } from '../shared/serviceRegistry.js';
import crypto from 'crypto';

class PaymentService {
  constructor() {
    this.serviceName = ServiceNames.PAYMENT_SERVICE;
    this.paymentSessions = new Map(); // In-memory storage
    this.initialize();
  }

  /**
   * Initialize the payment service
   */
  initialize() {
    // Register with service registry
    serviceRegistry.register(this.serviceName, {
      name: this.serviceName,
      version: '1.0.0',
      endpoints: {
        createPaymentSession: '/api/payments/create-session',
        processPayment: '/api/payments/process',
        getPaymentStatus: '/api/payments/:paymentId/status',
        webhook: '/api/payments/webhook',
      },
    });

    // Subscribe to relevant events
    this.setupEventSubscriptions();

    // Cleanup expired sessions
    this.startSessionCleanup();

    console.log(`[${this.serviceName}] Service initialized`);
  }

  /**
   * Setup event subscriptions
   */
  setupEventSubscriptions() {
    // Listen for booking created to prepare payment
    eventBus.subscribe(EventTypes.BOOKING_CREATED, this.handleBookingCreated.bind(this));

    // Listen for booking cancelled to refund if applicable
    eventBus.subscribe(EventTypes.BOOKING_CANCELLED, this.handleBookingCancelled.bind(this));
  }

  /**
   * Create payment session
   * @param {object} paymentData - Payment session data
   * @returns {object} Payment session
   */
  async createPaymentSession(paymentData) {
    try {
      const { bookingId, amount, currency = 'VND', customerId, returnUrl, cancelUrl } = paymentData;

      // Generate payment ID
      const paymentId = this.generatePaymentId();

      // Create session
      const session = {
        paymentId,
        bookingId,
        amount,
        currency,
        customerId,
        status: 'pending',
        returnUrl,
        cancelUrl,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      };

      // Store session
      this.paymentSessions.set(paymentId, session);

      // Publish event
      eventBus.publish(EventTypes.PAYMENT_INITIATED, {
        paymentId,
        bookingId,
        amount,
        customerId,
      });

      return {
        success: true,
        paymentId,
        paymentUrl: `${process.env.CLIENT_URL}/payment/${paymentId}`,
        expiresAt: session.expiresAt,
        message: 'Payment session created',
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Create payment session error:`, error);
      throw error;
    }
  }

  /**
   * Process payment
   * @param {string} paymentId - Payment ID
   * @param {object} paymentDetails - Payment details (card info, etc.)
   * @returns {object} Payment result
   */
  async processPayment(paymentId, paymentDetails) {
    try {
      // Get payment session
      const session = this.paymentSessions.get(paymentId);

      if (!session) {
        throw new Error('Payment session not found');
      }

      // Check if session expired
      if (new Date() > session.expiresAt) {
        throw new Error('Payment session expired');
      }

      // Validate payment details
      this.validatePaymentDetails(paymentDetails);

      // Simulate payment processing (Sandbox mode)
      const paymentResult = await this.processSandboxPayment(session, paymentDetails);

      if (paymentResult.success) {
        // Update session
        session.status = 'completed';
        session.completedAt = new Date();
        session.paymentReference = this.generatePaymentReference();

        // Publish success event
        eventBus.publish(EventTypes.PAYMENT_SUCCESS, {
          paymentId,
          bookingId: session.bookingId,
          amount: session.amount,
          customerId: session.customerId,
          paymentReference: session.paymentReference,
        });

        return {
          success: true,
          paymentId,
          paymentReference: session.paymentReference,
          message: 'Payment processed successfully',
        };
      } else {
        // Update session
        session.status = 'failed';
        session.failedAt = new Date();
        session.failureReason = paymentResult.reason;

        // Publish failure event
        eventBus.publish(EventTypes.PAYMENT_FAILED, {
          paymentId,
          bookingId: session.bookingId,
          customerId: session.customerId,
          reason: paymentResult.reason,
        });

        throw new Error(paymentResult.reason || 'Payment processing failed');
      }
    } catch (error) {
      console.error(`[${this.serviceName}] Process payment error:`, error);
      throw error;
    }
  }

  /**
   * Get payment status
   * @param {string} paymentId - Payment ID
   * @returns {object} Payment status
   */
  getPaymentStatus(paymentId) {
    try {
      const session = this.paymentSessions.get(paymentId);

      if (!session) {
        throw new Error('Payment session not found');
      }

      return {
        success: true,
        paymentId,
        status: session.status,
        amount: session.amount,
        currency: session.currency,
        bookingId: session.bookingId,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        completedAt: session.completedAt,
        paymentReference: session.paymentReference,
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Get payment status error:`, error);
      throw error;
    }
  }

  /**
   * Process refund
   * @param {string} paymentId - Payment ID
   * @param {number} amount - Refund amount
   * @returns {object} Refund result
   */
  async processRefund(paymentId, amount) {
    try {
      const session = this.paymentSessions.get(paymentId);

      if (!session) {
        throw new Error('Payment session not found');
      }

      if (session.status !== 'completed') {
        throw new Error('Can only refund completed payments');
      }

      // Simulate refund processing
      const refundReference = this.generatePaymentReference();

      // Update session
      session.refundedAmount = (session.refundedAmount || 0) + amount;
      session.refundedAt = new Date();
      session.refundReference = refundReference;

      if (session.refundedAmount >= session.amount) {
        session.status = 'refunded';
      }

      // Publish event
      eventBus.publish(EventTypes.PAYMENT_REFUNDED, {
        paymentId,
        bookingId: session.bookingId,
        amount,
        refundReference,
        customerId: session.customerId,
      });

      return {
        success: true,
        refundReference,
        refundedAmount: session.refundedAmount,
        message: 'Refund processed successfully',
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Process refund error:`, error);
      throw error;
    }
  }

  /**
   * Validate payment details
   * @param {object} paymentDetails - Payment details
   */
  validatePaymentDetails(paymentDetails) {
    const { cardNumber, cvv, expiryDate } = paymentDetails;

    // Card number validation (16 digits)
    if (!/^\d{16}$/.test(cardNumber)) {
      throw new Error('Invalid card number (must be 16 digits)');
    }

    // CVV validation (3-4 digits)
    if (!/^\d{3,4}$/.test(cvv)) {
      throw new Error('Invalid CVV (must be 3-4 digits)');
    }

    // Expiry date validation (MM/YY format)
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      throw new Error('Invalid expiry date (use MM/YY format)');
    }

    // Check if card expired
    const [month, year] = expiryDate.split('/');
    const expiry = new Date(2000 + parseInt(year), parseInt(month));
    if (expiry < new Date()) {
      throw new Error('Card has expired');
    }
  }

  /**
   * Process sandbox payment (simulation)
   * @param {object} session - Payment session
   * @param {object} paymentDetails - Payment details
   * @returns {object} Payment result
   */
  async processSandboxPayment(session, paymentDetails) {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate success/failure based on card number
    // Cards ending in 0000 will fail
    const lastFourDigits = paymentDetails.cardNumber.slice(-4);

    if (lastFourDigits === '0000') {
      return {
        success: false,
        reason: 'Card declined by issuer',
      };
    }

    // All other cards succeed
    return {
      success: true,
    };
  }

  /**
   * Generate payment ID
   * @returns {string} Payment ID
   */
  generatePaymentId() {
    return `PAY${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  /**
   * Generate payment reference
   * @returns {string} Payment reference
   */
  generatePaymentReference() {
    return `REF${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  }

  /**
   * Cleanup expired payment sessions
   */
  startSessionCleanup() {
    setInterval(() => {
      const now = new Date();
      for (const [paymentId, session] of this.paymentSessions.entries()) {
        if (session.expiresAt < now && session.status === 'pending') {
          this.paymentSessions.delete(paymentId);
          console.log(`[${this.serviceName}] Cleaned up expired session: ${paymentId}`);
        }
      }
    }, 60 * 1000); // Every minute
  }

  /**
   * Event handler: Booking created
   */
  async handleBookingCreated(data) {
    console.log(`[${this.serviceName}] Booking created, ready for payment:`, data.bookingId);
    // Payment session will be created when user initiates payment
  }

  /**
   * Event handler: Booking cancelled
   */
  async handleBookingCancelled(data) {
    console.log(`[${this.serviceName}] Booking cancelled:`, data.bookingId);
    // Check if payment was made and process refund if applicable
    for (const [paymentId, session] of this.paymentSessions.entries()) {
      if (session.bookingId === data.bookingId && session.status === 'completed') {
        console.log(`[${this.serviceName}] Processing refund for cancelled booking`);
        // Auto-refund logic can be added here
      }
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
      activeSessions: this.paymentSessions.size,
      timestamp: new Date(),
    };
  }
}

// Singleton instance
const paymentService = new PaymentService();

export default paymentService;

// Export payment sessions for backward compatibility with existing controller
export const paymentSessions = paymentService.paymentSessions;
