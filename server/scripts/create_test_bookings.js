/**
 * Booking Flow Testing Script
 * Creates sample booking data for testing the new booking system
 */

import sequelize from '../config/postgres.js';
import BusBooking from '../models/busBooking.js';
import Customer from '../models/Customer.js';
import BusSchedule from '../models/busSchedule.js';
import bcrypt from 'bcryptjs';

async function createTestData() {
  console.log('🧪 Creating test data for booking flow...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Create or find test customer
    console.log('👤 Creating test customer...');

    const [testCustomer, created] = await Customer.findOrCreate({
      where: { email: 'test@bookingflow.com' },
      defaults: {
        username: 'testuser',
        email: 'test@bookingflow.com',
        password: await bcrypt.hash('Test@123', 10),
        position: 'customer',
        isVerified: true,
        provider: 'local',
      },
    });

    if (created) {
      console.log('✅ Test customer created');
      console.log('   Email: test@bookingflow.com');
      console.log('   Password: Test@123\n');
    } else {
      console.log('✅ Test customer already exists\n');
    }

    // Create sample bookings with different statuses
    console.log('📝 Creating sample bookings...\n');

    const sampleBookings = [
      {
        customerId: testCustomer.id,
        routeNo: 87,
        departure: 'Colombo',
        arrival: 'Jaffna',
        depotName: 'Colombo Central Depot',
        seatNumbers: [12],
        booking_startTime: '09:00 AM',
        booking_endTime: '07:00 PM',
        journeyDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'confirmed',
        passengers: [
          {
            seatNumber: 12,
            name: 'Kamal Perera',
            age: 35,
            gender: 'male',
            idNumber: '851234567V',
            phone: '+94771234567',
            email: 'kamal@example.com',
            nationality: 'Sri Lankan',
          },
        ],
        payment_busFare: 1378.0,
        payment_convenienceFee: 68.9,
        payment_bankCharge: 27.56,
        payment_totalPay: 1474.46,
      },
      {
        customerId: testCustomer.id,
        routeNo: 45,
        departure: 'Kandy',
        arrival: 'Colombo',
        depotName: 'Kandy Main Depot',
        seatNumbers: [23, 24],
        booking_startTime: '06:00 AM',
        booking_endTime: '09:30 AM',
        journeyDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'confirmed',
        passengers: [
          {
            seatNumber: 23,
            name: 'Nimalka Silva',
            age: 28,
            gender: 'female',
            idNumber: '961234567V',
            phone: '+94767654321',
            email: 'nimalka@example.com',
            nationality: 'Sri Lankan',
          },
          {
            seatNumber: 24,
            name: 'Sunil Fernando',
            age: 32,
            gender: 'male',
            idNumber: '921234567V',
            phone: '+94767654321',
            email: 'sunil@example.com',
            nationality: 'Sri Lankan',
          },
        ],
        payment_busFare: 1800.0,
        payment_convenienceFee: 90.0,
        payment_bankCharge: 36.0,
        payment_totalPay: 1926.0,
      },
      {
        customerId: testCustomer.id,
        routeNo: 12,
        departure: 'Galle',
        arrival: 'Matara',
        depotName: 'Galle Bus Station',
        seatNumbers: [15, 16, 17],
        booking_startTime: '02:00 PM',
        booking_endTime: '04:00 PM',
        journeyDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        status: 'pending',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // Expires in 15 minutes
        passengers: [
          {
            seatNumber: 15,
            name: 'Priya Jayawardene',
            age: 45,
            gender: 'female',
            idNumber: '781234567V',
            phone: '+94715555555',
            nationality: 'Sri Lankan',
          },
          {
            seatNumber: 16,
            name: 'Rajesh Kumar',
            age: 12,
            gender: 'male',
            idNumber: 'P123456',
            phone: '+94715555555',
            nationality: 'Indian',
          },
          {
            seatNumber: 17,
            name: 'Ananya Kumar',
            age: 10,
            gender: 'female',
            idNumber: 'P123457',
            phone: '+94715555555',
            nationality: 'Indian',
          },
        ],
        payment_busFare: 1500.0,
        payment_convenienceFee: 75.0,
        payment_bankCharge: 30.0,
        payment_totalPay: 1605.0,
      },
      {
        customerId: testCustomer.id,
        routeNo: 87,
        departure: 'Colombo',
        arrival: 'Jaffna',
        depotName: 'Colombo Central Depot',
        seatNumbers: [8],
        booking_startTime: '09:00 AM',
        booking_endTime: '07:00 PM',
        journeyDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        status: 'completed',
        passengers: [
          {
            seatNumber: 8,
            name: 'Kasun Bandara',
            age: 29,
            gender: 'male',
            idNumber: '951234567V',
            phone: '+94718888888',
            email: 'kasun@example.com',
            nationality: 'Sri Lankan',
          },
        ],
        payment_busFare: 1378.0,
        payment_convenienceFee: 68.9,
        payment_bankCharge: 27.56,
        payment_totalPay: 1474.46,
      },
      {
        customerId: testCustomer.id,
        routeNo: 23,
        departure: 'Kandy',
        arrival: 'Nuwara Eliya',
        depotName: 'Kandy Bus Terminal',
        seatNumbers: [5, 6],
        booking_startTime: '08:00 AM',
        booking_endTime: '11:00 AM',
        journeyDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: 'Travel plans changed',
        passengers: [
          {
            seatNumber: 5,
            name: 'Dilshan Wickramasinghe',
            age: 38,
            gender: 'male',
            idNumber: '861234567V',
            phone: '+94719999999',
            nationality: 'Sri Lankan',
          },
          {
            seatNumber: 6,
            name: 'Chamari Wickramasinghe',
            age: 35,
            gender: 'female',
            idNumber: '891234567V',
            phone: '+94719999999',
            nationality: 'Sri Lankan',
          },
        ],
        payment_busFare: 1200.0,
        payment_convenienceFee: 60.0,
        payment_bankCharge: 24.0,
        payment_totalPay: 1284.0,
      },
    ];

    let createdCount = 0;
    for (const bookingData of sampleBookings) {
      const booking = await BusBooking.create(bookingData);
      createdCount++;
      console.log(`✅ Booking ${createdCount}: ${booking.bookingReference} (${booking.status})`);
      console.log(`   Route: ${booking.departure} → ${booking.arrival}`);
      console.log(`   Seats: ${booking.seatNumbers.join(', ')}`);
      console.log(`   Passengers: ${booking.passengers.length}`);
      console.log(`   Total: Rs. ${booking.payment_totalPay}\n`);
    }

    console.log(`\n✅ Created ${createdCount} sample bookings\n`);

    // Summary
    console.log('📊 Summary:');
    const statusCounts = await BusBooking.findAll({
      where: { customerId: testCustomer.id },
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
      group: ['status'],
    });

    console.table(
      statusCounts.map((s) => ({
        Status: s.status,
        Count: s.dataValues.count,
      }))
    );

    console.log('\n🎯 Test Data Created Successfully!\n');
    console.log('📝 You can now test the booking flow with:');
    console.log('   Email: test@bookingflow.com');
    console.log('   Password: Test@123\n');
    console.log('🔗 Test URLs:');
    console.log('   Login: http://localhost:5173/bus-booking/login');
    console.log('   Dashboard: http://localhost:5173/bus-booking/dashboard');
    console.log('   Bookings: http://localhost:5173/bus-booking/bookings\n');
  } catch (error) {
    console.error('\n❌ Error creating test data:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    console.log('📡 Database connection closed');
  }
}

// Run script
createTestData();
