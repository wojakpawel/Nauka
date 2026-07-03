const pg = require("pg");

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://learning:learning@127.0.0.1:5432/learning",
});

module.exports = pool;
