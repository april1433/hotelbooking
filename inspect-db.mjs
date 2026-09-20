import pg from "pg";

const DB_URL =
  "postgresql://postgres.sfmzelhjgidhgafmyvrm:jay%40gmail.com@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function main() {
  const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log("Tables in public schema:");
    if (res.rows.length === 0) {
      console.log(" (no tables found)");
    } else {
      for (const r of res.rows) {
        const countRes = await client.query(`SELECT COUNT(*) FROM "${r.table_name}"`);
        console.log(` - ${r.table_name}: ${countRes.rows[0].count} rows`);
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

main();
