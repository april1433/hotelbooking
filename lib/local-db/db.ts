import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
import path from "path";
import { seedDatabase } from "./seed";

let globalDb: PGlite | null = null;
let initPromise: Promise<PGlite> | null = null;

function splitSqlQueries(sql: string): string[] {
  const queries: string[] = [];
  let currentQuery = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inComment = false;
  let inMultiLineComment = false;
  let dollarQuoteTag: string | null = null;

  let i = 0;
  while (i < sql.length) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    if (inComment) {
      if (char === "\n" || char === "\r") inComment = false;
      currentQuery += char;
      i++;
      continue;
    }

    if (inMultiLineComment) {
      if (char === "*" && nextChar === "/") {
        inMultiLineComment = false;
        currentQuery += "*/";
        i += 2;
        continue;
      }
      currentQuery += char;
      i++;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !dollarQuoteTag) {
      if (char === "-" && nextChar === "-") {
        inComment = true;
        currentQuery += "--";
        i += 2;
        continue;
      }
      if (char === "/" && nextChar === "*") {
        inMultiLineComment = true;
        currentQuery += "/*";
        i += 2;
        continue;
      }
    }

    if (char === "$" && !inSingleQuote && !inDoubleQuote) {
      if (dollarQuoteTag) {
        if (sql.substring(i, i + dollarQuoteTag.length) === dollarQuoteTag) {
          currentQuery += dollarQuoteTag;
          i += dollarQuoteTag.length;
          dollarQuoteTag = null;
          continue;
        }
      } else {
        const match = sql.substring(i).match(/^(\$[a-zA-Z0-9_]*\$)/);
        if (match) {
          dollarQuoteTag = match[1];
          currentQuery += dollarQuoteTag;
          i += dollarQuoteTag.length;
          continue;
        }
      }
    }

    if (dollarQuoteTag) {
      currentQuery += char;
      i++;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      if (char === "'" && sql[i - 1] === "\\") {
        // escaped
      } else {
        inSingleQuote = !inSingleQuote;
      }
      currentQuery += char;
      i++;
      continue;
    }

    if (inSingleQuote) {
      currentQuery += char;
      i++;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      currentQuery += char;
      i++;
      continue;
    }

    if (inDoubleQuote) {
      currentQuery += char;
      i++;
      continue;
    }

    if (char === ";") {
      queries.push(currentQuery.trim() + ";");
      currentQuery = "";
    } else {
      currentQuery += char;
    }
    i++;
  }

  if (currentQuery.trim()) {
    queries.push(currentQuery.trim());
  }

  return queries;
}

export async function getLocalDb(): Promise<PGlite> {
  if (globalDb) return globalDb;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    console.log("⚡ [Local DB] Initializing local PGlite database...");
    
    const dbPath = path.resolve("./local-db-data");
    const db = new PGlite(dbPath);

    try {
      // 1. Ensure auth schema and auth.users exist
      const authSetup = `
        CREATE SCHEMA IF NOT EXISTS auth;
        CREATE TABLE IF NOT EXISTS auth.users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE,
          encrypted_password VARCHAR(255),
          email_confirmed_at TIMESTAMPTZ DEFAULT NOW(),
          raw_app_meta_data JSONB DEFAULT '{}'::jsonb,
          raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      await db.exec(authSetup);

      // 2. Check if profiles table exists
      const checkTables = await db.query<{ count: string }>(
        "SELECT count(*) FROM information_schema.tables WHERE table_name = 'profiles';"
      );

      if (parseInt(checkTables.rows[0]?.count ?? "0", 10) === 0) {
        console.log("⚡ [Local DB] Applying database schema.sql...");
        const schemaPath = path.resolve("database/schema.sql");
        if (fs.existsSync(schemaPath)) {
          let sql = fs.readFileSync(schemaPath, "utf8");
          sql = sql.replace(/CREATE EXTENSION[^\n]*;/gi, "-- extension skipped");
          sql = sql.replace(/uuid_generate_v4\(\)/gi, "gen_random_uuid()");
          
          const statements = splitSqlQueries(sql)
            .map((s) => s.trim())
            .filter((s) => s.replace(/^(--[^\n]*\n*)+/, "").trim().length > 0);

          for (const stmt of statements) {
            try {
              await db.exec(stmt);
            } catch (err: any) {
              if (!err.message?.includes("already exists") && !err.message?.includes("duplicate")) {
                console.warn(`⚠️ [Local DB] Schema statement warning:`, err.message);
              }
            }
          }
          console.log("✅ [Local DB] Schema applied successfully.");
        }
      }

      // 3. Seed initial database data if profiles is empty or hotels count < 6
      const checkHotels = await db.query<{ count: string }>("SELECT count(*) FROM hotels;");
      const hotelCount = parseInt(checkHotels.rows[0]?.count ?? "0", 10);
      const checkProfiles = await db.query<{ count: string }>("SELECT count(*) FROM profiles;");
      const profileCount = parseInt(checkProfiles.rows[0]?.count ?? "0", 10);

      if (hotelCount < 6 || profileCount === 0) {
        console.log(`⚡ [Local DB] Seeding/Updating hotel data (hotels: ${hotelCount}, profiles: ${profileCount})...`);
        await seedDatabase(db);
        console.log("✅ [Local DB] Seed data inserted/updated.");
      }

      globalDb = db;
      return db;
    } catch (err: any) {
      console.error("❌ [Local DB] Failed to initialize PGlite:", err.message ?? err);
      throw err;
    }
  })();

  return initPromise;
}
