import sequelize from '../config/postgres.js';
import BusBooking from '../models/busBooking.js';
import SeatLock from '../models/SeatLock.js';
import { Op } from 'sequelize';

async function testConfirmBooking() {
  const t = await sequelize.transaction();

  try {
    console.log('\n=== Testing Booking Confirmation ===\n');

    // Find a pending booking
    const pendingBooking = await BusBooking.findOne({
      where: { status: 'pending' },
      transaction: t,
    });

    if (!pendingBooking) {
      console.log('No pending bookings found to test.');
      await t.rollback();
      await sequelize.close();
      return;
    }

    console.log(`Found pending booking: ${pendingBooking.bookingReference}`);
    console.log(`  Schedule ID: ${pendingBooking.busScheduleId}`);
    console.log(`  Seats: [${pendingBooking.seatNumbers.join(', ')}]`);
    console.log(`  Status BEFORE: ${pendingBooking.status}`);

    // Check current seat locks
    const currentLocks = await SeatLock.findAll({
      where: {
        scheduleId: pendingBooking.busScheduleId,
        seatNumber: { [Op.in]: pendingBooking.seatNumbers.map(String) },
      },
      transaction: t,
    });

    console.log(`\nSeat locks BEFORE:`);
    currentLocks.forEach((lock) => {
      console.log(`  Seat ${lock.seatNumber}: ${lock.status}`);
    });

    // Simulate confirmation
    pendingBooking.status = 'confirmed';
    pendingBooking.expiresAt = null;
    await pendingBooking.save({ transaction: t });

    // Update seat locks
    await SeatLock.update(
      { status: 'confirmed' },
      {
        where: {
          scheduleId: pendingBooking.busScheduleId,
          seatNumber: { [Op.in]: pendingBooking.seatNumbers.map(String) },
          status: 'locked',
        },
        transaction: t,
      }
    );

    console.log(`\nStatus AFTER: ${pendingBooking.status}`);

    // Check updated seat locks
    const updatedLocks = await SeatLock.findAll({
      where: {
        scheduleId: pendingBooking.busScheduleId,
        seatNumber: { [Op.in]: pendingBooking.seatNumbers.map(String) },
      },
      transaction: t,
    });

    console.log(`\nSeat locks AFTER:`);
    updatedLocks.forEach((lock) => {
      console.log(`  Seat ${lock.seatNumber}: ${lock.status}`);
    });

    // Commit transaction
    await t.commit();
    console.log('\n✅ Booking confirmed successfully!\n');

    // Verify the changes
    const confirmedBooking = await BusBooking.findByPk(pendingBooking.id);
    const finalLocks = await SeatLock.findAll({
      where: {
        scheduleId: pendingBooking.busScheduleId,
        seatNumber: { [Op.in]: pendingBooking.seatNumbers.map(String) },
      },
    });

    console.log('=== VERIFICATION ===');
    console.log(`Booking ${confirmedBooking.bookingReference} status: ${confirmedBooking.status}`);
    console.log('Seat locks:');
    finalLocks.forEach((lock) => {
      console.log(`  Seat ${lock.seatNumber}: ${lock.status}`);
    });

    console.log('\n=== Now test seat availability API ===');
    console.log(`\nQuery this endpoint to see booked seats:`);
    console.log(`GET /api/seats/availability/${pendingBooking.busScheduleId}\n`);

    await sequelize.close();
  } catch (error) {
    await t.rollback();
    console.error('Error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

testConfirmBooking();
