/**
 * IN-MEMORY CACHE SERVICE
 * Simple in-memory cache without Redis dependency
 * For production use, consider implementing proper caching strategy
 */

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SCHEDULES: 300, // 5 minutes
  ROUTES: 600, // 10 minutes
  BUSES: 3600, // 1 hour
  ANALYTICS: 300, // 5 minutes
  SEARCH_RESULTS: 180, // 3 minutes
};

class CacheService {
  constructor() {
    this.cache = new Map();
    this.isConnected = true; // Always "connected" for in-memory
    console.log('✅ Cache Service: Using in-memory cache (Redis removed)');
  }

  /**
   * Generate cache key from prefix and parameters
   */
  generateKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${prefix}:${sortedParams}`;
  }

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      const item = this.cache.get(key);
      if (!item) return null;

      // Check if expired
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.cache.delete(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.warn('Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttl = 300) {
    try {
      const expiresAt = Date.now() + ttl * 1000;
      this.cache.set(key, { value, expiresAt });
      return true;
    } catch (error) {
      console.warn('Cache set error:', error.message);
      return false;
    }
  }

  /**
   * Delete specific key
   */
  async del(key) {
    try {
      return this.cache.delete(key);
    } catch (error) {
      console.warn('Cache delete error:', error.message);
      return false;
    }
  }

  /**
   * Delete keys matching pattern
   */
  async delPattern(pattern) {
    try {
      // Convert Redis pattern to regex
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      let deleted = 0;

      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          deleted++;
        }
      }

      return deleted;
    } catch (error) {
      console.warn('Cache delete pattern error:', error.message);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    return this.cache.has(key) ? 1 : 0;
  }

  /**
   * Set expiration on key
   */
  async expire(key, seconds) {
    try {
      const item = this.cache.get(key);
      if (!item) return false;

      item.expiresAt = Date.now() + seconds * 1000;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get time to live
   */
  async ttl(key) {
    try {
      const item = this.cache.get(key);
      if (!item || !item.expiresAt) return -1;

      const remaining = Math.floor((item.expiresAt - Date.now()) / 1000);
      return remaining > 0 ? remaining : -2;
    } catch (error) {
      return -1;
    }
  }

  /**
   * Flush all cache
   */
  async flushAll() {
    this.cache.clear();
    return true;
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    return {
      keys: this.cache.size,
      memory: 'N/A (in-memory)',
      hits: 'N/A',
      misses: 'N/A',
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      connected: true,
      type: 'in-memory',
      message: 'In-memory cache is operational',
    };
  }

  /**
   * Disconnect (no-op for in-memory)
   */
  async disconnect() {
    this.cache.clear();
    this.isConnected = false;
    console.log('Cache Service: Cleared in-memory cache');
  }
}

// Export singleton instance
export default new CacheService();
