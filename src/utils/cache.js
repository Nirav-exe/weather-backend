const { createClient } = require('redis');
const env = require('../config/env');

/**
 * Thin caching layer in front of Redis.
 *
 * If Redis is unreachable (e.g. running on a platform like Replit without a
 * Redis add-on), the service transparently falls back to an in-memory Map
 * with the same TTL semantics, so the API keeps working — it just loses
 * caching across restarts/instances. This keeps the app deployable
 * anywhere while still using real Redis whenever REDIS_URL points to one
 * (e.g. the docker-compose setup, or Render's managed Redis).
 */
class CacheService {
  constructor() {
    this.client = null;
    this.memoryStore = new Map(); // key -> { value, expiresAt }
    this.useRedis = false;
    this.connecting = this._init();
  }

  async _init() {
    try {
      this.client = createClient({
        url: env.redisUrl,
        socket: {
          // Stop retrying after a handful of attempts so an unavailable
          // Redis (e.g. no add-on configured on Replit) doesn't spam the
          // logs forever — the in-memory fallback takes over permanently.
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              if (!this._gaveUpLogged) {
                console.warn(
                  '[Redis] giving up on reconnecting, staying on in-memory cache for this process.'
                );
                this._gaveUpLogged = true;
              }
              return new Error('Redis unavailable, reconnects disabled');
            }
            return Math.min(retries * 200, 1000);
          },
        },
      });

      this.client.on('error', (err) => {
        if (!this._loggedErrorOnce) {
          console.error('[Redis] client error:', err.message);
          this._loggedErrorOnce = true;
        }
        this.useRedis = false;
      });

      this.client.on('ready', () => {
        this.useRedis = true;
        console.log('[Redis] connected:', env.redisUrl);
      });

      await this.client.connect();
    } catch (err) {
      console.warn(
        `[Redis] could not connect (${err.message}). Falling back to in-memory cache.`
      );
      this.useRedis = false;
    }
  }

  async get(key) {
    if (this.useRedis && this.client?.isOpen) {
      try {
        const val = await this.client.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        console.error('[Cache] Redis GET failed, using memory fallback:', err.message);
      }
    }
    return this._memoryGet(key);
  }

  async set(key, value, ttlSeconds = env.cacheTtlSeconds) {
    if (this.useRedis && this.client?.isOpen) {
      try {
        await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
        return;
      } catch (err) {
        console.error('[Cache] Redis SET failed, using memory fallback:', err.message);
      }
    }
    this._memorySet(key, value, ttlSeconds);
  }

  _memoryGet(key) {
    const entry = this.memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return entry.value;
  }

  _memorySet(key, value, ttlSeconds) {
    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async isRedisHealthy() {
    if (!this.useRedis || !this.client?.isOpen) return false;
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new CacheService();
