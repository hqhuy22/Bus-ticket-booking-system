/**
 * Quick Database Check Script
 * Shows what data currently exists in the database
 */

import sequelize from '../config/postgres.js';
import Customer from '../models/Customer.js';
import Bus from '../models/Bus.js';
import Route from '../models/Route.js';
import BusSchedule from '../models/busSchedule.js';
import BusBooking from '../models/busBooking.js';
import Review from '../models/Review.js';
import ChatHistory from '../models/ChatHistory.js';

async function checkDatabase() {
  try {
    console.log('🔍 Checking Database...\n');

    await sequelize.authenticate();
    console.log('✅ Database Connected\n');

    // Count records
    const customerCount = await Customer.count();
    const busCount = await Bus.count();
    const routeCount = await Route.count();
    const scheduleCount = await BusSchedule.count();
    const bookingCount = await BusBooking.count();
    const reviewCount = await Review.count();
    const chatCount = await ChatHistory.count();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DATABASE SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👥 Customers:      ${customerCount}`);
    console.log(`🚌 Buses:          ${busCount}`);
    console.log(`🛣️  Routes:         ${routeCount}`);
    console.log(`📅 Schedules:      ${scheduleCount}`);
    console.log(`🎫 Bookings:       ${bookingCount}`);
    console.log(`⭐ Reviews:        ${reviewCount}`);
    console.log(`💬 Chat Messages:  ${chatCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Show sample users
    if (customerCount > 0) {
      console.log('👥 Sample Users:');
      const users = await Customer.findAll({
        limit: 5,
        attributes: ['email', 'username', 'fullName', 'position', 'provider'],
      });
      users.forEach((u) => {
        console.log(`  - ${u.email} (${u.fullName || u.username}) - ${u.position}`);
      });
      console.log('');
    }

    // Show sample buses
    if (busCount > 0) {
      console.log('🚌 Sample Buses:');
      const buses = await Bus.findAll({
        limit: 5,
        attributes: ['busNumber', 'plateNumber', 'busType', 'totalSeats', 'status'],
      });
      buses.forEach((b) => {
        console.log(`  - ${b.busNumber} (${b.plateNumber || 'N/A'}) - ${b.busType} - ${b.status}`);
      });
      console.log('');
    }

    // Show sample routes
    if (routeCount > 0) {
      console.log('🛣️  Sample Routes:');
      const routes = await Route.findAll({
        limit: 5,
        attributes: ['routeNo', 'routeName', 'origin', 'destination', 'status'],
      });
      routes.forEach((r) => {
        console.log(`  - Route ${r.routeNo}: ${r.origin} → ${r.destination}`);
      });
      console.log('');
    }

    // Show schedules by status
    if (scheduleCount > 0) {
      console.log('📅 Schedules by Status:');
      const statuses = await sequelize.query(
        'SELECT status, COUNT(*) as count FROM bus_schedules GROUP BY status ORDER BY count DESC',
        { type: sequelize.QueryTypes.SELECT }
      );
      statuses.forEach((s) => {
        console.log(`  - ${s.status}: ${s.count}`);
      });
      console.log('');
    }

    // Show bookings by status
    if (bookingCount > 0) {
      console.log('🎫 Bookings by Status:');
      const statuses = await sequelize.query(
        'SELECT status, COUNT(*) as count FROM bus_bookings GROUP BY status ORDER BY count DESC',
        { type: sequelize.QueryTypes.SELECT }
      );
      statuses.forEach((s) => {
        console.log(`  - ${s.status}: ${s.count}`);
      });
      console.log('');
    }

    // Check if mock data is present
    const adminExists = await Customer.findOne({ where: { email: 'admin@busbook.com' } });
    const johnExists = await Customer.findOne({ where: { email: 'john.doe@gmail.com' } });
    const vn001Exists = await Bus.findOne({ where: { busNumber: 'VN-001' } });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 MOCK DATA CHECK');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Admin account (admin@busbook.com): ${adminExists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`Test user (john.doe@gmail.com):    ${johnExists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`Test bus (VN-001):                 ${vn001Exists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!adminExists || !johnExists || !vn001Exists) {
      console.log('💡 TIP: Run seed script to add mock data:');
      console.log('   npm run seed-mock');
      console.log('   OR');
      console.log('   node scripts/seed_mock_data.js\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
