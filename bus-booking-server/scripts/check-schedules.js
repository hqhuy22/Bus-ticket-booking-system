import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

async function checkSchedules() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database\n');

    const [schedules] = await sequelize.query(`
      SELECT 
        id, 
        "busId", 
        "routeId", 
        "departureTime",
        "arrivalTime"
      FROM bus_schedules 
      ORDER BY id
    `);

    console.log('=== Bus Schedules ===');
    console.log(`Total schedules: ${schedules.length}\n`);

    let nullBusCount = 0;
    let nullRouteCount = 0;

    schedules.forEach((schedule, index) => {
      console.log(`Schedule ${index + 1}:`);
      console.log(`  ID: ${schedule.id}`);
      console.log(`  busId: ${schedule.busId === null ? 'NULL ❌' : schedule.busId}`);
      console.log(`  routeId: ${schedule.routeId === null ? 'NULL ❌' : schedule.routeId}`);
      console.log(`  departureTime: ${schedule.departureTime}`);
      console.log('');

      if (schedule.busId === null) nullBusCount++;
      if (schedule.routeId === null) nullRouteCount++;
    });

    console.log('=== Summary ===');
    console.log(`Schedules with NULL busId: ${nullBusCount}`);
    console.log(`Schedules with NULL routeId: ${nullRouteCount}`);

    // Check which buses are used
    const [busUsage] = await sequelize.query(`
      SELECT 
        "busId", 
        COUNT(*) as schedule_count 
      FROM bus_schedules 
      WHERE "busId" IS NOT NULL
      GROUP BY "busId"
      ORDER BY schedule_count DESC
    `);

    console.log('\n=== Bus Usage ===');
    busUsage.forEach((row) => {
      console.log(
        `Bus ${row.busId}: ${row.schedule_count} schedule(s) ${row.schedule_count > 1 ? '⚠️  SHARED' : '✓'}`
      );
    });

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchedules();
