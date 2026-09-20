import pg from 'pg';

const connectionString = 'postgresql://postgres.sfmzelhjgidhgafmyvrm:jay%40gmail.com@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function checkColumns() {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    
    // Check reservations columns
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'reservations'
    `);
    console.log("public.reservations columns:");
    res.rows.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

checkColumns();
