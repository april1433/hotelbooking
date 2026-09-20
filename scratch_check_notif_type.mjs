import pg from 'pg';
const conn = 'postgresql://postgres.sfmzelhjgidhgafmyvrm:jay%40gmail.com@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
async function run() {
  const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query(`
    SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'notification_type'
  `);
  console.log("notification_type enum values:", res.rows.map(r=>r.enumlabel));
  await client.end();
}
run().catch(console.error);
