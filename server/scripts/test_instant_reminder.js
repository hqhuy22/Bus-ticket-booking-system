/**
 * Test script to check instant trip reminder functionality
 * This simulates confirming a booking that's < 24 hours before departure
 */

import dotenv from 'dotenv';
import sequelize from '../config/postgres.js';
import BusBooking from '../models/busBooking.js';
import Customer from '../models/Customer.js';
import NotificationPreferences from '../models/NotificationPreferences.js';
import BusSchedule from '../models/busSchedule.js';
import { sendTripReminder } from '../utils/email.js';

dotenv.config();

const testInstantReminder = async () => {
  try {
    console.log('=== Testing Instant Trip Reminder ===\n');

    // Find a confirmed booking
    const booking = await BusBooking.findOne({
      where: { status: 'confirmed' },
      order: [['createdAt', 'DESC']],
    });

    if (!booking) {
      console.log('❌ No confirmed booking found. Create a booking first.');
      return;
    }

    console.log(`✅ Found booking: ${booking.bookingReference}`);
    console.log(`   Journey Date: ${booking.journeyDate}`);
    console.log(`   Start Time: ${booking.booking_startTime}`);
    console.log(`   Departure Time: ${booking.departureTime}`);
    console.log(`   Customer ID: ${booking.customerId}`);
    console.log(`   Reminder Sent At: ${booking.reminderSentAt || 'null'}\n`);

    // Calculate hours until journey
    const now = new Date();
    const startTime = booking.booking_startTime || booking.departureTime;

    if (!startTime) {
      console.log('❌ No start time available for booking');
      return;
    }

    // Format journeyDate properly (handle Date object or string)
    let journeyDateStr;
    if (booking.journeyDate instanceof Date) {
      // It's a Date object, format it as YYYY-MM-DD
      journeyDateStr = booking.journeyDate.toISOString().split('T')[0];
    } else {
      // It's already a string
      journeyDateStr = booking.journeyDate;
    }

    console.log(`   Formatted journey date: ${journeyDateStr}`);

    const journeyDateTime = new Date(`${journeyDateStr}T${startTime}`);

    if (isNaN(journeyDateTime.getTime())) {
      console.log(`❌ Invalid journey date/time: ${journeyDateStr}T${startTime}`);
      return;
    }

    const hoursUntilJourney = (journeyDateTime - now) / (1000 * 60 * 60);
    console.log(`⏰ Journey DateTime: ${journeyDateTime.toISOString()}`);
    console.log(`⏰ Current DateTime: ${now.toISOString()}`);
    console.log(`⏰ Hours until journey: ${hoursUntilJourney.toFixed(2)}\n`);

    // Get customer
    const customer = await Customer.findByPk(booking.customerId);

    if (!customer) {
      console.log('❌ Customer not found');
      return;
    }

    console.log(`✅ Customer found: ${customer.username || customer.guestName}`);
    console.log(`   Email: ${customer.email || customer.guestEmail}`);
    console.log(`   Is Guest: ${customer.isGuest || false}\n`);

    // Get notification preferences
    const preferences = await NotificationPreferences.findOne({
      where: { customerId: customer.id },
    });

    const reminderTiming = preferences?.reminderTiming || 24;
    const emailEnabled = preferences?.emailTripReminders !== false;

    console.log(`✅ Notification Preferences:`);
    console.log(`   Reminder Timing: ${reminderTiming}h`);
    console.log(`   Email Reminders Enabled: ${emailEnabled}\n`);

    // Check if reminder should be sent
    if (booking.reminderSentAt) {
      console.log(`⚠️  Reminder already sent at: ${booking.reminderSentAt}`);
      console.log(`   To test again, reset with:`);
      console.log(`   UPDATE bus_bookings SET reminder_sent_at = NULL WHERE id = ${booking.id};\n`);
    }

    if (hoursUntilJourney <= 0) {
      console.log('❌ Journey already passed. Cannot send reminder.\n');
      return;
    }

    if (hoursUntilJourney > reminderTiming) {
      console.log(`⚠️  Journey is ${hoursUntilJourney.toFixed(2)}h away (> ${reminderTiming}h)`);
      console.log('   Reminder will be sent later by scheduler or when confirming booking.\n');
      return;
    }

    if (!emailEnabled) {
      console.log('❌ Email reminders are disabled for this customer.\n');
      return;
    }

    // Prepare booking details for email
    const email = customer.isGuest ? customer.guestEmail : customer.email;
    const username = customer.isGuest ? customer.guestName : customer.username;

    if (!email) {
      console.log('❌ No email address for customer.\n');
      return;
    }

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
      time: booking.booking_startTime || booking.departureTime,
      seatNo: Array.isArray(booking.seatNumbers)
        ? booking.seatNumbers.join(', ')
        : booking.seatNumbers,
      totalPay: booking.payment_totalPay,
    };

    console.log('📧 Sending trip reminder email...\n');
    console.log(`   To: ${email}`);
    console.log(`   Username: ${username}`);
    console.log(`   Booking Ref: ${bookingDetails.bookingReference}`);
    console.log(`   Route: ${bookingDetails.departure} → ${bookingDetails.arrival}`);
    console.log(`   Date: ${bookingDetails.date}`);
    console.log(`   Time: ${bookingDetails.time}`);
    console.log(`   Seats: ${bookingDetails.seatNo}\n`);

    // Send the email
    try {
      await sendTripReminder(email, username, bookingDetails);
      console.log('\n✅ Trip reminder sent successfully!');

      // Update reminderSentAt
      await booking.update({ reminderSentAt: new Date() });
      console.log(`✅ Updated reminderSentAt in database\n`);
    } catch (emailError) {
      console.error('\n❌ Failed to send trip reminder:', emailError.message);
      console.error('Stack:', emailError.stack);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    console.log('\n=== Test Complete ===');
  }
};

// Run the test
testInstantReminder();
