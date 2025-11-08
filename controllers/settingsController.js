// ==================== SETTINGS CONTROLLER ====================
const db = require('../config/db');

// Get store hours
exports.getStoreHours = async (req, res) => {
  try {
    // Check if table exists, if not create it
    await ensureStoreHoursTable();
    
    const [hours] = await db.query('SELECT * FROM store_hours ORDER BY day_of_week');
    
    // If no hours exist, return default hours
    if (hours.length === 0) {
      const defaultHours = getDefaultStoreHours();
      res.json({
        success: true,
        hours: defaultHours
      });
      return;
    }
    
    // Convert is_open from 1/0 to boolean
    const formattedHours = hours.map(hour => ({
      ...hour,
      is_open: hour.is_open === 1 || hour.is_open === true
    }));
    
    res.json({
      success: true,
      hours: formattedHours
    });
  } catch (error) {
    console.error('Error getting store hours:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get store hours',
      error: error.message
    });
  }
};

// Update store hours
exports.updateStoreHours = async (req, res) => {
  try {
    await ensureStoreHoursTable();
    
    const { hours } = req.body;
    
    if (!hours || !Array.isArray(hours)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hours data'
      });
    }
    
    // Delete existing hours
    await db.query('DELETE FROM store_hours');
    
    // Insert new hours
    for (const hour of hours) {
      await db.query(
        'INSERT INTO store_hours (day_of_week, day_name, is_open, open_time, close_time) VALUES (?, ?, ?, ?, ?)',
        [
          hour.day_of_week,
          hour.day_name,
          hour.is_open ? 1 : 0,
          hour.open_time || null,
          hour.close_time || null
        ]
      );
    }
    
    res.json({
      success: true,
      message: 'Store hours updated successfully'
    });
  } catch (error) {
    console.error('Error updating store hours:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update store hours',
      error: error.message
    });
  }
};

// Ensure store_hours table exists
async function ensureStoreHoursTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS store_hours (
        id INT AUTO_INCREMENT PRIMARY KEY,
        day_of_week INT NOT NULL UNIQUE,
        day_name VARCHAR(20) NOT NULL,
        is_open TINYINT(1) DEFAULT 1,
        open_time TIME,
        close_time TIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Check if table is empty and populate with defaults
    const [existing] = await db.query('SELECT COUNT(*) as count FROM store_hours');
    if (existing[0].count === 0) {
      const defaultHours = getDefaultStoreHours();
      for (const hour of defaultHours) {
        await db.query(
          'INSERT INTO store_hours (day_of_week, day_name, is_open, open_time, close_time) VALUES (?, ?, ?, ?, ?)',
          [
            hour.day_of_week,
            hour.day_name,
            hour.is_open ? 1 : 0,
            hour.open_time || null,
            hour.close_time || null
          ]
        );
      }
    }
  } catch (error) {
    console.error('Error ensuring store_hours table:', error);
    throw error;
  }
}

// Get default store hours (Monday-Saturday, 11:00-15:00)
function getDefaultStoreHours() {
  return [
    { day_of_week: 0, day_name: 'Sunday', is_open: false, open_time: null, close_time: null },
    { day_of_week: 1, day_name: 'Monday', is_open: true, open_time: '11:00:00', close_time: '15:00:00' },
    { day_of_week: 2, day_name: 'Tuesday', is_open: true, open_time: '11:00:00', close_time: '15:00:00' },
    { day_of_week: 3, day_name: 'Wednesday', is_open: true, open_time: '11:00:00', close_time: '15:00:00' },
    { day_of_week: 4, day_name: 'Thursday', is_open: true, open_time: '11:00:00', close_time: '15:00:00' },
    { day_of_week: 5, day_name: 'Friday', is_open: true, open_time: '11:00:00', close_time: '15:00:00' },
    { day_of_week: 6, day_name: 'Saturday', is_open: true, open_time: '11:00:00', close_time: '15:00:00' }
  ];
}

