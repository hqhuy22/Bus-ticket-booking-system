import express from 'express';
import {
  createBooking,
  confirmBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  getBookingByReference,
  updateBooking,
  cancelBooking,
  deleteBooking,
  expirePendingBookings,
  createGuestBooking,
  lookupGuestBooking,
  requestGuestLookupVerification,
  verifyGuestLookup,
  confirmGuestBooking,
  adminConfirmBooking,
  adminCancelBooking,
  downloadTicket,
  emailTicket,
  getTripStatus,
} from '../controllers/busBookingController.js';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Guest booking routes - no authentication required

/**
 * @swagger
 * /api/bookings/guest:
 *   post:
 *     summary: Create guest booking (no login required)
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - busScheduleId
 *               - seatNumbers
 *               - guestEmail
 *               - guestPhone
 *               - guestName
 *               - passengers
 *             properties:
 *               busScheduleId:
 *                 type: integer
 *                 example: 1
 *               seatNumbers:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *               guestEmail:
 *                 type: string
 *                 example: guest@example.com
 *               guestPhone:
 *                 type: string
 *                 example: "+84901234567"
 *               guestName:
 *                 type: string
 *                 example: Guest User
 *               passengers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     age:
 *                       type: integer
 *                     gender:
 *                       type: string
 *                     seatNumber:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Guest booking created successfully
 */
router.post('/guest', createGuestBooking); // Create guest booking
router.get('/guest/lookup', lookupGuestBooking); // Deprecated: direct lookup; use verification flow

/**
 * @swagger
 * /api/bookings/guest/lookup/request:
 *   post:
 *     summary: Request verification email for guest booking lookup
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingReference:
 *                 type: string
 *                 example: BKG-ABC123XYZ
 *               email:
 *                 type: string
 *                 example: guest@example.com
 *     responses:
 *       200:
 *         description: Verification email sent
 */
router.post('/guest/lookup/request', requestGuestLookupVerification); // Send verification email

/**
 * @swagger
 * /api/bookings/guest/verify:
 *   get:
 *     summary: Verify token and view guest booking
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details retrieved
 */
router.get('/guest/verify', verifyGuestLookup); // Verify token and return booking
router.post('/guest/:bookingReference/confirm', confirmGuestBooking); // Confirm guest booking

// User routes - require authentication

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create new booking (authenticated users)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - busScheduleId
 *               - seatNumbers
 *               - passengers
 *             properties:
 *               busScheduleId:
 *                 type: integer
 *               seatNumbers:
 *                 type: array
 *                 items:
 *                   type: integer
 *               passengers:
 *                 type: array
 *                 items:
 *                   type: object
 *               pickupPoint:
 *                 type: string
 *               dropoffPoint:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.post('/', authenticateToken, createBooking); // Create new booking

/**
 * @swagger
 * /api/bookings/my-bookings:
 *   get:
 *     summary: Get my bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of user bookings
 */
router.get('/my-bookings', authenticateToken, getMyBookings); // Get user's bookings

/**
 * @swagger
 * /api/bookings/reference/{reference}:
 *   get:
 *     summary: Get booking by reference number
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details
 */
router.get('/reference/:reference', authenticateToken, getBookingByReference); // Get by reference
router.get('/:id', authenticateToken, getBookingById); // Get single booking
router.get('/:id/trip-status', authenticateToken, getTripStatus); // Get real-time trip status

/**
 * @swagger
 * /api/bookings/{id}/download-ticket:
 *   get:
 *     summary: Download e-ticket as PDF
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PDF file download
 */
router.get('/:id/download-ticket', authenticateToken, downloadTicket); // Download e-ticket PDF

/**
 * @swagger
 * /api/bookings/{id}/email-ticket:
 *   post:
 *     summary: Email e-ticket to customer
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: E-ticket sent successfully
 */
router.post('/:id/email-ticket', authenticateToken, emailTicket); // Email e-ticket to user
router.put('/:id', authenticateToken, updateBooking); // Update booking (limited)

/**
 * @swagger
 * /api/bookings/{id}/confirm:
 *   post:
 *     summary: Confirm booking after payment
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking confirmed
 */
router.post('/:id/confirm', authenticateToken, confirmBooking); // Confirm booking after payment

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   post:
 *     summary: Cancel booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking cancelled
 */
router.post('/:id/cancel', authenticateToken, cancelBooking); // Cancel booking

// Admin routes - require admin privileges
router.get('/', authenticateToken, requireAdmin, getAllBookings); // Get all bookings
router.post('/admin/:id/confirm', authenticateToken, requireAdmin, adminConfirmBooking); // Admin confirm booking
router.post('/admin/:id/cancel', authenticateToken, requireAdmin, adminCancelBooking); // Admin cancel booking
router.delete('/:id', authenticateToken, requireAdmin, deleteBooking); // Delete booking
router.post('/expire-pending', authenticateToken, requireAdmin, expirePendingBookings); // Expire old bookings

export default router;
