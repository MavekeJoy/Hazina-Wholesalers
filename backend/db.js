const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "hazina_inventory",
  password: "hazina123",
  port: 5432
});

module.exports = pool;