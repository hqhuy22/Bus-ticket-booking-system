import BusSchedule from '../models/busSchedule.js';
import Bus from '../models/Bus.js';
import { Op } from 'sequelize';

const mapReqToSchedule = (body) => {
  // supports both nested shape and flattened
  return {
    routeNo: body.routeNo ?? body.route_no,
    busId: body.busId ?? body.bus_id,
    routeId: body.routeId ?? body.route_id,
    departure_city: body.departure?.city ?? body.departure_city ?? body.departure_city,
    departure_date: body.departure?.date ?? body.departure_date,
    departure_time: body.departure?.time ?? body.departure_time,
    arrival_city: body.arrival?.city ?? body.arrival_city,
    arrival_date: body.arrival?.date ?? body.arrival_date,
    arrival_time: body.arrival?.time ?? body.arrival_time,
    duration: body.duration,
    busType: body.busType,
    model: body.model,
    busScheduleID: body.busScheduleID ?? body.bus_schedule_id,
    depotName: body.depotName,
    bookingClosingDate: body.bookingClosingDate ?? body.booking_closing_date,
    bookingClosingTime: body.bookingClosingTime ?? body.booking_closing_time,
    price: body.price,
    availableSeats: body.availableSeats ?? body.available_seats,
  };
};

export const createBusSchedule = async (req, res) => {
  try {
    const payload = mapReqToSchedule(req.body);

    // Check for scheduling conflicts if busId is provided
    // Only check against active (not completed) schedules
    if (payload.busId) {
      const conflicts = await BusSchedule.findAll({
        where: {
          busId: payload.busId,
          isCompleted: false, // Only check against active schedules
          [Op.or]: [
            {
              // New trip starts during existing trip
              departure_date: payload.departure_date,
              departure_time: { [Op.lte]: payload.departure_time },
              arrival_date: payload.arrival_date,
              arrival_time: { [Op.gte]: payload.departure_time },
            },
            {
              // New trip overlaps with existing trip
              [Op.and]: [
                { departure_date: { [Op.lte]: payload.arrival_date } },
                { arrival_date: { [Op.gte]: payload.departure_date } },
              ],
            },
          ],
        },
      });

      if (conflicts.length > 0) {
        return res.status(409).json({
          error: 'Scheduling conflict detected',
          message: 'Bus is already scheduled for this time period',
          conflicts: conflicts,
        });
      }
    }

    const busSchedule = await BusSchedule.create(payload);

    res.status(201).json(busSchedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllBusSchedules = async (req, res) => {
  try {
    // Extract query parameters for filtering, sorting, and pagination
    const {
      from, // departure_city
      to, // arrival_city
      date, // departure_date
      minPrice,
      maxPrice,
      busType,
      timeFrom, // departure_time >= timeFrom
      timeTo, // departure_time <= timeTo
      amenities,
      page = 1,
      limit = 10,
      sort = 'price', // price, departure_time, duration, availableSeats
      order = 'ASC', // ASC or DESC
    } = req.query;

    // Build where clause for filtering
    const where = {
      status: 'Scheduled', // Only return scheduled (not in progress, completed, or cancelled) schedules
    };

    if (from) {
      where.departure_city = { [Op.iLike]: `%${from}%` };
    }

    if (to) {
      where.arrival_city = { [Op.iLike]: `%${to}%` };
    }

    if (date) {
      where.departure_date = date;
    }

    if (minPrice) {
      where.price = { ...where.price, [Op.gte]: parseFloat(minPrice) };
    }

    if (maxPrice) {
      where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) };
    }

    if (busType) {
      where.busType = { [Op.iLike]: `%${busType}%` };
    }

    if (timeFrom) {
      where.departure_time = { ...where.departure_time, [Op.gte]: timeFrom };
    }

    if (timeTo) {
      where.departure_time = { ...where.departure_time, [Op.lte]: timeTo };
    }

    // Amenities filter: find buses that have all requested amenities, then restrict schedules to those busIds
    if (amenities) {
      // amenities can be sent as array or comma-separated string
      const amenitiesArray = Array.isArray(amenities)
        ? amenities
        : String(amenities)
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean);

      if (amenitiesArray.length > 0) {
        const matchingBuses = await Bus.findAll({
          where: {
            amenities: { [Op.contains]: amenitiesArray },
          },
          attributes: ['id'],
        });

        const busIds = matchingBuses.map((b) => b.id);

        // If no buses match the amenities, return empty result early
        if (busIds.length === 0) {
          return res.status(200).json({
            schedules: [],
            pagination: {
              total: 0,
              page: parseInt(page),
              limit: parseInt(limit),
              totalPages: 0,
            },
          });
        }

        where.busId = { ...where.busId, [Op.in]: busIds };
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Sorting - validate sort field
    const validSortFields = [
      'price',
      'departure_time',
      'duration',
      'availableSeats',
      'departure_date',
    ];
    const sortField = validSortFields.includes(sort) ? sort : 'price';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Query with filters, sorting, and pagination
    const { count, rows } = await BusSchedule.findAndCountAll({
      where,
      order: [[sortField, sortOrder]],
      limit: limitNum,
      offset: offset,
    });

    // Attach bus metadata for each schedule so the client can access schedule.bus.amenities
    let schedulesWithBus = rows;
    try {
      const scheduleObjs = rows.map((r) => (r.toJSON ? r.toJSON() : r));
      const busIds = [...new Set(scheduleObjs.map((s) => s.busId).filter(Boolean))];

      if (busIds.length > 0) {
        const buses = await Bus.findAll({ where: { id: { [Op.in]: busIds } } });
        const busMap = buses.reduce((acc, b) => {
          acc[b.id] = b.toJSON ? b.toJSON() : b;
          return acc;
        }, {});

        schedulesWithBus = scheduleObjs.map((s) => ({ ...s, bus: busMap[s.busId] || null }));
      } else {
        schedulesWithBus = scheduleObjs.map((s) => ({ ...s, bus: null }));
      }
    } catch (attachErr) {
      // If attaching bus data fails, log and fall back to original rows
      console.error('Failed to attach bus metadata to schedules:', attachErr);
      schedulesWithBus = rows;
    }

    const response = {
      schedules: schedulesWithBus,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    };

    // Cache the response for 5 minutes

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all bus schedules for Admin Dashboard
 * Includes both active and completed schedules
 */
export const getAdminBusSchedules = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // No isCompleted filter - return ALL schedules
    const { count, rows } = await BusSchedule.findAndCountAll({
      order: [
        ['isCompleted', 'ASC'], // Active schedules first
        ['departure_date', 'DESC'],
        ['departure_time', 'DESC'],
      ],
      limit: limitNum,
      offset: offset,
    });

    // Attach bus information
    let schedulesWithBus;
    try {
      const scheduleObjs = rows.map((r) => (r.toJSON ? r.toJSON() : r));
      const busIds = [...new Set(scheduleObjs.map((s) => s.busId).filter(Boolean))];

      if (busIds.length > 0) {
        const buses = await Bus.findAll({ where: { id: busIds } });
        const busMap = buses.reduce((acc, b) => {
          acc[b.id] = b.toJSON ? b.toJSON() : b;
          return acc;
        }, {});
        schedulesWithBus = scheduleObjs.map((s) => ({ ...s, bus: busMap[s.busId] || null }));
      } else {
        schedulesWithBus = scheduleObjs.map((s) => ({ ...s, bus: null }));
      }
    } catch (attachErr) {
      console.error('Failed to attach bus metadata to schedules:', attachErr);
      schedulesWithBus = rows;
    }

    res.status(200).json({
      schedules: schedulesWithBus,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBusScheduleByID = async (req, res) => {
  try {
    const schedule = await BusSchedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Bus Schedule not found' });

    // You can add additional details here like route stops, bus amenities, etc.
    const detailedSchedule = {
      ...schedule.toJSON(),
      amenities: [
        'WiFi Available',
        'Air Conditioning',
        'Charging Points',
        'Water Bottle',
        'Blanket',
        'Reading Light',
      ],
      policies: [
        'Passengers must arrive 15 minutes before departure',
        'Valid ID required for boarding',
        'Cancellation allowed up to 24 hours before departure',
        'Refund policy: 80% refund if cancelled 24+ hours before, 50% if 12-24 hours',
      ],
    };

    res.status(200).json(detailedSchedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBusSchedule = async (req, res) => {
  try {
    const schedule = await BusSchedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Bus Schedule not found' });

    const payload = mapReqToSchedule(req.body);

    // Check for scheduling conflicts if busId is being updated or already exists
    // Only check against active (not completed) schedules
    const busId = payload.busId || schedule.busId;
    if (busId) {
      const conflicts = await BusSchedule.findAll({
        where: {
          id: { [Op.ne]: req.params.id }, // Exclude current schedule
          busId: busId,
          isCompleted: false, // Only check against active schedules
          [Op.or]: [
            {
              departure_date: payload.departure_date || schedule.departure_date,
              departure_time: { [Op.lte]: payload.departure_time || schedule.departure_time },
              arrival_date: payload.arrival_date || schedule.arrival_date,
              arrival_time: { [Op.gte]: payload.departure_time || schedule.departure_time },
            },
            {
              [Op.and]: [
                { departure_date: { [Op.lte]: payload.arrival_date || schedule.arrival_date } },
                { arrival_date: { [Op.gte]: payload.departure_date || schedule.departure_date } },
              ],
            },
          ],
        },
      });

      if (conflicts.length > 0) {
        return res.status(409).json({
          error: 'Scheduling conflict detected',
          message: 'Bus is already scheduled for this time period',
          conflicts: conflicts,
        });
      }
    }

    await schedule.update(payload);

    // Invalidate all schedule caches when schedule is updated

    res.status(200).json(schedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Admin endpoint: update or clear a per-schedule seat map override
export const updateScheduleSeatMap = async (req, res) => {
  try {
    const schedule = await BusSchedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Bus Schedule not found' });

    const { seatMapConfig } = req.body;
    // Allow null to clear override
    await schedule.update({ seatMapConfig: seatMapConfig ?? null });

    // Invalidate cache when seat map is updated

    res.status(200).json({ message: 'Schedule seat map updated', schedule });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteBusSchedule = async (req, res) => {
  try {
    const schedule = await BusSchedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Bus Schedule not found' });

    await schedule.destroy();

    // Invalidate all schedule caches when schedule is deleted

    res.status(200).json({ message: 'Bus Schedule deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Complete a bus schedule (Admin only)
 * Mark a schedule as completed after the trip is finished
 */
export const completeBusSchedule = async (req, res) => {
  try {
    const schedule = await BusSchedule.findByPk(req.params.id);

    if (!schedule) {
      return res.status(404).json({ error: 'Bus Schedule not found' });
    }

    if (schedule.isCompleted || schedule.status === 'Completed') {
      return res.status(400).json({ error: 'Bus Schedule is already completed' });
    }

    if (schedule.status === 'Cancelled') {
      return res.status(400).json({ error: 'Cannot complete a cancelled schedule' });
    }

    // Mark as completed
    schedule.isCompleted = true;
    schedule.status = 'Completed';
    schedule.completedAt = new Date();
    await schedule.save();

    // Update all confirmed bookings for this schedule to 'completed' status
    const BusBookingModule = await import('../models/busBooking.js');
    const BusBooking = BusBookingModule.default;
    await BusBooking.update(
      { status: 'completed' },
      {
        where: {
          busScheduleId: schedule.id,
          status: 'confirmed',
        },
      }
    );

    // Invalidate cache when schedule is completed

    res.status(200).json({
      message: 'Bus Schedule marked as completed successfully',
      schedule,
    });
  } catch (error) {
    console.error('Complete schedule error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Cancel a bus schedule (Admin only)
 * POST /api/bus-schedule/:id/cancel
 */
export const cancelBusSchedule = async (req, res) => {
  try {
    const { reason } = req.body;
    const schedule = await BusSchedule.findByPk(req.params.id);

    if (!schedule) {
      return res.status(404).json({ error: 'Bus Schedule not found' });
    }

    if (schedule.status === 'Completed') {
      return res.status(400).json({ error: 'Cannot cancel a completed schedule' });
    }

    if (schedule.status === 'Cancelled') {
      return res.status(400).json({ error: 'Bus Schedule is already cancelled' });
    }

    // Mark as cancelled
    schedule.status = 'Cancelled';
    schedule.cancelledAt = new Date();
    schedule.cancelledBy = req.user?.id; // Admin user ID
    schedule.cancellationReason = reason || 'Cancelled by admin';
    await schedule.save();

    // Cancel all pending and confirmed bookings for this schedule
    const BusBookingModule = await import('../models/busBooking.js');
    const BusBooking = BusBookingModule.default;

    const cancelledBookings = await BusBooking.update(
      {
        status: 'cancelled',
        cancellationReason: `Schedule cancelled: ${reason || 'Cancelled by admin'}`,
      },
      {
        where: {
          busScheduleId: schedule.id,
          status: ['pending', 'confirmed'],
        },
      }
    );

    // TODO: Send email notifications to affected customers
    // This would integrate with your email service

    // Invalidate cache

    res.status(200).json({
      message: 'Bus Schedule cancelled successfully',
      schedule,
      affectedBookings: cancelledBookings[0],
    });
  } catch (error) {
    console.error('Cancel schedule error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get completed schedules with review statistics
 * GET /api/schedules/completed-with-reviews
 * Public endpoint for browsing reviews
 */
export const getCompletedSchedulesWithReviews = async (req, res) => {
  try {
    const Route = (await import('../models/Route.js')).default;
    const Review = (await import('../models/Review.js')).default;
    const sequelize = (await import('../config/postgres.js')).default;

    // Find all completed schedules
    const schedules = await BusSchedule.findAll({
      where: {
        isCompleted: true,
      },
      include: [
        {
          model: Route,
          as: 'route',
          attributes: ['id', 'routeNo', 'routeName', 'origin', 'destination'],
        },
        {
          model: Bus,
          as: 'bus',
          attributes: ['id', 'busNumber', 'busType', 'model'],
        },
      ],
      order: [['departure_date', 'DESC']],
      limit: 100, // Limit to recent 100 completed schedules
    });

    // Get review statistics for each schedule
    const schedulesWithStats = await Promise.all(
      schedules.map(async (schedule) => {
        const stats = await Review.findOne({
          where: { busScheduleId: schedule.id },
          attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount'],
            [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
          ],
          raw: true,
        });

        return {
          ...schedule.toJSON(),
          reviewCount: parseInt(stats?.reviewCount || 0),
          averageRating: parseFloat(stats?.averageRating || 0),
        };
      })
    );

    // Sort by review count first, then by rating
    schedulesWithStats.sort((a, b) => {
      // Prioritize schedules with reviews
      if (a.reviewCount > 0 && b.reviewCount === 0) return -1;
      if (a.reviewCount === 0 && b.reviewCount > 0) return 1;
      // Then by review count (most reviews first)
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }
      // Finally by average rating
      return (b.averageRating || 0) - (a.averageRating || 0);
    });

    res.status(200).json({
      schedules: schedulesWithStats,
      count: schedulesWithStats.length,
    });
  } catch (error) {
    console.error('Get completed schedules with reviews error:', error);
    res.status(500).json({
      message: 'Failed to fetch completed schedules',
      error: error.message,
    });
  }
};

/**
 * Get passenger list for a specific trip/schedule
 * GET /api/bus-schedule/:id/passengers
 * Admin only
 */
export const getSchedulePassengers = async (req, res) => {
  try {
    const BusBooking = (await import('../models/busBooking.js')).default;
    const Customer = (await import('../models/Customer.js')).default;

    const schedule = await BusSchedule.findByPk(req.params.id);
    if (!schedule) {
      return res.status(404).json({ error: 'Bus Schedule not found' });
    }

    // Get all bookings for this schedule (confirmed and completed only)
    const bookings = await BusBooking.findAll({
      where: {
        busScheduleId: req.params.id,
        status: ['confirmed', 'completed'],
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: [
            'id',
            'username',
            'email',
            'guestName',
            'guestEmail',
            'guestPhone',
            'isGuest',
          ],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    // Extract passenger list with check-in status
    const passengerList = [];
    bookings.forEach((booking) => {
      const passengers = booking.passengers || [];
      const customer = booking.customer;

      // Determine customer name and contact
      const customerName = customer?.isGuest ? customer.guestName : customer?.username || 'N/A';
      const customerEmail = customer?.isGuest ? customer.guestEmail : customer?.email || 'N/A';
      const customerPhone = customer?.isGuest ? customer.guestPhone : null;

      passengers.forEach((passenger, index) => {
        passengerList.push({
          bookingId: booking.id,
          bookingReference: booking.bookingReference,
          passengerIndex: index,
          seatNumber: passenger.seatNumber || booking.seatNumbers[index],
          name: passenger.name,
          age: passenger.age,
          gender: passenger.gender,
          phone: passenger.phone,
          checkedIn: passenger.checkedIn || false, // Check-in status
          customerName,
          customerEmail,
          customerPhone,
        });
      });
    });

    // Sort by seat number
    passengerList.sort((a, b) => (a.seatNumber || 0) - (b.seatNumber || 0));

    res.status(200).json({
      schedule: {
        id: schedule.id,
        routeNo: schedule.routeNo,
        departure_city: schedule.departure_city,
        arrival_city: schedule.arrival_city,
        departure_date: schedule.departure_date,
        departure_time: schedule.departure_time,
        status: schedule.status,
      },
      passengers: passengerList,
      totalPassengers: passengerList.length,
      checkedInCount: passengerList.filter((p) => p.checkedIn).length,
    });
  } catch (error) {
    console.error('Get schedule passengers error:', error);
    res.status(500).json({
      message: 'Failed to fetch passenger list',
      error: error.message,
    });
  }
};

/**
 * Check-in a passenger
 * POST /api/bus-schedule/:id/checkin
 * Body: { bookingId, passengerIndex }
 * Admin only
 */
export const checkinPassenger = async (req, res) => {
  try {
    const { bookingId, passengerIndex } = req.body;
    const BusBooking = (await import('../models/busBooking.js')).default;

    if (!bookingId || passengerIndex === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: bookingId and passengerIndex',
      });
    }

    const booking = await BusBooking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.busScheduleId !== parseInt(req.params.id)) {
      return res.status(400).json({
        error: 'Booking does not belong to this schedule',
      });
    }

    // Update passenger check-in status
    const passengers = [...(booking.passengers || [])];
    if (passengerIndex < 0 || passengerIndex >= passengers.length) {
      return res.status(400).json({ error: 'Invalid passenger index' });
    }

    passengers[passengerIndex] = {
      ...passengers[passengerIndex],
      checkedIn: true,
      checkedInAt: new Date().toISOString(),
    };

    await booking.update({ passengers });

    res.status(200).json({
      message: 'Passenger checked in successfully',
      passenger: passengers[passengerIndex],
    });
  } catch (error) {
    console.error('Check-in passenger error:', error);
    res.status(500).json({
      message: 'Failed to check-in passenger',
      error: error.message,
    });
  }
};

/**
 * Update trip status (operations)
 * POST /api/bus-schedule/:id/update-status
 * Body: { status: 'In Progress' | 'Completed' }
 * Admin only - for operations team
 */
export const updateTripStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const schedule = await BusSchedule.findByPk(req.params.id);

    if (!schedule) {
      return res.status(404).json({ error: 'Bus Schedule not found' });
    }

    // Validate status transitions
    const currentStatus = schedule.status;

    // Only allow specific transitions
    if (status === 'In Progress') {
      if (currentStatus !== 'Scheduled') {
        return res.status(400).json({
          error: `Cannot mark as departed. Current status is ${currentStatus}. Only Scheduled trips can be marked as departed.`,
        });
      }
    } else if (status === 'Completed') {
      if (currentStatus !== 'In Progress') {
        return res.status(400).json({
          error: `Cannot mark as arrived. Current status is ${currentStatus}. Only In Progress trips can be marked as arrived.`,
        });
      }
    } else {
      return res.status(400).json({
        error: 'Invalid status. Only "In Progress" or "Completed" are allowed.',
      });
    }

    // Update status
    schedule.status = status;

    if (status === 'In Progress') {
      schedule.departedAt = new Date();
    } else if (status === 'Completed') {
      schedule.isCompleted = true;
      schedule.completedAt = new Date();

      // Update all confirmed bookings to completed
      const BusBooking = (await import('../models/busBooking.js')).default;
      await BusBooking.update(
        { status: 'completed' },
        {
          where: {
            busScheduleId: schedule.id,
            status: 'confirmed',
          },
        }
      );
    }

    await schedule.save();

    // Invalidate cache

    res.status(200).json({
      message: `Trip status updated to ${status} successfully`,
      schedule,
    });
  } catch (error) {
    console.error('Update trip status error:', error);
    res.status(500).json({
      message: 'Failed to update trip status',
      error: error.message,
    });
  }
};

/**
 * Fulltext search for routes and stations
 * Searches across departure_city, arrival_city, route info
 */
export const fulltextSearchSchedules = async (req, res) => {
  try {
    const {
      q, // search query
      page = 1,
      limit = 10,
    } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters',
      });
    }

    const searchTerm = q.trim();

    // Generate cache key

    // Try cache first
    // if (cached) {
    //   return res.status(200).json(cached);
    // }

    // Build fulltext search query
    const where = {
      status: 'Scheduled',
      [Op.or]: [
        { departure_city: { [Op.iLike]: `%${searchTerm}%` } },
        { arrival_city: { [Op.iLike]: `%${searchTerm}%` } },
        { routeNo: { [Op.iLike]: `%${searchTerm}%` } },
        { depotName: { [Op.iLike]: `%${searchTerm}%` } },
        { busType: { [Op.iLike]: `%${searchTerm}%` } },
      ],
    };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await BusSchedule.findAndCountAll({
      where,
      order: [
        ['departure_date', 'ASC'],
        ['departure_time', 'ASC'],
      ],
      limit: limitNum,
      offset: offset,
    });

    // Attach bus metadata
    let schedulesWithBus = rows;
    try {
      const scheduleObjs = rows.map((r) => (r.toJSON ? r.toJSON() : r));
      const busIds = [...new Set(scheduleObjs.map((s) => s.busId).filter(Boolean))];

      if (busIds.length > 0) {
        const buses = await Bus.findAll({ where: { id: { [Op.in]: busIds } } });
        const busMap = buses.reduce((acc, b) => {
          acc[b.id] = b.toJSON ? b.toJSON() : b;
          return acc;
        }, {});

        schedulesWithBus = scheduleObjs.map((s) => ({ ...s, bus: busMap[s.busId] || null }));
      } else {
        schedulesWithBus = scheduleObjs.map((s) => ({ ...s, bus: null }));
      }
    } catch (attachErr) {
      console.error('Failed to attach bus metadata:', attachErr);
      schedulesWithBus = rows;
    }

    const response = {
      searchQuery: searchTerm,
      schedules: schedulesWithBus,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    };

    // Cache for 5 minutes

    res.status(200).json(response);
  } catch (error) {
    console.error('Fulltext search error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get alternative/suggested trips
 * - Same route (same departure & arrival cities)
 * - Similar dates (±3 days)
 * - Different times or dates
 */
export const getAlternativeTrips = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { limit = 5 } = req.query;

    // Get the original schedule
    const originalSchedule = await BusSchedule.findByPk(scheduleId);

    if (!originalSchedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Generate cache key

    // Try cache first
    // if (cached) {
    //   return res.status(200).json(cached);
    // }

    // Calculate date range (±3 days)
    const baseDate = new Date(originalSchedule.departure_date);
    const minDate = new Date(baseDate);
    minDate.setDate(minDate.getDate() - 3);
    const maxDate = new Date(baseDate);
    maxDate.setDate(maxDate.getDate() + 3);

    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };

    // Find alternative trips
    const alternatives = await BusSchedule.findAll({
      where: {
        id: { [Op.ne]: scheduleId }, // Exclude the original schedule
        status: 'Scheduled',
        departure_city: originalSchedule.departure_city,
        arrival_city: originalSchedule.arrival_city,
        departure_date: {
          [Op.between]: [formatDate(minDate), formatDate(maxDate)],
        },
        availableSeats: { [Op.gt]: 0 }, // Only trips with available seats
      },
      order: [
        ['departure_date', 'ASC'],
        ['departure_time', 'ASC'],
      ],
      limit: parseInt(limit),
    });

    // Attach bus metadata
    let alternativesWithBus = alternatives;
    try {
      const scheduleObjs = alternatives.map((r) => (r.toJSON ? r.toJSON() : r));
      const busIds = [...new Set(scheduleObjs.map((s) => s.busId).filter(Boolean))];

      if (busIds.length > 0) {
        const buses = await Bus.findAll({ where: { id: { [Op.in]: busIds } } });
        const busMap = buses.reduce((acc, b) => {
          acc[b.id] = b.toJSON ? b.toJSON() : b;
          return acc;
        }, {});

        alternativesWithBus = scheduleObjs.map((s) => ({
          ...s,
          bus: busMap[s.busId] || null,
          // Add flag to indicate if same date or different date
          sameDate: s.departure_date === originalSchedule.departure_date,
          dateDifference: Math.floor(
            (new Date(s.departure_date) - new Date(originalSchedule.departure_date)) /
              (1000 * 60 * 60 * 24)
          ),
        }));
      } else {
        alternativesWithBus = scheduleObjs.map((s) => ({
          ...s,
          bus: null,
          sameDate: s.departure_date === originalSchedule.departure_date,
          dateDifference: Math.floor(
            (new Date(s.departure_date) - new Date(originalSchedule.departure_date)) /
              (1000 * 60 * 60 * 24)
          ),
        }));
      }
    } catch (attachErr) {
      console.error('Failed to attach bus metadata:', attachErr);
      alternativesWithBus = alternatives;
    }

    const response = {
      originalSchedule: {
        id: originalSchedule.id,
        routeNo: originalSchedule.routeNo,
        departure_city: originalSchedule.departure_city,
        arrival_city: originalSchedule.arrival_city,
        departure_date: originalSchedule.departure_date,
        departure_time: originalSchedule.departure_time,
      },
      alternatives: alternativesWithBus,
      count: alternativesWithBus.length,
    };

    // Cache for 5 minutes

    res.status(200).json(response);
  } catch (error) {
    console.error('Get alternative trips error:', error);
    res.status(500).json({ error: error.message });
  }
};
