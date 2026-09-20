import pg from 'pg';
const conn = 'postgresql://postgres.sfmzelhjgidhgafmyvrm:jay%40gmail.com@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
async function run() {
  const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query(`
    SELECT r.id, r.confirmation_number, r.status, p.email, r.profile_id
    FROM public.reservations r
    LEFT JOIN public.profiles p ON r.profile_id = p.id
  `);
  console.log("Reservations status and guest emails:");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run().catch(console.error);
