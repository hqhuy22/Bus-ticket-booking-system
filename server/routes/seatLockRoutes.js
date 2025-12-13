import express from 'express';
import {
  getSeatAvailability,
  lockSeats,
  releaseSeats,
  confirmSeats,
  extendLock,
  getMyLocks,
  cleanupExpiredLocks,
} from '../controllers/seatLockController.js';

const router = express.Router();

// Public routes

/**
 * @swagger
 * /api/seats/availability/{scheduleId}:
 *   get:
 *     summary: Get seat availability for a schedule
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Seat availability map with locked, booked, and available seats
 */
router.get('/availability/:scheduleId', getSeatAvailability);

/**
 * @swagger
 * /api/seats/lock:
 *   post:
 *     summary: Lock seats temporarily during booking
 *     tags: [Seats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduleId
 *               - seatNumbers
 *               - sessionId
 *             properties:
 *               scheduleId:
 *                 type: integer
 *               seatNumbers:
 *                 type: array
 *                 items:
 *                   type: integer
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Seats locked successfully
 *       409:
 *         description: Seats already locked or booked
 */
router.post('/lock', lockSeats);

/**
 * @swagger
 * /api/seats/release:
 *   post:
 *     summary: Release locked seats
 *     tags: [Seats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scheduleId:
 *                 type: integer
 *               seatNumbers:
 *                 type: array
 *                 items:
 *                   type: integer
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Seats released successfully
 */
router.post('/release', releaseSeats);

/**
 * @swagger
 * /api/seats/confirm:
 *   post:
 *     summary: Confirm seat lock (convert to booking)
 *     tags: [Seats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scheduleId:
 *                 type: integer
 *               seatNumbers:
 *                 type: array
 *                 items:
 *                   type: integer
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Seats confirmed
 */
router.post('/confirm', confirmSeats);

/**
 * @swagger
 * /api/seats/extend:
 *   post:
 *     summary: Extend seat lock duration
 *     tags: [Seats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scheduleId:
 *                 type: integer
 *               seatNumbers:
 *                 type: array
 *                 items:
 *                   type: integer
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lock extended successfully
 */
router.post('/extend', extendLock);
router.get('/my-locks', getMyLocks);

// Admin/system route for cleanup
router.post('/cleanup-expired', cleanupExpiredLocks);

export default router;
