/**
 * Check and update schedule completion status
 */

import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/postgres.js';
import BusSchedule from '../models/busSchedule.js';
import Review from '../models/Review.js';
import '../models/associations.js';

async function checkScheduleStatus() {
  try {
    console.log('🔍 Checking schedule completion status...\n');

    await sequelize.authenticate();

    // Find the Hanoi -> Ho Chi Minh schedule
    const schedule = await BusSchedule.findOne({
      where: {
        departure_city: 'Hanoi',
        arrival_city: 'Ho Chi Minh City',
        routeNo: 101,
      },
    });

    if (!schedule) {
      console.log('❌ Schedule not found');
      process.exit(1);
    }

    // Get review count for this schedule
    const reviewCount = await Review.count({
      where: { busScheduleId: schedule.id },
    });

    console.log('📊 Schedule Information:');
    console.log(`   ID: ${schedule.id}`);
    console.log(`   Route: ${schedule.departure_city} → ${schedule.arrival_city}`);
    console.log(`   Depot: ${schedule.depotName}`);
    console.log(`   Route No: ${schedule.routeNo}`);
    console.log(`   Departure Date: ${schedule.departure_date}`);
    console.log(`   Is Completed: ${schedule.isCompleted}`);
    console.log(`   Review Count: ${reviewCount}\n`);

    // Update to completed if not already
    if (!schedule.isCompleted) {
      await schedule.update({ isCompleted: true });
      console.log('✅ Schedule marked as completed\n');
    }

    // Get all schedules with reviews
    const schedulesWithReviews = await sequelize.query(
      `
      SELECT 
        bs.id,
        bs.departure_city,
        bs.arrival_city,
        bs."depotName",
        bs."routeNo",
        bs."isCompleted",
        COUNT(r.id) as review_count
      FROM bus_schedules bs
      LEFT JOIN reviews r ON r."busScheduleId" = bs.id
      WHERE r.id IS NOT NULL
      GROUP BY bs.id
      ORDER BY review_count DESC
      LIMIT 10
    `,
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('📊 Top 10 Schedules with Reviews:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    schedulesWithReviews.forEach((s, idx) => {
      console.log(`${idx + 1}. ${s.departure_city} → ${s.arrival_city}`);
      console.log(
        `   Reviews: ${s.review_count} | Completed: ${s.isCompleted} | Depot: ${s.depotName}`
      );
    });
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkScheduleStatus();
