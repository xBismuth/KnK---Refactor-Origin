// ==================== RATE LIMITING ====================
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 300, // allow more general API calls
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
  // Explicitly trust first proxy to avoid ERR_ERL_PERMISSIVE_TRUST_PROXY when app trust proxy is misconfigured
  trustProxy: 1,
  skip: () => process.env.NODE_ENV === 'development'
});

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // allow more attempts across signup/login in short window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many auth attempts, please try again later.',
  trustProxy: 1,
  // Do not count successful requests towards limit (e.g., successful signup)
  skipSuccessfulRequests: true,
  // In development, disable to ease testing
  skip: () => process.env.NODE_ENV === 'development'
});

module.exports = { apiLimiter, authLimiter };