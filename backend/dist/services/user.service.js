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
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
const user_repository_1 = __importDefault(require("../repositories/user.repository"));
const email_service_1 = __importDefault(require("./email.service"));
const db_1 = require("../config/db");
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
// default to 60 seconds for faster verification expiry during testing/demo
const EMAIL_VERIFICATION_SECONDS = process.env.EMAIL_VERIFICATION_SECONDS
    ? Number(process.env.EMAIL_VERIFICATION_SECONDS)
    : 60;
class UserService {
    static async register({ email, phone, password, }) {
        if (!email && !phone) {
            throw new Error('either email or phone required');
        }
        if (!password || password.length < 6) {
            throw new Error('password must be at least 6 characters');
        }
        if (email) {
            const existing = await user_repository_1.default.findByEmail(email);
            if (existing)
                throw new Error('email already registered');
        }
        const password_hash = await bcrypt_1.default.hash(password, 10);
        // If email provided, create user inside a transaction and only commit if email sent
        if (email) {
            const client = await (0, db_1.getClient)();
            try {
                await client.query('BEGIN');
                const user = await user_repository_1.default.create({ email, phone, password_hash }, client);
                const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: `${EMAIL_VERIFICATION_SECONDS}s` });
                const emailService = new email_service_1.default();
                // Point users to a friendly verification page which will call the API when they click "Check Verify"
                const verifyUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/verify?token=${token}`;
                // eslint-disable-next-line no-console
                console.log('Sending verification email to:', user.email, 'verifyUrl:', verifyUrl);
                await emailService.sendMail({
                    to: user.email,
                    subject: 'Verify your email',
                    html: `Please verify your email by clicking <a href="${verifyUrl}">here</a>`,
                });
                await client.query('COMMIT');
                return user;
            }
            catch (err) {
                await client.query('ROLLBACK');
                throw err;
            }
            finally {
                client.release();
            }
        }
        // fallback: no email provided -> create normally
        const user = await user_repository_1.default.create({ email, phone, password_hash });
        return user;
    }
    static async verifyEmail(token) {
        const payload = jwt.verify(token, JWT_SECRET);
        // enforce server-side token age check
        const iat = payload.iat;
        if (!iat)
            throw new Error('invalid token');
        const age = Math.floor(Date.now() / 1000) - iat;
        if (age > EMAIL_VERIFICATION_SECONDS)
            throw new Error('token expired');
        const userId = payload.sub;
        const user = await user_repository_1.default.findById(userId);
        if (!user)
            throw new Error('invalid token');
        await user_repository_1.default.markVerified(userId);
        return true;
    }
    static async resendVerification(email) {
        const user = await user_repository_1.default.findByEmail(email);
        if (!user)
            throw new Error('email not found');
        const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: `${EMAIL_VERIFICATION_SECONDS}s` });
        const emailService = new email_service_1.default();
        const verifyUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/verify?token=${token}`;
        // eslint-disable-next-line no-console
        console.log('Resending verification email to:', user.email, 'verifyUrl:', verifyUrl);
        await emailService.sendMail({
            to: user.email,
            subject: 'Verify your email',
            html: `Please verify your email by clicking <a href="${verifyUrl}">here</a>`,
        });
        return true;
    }
    static async isVerified(email) {
        const user = await user_repository_1.default.findByEmail(email);
        if (!user)
            throw new Error('email not found');
        return Boolean(user.verified_at);
    }
}
exports.default = UserService;
