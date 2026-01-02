import express from 'express';
import {
  loginCustomer,
  registerCustomer,
  logoutCustomer,
  getAllCustomers,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  deleteAvatar,
  checkEmailAvailability,
} from '../controllers/customerController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/customer/login:
 *   post:
 *     summary: Login customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginCustomer);

/**
 * @swagger
 * /api/customer/register:
 *   post:
 *     summary: Register new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error
 */
router.post('/register', registerCustomer);

/**
 * @swagger
 * /api/customer/verify-email:
 *   get:
 *     summary: Verify email address
 *     tags: [Customers]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 */
router.get('/verify-email', verifyEmail);

/**
 * @swagger
 * /api/customer/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset email sent
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/customer/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password', resetPassword);

router.get('/check-email', checkEmailAvailability);

// Protected routes (authenticated users)

/**
 * @swagger
 * /api/customer/logout:
 *   get:
 *     summary: Logout customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.get('/logout', authenticateToken, logoutCustomer);

/**
 * @swagger
 * /api/customer/profile:
 *   get:
 *     summary: Get customer profile
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @swagger
 * /api/customer/profile:
 *   put:
 *     summary: Update customer profile
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', authenticateToken, updateProfile);

/**
 * @swagger
 * /api/customer/change-password:
 *   post:
 *     summary: Change customer password
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post('/change-password', authenticateToken, changePassword);

/**
 * @swagger
 * /api/customer/avatar:
 *   post:
 *     summary: Upload customer avatar
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 */
router.post('/avatar', authenticateToken, uploadAvatar);
router.delete('/avatar', authenticateToken, deleteAvatar);

// Admin only routes
router.get('/', authenticateToken, requireAdmin, getAllCustomers);

export default router;
