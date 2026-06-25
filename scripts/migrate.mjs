import { readFileSync } from "fs";
import { createRequire } from "module";
import pkg from "@next/env";

pkg.loadEnvConfig(process.cwd());

const require = createRequire(import.meta.url);
const postgres = require("postgres");

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const migration = readFileSync(
  new URL("../drizzle/migrations/0000_clever_blizzard.sql", import.meta.url),
  "utf-8"
);

// drizzle migration files use --> statement-breakpoint as delimiter
const statements = migration
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter(Boolean);

console.log("Dropping existing tables...");
await sql.unsafe(`
  DROP TABLE IF EXISTS milestones, campaigns, brands CASCADE;
  DROP TYPE IF EXISTS campaign_status;
`);
console.log("✓ Dropped\n");

console.log(`Applying ${statements.length} statements...`);

for (const statement of statements) {
  await sql.unsafe(statement);
  console.log("✓", statement.slice(0, 60).replace(/\n/g, " "));
}

await sql.end();
console.log("\nMigration complete.");
