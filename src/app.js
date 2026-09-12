const express = require ('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = requirel'express-rate-
limit');
const weatherRoutes = require('./routes/
weatherRoutes');
const ‹ notFoundHandler, errorHandler } = requirel'./middleware/errorHandler');
const cache = require('/utils/cache');
const env = require('./config/env');
const app = express ();
| Trust the first proxy hop (Render/Replit/ most Paas put the app behind one)
/l so express-rate-limit and req.ip see the real client IP. app. set('trust proxy', 1);
app.use(helmet());
app.use(cors ());
app.use (express.json());
app. use (morgan(env.nodeEnv === 'production' ?
'combined' : 'dev'));
// Rate limiting applies to the API surface
only, so uptime monitors hitting I /health repeatedly don't get throttled.
const limiter = ratelimit({
windowMs: 15 * 60 * 1000,
// 15 minutes
max: 100, // 100 requests per IP per window
standardHeaders: true, legacyHeaders: false, message: i
success: false,
error: { message: 'Too many requests,
please try again later.' },
}) ;
app.use('/api', limiter);
app.get('/health', async (req, res) => {
const redisHealthy = await
cache.isRedisHealthy();
res. status (200).json({
status: 'ok' uptime: process.uptime(),
memory (redis unavailable)',
7) ;
}) ;
app. use ('/api', weatherRoutes);
app.use(notFoundHandler);
app.use (errorHandler);
module.exports = app;
