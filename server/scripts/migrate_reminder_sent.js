import sequelize from '../config/postgres.js';

/**
 * Migration script to add reminderSentAt column to bus_bookings table
 * Run this once: node scripts/migrate_reminder_sent.js
 */
async function migrateReminderSent() {
  try {
    console.log('Adding reminderSentAt field to bus_bookings table...');

    // Add column if it doesn't exist
    await sequelize.query(`
      ALTER TABLE bus_bookings 
      ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMP;
    `);

    console.log('✅ Successfully added reminderSentAt column');

    // Sync model to ensure consistency
    const BusBooking = (await import('../models/busBooking.js')).default;
    await BusBooking.sync({ alter: true });
    console.log('✅ Model synced successfully');

    // Check count
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM bus_bookings');
    console.log(`📊 Total bookings in database: ${results[0].count}`);

    console.log('\nMigration completed successfully! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateReminderSent();
