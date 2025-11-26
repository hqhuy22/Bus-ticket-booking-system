/**
 * Review Routes
 * Endpoints for review management
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createReview,
  getScheduleReviews,
  getMyReviews,
  getReviewableBookings,
  updateReview,
  deleteReview,
  voteReview,
  canReviewBooking,
  getBusOperatorReviews,
  getAllReviews,
} from '../controllers/reviewController.js';

const router = express.Router();

// Public routes

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get all reviews with filters
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *       - in: query
 *         name: depotName
 *         schema:
 *           type: string
 *       - in: query
 *         name: routeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reviews with pagination
 */
router.get('/', getAllReviews);

/**
 * @swagger
 * /api/reviews/operator/{depotName}:
 *   get:
 *     summary: Get all reviews for a specific bus operator (depot)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: depotName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the bus depot/operator
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *     responses:
 *       200:
 *         description: List of reviews for the operator with statistics
 */
router.get('/operator/:depotName', getBusOperatorReviews);

/**
 * @swagger
 * /api/reviews/schedule/{scheduleId}:
 *   get:
 *     summary: Get all reviews for a bus schedule
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reviews with average rating
 */
router.get('/schedule/:scheduleId', getScheduleReviews);

// Protected routes (require authentication)

/**
 * @swagger
 * /api/reviews/my-reviews:
 *   get:
 *     summary: Get current user's reviews
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's reviews
 */
router.get('/my-reviews', authenticateToken, getMyReviews);

/**
 * @swagger
 * /api/reviews/reviewable-bookings:
 *   get:
 *     summary: Get completed bookings that can be reviewed
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reviewable bookings
 */
router.get('/reviewable-bookings', authenticateToken, getReviewableBookings);

router.get('/can-review/:bookingId', authenticateToken, canReviewBooking);

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - rating
 *             properties:
 *               bookingId:
 *                 type: integer
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               serviceRating:
 *                 type: integer
 *               driverRating:
 *                 type: integer
 *               vehicleRating:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Review created successfully
 */
router.post('/', authenticateToken, createReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
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
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated
 */
router.put('/:id', authenticateToken, updateReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
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
 *         description: Review deleted
 */
router.delete('/:id', authenticateToken, deleteReview);

/**
 * @swagger
 * /api/reviews/{id}/vote:
 *   post:
 *     summary: Vote on a review (helpful/not helpful)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               voteType:
 *                 type: string
 *                 enum: [helpful, notHelpful]
 *     responses:
 *       200:
 *         description: Vote recorded
 */
router.post('/:id/vote', authenticateToken, voteReview);

export default router;
