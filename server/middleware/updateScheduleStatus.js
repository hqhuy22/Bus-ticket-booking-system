import BusSchedule from '../models/busSchedule.js';
import { Op } from 'sequelize';

/**
 * Middleware to automatically update schedule status based on time
 * Scheduled -> In Progress when current time reaches departure time
 * In Progress -> Completed when current time reaches arrival time
 */
export const autoUpdateScheduleStatus = async (req, res, next) => {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    // Update Scheduled -> In Progress
    // When departure date/time has passed
    await BusSchedule.update(
      { status: 'In Progress' },
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

    // Update In Progress -> Completed
    // When arrival date/time has passed
    await BusSchedule.update(
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

    next();
  } catch (error) {
    console.error('Error auto-updating schedule status:', error);
    // Don't block the request if auto-update fails
    next();
  }
};

/**
 * Get current status of a schedule based on time
 */
export const getCurrentScheduleStatus = (schedule) => {
  // If manually cancelled, return Cancelled
  if (schedule.status === 'Cancelled') {
    return 'Cancelled';
  }

  // If manually marked as completed
  if (schedule.isCompleted || schedule.status === 'Completed') {
    return 'Completed';
  }

  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

  const departureDateTime = new Date(`${schedule.departure_date}T${schedule.departure_time}:00`);
  const arrivalDateTime = new Date(`${schedule.arrival_date}T${schedule.arrival_time}:00`);

  // Check if trip has completed (arrival time passed)
  if (now >= arrivalDateTime) {
    return 'Completed';
  }

  // Check if trip is in progress (departure time passed but arrival not yet)
  if (now >= departureDateTime) {
    return 'In Progress';
  }

  // Trip is still scheduled
  return 'Scheduled';
};
