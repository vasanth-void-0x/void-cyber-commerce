const Database = require('better-sqlite3');
const path = require('path');

const isServerless = Boolean(process.env.VERCEL);
const databasePath = isServerless
  ? path.join('/tmp', 'voidstore.sqlite')
  : path.join(__dirname, 'voidstore.sqlite');

const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
