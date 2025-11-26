/**
 * Create Sample Reviews Script
 * Creates sample reviews for testing the review endpoints
 */

import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/postgres.js';
import Review from '../models/Review.js';
import BusBooking from '../models/busBooking.js';
import BusSchedule from '../models/busSchedule.js';
import Customer from '../models/Customer.js';
import '../models/associations.js';

const reviewComments = [
  {
    title: 'Excellent service!',
    comment:
      'The bus was very clean and comfortable. The driver was professional and courteous. Will definitely book again!',
  },
  {
    title: 'Great experience',
    comment:
      'Smooth journey, on-time departure and arrival. The seats were spacious and the AC worked perfectly.',
  },
  {
    title: 'Highly recommend',
    comment:
      'Best bus service I have used in Vietnam. Staff were friendly and helpful. Great value for money!',
  },
  {
    title: 'Very satisfied',
    comment:
      'Clean bus, comfortable seats, and professional driver. The journey was smooth and enjoyable.',
  },
  {
    title: 'Good value',
    comment:
      'For the price, this is excellent service. The bus was well-maintained and the journey was comfortable.',
  },
  {
    title: 'Professional service',
    comment: 'Everything was as expected. On-time departure, clean bus, and friendly staff.',
  },
  {
    title: 'Comfortable journey',
    comment:
      'The seats were very comfortable for the long journey. WiFi worked well and staff were attentive.',
  },
  {
    title: 'Pleasant trip',
    comment:
      'Nice clean bus with good amenities. Driver was experienced and drove safely. Would use again!',
  },
];

async function createSampleReviews() {
  try {
    console.log('🌱 Creating sample reviews...\n');

    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Get completed bookings with schedules
    const bookings = await BusBooking.findAll({
      where: { status: 'completed' },
      limit: 20,
      include: [
        {
          model: BusSchedule,
          as: 'schedule',
          where: { isCompleted: true },
          required: true,
        },
      ],
    });

    console.log(`Found ${bookings.length} completed bookings\n`);

    if (bookings.length === 0) {
      console.log('⚠️  No completed bookings found. Creating some...\n');

      // Get some schedules and customers
      const schedules = await BusSchedule.findAll({ limit: 5 });
      const customers = await Customer.findAll({ limit: 3 });

      if (schedules.length === 0 || customers.length === 0) {
        console.log('❌ No schedules or customers found. Please run seed_mock_data.js first.');
        process.exit(1);
      }

      // Create completed bookings
      for (let i = 0; i < Math.min(5, schedules.length); i++) {
        const schedule = schedules[i];
        const customer = customers[i % customers.length];

        const booking = await BusBooking.create({
          customerId: customer.id,
          busScheduleId: schedule.id,
          bookingReference: `BK${Date.now()}${i}`,
          seatNumbers: ['A1', 'A2'],
          totalSeats: 2,
          baseFare: 200000,
          totalFare: 200000,
          status: 'completed',
          paymentStatus: 'paid',
          journeyDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          departure: schedule.departure_location || 'Hanoi',
          arrival: schedule.arrival_location || 'Ho Chi Minh',
          departureTime: schedule.departure_time,
          arrivalTime: schedule.arrival_time,
          depotName: schedule.depotName,
          contactName: customer.username,
          contactEmail: customer.email,
          contactPhone: customer.phone || '0123456789',
        });

        // Mark schedule as completed
        await schedule.update({ isCompleted: true });

        bookings.push(booking);
        console.log(`✅ Created completed booking: ${booking.bookingReference}`);
      }

      console.log('');
    }

    // Create reviews
    let createdCount = 0;

    for (const booking of bookings) {
      try {
        // Check if review already exists
        const existing = await Review.findOne({ where: { bookingId: booking.id } });
        if (existing) {
          console.log(`⏭️  Review already exists for booking ${booking.bookingReference}`);
          continue;
        }

        const reviewData = reviewComments[Math.floor(Math.random() * reviewComments.length)];
        const rating = 4 + Math.floor(Math.random() * 2); // 4 or 5 stars

        await Review.create({
          customerId: booking.customerId,
          busScheduleId: booking.busScheduleId,
          bookingId: booking.id,
          rating: rating,
          title: reviewData.title,
          comment: reviewData.comment,
          cleanlinessRating: 4 + Math.floor(Math.random() * 2),
          comfortRating: 4 + Math.floor(Math.random() * 2),
          punctualityRating: 4 + Math.floor(Math.random() * 2),
          staffRating: 4 + Math.floor(Math.random() * 2),
          journeyDate: booking.journeyDate,
          routeInfo: {
            departure: booking.departure,
            arrival: booking.arrival,
            depotName: booking.depotName,
          },
          isVerified: true,
          isVisible: true,
        });

        createdCount++;
        console.log(
          `✅ Created review for booking ${booking.bookingReference} (Rating: ${rating}⭐)`
        );
      } catch (err) {
        console.error(
          `❌ Error creating review for booking ${booking.bookingReference}:`,
          err.message
        );
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successfully created ${createdCount} reviews!`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

createSampleReviews();
