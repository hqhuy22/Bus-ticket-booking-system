import sequelize from '../config/postgres.js';
import BusBooking from '../models/busBooking.js';
import axios from 'axios';

async function testPendingSeatsBlocked() {
  try {
    console.log('\n=== Testing Pending Seats Are Blocked ===\n');

    // Find a pending booking
    const pendingBooking = await BusBooking.findOne({
      where: { status: 'pending' },
      order: [['createdAt', 'DESC']],
    });

    if (!pendingBooking) {
      console.log('❌ No pending bookings found. Create one to test.');
      await sequelize.close();
      return;
    }

    console.log('Found pending booking:');
    console.log(`  Reference: ${pendingBooking.bookingReference}`);
    console.log(`  Schedule ID: ${pendingBooking.busScheduleId}`);
    console.log(`  Status: ${pendingBooking.status}`);
    console.log(`  Seats: [${pendingBooking.seatNumbers.join(', ')}]`);
    console.log(`  Expires: ${pendingBooking.expiresAt}`);

    // Check API
    const scheduleId = pendingBooking.busScheduleId;
    const url = `http://localhost:4000/api/seats/availability/${scheduleId}`;

    console.log(`\nCalling API: ${url}\n`);

    const response = await axios.get(url);

    console.log('API Response:');
    console.log(`  Total seats: ${response.data.totalSeats}`);
    console.log(`  Booked seats: [${response.data.bookedSeats.join(', ')}]`);
    console.log(
      `  Locked seats: [${response.data.lockedSeats.map((l) => l.seatNumber).join(', ')}]`
    );
    console.log(`  Available: ${response.data.availableSeatsCount}`);

    // Verify pending seats are in booked array
    const pendingSeatsAsStrings = pendingBooking.seatNumbers.map(String);
    const allSeatsBlocked = pendingSeatsAsStrings.every(
      (seat) =>
        response.data.bookedSeats.includes(seat) ||
        response.data.bookedSeats.includes(parseInt(seat))
    );

    console.log('\n=== VERIFICATION ===');
    if (allSeatsBlocked) {
      console.log('✅ SUCCESS: All pending booking seats are showing as BOOKED!');
      console.log('   Users cannot book these seats until booking expires or is cancelled.');
    } else {
      console.log('❌ FAILED: Pending seats are NOT blocked!');
      console.log('   Expected seats to be in bookedSeats array.');
    }

    // Also check confirmed bookings
    const confirmedBooking = await BusBooking.findOne({
      where: { status: 'confirmed' },
      order: [['createdAt', 'DESC']],
    });

    if (confirmedBooking) {
      console.log('\n=== Also checking confirmed booking ===');
      console.log(`  Reference: ${confirmedBooking.bookingReference}`);
      console.log(`  Seats: [${confirmedBooking.seatNumbers.join(', ')}]`);

      const confirmedSeatsAsStrings = confirmedBooking.seatNumbers.map(String);
      const confirmedBlocked = confirmedSeatsAsStrings.every(
        (seat) =>
          response.data.bookedSeats.includes(seat) ||
          response.data.bookedSeats.includes(parseInt(seat))
      );

      if (confirmedBlocked) {
        console.log('✅ Confirmed booking seats are also blocked.');
      } else {
        console.log('❌ Confirmed booking seats are NOT in bookedSeats!');
      }
    }

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    await sequelize.close();
    process.exit(1);
  }
}

testPendingSeatsBlocked();
