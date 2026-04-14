const mysql = require('mysql2/promise')
require('dotenv').config()

// Create connection pool (better than single connection)
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'solar_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+05:30', // IST
})

// Test connection on startup
async function testConnection() {
  try {
    const conn = await pool.getConnection()
    console.log('✅ MySQL Connected — Database:', process.env.DB_NAME)
    conn.release()
  } catch (err) {
    console.error('❌ MySQL Connection Failed:', err.message)
    process.exit(1)
  }
}
testConnection()

module.exports = pool
