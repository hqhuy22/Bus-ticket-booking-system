import { Router } from 'express';
import AuthController from '../controllers/auth.controller';

const router = Router();
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/verify', AuthController.verify);
router.post('/resend', AuthController.resend);
router.get('/status', AuthController.status);
// Google OAuth endpoints
router.get('/google', AuthController.googleRedirect);
router.get('/google/callback', AuthController.googleCallback);

export default router;
