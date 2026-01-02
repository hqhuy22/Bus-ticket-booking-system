/**
 * Database Reset Script for SeatLock Table
 * Run this if you encounter unique constraint errors
 *
 * Usage: node scripts/reset_seat_locks.js
 */

import sequelize from '../config/postgres.js';
import SeatLock from '../models/SeatLock.js';
import '../models/associations.js';

async function resetSeatLocks() {
  try {
    console.log('🔄 Resetting seat_locks table...');

    // First, authenticate
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Drop and recreate the table
    await sequelize.query('DROP TABLE IF EXISTS seat_locks CASCADE;');
    console.log('✅ Dropped existing seat_locks table');

    // Recreate with new schema (without unique constraint)
    await SeatLock.sync({ force: true });
    console.log('✅ Created new seat_locks table without unique constraint');

    console.log('🎉 Reset complete!');
    console.log('💡 You can now lock, release, and re-lock seats without conflicts.');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting seat_locks table:', error);
    process.exit(1);
  }
}

resetSeatLocks();
