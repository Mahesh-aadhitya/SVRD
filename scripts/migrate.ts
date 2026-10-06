// Applies pending supabase/migrations/*.sql files in filename order, each in
// its own transaction, and records them in public._migrations so a file is
// never applied twice.
//
//   npm run db:migrate              apply pending migrations
//   npm run db:migrate -- --status  list applied / pending, change nothing
//
// Needs DATABASE_URL in .env.local: Supabase Dashboard → Connect → Session
// pooler connection string, with the database password filled in.

import { readdirSync, readFileSync } from "fs";
import path from "path";
import { Client } from "pg";

const MIGRATIONS_DIR = path.resolve("supabase/migrations");

// Files applied by hand in the SQL editor before this runner existed. On the
// first run they're recorded as applied (not re-run) if the database already
// has their last change.
const PRE_RUNNER_FILES = [
  "0001_init.sql",
  "0002_content_folders.sql",
  "0003_seva_release_window.sql",
  "0004_temple_info_and_bookings.sql",
  "0005_categories_everywhere.sql",
  "0006_notices.sql",
  "0007_seva_release_patterns.sql",
  "0008_seva_time_slots.sql",
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set — add the Supabase session pooler connection string to .env.local.");
    process.exit(1);
  }
  const statusOnly = process.argv.includes("--status");

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(`
      create table if not exists public._migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      );
      alter table public._migrations enable row level security;
    `);

    const { rows: appliedRows } = await client.query<{ name: string }>("select name from public._migrations");
    const applied = new Set(appliedRows.map((r) => r.name));

    if (applied.size === 0) {
      const { rows } = await client.query<{ exists: boolean }>(
        "select to_regclass('public.seva_slots') is not null as exists",
      );
      if (rows[0].exists) {
        for (const name of PRE_RUNNER_FILES) {
          await client.query("insert into public._migrations (name) values ($1) on conflict do nothing", [name]);
          applied.add(name);
        }
        console.log(`Recorded ${PRE_RUNNER_FILES.length} previously hand-applied migrations.`);
      }
    }

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    const pending = files.filter((f) => !applied.has(f));

    if (statusOnly) {
      for (const f of files) console.log(`${applied.has(f) ? "applied" : "PENDING"}  ${f}`);
      return;
    }
    if (pending.length === 0) {
      console.log("Database is up to date.");
      return;
    }

    for (const file of pending) {
      const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      process.stdout.write(`Applying ${file} … `);
      try {
        await client.query("begin");
        await client.query(sql);
        await client.query("insert into public._migrations (name) values ($1)", [file]);
        // Tell PostgREST (the Supabase API) to pick up new tables/columns now.
        await client.query("notify pgrst, 'reload schema'");
        await client.query("commit");
        console.log("done");
      } catch (error) {
        await client.query("rollback");
        console.log("FAILED");
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
