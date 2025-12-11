"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blacklistToken = blacklistToken;
exports.isTokenBlacklisted = isTokenBlacklisted;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = require("./redis");
const PREFIX = 'bl:'; // blacklist key prefix
/**
 * Adds a token to the blacklist in Redis using the token's exp claim as TTL.
 */
async function blacklistToken(token) {
    if (!redis_1.redis)
        return;
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        const exp = decoded?.exp;
        if (!exp)
            return;
        const ttl = exp - Math.floor(Date.now() / 1000);
        if (ttl <= 0)
            return; // already expired
        await redis_1.redis.set(PREFIX + token, '1', 'EX', ttl);
    }
    catch (e) {
        // ignore errors — blacklist is best-effort
    }
}
async function isTokenBlacklisted(token) {
    if (!redis_1.redis)
        return false;
    try {
        const v = await redis_1.redis.get(PREFIX + token);
        return !!v;
    }
    catch (e) {
        return false;
    }
}
exports.default = { blacklistToken, isTokenBlacklisted };
