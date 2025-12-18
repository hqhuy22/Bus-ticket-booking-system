/**
 * Database Migration Script for Booking Flow Updates
 * Run this script to update the database schema for the new booking system
 */

import sequelize from '../config/postgres.js';
import BusBooking from '../models/busBooking.js';
import Customer from '../models/Customer.js';
import BusSchedule from '../models/busSchedule.js';

async function migrateBookingSchema(closeConnection = true) {
  console.log('🔄 Starting booking schema migration...\n');

  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Backup warning
    console.log('⚠️  WARNING: This will modify the bus_bookings table');
    console.log('💾 Please ensure you have a database backup before proceeding\n');

    // Show current table structure
    console.log('📊 Current table structure:');
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bus_bookings'
      ORDER BY ordinal_position;
    `);

    if (results.length > 0) {
      console.table(results);
    } else {
      console.log('ℹ️  Table does not exist yet (will be created)\n');
    }

    // Sync models (this will update the schema)
    console.log('\n🔧 Updating database schema...');

    // Use alter: true to modify existing table structure
    // Use force: false to preserve existing data
    console.log('\n\ud83d\udd27 Preparing safe migrations...');

    // Ensure enum type for status exists and migrate existing column safely
    const enumTypeName = 'enum_bus_bookings_status';
    const desiredEnumValues = ['pending', 'confirmed', 'cancelled', 'completed', 'expired'];

    // Check if enum type exists
    const [enumExistsResult] = await sequelize.query(
      `SELECT 1 FROM pg_type WHERE typname = '${enumTypeName}';`
    );

    if (enumExistsResult.length === 0) {
      console.log(`\u2795 Creating enum type ${enumTypeName}...`);
      await sequelize.query(
        `CREATE TYPE ${enumTypeName} AS ENUM (${desiredEnumValues.map((v) => `'${v}'`).join(', ')});`
      );
      console.log(`\u2705 Enum type ${enumTypeName} created`);
    } else {
      console.log(`\u2705 Enum type ${enumTypeName} already exists`);
    }

    // Inspect current column type
    const [colInfo] = await sequelize.query(`
        SELECT data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'bus_bookings' AND column_name = 'status';
      `);

    if (colInfo.length > 0 && colInfo[0].udt_name !== enumTypeName) {
      console.log(
        '\n\u26a0\ufe0f Detected status column with incompatible type — performing safe column swap'
      );

      // Drop default to avoid cast issues
      try {
        await sequelize.query(`ALTER TABLE bus_bookings ALTER COLUMN status DROP DEFAULT;`);
        console.log('\u2705 Dropped existing default on status');
      } catch (e) {
        console.log('\u26a0\ufe0f Could not drop default (it may not exist) — continuing');
      }

      // Add temp column with correct enum type
      await sequelize.query(`ALTER TABLE bus_bookings ADD COLUMN status_new ${enumTypeName};`);
      console.log('\u2705 Added temporary column status_new');

      // Copy values safely: try to cast, fallback to 'pending' for unknown values
      try {
        await sequelize.query(`
            UPDATE bus_bookings
            SET status_new = CASE
              WHEN status::text IN (${desiredEnumValues.map((v) => `'${v}'`).join(', ')}) THEN status::text::${enumTypeName}
              ELSE 'pending'::${enumTypeName}
            END;
          `);
        console.log('\u2705 Values copied to status_new');
      } catch (copyErr) {
        console.error('\u274c Failed to copy status values:', copyErr.message);
        console.error('\u2139\ufe0f You may need to manually inspect conflicting rows');
        throw copyErr;
      }

      // Swap columns
      await sequelize.query(`ALTER TABLE bus_bookings DROP COLUMN status;`);
      await sequelize.query(`ALTER TABLE bus_bookings RENAME COLUMN status_new TO status;`);
      await sequelize.query(`ALTER TABLE bus_bookings ALTER COLUMN status SET DEFAULT 'pending';`);
      console.log('\u2705 Swapped status column to enum type and set default to pending');
    } else {
      console.log(
        '\u2705 status column already uses the target enum type or table missing — no swap needed'
      );
    }

    console.log('\n\ud83d\udd27 Updating database schema (Sequelize sync)...');
    // Use alter: true to modify existing table structure; preserve existing data
    await sequelize.sync({ alter: true });

    console.log('✅ Schema update successful\n');

    // Show new table structure
    console.log('📊 Updated table structure:');
    const [newResults] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bus_bookings'
      ORDER BY ordinal_position;
    `);
    console.table(newResults);

    // Check for existing bookings
    const bookingCount = await BusBooking.count();
    console.log(`\n📈 Total bookings in database: ${bookingCount}`);

    if (bookingCount > 0) {
      console.log('\n⚠️  ATTENTION: Existing bookings detected!');
      console.log('📝 You may need to manually migrate old booking data to the new format.');
      console.log('   Consider running a data migration script to:');
      console.log('   1. Convert seatNo → seatNumbers array');
      console.log('   2. Convert customer fields → passengers JSONB');
      console.log('   3. Add customerId references');
      console.log('   4. Generate booking references');
    }

    // Create indexes for better performance
    console.log('\n🔍 Creating database indexes...');

    try {
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_bookings_customer 
        ON bus_bookings(customerId);
      `);
      console.log('✅ Customer index created');

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_bookings_schedule 
        ON bus_bookings(busScheduleId);
      `);
      console.log('✅ Schedule index created');

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_bookings_status 
        ON bus_bookings(status);
      `);
      console.log('✅ Status index created');

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_bookings_reference 
        ON bus_bookings(bookingReference);
      `);
      console.log('✅ Booking reference index created');

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_bookings_journey_date 
        ON bus_bookings(journeyDate);
      `);
      console.log('✅ Journey date index created');
    } catch (indexError) {
      console.log('⚠️  Some indexes may already exist (this is okay)');
    }

    // Verify the model associations
    console.log('\n🔗 Verifying model relationships...');

    // Check if associations are defined
    if (BusBooking.associations.Customer) {
      console.log('✅ BusBooking → Customer association exists');
    } else {
      console.log('⚠️  BusBooking → Customer association not found');
    }

    if (BusBooking.associations.BusSchedule) {
      console.log('✅ BusBooking → BusSchedule association exists');
    } else {
      console.log('⚠️  BusBooking → BusSchedule association not found');
    }

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Test the booking flow');
    console.log('3. Verify passenger data is saving correctly');
    console.log('4. Check booking references are unique\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    console.error('\n💡 Troubleshooting tips:');
    console.error('1. Check database connection settings');
    console.error('2. Ensure PostgreSQL is running');
    console.error('3. Verify database user has ALTER TABLE permissions');
    console.error('4. Check for conflicting data types in existing data');
    process.exit(1);
  } finally {
    if (closeConnection) {
      await sequelize.close();
      console.log('📡 Database connection closed');
    } else {
      console.log('📡 Leaving database connection open for caller');
    }
  }
}

// Export the migration function so other modules can invoke it
export default migrateBookingSchema;

// If this script is executed directly with `node scripts/migrate_booking_schema.js`, run the migration.
if (
  process.argv &&
  process.argv[1] &&
  process.argv[1].toLowerCase().endsWith('migrate_booking_schema.js')
) {
  migrateBookingSchema();
}
