import sequelize from '../config/postgres.js';
import BusBooking from '../models/busBooking.js';
import SeatLock from '../models/SeatLock.js';

async function checkBookings() {
  try {
    console.log('\n=== Checking Bookings and Seat Locks ===\n');

    // Get all bookings
    const allBookings = await BusBooking.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    console.log(`Total bookings (last 10): ${allBookings.length}\n`);

    allBookings.forEach((booking, idx) => {
      console.log(`${idx + 1}. Booking ${booking.bookingReference}`);
      console.log(`   ID: ${booking.id}`);
      console.log(`   Schedule ID: ${booking.busScheduleId}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Seats: [${booking.seatNumbers?.join(', ') || 'none'}]`);
      console.log(`   Customer: ${booking.customerId}`);
      console.log('');
    });

    // Get confirmed bookings specifically
    const confirmedBookings = await BusBooking.findAll({
      where: {
        status: 'confirmed',
      },
    });

    console.log(`\n=== Confirmed Bookings: ${confirmedBookings.length} ===`);
    confirmedBookings.forEach((booking, idx) => {
      console.log(
        `${idx + 1}. ${booking.bookingReference} - Schedule ${booking.busScheduleId} - Seats: [${booking.seatNumbers?.join(', ')}]`
      );
    });

    // Get seat locks
    const seatLocks = await SeatLock.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    console.log(`\n=== Seat Locks (last 20): ${seatLocks.length} ===`);
    const locksByStatus = {};
    seatLocks.forEach((lock) => {
      if (!locksByStatus[lock.status]) {
        locksByStatus[lock.status] = [];
      }
      locksByStatus[lock.status].push(lock);
    });

    Object.keys(locksByStatus).forEach((status) => {
      console.log(`\n${status.toUpperCase()}: ${locksByStatus[status].length} locks`);
      locksByStatus[status].slice(0, 5).forEach((lock) => {
        console.log(
          `  - Seat ${lock.seatNumber}, Schedule ${lock.scheduleId}, Booking ${lock.bookingId || 'N/A'}`
        );
      });
    });

    console.log('\n=== Done ===\n');
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

checkBookings();
