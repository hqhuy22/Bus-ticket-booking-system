import sequelize from '../config/postgres.js';
import BusSchedule from '../models/busSchedule.js';

async function addCompletedFieldsToSchedule() {
  try {
    console.log('Adding isCompleted and completedAt fields to bus_schedules table...\n');

    // Add the columns using raw SQL
    await sequelize.query(`
      ALTER TABLE bus_schedules 
      ADD COLUMN IF NOT EXISTS "isCompleted" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP;
    `);

    console.log('✅ Successfully added isCompleted and completedAt columns\n');

    // Sync the model to ensure everything is in sync
    await BusSchedule.sync({ alter: true });

    console.log('✅ Model synced successfully\n');

    // Check if there are any schedules
    const count = await BusSchedule.count();
    console.log(`📊 Total schedules in database: ${count}\n`);

    if (count > 0) {
      console.log('Note: All existing schedules have isCompleted = false by default.\n');
    }

    console.log('Migration completed successfully! 🎉\n');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

addCompletedFieldsToSchedule();
