require('dotenv').config();
const { Pool } = require('pg');

const { types } = require('pg');

// Forcer les types NUMERIC et FLOAT à être renvoyés comme des nombres natifs
types.setTypeParser(1700, (value) => parseFloat(value)); // 1700 = NUMERIC
types.setTypeParser(701, (value) => parseFloat(value)); // 701 = FLOAT8 (Double precision)


const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const query = (text, params) => pool.query(text, params);

module.exports = { query };
