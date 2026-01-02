import express from 'express';
import passport from '../config/passport.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Authentication]
 *     description: Redirects user to Google OAuth consent screen
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     description: Handles the callback from Google OAuth and generates JWT token
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *     responses:
 *       302:
 *         description: Redirect to client with token
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/bus-booking/login?error=google_auth_failed`,
  }),
  (req, res) => {
    try {
      // Defensive: convert Sequelize instance to plain object if needed
      const userObj =
        req.user && typeof req.user.toJSON === 'function' ? req.user.toJSON() : req.user;

      // Log the user object type for debugging
      console.log(
        'Google callback - user type:',
        typeof req.user,
        'isPlainObject:',
        !!userObj && userObj.constructor === Object
      );

      // Generate JWT token
      const payload = {
        customer: {
          id: userObj.id,
          position: userObj.position,
        },
      };

      const token = jwt.sign(payload, String(process.env.JWT_SECRET || ''), { expiresIn: '12h' });

      // Set cookie
      res.cookie('token', token, { httpOnly: true });

      // Prepare a safe user payload for redirect
      const safeUser = {
        id: userObj.id,
        username: userObj.username || userObj.email?.split?.('@')?.[0] || '',
        email: userObj.email || '',
        position: userObj.position || '',
      };

      let userParam = '';
      try {
        userParam = encodeURIComponent(JSON.stringify(safeUser));
      } catch (err) {
        console.error('Failed to stringify user for redirect, falling back to id only:', err);
        userParam = encodeURIComponent(JSON.stringify({ id: safeUser.id }));
      }

      // Redirect to dashboard with token and safe user payload
      res.redirect(
        `${process.env.CLIENT_URL}/bus-booking/login?token=${encodeURIComponent(token)}&user=${userParam}`
      );
    } catch (error) {
      console.error('Google callback error:', error && error.message ? error.message : error);
      // On error, redirect with an error flag
      res.redirect(`${process.env.CLIENT_URL}/bus-booking/login?error=token_generation_failed`);
    }
  }
);

/**
 * @swagger
 * /api/auth/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Authentication]
 *     description: Clears authentication cookie
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ msg: 'Logged out successfully' });
});

export default router;
