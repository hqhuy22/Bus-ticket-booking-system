import express from 'express';
import {
  createPaymentSession,
  getPaymentSession,
  processSandboxPayment,
  handlePaymentWebhook,
  cancelPaymentSession,
  getPaymentStatus,
} from '../controllers/paymentController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * Payment Routes for Sandbox Payment Gateway
 */

/**
 * @swagger
 * /api/payments/create:
 *   post:
 *     summary: Create payment session for booking
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - amount
 *             properties:
 *               bookingId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment session created with checkout URL and QR code
 */
router.post('/create', optionalAuth, createPaymentSession);

/**
 * @swagger
 * /api/payments/{paymentId}:
 *   get:
 *     summary: Get payment session details
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment session details
 */
router.get('/:paymentId', getPaymentSession);

/**
 * @swagger
 * /api/payments/process:
 *   post:
 *     summary: Process sandbox payment (testing only)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [success, failed]
 *     responses:
 *       200:
 *         description: Payment processed
 */
router.post('/process', processSandboxPayment);

// Payment webhook endpoint (public, no auth required)
router.post('/webhook', handlePaymentWebhook);

/**
 * @swagger
 * /api/payments/{paymentId}/cancel:
 *   post:
 *     summary: Cancel payment session
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment cancelled
 */
router.post('/:paymentId/cancel', cancelPaymentSession);

/**
 * @swagger
 * /api/payments/{paymentId}/status:
 *   get:
 *     summary: Get payment status
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status information
 */
router.get('/:paymentId/status', getPaymentStatus);

export default router;
