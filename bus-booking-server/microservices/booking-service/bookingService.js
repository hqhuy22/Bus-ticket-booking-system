/**
 * BOOKING SERVICE
 * Handles bus bookings, seat management, and booking lifecycle
 * Microservice architecture implementation
 */

import eventBus, { EventTypes } from '../shared/eventBus.js';
import serviceRegistry, { ServiceNames } from '../shared/serviceRegistry.js';
import BusBooking from '../../models/busBooking.js';
import BusSchedule from '../../models/busSchedule.js';
import SeatLock from '../../models/SeatLock.js';
import sequelize from '../../config/postgres.js';

class BookingService {
  constructor() {
    this.serviceName = ServiceNames.BOOKING_SERVICE;
    this.initialize();
  }

  /**
   * Initialize the booking service
   */
  initialize() {
    // Register with service registry
    serviceRegistry.register(this.serviceName, {
      name: this.serviceName,
      version: '1.0.0',
      endpoints: {
        createBooking: '/api/bookings',
        getBookings: '/api/bookings/my-bookings',
        cancelBooking: '/api/bookings/:id/cancel',
        confirmBooking: '/api/bookings/:id/confirm',
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
    // Listen for payment success to confirm booking
    eventBus.subscribe(EventTypes.PAYMENT_SUCCESS, this.handlePaymentSuccess.bind(this));

    // Listen for payment failure to release seats
    eventBus.subscribe(EventTypes.PAYMENT_FAILED, this.handlePaymentFailed.bind(this));
  }

  /**
   * Create a new booking
   * @param {object} bookingData - Booking data
   * @returns {object} Created booking
   */
  async createBooking(bookingData) {
    const transaction = await sequelize.transaction();

    try {
      const {
        customerId,
        scheduleId,
        passengers,
        seatNumbers,
        totalPrice,
        isGuest,
        guestEmail,
        guestName,
        guestPhone,
      } = bookingData;

      // Validate schedule exists
      const schedule = await BusSchedule.findByPk(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      // Check seat availability
      const availableSeats = await this.checkSeatAvailability(scheduleId, seatNumbers);
      if (!availableSeats) {
        throw new Error('One or more seats are not available');
      }

      // Generate booking reference
      const bookingReference = this.generateBookingReference();

      // Create booking
      const booking = await BusBooking.create(
        {
          customerId: isGuest ? null : customerId,
          scheduleId,
          passengers,
          seatNumbers,
          totalPrice,
          bookingReference,
          status: 'pending',
          paymentStatus: 'pending',
          isGuest,
          guestEmail,
          guestName,
          guestPhone,
        },
        { transaction }
      );

      // Lock seats
      await this.lockSeats(scheduleId, seatNumbers, booking.id, transaction);

      await transaction.commit();

      // Publish event
      eventBus.publish(EventTypes.BOOKING_CREATED, {
        bookingId: booking.id,
        customerId,
        scheduleId,
        seatNumbers,
        totalPrice,
        bookingReference,
        isGuest,
        guestEmail: isGuest ? guestEmail : null,
      });

      return {
        success: true,
        booking: booking.toJSON(),
        message: 'Booking created successfully',
      };
    } catch (error) {
      await transaction.rollback();
      console.error(`[${this.serviceName}] Create booking error:`, error);
      throw error;
    }
  }

  /**
   * Confirm a booking
   * @param {number} bookingId - Booking ID
   * @param {object} confirmData - Confirmation data
   * @returns {object} Updated booking
   */
  async confirmBooking(bookingId, confirmData = {}) {
    try {
      const booking = await BusBooking.findByPk(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status === 'confirmed') {
        throw new Error('Booking already confirmed');
      }

      // Update booking status
      await booking.update({
        status: 'confirmed',
        paymentStatus: 'paid',
        confirmedAt: new Date(),
      });

      // Publish event
      eventBus.publish(EventTypes.BOOKING_CONFIRMED, {
        bookingId: booking.id,
        customerId: booking.customerId,
        scheduleId: booking.scheduleId,
        seatNumbers: booking.seatNumbers,
        bookingReference: booking.bookingReference,
        isGuest: booking.isGuest,
        guestEmail: booking.guestEmail,
      });

      return {
        success: true,
        booking: booking.toJSON(),
        message: 'Booking confirmed successfully',
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Confirm booking error:`, error);
      throw error;
    }
  }

  /**
   * Cancel a booking
   * @param {number} bookingId - Booking ID
   * @param {number} userId - User ID requesting cancellation
   * @returns {object} Cancelled booking
   */
  async cancelBooking(bookingId, userId) {
    const transaction = await sequelize.transaction();

    try {
      const booking = await BusBooking.findByPk(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Check authorization
      if (!booking.isGuest && booking.customerId !== userId) {
        throw new Error('Unauthorized to cancel this booking');
      }

      if (booking.status === 'cancelled') {
        throw new Error('Booking already cancelled');
      }

      // Update booking status
      await booking.update(
        {
          status: 'cancelled',
          cancelledAt: new Date(),
        },
        { transaction }
      );

      // Release seats
      await this.releaseSeats(booking.scheduleId, booking.seatNumbers, transaction);

      await transaction.commit();

      // Publish event
      eventBus.publish(EventTypes.BOOKING_CANCELLED, {
        bookingId: booking.id,
        customerId: booking.customerId,
        scheduleId: booking.scheduleId,
        seatNumbers: booking.seatNumbers,
        bookingReference: booking.bookingReference,
        isGuest: booking.isGuest,
        guestEmail: booking.guestEmail,
      });

      return {
        success: true,
        booking: booking.toJSON(),
        message: 'Booking cancelled successfully',
      };
    } catch (error) {
      await transaction.rollback();
      console.error(`[${this.serviceName}] Cancel booking error:`, error);
      throw error;
    }
  }

  /**
   * Get user's bookings
   * @param {number} userId - User ID
   * @param {object} options - Query options
   * @returns {object} User's bookings
   */
  async getUserBookings(userId, options = {}) {
    try {
      const { status, limit = 10, offset = 0 } = options;

      const where = { customerId: userId };
      if (status) {
        where.status = status;
      }

      const bookings = await BusBooking.findAndCountAll({
        where,
        include: [{ model: BusSchedule, as: 'schedule' }],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return {
        success: true,
        bookings: bookings.rows,
        total: bookings.count,
        limit,
        offset,
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Get user bookings error:`, error);
      throw error;
    }
  }

  /**
   * Get booking by reference
   * @param {string} bookingReference - Booking reference
   * @returns {object} Booking
   */
  async getBookingByReference(bookingReference) {
    try {
      const booking = await BusBooking.findOne({
        where: { bookingReference },
        include: [{ model: BusSchedule, as: 'schedule' }],
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      return {
        success: true,
        booking: booking.toJSON(),
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Get booking by reference error:`, error);
      throw error;
    }
  }

  /**
   * Check seat availability
   * @param {number} scheduleId - Schedule ID
   * @param {array} seatNumbers - Seat numbers to check
   * @returns {boolean} Are seats available
   */
  async checkSeatAvailability(scheduleId, seatNumbers) {
    try {
      const now = new Date();

      for (const seatNumber of seatNumbers) {
        // Check if seat is locked
        const lock = await SeatLock.findOne({
          where: {
            scheduleId,
            seatNumber,
            expiresAt: { [sequelize.Sequelize.Op.gt]: now },
          },
        });

        if (lock) {
          return false;
        }

        // Check if seat is booked
        const booking = await BusBooking.findOne({
          where: {
            scheduleId,
            seatNumbers: { [sequelize.Sequelize.Op.contains]: [seatNumber] },
            status: ['confirmed', 'pending'],
          },
        });

        if (booking) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(`[${this.serviceName}] Check seat availability error:`, error);
      return false;
    }
  }

  /**
   * Lock seats for a booking
   * @param {number} scheduleId - Schedule ID
   * @param {array} seatNumbers - Seat numbers
   * @param {number} bookingId - Booking ID
   * @param {object} transaction - Database transaction
   */
  async lockSeats(scheduleId, seatNumbers, bookingId, transaction) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    for (const seatNumber of seatNumbers) {
      await SeatLock.create(
        {
          scheduleId,
          seatNumber,
          bookingId,
          expiresAt,
        },
        { transaction }
      );
    }
  }

  /**
   * Release seats
   * @param {number} scheduleId - Schedule ID
   * @param {array} seatNumbers - Seat numbers
   * @param {object} transaction - Database transaction
   */
  async releaseSeats(scheduleId, seatNumbers, transaction) {
    await SeatLock.destroy({
      where: {
        scheduleId,
        seatNumber: seatNumbers,
      },
      transaction,
    });
  }

  /**
   * Generate unique booking reference
   * @returns {string} Booking reference
   */
  generateBookingReference() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BK${timestamp}${random}`;
  }

  /**
   * Event handler: Payment success
   */
  async handlePaymentSuccess(data) {
    console.log(`[${this.serviceName}] Handling payment success for booking:`, data.bookingId);
    try {
      await this.confirmBooking(data.bookingId, data);
    } catch (error) {
      console.error(`[${this.serviceName}] Error confirming booking after payment:`, error);
    }
  }

  /**
   * Event handler: Payment failed
   */
  async handlePaymentFailed(data) {
    console.log(`[${this.serviceName}] Handling payment failure for booking:`, data.bookingId);
    try {
      const booking = await BusBooking.findByPk(data.bookingId);
      if (booking && booking.status === 'pending') {
        await this.cancelBooking(booking.id, booking.customerId);
      }
    } catch (error) {
      console.error(`[${this.serviceName}] Error cancelling booking after payment failure:`, error);
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
const bookingService = new BookingService();

export default bookingService;
