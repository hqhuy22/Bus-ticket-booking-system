import { Router } from 'express';
import healthController from '../controllers/health.controller';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import tripRoutes from './trip.routes';

const router = Router();

router.get('/health', healthController.health);

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/trips', tripRoutes);

export default router;
