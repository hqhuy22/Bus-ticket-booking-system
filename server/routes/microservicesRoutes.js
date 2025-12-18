/**
 * Microservices Health Check Routes
 */

import express from 'express';
import { healthCheckAll } from '../microservices/index.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/microservices/health
 * Get health status of all microservices
 * Admin only
 */
router.get('/health', requireAdmin, async (req, res) => {
  try {
    const health = await healthCheckAll();
    res.status(200).json({
      success: true,
      ...health,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
