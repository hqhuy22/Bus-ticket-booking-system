import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;

/**
 * If REDIS_URL is provided we create and export a Redis client instance.
 * When REDIS_URL is not set we export `null` so callers can treat Redis as optional.
 */
export const redis: Redis | null = redisUrl ? new Redis(redisUrl) : null;

export async function ensureConnected(timeoutMs = 2000): Promise<boolean> {
  if (!redis) return false;
  try {
    const pong = await Promise.race([
      redis.ping(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
    ]);
    return pong === 'PONG';
  } catch (err) {
    return false;
  }
}

export default redis;
