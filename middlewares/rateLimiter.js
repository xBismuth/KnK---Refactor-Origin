// ==================== RATE LIMITING ====================
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // generous for general API calls
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
  // Explicitly trust first proxy to avoid ERR_ERL_PERMISSIVE_TRUST_PROXY when app trust proxy is misconfigured
  trustProxy: 1,
  skip: () => process.env.NODE_ENV === 'development'
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // typical "normal website" tolerance
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
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // up to 20 signups/ip/hour
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many sign-up requests from this IP, please try again later.',
  trustProxy: 1,
  skipSuccessfulRequests: true,
  skip: () => process.env.NODE_ENV === 'development'
});

const resendLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // up to 5 resends per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many code resend requests, please wait a moment and try again.',
  trustProxy: 1,
  skip: () => process.env.NODE_ENV === 'development'
});

module.exports = { apiLimiter, authLimiter, signupLimiter, resendLimiter };