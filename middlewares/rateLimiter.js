// ==================== RATE LIMITING ====================
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute (reduced for testing)
  max: 10000, // MAXED OUT for rapid testing
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
  // Explicitly trust first proxy to avoid ERR_ERL_PERMISSIVE_TRUST_PROXY when app trust proxy is misconfigured
  trustProxy: 1,
  skip: () => process.env.NODE_ENV === 'development'
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute (reduced for testing)
  max: 1000, // MAXED OUT for rapid testing
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many auth attempts, please try again later.',
  trustProxy: 1,
  // Do not count successful requests towards limit (e.g., successful signup)
  skipSuccessfulRequests: true,
  // In development, disable to ease testing
  skip: () => process.env.NODE_ENV === 'development'
});

// More granular, route-specific limiters
const signupLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute (reduced for testing)
  max: 1000, // MAXED OUT for rapid testing
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many sign-up requests from this IP, please try again later.',
  trustProxy: 1,
  skipSuccessfulRequests: true,
  skip: () => process.env.NODE_ENV === 'development'
});

const resendLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds (reduced for testing)
  max: 1000, // MAXED OUT for rapid testing
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many code resend requests, please wait a moment and try again.',
  trustProxy: 1,
  skipSuccessfulRequests: true, // don't count successful resends
  skip: () => process.env.NODE_ENV === 'development'
});

module.exports = { apiLimiter, authLimiter, signupLimiter, resendLimiter };