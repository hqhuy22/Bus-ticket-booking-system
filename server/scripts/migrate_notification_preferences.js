/**
 * Migration Script: Create Notification Preferences Table
 * Adds notification_preferences table for user notification settings
 */

import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/postgres.js';
import NotificationPreferences from '../models/NotificationPreferences.js';
import Customer from '../models/Customer.js';

async function migrateNotificationPreferences() {
  try {
    console.log('Starting notification preferences migration...\n');

    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Sync the NotificationPreferences model
    await NotificationPreferences.sync({ force: false });
    console.log('✅ NotificationPreferences table created/verified\n');

    // Check if any existing customers need default preferences
    const customersWithoutPreferences = await sequelize.query(
      `
      SELECT c.id, c.email, c.username
      FROM customers c
      LEFT JOIN notification_preferences np ON c.id = np."customerId"
      WHERE np.id IS NULL AND c."isGuest" = FALSE
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (customersWithoutPreferences.length > 0) {
      console.log(
        `Found ${customersWithoutPreferences.length} customers without notification preferences\n`
      );
      console.log('Creating default preferences for existing customers...\n');

      for (const customer of customersWithoutPreferences) {
        await NotificationPreferences.create({
          customerId: customer.id,
          emailBookingConfirmation: true,
          emailTripReminders: true,
          emailCancellations: true,
          emailPromotions: false,
          emailNewsletter: false,
          smsBookingConfirmation: false,
          smsTripReminders: false,
          smsCancellations: false,
          pushBookingConfirmation: true,
          pushTripReminders: true,
          pushPromotions: false,
          reminderTiming: 24,
          timezone: 'Asia/Kolkata',
        });
        console.log(`  ✅ Created preferences for ${customer.email || customer.username}`);
      }

      console.log(
        `\n✅ Created default preferences for ${customersWithoutPreferences.length} customers\n`
      );
    } else {
      console.log('✅ All existing customers already have notification preferences\n');
    }

    // Display table info
    const [tableInfo] = await sequelize.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'notification_preferences'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Notification Preferences Table Structure:\n');
    console.table(tableInfo);

    console.log('\n✅ Notification preferences migration completed successfully!\n');
    console.log('You can now:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Access notification preferences at: /bus-booking/notification-preferences');
    console.log('3. API endpoint: GET/PUT /api/notification-preferences\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateNotificationPreferences();
