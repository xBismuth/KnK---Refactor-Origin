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
  connectionLimit: 5, // Reduced for Railway stability
  queueLimit: 0,
  // Connection timeout settings
  connectTimeout: 10000, // 10 seconds
  acquireTimeout: 10000, // 10 seconds
  timeout: 60000, // 60 seconds query timeout
  // Keep connections alive
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Reconnect on connection loss
  reconnect: true,
  // Close idle connections after 1 hour (increased to prevent premature closure)
  idleTimeout: 3600000, // 1 hour
  // Multiple statements (disabled for security)
  multipleStatements: false
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

// Handle pool errors and keep connections alive
db.on('connection', (connection) => {
  console.log(`🔌 New MySQL connection established: ${connection.threadId}`);
  
  connection.on('error', (err) => {
    console.error('❌ MySQL connection error:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
      console.log('🔄 Attempting to reconnect...');
    }
  });
});

// Set up periodic keep-alive query at pool level (every 4 minutes to prevent timeout)
// MySQL wait_timeout is typically 8 hours, but we ping every 4 minutes to be safe
const keepAliveInterval = setInterval(async () => {
  try {
    await db.query('SELECT 1');
    // Connection pool is alive - silently succeed
  } catch (err) {
    console.error('❌ MySQL keep-alive query failed:', err.message);
  }
}, 4 * 60 * 1000); // 4 minutes

// Handle pool errors
db.on('error', (err) => {
  console.error('❌ MySQL pool error:', err.message);
});

// Test database connection with proper cleanup
db.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('Full error:', err);
  });

// Graceful shutdown handler (merged with keep-alive cleanup)
process.on('SIGINT', async () => {
  console.log('\n🛑 Closing database pool...');
  clearInterval(keepAliveInterval);
  try {
    await db.end();
    console.log('✅ Database pool closed gracefully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error closing database pool:', err);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Closing database pool...');
  clearInterval(keepAliveInterval);
  try {
    await db.end();
    console.log('✅ Database pool closed gracefully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error closing database pool:', err);
    process.exit(1);
  }
});

module.exports = db;