import pg from 'pg';
const conn = 'postgresql://postgres.sfmzelhjgidhgafmyvrm:jay%40gmail.com@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
async function run() {
  const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query(`
    SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications'
  `);
  console.log("notifications columns:", res.rows.map(r=>r.column_name).join(", "));
  
  const sample = await client.query(`SELECT * FROM public.notifications LIMIT 2`);
  console.log("notifications data:", JSON.stringify(sample.rows));
  await client.end();
}
run().catch(console.error);
