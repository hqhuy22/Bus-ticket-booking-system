import express from 'express';
import {
  createBusSchedule,
  getAllBusSchedules,
  getAdminBusSchedules,
  getBusScheduleByID,
  updateBusSchedule,
  deleteBusSchedule,
  updateScheduleSeatMap,
  completeBusSchedule,
  cancelBusSchedule,
  getCompletedSchedulesWithReviews,
  getSchedulePassengers,
  checkinPassenger,
  updateTripStatus,
  fulltextSearchSchedules,
  getAlternativeTrips,
} from '../controllers/busScheduleController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { autoUpdateScheduleStatus } from '../middleware/updateScheduleStatus.js';

const router = express.Router();

// Apply auto-update middleware to all schedule routes
router.use(autoUpdateScheduleStatus);

// Admin routes - MUST come before public routes to avoid path conflicts
router.get('/bus-schedules/admin', authenticateToken, requireAdmin, getAdminBusSchedules);

// Public routes - anyone can view schedules (only scheduled)

/**
 * @swagger
 * /api/bus-schedules:
 *   get:
 *     summary: Search bus schedules
 *     tags: [Bus Schedules]
 *     parameters:
 *       - in: query
 *         name: departure_city
 *         required: true
 *         schema:
 *           type: string
 *         example: Ho Chi Minh
 *       - in: query
 *         name: arrival_city
 *         required: true
 *         schema:
 *           type: string
 *         example: Da Nang
 *       - in: query
 *         name: departure_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: 2024-12-25
 *       - in: query
 *         name: busType
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of available schedules
 */
router.get('/bus-schedules', getAllBusSchedules);

/**
 * @swagger
 * /api/bus-schedules/search:
 *   get:
 *     summary: Fulltext search for schedules
 *     tags: [Bus Schedules]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         example: Ho Chi Minh to Da Nang tomorrow
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/bus-schedules/search', fulltextSearchSchedules); // Fulltext search

/**
 * @swagger
 * /api/bus-schedule/{id}:
 *   get:
 *     summary: Get bus schedule by ID
 *     tags: [Bus Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Schedule details
 *       404:
 *         description: Schedule not found
 */
router.get('/bus-schedule/:id', getBusScheduleByID);

/**
 * @swagger
 * /api/bus-schedule/{scheduleId}/alternatives:
 *   get:
 *     summary: Get alternative trips for a schedule
 *     tags: [Bus Schedules]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: number
 *         description: Hours before/after (default 3)
 *     responses:
 *       200:
 *         description: Alternative schedules
 */
router.get('/bus-schedule/:scheduleId/alternatives', getAlternativeTrips); // Alternative trips

// Public route for browsing completed schedules with reviews
router.get('/schedules/completed-with-reviews', getCompletedSchedulesWithReviews);

// Admin only routes - creating, updating, deleting schedules
router.post('/bus-schedule', authenticateToken, requireAdmin, createBusSchedule);
router.put('/bus-schedule/:id', authenticateToken, requireAdmin, updateBusSchedule);
// Update per-schedule seat map override (admin)
router.put('/bus-schedule/:id/seatmap', authenticateToken, requireAdmin, updateScheduleSeatMap);
router.post('/bus-schedule/:id/complete', authenticateToken, requireAdmin, completeBusSchedule);
router.post('/bus-schedule/:id/cancel', authenticateToken, requireAdmin, cancelBusSchedule);
router.delete('/bus-schedule/:id', authenticateToken, requireAdmin, deleteBusSchedule);

// Trip Operations routes (Admin only)
router.get('/bus-schedule/:id/passengers', authenticateToken, requireAdmin, getSchedulePassengers);
router.post('/bus-schedule/:id/checkin', authenticateToken, requireAdmin, checkinPassenger);
router.post('/bus-schedule/:id/update-status', authenticateToken, requireAdmin, updateTripStatus);

export default router;
