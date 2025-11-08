// ==================== SETTINGS ROUTES ====================
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Get store hours (public endpoint)
router.get('/store-hours', settingsController.getStoreHours);

// Update store hours (admin only)
router.put('/admin/store-hours', verifyToken, verifyAdmin, settingsController.updateStoreHours);

module.exports = router;

