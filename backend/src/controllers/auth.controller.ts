import { Request, Response } from 'express';
import UserService from '../services/user.service';
import UserRepository from '../repositories/user.repository';
import PasswordResetRepository from '../repositories/passwordReset.repository';
import bcrypt from 'bcrypt';
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt';
import { blacklistToken } from '../utils/tokenBlacklist';
import passport from '../config/passport';
import EmailService from '../services/email.service';
import crypto from 'crypto';

export default class AuthController {
  static async register(req: Request, res: Response) {
    const { email, phone, password } = req.body;
    try {
      // eslint-disable-next-line no-console
      console.log('AuthController.register request for email:', email);
      const user = await UserService.register({ email, phone, password });
      return res.status(201).json({ id: user.id, email: user.email, phone: user.phone });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }

  static async verify(req: Request, res: Response) {
    const token = req.query.token as string;
    if (!token) return res.status(400).json({ message: 'missing token' });
    try {
      await UserService.verifyEmail(token);
      return res.json({ message: 'verified' });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }

  static async resend(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'missing email' });
    try {
      await UserService.resendVerification(email);
      return res.json({ message: 'sent' });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }

  static async status(req: Request, res: Response) {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ message: 'missing email' });
    try {
      const verified = await UserService.isVerified(email);
      return res.json({ verified });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }

  static async login(req: Request, res: Response) {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'missing credentials' });
    try {
      const user = await UserRepository.findByEmail(email);
      if (!user || !user.password_hash)
        return res.status(401).json({ message: 'invalid credentials' });
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ message: 'invalid credentials' });

      // Reject login if user hasn't verified their email
      if (!user.verified_at) return res.status(403).json({ message: 'email not verified' });

      const access = signAccessToken({ sub: user.id, email: user.email, role: user.role });
      const refresh = signRefreshToken({ sub: user.id, email: user.email, role: user.role });

      return res.json({ access_token: access, refresh_token: refresh, token_type: 'bearer' });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  // Simple in-memory rate limiter for forgot-password per IP/email
  private static forgotRate: Record<string, { hits: number; resetAt: number }> = {};

  static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'missing email' });

    // rate limit key by email to be conservative
    const key = `fp:${email}`;
    const now = Date.now();
    const bucket = AuthController.forgotRate[key] || { hits: 0, resetAt: now + 60 * 1000 };
    if (now > bucket.resetAt) {
      bucket.hits = 0;
      bucket.resetAt = now + 60 * 1000;
    }
    bucket.hits += 1;
    AuthController.forgotRate[key] = bucket;
    if (bucket.hits > 5) return res.status(429).json({ message: 'too many requests' });

    try {
      const user = await UserRepository.findByEmail(email);
      if (!user) return res.status(200).json({ message: 'sent' }); // don't reveal existence

      // create token row
      const token = (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : crypto.randomBytes(16).toString('hex');
      const expiresIn = 1000 * 60 * 15; // 15 minutes
      const expiresAt = new Date(Date.now() + expiresIn).toISOString();
      await PasswordResetRepository.create({ token, user_id: user.id, expires_at: expiresAt });

      const emailService = new EmailService();
      const resetUrl = `${
        process.env.APP_BASE_URL || 'http://localhost:3000'
      }/reset-password?token=${token}`;
      await emailService.sendMail({
        to: user.email!,
        subject: 'Password reset',
        html: `Reset your password by clicking <a href="${resetUrl}">here</a>`,
      });

      return res.json({ message: 'sent' });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'missing fields' });
    if (typeof newPassword !== 'string' || newPassword.length < 6)
      return res.status(400).json({ message: 'password too short' });

    try {
      const row = await PasswordResetRepository.findByToken(token);
      if (!row) return res.status(400).json({ message: 'invalid token' });
      if (row.used) return res.status(400).json({ message: 'token already used' });
      const expiresAt = new Date(row.expires_at).getTime();
      if (Date.now() > expiresAt) return res.status(400).json({ message: 'token expired' });

      const user = await UserRepository.findById(row.user_id);
      if (!user) return res.status(400).json({ message: 'invalid token' });

      const hash = await bcrypt.hash(newPassword, 10);
      // update password directly via query to avoid adding new repo method
      const { query } = await import('../config/db');
      await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, user.id]);

      await PasswordResetRepository.markUsed(row.id);

      return res.json({ message: 'password reset' });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  static async refresh(req: Request, res: Response) {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ message: 'missing refresh_token' });
    try {
      const payload = verifyToken(refresh_token);
      const userId = (payload && (payload.sub as string)) || '';
      const user = await UserRepository.findById(userId);
      if (!user) return res.status(401).json({ message: 'invalid token' });

      // Issue new tokens (rotation) — stateless: we don't persist refresh tokens.
      const access = signAccessToken({ sub: user.id, email: user.email, role: user.role });
      const refresh = signRefreshToken({ sub: user.id, email: user.email, role: user.role });

      return res.json({ access_token: access, refresh_token: refresh, token_type: 'bearer' });
    } catch (err: any) {
      return res.status(401).json({ message: 'invalid token' });
    }
  }

  static async logout(req: Request, res: Response) {
    // Expect access token in Authorization header and optional refresh_token in body
    const auth = req.headers.authorization;
    const refresh = req.body?.refresh_token as string | undefined;

    if (!auth || !auth.startsWith('Bearer '))
      return res.status(400).json({ message: 'missing access token' });

    const access = auth.slice('Bearer '.length);
    try {
      // Best-effort: add tokens to blacklist so they cannot be used anymore
      await Promise.all([
        blacklistToken(access),
        refresh ? blacklistToken(refresh) : Promise.resolve(),
      ]);

      return res.json({ message: 'logged out' });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  }

  // Initiates Google OAuth flow by delegating to passport
  static googleRedirect(req: Request, res: Response, next: any) {
    // passport will redirect to Google consent screen
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(501).json({ message: 'google oauth not configured' });
    }

    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  }

  // Handles Google callback: passport will have set req.user
  static googleCallback(req: Request, res: Response, next: any) {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(501).json({ message: 'google oauth not configured' });
    }

    passport.authenticate('google', { session: false }, async (err: any, user: any) => {
      if (err) return res.status(500).json({ message: err.message || 'oauth error' });
      if (!user) return res.status(401).json({ message: 'authentication failed' });

      try {
        // Find fresh user (repository returns complete user)
        const found = await UserRepository.findByEmail(user.email);
        if (!found) return res.status(500).json({ message: 'user not found after oauth' });

        const access = signAccessToken({ sub: found.id, email: found.email, role: found.role });
        const refresh = signRefreshToken({ sub: found.id, email: found.email, role: found.role });

        // If front-end expects tokens via query params, redirect with tokens (useful for native SPAs)
        const frontendRedirect = process.env.APP_BASE_URL || 'http://localhost:3000';
        const returnWithQuery = `${frontendRedirect}/auth/success?access_token=${encodeURIComponent(
          access,
        )}&refresh_token=${encodeURIComponent(refresh)}`;

        // Also set secure httpOnly cookie (sensible default). Frontend can read via cookie.
        const cookieName = process.env.ACCESS_COOKIE_NAME || 'access_token';
        res.cookie(cookieName, access, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000,
        });

        return res.redirect(returnWithQuery);
      } catch (e: any) {
        return res.status(500).json({ message: e.message });
      }
    })(req, res, next);
  }
}
