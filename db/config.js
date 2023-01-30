const SQLite = require('sqlite3');

const config = {
  database: 'kiosk-server',
  username: 'root',
  password: 'root',
  dialect: 'sqlite',
  storage: 'db/files/main.db',
  dialectOptions: {
    mode: SQLite.OPEN_READWRITE | SQLite.OPEN_CREATE | SQLite.OPEN_FULLMUTEX,
  },
};

module.exports = config;
