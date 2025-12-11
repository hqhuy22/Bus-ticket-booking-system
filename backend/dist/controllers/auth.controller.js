"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = __importDefault(require("../services/user.service"));
const user_repository_1 = __importDefault(require("../repositories/user.repository"));
const passwordReset_repository_1 = __importDefault(require("../repositories/passwordReset.repository"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwt_1 = require("../utils/jwt");
const tokenBlacklist_1 = require("../utils/tokenBlacklist");
const passport_1 = __importDefault(require("../config/passport"));
const email_service_1 = __importDefault(require("../services/email.service"));
const crypto_1 = __importDefault(require("crypto"));
class AuthController {
    static async register(req, res) {
        const { email, phone, password } = req.body;
        try {
            // eslint-disable-next-line no-console
            console.log('AuthController.register request for email:', email);
            const user = await user_service_1.default.register({ email, phone, password });
            return res.status(201).json({ id: user.id, email: user.email, phone: user.phone });
        }
        catch (err) {
            return res.status(400).json({ message: err.message });
        }
    }
    static async verify(req, res) {
        const token = req.query.token;
        if (!token)
            return res.status(400).json({ message: 'missing token' });
        try {
            await user_service_1.default.verifyEmail(token);
            return res.json({ message: 'verified' });
        }
        catch (err) {
            return res.status(400).json({ message: err.message });
        }
    }
    static async resend(req, res) {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: 'missing email' });
        try {
            await user_service_1.default.resendVerification(email);
            return res.json({ message: 'sent' });
        }
        catch (err) {
            return res.status(400).json({ message: err.message });
        }
    }
    static async status(req, res) {
        const email = req.query.email;
        if (!email)
            return res.status(400).json({ message: 'missing email' });
        try {
            const verified = await user_service_1.default.isVerified(email);
            return res.json({ verified });
        }
        catch (err) {
            return res.status(400).json({ message: err.message });
        }
    }
    static async login(req, res) {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: 'missing credentials' });
        try {
            const user = await user_repository_1.default.findByEmail(email);
            if (!user || !user.password_hash)
                return res.status(401).json({ message: 'invalid credentials' });
            const ok = await bcrypt_1.default.compare(password, user.password_hash);
            if (!ok)
                return res.status(401).json({ message: 'invalid credentials' });
            // Reject login if user hasn't verified their email
            if (!user.verified_at)
                return res.status(403).json({ message: 'email not verified' });
            const access = (0, jwt_1.signAccessToken)({ sub: user.id, email: user.email, role: user.role });
            const refresh = (0, jwt_1.signRefreshToken)({ sub: user.id, email: user.email, role: user.role });
            return res.json({ access_token: access, refresh_token: refresh, token_type: 'bearer' });
        }
        catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
    static async forgotPassword(req, res) {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: 'missing email' });
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
        if (bucket.hits > 5)
            return res.status(429).json({ message: 'too many requests' });
        try {
            const user = await user_repository_1.default.findByEmail(email);
            if (!user)
                return res.status(200).json({ message: 'sent' }); // don't reveal existence
            // create token row
            const token = crypto_1.default.randomUUID
                ? crypto_1.default.randomUUID()
                : crypto_1.default.randomBytes(16).toString('hex');
            const expiresIn = 1000 * 60 * 15; // 15 minutes
            const expiresAt = new Date(Date.now() + expiresIn).toISOString();
            await passwordReset_repository_1.default.create({ token, user_id: user.id, expires_at: expiresAt });
            const emailService = new email_service_1.default();
            const resetUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
            await emailService.sendMail({
                to: user.email,
                subject: 'Password reset',
                html: `Reset your password by clicking <a href="${resetUrl}">here</a>`,
            });
            return res.json({ message: 'sent' });
        }
        catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
    static async resetPassword(req, res) {
        const { token, newPassword } = req.body;
        if (!token || !newPassword)
            return res.status(400).json({ message: 'missing fields' });
        if (typeof newPassword !== 'string' || newPassword.length < 6)
            return res.status(400).json({ message: 'password too short' });
        try {
            const row = await passwordReset_repository_1.default.findByToken(token);
            if (!row)
                return res.status(400).json({ message: 'invalid token' });
            if (row.used)
                return res.status(400).json({ message: 'token already used' });
            const expiresAt = new Date(row.expires_at).getTime();
            if (Date.now() > expiresAt)
                return res.status(400).json({ message: 'token expired' });
            const user = await user_repository_1.default.findById(row.user_id);
            if (!user)
                return res.status(400).json({ message: 'invalid token' });
            const hash = await bcrypt_1.default.hash(newPassword, 10);
            // update password directly via query to avoid adding new repo method
            const { query } = await Promise.resolve().then(() => __importStar(require('../config/db')));
            await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, user.id]);
            await passwordReset_repository_1.default.markUsed(row.id);
            return res.json({ message: 'password reset' });
        }
        catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
    static async refresh(req, res) {
        const { refresh_token } = req.body;
        if (!refresh_token)
            return res.status(400).json({ message: 'missing refresh_token' });
        try {
            const payload = (0, jwt_1.verifyToken)(refresh_token);
            const userId = (payload && payload.sub) || '';
            const user = await user_repository_1.default.findById(userId);
            if (!user)
                return res.status(401).json({ message: 'invalid token' });
            // Issue new tokens (rotation) — stateless: we don't persist refresh tokens.
            const access = (0, jwt_1.signAccessToken)({ sub: user.id, email: user.email, role: user.role });
            const refresh = (0, jwt_1.signRefreshToken)({ sub: user.id, email: user.email, role: user.role });
            return res.json({ access_token: access, refresh_token: refresh, token_type: 'bearer' });
        }
        catch (err) {
            return res.status(401).json({ message: 'invalid token' });
        }
    }
    static async logout(req, res) {
        // Expect access token in Authorization header and optional refresh_token in body
        const auth = req.headers.authorization;
        const refresh = req.body?.refresh_token;
        if (!auth || !auth.startsWith('Bearer '))
            return res.status(400).json({ message: 'missing access token' });
        const access = auth.slice('Bearer '.length);
        try {
            // Best-effort: add tokens to blacklist so they cannot be used anymore
            await Promise.all([
                (0, tokenBlacklist_1.blacklistToken)(access),
                refresh ? (0, tokenBlacklist_1.blacklistToken)(refresh) : Promise.resolve(),
            ]);
            return res.json({ message: 'logged out' });
        }
        catch (e) {
            return res.status(500).json({ message: e.message });
        }
    }
    // Initiates Google OAuth flow by delegating to passport
    static googleRedirect(req, res, next) {
        // passport will redirect to Google consent screen
        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(501).json({ message: 'google oauth not configured' });
        }
        passport_1.default.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
    }
    // Handles Google callback: passport will have set req.user
    static googleCallback(req, res, next) {
        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(501).json({ message: 'google oauth not configured' });
        }
        passport_1.default.authenticate('google', { session: false }, async (err, user) => {
            if (err)
                return res.status(500).json({ message: err.message || 'oauth error' });
            if (!user)
                return res.status(401).json({ message: 'authentication failed' });
            try {
                // Find fresh user (repository returns complete user)
                const found = await user_repository_1.default.findByEmail(user.email);
                if (!found)
                    return res.status(500).json({ message: 'user not found after oauth' });
                const access = (0, jwt_1.signAccessToken)({ sub: found.id, email: found.email, role: found.role });
                const refresh = (0, jwt_1.signRefreshToken)({ sub: found.id, email: found.email, role: found.role });
                // If front-end expects tokens via query params, redirect with tokens (useful for native SPAs)
                const frontendRedirect = process.env.APP_BASE_URL || 'http://localhost:3000';
                const returnWithQuery = `${frontendRedirect}/auth/success?access_token=${encodeURIComponent(access)}&refresh_token=${encodeURIComponent(refresh)}`;
                // Also set secure httpOnly cookie (sensible default). Frontend can read via cookie.
                const cookieName = process.env.ACCESS_COOKIE_NAME || 'access_token';
                res.cookie(cookieName, access, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 15 * 60 * 1000,
                });
                return res.redirect(returnWithQuery);
            }
            catch (e) {
                return res.status(500).json({ message: e.message });
            }
        })(req, res, next);
    }
}
// Simple in-memory rate limiter for forgot-password per IP/email
AuthController.forgotRate = {};
exports.default = AuthController;
