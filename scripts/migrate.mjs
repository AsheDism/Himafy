import postgres from "postgres";
import fs from "fs/promises";
import path from "path";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set in .env");
    process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function migrate() {
    console.log("🚀 Starting database migrations...");

    // Create migrations table if not exists
    await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

    const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();

    for (const file of sqlFiles) {
        const [existing] = await sql`
      SELECT name FROM _migrations WHERE name = ${file}
    `;

        if (existing) {
            // console.log(`⏩ Skipping ${file} (already executed)`);
            continue;
        }

        console.log(`📑 Executing migration: ${file}`);
        const content = await fs.readFile(path.join(migrationsDir, file), "utf8");

        try {
            await sql.begin(async (sql) => {
                await sql.unsafe(content);
                await sql`INSERT INTO _migrations (name) VALUES (${file})`;
            });
            console.log(`✅ Successfully executed ${file}`);
        } catch (err) {
            console.error(`❌ Error executing ${file}:`, err);
            process.exit(1);
        }
    }

    console.log("✨ All migrations completed.");
    await sql.end();
}

migrate().catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
