const dbJson = require('./db/db-json');
const dbMysql = require('./db/db-mysql');

// Detect database engine from environment
const isMysql = process.env.DB_TYPE === 'mysql';

console.log(`WET360 Platform initializing with Database Engine: ${isMysql ? 'MySQL' : 'Local JSON'}`);

const activeDb = isMysql ? dbMysql : {
  getAll: async (table) => {
    return dbJson.getAll(table);
  },

  getById: async (table, id) => {
    return dbJson.getById(table, id);
  },

  create: async (table, item) => {
    return dbJson.create(table, item);
  },

  update: async (table, id, updates) => {
    return dbJson.update(table, id, updates);
  },

  delete: async (table, id) => {
    return dbJson.delete(table, id);
  },

  query: async (table, filterFn) => {
    return dbJson.query(table, filterFn);
  }
};

module.exports = activeDb;
