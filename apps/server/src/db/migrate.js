import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "..", "..");
const repoRoot = path.resolve(serverRoot, "..", "..");

dotenv.config({ path: path.join(repoRoot, ".env"), quiet: true });
dotenv.config({ path: path.join(serverRoot, ".env"), override: true, quiet: true });

const databaseDriver = process.env.DATABASE_DRIVER || (process.env.DATABASE_URL ? "postgres" : "json");

if (databaseDriver !== "postgres") {
  console.log("db migrate skipped: DATABASE_DRIVER is not postgres");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required when DATABASE_DRIVER=postgres");
  process.exit(1);
}

const { Pool } = await import("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  application_name: "vibe-share-migrate"
});

const migrationsDir = path.join(serverRoot, "migrations");
const files = (await fs.readdir(migrationsDir))
  .filter((file) => file.endsWith(".sql"))
  .sort();

try {
  await pool.query("begin");
  await pool.query("create table if not exists schema_migrations (id text primary key, applied_at timestamptz not null default now())");

  for (const file of files) {
    const id = file.replace(/\.sql$/u, "");
    const existing = await pool.query("select id from schema_migrations where id = $1", [id]);
    if (existing.rowCount > 0) {
      console.log(`migration already applied: ${id}`);
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    await pool.query(sql);
    await pool.query("insert into schema_migrations (id) values ($1) on conflict do nothing", [id]);
    console.log(`migration applied: ${id}`);
  }

  await pool.query("commit");
  console.log("db migrate ok");
} catch (error) {
  await pool.query("rollback").catch(() => {});
  console.error("db migrate failed");
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
