/**
 * Migration Script: Add Guest Booking Support to Customer Model
 * Adds columns to support guest checkout functionality
 */

import sequelize from '../config/postgres.js';
import Customer from '../models/Customer.js';

async function migrateGuestBookingSupport() {
  try {
    console.log('Starting guest booking support migration...');

    // Add new columns for guest support
    await sequelize.query(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS "isGuest" BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS "guestEmail" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "guestPhone" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "guestName" VARCHAR(255);
    `);

    console.log('Added guest support columns');

    // Make email and username nullable for guest users
    await sequelize.query(`
      ALTER TABLE customers 
      ALTER COLUMN email DROP NOT NULL,
      ALTER COLUMN username DROP NOT NULL;
    `);

    console.log('Made email and username nullable');

    // Drop unique constraint on email (will be re-added with condition)
    await sequelize.query(`
      ALTER TABLE customers 
      DROP CONSTRAINT IF EXISTS customers_email_key;
    `);

    console.log('Dropped unique constraint on email');

    // Drop unique constraint on username (will be re-added with condition)
    await sequelize.query(`
      ALTER TABLE customers 
      DROP CONSTRAINT IF EXISTS customers_username_key;
    `);

    console.log('Dropped unique constraint on username');

    // Create partial unique indexes (unique only when not null)
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS customers_email_unique 
      ON customers (email) 
      WHERE email IS NOT NULL AND "isGuest" = FALSE;
    `);

    console.log('Created partial unique index on email');

    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS customers_username_unique 
      ON customers (username) 
      WHERE username IS NOT NULL AND "isGuest" = FALSE;
    `);

    console.log('Created partial unique index on username');

    // Create index for guest lookups
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_guest_email_phone 
      ON customers ("guestEmail", "guestPhone") 
      WHERE "isGuest" = TRUE;
    `);

    console.log('Created index for guest lookups');

    console.log('✅ Guest booking support migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

migrateGuestBookingSupport();
