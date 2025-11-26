import BusBooking from '../models/busBooking.js';
import Customer from '../models/Customer.js';
import sequelize from '../config/postgres.js';
import crypto from 'crypto';

/**
 * SANDBOX PAYMENT GATEWAY CONTROLLER
 * This simulates a payment gateway integration without using real payment services
 * In production, replace this with actual payment gateway (PayOS, Stripe, etc.)
 */

// In-memory payment session store (use Redis in production)
// Export so confirmBooking can validate payment success
export const paymentSessions = new Map();

/**
 * Create payment session
 * POST /api/payments/create
 */
export const createPaymentSession = async (req, res) => {
  try {
    const { bookingId, isGuest = false } = req.body;
    const customerId = isGuest ? null : req.user?.id;

    // Validate booking
    const whereClause = { id: bookingId };
    if (!isGuest && customerId) {
      whereClause.customerId = customerId;
    }

    const booking = await BusBooking.findOne({ where: whereClause });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        message: `Cannot process payment for booking with status: ${booking.status}`,
      });
    }

    // Check if booking has expired
    if (booking.expiresAt && new Date() > booking.expiresAt) {
      booking.status = 'expired';
      await booking.save();
      return res.status(400).json({ message: 'Booking has expired. Please create a new booking.' });
    }

    // Generate unique payment session
    const paymentId = `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const paymentSession = {
      paymentId,
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      amount: parseFloat(booking.payment_totalPay),
      currency: 'VND',
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      isGuest,
      customerId: booking.customerId,
      // Booking details for payment page
      bookingDetails: {
        departure: booking.departure,
        arrival: booking.arrival,
        journeyDate: booking.journeyDate,
        seatNumbers: booking.seatNumbers,
        passengers: booking.passengers,
        payment_busFare: booking.payment_busFare,
        payment_convenienceFee: booking.payment_convenienceFee,
        payment_bankCharge: booking.payment_bankCharge,
        payment_totalPay: booking.payment_totalPay,
      },
    };

    // Store session (use Redis in production)
    paymentSessions.set(paymentId, paymentSession);

    // Auto-cleanup expired session after 10 minutes
    setTimeout(
      () => {
        paymentSessions.delete(paymentId);
      },
      10 * 60 * 1000
    );

    res.status(201).json({
      message: 'Payment session created',
      paymentId,
      paymentUrl: `${process.env.CLIENT_URL}/bus-booking/payment?paymentId=${paymentId}`,
      amount: paymentSession.amount,
      currency: paymentSession.currency,
      expiresAt: paymentSession.expiresAt,
    });
  } catch (error) {
    console.error('Create payment session error:', error);
    res.status(500).json({
      message: 'Error creating payment session',
      error: error.message,
    });
  }
};

/**
 * Get payment session details
 * GET /api/payments/:paymentId
 */
export const getPaymentSession = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const session = paymentSessions.get(paymentId);

    if (!session) {
      return res.status(404).json({ message: 'Payment session not found or expired' });
    }

    // Check if session expired
    if (new Date() > session.expiresAt) {
      paymentSessions.delete(paymentId);
      return res.status(400).json({ message: 'Payment session has expired' });
    }

    res.status(200).json({ session });
  } catch (error) {
    console.error('Get payment session error:', error);
    res.status(500).json({
      message: 'Error retrieving payment session',
      error: error.message,
    });
  }
};

/**
 * Process sandbox payment (simulates payment gateway)
 * POST /api/payments/process
 */
export const processSandboxPayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      paymentId,
      cardNumber,
      cardType,
      expiryMonth,
      expiryYear,
      cvv,
      simulateFailure = false, // For testing failure scenarios
    } = req.body;

    console.log('💳 Processing payment:', { paymentId, cardNumber, cardType });

    // Get payment session
    const session = paymentSessions.get(paymentId);

    if (!session) {
      console.log('❌ Payment session not found:', paymentId);
      return res.status(404).json({
        message: 'Payment session not found or expired',
        code: 'SESSION_NOT_FOUND',
      });
    }

    console.log('📋 Payment session found:', {
      status: session.status,
      bookingId: session.bookingId,
    });

    // Check session expiry
    if (new Date() > session.expiresAt) {
      paymentSessions.delete(paymentId);
      return res.status(400).json({
        message: 'Payment session has expired',
        code: 'SESSION_EXPIRED',
      });
    }

    // Validate card details (basic validation)
    if (!cardNumber || !cardType || !expiryMonth || !expiryYear || !cvv) {
      return res.status(400).json({
        message: 'Invalid card details',
        code: 'INVALID_CARD',
      });
    }

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // SANDBOX: Simulate payment failure for testing
    if (simulateFailure || cardNumber === '0000000000000000') {
      console.log('🔴 PAYMENT FAILED - Card:', cardNumber, 'Session:', paymentId);

      // Delete the pending booking since payment failed
      const booking = await BusBooking.findByPk(session.bookingId, { transaction: t });
      if (booking && booking.status === 'pending') {
        console.log('🗑️ Deleting failed booking:', booking.id);

        // Just delete the booking - seat locks will auto-expire after 15 minutes
        await booking.destroy({ transaction: t });
      }

      await t.commit();

      // Update session status
      session.status = 'failed';
      session.failureReason = 'Insufficient funds';
      paymentSessions.set(paymentId, session);

      return res.status(400).json({
        message: 'Payment failed',
        code: 'PAYMENT_FAILED',
        reason: session.failureReason,
      });
    }

    // Get booking to validate it exists and is pending
    const booking = await BusBooking.findByPk(session.bookingId, { transaction: t });

    if (!booking) {
      await t.rollback();
      return res.status(404).json({
        message: 'Booking not found',
        code: 'BOOKING_NOT_FOUND',
      });
    }

    if (booking.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({
        message: `Cannot process payment for booking with status: ${booking.status}`,
        code: 'INVALID_BOOKING_STATUS',
      });
    }

    // Generate payment reference
    const paymentReference = `PAYR-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // DON'T update booking status here - let confirmBooking endpoint do that
    // Just mark payment as successful

    // Update payment session
    session.status = 'success';
    session.paymentReference = paymentReference;
    session.completedAt = new Date();

    // Store session with BOTH paymentId and paymentReference as keys
    // This allows lookup by either identifier
    paymentSessions.set(paymentId, session);
    paymentSessions.set(paymentReference, session);

    await t.commit();

    console.log('✅ PAYMENT SUCCESS - Ref:', paymentReference, 'Booking:', booking.id);

    // Send confirmation via webhook simulation (async, non-blocking)
    setTimeout(async () => {
      try {
        await simulateWebhookCallback(paymentId, 'success', {
          paymentReference,
          bookingId: booking.id,
          bookingReference: booking.bookingReference,
          amount: session.amount,
        });
      } catch (webhookError) {
        console.error('Webhook simulation error:', webhookError);
      }
    }, 500);

    res.status(200).json({
      message: 'Payment processed successfully',
      paymentId,
      paymentReference,
      bookingReference: booking.bookingReference,
      status: 'success',
    });
  } catch (error) {
    await t.rollback();
    console.error('Process payment error:', error);
    res.status(500).json({
      message: 'Error processing payment',
      error: error.message,
      code: 'PROCESSING_ERROR',
    });
  }
};

/**
 * Payment webhook handler
 * POST /api/payments/webhook
 * This endpoint receives payment status updates from payment gateway
 */
export const handlePaymentWebhook = async (req, res) => {
  try {
    const {
      paymentId,
      status,
      paymentReference,
      bookingId,
      amount,
      timestamp,
      signature, // In production, verify webhook signature
    } = req.body;

    console.log('[Payment Webhook] Received:', { paymentId, status, bookingId, paymentReference });

    // In production: Verify webhook signature to ensure it's from payment gateway
    // const isValid = verifyWebhookSignature(req.body, signature);
    // if (!isValid) {
    //   return res.status(401).json({ message: 'Invalid webhook signature' });
    // }

    const session = paymentSessions.get(paymentId);

    if (!session) {
      console.warn('[Payment Webhook] Session not found:', paymentId);
      // Still return 200 to prevent gateway retries
      return res.status(200).json({ message: 'Webhook received' });
    }

    // Handle different payment statuses
    if (status === 'success' || status === 'completed') {
      session.status = 'success';
      session.paymentReference = paymentReference;
      session.completedAt = new Date();
      paymentSessions.set(paymentId, session);

      console.log('[Payment Webhook] Payment successful:', paymentId);

      // Trigger any post-payment processing (emails, notifications, etc.)
      // This is already handled in confirmBooking endpoint
    } else if (status === 'failed' || status === 'cancelled') {
      session.status = 'failed';
      session.failureReason = req.body.reason || 'Payment failed';
      paymentSessions.set(paymentId, session);

      console.log('[Payment Webhook] Payment failed:', paymentId, session.failureReason);
    }

    // Acknowledge webhook receipt
    res.status(200).json({
      message: 'Webhook processed successfully',
      received: true,
    });
  } catch (error) {
    console.error('Webhook handling error:', error);
    // Return 200 to prevent gateway retries even on error
    res.status(200).json({
      message: 'Webhook received with errors',
      error: error.message,
    });
  }
};

/**
 * Cancel payment session
 * POST /api/payments/:paymentId/cancel
 */
export const cancelPaymentSession = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const session = paymentSessions.get(paymentId);

    if (!session) {
      return res.status(404).json({ message: 'Payment session not found' });
    }

    session.status = 'cancelled';
    session.cancelledAt = new Date();
    paymentSessions.set(paymentId, session);

    res.status(200).json({
      message: 'Payment session cancelled',
      paymentId,
    });
  } catch (error) {
    console.error('Cancel payment error:', error);
    res.status(500).json({
      message: 'Error cancelling payment',
      error: error.message,
    });
  }
};

/**
 * Helper: Simulate webhook callback (for sandbox testing)
 */
const simulateWebhookCallback = async (paymentId, status, data) => {
  console.log('[Webhook Simulation]', { paymentId, status, data });

  // In production, this would be an actual HTTP callback from payment gateway
  // For sandbox, we just log it

  // You could also trigger internal event handlers here
  return { received: true };
};

/**
 * Get payment status
 * GET /api/payments/:paymentId/status
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const session = paymentSessions.get(paymentId);

    if (!session) {
      return res.status(404).json({
        message: 'Payment session not found',
        status: 'not_found',
      });
    }

    res.status(200).json({
      paymentId: session.paymentId,
      status: session.status,
      amount: session.amount,
      currency: session.currency,
      bookingReference: session.bookingReference,
      paymentReference: session.paymentReference,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      message: 'Error retrieving payment status',
      error: error.message,
    });
  }
};
