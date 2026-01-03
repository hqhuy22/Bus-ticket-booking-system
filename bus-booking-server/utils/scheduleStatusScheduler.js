import cron from 'node-cron';
import BusSchedule from '../models/busSchedule.js';
import { Op } from 'sequelize';

/**
 * Auto-update schedule status based on current time
 * Runs every 5 minutes to check for status changes
 */
const updateScheduleStatuses = async () => {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    // Update Scheduled -> In Progress
    // When departure date/time has passed
    const departedResult = await BusSchedule.update(
      {
        status: 'In Progress',
        departedAt: now,
      },
      {
        where: {
          status: 'Scheduled',
          [Op.or]: [
            { departure_date: { [Op.lt]: currentDate } },
            {
              departure_date: currentDate,
              departure_time: { [Op.lte]: currentTime },
            },
          ],
        },
      }
    );

    if (departedResult[0] > 0) {
      console.log(`✅ Auto-updated ${departedResult[0]} schedule(s) to "In Progress"`);
    }

    // Update In Progress -> Completed
    // When arrival date/time has passed
    const completedResult = await BusSchedule.update(
      {
        status: 'Completed',
        isCompleted: true,
        completedAt: now,
      },
      {
        where: {
          status: 'In Progress',
          [Op.or]: [
            { arrival_date: { [Op.lt]: currentDate } },
            {
              arrival_date: currentDate,
              arrival_time: { [Op.lte]: currentTime },
            },
          ],
        },
      }
    );

    if (completedResult[0] > 0) {
      console.log(`✅ Auto-updated ${completedResult[0]} schedule(s) to "Completed"`);

      // TODO: Could add additional logic here:
      // - Update bookings to completed
      // - Send review requests to passengers
      // - Generate analytics
    }
  } catch (error) {
    console.error('❌ Error auto-updating schedule statuses:', error);
  }
};

/**
 * Initialize the schedule status scheduler
 * Runs every 5 minutes
 */
export const initializeScheduleStatusScheduler = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await updateScheduleStatuses();
  });

  console.log('✅ Schedule status scheduler initialized (runs every 5 minutes)');

  // Run immediately on startup for testing/initial sync
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Running initial schedule status check...');
    setTimeout(() => updateScheduleStatuses(), 3000); // Run after 3 seconds
  } else {
    // In production, also run once on startup to catch any missed updates
    setTimeout(() => updateScheduleStatuses(), 5000);
  }
};

/**
 * Manual trigger for schedule status update (for testing or admin tools)
 */
export const triggerScheduleStatusUpdate = async (req, res) => {
  try {
    await updateScheduleStatuses();
    res.status(200).json({
      success: true,
      message: 'Schedule status update triggered successfully',
    });
  } catch (error) {
    console.error('Error triggering schedule status update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger schedule status update',
      error: error.message,
    });
  }
};
