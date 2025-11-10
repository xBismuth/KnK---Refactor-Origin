// ==================== AUTHENTICATION ROUTES ====================
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authLimiter, apiLimiter, signupLimiter, resendLimiter } = require('../middlewares/rateLimiter');

// Signup flow
router.post('/signup', signupLimiter, authController.signup);
router.post('/verify-code', authController.verifyCode);
router.post('/resend-code', resendLimiter, authController.resendCode);

// Login flow
router.post('/send-login-code', authLimiter, authController.sendLoginCode);
router.post('/verify-login-code', authController.verifyLoginCode);

// Google OAuth
router.post('/google', authController.googleAuth);

// Get current user
router.get('/me', verifyToken, authController.getCurrentUser);

// Update Profile
router.put('/update-profile', verifyToken, authController.updateProfile);

// Password Reset Flow
// Use apiLimiter instead of authLimiter for password reset (less restrictive)
router.post('/forgot-password', apiLimiter, authController.forgotPassword);
router.post('/reset-password', apiLimiter, authController.resetPassword);

module.exports = router;