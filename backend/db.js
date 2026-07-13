const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    const connection = await db.getConnection();
    console.log('Connected to MySQL database!');
    connection.release();
  } catch (err) {
    console.error('Database connection failed:', err);
  }
})();

module.exports = db;