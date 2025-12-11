import jwt from 'jsonwebtoken';
import { redis } from './redis';

const PREFIX = 'bl:'; // blacklist key prefix

/**
 * Adds a token to the blacklist in Redis using the token's exp claim as TTL.
 */
export async function blacklistToken(token: string): Promise<void> {
  if (!redis) return;
  try {
    const decoded = jwt.decode(token) as any;
    const exp = decoded?.exp as number | undefined;
    if (!exp) return;
    const ttl = exp - Math.floor(Date.now() / 1000);
    if (ttl <= 0) return; // already expired
    await redis.set(PREFIX + token, '1', 'EX', ttl);
  } catch (e) {
    // ignore errors — blacklist is best-effort
  }
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  if (!redis) return false;
  try {
    const v = await redis.get(PREFIX + token);
    return !!v;
  } catch (e) {
    return false;
  }
}

export default { blacklistToken, isTokenBlacklisted };
