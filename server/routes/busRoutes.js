import express from 'express';
import {
  createBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
  checkBusAvailability,
  getAvailableBuses,
  uploadBusPhotos,
  deleteBusPhoto,
  toggleBusStatus,
} from '../controllers/busController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes - view buses

/**
 * @swagger
 * /api/buses/available:
 *   get:
 *     summary: Get available buses
 *     tags: [Buses]
 *     responses:
 *       200:
 *         description: List of available buses
 */
router.get('/buses/available', getAvailableBuses);

/**
 * @swagger
 * /api/buses:
 *   get:
 *     summary: Get all buses
 *     tags: [Buses]
 *     responses:
 *       200:
 *         description: List of all buses
 */
router.get('/buses', getAllBuses);

/**
 * @swagger
 * /api/bus/{id}:
 *   get:
 *     summary: Get bus by ID
 *     tags: [Buses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bus details
 */
router.get('/bus/:id', getBusById);
router.get('/bus/availability/check', checkBusAvailability);

// Admin only routes - managing buses

/**
 * @swagger
 * /api/bus:
 *   post:
 *     summary: Create new bus (Admin)
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               busNumber:
 *                 type: string
 *               busType:
 *                 type: string
 *               model:
 *                 type: string
 *               totalSeats:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Bus created
 */
router.post('/bus', authenticateToken, requireAdmin, createBus);

/**
 * @swagger
 * /api/bus/{id}:
 *   put:
 *     summary: Update bus (Admin)
 *     tags: [Buses]
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
 *         description: Bus updated
 */
router.put('/bus/:id', authenticateToken, requireAdmin, updateBus);

/**
 * @swagger
 * /api/bus/{id}:
 *   delete:
 *     summary: Delete bus (Admin)
 *     tags: [Buses]
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
 *         description: Bus deleted
 */
router.delete('/bus/:id', authenticateToken, requireAdmin, deleteBus);
router.post('/bus/:id/photos', authenticateToken, requireAdmin, uploadBusPhotos);
router.delete('/bus/:id/photos/:photoIndex', authenticateToken, requireAdmin, deleteBusPhoto);
router.patch('/bus/:id/toggle-status', authenticateToken, requireAdmin, toggleBusStatus);

export default router;
