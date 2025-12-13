import express from 'express';
import {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  getRouteStops,
  toggleRouteStatus,
  searchRoutes,
  getRouteNameSuggestions,
} from '../controllers/routeController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes - view routes

/**
 * @swagger
 * /api/routes:
 *   get:
 *     summary: Get all routes
 *     tags: [Routes]
 *     responses:
 *       200:
 *         description: List of all routes
 */
router.get('/routes', getAllRoutes);

/**
 * @swagger
 * /api/routes/search:
 *   get:
 *     summary: Search routes
 *     tags: [Routes]
 *     parameters:
 *       - in: query
 *         name: origin
 *         schema:
 *           type: string
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/routes/search', searchRoutes); // Route search

/**
 * @swagger
 * /api/routes/suggestions:
 *   get:
 *     summary: Get route name suggestions for autocomplete
 *     tags: [Routes]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Autocomplete suggestions
 */
router.get('/routes/suggestions', getRouteNameSuggestions); // Autocomplete

/**
 * @swagger
 * /api/route/{id}:
 *   get:
 *     summary: Get route by ID
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Route details
 */
router.get('/route/:id', getRouteById);
router.get('/route/:id/stops', getRouteStops);

// Admin only routes - managing routes

/**
 * @swagger
 * /api/route:
 *   post:
 *     summary: Create new route (Admin)
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               origin:
 *                 type: string
 *               destination:
 *                 type: string
 *               distance:
 *                 type: number
 *     responses:
 *       201:
 *         description: Route created
 */
router.post('/route', authenticateToken, requireAdmin, createRoute);

/**
 * @swagger
 * /api/route/{id}:
 *   put:
 *     summary: Update route (Admin)
 *     tags: [Routes]
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
 *         description: Route updated
 */
router.put('/route/:id', authenticateToken, requireAdmin, updateRoute);

/**
 * @swagger
 * /api/route/{id}:
 *   delete:
 *     summary: Delete route (Admin)
 *     tags: [Routes]
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
 *         description: Route deleted
 */
router.delete('/route/:id', authenticateToken, requireAdmin, deleteRoute);
router.patch('/route/:id/toggle-status', authenticateToken, requireAdmin, toggleRouteStatus);

export default router;
