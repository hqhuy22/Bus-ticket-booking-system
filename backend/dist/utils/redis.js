"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.ensureConnected = ensureConnected;
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisUrl = process.env.REDIS_URL;
/**
 * If REDIS_URL is provided we create and export a Redis client instance.
 * When REDIS_URL is not set we export `null` so callers can treat Redis as optional.
 */
exports.redis = redisUrl ? new ioredis_1.default(redisUrl) : null;
async function ensureConnected(timeoutMs = 2000) {
    if (!exports.redis)
        return false;
    try {
        const pong = await Promise.race([
            exports.redis.ping(),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
        ]);
        return pong === 'PONG';
    }
    catch (err) {
        return false;
    }
}
exports.default = exports.redis;
