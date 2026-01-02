import cron from 'node-cron';
import { Op } from 'sequelize';
import BusBooking from '../models/busBooking.js';
import Customer from '../models/Customer.js';
import BusSchedule from '../models/busSchedule.js';
import NotificationPreferences from '../models/NotificationPreferences.js';
import { sendTripReminder } from './email.js';

/**
 * Check and send trip reminders
 * Called by scheduled cron job
 */
const sendTripReminders = async () => {
  try {
    console.log('🔔 Running trip reminder check...');

    const now = new Date();

    // Get all confirmed bookings with journeys in the next 48 hours
    // that haven't had reminder sent yet
    const upcomingBookings = await BusBooking.findAll({
      where: {
        status: 'confirmed',
        reminderSentAt: null, // Only bookings that haven't received reminder yet
        journeyDate: {
          [Op.gte]: now,
          [Op.lte]: new Date(now.getTime() + 48 * 60 * 60 * 1000), // Next 48 hours
        },
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'email', 'username', 'guestEmail', 'guestName', 'isGuest'],
          include: [
            {
              model: NotificationPreferences,
              as: 'notificationPreferences',
              required: false,
            },
          ],
        },
        {
          model: BusSchedule,
          as: 'schedule',
          attributes: ['id', 'departure_time', 'arrival_time'], // Fixed: use snake_case (database column names)
        },
      ],
    });

    console.log(`Found ${upcomingBookings.length} upcoming bookings (without reminder sent)`);

    let remindersSent = 0;

    for (const booking of upcomingBookings) {
      try {
        const customer = booking.customer;

        // Skip if no customer or customer data
        if (!customer) {
          console.log(`Skipping booking ${booking.bookingReference}: No customer found`);
          continue;
        }

        // Determine email and username
        const email = customer.isGuest ? customer.guestEmail : customer.email;
        const username = customer.isGuest ? customer.guestName : customer.username;

        if (!email) {
          console.log(`Skipping booking ${booking.bookingReference}: No email available`);
          continue;
        }

        // Check notification preferences
        const preferences = customer.notificationPreferences;
        const reminderTiming = preferences?.reminderTiming || 24; // Default 24 hours

        // Calculate time until journey
        const journeyDateTime = new Date(`${booking.journeyDate}T${booking.booking_startTime}`);
        const hoursUntilJourney = (journeyDateTime - now) / (1000 * 60 * 60);

        // Send reminder if journey is within the reminder window
        // Changed logic: send if hoursUntilJourney <= reminderTiming (no upper bound)
        // This ensures we don't miss bookings made close to departure
        const shouldSendReminder = hoursUntilJourney > 0 && hoursUntilJourney <= reminderTiming;

        if (!shouldSendReminder) {
          console.log(
            `Skipping booking ${booking.bookingReference}: Outside reminder window (${hoursUntilJourney.toFixed(2)}h until journey, reminder set for ${reminderTiming}h)`
          );
          continue; // Not time to send reminder yet
        }

        // Check if email reminders are enabled (default true if no preferences)
        const emailRemindersEnabled = preferences?.emailTripReminders !== false;

        if (!emailRemindersEnabled) {
          console.log(`Skipping booking ${booking.bookingReference}: Email reminders disabled`);
          continue;
        }

        // Format booking details for email
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

        // Mark that reminder was sent to prevent duplicate sends
        await booking.update({ reminderSentAt: new Date() });

        console.log(
          `✅ Sent reminder to ${email} for booking ${booking.bookingReference} (${hoursUntilJourney.toFixed(2)}h before journey)`
        );
        remindersSent++;
      } catch (error) {
        console.error(`Error sending reminder for booking ${booking.bookingReference}:`, error);
        // Continue with next booking
      }
    }

    console.log(`✅ Trip reminder check completed. Sent ${remindersSent} reminders.`);
  } catch (error) {
    console.error('Error in trip reminder scheduler:', error);
  }
};

/**
 * Initialize trip reminder scheduler
 * Runs every hour to check for upcoming trips
 */
export const initializeTripReminderScheduler = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    await sendTripReminders();
  });

  console.log('✅ Trip reminder scheduler initialized (runs hourly)');

  // Optional: Run immediately on startup for testing
  if (process.env.NODE_ENV === 'development') {
    console.log('Running initial trip reminder check...');
    setTimeout(() => sendTripReminders(), 5000); // Run after 5 seconds
  }
};

/**
 * Manual trigger for trip reminders (for testing)
 */
export const triggerTripReminders = async (req, res) => {
  try {
    await sendTripReminders();
    res.status(200).json({
      success: true,
      message: 'Trip reminder check triggered successfully',
    });
  } catch (error) {
    console.error('Error triggering trip reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger trip reminders',
      error: error.message,
    });
  }
};
