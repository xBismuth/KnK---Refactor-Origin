// ==================== MENU CONTROLLER ====================
const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// Get public menu
exports.getPublicMenu = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, slug, description, price, image_url, 
              is_featured, category, badge 
       FROM menu_items 
       WHERE is_active = TRUE 
       ORDER BY is_featured DESC, name ASC`
    );
    
    res.json({ success: true, items: rows });
  } catch (error) {
    console.error('❌ Get menu error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch menu items' 
    });
  }
};

// Get all menu items (Admin)
exports.getAllMenuItems = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, slug, description, price, image_url, 
              is_featured, is_active, category, badge, 
              created_at, updated_at 
       FROM menu_items 
       ORDER BY created_at DESC`
    );
    
    res.json({ success: true, items: rows });
  } catch (error) {
    console.error('❌ Get admin menu error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch menu items' 
    });
  }
};

// Create menu item (Admin)
exports.createMenuItem = async (req, res) => {
  try {
    console.log('📝 Create menu item request received');
    console.log('📦 Request body:', req.body);
    
    const { 
      name, 
      description, 
      price, 
      image_url, 
      category, 
      badge,
      is_featured, 
      is_active 
    } = req.body;
    
    const io = req.app.get('socketio');

    if (!name || price === undefined || price === null || price === '') {
      console.error('❌ Validation failed: Name or price missing');
      return res.status(400).json({ 
        success: false, 
        message: 'Name and price are required' 
      });
    }

    // Validate and sanitize price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || !isFinite(priceNum) || priceNum < 0) {
      console.error('❌ Validation failed: Invalid price value', price);
      return res.status(400).json({ 
        success: false, 
        message: 'Price must be a valid positive number' 
      });
    }

    // Round to 2 decimal places to match typical DECIMAL(10,2) column
    const sanitizedPrice = Math.round(priceNum * 100) / 100;

    const slug = name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    console.log('💾 Inserting menu item into database...');
    console.log('💰 Sanitized price:', sanitizedPrice);
    const [result] = await db.query(
      `INSERT INTO menu_items 
       (name, slug, description, price, image_url, category, badge, is_featured, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name,
        slug,
        description || null,
        sanitizedPrice,
        image_url || null,
        category || 'main',
        badge || null,
        is_featured ? 1 : 0,
        is_active !== false ? 1 : 0
      ]
    );

    console.log('✅ Menu item created with ID:', result.insertId);

    if (io) {
      io.emit('menu-updated', { 
        action: 'created', 
        itemId: result.insertId,
        item: { id: result.insertId, name, price, is_featured, is_active }
      });
      console.log('📢 Socket.IO event emitted');
    } else {
      console.warn('⚠️ Socket.IO not available');
    }

    res.json({ 
      success: true, 
      message: 'Menu item created successfully',
      itemId: result.insertId 
    });

  } catch (error) {
    console.error('❌ Create menu item error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: 'An item with a similar name already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create menu item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update menu item (Admin)
exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = [];
    const values = [];
    const io = req.app.get('socketio');

    const allowedFields = ['name', 'description', 'price', 'image_url', 'category', 'badge', 'is_featured', 'is_active'];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'name') {
          updates.push('name = ?', 'slug = ?');
          values.push(req.body[field].trim());
          const slug = req.body[field].toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
          values.push(slug);
        } else if (field === 'price') {
          // Validate and sanitize price
          const priceNum = parseFloat(req.body[field]);
          if (isNaN(priceNum) || !isFinite(priceNum) || priceNum < 0) {
            return res.status(400).json({ 
              success: false, 
              message: 'Price must be a valid positive number' 
            });
          }
          // Round to 2 decimal places to match typical DECIMAL(10,2) column
          const sanitizedPrice = Math.round(priceNum * 100) / 100;
          updates.push('price = ?');
          values.push(sanitizedPrice);
        } else if (field === 'is_featured' || field === 'is_active') {
          updates.push(`${field} = ?`);
          values.push(req.body[field] ? 1 : 0);
        } else {
          updates.push(`${field} = ?`);
          values.push(req.body[field] || null);
        }
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid fields to update' 
      });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const [result] = await db.query(
      `UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Menu item not found' 
      });
    }

    io.emit('menu-updated', { 
      action: 'updated', 
      itemId: id,
      updates: req.body
    });

    res.json({ 
      success: true, 
      message: 'Menu item updated successfully',
      changes: result.changedRows
    });

  } catch (error) {
    console.error('❌ Update menu item error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update menu item'
    });
  }
};

// Delete menu item (Admin)
exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const io = req.app.get('socketio');

    const [existing] = await db.query(
      'SELECT id, name, image_url FROM menu_items WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Menu item not found' 
      });
    }

    const item = existing[0];

    if (item.image_url) {
      const imagePath = path.join(__dirname, '../public', item.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await db.query('DELETE FROM menu_items WHERE id = ?', [id]);

    io.emit('menu-updated', { 
      action: 'deleted', 
      itemId: id,
      itemName: item.name
    });

    res.json({ 
      success: true, 
      message: 'Menu item deleted successfully' 
    });

  } catch (error) {
    console.error('❌ Delete menu item error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete menu item' 
    });
  }
};

// Upload menu image (Admin)
exports.uploadMenuImage = async (req, res) => {
  try {
    console.log('📤 Upload request received');
    console.log('📁 File:', req.file ? req.file.filename : 'No file');
    console.log('📝 Body:', req.body);
    
    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }

    const imageUrl = `/assets/images/menu/${req.file.filename}`;
    console.log('✅ Image uploaded successfully:', imageUrl);

    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      message: 'Image uploaded successfully' 
    });

  } catch (error) {
    console.error('❌ Image upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload image',
      error: error.message 
    });
  }
};

module.exports = exports;