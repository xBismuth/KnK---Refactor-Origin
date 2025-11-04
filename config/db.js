// ==================== DATABASE CONNECTION ====================
const mysql = require('mysql2/promise');
require('dotenv').config();

// Support both standard and Railway variable names
const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQLDATABASE_HOST || process.env.MYSQL_HOST || 'localhost',
  user: process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER || 'root',
  password: process.env.DB_PASS || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'kusina_db',
  port: process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Parse MYSQL_URL if provided (Railway format: mysql://user:pass@host:port/db)
if (process.env.MYSQL_URL) {
  try {
    const url = new URL(process.env.MYSQL_URL);
    dbConfig.host = url.hostname;
    dbConfig.port = parseInt(url.port) || 3306;
    dbConfig.user = url.username;
    dbConfig.password = url.password;
    dbConfig.database = url.pathname.replace('/', '');
  } catch (err) {
    console.warn('⚠️ Failed to parse MYSQL_URL, using individual variables');
  }
}

const db = mysql.createPool(dbConfig);

// Test database connection
db.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = db;