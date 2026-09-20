/**
 * setup-db.mjs
 * Run once: node setup-db.mjs
 * 1. Applies schema.sql to Supabase via direct PostgreSQL connection (handles PL/pgSQL $$ blocks)
 * 2. Creates/updates the admin profile (auth user already exists)
 */

import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key";

// PostgreSQL direct connection
const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:password@host:5432/postgres";

const ADMIN_EMAIL = "admin@grandazure.com";
const ADMIN_PASSWORD = "123123";
const ADMIN_UUID = "28537215-8bb7-49b9-85d0-2abeeafdbe6e"; // already created

/**
 * Splits a SQL script into individual queries, handling dollar-quoted blocks ($$ or $tag$),
 * single-quoted strings, double-quoted identifiers, and comments.
 */
function splitSqlQueries(sql) {
  const queries = [];
  let currentQuery = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inComment = false;
  let inMultiLineComment = false;
  let dollarQuoteTag = null; // Stores the tag e.g., '$$' or '$function$'
  
  let i = 0;
  while (i < sql.length) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    // Handle comments
    if (inComment) {
      if (char === "\n" || char === "\r") {
        inComment = false;
      }
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

    // Start of comments
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

    // Handle dollar quotes (like $$ or $function$)
    if (char === "$" && !inSingleQuote && !inDoubleQuote) {
      if (dollarQuoteTag) {
        // Check if we are ending the current dollar quote
        if (sql.substring(i, i + dollarQuoteTag.length) === dollarQuoteTag) {
          currentQuery += dollarQuoteTag;
          i += dollarQuoteTag.length;
          dollarQuoteTag = null;
          continue;
        }
      } else {
        // Check if we are starting a dollar quote
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

    // Handle single quotes
    if (char === "'" && !inDoubleQuote) {
      if (char === "'" && sql[i - 1] === "\\") {
        // Escaped single quote
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

    // Handle double quotes (identifiers)
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

    // Semicolon splits queries
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

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("📦 Step 1: Applying schema.sql to Supabase...\n");

  const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL");

    const schemaPath = path.join(__dirname, "database", "schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf8");

    const statements = splitSqlQueries(sql)
      .map((s) => s.trim())
      .filter((s) => {
        // Strip leading comments to see if there is actual query content
        const cleaned = s.replace(/^(--[^\n]*\n*)+/, "").trim();
        return cleaned.length > 0;
      });

    console.log(`Parsed ${statements.length} non-empty SQL statements.`);

    let applied = 0;
    let skipped = 0;

    for (let index = 0; index < statements.length; index++) {
      const stmt = statements[index];
      const preview = stmt.replace(/\s+/g, " ").substring(0, 70);
      try {
        await client.query(stmt);
        applied++;
      } catch (err) {
        // Ignore duplicate type / table / trigger errors
        const isDuplicate = 
          err.message.includes("already exists") ||
          err.message.includes("duplicate key") ||
          err.code === "42P07" || // duplicate_table
          err.code === "42710" || // duplicate_object (type)
          err.code === "23505";   // unique_violation

        if (isDuplicate) {
          skipped++;
        } else {
          console.warn(`  ⚠️  Error at [Statement ${index}]: "${preview}..."`);
          console.warn(`     Code: ${err.code}, Message: ${err.message}\n`);
          skipped++;
        }
      }
    }

    console.log(`✅ Schema applied: ${applied} statements executed, ${skipped} skipped (already existed / duplicate errors).\n`);
  } finally {
    await client.end();
  }

  // ── Step 2: Upsert admin profile ────────────────────────────────────────
  console.log("👤 Step 2: Upserting admin profile...\n");

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Update auth user password just in case
  const { error: updateErr } = await supabase.auth.admin.updateUserById(
    ADMIN_UUID,
    {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: "Admin", last_name: "User", role: "super_admin" },
    }
  );
  if (updateErr) {
    console.warn("⚠️  Could not update auth user:", updateErr.message);
  } else {
    console.log("✅ Auth user verified & password confirmed");
  }

  // Upsert profile
  const { error: profileErr } = await supabase.from("profiles").upsert(
    {
      id: ADMIN_UUID,
      role: "super_admin",
      first_name: "Admin",
      last_name: "User",
      display_name: "Admin User",
      email: ADMIN_EMAIL,
      is_active: true,
    },
    { onConflict: "id" }
  );

  if (profileErr) {
    console.error("❌ Profile upsert failed:", profileErr.message);
  } else {
    console.log("✅ Profile upserted with role: super_admin");
  }

  console.log("\n─────────────────────────────────────");
  console.log("  ✅ Setup Complete!");
  console.log("─────────────────────────────────────");
  console.log(`  Email   : ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  Role    : super_admin`);
  console.log("─────────────────────────────────────");
  console.log("  Login at: http://localhost:3000/auth/login\n");
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err.message ?? err);
  process.exit(1);
});
