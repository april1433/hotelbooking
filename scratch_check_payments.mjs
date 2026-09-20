import pg from 'pg';
const conn = 'postgresql://postgres.sfmzelhjgidhgafmyvrm:jay%40gmail.com@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
async function run() {
  const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query(`
    SELECT * FROM public.payments WHERE reservation_id = '483693ab-2648-43e0-9fb1-fe215eee45ac'
  `);
  console.log("payments for reservation CONF-VUYDTD8L:", JSON.stringify(res.rows, null, 2));
  await client.end();
}
run().catch(console.error);
