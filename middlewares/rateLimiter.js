// ==================== RATE LIMITING ====================
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  // Explicitly trust first proxy to avoid ERR_ERL_PERMISSIVE_TRUST_PROXY when app trust proxy is misconfigured
  trustProxy: 1
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  trustProxy: 1
});

module.exports = { apiLimiter, authLimiter };