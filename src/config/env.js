require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  nodeEnv: process.env.NODE_ENV || 'development',
  // How long a resolved weather result is cached for, in seconds (default: 10 minutes)
  cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS, 10) || 600,
};
