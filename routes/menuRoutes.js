// ==================== MENU ROUTES ====================
const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const { upload } = require('../config/multer');

// Public menu route
router.get('/menu', menuController.getPublicMenu);

// Admin menu routes
router.get('/admin/menu', verifyToken, verifyAdmin, menuController.getAllMenuItems);
router.post('/admin/menu', verifyToken, verifyAdmin, menuController.createMenuItem);
router.patch('/admin/menu/:id', verifyToken, verifyAdmin, menuController.updateMenuItem);
router.delete('/admin/menu/:id', verifyToken, verifyAdmin, menuController.deleteMenuItem);
router.post('/admin/menu/upload-image', verifyToken, verifyAdmin, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false, 
          message: 'File too large. Maximum size is 5MB.' 
        });
      }
      if (err.message === 'Only image files are allowed!') {
        return res.status(400).json({ 
          success: false, 
          message: 'Only image files are allowed!' 
        });
      }
      return res.status(400).json({ 
        success: false, 
        message: 'File upload error: ' + err.message 
      });
    }
    next();
  });
}, menuController.uploadMenuImage);

module.exports = router;