/**
 * Create Many Sample Reviews Script
 * Creates 30-50 sample reviews for testing pagination
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
  {
    title: 'Amazing journey',
    comment:
      'Everything exceeded my expectations. From booking to arrival, the service was top-notch!',
  },
  {
    title: 'Worth every penny',
    comment:
      'Great value for money. The bus was modern, clean, and the journey was very comfortable.',
  },
  {
    title: 'Reliable service',
    comment: 'Always on time, always professional. This is my go-to bus service for long trips.',
  },
  {
    title: 'Smooth ride',
    comment:
      'The bus was well-maintained and the ride was very smooth. Arrived refreshed and relaxed.',
  },
  {
    title: 'Friendly staff',
    comment: 'The staff went above and beyond to ensure passenger comfort. Highly appreciated!',
  },
  {
    title: 'Clean and modern',
    comment:
      'Impressed by the cleanliness and modern amenities. USB charging ports were very useful.',
  },
  {
    title: 'Safe journey',
    comment:
      'Driver was very experienced and drove safely. Felt secure throughout the entire journey.',
  },
  {
    title: 'Good amenities',
    comment: 'WiFi worked great, seats recline nicely, and the rest stops were well-timed.',
  },
  {
    title: 'Punctual arrival',
    comment: 'Departed and arrived exactly on time. Perfect for business travelers!',
  },
  {
    title: 'Spacious seats',
    comment: 'More legroom than expected. Very comfortable even for a tall person like me.',
  },
  {
    title: 'Great AC',
    comment: 'Air conditioning was perfect - not too cold, not too warm. Just right!',
  },
  {
    title: 'Will book again',
    comment: 'Had a wonderful experience. Will definitely use this service again for my next trip.',
  },
];

async function createManyReviews() {
  try {
    console.log('🌱 Creating many sample reviews for pagination testing...\n');

    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Get all schedules and customers
    const schedules = await BusSchedule.findAll();
    const customers = await Customer.findAll();

    console.log(`📊 Found ${schedules.length} schedules and ${customers.length} customers\n`);

    if (schedules.length === 0 || customers.length === 0) {
      console.log('❌ No schedules or customers found. Please run seed_mock_data.js first.');
      process.exit(1);
    }

    // Target: Create 40-50 reviews
    const targetReviews = 45;
    let createdCount = 0;
    let bookingCounter = Date.now();

    for (let i = 0; i < targetReviews; i++) {
      try {
        // Pick random schedule and customer
        const schedule = schedules[Math.floor(Math.random() * schedules.length)];
        const customer = customers[Math.floor(Math.random() * customers.length)];

        // Generate random past date (within last 60 days)
        const daysAgo = Math.floor(Math.random() * 60) + 1;
        const journeyDate = new Date();
        journeyDate.setDate(journeyDate.getDate() - daysAgo);
        journeyDate.setHours(0, 0, 0, 0);

        // Calculate prices
        const busFare = 150000 + Math.floor(Math.random() * 100000);
        const convenienceFee = Math.floor(busFare * 0.02);
        const bankCharge = 3000;
        const totalPay = busFare + convenienceFee + bankCharge;

        // Random seat number
        const seatNum = Math.floor(Math.random() * 40) + 1;

        // Create completed booking
        const booking = await BusBooking.create({
          customerId: customer.id,
          busScheduleId: schedule.id,
          routeNo: schedule.routeNo || 1,
          bookingReference: `BK${bookingCounter++}`,
          seatNumbers: [seatNum],
          booking_startTime: schedule.departure_time,
          booking_endTime: schedule.arrival_time,
          status: 'completed',
          journeyDate: journeyDate,
          departure: schedule.departure_city || 'Hanoi',
          arrival: schedule.arrival_city || 'Ho Chi Minh',
          depotName: schedule.depotName,
          payment_busFare: busFare,
          payment_convenienceFee: convenienceFee,
          payment_bankCharge: bankCharge,
          payment_totalPay: totalPay,
          passengers: [
            {
              name: customer.username || 'Passenger',
              age: 25 + Math.floor(Math.random() * 30),
              gender: Math.random() > 0.5 ? 'Male' : 'Female',
              seatNumber: seatNum,
            },
          ],
          pickupPoint: schedule.departure_city || 'Hanoi',
          dropoffPoint: schedule.arrival_city || 'Ho Chi Minh',
        });

        // Pick random review template
        const reviewData = reviewComments[Math.floor(Math.random() * reviewComments.length)];

        // Generate ratings (3-5 stars, weighted toward 4-5)
        const ratingWeights = [3, 3, 3, 4, 4, 4, 4, 5, 5, 5];
        const rating = ratingWeights[Math.floor(Math.random() * ratingWeights.length)];

        // Create review
        await Review.create({
          customerId: booking.customerId,
          busScheduleId: booking.busScheduleId,
          bookingId: booking.id,
          rating: rating,
          title: reviewData.title,
          comment: reviewData.comment,
          cleanlinessRating: Math.floor(Math.random() * 3) + 3, // 3-5
          comfortRating: Math.floor(Math.random() * 3) + 3, // 3-5
          punctualityRating: Math.floor(Math.random() * 3) + 3, // 3-5
          staffRating: Math.floor(Math.random() * 3) + 3, // 3-5
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

        if ((i + 1) % 10 === 0) {
          console.log(`✅ Created ${i + 1}/${targetReviews} reviews...`);
        }
      } catch (err) {
        console.error(`❌ Error creating review ${i + 1}:`, err.message);
      }
    }

    // Get total review count
    const totalReviews = await Review.count();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successfully created ${createdCount} new reviews!`);
    console.log(`📊 Total reviews in database: ${totalReviews}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Show review distribution by rating
    const distribution = await Review.findAll({
      attributes: ['rating', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['rating'],
      order: [['rating', 'DESC']],
    });

    console.log('📊 Review Distribution:');
    distribution.forEach((d) => {
      const stars = '⭐'.repeat(d.rating);
      console.log(`   ${stars} (${d.rating}): ${d.dataValues.count} reviews`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

createManyReviews();
