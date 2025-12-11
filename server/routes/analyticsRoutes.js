import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  getRevenueAnalytics,
  getBookingAnalytics,
  getFinancialReport,
  getDashboardSummary,
} from '../controllers/analyticsController.js';

const router = express.Router();

// All analytics routes require admin authentication
router.use(authenticateToken, requireAdmin);

/**
 * @swagger
 * /api/analytics/summary:
 *   get:
 *     summary: Get dashboard summary
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary with key metrics
 */
router.get('/summary', getDashboardSummary);

/**
 * @swagger
 * /api/analytics/revenue:
 *   get:
 *     summary: Get revenue analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *     responses:
 *       200:
 *         description: Revenue analytics data
 */
router.get('/revenue', getRevenueAnalytics);

/**
 * @swagger
 * /api/analytics/bookings:
 *   get:
 *     summary: Get booking analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking trends and statistics
 */
router.get('/bookings', getBookingAnalytics);

/**
 * @swagger
 * /api/analytics/financial:
 *   get:
 *     summary: Get financial report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detailed financial breakdown
 */
router.get('/financial', getFinancialReport);

export default router;
