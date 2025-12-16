"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const tokenBlacklist_1 = require("../utils/tokenBlacklist");
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
async function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
        return res.status(401).json({ message: 'missing token' });
    const token = auth.slice('Bearer '.length);
    try {
        // Check blacklist first
        const blacklisted = await (0, tokenBlacklist_1.isTokenBlacklisted)(token);
        if (blacklisted)
            return res.status(401).json({ message: 'token revoked' });
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = { id: payload.sub, email: payload.email, role: payload.role };
        return next();
    }
    catch (err) {
        return res.status(401).json({ message: 'invalid token' });
    }
}
// Optional auth: if Authorization header present, verify and populate req.user.
// If header is missing, continue as guest.
async function optionalAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
        return next();
    return authMiddleware(req, res, next);
}
