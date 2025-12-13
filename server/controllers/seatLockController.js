import SeatLock from '../models/SeatLock.js';
import BusSchedule from '../models/busSchedule.js';
import BusBooking from '../models/busBooking.js';
import Bus from '../models/Bus.js';
import { Op } from 'sequelize';
import sequelize from '../config/postgres.js';

// Lock duration in minutes
const LOCK_DURATION_MINUTES = 15;

/**
 * Clean up expired locks - should be called periodically
 */
export const cleanupExpiredLocks = async (req, res) => {
  try {
    const result = await SeatLock.update(
      { status: 'expired' },
      {
        where: {
          status: 'locked',
          expiresAt: { [Op.lt]: new Date() },
        },
      }
    );

    res.json({
      message: 'Expired locks cleaned up',
      updatedCount: result[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get seat availability for a specific schedule
 * Returns: available, booked, and locked seats
 */
export const getSeatAvailability = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    // Get schedule and bus info
    const schedule = await BusSchedule.findByPk(scheduleId, {
      include: [
        {
          model: Bus,
          as: 'bus',
          attributes: ['id', 'totalSeats', 'seatMapConfig', 'busType'],
        },
      ],
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Get all booked seats (pending, confirmed, completed bookings)
    // Pending bookings also block seats until they expire or are cancelled
    const bookedSeats = await BusBooking.findAll({
      where: {
        busScheduleId: scheduleId,
        status: { [Op.in]: ['pending', 'confirmed', 'completed'] },
        // Only include pending bookings that haven't expired
        [Op.or]: [
          { status: { [Op.in]: ['confirmed', 'completed'] } },
          {
            status: 'pending',
            expiresAt: { [Op.gt]: new Date() },
          },
        ],
      },
      attributes: ['seatNumbers', 'status', 'bookingReference', 'expiresAt'],
    });

    console.log(
      `[getSeatAvailability] Schedule ${scheduleId}: Found ${bookedSeats.length} active bookings (pending/confirmed/completed)`
    );
    if (bookedSeats.length > 0) {
      console.log(
        '[getSeatAvailability] Bookings:',
        bookedSeats.map((b) => ({
          ref: b.bookingReference,
          status: b.status,
          seats: b.seatNumbers,
          expires: b.expiresAt ? new Date(b.expiresAt).toISOString() : 'N/A',
        }))
      );
    }

    // Get all locked seats (active locks, not expired)
    const lockedSeats = await SeatLock.findAll({
      where: {
        scheduleId,
        status: 'locked',
        expiresAt: { [Op.gt]: new Date() },
      },
      attributes: ['seatNumber', 'sessionId', 'expiresAt'],
    });

    // Get seat map configuration from bus
    const seatMap = schedule.bus?.seatMapConfig || null;
    const totalSeats = schedule.bus?.totalSeats || schedule.availableSeats;

    // Build response
    // Flatten array of booked seat arrays to a single list of seat numbers (strings)
    const bookedSeatNumbers = bookedSeats.flatMap((b) => (b.seatNumbers || []).map(String));
    const lockedSeatData = lockedSeats.map((l) => ({
      seatNumber: l.seatNumber,
      sessionId: l.sessionId,
      expiresAt: l.expiresAt,
    }));

    console.log(`[getSeatAvailability] Booked seats: [${bookedSeatNumbers.join(', ')}]`);
    console.log(
      `[getSeatAvailability] Locked seats: [${lockedSeatData.map((l) => l.seatNumber).join(', ')}]`
    );

    res.json({
      scheduleId,
      totalSeats,
      seatMap,
      bookedSeats: bookedSeatNumbers,
      lockedSeats: lockedSeatData,
      availableSeatsCount: totalSeats - bookedSeatNumbers.length - lockedSeatData.length,
    });
  } catch (error) {
    console.error('[getSeatAvailability] Error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Lock seats for a booking session
 */
export const lockSeats = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { scheduleId, seatNumbers, sessionId, customerId } = req.body;
    if (!scheduleId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ error: 'Missing required fields: scheduleId, seatNumbers array' });
    }
    if (!sessionId) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Session ID required' });
    }

    const schedule = await BusSchedule.findByPk(scheduleId);
    if (!schedule) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const desiredSeats = Array.from(new Set(seatNumbers.map((n) => String(n))));
    const expiresAt = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);

    const existingBookings = await BusBooking.findAll({
      where: {
        routeNo: schedule.routeNo,
        booking_startSession: schedule.departure_date,
        status: { [Op.in]: ['confirmed', 'completed'] },
      },
      attributes: ['seatNumbers'],
    });

    const existingBooked = new Set(
      existingBookings.flatMap((b) => (b.seatNumbers || []).map((n) => String(n)))
    );
    const alreadyBooked = desiredSeats.filter((s) => existingBooked.has(s));
    if (alreadyBooked.length > 0) {
      await transaction.rollback();
      return res
        .status(409)
        .json({ error: 'Some seats are already booked', bookedSeats: alreadyBooked });
    }

    const conflictingLocks = await SeatLock.findAll({
      where: {
        scheduleId,
        seatNumber: { [Op.in]: desiredSeats },
        status: 'locked',
        expiresAt: { [Op.gt]: new Date() },
        sessionId: { [Op.ne]: sessionId },
      },
    });
    if (conflictingLocks.length > 0) {
      await transaction.rollback();
      return res.status(409).json({
        error: 'Some seats are already locked by another user',
        lockedSeats: conflictingLocks.map((l) => l.seatNumber),
      });
    }

    const myActiveLocks = await SeatLock.findAll({
      where: { scheduleId, sessionId, status: 'locked', expiresAt: { [Op.gt]: new Date() } },
    });

    const myLockedSet = new Set(myActiveLocks.map((l) => String(l.seatNumber)));
    const toLock = desiredSeats.filter((s) => !myLockedSet.has(s));
    const toRelease = Array.from(myLockedSet).filter((s) => !desiredSeats.includes(s));
    const createdLocks = [];

    if (toRelease.length > 0) {
      await SeatLock.update(
        { status: 'released' },
        {
          where: { scheduleId, sessionId, seatNumber: { [Op.in]: toRelease }, status: 'locked' },
          transaction,
        }
      );
    }

    if (toLock.length > 0) {
      const insertRows = toLock.map((seatNumber) => ({
        scheduleId,
        seatNumber,
        customerId: customerId || null,
        sessionId,
        expiresAt,
        status: 'locked',
      }));
      const locks = await SeatLock.bulkCreate(insertRows, { transaction });
      createdLocks.push(
        ...locks.map((l) => ({ seatNumber: l.seatNumber, expiresAt: l.expiresAt }))
      );
    }

    if (myActiveLocks.length > 0 && toRelease.length === 0) {
      await SeatLock.update(
        { expiresAt },
        {
          where: { scheduleId, sessionId, status: 'locked', expiresAt: { [Op.gt]: new Date() } },
          transaction,
        }
      );
    }

    const finalLocks = [];
    for (const l of myActiveLocks) {
      if (!toRelease.includes(String(l.seatNumber)))
        finalLocks.push({ seatNumber: l.seatNumber, expiresAt });
    }
    finalLocks.push(...createdLocks);

    await transaction.commit();
    res.status(201).json({ message: 'Seats locked successfully', locks: finalLocks, expiresAt });
  } catch (error) {
    await transaction.rollback();
    console.error('[lockSeats] Error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Release seats for a session
 */
export const releaseSeats = async (req, res) => {
  try {
    const { scheduleId, sessionId, seatNumbers } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });
    const where = { sessionId, status: 'locked' };
    if (scheduleId) where.scheduleId = scheduleId;
    if (seatNumbers && Array.isArray(seatNumbers))
      where.seatNumber = { [Op.in]: seatNumbers.map((n) => String(n)) };
    const result = await SeatLock.update({ status: 'released' }, { where });
    res.json({ message: 'Seats released successfully', releasedCount: result[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const confirmSeats = async (req, res) => {
  try {
    const { scheduleId, sessionId, seatNumbers } = req.body;
    if (!scheduleId || !sessionId)
      return res.status(400).json({ error: 'Schedule ID and Session ID required' });
    const where = { scheduleId, sessionId, status: 'locked', expiresAt: { [Op.gt]: new Date() } };
    if (seatNumbers && Array.isArray(seatNumbers))
      where.seatNumber = { [Op.in]: seatNumbers.map((n) => String(n)) };
    const result = await SeatLock.update({ status: 'confirmed' }, { where });
    res.json({ message: 'Seats confirmed successfully', confirmedCount: result[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const extendLock = async (req, res) => {
  try {
    const { scheduleId, sessionId, additionalMinutes = 5 } = req.body;
    if (!scheduleId || !sessionId)
      return res.status(400).json({ error: 'Schedule ID and Session ID required' });
    const locks = await SeatLock.findAll({
      where: { scheduleId, sessionId, status: 'locked', expiresAt: { [Op.gt]: new Date() } },
    });
    if (locks.length === 0) return res.status(404).json({ error: 'No active locks found' });
    const newExpiresAt = new Date(Date.now() + additionalMinutes * 60 * 1000);
    await SeatLock.update(
      { expiresAt: newExpiresAt },
      { where: { scheduleId, sessionId, status: 'locked' } }
    );
    res.json({ message: 'Lock extended successfully', expiresAt: newExpiresAt, additionalMinutes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyLocks = async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });
    const locks = await SeatLock.findAll({
      where: { sessionId, status: 'locked', expiresAt: { [Op.gt]: new Date() } },
      include: [
        {
          model: BusSchedule,
          as: 'schedule',
          attributes: [
            'id',
            'routeNo',
            'departure_city',
            'arrival_city',
            'departure_date',
            'departure_time',
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({
      locks: locks.map((l) => ({
        scheduleId: l.scheduleId,
        seatNumber: l.seatNumber,
        expiresAt: l.expiresAt,
        schedule: l.schedule,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
