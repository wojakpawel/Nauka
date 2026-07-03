const fs = require("fs");
const path = require("path");
const pg = require("pg");

require("dotenv").config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://learning:learning@127.0.0.1:5432/learning";

async function migrate() {
  const client = new pg.Client({ connectionString });
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");

  try {
    await client.connect();
    await client.query(schema);
    console.log("Database migration completed.");
  } finally {
    await client.end();
  }
}

migrate().catch((error) => {
  console.error("Migration failed:", error.message || error);

  if (error.code === "ECONNREFUSED") {
    console.error(
      "\nPostgreSQL is not running. Start the full dev stack with:\n  npm run dev:all",
    );
    console.error("\nOr start only the database with:\n  npm run db:start");
  }

  process.exit(1);
});
