/**
 * NOTIFICATION SERVICE
 * Handles all notifications: email, SMS, push notifications
 * Microservice architecture implementation
 */

import eventBus, { EventTypes } from '../shared/eventBus.js';
import serviceRegistry, { ServiceNames } from '../shared/serviceRegistry.js';
import { sendEmail } from '../../utils/email.js';
import NotificationPreferences from '../../models/NotificationPreferences.js';
import Customer from '../../models/Customer.js';
import BusBooking from '../../models/busBooking.js';
import BusSchedule from '../../models/busSchedule.js';

class NotificationService {
  constructor() {
    this.serviceName = ServiceNames.NOTIFICATION_SERVICE;
    this.initialize();
  }

  /**
   * Initialize the notification service
   */
  initialize() {
    // Register with service registry
    serviceRegistry.register(this.serviceName, {
      name: this.serviceName,
      version: '1.0.0',
      endpoints: {
        sendEmail: '/api/notifications/email',
        sendSMS: '/api/notifications/sms',
        getPreferences: '/api/notification-preferences',
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
    // User events
    eventBus.subscribe(EventTypes.USER_REGISTERED, this.handleUserRegistered.bind(this));
    eventBus.subscribe(EventTypes.USER_VERIFIED, this.handleUserVerified.bind(this));
    eventBus.subscribe(EventTypes.PASSWORD_RESET, this.handlePasswordReset.bind(this));

    // Booking events
    eventBus.subscribe(EventTypes.BOOKING_CREATED, this.handleBookingCreated.bind(this));
    eventBus.subscribe(EventTypes.BOOKING_CONFIRMED, this.handleBookingConfirmed.bind(this));
    eventBus.subscribe(EventTypes.BOOKING_CANCELLED, this.handleBookingCancelled.bind(this));

    // Payment events
    eventBus.subscribe(EventTypes.PAYMENT_SUCCESS, this.handlePaymentSuccess.bind(this));
    eventBus.subscribe(EventTypes.PAYMENT_FAILED, this.handlePaymentFailed.bind(this));
  }

  /**
   * Send email notification
   * @param {object} emailData - Email data
   * @returns {object} Send result
   */
  async sendEmailNotification(emailData) {
    try {
      const { to, subject, html, text } = emailData;

      await sendEmail({ to, subject, html, text });

      // Publish event
      eventBus.publish(EventTypes.EMAIL_SENT, {
        to,
        subject,
        sentAt: new Date(),
      });

      return {
        success: true,
        message: 'Email sent successfully',
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Send email error:`, error);

      // Publish failure event
      eventBus.publish(EventTypes.EMAIL_FAILED, {
        to: emailData.to,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Check if notification is enabled for user
   * @param {number} customerId - Customer ID
   * @param {string} notificationType - Type of notification
   * @returns {boolean} Is enabled
   */
  async isNotificationEnabled(customerId, notificationType) {
    try {
      if (!customerId) return true; // Guest users get all notifications

      const preferences = await NotificationPreferences.findOne({
        where: { customerId },
      });

      if (!preferences) return true; // Default to enabled

      return preferences[notificationType] !== false;
    } catch (error) {
      console.error(`[${this.serviceName}] Check notification preference error:`, error);
      return true; // Default to enabled on error
    }
  }

  /**
   * Event handler: User registered
   */
  async handleUserRegistered(data) {
    console.log(`[${this.serviceName}] Sending verification email to:`, data.email);

    try {
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${data.verificationToken}`;

      await this.sendEmailNotification({
        to: data.email,
        subject: 'Verify Your Email - Bus Booking System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Bus Booking System!</h2>
            <p>Hi ${data.username},</p>
            <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
            <p>
              <a href="${verificationUrl}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Verify Email
              </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p>${verificationUrl}</p>
            <p>If you didn't register for this account, please ignore this email.</p>
            <p>Best regards,<br>Bus Booking Team</p>
          </div>
        `,
      });

      // Create default notification preferences
      await NotificationPreferences.findOrCreate({
        where: { customerId: data.userId },
        defaults: {
          customerId: data.userId,
          emailBookingConfirmation: true,
          emailTripReminders: true,
          emailCancellations: true,
        },
      });
    } catch (error) {
      console.error(`[${this.serviceName}] Error sending verification email:`, error);
    }
  }

  /**
   * Event handler: User verified
   */
  async handleUserVerified(data) {
    console.log(`[${this.serviceName}] User verified:`, data.email);

    try {
      await this.sendEmailNotification({
        to: data.email,
        subject: 'Email Verified Successfully',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verified!</h2>
            <p>Your email has been successfully verified.</p>
            <p>You can now enjoy all features of our Bus Booking System.</p>
            <p>Best regards,<br>Bus Booking Team</p>
          </div>
        `,
      });
    } catch (error) {
      console.error(`[${this.serviceName}] Error sending verification success email:`, error);
    }
  }

  /**
   * Event handler: Password reset
   */
  async handlePasswordReset(data) {
    console.log(`[${this.serviceName}] Sending password reset email to:`, data.email);

    try {
      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${data.resetToken}`;

      await this.sendEmailNotification({
        to: data.email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Hi ${data.username},</p>
            <p>We received a request to reset your password. Click the link below to reset it:</p>
            <p>
              <a href="${resetUrl}" 
                 style="background-color: #2196F3; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br>Bus Booking Team</p>
          </div>
        `,
      });
    } catch (error) {
      console.error(`[${this.serviceName}] Error sending password reset email:`, error);
    }
  }

  /**
   * Event handler: Booking created
   */
  async handleBookingCreated(data) {
    console.log(`[${this.serviceName}] Booking created notification:`, data.bookingReference);

    try {
      // For guest bookings, use guest email
      if (data.isGuest) {
        await this.sendEmailNotification({
          to: data.guestEmail,
          subject: 'Booking Created - Pending Payment',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Booking Created Successfully</h2>
              <p>Your booking reference: <strong>${data.bookingReference}</strong></p>
              <p>Total Amount: ${data.totalPrice.toLocaleString('vi-VN')} VND</p>
              <p>Status: Pending Payment</p>
              <p>Please complete your payment within 10 minutes to confirm your booking.</p>
              <p>Best regards,<br>Bus Booking Team</p>
            </div>
          `,
        });
        return;
      }

      // For authenticated users, check preferences
      const emailEnabled = await this.isNotificationEnabled(
        data.customerId,
        'emailBookingConfirmation'
      );

      if (!emailEnabled) {
        console.log(
          `[${this.serviceName}] Email notifications disabled for user:`,
          data.customerId
        );
        return;
      }

      const user = await Customer.findByPk(data.customerId);
      if (!user) return;

      await this.sendEmailNotification({
        to: user.email,
        subject: 'Booking Created - Pending Payment',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Booking Created Successfully</h2>
            <p>Hi ${user.username},</p>
            <p>Your booking reference: <strong>${data.bookingReference}</strong></p>
            <p>Total Amount: ${data.totalPrice.toLocaleString('vi-VN')} VND</p>
            <p>Status: Pending Payment</p>
            <p>Please complete your payment within 10 minutes to confirm your booking.</p>
            <p>Best regards,<br>Bus Booking Team</p>
          </div>
        `,
      });
    } catch (error) {
      console.error(`[${this.serviceName}] Error sending booking created email:`, error);
    }
  }

  /**
   * Event handler: Booking confirmed
   */
  async handleBookingConfirmed(data) {
    console.log(`[${this.serviceName}] Booking confirmed notification:`, data.bookingReference);

    try {
      // Get booking details
      const booking = await BusBooking.findByPk(data.bookingId, {
        include: [{ model: BusSchedule, as: 'schedule' }],
      });

      if (!booking) return;

      // For guest bookings
      if (data.isGuest) {
        await this.sendEmailNotification({
          to: data.guestEmail,
          subject: 'Booking Confirmed - E-Ticket Ready',
          html: this.generateBookingConfirmationEmail(booking, null),
        });
        return;
      }

      // For authenticated users
      const emailEnabled = await this.isNotificationEnabled(
        data.customerId,
        'emailBookingConfirmation'
      );

      if (!emailEnabled) return;

      const user = await Customer.findByPk(data.customerId);
      if (!user) return;

      await this.sendEmailNotification({
        to: user.email,
        subject: 'Booking Confirmed - E-Ticket Ready',
        html: this.generateBookingConfirmationEmail(booking, user),
      });
    } catch (error) {
      console.error(`[${this.serviceName}] Error sending booking confirmed email:`, error);
    }
  }

  /**
   * Event handler: Booking cancelled
   */
  async handleBookingCancelled(data) {
    console.log(`[${this.serviceName}] Booking cancelled notification:`, data.bookingReference);

    try {
      // For guest bookings
      if (data.isGuest) {
        await this.sendEmailNotification({
          to: data.guestEmail,
          subject: 'Booking Cancelled',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Booking Cancelled</h2>
              <p>Your booking (${data.bookingReference}) has been cancelled.</p>
              <p>If you made a payment, a refund will be processed within 3-5 business days.</p>
              <p>Best regards,<br>Bus Booking Team</p>
            </div>
          `,
        });
        return;
      }

      // For authenticated users
      const emailEnabled = await this.isNotificationEnabled(data.customerId, 'emailCancellations');

      if (!emailEnabled) return;

      const user = await Customer.findByPk(data.customerId);
      if (!user) return;

      await this.sendEmailNotification({
        to: user.email,
        subject: 'Booking Cancelled',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Booking Cancelled</h2>
            <p>Hi ${user.username},</p>
            <p>Your booking (${data.bookingReference}) has been cancelled.</p>
            <p>If you made a payment, a refund will be processed within 3-5 business days.</p>
            <p>Best regards,<br>Bus Booking Team</p>
          </div>
        `,
      });
    } catch (error) {
      console.error(`[${this.serviceName}] Error sending booking cancelled email:`, error);
    }
  }

  /**
   * Event handler: Payment success
   */
  async handlePaymentSuccess(data) {
    console.log(`[${this.serviceName}] Payment success notification:`, data.paymentReference);
    // Booking confirmed handler will send the email
  }

  /**
   * Event handler: Payment failed
   */
  async handlePaymentFailed(data) {
    console.log(`[${this.serviceName}] Payment failed notification`);

    try {
      const booking = await BusBooking.findByPk(data.bookingId);
      if (!booking) return;

      const emailTo = booking.isGuest ? booking.guestEmail : null;

      if (!emailTo && booking.customerId) {
        const user = await Customer.findByPk(booking.customerId);
        if (user) {
          await this.sendEmailNotification({
            to: user.email,
            subject: 'Payment Failed',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Payment Failed</h2>
                <p>Hi ${user.username},</p>
                <p>Unfortunately, your payment could not be processed.</p>
                <p>Reason: ${data.reason || 'Unknown error'}</p>
                <p>Please try again or use a different payment method.</p>
                <p>Best regards,<br>Bus Booking Team</p>
              </div>
            `,
          });
        }
      } else if (emailTo) {
        await this.sendEmailNotification({
          to: emailTo,
          subject: 'Payment Failed',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Payment Failed</h2>
              <p>Unfortunately, your payment could not be processed.</p>
              <p>Reason: ${data.reason || 'Unknown error'}</p>
              <p>Please try again or use a different payment method.</p>
              <p>Best regards,<br>Bus Booking Team</p>
            </div>
          `,
        });
      }
    } catch (error) {
      console.error(`[${this.serviceName}] Error sending payment failed email:`, error);
    }
  }

  /**
   * Generate booking confirmation email HTML
   * @param {object} booking - Booking object
   * @param {object} user - User object (null for guest)
   * @returns {string} HTML email
   */
  generateBookingConfirmationEmail(booking, user) {
    const userName = user ? user.username : booking.guestName;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">✓ Booking Confirmed!</h2>
        <p>Hi ${userName},</p>
        <p>Your bus booking has been confirmed. Here are your booking details:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details</h3>
          <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
          <p><strong>Seats:</strong> ${booking.seatNumbers.join(', ')}</p>
          <p><strong>Total Amount:</strong> ${booking.totalPrice.toLocaleString('vi-VN')} VND</p>
          <p><strong>Status:</strong> Confirmed</p>
        </div>
        
        <p>Your e-ticket is ready. You can download it from your booking details page.</p>
        
        <p>
          <a href="${process.env.CLIENT_URL}/bus-booking/my-bookings" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            View My Bookings
          </a>
        </p>
        
        <p>Have a safe journey!</p>
        <p>Best regards,<br>Bus Booking Team</p>
      </div>
    `;
  }

  /**
   * Health check
   * @returns {object} Service health status
   */
  healthCheck() {
    return {
      service: this.serviceName,
      status: 'healthy',
      emailProvider: process.env.EMAIL_PROVIDER || 'not configured',
      timestamp: new Date(),
    };
  }
}

// Singleton instance
const notificationService = new NotificationService();

export default notificationService;
