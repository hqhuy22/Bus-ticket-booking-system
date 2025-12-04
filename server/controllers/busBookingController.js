import BusBooking from '../models/busBooking.js';
import BusSchedule from '../models/busSchedule.js';
import Route from '../models/Route.js';
import SeatLock from '../models/SeatLock.js';
import Customer from '../models/Customer.js';
import sequelize from '../config/postgres.js';
import { Op } from 'sequelize';
import { generateBookingReference, isValidBookingReference } from '../utils/bookingReference.js';
import {
  sendBookingConfirmation,
  sendGuestLookupVerification,
  sendBookingCancellation,
  sendTripReminder,
} from '../utils/email.js';
import { checkNotificationEnabled } from './notificationPreferencesController.js';
import { paymentSessions } from './paymentController.js';
import NotificationPreferences from '../models/NotificationPreferences.js';
import { generateETicket, generateTicketFilename } from '../utils/ticketGenerator.js';
import { calculateBookingPrice, validatePrice } from '../utils/pricingCalculator.js';

/**
 * Create a new booking
 * Converts seat locks to confirmed booking
 */
export const createBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      busScheduleId,
      routeNo,
      departure,
      arrival,
      depotName,
      seatNumbers, // Array of seat numbers
      booking_startTime,
      booking_endTime,
      journeyDate,
      passengers, // Array of passenger details
      sessionId,
    } = req.body;

    const customerId = req.user.id; // From auth middleware

    console.log('CreateBooking payload:', {
      bodyPreview: { busScheduleId, seatNumbers, sessionId, passengersCount: passengers?.length },
    });

    // Validate passengers match seats
    if (!passengers || passengers.length !== seatNumbers.length) {
      await t.rollback();
      return res.status(400).json({
        message: 'Number of passengers must match number of seats',
      });
    }

    // Get schedule to fetch price
    const schedule = await BusSchedule.findByPk(busScheduleId, { transaction: t });
    if (!schedule) {
      await t.rollback();
      return res.status(404).json({ message: 'Bus schedule not found' });
    }

    // Calculate pricing server-side (don't trust client)
    const pricing = calculateBookingPrice(schedule.price, seatNumbers.length);
    console.log('[CreateBooking] Pricing calculated:', pricing);

    // Verify seat locks exist and belong to this user
    if (sessionId) {
      const locks = await SeatLock.findAll({
        where: {
          scheduleId: busScheduleId,
          seatNumber: { [Op.in]: seatNumbers.map((n) => String(n)) },
          sessionId,
          status: 'locked',
        },
        transaction: t,
      });

      console.log(
        `Found ${locks.length} locks for session ${sessionId} (expected ${seatNumbers.length})`
      );
      if (locks.length > 0) {
        console.log(
          'Locks preview:',
          locks.map((l) => ({
            id: l.id,
            scheduleId: l.scheduleId,
            seatNumber: l.seatNumber,
            sessionId: l.sessionId,
            status: l.status,
          }))
        );
      }

      if (locks.length !== seatNumbers.length) {
        await t.rollback();
        console.error('Lock verification failed: mismatch count, aborting booking creation');
        return res.status(400).json({
          message: 'Some seats are not properly locked. Please try again.',
        });
      }
    }

    // Create booking
    // Ensure bookingReference exists (safety net in case model hooks didn't run)
    let bookingReference = req.body.bookingReference;
    if (!bookingReference) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      bookingReference = `BKG-${timestamp}-${random}`;
    }

    const booking = await BusBooking.create(
      {
        customerId,
        busScheduleId,
        routeNo,
        departure,
        arrival,
        depotName,
        bookingReference,
        seatNumbers,
        booking_startTime,
        booking_endTime,
        journeyDate,
        passengers,
        payment_busFare: pricing.busFare,
        payment_convenienceFee: pricing.convenienceFee,
        payment_bankCharge: pricing.bankCharge,
        payment_totalPay: pricing.totalPay,
        pickupPoint: req.body.pickupPoint || null,
        dropoffPoint: req.body.dropoffPoint || null,
        status: 'pending',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
      { transaction: t }
    );

    // Convert seat locks to confirmed status for this booking (do not set unknown columns)
    if (sessionId) {
      const [updateCount] = await SeatLock.update(
        { status: 'confirmed' },
        {
          where: {
            scheduleId: busScheduleId,
            seatNumber: { [Op.in]: seatNumbers.map((n) => String(n)) },
            sessionId,
          },
          transaction: t,
        }
      );
      console.log(`SeatLock.update affected ${updateCount} rows for booking ${booking.id}`);
    }

    await t.commit();

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        expiresAt: booking.expiresAt,
        seatNumbers: booking.seatNumbers,
        passengers: booking.passengers,
        totalPay: booking.payment_totalPay,
        pickupPoint: booking.pickupPoint,
        dropoffPoint: booking.dropoffPoint,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error('Create booking error:', error);
    res.status(400).json({ message: 'Error creating booking', error: error.message });
  }
};

/**
 * Helper: Send instant trip reminder if booking is < 24h before departure
 * Only sends if reminder hasn't been sent yet
 */
const sendInstantTripReminderIfNeeded = async (booking, customer) => {
  console.log(
    `[InstantReminder] Called for booking ${booking.bookingReference}, customer ${customer.id}`
  );
  console.log(
    `[InstantReminder] Booking data - journeyDate: ${booking.journeyDate}, booking_startTime: ${booking.booking_startTime}, departureTime: ${booking.departureTime}`
  );

  try {
    // Skip if reminder already sent
    if (booking.reminderSentAt) {
      console.log(
        `[InstantReminder] Reminder already sent for booking ${booking.bookingReference} at ${booking.reminderSentAt}`
      );
      return;
    }

    // Calculate hours until journey
    const now = new Date();

    // Use departureTime if booking_startTime is missing
    const startTime = booking.booking_startTime || booking.departureTime;

    if (!startTime) {
      console.log(
        `[InstantReminder] No start time available for booking ${booking.bookingReference}`
      );
      return;
    }

    // Format journeyDate properly (handle Date object or string)
    let journeyDateStr;
    if (booking.journeyDate instanceof Date) {
      // It's a Date object, format it as YYYY-MM-DD
      journeyDateStr = booking.journeyDate.toISOString().split('T')[0];
    } else {
      // It's already a string, use as is
      journeyDateStr = booking.journeyDate;
    }

    console.log(
      `[InstantReminder] Formatted journey date: ${journeyDateStr}, start time: ${startTime}`
    );

    const journeyDateTime = new Date(`${journeyDateStr}T${startTime}`);

    // Validate date
    if (isNaN(journeyDateTime.getTime())) {
      console.log(
        `[InstantReminder] Invalid journey date/time for booking ${booking.bookingReference}: ${journeyDateStr}T${startTime}`
      );
      return;
    }

    const hoursUntilJourney = (journeyDateTime - now) / (1000 * 60 * 60);

    console.log(
      `[InstantReminder] Journey: ${journeyDateTime.toISOString()}, Now: ${now.toISOString()}, Hours until: ${hoursUntilJourney.toFixed(2)}`
    );

    // Skip if journey is in the past
    if (hoursUntilJourney <= 0) {
      console.log(
        `[InstantReminder] Journey already passed for booking ${booking.bookingReference}`
      );
      return;
    }

    // Get user's reminder timing preference (default 24h)
    const preferences = await NotificationPreferences.findOne({
      where: { customerId: customer.id },
    });
    const reminderTiming = preferences?.reminderTiming || 24;

    console.log(`[InstantReminder] Reminder timing setting: ${reminderTiming}h`);

    // Send instant reminder if journey is within reminder window
    if (hoursUntilJourney <= reminderTiming) {
      // Check if email reminders are enabled
      const emailRemindersEnabled = preferences?.emailTripReminders !== false;

      console.log(`[InstantReminder] Email reminders enabled: ${emailRemindersEnabled}`);

      if (!emailRemindersEnabled) {
        console.log(`[InstantReminder] Email reminders disabled for customer ${customer.id}`);
        return;
      }

      const email = customer.isGuest ? customer.guestEmail : customer.email;
      const username = customer.isGuest ? customer.guestName : customer.username;

      if (!email) {
        console.log(`[InstantReminder] No email for customer ${customer.id}`);
        return;
      }

      console.log(`[InstantReminder] Sending reminder to ${email}...`);

      // Format booking details
      const bookingDetails = {
        bookingReference: booking.bookingReference,
        departure: booking.departure,
        arrival: booking.arrival,
        date: new Date(booking.journeyDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: booking.booking_startTime,
        seatNo: Array.isArray(booking.seatNumbers)
          ? booking.seatNumbers.join(', ')
          : booking.seatNumbers,
        totalPay: booking.payment_totalPay,
      };

      // Send reminder email
      await sendTripReminder(email, username, bookingDetails);

      // Mark as sent (update outside transaction)
      await booking.update({ reminderSentAt: new Date() });

      console.log(
        `✅ [InstantReminder] Sent trip reminder to ${email} for booking ${booking.bookingReference} (${hoursUntilJourney.toFixed(2)}h before journey)`
      );
    } else {
      console.log(
        `[InstantReminder] Not sending yet - ${hoursUntilJourney.toFixed(2)}h until journey (reminder set for ${reminderTiming}h)`
      );
    }
  } catch (error) {
    // Don't fail booking if instant reminder fails
    console.error('[InstantReminder] Error sending instant trip reminder:', error);
    console.error('[InstantReminder] Stack:', error.stack);
  }
};

/**
 * Confirm booking (after successful payment)
 */
export const confirmBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { paymentReference } = req.body;
    const customerId = req.user.id;

    // CRITICAL: Validate payment reference is provided
    if (!paymentReference) {
      await t.rollback();
      return res.status(400).json({
        message: 'Payment reference is required to confirm booking',
      });
    }

    // SECURITY: Verify payment session exists and is successful
    const paymentSession = paymentSessions.get(paymentReference);
    if (!paymentSession) {
      console.log('❌ CONFIRM BOOKING REJECTED - Payment session not found:', paymentReference);
      await t.rollback();
      return res.status(400).json({
        message: 'Invalid payment reference - payment session not found',
      });
    }

    if (paymentSession.status !== 'success') {
      console.log(
        '❌ CONFIRM BOOKING REJECTED - Payment status:',
        paymentSession.status,
        'Ref:',
        paymentReference
      );
      await t.rollback();
      return res.status(400).json({
        message: `Cannot confirm booking - payment status is: ${paymentSession.status}`,
      });
    }

    // Verify payment session belongs to this booking
    if (paymentSession.bookingId !== parseInt(id)) {
      console.log(
        '❌ CONFIRM BOOKING REJECTED - Booking ID mismatch. Payment:',
        paymentSession.bookingId,
        'Request:',
        id
      );
      await t.rollback();
      return res.status(400).json({
        message: 'Payment reference does not match this booking',
      });
    }

    console.log('✅ CONFIRM BOOKING - Payment validated, confirming booking:', id);

    const booking = await BusBooking.findOne({
      where: { id, customerId },
      transaction: t,
    });

    if (!booking) {
      await t.rollback();
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({
        message: `Cannot confirm booking with status: ${booking.status}`,
      });
    }

    // Check if booking has expired
    if (booking.expiresAt && new Date() > booking.expiresAt) {
      booking.status = 'expired';
      await booking.save({ transaction: t });
      await t.rollback();
      return res.status(400).json({ message: 'Booking has expired' });
    }

    // Update booking status
    booking.status = 'confirmed';
    booking.expiresAt = null; // Remove expiration
    booking.paymentReference = paymentReference;
    await booking.save({ transaction: t });

    // Update associated seat locks to confirmed
    await SeatLock.update(
      { status: 'confirmed' },
      {
        where: {
          scheduleId: booking.busScheduleId,
          seatNumber: { [Op.in]: booking.seatNumbers.map((n) => String(n)) },
          status: 'locked',
        },
        transaction: t,
      }
    );

    // Update bus schedule available seats
    console.log(`[ConfirmBooking] Updating seats for schedule ${booking.busScheduleId}`);
    if (booking.busScheduleId) {
      const schedule = await BusSchedule.findByPk(booking.busScheduleId, { transaction: t });
      if (schedule) {
        const beforeSeats = schedule.availableSeats;
        const seatsToDeduct = booking.seatNumbers.length;
        schedule.availableSeats = Math.max(0, schedule.availableSeats - seatsToDeduct);
        const afterSeats = schedule.availableSeats;

        console.log(
          `[ConfirmBooking] Deducting seats - Before: ${beforeSeats}, Deducting: ${seatsToDeduct}, After: ${afterSeats}`
        );

        await schedule.save({ transaction: t });
        console.log(`[ConfirmBooking] Seats updated successfully for schedule ${schedule.id}`);
      } else {
        console.log(`[ConfirmBooking] Schedule ${booking.busScheduleId} not found`);
      }
    } else {
      console.log(`[ConfirmBooking] No busScheduleId in booking`);
    }

    await t.commit();

    // Send booking confirmation email with e-ticket
    try {
      const customer = await Customer.findByPk(customerId);
      if (customer && customer.email) {
        // Check if user wants email notifications
        const emailEnabled = await checkNotificationEnabled(customerId, 'emailBookingConfirmation');

        if (emailEnabled) {
          const bookingDetails = {
            bookingReference: booking.bookingReference,
            departure: booking.departure,
            arrival: booking.arrival,
            date: new Date(booking.journeyDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            time: booking.booking_startTime,
            seatNo: Array.isArray(booking.seatNumbers)
              ? booking.seatNumbers.join(', ')
              : booking.seatNumbers,
            totalPay: booking.payment_totalPay,
          };

          // Generate e-ticket PDF
          let ticketPdf = null;
          try {
            ticketPdf = await generateETicket(booking);
            console.log(`E-ticket generated for booking ${booking.bookingReference}`);
          } catch (pdfError) {
            console.error('Failed to generate e-ticket PDF:', pdfError);
            // Continue without PDF attachment
          }

          await sendBookingConfirmation(
            customer.email,
            customer.username,
            bookingDetails,
            ticketPdf // Include e-ticket as attachment
          );
          console.log(`Booking confirmation email with e-ticket sent to ${customer.email}`);
        }
      }
    } catch (emailError) {
      // Don't fail the booking if email fails
      console.error('Failed to send booking confirmation email:', emailError);
    }

    // Send instant trip reminder if booking is < 24h before departure
    console.log(
      `[ConfirmBooking] Checking instant reminder for booking ${booking.bookingReference}, customer ID: ${customerId}`
    );
    try {
      const customer = await Customer.findByPk(customerId);
      console.log(`[ConfirmBooking] Customer found: ${customer ? customer.id : 'null'}`);
      if (customer) {
        console.log(`[ConfirmBooking] Calling sendInstantTripReminderIfNeeded...`);
        await sendInstantTripReminderIfNeeded(booking, customer);
        console.log(`[ConfirmBooking] sendInstantTripReminderIfNeeded completed`);
      } else {
        console.log(`[ConfirmBooking] Customer ${customerId} not found`);
      }
    } catch (reminderError) {
      // Don't fail booking if reminder fails
      console.error('[ConfirmBooking] Failed to send instant trip reminder:', reminderError);
      console.error('[ConfirmBooking] Stack:', reminderError.stack);
    }

    res.status(200).json({
      message: 'Booking confirmed successfully',
      booking,
    });
  } catch (error) {
    await t.rollback();
    console.error('Confirm booking error:', error);
    res.status(400).json({ message: 'Error confirming booking', error: error.message });
  }
};

/**
 * Get all bookings for current user
 */
export const getMyBookings = async (req, res) => {
  try {
    console.log('getMyBookings called. user id:', req.user?.id, 'query:', req.query);
    const customerId = req.user.id;
    const { status } = req.query;

    const whereClause = { customerId };
    if (status) {
      // Map friendly status values from client to actual DB enum values
      if (status === 'upcoming') {
        // upcoming represents pending and confirmed bookings
        whereClause.status = { [Op.in]: ['pending', 'confirmed'] };
      } else if (status === 'history') {
        whereClause.status = { [Op.in]: ['completed', 'cancelled', 'expired'] };
      } else {
        // pass through raw status (should match DB enum)
        whereClause.status = status;
      }
    }

    // First try a simple fetch without eager loading to verify base query works
    try {
      const simpleBookings = await BusBooking.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
      });
      console.log('getMyBookings: simple fetch succeeded, count=', simpleBookings.length);
    } catch (simpleErr) {
      console.error(
        'getMyBookings: simple fetch failed',
        simpleErr && (simpleErr.stack || simpleErr)
      );
      throw simpleErr; // rethrow to be caught by outer catch
    }

    // Now attempt to fetch with schedule include
    const bookings = await BusBooking.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: BusSchedule,
          as: 'schedule',
          // Use actual column names from BusSchedule model
          attributes: [
            'id',
            'busId',
            'routeId',
            'departure_date',
            'departure_time',
            'arrival_date',
            'arrival_time',
            'depotName',
            'price',
            'isCompleted',
            'completedAt',
          ],
          include: [
            {
              model: Route,
              as: 'route',
              attributes: ['id', 'routeName'],
            },
          ],
        },
      ],
    });

    res.status(200).json({ bookings });
  } catch (error) {
    console.error('Get my bookings error:', error.stack || error);
    // Print DB-specific details if present
    if (error.original) console.error('DB original error:', error.original);
    if (error.sql) console.error('DB SQL:', error.sql);
    // Return detailed error during debugging — consider removing in production
    res.status(400).json({
      message: 'Error fetching bookings',
      error: error.message,
      sql: error.sql,
      original: error.original && String(error.original),
    });
  }
};

/**
 * Get all bookings (Admin only)
 */
export const getAllBookings = async (req, res) => {
  try {
    const { status, createdDate, page = 1, limit = 50 } = req.query;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    // Filter by created date (exact date match)
    if (createdDate) {
      const startOfDay = new Date(createdDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(createdDate);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.createdAt = {
        [Op.gte]: startOfDay,
        [Op.lte]: endOfDay,
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows: bookings } = await BusBooking.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      bookings,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(400).json({ message: 'Error fetching bookings', error: error.message });
  }
};

/**
 * Get single booking by ID
 */
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;
    const isAdmin = req.user.position === 'admin';

    const whereClause = { id };
    if (!isAdmin) {
      whereClause.customerId = customerId;
    }

    const booking = await BusBooking.findOne({
      where: whereClause,
      include: [
        {
          model: BusSchedule,
          as: 'schedule',
          attributes: [
            'id',
            'busId',
            'routeId',
            'departure_date',
            'departure_time',
            'arrival_date',
            'arrival_time',
            'depotName',
            'price',
          ],
          include: [
            {
              model: Route,
              as: 'route',
              attributes: ['id', 'routeName'],
            },
          ],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(400).json({ message: 'Error fetching booking', error: error.message });
  }
};

/**
 * Get booking by reference number
 */
export const getBookingByReference = async (req, res) => {
  try {
    const { reference } = req.params;
    const customerId = req.user.id;
    const isAdmin = req.user.position === 'admin';

    const whereClause = { bookingReference: reference };
    if (!isAdmin) {
      whereClause.customerId = customerId;
    }

    const booking = await BusBooking.findOne({ where: whereClause });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json({ booking });
  } catch (error) {
    console.error('Get booking by reference error:', error);
    res.status(400).json({ message: 'Error fetching booking', error: error.message });
  }
};

/**
 * Cancel booking
 */
export const cancelBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const customerId = req.user.id;

    const booking = await BusBooking.findOne({
      where: { id, customerId },
      transaction: t,
    });

    if (!booking) {
      await t.rollback();
      return res.status(404).json({ message: 'Booking not found' });
    }

    // preserve original status for later logic (e.g. restoring seats)
    const originalStatus = booking.status;

    if (!['pending', 'confirmed'].includes(originalStatus)) {
      await t.rollback();
      return res.status(400).json({
        message: `Cannot cancel booking with status: ${originalStatus}`,
      });
    }

    // Update booking
    booking.status = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by user';
    booking.cancelledAt = new Date();
    await booking.save({ transaction: t });

    // Release seat locks
    // SeatLock model does not have a bookingId column. Release locks by scheduleId + seatNumber
    if (
      booking.busScheduleId &&
      Array.isArray(booking.seatNumbers) &&
      booking.seatNumbers.length > 0
    ) {
      const [releasedCount] = await SeatLock.update(
        { status: 'released' },
        {
          where: {
            scheduleId: booking.busScheduleId,
            seatNumber: { [Op.in]: booking.seatNumbers.map((n) => String(n)) },
            status: 'confirmed',
          },
          transaction: t,
        }
      );
      console.log(`Released ${releasedCount} SeatLock(s) for cancelled booking ${booking.id}`);
    } else {
      // As a fallback, attempt to release any confirmed locks for this customer on the schedule
      if (booking.busScheduleId) {
        const [releasedCount] = await SeatLock.update(
          { status: 'released' },
          {
            where: {
              scheduleId: booking.busScheduleId,
              customerId: booking.customerId,
              status: 'confirmed',
            },
            transaction: t,
          }
        );
        console.log(
          `Fallback released ${releasedCount} SeatLock(s) for cancelled booking ${booking.id}`
        );
      }
    }

    // Return seats to available pool if confirmed
    console.log(
      `[CancelBooking] Checking seat restoration - originalStatus: ${originalStatus}, busScheduleId: ${booking.busScheduleId}`
    );
    if (originalStatus === 'confirmed' && booking.busScheduleId) {
      const schedule = await BusSchedule.findByPk(booking.busScheduleId, { transaction: t });
      if (schedule) {
        const seatsToReturn = (booking.seatNumbers && booking.seatNumbers.length) || 0;
        const beforeSeats = schedule.availableSeats;
        schedule.availableSeats += seatsToReturn;
        const afterSeats = schedule.availableSeats;

        console.log(
          `[CancelBooking] Restoring seats - Before: ${beforeSeats}, Returning: ${seatsToReturn}, After: ${afterSeats}`
        );

        await schedule.save({ transaction: t });
        console.log(`[CancelBooking] Seats restored successfully for schedule ${schedule.id}`);
      } else {
        console.log(`[CancelBooking] Schedule ${booking.busScheduleId} not found`);
      }
    } else {
      console.log(`[CancelBooking] Not restoring seats - status check failed or no schedule`);
    }

    await t.commit();

    // Send cancellation email
    try {
      const customer = await Customer.findByPk(customerId);
      if (customer && customer.email) {
        // Check if user wants cancellation email notifications
        const emailEnabled = await checkNotificationEnabled(customerId, 'emailCancellations');

        if (emailEnabled) {
          const bookingDetails = {
            bookingReference: booking.bookingReference,
            departure: booking.departure,
            arrival: booking.arrival,
            date: new Date(booking.journeyDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            totalPay: booking.payment_totalPay,
            refundAmount: booking.payment_totalPay, // You can calculate refund based on cancellation policy
          };

          await sendBookingCancellation(customer.email, customer.username, bookingDetails);
          console.log(`Cancellation email sent to ${customer.email}`);
        }
      }
    } catch (emailError) {
      // Don't fail the cancellation if email fails
      console.error('Failed to send cancellation email:', emailError);
    }

    res.status(200).json({
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    await t.rollback();
    console.error('Cancel booking error:', error);
    res.status(400).json({ message: 'Error cancelling booking', error: error.message });
  }
};

/**
 * Update booking (limited fields)
 */
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;
    const { passengers } = req.body; // Only allow updating passenger details

    const booking = await BusBooking.findOne({
      where: { id, customerId },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        message: 'Can only update pending bookings',
      });
    }

    // Update only allowed fields
    if (passengers) {
      booking.passengers = passengers;
    }

    await booking.save();

    res.status(200).json({
      message: 'Booking updated successfully',
      booking,
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(400).json({ message: 'Error updating booking', error: error.message });
  }
};

/**
 * Delete booking (Admin only - soft delete by marking as cancelled)
 */
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await BusBooking.findByPk(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = 'Deleted by admin';
    booking.cancelledAt = new Date();
    await booking.save();

    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(400).json({ message: 'Error deleting booking', error: error.message });
  }
};

/**
 * Expire old pending bookings (to be called by a cron job)
 */
export const expirePendingBookings = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const expiredBookings = await BusBooking.findAll({
      where: {
        status: 'pending',
        expiresAt: { [Op.lt]: new Date() },
      },
      transaction: t,
    });

    for (const booking of expiredBookings) {
      booking.status = 'expired';
      await booking.save({ transaction: t });

      // Release associated seat locks
      await SeatLock.update(
        { status: 'released' },
        {
          where: {
            bookingId: booking.id,
            status: 'confirmed',
          },
          transaction: t,
        }
      );
    }

    await t.commit();

    res.status(200).json({
      message: `Expired ${expiredBookings.length} pending bookings`,
      count: expiredBookings.length,
    });
  } catch (error) {
    await t.rollback();
    console.error('Expire bookings error:', error);
    res.status(500).json({ message: 'Error expiring bookings', error: error.message });
  }
};

/**
 * Admin: Confirm a pending booking
 * Admin can confirm any pending booking and send email notification
 */
export const adminConfirmBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const booking = await BusBooking.findByPk(id, { transaction: t });

    if (!booking) {
      await t.rollback();
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({
        message: `Cannot confirm booking with status: ${booking.status}. Only pending bookings can be confirmed.`,
      });
    }

    // Update booking status
    booking.status = 'confirmed';
    await booking.save({ transaction: t });

    // Update associated seat locks
    await SeatLock.update(
      { status: 'confirmed' },
      {
        where: {
          scheduleId: booking.busScheduleId,
          seatNumber: { [Op.in]: booking.seatNumbers.map((n) => String(n)) },
          status: 'locked',
        },
        transaction: t,
      }
    );

    // Update bus schedule available seats
    console.log(`[AdminConfirm] Updating seats for schedule ${booking.busScheduleId}`);
    if (booking.busScheduleId) {
      const schedule = await BusSchedule.findByPk(booking.busScheduleId, { transaction: t });
      if (schedule) {
        const beforeSeats = schedule.availableSeats;
        const seatsToDeduct = booking.seatNumbers.length;
        schedule.availableSeats = Math.max(0, schedule.availableSeats - seatsToDeduct);
        const afterSeats = schedule.availableSeats;

        console.log(
          `[AdminConfirm] Deducting seats - Before: ${beforeSeats}, Deducting: ${seatsToDeduct}, After: ${afterSeats}`
        );

        await schedule.save({ transaction: t });
        console.log(`[AdminConfirm] Seats updated successfully for schedule ${schedule.id}`);
      } else {
        console.log(`[AdminConfirm] Schedule ${booking.busScheduleId} not found`);
      }
    } else {
      console.log(`[AdminConfirm] No busScheduleId in booking`);
    }

    await t.commit();

    // Send booking confirmation email with e-ticket
    try {
      const customer = await Customer.findByPk(booking.customerId);

      if (customer) {
        // Check if it's a guest or regular user
        const isGuest = customer.isGuest;
        const recipientEmail = isGuest ? customer.guestEmail : customer.email;
        const recipientName = isGuest ? customer.guestName : customer.username;

        if (recipientEmail) {
          // For regular users, check notification preferences
          let shouldSendEmail = true;
          if (!isGuest) {
            shouldSendEmail = await checkNotificationEnabled(
              booking.customerId,
              'emailBookingConfirmation'
            );
          }
          // For guests, always send email

          if (shouldSendEmail) {
            const bookingDetails = {
              bookingReference: booking.bookingReference,
              departure: booking.departure,
              arrival: booking.arrival,
              date: new Date(booking.journeyDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              time: booking.booking_startTime,
              seatNo: Array.isArray(booking.seatNumbers)
                ? booking.seatNumbers.join(', ')
                : booking.seatNumbers,
              totalPay: booking.payment_totalPay,
            };

            // Generate e-ticket PDF
            let ticketPdf = null;
            try {
              ticketPdf = await generateETicket(booking);
              console.log(`[Admin] E-ticket generated for booking ${booking.bookingReference}`);
            } catch (pdfError) {
              console.error('[Admin] Failed to generate e-ticket PDF:', pdfError);
              // Continue without PDF attachment
            }

            await sendBookingConfirmation(
              recipientEmail,
              recipientName || 'Guest',
              bookingDetails,
              ticketPdf // Include e-ticket as attachment
            );
            console.log(
              `[Admin] Booking confirmation email sent to ${recipientEmail} (Guest: ${isGuest})`
            );
          }
        } else {
          console.log(`[Admin] No email found for customer ${booking.customerId}`);
        }
      }
    } catch (emailError) {
      // Don't fail the confirmation if email fails
      console.error('Failed to send booking confirmation email:', emailError);
    }

    // Send instant trip reminder if booking is < 24h before departure
    console.log(
      `[AdminConfirm] Checking instant reminder for booking ${booking.bookingReference}, customer ID: ${booking.customerId}`
    );
    try {
      const customer = await Customer.findByPk(booking.customerId);
      console.log(`[AdminConfirm] Customer found: ${customer ? customer.id : 'null'}`);
      if (customer) {
        console.log(`[AdminConfirm] Calling sendInstantTripReminderIfNeeded...`);
        await sendInstantTripReminderIfNeeded(booking, customer);
        console.log(`[AdminConfirm] sendInstantTripReminderIfNeeded completed`);
      } else {
        console.log(`[AdminConfirm] Customer ${booking.customerId} not found`);
      }
    } catch (reminderError) {
      // Don't fail booking if reminder fails
      console.error('[AdminConfirm] Failed to send instant trip reminder:', reminderError);
      console.error('[AdminConfirm] Stack:', reminderError.stack);
    }

    res.status(200).json({
      message: 'Booking confirmed successfully by admin',
      booking,
    });
  } catch (error) {
    await t.rollback();
    console.error('Admin confirm booking error:', error);
    res.status(400).json({ message: 'Error confirming booking', error: error.message });
  }
};

/**
 * Admin: Cancel a pending booking only
 * Admin can only cancel pending bookings, not confirmed ones
 */
export const adminCancelBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await BusBooking.findByPk(id, { transaction: t });

    if (!booking) {
      await t.rollback();
      return res.status(404).json({ message: 'Booking not found' });
    }

    const originalStatus = booking.status;

    // Only allow cancelling pending bookings
    if (originalStatus !== 'pending') {
      await t.rollback();
      return res.status(400).json({
        message: `Cannot cancel booking with status: ${originalStatus}. Only pending bookings can be cancelled.`,
      });
    }

    // No refund for pending bookings (not yet paid/confirmed)
    const refundAmount = 0;

    // Update booking
    booking.status = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by admin';
    booking.cancelledAt = new Date();
    await booking.save({ transaction: t });

    // Release seat locks
    await SeatLock.update(
      { status: 'released' },
      {
        where: {
          scheduleId: booking.busScheduleId,
          seatNumber: { [Op.in]: booking.seatNumbers.map((n) => String(n)) },
        },
        transaction: t,
      }
    );

    await t.commit();

    // Send cancellation email
    try {
      const customer = await Customer.findByPk(booking.customerId);

      if (customer) {
        // Check if it's a guest or regular user
        const isGuest = customer.isGuest;
        const recipientEmail = isGuest ? customer.guestEmail : customer.email;
        const recipientName = isGuest ? customer.guestName : customer.username;

        if (recipientEmail) {
          // For regular users, check notification preferences
          let shouldSendEmail = true;
          if (!isGuest) {
            shouldSendEmail = await checkNotificationEnabled(
              booking.customerId,
              'emailCancellations'
            );
          }
          // For guests, always send email

          if (shouldSendEmail) {
            const bookingDetails = {
              bookingReference: booking.bookingReference,
              departure: booking.departure,
              arrival: booking.arrival,
              date: new Date(booking.journeyDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              time: booking.booking_startTime,
              seatNo: Array.isArray(booking.seatNumbers)
                ? booking.seatNumbers.join(', ')
                : booking.seatNumbers,
              totalPay: booking.payment_totalPay,
              refundAmount: refundAmount,
              cancellationReason: booking.cancellationReason,
            };

            await sendBookingCancellation(recipientEmail, recipientName || 'Guest', bookingDetails);
            console.log(`[Admin] Cancellation email sent to ${recipientEmail} (Guest: ${isGuest})`);
          }
        } else {
          console.log(`[Admin] No email found for customer ${booking.customerId}`);
        }
      }
    } catch (emailError) {
      // Don't fail the cancellation if email fails
      console.error('Failed to send booking cancellation email:', emailError);
    }

    res.status(200).json({
      message: 'Booking cancelled successfully by admin',
      booking,
      refundAmount: refundAmount > 0 ? refundAmount : null,
    });
  } catch (error) {
    await t.rollback();
    console.error('Admin cancel booking error:', error);
    res.status(400).json({ message: 'Error cancelling booking', error: error.message });
  }
};

/**
 * Create a guest booking (without registration)
 * Supports guest checkout flow
 */
export const createGuestBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      busScheduleId,
      routeNo,
      departure,
      arrival,
      depotName,
      seatNumbers,
      booking_startTime,
      booking_endTime,
      journeyDate,
      passengers,
      sessionId,
      guestInfo, // { name, email, phone }
    } = req.body;

    // Validate guest information
    if (!guestInfo || !guestInfo.email || !guestInfo.phone) {
      await t.rollback();
      return res.status(400).json({
        message: 'Guest email and phone are required for guest bookings',
      });
    }

    // Validate passengers match seats
    if (!passengers || passengers.length !== seatNumbers.length) {
      await t.rollback();
      return res.status(400).json({
        message: 'Number of passengers must match number of seats',
      });
    }

    // Get schedule to fetch price
    const schedule = await BusSchedule.findByPk(busScheduleId, { transaction: t });
    if (!schedule) {
      await t.rollback();
      return res.status(404).json({ message: 'Bus schedule not found' });
    }

    // Calculate pricing server-side (don't trust client)
    const pricing = calculateBookingPrice(schedule.price, seatNumbers.length);
    console.log('[CreateGuestBooking] Pricing calculated:', pricing);

    // Verify seat locks exist for the session
    if (sessionId) {
      const locks = await SeatLock.findAll({
        where: {
          scheduleId: busScheduleId,
          seatNumber: { [Op.in]: seatNumbers.map((n) => String(n)) },
          sessionId,
          status: 'locked',
        },
        transaction: t,
      });

      if (locks.length !== seatNumbers.length) {
        await t.rollback();
        return res.status(400).json({
          message: 'Some seats are not properly locked. Please try again.',
        });
      }
    }

    // Create or find guest customer record
    let guestCustomer = await Customer.findOne({
      where: {
        isGuest: true,
        guestEmail: guestInfo.email.toLowerCase(),
        guestPhone: guestInfo.phone,
      },
      transaction: t,
    });

    if (!guestCustomer) {
      // Create new guest customer
      const guestUsername = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      guestCustomer = await Customer.create(
        {
          username: guestUsername,
          email: null, // Guests don't have email in the email field
          password: null,
          isGuest: true,
          guestEmail: guestInfo.email.toLowerCase(),
          guestPhone: guestInfo.phone,
          guestName: guestInfo.name || passengers[0]?.name || 'Guest',
          provider: 'guest',
          position: 'customer',
          isVerified: false,
        },
        { transaction: t }
      );
    }

    // Generate unique booking reference
    const bookingReference = generateBookingReference();

    // Create booking
    const booking = await BusBooking.create(
      {
        customerId: guestCustomer.id,
        busScheduleId,
        routeNo,
        departure,
        arrival,
        depotName,
        bookingReference,
        seatNumbers,
        booking_startTime,
        booking_endTime,
        journeyDate,
        passengers,
        payment_busFare: pricing.busFare,
        payment_convenienceFee: pricing.convenienceFee,
        payment_bankCharge: pricing.bankCharge,
        payment_totalPay: pricing.totalPay,
        pickupPoint: req.body.pickupPoint || null,
        dropoffPoint: req.body.dropoffPoint || null,
        status: 'pending',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
      { transaction: t }
    );

    // Convert seat locks to confirmed status
    if (sessionId) {
      await SeatLock.update(
        { status: 'confirmed' },
        {
          where: {
            scheduleId: busScheduleId,
            seatNumber: { [Op.in]: seatNumbers.map((n) => String(n)) },
            sessionId,
          },
          transaction: t,
        }
      );
    }

    await t.commit();

    // DON'T send booking confirmation email yet - wait for payment success
    // Email will be sent when admin confirms the booking or payment succeeds
    /*
    try {
      const bookingDetails = {
        departure: booking.departure,
        arrival: booking.arrival,
        date: booking.journeyDate,
        time: booking.booking_startTime,
  seatNo: (booking.seatNumbers || []).join(', '),
  totalPay: booking.payment_totalPay,
  bookingReference: booking.bookingReference
      };
      await sendBookingConfirmation(guestInfo.email, guestCustomer.guestName || guestInfo.name, bookingDetails);
    } catch (emailErr) {
      console.error('Failed to send booking confirmation email:', emailErr && emailErr.message ? emailErr.message : emailErr);
      // Don't fail the booking if email sending fails
    }
    */

    res.status(201).json({
      message: 'Guest booking created successfully',
      booking: {
        id: booking.id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        expiresAt: booking.expiresAt,
        seatNumbers: booking.seatNumbers,
        passengers: booking.passengers,
        totalPay: booking.payment_totalPay,
        pickupPoint: booking.pickupPoint,
        dropoffPoint: booking.dropoffPoint,
        guestEmail: guestInfo.email,
        guestPhone: guestInfo.phone,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error('Create guest booking error:', error);
    res.status(400).json({ message: 'Error creating guest booking', error: error.message });
  }
};

/**
 * Guest booking lookup
 * Retrieve bookings using reference number and email or phone
 */
export const lookupGuestBooking = async (req, res) => {
  try {
    // Note: This endpoint is now reserved and will be replaced by a verification flow.
    // Clients should first call POST /api/bookings/guest/lookup/request to send a verification email.
    res
      .status(400)
      .json({ message: 'Use the verification flow: POST /api/bookings/guest/lookup/request' });
  } catch (error) {
    console.error('Guest booking lookup error:', error);
    res.status(400).json({
      message: 'Error looking up booking',
      error: error.message,
    });
  }
};

/**
 * Request guest lookup verification email
 * POST /api/bookings/guest/lookup/request
 */
export const requestGuestLookupVerification = async (req, res) => {
  try {
    const { bookingReference, email } = req.body;

    if (!bookingReference || !email) {
      return res.status(400).json({ message: 'bookingReference and email are required' });
    }

    if (!isValidBookingReference(bookingReference)) {
      return res.status(400).json({ message: 'Invalid booking reference format' });
    }

    const booking = await BusBooking.findOne({
      where: { bookingReference },
      include: [
        {
          model: Customer,
          as: 'customer',
          where: { isGuest: true, guestEmail: email.toLowerCase() },
        },
      ],
    });

    if (!booking) {
      return res
        .status(404)
        .json({ message: 'Booking not found for the provided reference and email' });
    }

    const guestCustomer = booking.customer;

    // Generate a short verification token and expiration (15 minutes)
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    guestCustomer.verificationToken = token;
    guestCustomer.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await guestCustomer.save();

    // Send verification email: point the link to the client verify page so the React app can render booking details
    const serverBase = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 4000}`;
    const clientBase =
      process.env.CLIENT_URL ||
      serverBase.replace(/:\d+$/, `:${process.env.CLIENT_PORT || process.env.PORT || 3000}`) ||
      serverBase;
    const verifyUrl = `${clientBase.replace(/\/$/, '')}/bus-booking/guest-verify?token=${encodeURIComponent(token)}&reference=${encodeURIComponent(bookingReference)}`;

    await sendGuestLookupVerification(email, guestCustomer.guestName || 'Guest', token, verifyUrl);

    res.status(200).json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('requestGuestLookupVerification error:', error);
    res.status(500).json({ message: 'Error sending verification email', error: error.message });
  }
};

/**
 * Verify guest lookup token and return booking
 * GET /api/bookings/guest/verify?token=...&reference=...
 */
export const verifyGuestLookup = async (req, res) => {
  try {
    const { token, reference } = req.query;

    if (!token || !reference) {
      return res.status(400).json({ message: 'token and reference are required' });
    }

    const booking = await BusBooking.findOne({
      where: { bookingReference: reference },
      include: [
        {
          model: Customer,
          as: 'customer',
          where: { isGuest: true, verificationToken: token },
        },
        {
          model: BusSchedule,
          as: 'schedule',
          include: [{ model: Route, as: 'route' }],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({ message: 'Invalid token or booking reference' });
    }

    // Check token expiration
    const guestCustomer = booking.customer;
    if (
      guestCustomer.resetPasswordExpires &&
      new Date() > new Date(guestCustomer.resetPasswordExpires)
    ) {
      return res.status(400).json({ message: 'Verification token has expired' });
    }

    // Clear token after successful verification to prevent reuse
    guestCustomer.verificationToken = null;
    guestCustomer.resetPasswordExpires = null;
    await guestCustomer.save();

    res.status(200).json({ booking, message: 'Booking found successfully' });
  } catch (error) {
    console.error('verifyGuestLookup error:', error);
    res.status(500).json({ message: 'Error verifying token', error: error.message });
  }
};

/**
 * Confirm guest booking (after successful payment)
 */
export const confirmGuestBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { bookingReference } = req.params;
    const { paymentReference, email, phone } = req.body;

    // CRITICAL: Validate payment reference is provided
    if (!paymentReference) {
      await t.rollback();
      return res.status(400).json({
        message: 'Payment reference is required to confirm booking',
      });
    }

    // SECURITY: Verify payment session exists and is successful
    const paymentSession = paymentSessions.get(paymentReference);
    if (!paymentSession) {
      console.log('❌ GUEST CONFIRM REJECTED - Payment session not found:', paymentReference);
      await t.rollback();
      return res.status(400).json({
        message: 'Invalid payment reference - payment session not found',
      });
    }

    if (paymentSession.status !== 'success') {
      console.log(
        '❌ GUEST CONFIRM REJECTED - Payment status:',
        paymentSession.status,
        'Ref:',
        paymentReference
      );
      await t.rollback();
      return res.status(400).json({
        message: `Cannot confirm booking - payment status is: ${paymentSession.status}`,
      });
    }

    // Validate input
    if (!email && !phone) {
      await t.rollback();
      return res.status(400).json({
        message: 'Email or phone is required for verification',
      });
    }

    // Find booking with guest verification
    const booking = await BusBooking.findOne({
      where: { bookingReference },
      include: [
        {
          model: Customer,
          as: 'customer',
          where: {
            isGuest: true,
            ...(email && { guestEmail: email.toLowerCase() }),
            ...(phone && { guestPhone: phone }),
          },
        },
      ],
      transaction: t,
    });

    if (!booking) {
      await t.rollback();
      return res.status(404).json({
        message: 'Booking not found or contact information does not match',
      });
    }

    // Verify payment session belongs to this booking
    if (paymentSession.bookingId !== booking.id) {
      await t.rollback();
      return res.status(400).json({
        message: 'Payment reference does not match this booking',
      });
    }

    if (booking.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({
        message: `Cannot confirm booking with status: ${booking.status}`,
      });
    }

    // Check if booking has expired
    if (booking.expiresAt && new Date() > booking.expiresAt) {
      booking.status = 'expired';
      await booking.save({ transaction: t });
      await t.rollback();
      return res.status(400).json({ message: 'Booking has expired' });
    }

    // Update booking status
    booking.status = 'confirmed';
    booking.expiresAt = null;
    booking.paymentReference = paymentReference;
    await booking.save({ transaction: t });

    // Update bus schedule available seats
    if (booking.busScheduleId) {
      const schedule = await BusSchedule.findByPk(booking.busScheduleId, { transaction: t });
      if (schedule) {
        schedule.availableSeats = Math.max(0, schedule.availableSeats - booking.seatNumbers.length);
        await schedule.save({ transaction: t });
      }
    }

    await t.commit();

    // Send booking confirmation email after successful confirmation
    try {
      // Reload booking with customer info
      const confirmedBooking = await BusBooking.findOne({
        where: { bookingReference },
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['guestName', 'guestEmail', 'guestPhone'],
          },
        ],
      });

      const guestEmail = email || confirmedBooking?.customer?.guestEmail;
      const guestName = confirmedBooking?.customer?.guestName || 'Guest';

      if (guestEmail) {
        const bookingDetails = {
          departure: confirmedBooking.departure,
          arrival: confirmedBooking.arrival,
          date: confirmedBooking.journeyDate,
          time: confirmedBooking.booking_startTime,
          seatNo: (confirmedBooking.seatNumbers || []).join(', '),
          totalPay: confirmedBooking.payment_totalPay,
          bookingReference: confirmedBooking.bookingReference,
        };

        await sendBookingConfirmation(guestEmail, guestName, bookingDetails);
        console.log('✅ Guest confirmation email sent to:', guestEmail);
      } else {
        console.log('⚠️ No email found for guest booking:', bookingReference);
      }
    } catch (emailErr) {
      console.error('Failed to send guest confirmation email:', emailErr?.message);
      // Don't fail the booking confirmation if email fails
    }

    res.status(200).json({
      message: 'Guest booking confirmed successfully',
      booking,
    });
  } catch (error) {
    await t.rollback();
    console.error('Confirm guest booking error:', error);
    res.status(400).json({
      message: 'Error confirming guest booking',
      error: error.message,
    });
  }
};

/**
 * Download E-Ticket PDF
 * Generates and downloads a PDF ticket for confirmed bookings
 */
export const downloadTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;

    // Fetch booking
    const booking = await BusBooking.findOne({
      where: {
        id,
        customerId,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only allow downloading for confirmed or completed bookings
    if (booking.status !== 'confirmed' && booking.status !== 'completed') {
      return res.status(400).json({
        message: 'E-ticket is only available for confirmed bookings',
      });
    }

    // Generate PDF
    const pdfBuffer = await generateETicket(booking);
    const filename = generateTicketFilename(booking.bookingReference);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download ticket error:', error);
    res.status(500).json({
      message: 'Error generating ticket',
      error: error.message,
    });
  }
};

/**
 * Email E-Ticket to User
 * Generates PDF and sends it via email to the user
 */
export const emailTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;
    const { email: recipientEmail } = req.body; // Optional: send to different email

    // Fetch booking and customer
    const booking = await BusBooking.findOne({
      where: {
        id,
        customerId,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only allow emailing for confirmed or completed bookings
    if (booking.status !== 'confirmed' && booking.status !== 'completed') {
      return res.status(400).json({
        message: 'E-ticket is only available for confirmed bookings',
      });
    }

    // Get customer details
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Generate PDF
    const pdfBuffer = await generateETicket(booking);

    // Prepare booking details for email
    const bookingDetails = {
      bookingReference: booking.bookingReference,
      departure: booking.departure,
      arrival: booking.arrival,
      date: new Date(booking.journeyDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: booking.booking_startTime,
      seatNo: Array.isArray(booking.seatNumbers)
        ? booking.seatNumbers.join(', ')
        : booking.seatNumbers,
      totalPay: booking.payment_totalPay,
    };

    // Send email with PDF attachment
    const emailTo = recipientEmail || customer.email;
    await sendBookingConfirmation(
      emailTo,
      customer.username,
      bookingDetails,
      pdfBuffer // Pass PDF as attachment
    );

    res.status(200).json({
      message: `E-ticket sent successfully to ${emailTo}`,
      sentTo: emailTo,
    });
  } catch (error) {
    console.error('Email ticket error:', error);
    res.status(500).json({
      message: 'Error sending e-ticket',
      error: error.message,
    });
  }
};

/**
 * Get Trip Status for Customer
 * Provides real-time trip status updates for customer's booking
 */
export const getTripStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;

    // Fetch booking with schedule details
    const booking = await BusBooking.findOne({
      where: {
        id,
        customerId,
      },
      include: [
        {
          model: BusSchedule,
          as: 'schedule',
          attributes: [
            'id',
            'status',
            'departure_date',
            'departure_time',
            'arrival_date',
            'arrival_time',
            'departedAt',
            'completedAt',
          ],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Get trip status information
    const tripStatus = {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      bookingStatus: booking.status,
      scheduleId: booking.schedule?.id,
      tripStatus: booking.schedule?.status || 'Unknown',
      departure: {
        date: booking.schedule?.departure_date,
        time: booking.schedule?.departure_time,
        actualTime: booking.schedule?.departedAt,
      },
      arrival: {
        date: booking.schedule?.arrival_date,
        time: booking.schedule?.arrival_time,
        actualTime: booking.schedule?.completedAt,
      },
      lastUpdated: new Date(),
    };

    res.json(tripStatus);
  } catch (error) {
    console.error('Get trip status error:', error);
    res.status(500).json({
      message: 'Error fetching trip status',
      error: error.message,
    });
  }
};
