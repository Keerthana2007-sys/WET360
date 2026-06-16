const mysql = require('mysql2');

// Environment configurations
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'wet360';

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
  }
  return pool.promise();
}

// Check connection on load
async function testConnection() {
  try {
    const p = getPool();
    await p.query('SELECT 1');
    console.log(`Connected to MySQL database "${DB_NAME}" at ${DB_HOST}:${DB_PORT} successfully.`);
  } catch (err) {
    console.warn('MySQL connection test failed:', err.message);
    console.warn('Please ensure MySQL is running or verify your environment variables.');
  }
}

testConnection();

const dbMysql = {
  getAll: async (table) => {
    try {
      const p = getPool();
      const [rows] = await p.query(`SELECT * FROM \`${table}\``);
      return rows;
    } catch (e) {
      console.error(`MySQL getAll error on table ${table}:`, e);
      return [];
    }
  },

  getById: async (table, id) => {
    try {
      const p = getPool();
      const [rows] = await p.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [parseInt(id)]);
      return rows[0] || null;
    } catch (e) {
      console.error(`MySQL getById error on table ${table}:`, e);
      return null;
    }
  },

  create: async (table, item) => {
    try {
      const p = getPool();
      const keys = Object.keys(item);
      const values = Object.values(item);
      
      const sql = `INSERT INTO \`${table}\` (${keys.map(k => `\`${k}\``).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
      const [result] = await p.query(sql, values);
      
      return { id: result.insertId, ...item };
    } catch (e) {
      console.error(`MySQL create error on table ${table}:`, e);
      throw e;
    }
  },

  update: async (table, id, updates) => {
    try {
      const p = getPool();
      const keys = Object.keys(updates);
      const values = Object.values(updates);
      
      if (keys.length === 0) return dbMysql.getById(table, id);
      
      const sql = `UPDATE \`${table}\` SET ${keys.map(k => `\`${k}\` = ?`).join(', ')} WHERE id = ?`;
      await p.query(sql, [...values, parseInt(id)]);
      
      return dbMysql.getById(table, id);
    } catch (e) {
      console.error(`MySQL update error on table ${table}:`, e);
      throw e;
    }
  },

  delete: async (table, id) => {
    try {
      const p = getPool();
      const [result] = await p.query(`DELETE FROM \`${table}\` WHERE id = ?`, [parseInt(id)]);
      return result.affectedRows > 0;
    } catch (e) {
      console.error(`MySQL delete error on table ${table}:`, e);
      return false;
    }
  },

  query: async (table, filterFn) => {
    try {
      const all = await dbMysql.getAll(table);
      return all.filter(filterFn);
    } catch (e) {
      console.error(`MySQL query error on table ${table}:`, e);
      return [];
    }
  }
};

module.exports = dbMysql;
