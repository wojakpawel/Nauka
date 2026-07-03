import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import EmbeddedPostgres from "embedded-postgres";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://learning:learning@127.0.0.1:5432/learning";

const databaseDir = path.join(rootDir, "data", "pg");
const embeddedConfig = {
  databaseDir,
  port: 5432,
  user: "learning",
  password: "learning",
  persistent: true,
  onLog: () => {},
  onError: (error) => console.error(error),
};

async function canConnect() {
  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
    await client.end();
    return true;
  } catch {
    return false;
  }
}

async function startEmbeddedPostgres() {
  fs.mkdirSync(databaseDir, { recursive: true });

  const embedded = new EmbeddedPostgres(embeddedConfig);
  const needsInit = !fs.existsSync(path.join(databaseDir, "PG_VERSION"));

  if (needsInit) {
    console.log("Initializing embedded PostgreSQL (first run only)...");
    await embedded.initialise();
  }

  console.log("Starting embedded PostgreSQL on port 5432...");
  await embedded.start();

  const adminClient = embedded.getPgClient("postgres");
  await adminClient.connect();

  try {
    const dbCheck = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      ["learning"],
    );

    if (dbCheck.rowCount === 0) {
      await adminClient.query("CREATE DATABASE learning");
    }
  } finally {
    await adminClient.end();
  }

  console.log("Embedded PostgreSQL is ready.");
  return embedded;
}

async function main() {
  if (await canConnect()) {
    console.log("PostgreSQL is already running.");
    return;
  }

  const embedded = await startEmbeddedPostgres();

  const shutdown = async () => {
    await embedded.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Keep Node alive while embedded PostgreSQL runs.
  await new Promise(() => {});
}

main().catch((error) => {
  console.error("Failed to start PostgreSQL:", error.message);
  console.error(
    "\nIf this is your first run, approve install scripts then retry:",
  );
  console.error("  npm approve-scripts --allow-scripts-pending");
  console.error("\nOr start Docker Desktop and run: docker compose up -d");
  process.exit(1);
});
